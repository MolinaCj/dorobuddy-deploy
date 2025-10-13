-- Stopwatch Sessions Table
-- This table stores stopwatch sessions for optional heatmap integration
CREATE TABLE IF NOT EXISTS stopwatch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  duration_seconds INTEGER NOT NULL, -- Total duration in seconds
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying by user and date
CREATE INDEX IF NOT EXISTS idx_stopwatch_sessions_user_date 
ON stopwatch_sessions(user_id, started_at);

-- Index for task-based queries
CREATE INDEX IF NOT EXISTS idx_stopwatch_sessions_task 
ON stopwatch_sessions(task_id) WHERE task_id IS NOT NULL;

-- RLS (Row Level Security) policies
ALTER TABLE stopwatch_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own stopwatch sessions
CREATE POLICY "Users can view own stopwatch sessions" ON stopwatch_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own stopwatch sessions
CREATE POLICY "Users can insert own stopwatch sessions" ON stopwatch_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own stopwatch sessions
CREATE POLICY "Users can update own stopwatch sessions" ON stopwatch_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own stopwatch sessions
CREATE POLICY "Users can delete own stopwatch sessions" ON stopwatch_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stopwatch_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_stopwatch_sessions_updated_at
  BEFORE UPDATE ON stopwatch_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_stopwatch_sessions_updated_at();

-- Optional: Add stopwatch tracking to daily_stats table
-- This would allow stopwatch time to be included in heatmap calculations
ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS total_stopwatch_time INTEGER DEFAULT 0;

-- Function to aggregate stopwatch time by day
CREATE OR REPLACE FUNCTION get_daily_stopwatch_time(user_uuid UUID, target_date DATE)
RETURNS INTEGER AS $$
DECLARE
  total_seconds INTEGER;
BEGIN
  SELECT COALESCE(SUM(duration_seconds), 0)
  INTO total_seconds
  FROM stopwatch_sessions
  WHERE user_id = user_uuid
    AND DATE(started_at) = target_date;
  
  RETURN total_seconds;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily stats with stopwatch time
CREATE OR REPLACE FUNCTION update_daily_stats_with_stopwatch()
RETURNS TRIGGER AS $$
DECLARE
  session_date DATE;
  existing_stats_id UUID;
BEGIN
  -- Get the date of the session
  session_date := DATE(NEW.started_at);
  
  -- Check if daily stats exist for this date
  SELECT id INTO existing_stats_id
  FROM daily_stats
  WHERE user_id = NEW.user_id AND date = session_date;
  
  IF existing_stats_id IS NOT NULL THEN
    -- Update existing daily stats
    UPDATE daily_stats
    SET total_stopwatch_time = get_daily_stopwatch_time(NEW.user_id, session_date),
        updated_at = NOW()
    WHERE id = existing_stats_id;
  ELSE
    -- Create new daily stats entry
    INSERT INTO daily_stats (
      user_id,
      date,
      total_sessions,
      completed_sessions,
      total_work_time,
      total_break_time,
      total_stopwatch_time,
      tasks_completed,
      intensity_level
    ) VALUES (
      NEW.user_id,
      session_date,
      0, -- total_sessions (pomodoro sessions)
      0, -- completed_sessions (pomodoro sessions)
      0, -- total_work_time (pomodoro work time)
      0, -- total_break_time (pomodoro break time)
      get_daily_stopwatch_time(NEW.user_id, session_date),
      0, -- tasks_completed
      0  -- intensity_level
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update daily stats when stopwatch session is created
CREATE TRIGGER trigger_update_daily_stats_stopwatch
  AFTER INSERT ON stopwatch_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_stats_with_stopwatch();

-- View for stopwatch statistics
CREATE OR REPLACE VIEW stopwatch_stats AS
SELECT 
  user_id,
  DATE(started_at) as date,
  COUNT(*) as total_sessions,
  SUM(duration_seconds) as total_time_seconds,
  AVG(duration_seconds) as avg_session_duration,
  MIN(duration_seconds) as min_session_duration,
  MAX(duration_seconds) as max_session_duration
FROM stopwatch_sessions
GROUP BY user_id, DATE(started_at)
ORDER BY date DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON stopwatch_sessions TO authenticated;
GRANT SELECT ON stopwatch_stats TO authenticated;

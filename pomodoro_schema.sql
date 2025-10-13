-- Pomodoro Sessions and Daily Stats Schema for DoroBuddy
-- Run these commands in your Supabase SQL editor

-- Create pomodoro_sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('work', 'short_break', 'long_break')),
  planned_duration INTEGER NOT NULL, -- in seconds
  actual_duration INTEGER, -- in seconds
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_stats table for heatmap data
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  total_work_time INTEGER DEFAULT 0, -- in seconds
  total_break_time INTEGER DEFAULT 0, -- in seconds
  total_stopwatch_time INTEGER DEFAULT 0, -- in seconds
  tasks_completed INTEGER DEFAULT 0,
  intensity_level INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pomodoro_sessions
CREATE POLICY "Users can view own pomodoro_sessions" ON pomodoro_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pomodoro_sessions" ON pomodoro_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pomodoro_sessions" ON pomodoro_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pomodoro_sessions" ON pomodoro_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for daily_stats
CREATE POLICY "Users can view own daily_stats" ON daily_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily_stats" ON daily_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_stats" ON daily_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_stats" ON daily_stats
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_completed_at ON pomodoro_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_id ON pomodoro_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date);

-- Create updated_at trigger for daily_stats
CREATE TRIGGER update_daily_stats_updated_at 
  BEFORE UPDATE ON daily_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

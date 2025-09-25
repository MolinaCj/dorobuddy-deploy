// src/types/api.ts - Complete API Types for App Router
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

// User Settings Types
export interface UserSettings {
  id: string;
  user_id: string;
  work_duration: number; // seconds
  short_break_duration: number;
  long_break_duration: number;
  sessions_until_long_break: number;
  auto_start_breaks: boolean;
  auto_start_pomodoros: boolean;
  theme: string;
  notification_sound: string;
  break_sound: string;
  master_volume: number; // 0-1
  notification_volume: number;
  music_volume: number;
  ambient_volume: number;
  spotify_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsRequest {
  work_duration?: number;
  short_break_duration?: number;
  long_break_duration?: number;
  sessions_until_long_break?: number;
  auto_start_breaks?: boolean;
  auto_start_pomodoros?: boolean;
  theme?: string;
  notification_sound?: string;
  break_sound?: string;
  master_volume?: number;
  notification_volume?: number;
  music_volume?: number;
  ambient_volume?: number;
  spotify_enabled?: boolean;
}

// Task Types
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: number; // 1-5
  estimated_pomodoros: number;
  completed_pomodoros: number;
  project?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  order_index: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: number;
  estimated_pomodoros?: number;
  project?: string;
  due_date?: string;
  //addition
  completed?: boolean; // <-- Add this
  completed_pomodoros?: number; // <-- Add this
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: number;
  estimated_pomodoros?: number;
  completed_pomodoros?: number;
  project?: string;
  due_date?: string;
  order_index?: number;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

// Pomodoro Session Types
export type SessionType = 'work' | 'short_break' | 'long_break';

export interface PomodoroSession {
  id: string;
  user_id: string;
  task_id?: string;
  session_type: SessionType;
  planned_duration: number; // seconds
  actual_duration?: number;
  completed: boolean;
  started_at: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface StartSessionRequest {
  task_id?: string;
  session_type: SessionType;
  planned_duration: number;
}

export interface UpdateSessionRequest {
  actual_duration?: number;
  completed?: boolean;
  notes?: string;
}

export interface SessionsResponse {
  sessions: PomodoroSession[];
  total: number;
  page: number;
  limit: number;
}

// Heatmap and Statistics Types
export interface DailyStats {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  total_sessions: number;
  completed_sessions: number;
  total_work_time: number; // seconds
  total_break_time: number;
  tasks_completed: number;
  intensity_level: number; // 0-4
  created_at: string;
  updated_at: string;
}

export interface HeatmapData {
  date: string;
  count: number;
  intensity: number; // 0-4
}

export interface HeatmapResponse {
  data: HeatmapData[];
  start_date: string;
  end_date: string;
  total_sessions: number;
  longest_streak: number;
  current_streak: number;
}

export interface WeeklyStats {
  week_start: string;
  total_sessions: number;
  total_work_time: number;
  total_break_time: number;
  tasks_completed: number;
  average_session_length: number;
}

export interface StatsResponse {
  daily: DailyStats[];
  weekly: WeeklyStats[];
  monthly_total: {
    sessions: number;
    work_time: number;
    tasks_completed: number;
  };
}

// Music and Playlist Types
export interface Track {
  id: string;
  name: string;
  artist: string;
  duration: number; // seconds
  url?: string;
  spotify_id?: string;
  preview_url?: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  spotify_id?: string;
  tracks: Track[];
  created_at: string;
  updated_at: string;
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  is_public?: boolean;
  tracks?: Track[];
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
  tracks?: Track[];
}

// Spotify Integration Types
export interface SpotifyToken {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
}

export interface SpotifyAuthRequest {
  code: string;
  state: string;
}

export interface SpotifyPlayer {
  device_id: string;
  name: string;
  type: string;
  volume_percent: number;
  is_active: boolean;
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  track?: {
    id: string;
    name: string;
    artists: string[];
    duration_ms: number;
    progress_ms: number;
  };
  device?: SpotifyPlayer;
}

// Error response types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  status: number;
  timestamp: string;
  path: string;
  validation_errors?: ValidationError[];
}

// Pagination helpers
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// WebSocket event types for real-time updates
export interface WebSocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
  user_id: string;
}

export interface TimerEvent {
  session_id: string;
  elapsed: number;
  remaining: number;
  is_paused: boolean;
}

export interface TaskUpdateEvent {
  task_id: string;
  action: 'created' | 'updated' | 'deleted' | 'completed';
  task: Task;
}

export interface SessionUpdateEvent {
  session_id: string;
  action: 'started' | 'paused' | 'resumed' | 'completed' | 'cancelled';
  session: PomodoroSession;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retry_after?: number;
}
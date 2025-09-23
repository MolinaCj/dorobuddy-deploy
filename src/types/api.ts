// DoroBuddy API Contract - TypeScript Interfaces and Endpoints
// File: types/api.ts

// Base response wrapper
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

// API Endpoints Structure
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },

  // User Settings
  SETTINGS: {
    GET: '/api/settings',
    UPDATE: '/api/settings',
  },

  // Tasks Management
  TASKS: {
    LIST: '/api/tasks',
    CREATE: '/api/tasks',
    GET: (id: string) => `/api/tasks/${id}`,
    UPDATE: (id: string) => `/api/tasks/${id}`,
    DELETE: (id: string) => `/api/tasks/${id}`,
    REORDER: '/api/tasks/reorder',
  },

  // Pomodoro Sessions
  SESSIONS: {
    LIST: '/api/sessions',
    CREATE: '/api/sessions',
    GET: (id: string) => `/api/sessions/${id}`,
    UPDATE: (id: string) => `/api/sessions/${id}`,
    ACTIVE: '/api/sessions/active',
    COMPLETE: (id: string) => `/api/sessions/${id}/complete`,
  },

  // Statistics and Heatmap
  STATS: {
    HEATMAP: '/api/stats/heatmap',
    WEEKLY: '/api/stats/weekly',
    MONTHLY: '/api/stats/monthly',
    DAILY: '/api/stats/daily',
  },

  // Playlists
  PLAYLISTS: {
    LIST: '/api/playlists',
    CREATE: '/api/playlists',
    GET: (id: string) => `/api/playlists/${id}`,
    UPDATE: (id: string) => `/api/playlists/${id}`,
    DELETE: (id: string) => `/api/playlists/${id}`,
    PUBLIC: '/api/playlists/public',
  },

  // Spotify Integration
  SPOTIFY: {
    AUTH: '/api/spotify/auth',
    CALLBACK: '/api/spotify/callback',
    REFRESH: '/api/spotify/refresh',
    PLAYER: '/api/spotify/player',
    PLAY: '/api/spotify/play',
    PAUSE: '/api/spotify/pause',
    NEXT: '/api/spotify/next',
    PREVIOUS: '/api/spotify/previous',
    VOLUME: '/api/spotify/volume',
    SEARCH: '/api/spotify/search',
    DISCONNECT: '/api/spotify/disconnect',
  },

  // Health and Monitoring
  HEALTH: '/api/health',
  METRICS: '/api/metrics',
} as const;

// Request/Response type mappings for each endpoint
export interface ApiEndpoints {
  // Authentication
  'POST /api/auth/login': {
    request: LoginRequest;
    response: AuthResponse;
  };
  'POST /api/auth/register': {
    request: RegisterRequest;
    response: AuthResponse;
  };
  'POST /api/auth/logout': {
    request: {};
    response: { message: string };
  };
  'POST /api/auth/refresh': {
    request: { refresh_token: string };
    response: { access_token: string; expires_at: string };
  };
  'GET /api/auth/profile': {
    request: {};
    response: User;
  };

  // Settings
  'GET /api/settings': {
    request: {};
    response: UserSettings;
  };
  'PUT /api/settings': {
    request: UpdateSettingsRequest;
    response: UserSettings;
  };

  // Tasks
  'GET /api/tasks': {
    request: { page?: number; limit?: number; completed?: boolean };
    response: TasksResponse;
  };
  'POST /api/tasks': {
    request: CreateTaskRequest;
    response: Task;
  };
  'GET /api/tasks/{id}': {
    request: {};
    response: Task;
  };
  'PUT /api/tasks/{id}': {
    request: UpdateTaskRequest;
    response: Task;
  };
  'DELETE /api/tasks/{id}': {
    request: {};
    response: { message: string };
  };

  // Sessions
  'GET /api/sessions': {
    request: { page?: number; limit?: number; date?: string };
    response: SessionsResponse;
  };
  'POST /api/sessions': {
    request: StartSessionRequest;
    response: PomodoroSession;
  };
  'PUT /api/sessions/{id}': {
    request: UpdateSessionRequest;
    response: PomodoroSession;
  };
  'GET /api/sessions/active': {
    request: {};
    response: PomodoroSession | null;
  };

  // Stats
  'GET /api/stats/heatmap': {
    request: { start_date?: string; end_date?: string };
    response: HeatmapResponse;
  };
  'GET /api/stats/weekly': {
    request: { weeks?: number };
    response: WeeklyStats[];
  };

  // Spotify
  'GET /api/spotify/auth': {
    request: {};
    response: { auth_url: string };
  };
  'POST /api/spotify/callback': {
    request: SpotifyAuthRequest;
    response: { success: boolean };
  };
  'GET /api/spotify/player': {
    request: {};
    response: SpotifyPlaybackState;
  };
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
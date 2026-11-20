export interface AssetsFetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

export interface WorkerEnv {
  ASSETS?: AssetsFetcher;
  VITE_SUPABASE_URL?: string;
  SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  VITE_SUPABASE_SERVICE_ROLE_KEY?: string;
  SERVICE_ROLE_KEY?: string;
  JWT_SECRET_KEY?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  role: string;
  user_metadata?: Record<string, any>;
  [key: string]: any;
}

export interface HonoBindings {
  Bindings: WorkerEnv;
  Variables: {
    user?: AuthUser;
  };
}

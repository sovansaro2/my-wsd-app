declare namespace Express {
  export interface Request {
    user?: { id: string; role: string; email?: string; user_metadata?: any };
  }
}

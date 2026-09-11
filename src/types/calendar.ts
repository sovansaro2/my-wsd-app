export type EventType = 'monastery' | 'devotee_invitation' | 'ceremony';

export interface MonasteryEvent {
  id: string;
  title: string;
  event_type: EventType;
  host_name?: string;
  phone?: string;
  location?: string;
  event_date: string; // YYYY-MM-DD
  event_time?: string; // e.g. "07:30"
  monks_count?: number;
  description?: string;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApproachingAlert {
  event: MonasteryEvent;
  daysDiff: number; // 0 = today, 1 = tomorrow, 2 = in 2 days, etc.
  urgency: 'today' | 'tomorrow' | 'soon';
}

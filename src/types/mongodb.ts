export interface Club {
  _id: string;
  name: string;
  head: string;
  description: string;
  color?: string;
  members: Member[];
  events: Event[];
  approved: boolean;
  email: string;
  contact_links: string[];
  createdAt: Date;
}

export interface Member {
  name: string;
  designation: string;
  addedAt: Date;
}

export interface Event {
  title: string;
  date: string;
  description?: string;
  status: 'waiting' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface User {
  _id: string;
  email: string;
  password: string;
  role: 'director' | 'club' | 'faculty';
  clubId?: string;
  createdAt: Date;
}

export interface BudgetRequest {
  _id: string;
  club_id: string;
  event_name: string;
  organisers: string;
  expected_budget: number;
  final_budget?: number;
  tentative_month: string;
  status: 'pending' | 'approved' | 'rejected' | 'countered';
  createdAt: Date;
}




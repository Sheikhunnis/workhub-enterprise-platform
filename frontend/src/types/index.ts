export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

export type TicketStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type TaskStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  client_profile?: {
    id: number;
    company_name: string;
    contact_person: string;
    phone?: string;
    address?: string;
  };
  employee_profile?: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone?: string;
    department_id: number;
    designation: string;
    reporting_manager_id?: number;
    joining_date: string;
    status: string;
  };
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  team_count: number;
  employee_count: number;
}

export interface Team {
  id: number;
  department_id: number;
  name: string;
  code: string;
  team_leader_id?: number;
  is_active: boolean;
  created_at: string;
  department_name?: string;
  leader_name?: string;
  member_count: number;
}

export interface EmployeeProfile {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  department_id: number;
  designation: string;
  reporting_manager_id?: number;
  joining_date: string;
  status: string;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  description?: string;
  category: string;
  priority: PriorityLevel;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  client_id: number;
  client_name?: string;
  company_name?: string;
  department_id: number;
  department_name?: string;
  team_id: number;
  team_name?: string;
  assigned_employee_id?: number;
  assigned_employee_name?: string;
  task_count: number;
  completed_task_count: number;
  resolution_notes?: string;
  history?: TicketHistoryItem[];
  comments?: TicketCommentItem[];
}

export interface TicketHistoryItem {
  id: number;
  ticket_id: number;
  actor_id: number;
  actor_name: string;
  action: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  remarks?: string;
  created_at: string;
}

export interface TicketCommentItem {
  id: number;
  ticket_id: number;
  user_id: number;
  author_name: string;
  author_role: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  task_number: string;
  ticket_id: number;
  ticket_number?: string;
  title: string;
  description?: string;
  priority: PriorityLevel;
  status: TaskStatus;
  assigned_employee_id?: number;
  assigned_employee_name?: string;
  estimated_hours: number;
  actual_hours: number;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  comments?: TaskCommentItem[];
  history?: TaskHistoryItem[];
}

export interface TaskCommentItem {
  id: number;
  task_id: number;
  user_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

export interface TaskHistoryItem {
  id: number;
  task_id: number;
  actor_id: number;
  actor_name: string;
  action: string;
  old_status?: string;
  new_status?: string;
  notes?: string;
  created_at: string;
}

export interface OverviewMetrics {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  total_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  total_employees: number;
  total_clients: number;
  total_departments: number;
  total_teams: number;
  ticket_status_distribution: { status: string; count: number }[];
  ticket_priority_distribution: { priority: string; count: number }[];
  team_workloads: {
    team_id: number;
    team_name: string;
    member_count: number;
    active_tickets: number;
    pending_tasks: number;
    completed_tasks: number;
  }[];
  department_performances: {
    department_id: number;
    department_name: string;
    total_tickets: number;
    resolved_tickets: number;
    resolution_rate_percent: number;
  }[];
  top_performers: {
    employee_id: number;
    employee_name: string;
    designation: string;
    department_name: string;
    assigned_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    on_time_completion_rate: number;
    average_completion_hours: number;
  }[];
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

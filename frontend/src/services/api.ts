import axios from 'axios';
import {
  User,
  Ticket,
  Task,
  Department,
  Team,
  EmployeeProfile,
  OverviewMetrics,
  NotificationItem,
  PriorityLevel,
  TicketStatus,
  TaskStatus,
} from '../types';

const api = axios.create({
  // 👇 FIXED: Absolute URL to prevent proxy 404 errors
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('workhub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('workhub_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  registerClient: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const ticketApi = {
  list: async (params?: {
    status_filter?: string;
    department_id?: number;
    team_id?: number;
    search?: string;
  }): Promise<Ticket[]> => {
    const res = await api.get('/tickets', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Ticket> => {
    const res = await api.get(`/tickets/${id}`);
    return res.data;
  },
  trackByNumber: async (ticketNumber: string): Promise<Ticket> => {
    const res = await api.get(`/tickets/track/${ticketNumber}`);
    return res.data;
  },
  create: async (data: {
    department_id: number;
    team_id: number;
    title: string;
    description: string;
    category?: string;
    priority?: PriorityLevel;
  }): Promise<Ticket> => {
    const res = await api.post('/tickets', data);
    return res.data;
  },
  assign: async (
    id: number,
    data: { team_id: number; assigned_employee_id?: number; notes?: string }
  ): Promise<Ticket> => {
    const res = await api.post(`/tickets/${id}/assign`, data);
    return res.data;
  },
  updateStatus: async (
    id: number,
    data: { status: TicketStatus; resolution_notes?: string; remarks?: string }
  ): Promise<Ticket> => {
    const res = await api.patch(`/tickets/${id}/status`, data);
    return res.data;
  },
  addComment: async (id: number, content: string, is_internal = false) => {
    const res = await api.post(`/tickets/${id}/comments`, { content, is_internal });
    return res.data;
  },
  submitFeedback: async (id: number, rating: number, comments?: string) => {
    const res = await api.post(`/tickets/${id}/feedback`, { rating, comments });
    return res.data;
  },
};

export const taskApi = {
  list: async (params?: { assigned_employee_id?: number; status_filter?: string }): Promise<Task[]> => {
    const res = await api.get('/tasks', { params });
    return res.data;
  },
  getForTicket: async (ticketId: number): Promise<Task[]> => {
    const res = await api.get(`/tickets/${ticketId}/tasks`);
    return res.data;
  },
  getById: async (id: number): Promise<Task> => {
    const res = await api.get(`/tasks/${id}`);
    return res.data;
  },
  createForTicket: async (
    ticketId: number,
    data: {
      title: string;
      description: string;
      priority?: PriorityLevel;
      assigned_employee_id?: number;
      estimated_hours?: number;
      start_date?: string;
      due_date?: string;
    }
  ): Promise<Task> => {
    const res = await api.post(`/tickets/${ticketId}/tasks`, data);
    return res.data;
  },
  updateStatus: async (
    id: number,
    data: { status: TaskStatus; actual_hours?: number; notes?: string }
  ): Promise<Task> => {
    const res = await api.patch(`/tasks/${id}/status`, data);
    return res.data;
  },
  reassign: async (id: number, assigned_employee_id: number, notes?: string): Promise<Task> => {
    const res = await api.post(`/tasks/${id}/assign`, { assigned_employee_id, notes });
    return res.data;
  },
  addComment: async (id: number, content: string) => {
    const res = await api.post(`/tasks/${id}/comments`, { content });
    return res.data;
  },
};

export const orgApi = {
  getDepartments: async (): Promise<Department[]> => {
    const res = await api.get('/departments');
    return res.data;
  },
  createDepartment: async (data: { name: string; code: string; description?: string }): Promise<Department> => {
    const res = await api.post('/departments', data);
    return res.data;
  },
  getTeams: async (department_id?: number): Promise<Team[]> => {
    const res = await api.get('/teams', { params: { department_id } });
    return res.data;
  },
  createTeam: async (data: { department_id: number; name: string; code: string }): Promise<Team> => {
    const res = await api.post('/teams', data);
    return res.data;
  },
  getEmployees: async (params?: { department_id?: number; team_id?: number }): Promise<EmployeeProfile[]> => {
    const res = await api.get('/employees', { params });
    return res.data;
  },
  createEmployee: async (data: any): Promise<EmployeeProfile> => {
    const res = await api.post('/employees', data);
    return res.data;
  },
};

export const analyticsApi = {
  getOverview: async (): Promise<OverviewMetrics> => {
    const res = await api.get('/analytics/overview');
    return res.data;
  },
};

export const notificationApi = {
  list: async (): Promise<NotificationItem[]> => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markRead: async (id: number): Promise<NotificationItem> => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
};

export const attachmentApi = {
  upload: async (file: File, ticket_id?: number, task_id?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (ticket_id) formData.append('ticket_id', ticket_id.toString());
    if (task_id) formData.append('task_id', task_id.toString());
    const res = await api.post('/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default api;
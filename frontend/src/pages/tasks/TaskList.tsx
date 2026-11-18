import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '../../services/api';
import { Task } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { UpdateTaskModal } from '../../components/modals/UpdateTaskModal';
import {
  CheckSquare,
  Search,
  Filter,
  Edit3,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

export const TaskList: React.FC = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await taskApi.list();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'OVERDUE') {
      return (
        t.due_date &&
        t.due_date < today &&
        t.status !== 'COMPLETED' &&
        t.status !== 'CANCELLED'
      );
    }
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        t.task_number.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.ticket_number && t.ticket_number.toLowerCase().includes(q)) ||
        (t.assigned_employee_name && t.assigned_employee_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const statusPills = [
    { label: 'All Tasks', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Overdue', value: 'OVERDUE' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Task Queue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Internal work units broken down across all active client requests with engineer assignments and effort logs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {statusPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setStatusFilter(pill.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === pill.value
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by task ID, engineer, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Task ID</th>
                <th className="px-6 py-3">Parent Ticket</th>
                <th className="px-6 py-3">Work Item</th>
                <th className="px-6 py-3">Assigned Engineer</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Logged Effort</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                    Loading task registry...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                    No tasks match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const isOverdue =
                    t.due_date &&
                    t.due_date < today &&
                    t.status !== 'COMPLETED' &&
                    t.status !== 'CANCELLED';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                        {t.task_number}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          onClick={() => navigate(`/tickets/${t.ticket_id}`)}
                          className="font-mono text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                        >
                          #{t.ticket_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-semibold text-slate-900">{t.title}</p>
                        {t.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">{t.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">
                          {t.assigned_employee_name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {t.due_date || 'No deadline'}
                        </span>
                        {isOverdue && <span className="block text-[10px] text-rose-500">Overdue</span>}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {t.actual_hours}h / {t.estimated_hours}h
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTask(t);
                            setIsUpdateModalOpen(true);
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Update</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UpdateTaskModal
        isOpen={isUpdateModalOpen}
        task={selectedTask}
        onClose={() => setIsUpdateModalOpen(false)}
        onUpdated={loadTasks}
      />
    </div>
  );
};

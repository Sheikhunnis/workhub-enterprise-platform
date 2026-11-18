import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { taskApi, ticketApi } from '../../services/api';
import { Task, Ticket } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { UpdateTaskModal } from '../../components/modals/UpdateTaskModal';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Edit3,
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allTasks, allTickets] = await Promise.all([taskApi.list(), ticketApi.list()]);
      setTasks(allTasks);
      setTickets(allTickets);
    } catch (err) {
      console.error('Failed to load employee work desk:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const empProfile = user?.employee_profile;

  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
  );

  return (
    <div className="space-y-6">
      {/* Employee Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
            Internal Engineer Desk
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            {empProfile?.full_name || 'Engineering Workspace'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-semibold text-slate-700">{empProfile?.designation || 'Software Engineer'}</span>{' '}
            • ID: <span className="font-mono font-semibold">{empProfile?.employee_code || 'EMP-1002'}</span>{' '}
            • Joining Date: {empProfile?.joining_date || '2023-06-01'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
            Account Active
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Tasks"
          value={tasks.length}
          subtitle="Total work units"
          icon={CheckSquare}
          color="indigo"
        />
        <StatCard
          title="In Progress"
          value={inProgressTasks.length}
          subtitle="Active execution"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Completed"
          value={completedTasks.length}
          subtitle="Verified deliverables"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Overdue"
          value={overdueTasks.length}
          subtitle="Past due deadline"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* My Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">My Assigned Tasks</h3>
            <p className="text-xs text-slate-500">
              Update task execution status, log effort hours, and report completion notes.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Task ID</th>
                <th className="px-6 py-3">Parent Ticket</th>
                <th className="px-6 py-3">Task Description</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Effort (Actual/Est)</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Loading your tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No tasks assigned to your account right now.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const isOverdue =
                    task.due_date &&
                    task.due_date < today &&
                    task.status !== 'COMPLETED' &&
                    task.status !== 'CANCELLED';
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                        {task.task_number}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          onClick={() => navigate(`/track/${task.ticket_number}`)}
                          className="font-mono text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                        >
                          #{task.ticket_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">{task.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {task.due_date || 'No deadline'}
                        </span>
                        {isOverdue && <span className="block text-[10px] text-rose-500">Overdue</span>}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {task.actual_hours}h / {task.estimated_hours}h
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setIsUpdateModalOpen(true);
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition-colors"
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

      {/* Assigned Tickets Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Responsible Tickets in Your Scope ({tickets.length})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Tickets where you are either assigned as technical lead or belong to the responsible team.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/tickets/${t.id}`)}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer bg-slate-50/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-indigo-600">#{t.ticket_number}</span>
                <StatusBadge status={t.status} />
              </div>
              <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{t.title}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <span>Client: {t.company_name}</span>
                <span className="font-semibold text-indigo-600 flex items-center">
                  View Detail <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <UpdateTaskModal
        isOpen={isUpdateModalOpen}
        task={selectedTask}
        onClose={() => setIsUpdateModalOpen(false)}
        onUpdated={loadData}
      />
    </div>
  );
};

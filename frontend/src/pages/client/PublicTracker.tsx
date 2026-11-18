import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketApi, taskApi } from '../../services/api';
import { Ticket, Task, TicketStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { FeedbackModal } from '../../components/modals/FeedbackModal';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Clock,
  User,
  Users,
  Building,
  CheckCircle,
  MessageSquare,
  History,
  Send,
  Star,
  ArrowLeft,
  Loader2,
  Calendar,
} from 'lucide-react';

export const PublicTracker: React.FC = () => {
  const { ticketNumber } = useParams<{ ticketNumber?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inputTicket, setInputTicket] = useState(ticketNumber || '');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchTicket = async (num: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ticketApi.trackByNumber(num);
      setTicket(data);
      const childTasks = await taskApi.getForTicket(data.id);
      setTasks(childTasks);
    } catch (err: any) {
      setError(err.response?.data?.detail || `Ticket '${num}' not found`);
      setTicket(null);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ticketNumber) {
      setInputTicket(ticketNumber);
      fetchTicket(ticketNumber);
    }
  }, [ticketNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTicket.trim()) {
      navigate(`/track/${inputTicket.trim().toUpperCase()}`);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await ticketApi.addComment(ticket.id, commentText.trim(), false);
      setCommentText('');
      fetchTicket(ticket.ticket_number);
    } catch (err: any) {
      alert('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Lifecycle steps for the stepper visual
  const steps: { label: string; status: TicketStatus }[] = [
    { label: 'Submitted', status: 'OPEN' },
    { label: 'Reviewed', status: 'UNDER_REVIEW' },
    { label: 'Assigned', status: 'ASSIGNED' },
    { label: 'In Progress', status: 'IN_PROGRESS' },
    { label: 'Resolved', status: 'RESOLVED' },
    { label: 'Closed', status: 'CLOSED' },
  ];

  const getStepIndex = (currentStatus: TicketStatus) => {
    switch (currentStatus) {
      case 'OPEN':
        return 0;
      case 'UNDER_REVIEW':
        return 1;
      case 'ASSIGNED':
        return 2;
      case 'IN_PROGRESS':
      case 'ON_HOLD':
        return 3;
      case 'RESOLVED':
        return 4;
      case 'CLOSED':
        return 5;
      case 'REOPENED':
        return 1;
      default:
        return 0;
    }
  };

  const currentStep = ticket ? getStepIndex(ticket.status) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Ticket Tracker
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter any permanent Ticket ID (e.g.{' '}
              <span className="font-mono font-semibold text-indigo-600">WH-2026-0001</span>) to track live status and tasks.
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                placeholder="Ticket ID (e.g. WH-2026-0001)..."
                value={inputTicket}
                onChange={(e) => setInputTicket(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono"
                required
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Track</span>}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {ticket && (
        <div className="space-y-6 animate-in fade-in">
          {/* Main Ticket Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-3 mb-1.5">
                  <span className="font-mono text-base font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    {ticket.ticket_number}
                  </span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mt-2">{ticket.title}</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Category: <span className="font-medium text-slate-700">{ticket.category}</span> • Created on{' '}
                  <span className="font-medium text-slate-700">
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                </p>
              </div>

              {/* Feedback CTA button if ticket is RESOLVED */}
              {ticket.status === 'RESOLVED' && (
                <button
                  onClick={() => setIsFeedbackOpen(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  <Star className="w-4 h-4 fill-current text-yellow-300" />
                  <span>Review Resolution & Close</span>
                </button>
              )}
            </div>

            {/* Visual Lifecycle Stepper */}
            <div className="py-8">
              <div className="relative flex justify-between items-center max-w-3xl mx-auto px-4">
                {/* Connecting bar */}
                <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-200 -z-0">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-700"
                    style={{
                      width: `${(currentStep / (steps.length - 1)) * 100}%`,
                    }}
                  ></div>
                </div>

                {steps.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={step.label} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isDone
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}
                      >
                        {isDone ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] font-semibold mt-2 ${
                          isCurrent ? 'text-indigo-600' : isDone ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Request Description & Resolution Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                    Request Description
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {ticket.description}
                  </div>
                </div>

                {ticket.resolution_notes && (
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                      Resolution Notes
                    </h4>
                    <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                      {ticket.resolution_notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Responsible Entities Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3.5 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200/60 pb-2">
                  Assignment Details
                </h4>
                <div className="flex items-center space-x-2.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Department</span>
                    <span className="font-semibold text-slate-800">{ticket.department_name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Assigned Team</span>
                    <span className="font-semibold text-slate-800">{ticket.team_name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lead Engineer</span>
                    <span className="font-semibold text-slate-800">
                      {ticket.assigned_employee_name || 'Team Queue / Unassigned'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Last Activity</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(ticket.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Granular Linked Tasks Section (Core Requirement) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Granular Linked Tasks ({tasks.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Engineering tasks broken down under parent ticket #{ticket.ticket_number}.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Task ID</th>
                    <th className="px-6 py-3">Work Item</th>
                    <th className="px-6 py-3">Assigned Engineer</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Logged Effort</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 text-center text-slate-400">
                        No tasks have been broken down under this ticket yet.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-mono font-bold text-indigo-600">
                          {task.task_number}
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-900">{task.title}</p>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">{task.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-slate-700">
                          {task.assigned_employee_name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-3.5">
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-600">
                          {task.actual_hours}h / {task.estimated_hours}h
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit History & Comments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Audit History Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Audit Timeline History</h3>
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {ticket.history?.map((h) => (
                  <div key={h.id} className="relative pl-5 border-l-2 border-indigo-200 text-xs space-y-0.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute -left-[6px] top-1"></span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{h.action.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-500">By {h.actor_name}</p>
                    {h.remarks && <p className="text-slate-600 italic bg-slate-50 p-1.5 rounded mt-1">{h.remarks}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Contextual Communication (Comments) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Ticket Communications</h3>
                </div>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                  {ticket.comments?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No comments yet</p>
                  ) : (
                    ticket.comments?.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-slate-800">{c.author_name}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add comment form */}
              <form onSubmit={handlePostComment} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message or question..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors flex items-center space-x-1"
                >
                  {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <FeedbackModal
        isOpen={isFeedbackOpen}
        ticket={ticket}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmitted={() => {
          if (ticket) fetchTicket(ticket.ticket_number);
        }}
      />
    </div>
  );
};

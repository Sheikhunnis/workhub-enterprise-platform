import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketApi, taskApi } from '../../services/api';
import { Ticket, Task, TicketStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { AssignTicketModal } from '../../components/modals/AssignTicketModal';
import { CreateTaskModal } from '../../components/modals/CreateTaskModal';
import { UpdateTaskModal } from '../../components/modals/UpdateTaskModal';
import { FeedbackModal } from '../../components/modals/FeedbackModal';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Building,
  Users,
  User,
  Clock,
  CheckCircle,
  PlusCircle,
  Edit3,
  Split,
  MessageSquare,
  History,
  Send,
  Lock,
  Globe,
  Loader2,
  Star,
} from 'lucide-react';

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [commentTab, setCommentTab] = useState<'ALL' | 'PUBLIC' | 'INTERNAL'>('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isUpdateTaskModalOpen, setIsUpdateTaskModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadTicket = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await ticketApi.getById(Number(id));
      setTicket(data);
      const childTasks = await taskApi.getForTicket(Number(id));
      setTasks(childTasks);
    } catch (err) {
      console.error('Failed to load ticket:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    setIsUpdatingStatus(true);
    try {
      let resolutionNotes = undefined;
      if (newStatus === 'RESOLVED') {
        const notes = prompt('Enter resolution summary for the client:');
        if (!notes) {
          setIsUpdatingStatus(false);
          return;
        }
        resolutionNotes = notes;
      }
      await ticketApi.updateStatus(ticket.id, {
        status: newStatus,
        resolution_notes: resolutionNotes,
      });
      loadTicket();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update ticket status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !ticket) return;
    setIsSubmittingComment(true);
    try {
      await ticketApi.addComment(ticket.id, commentText.trim(), isInternalComment);
      setCommentText('');
      loadTicket();
    } catch (err: any) {
      alert('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const filteredComments = ticket.comments?.filter((c) => {
    if (commentTab === 'PUBLIC') return !c.is_internal;
    if (commentTab === 'INTERNAL') return c.is_internal;
    return true;
  });

  const canManageTicket = role === 'SUPER_ADMIN' || role === 'ADMIN';

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top back bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center space-x-2">
          {canManageTicket && (
            <>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors"
              >
                Reassign Ticket
              </button>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </>
          )}

          {ticket.status === 'RESOLVED' && role === 'CLIENT' && (
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1"
            >
              <Star className="w-3.5 h-3.5 fill-current text-yellow-300" />
              <span>Review & Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Ticket Header Cockpit */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="font-mono text-base font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                #{ticket.ticket_number}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{ticket.title}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Category: <span className="font-semibold text-slate-700">{ticket.category}</span> • Created on{' '}
              {new Date(ticket.created_at).toLocaleString()}
            </p>
          </div>

          {/* Quick status transition dropdown for Admin / Tech lead */}
          {canManageTicket && (
            <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                disabled={isUpdatingStatus}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="OPEN">OPEN</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="ON_HOLD">ON HOLD</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REOPENED">REOPENED</option>
              </select>
            </div>
          )}
        </div>

        {/* Description & Entities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                Work Request Details
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            {ticket.resolution_notes && (
              <div>
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Resolution Summary
                </h4>
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                  {ticket.resolution_notes}
                </div>
              </div>
            )}
          </div>

          {/* Metadata Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Service Metadata
            </h4>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Client Organization</span>
              <span className="font-semibold text-slate-800">{ticket.company_name}</span>
              <span className="text-slate-500 block text-[11px]">{ticket.client_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Department & Team</span>
              <span className="font-semibold text-slate-800">{ticket.department_name}</span>
              <span className="text-slate-500 block text-[11px]">{ticket.team_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Lead Engineer</span>
              <span className="font-semibold text-slate-800">
                {ticket.assigned_employee_name || 'Team Queue / Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Last Activity</span>
              <span className="font-semibold text-slate-800">
                {new Date(ticket.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Child Tasks Section (Core Work Breakdown) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Executable Child Tasks ({tasks.length})
            </h3>
            <p className="text-xs text-slate-500">
              Granular pieces of engineering work required to complete this ticket request.
            </p>
          </div>
          {canManageTicket && (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs border border-indigo-200"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Child Task</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Task ID</th>
                <th className="px-6 py-3">Work Item</th>
                <th className="px-6 py-3">Assigned Engineer</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Effort (Actual/Est)</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No tasks created under this ticket. Click "Add Child Task" to divide the work.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                      {task.task_number}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">{task.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">
                        {task.assigned_employee_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-6 py-4">{task.due_date || 'None'}</td>
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
                          setIsUpdateTaskModalOpen(true);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit History & Comments Tabbed View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full Immutable Audit Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Audit History Timeline</h3>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {ticket.history?.map((h) => (
              <div key={h.id} className="relative pl-5 border-l-2 border-indigo-200 text-xs space-y-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute -left-[6px] top-1"></span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{h.action.replace('_', ' ')}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-500">
                  By <strong className="text-slate-700">{h.actor_name}</strong>
                  {h.old_value && (
                    <span>
                      {' '}
                      • from <code className="bg-slate-100 px-1 rounded">{h.old_value}</code> to{' '}
                      <code className="bg-slate-100 px-1 rounded">{h.new_value}</code>
                    </span>
                  )}
                </p>
                {h.remarks && <p className="text-slate-600 italic bg-slate-50 p-1.5 rounded mt-1">{h.remarks}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Comments with Public vs Internal tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Communications</h3>
              </div>

              {/* Tabs for staff */}
              {role !== 'CLIENT' && (
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                  <button
                    onClick={() => setCommentTab('ALL')}
                    className={`px-2 py-0.5 rounded-md ${
                      commentTab === 'ALL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setCommentTab('PUBLIC')}
                    className={`px-2 py-0.5 rounded-md ${
                      commentTab === 'PUBLIC' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => setCommentTab('INTERNAL')}
                    className={`px-2 py-0.5 rounded-md ${
                      commentTab === 'INTERNAL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Staff Only
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {filteredComments?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No comments recorded yet</p>
              ) : (
                filteredComments?.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border text-xs ${
                      c.is_internal
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-900">{c.author_name}</span>
                        {c.is_internal && (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            <Lock className="w-2.5 h-2.5 mr-0.5" /> Staff Only
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comment composer */}
          <form onSubmit={handlePostComment} className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            {role !== 'CLIENT' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="internalCommentCheck"
                  checked={isInternalComment}
                  onChange={(e) => setIsInternalComment(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="internalCommentCheck" className="text-xs text-slate-600 font-medium cursor-pointer">
                  Make internal note (visible to staff only)
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={
                  isInternalComment
                    ? 'Write an internal staff engineering note...'
                    : 'Write a comment or update for the client...'
                }
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
            </div>
          </form>
        </div>
      </div>

      {/* Modals */}
      <AssignTicketModal
        isOpen={isAssignModalOpen}
        ticket={ticket}
        onClose={() => setIsAssignModalOpen(false)}
        onAssigned={loadTicket}
      />

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        ticket={ticket}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={loadTicket}
      />

      <UpdateTaskModal
        isOpen={isUpdateTaskModalOpen}
        task={selectedTask}
        onClose={() => setIsUpdateTaskModalOpen(false)}
        onUpdated={loadTicket}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        ticket={ticket}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmitted={loadTicket}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types';
import { taskApi } from '../../services/api';
import { X, Loader2 } from 'lucide-react';

interface UpdateTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const UpdateTaskModal: React.FC<UpdateTaskModalProps> = ({
  isOpen,
  task,
  onClose,
  onUpdated,
}) => {
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'IN_PROGRESS');
  const [actualHours, setActualHours] = useState(task?.actual_hours?.toString() || '0.0');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await taskApi.updateStatus(task.id, {
        status,
        actual_hours: actualHours ? parseFloat(actualHours) : undefined,
        notes: notes || undefined,
      });

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Update Task Progress</h3>
            <p className="text-xs text-slate-500">
              Task <span className="font-semibold text-indigo-600">{task.task_number}</span> – {task.title}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            >
              <option value="ASSIGNED">ASSIGNED (Acknowledged)</option>
              <option value="IN_PROGRESS">IN PROGRESS (Work started)</option>
              <option value="ON_HOLD">ON HOLD (Blocked / Waiting)</option>
              <option value="COMPLETED">COMPLETED (Done & Verified)</option>
              <option value="CANCELLED">CANCELLED (Not Needed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Logged Effort (Total Actual Hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Progress Remarks / Completion Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Patch tested in staging and verified with test suite..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Update Progress</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

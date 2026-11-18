import React, { useState, useEffect } from 'react';
import { Ticket, Team, EmployeeProfile } from '../../types';
import { orgApi, ticketApi } from '../../services/api';
import { X, Loader2 } from 'lucide-react';

interface AssignTicketModalProps {
  isOpen: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  onAssigned: () => void;
}

export const AssignTicketModal: React.FC<AssignTicketModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onAssigned,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | ''>('');
  const [selectedEmpId, setSelectedEmpId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ticket) {
      orgApi.getTeams().then(setTeams);
      setSelectedTeamId(ticket.team_id);
      if (ticket.assigned_employee_id) {
        setSelectedEmpId(ticket.assigned_employee_id);
      } else {
        setSelectedEmpId('');
      }
    }
  }, [isOpen, ticket]);

  useEffect(() => {
    if (selectedTeamId) {
      orgApi.getEmployees({ team_id: Number(selectedTeamId) }).then(setEmployees);
    } else {
      setEmployees([]);
    }
  }, [selectedTeamId]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setError('Please select a team');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      await ticketApi.assign(ticket.id, {
        team_id: Number(selectedTeamId),
        assigned_employee_id: selectedEmpId ? Number(selectedEmpId) : undefined,
        notes: notes || undefined,
      });
      onAssigned();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Assign Ticket</h3>
            <p className="text-xs text-slate-500">
              Ticket #{ticket.ticket_number} – {ticket.title}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Team *
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Technical Lead / Responsible Engineer (Optional)
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value ? Number(e.target.value) : '')}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">-- No specific engineer (Team queue only) --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} ({e.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignment Notes
            </label>
            <textarea
              rows={3}
              placeholder="Provide reason, urgency instructions, or SLA expectations..."
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
              <span>Confirm Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

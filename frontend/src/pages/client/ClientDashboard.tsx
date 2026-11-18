import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketApi } from '../../services/api';
import { Ticket } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { CreateTicketModal } from '../../components/modals/CreateTicketModal';
import {
  Ticket as TicketIcon,
  Clock,
  CheckCircle2,
  FileCheck,
  PlusCircle,
  Search,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await ticketApi.list();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load client tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const openCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'UNDER_REVIEW').length;
  const inProgressCount = tickets.filter(
    (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'ON_HOLD'
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;
  const closedCount = tickets.filter((t) => t.status === 'CLOSED').length;

  const filteredTickets = tickets.filter(
    (t) =>
      t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">
            Client Self-Service Portal
          </span>
          <h1 className="text-2xl font-bold mt-1">
            Welcome back, {user?.client_profile?.contact_person || 'Client'}
          </h1>
          <p className="text-xs text-indigo-100 mt-1">
            Organization:{' '}
            <span className="font-semibold">{user?.client_profile?.company_name || 'Acme Global'}</span>{' '}
            • Submit work requests and track granular task execution live.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs shadow-md transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-indigo-600" />
          <span>Submit Work Request</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Requests"
          value={openCount}
          subtitle="Waiting for team allocation"
          icon={TicketIcon}
          color="blue"
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          subtitle="Actively executing tasks"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Resolved"
          value={resolvedCount}
          subtitle="Ready for review & closure"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Total Closed"
          value={closedCount}
          subtitle="Completed requests"
          icon={FileCheck}
          color="indigo"
        />
      </div>

      {/* Ticket List and Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Submitted Work Requests</h3>
            <p className="text-xs text-slate-500">
              Track the full lifecycle, assigned team, responsible engineer, and linked tasks.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by ticket ID or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Ticket ID</th>
                <th className="px-6 py-3">Work Request</th>
                <th className="px-6 py-3">Department & Team</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Task Progress</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading your tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No tickets found. Click "Submit Work Request" to get started.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const percent =
                    t.task_count > 0 ? Math.round((t.completed_task_count / t.task_count) * 100) : 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                        {t.ticket_number}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{t.title}</p>
                        <span className="text-[11px] text-slate-400">{t.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">{t.department_name}</span>
                        <p className="text-[11px] text-slate-500">{t.team_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-28">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>
                              {t.completed_task_count}/{t.task_count} tasks
                            </span>
                            <span className="font-semibold">{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                percent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/track/${t.ticket_number}`)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors"
                        >
                          <span>Track</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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

      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(ticketNum) => {
          loadTickets();
          navigate(`/track/${ticketNum}`);
        }}
      />
    </div>
  );
};

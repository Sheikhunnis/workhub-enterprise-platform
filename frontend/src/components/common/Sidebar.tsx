import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  CheckSquare,
  Users,
  Building,
  BarChart3,
  PlusCircle,
  Search,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Client Navigation */}
        {role === 'CLIENT' && (
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Client Portal
            </p>
            <NavLink to="/client" end className={navItemClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/tickets" className={navItemClass}>
              <TicketIcon className="w-4 h-4" />
              <span>My Requests</span>
            </NavLink>
            <NavLink to="/new-ticket" className={navItemClass}>
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-emerald-700">Submit Request</span>
            </NavLink>
          </div>
        )}

        {/* Employee Navigation */}
        {role === 'EMPLOYEE' && (
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Work Desk
            </p>
            <NavLink to="/employee" end className={navItemClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/tasks" className={navItemClass}>
              <CheckSquare className="w-4 h-4" />
              <span>My Tasks</span>
            </NavLink>
            <NavLink to="/tickets" className={navItemClass}>
              <TicketIcon className="w-4 h-4" />
              <span>Assigned Tickets</span>
            </NavLink>
          </div>
        )}

        {/* Admin & Super Admin Navigation */}
        {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Operations & SLA
            </p>
            <NavLink to="/admin" end className={navItemClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Executive Overview</span>
            </NavLink>
            <NavLink to="/tickets" className={navItemClass}>
              <TicketIcon className="w-4 h-4" />
              <span>Ticket Registry</span>
            </NavLink>
            <NavLink to="/tasks" className={navItemClass}>
              <CheckSquare className="w-4 h-4" />
              <span>Master Tasks</span>
            </NavLink>
            <NavLink to="/analytics" className={navItemClass}>
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & Metrics</span>
            </NavLink>

            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-6 mb-2">
              Organization
            </p>
            <NavLink to="/teams" className={navItemClass}>
              <Users className="w-4 h-4" />
              <span>Teams & Employees</span>
            </NavLink>
            <NavLink to="/departments" className={navItemClass}>
              <Building className="w-4 h-4" />
              <span>Departments</span>
            </NavLink>
          </div>
        )}

        {/* Universal Links */}
        <div className="pt-4 border-t border-slate-100 space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Service Tracking
          </p>
          <NavLink to="/track" className={navItemClass}>
            <Search className="w-4 h-4" />
            <span>Ticket Lookup</span>
          </NavLink>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-800">System Healthy</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">REST API v1.0 • MySQL 8+ Engine</p>
      </div>
    </aside>
  );
};

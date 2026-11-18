import React, { useState, useEffect } from 'react';
import { orgApi } from '../../services/api';
import { Department, Team, EmployeeProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Building,
  UserPlus,
  PlusCircle,
  Briefcase,
  ChevronRight,
  Shield,
  Loader2,
  X,
} from 'lucide-react';

export const TeamDirectory: React.FC = () => {
  const { role } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'TEAMS' | 'EMPLOYEES' | 'DEPARTMENTS'>('TEAMS');

  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [empForm, setEmpForm] = useState({
    email: '',
    password: 'WorkHub@2026',
    first_name: '',
    last_name: '',
    employee_code: '',
    department_id: 1,
    designation: '',
    phone: '',
    joining_date: new Date().toISOString().split('T')[0],
  });

  const [teamForm, setTeamForm] = useState({
    name: '',
    code: '',
    department_id: 1,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [depts, tms, emps] = await Promise.all([
        orgApi.getDepartments(),
        orgApi.getTeams(),
        orgApi.getEmployees(),
      ]);
      setDepartments(depts);
      setTeams(tms);
      setEmployees(emps);
      if (depts.length > 0) {
        setEmpForm((prev) => ({ ...prev, department_id: depts[0].id }));
        setTeamForm((prev) => ({ ...prev, department_id: depts[0].id }));
      }
    } catch (err) {
      console.error('Failed to load team directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await orgApi.createEmployee(empForm);
      setIsEmpModalOpen(false);
      loadData();
      alert('Employee account created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create employee');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await orgApi.createTeam(teamForm);
      setIsTeamModalOpen(false);
      loadData();
      alert('Team created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create team');
    }
  };

  const canManage = role === 'SUPER_ADMIN' || role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Organization & Team Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure company hierarchy, departments, teams, team leaders, and employee directory.
          </p>
        </div>
        {canManage && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold border border-indigo-200 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Team</span>
            </button>
            <button
              onClick={() => setIsEmpModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('TEAMS')}
          className={`pb-3 border-b-2 flex items-center space-x-2 ${
            activeTab === 'TEAMS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teams ({teams.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('EMPLOYEES')}
          className={`pb-3 border-b-2 flex items-center space-x-2 ${
            activeTab === 'EMPLOYEES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Employees ({employees.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('DEPARTMENTS')}
          className={`pb-3 border-b-2 flex items-center space-x-2 ${
            activeTab === 'DEPARTMENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Departments ({departments.length})</span>
        </button>
      </div>

      {/* Teams Grid View */}
      {activeTab === 'TEAMS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {team.code}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">{team.department_name}</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{team.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Leader: <span className="font-semibold text-slate-800">{team.leader_name || 'Unassigned'}</span>
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{team.member_count} active members</span>
                <span className="inline-flex items-center text-indigo-600 font-semibold cursor-pointer">
                  Team Members <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Employees Table View */}
      {activeTab === 'EMPLOYEES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Employee Code</th>
                  <th className="px-6 py-3">Full Name</th>
                  <th className="px-6 py-3">Designation</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Joining Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                      {emp.employee_code}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{emp.full_name}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.designation}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {departments.find((d) => d.id === emp.department_id)?.name || 'General'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{emp.joining_date}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Departments Grid View */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {departments.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {d.code}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">Active</span>
              </div>
              <h3 className="font-bold text-base text-slate-900">{d.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{d.description}</p>
              <div className="pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600">
                <span>{d.team_count} Teams</span>
                <span>{d.employee_count} Employees</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Employee Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Register Employee Account</h3>
              <button onClick={() => setIsEmpModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={empForm.first_name}
                    onChange={(e) => setEmpForm({ ...empForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={empForm.last_name}
                    onChange={(e) => setEmpForm({ ...empForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Employee Code *</label>
                  <input
                    type="text"
                    placeholder="EMP-1005"
                    required
                    value={empForm.employee_code}
                    onChange={(e) => setEmpForm({ ...empForm, employee_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department *</label>
                  <select
                    value={empForm.department_id}
                    onChange={(e) => setEmpForm({ ...empForm, department_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={empForm.email}
                  onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation *</label>
                  <input
                    type="text"
                    placeholder="e.g. SRE Engineer"
                    required
                    value={empForm.designation}
                    onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold">
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Create Team</h3>
              <button onClick={() => setIsTeamModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Team Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Security Team"
                  required
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Team Code *</label>
                  <input
                    type="text"
                    placeholder="SEC-OPS"
                    required
                    value={teamForm.code}
                    onChange={(e) => setTeamForm({ ...teamForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department *</label>
                  <select
                    value={teamForm.department_id}
                    onChange={(e) => setTeamForm({ ...teamForm, department_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

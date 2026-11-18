import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users, ShieldCheck, TrendingUp, Activity, CheckCircle2, X, ChevronRight, Clock, Briefcase, Building2, DollarSign, Star
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { role, user } = useAuth();

  // 👇 LOG TO CONSOLE: Is the role actually SUPER_ADMIN?
  console.log("Current User Role:", role, "User:", user);

  const isSuperAdmin = role === 'SUPER_ADMIN';

  const [employees, setEmployees] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [directoryType, setDirectoryType] = useState<'EMPLOYEES' | 'ADMINS' | 'CLIENTS' | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCompanyData = async () => {
      try {
        // 👇 CHECK BOTH token names, in case AuthContext uses access_token
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        console.log("Sending Token:", token ? "Token Exists ✅" : "NO TOKEN FOUND ❌");

        const response = await fetch('http://localhost:8000/api/v1/users/directory', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });

        console.log("API Response Status:", response.status);

        if (response.ok && isMounted) {
          const data = await response.json();
          console.log("Fetched Data from DB:", data); // 👈 THIS WILL SHOW IN CONSOLE

          setEmployees(data.employees || []);
          setAdmins(data.admins || []);
          setClients(data.clients || []);
        } else {
          console.error("API returned error status:", response.status);
        }
      } catch (error) {
        console.error("Failed to connect to backend:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (isSuperAdmin) {
      fetchCompanyData();
    }

    const interval = setInterval(() => {
      if (isSuperAdmin) fetchCompanyData();
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isSuperAdmin]);

  const closeModals = () => {
    setDirectoryType(null);
    setSelectedUser(null);
  };

  // Safe initials to prevent crashing if name is missing
  const getInitials = (name: string) => {
    if (!name || name === "Unknown") return "??";
    return name.substring(0, 2).toUpperCase();
  };

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
              <ShieldCheck className="w-7 h-7 mr-2 text-indigo-600 dark:text-indigo-400" />
              Company Performance Cockpit
            </h1>
          </div>
          {isLoading && <span className="text-sm text-indigo-600 animate-pulse font-bold">Syncing...</span>}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => setDirectoryType('EMPLOYEES')} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Employees</p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{employees.length}</h3>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Users className="w-6 h-6" /></div>
            </div>
          </div>

          <div onClick={() => setDirectoryType('ADMINS')} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Admins</p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{admins.length}</h3>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600"><ShieldCheck className="w-6 h-6" /></div>
            </div>
          </div>

          <div onClick={() => setDirectoryType('CLIENTS')} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Clients</p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{clients.length}</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><Building2 className="w-6 h-6" /></div>
            </div>
          </div>
        </div>

        {/* MODAL */}
        {directoryType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-700">

              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                  {selectedUser ? (
                    <button onClick={() => setSelectedUser(null)} className="text-indigo-600 hover:underline mr-2 text-sm font-medium flex items-center">
                      ← Back to Directory
                    </button>
                  ) : (
                    <>Directory</>
                  )}
                </h3>
                <button onClick={closeModals} className="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-full shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {!selectedUser && (
                  <div className="space-y-3">
                    {directoryType === 'EMPLOYEES' && employees.length === 0 && <p className="text-center text-slate-500">No employees found.</p>}

                    {directoryType === 'EMPLOYEES' && employees.map((person) => (
                      <div key={person.id} onClick={() => setSelectedUser(person)} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-400">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                            {getInitials(person.name)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{person.name || "Unknown"}</p>
                            <p className="text-xs text-slate-500">{person.role || "Employee"} • {person.dept || "No Dept"}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    ))}

                    {directoryType === 'ADMINS' && admins.map((person) => (
                      <div key={person.id} onClick={() => setSelectedUser(person)} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-purple-400">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                            {getInitials(person.name)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{person.name || "Unknown"}</p>
                            <p className="text-xs text-slate-500">{person.role || "Admin"}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    ))}

                    {directoryType === 'CLIENTS' && clients.map((client) => (
                      <div key={client.id} onClick={() => setSelectedUser(client)} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-400">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{client.company || "Unknown"}</p>
                            <p className="text-xs text-slate-500">{client.contact || "Unknown"}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div>
                    <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                        {directoryType === 'CLIENTS' ? <Building2 className="w-8 h-8" /> : getInitials(selectedUser.name)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                          {directoryType === 'CLIENTS' ? selectedUser.company : selectedUser.name}
                        </h2>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Operations Dashboard</h1>
      </div>
    </div>
  );
};
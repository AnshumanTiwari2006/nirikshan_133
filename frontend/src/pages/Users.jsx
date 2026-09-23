import { UserPlus, Shield, Filter, Edit, Trash2 } from 'lucide-react';

export default function Users() {
  return (
    <div className="flex flex-col h-full h-full -m-6 bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500">Manage auditor roles, region assignments, and system permissions.</p>
        </div>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Auditor Directory</h3>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input type="text" placeholder="Search by name or email..." className="pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-md bg-white w-64" />
            </div>
          </div>
          
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-500 text-xs uppercase">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Jurisdiction</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Rajesh Kumar', email: 'rajesh.k@nirikshan.gov.in', role: 'Ministry Admin', scope: 'Pan-India', status: 'Active' },
                { name: 'Priya Sharma', email: 'priya.s@nirikshan.gov.in', role: 'State Auditor', scope: 'Madhya Pradesh', status: 'Active' },
                { name: 'Anil Desai', email: 'anil.d@nirikshan.gov.in', role: 'District Auditor', scope: 'Gopalganj, Bihar', status: 'Inactive' },
              ].map((user, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 group">
                  <td className="p-4 font-medium text-slate-700">{user.name}</td>
                  <td className="p-4 text-slate-500">{user.email}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded w-fit">
                      {user.role === 'Ministry Admin' && <Shield size={14} className="text-teal-600"/>}
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{user.scope}</td>
                  <td className="p-4">
                    <span className={`w-2 h-2 rounded-full inline-block mr-2 ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    {user.status}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-teal-600 rounded bg-white border border-slate-200 shadow-sm"><Edit size={14}/></button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-600 rounded bg-white border border-slate-200 shadow-sm"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

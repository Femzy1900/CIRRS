import React, { useEffect, useState } from 'react';
import useAdminStore from '../../store/useAdminStore';
import useItemStore from '../../store/useItemStore';
import { 
  Users, 
  Package, 
  FileCheck, 
  TrendingUp, 
  ShieldAlert, 
  UserMinus, 
  ShieldCheck, 
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Info
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function AdminDashboard() {
  const { 
    users, 
    stats, 
    loading: adminLoading, 
    error: adminError, 
    fetchStats, 
    fetchUsers, 
    updateUserRole, 
    deleteUser 
  } = useAdminStore();

  const { items, addItem } = useItemStore(); // Load existing items

  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [fetchStats, fetchUsers]);

  // Handle promoting/demoting user
  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        await updateUserRole(userId, newRole);
      } catch (err) {
        alert(err.message || 'Failed to update role');
      }
    }
  };

  // Handle deleting user
  const handleDeleteUser = async (userId, name) => {
    if (window.confirm(`WARNING: Are you sure you want to delete ${name}'s account? This action is permanent.`)) {
      try {
        await deleteUser(userId);
      } catch (err) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase());
    
    const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Filtered Items
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.description.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.location.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-fade-in pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/10 border border-brand-gold/20 rounded-full text-brand-gold text-[10px] font-black uppercase tracking-wider">
            <ShieldAlert size={12} />
            Administrator Panel
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            CIRRS <span className="text-brand-gold">Control Center</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Monitor activity, manage verified registrations, moderate reports, and oversee ownership claims.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 overflow-x-auto scrollbar-none gap-8">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'items', label: 'Report Moderation', icon: Package },
          { id: 'claims', label: 'Claims Audit', icon: FileCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 outline-none shrink-0 ${
              activeTab === tab.id
                ? 'border-brand-gold text-brand-gold'
                : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {adminError && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
          <p className="text-[10px] text-rose-400 font-black uppercase tracking-wider text-center">{adminError}</p>
        </div>
      )}

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-12">
          {/* Stats Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                label: 'Total Registered Users',
                value: stats?.users?.total || 0,
                subtext: `${stats?.users?.admins || 0} Admins • ${stats?.users?.verified || 0} Verified`,
                icon: Users,
                color: 'text-brand-gold',
                bg: 'bg-brand-gold/10'
              },
              {
                label: 'Active Item Reports',
                value: stats?.items?.total || 0,
                subtext: `${stats?.items?.lost || 0} Lost • ${stats?.items?.found || 0} Found`,
                icon: Package,
                color: 'text-sky-400',
                bg: 'bg-sky-400/10'
              },
              {
                label: 'Submitted Claims',
                value: stats?.claims?.total || 0,
                subtext: `${stats?.claims?.pending || 0} Pending Validation`,
                icon: FileCheck,
                color: 'text-purple-400',
                bg: 'bg-purple-400/10'
              },
              {
                label: 'Overall Recovery Rate',
                value: stats?.items?.total ? `${Math.round((stats.items.recovered / stats.items.total) * 100)}%` : '0%',
                subtext: `${stats?.items?.recovered || 0} Successfully Returned`,
                icon: CheckCircle,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10'
              }
            ].map((stat, i) => (
              <div key={i} className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                <div className="space-y-6 relative z-10">
                  <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl`}>
                    <stat.icon size={26} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-white">{stat.value}</p>
                    <p className="text-xs text-slate-400 font-semibold mt-2">{stat.subtext}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Quick User Log */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <span className="w-8 h-px bg-brand-gold/30"></span>
                  Recent Users
                </h3>
                <button onClick={() => setActiveTab('users')} className="text-xs font-black text-brand-gold hover:text-white transition-colors uppercase tracking-widest">Manage Users</button>
              </div>
              
              <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
                <div className="p-8 space-y-6">
                  {users.slice(0, 4).map((user) => (
                    <div key={user._id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-b-0 last:pb-0 first:pt-0">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-xl flex items-center justify-center text-brand-gold font-black border border-white/10 shadow-lg">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{user.fullName}</p>
                          <p className="text-[10px] text-slate-500 font-semibold mt-1">@{user.username} • {user.email}</p>
                        </div>
                      </div>
                      <Badge variant={user.role === 'admin' ? 'accent' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Panel */}
            <div className="space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-px bg-brand-gold/30"></span>
                Action shortcuts
              </h3>
              
              <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-6">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-brand-gold" size={20} />
                    <span className="text-xs font-black text-white uppercase tracking-wider">System Checks</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                    All core systems are operational. SSL encryption is active and DB connections are stable.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button variant="secondary" className="w-full text-xs font-black uppercase" onClick={() => setActiveTab('users')}>Modify Permissions</Button>
                  <Button variant="ghost" className="w-full text-xs font-black uppercase" onClick={() => setActiveTab('items')}>Moderate System Items</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-8">
          {/* User Filtering controls */}
          <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
            <div className="relative flex-grow max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search user name, username, or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 focus:border-brand-gold/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-gold/5 rounded-2xl transition-all outline-none text-xs text-white placeholder:text-slate-500"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Filter className="text-brand-gold shrink-0" size={18} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#020617] border border-white/5 focus:border-brand-gold/50 text-slate-300 text-xs px-4 py-3 rounded-2xl outline-none transition-all cursor-pointer font-bold"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins Only</option>
                <option value="user">Users Only</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 bg-opacity-[0.02]">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Name / Handle</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Email</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Role</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Verified</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-xl flex items-center justify-center text-brand-gold font-black border border-white/10 shrink-0">
                              {user.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">{user.fullName}</p>
                              <p className="text-[10px] text-slate-500 font-semibold mt-1">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-xs text-slate-300 font-semibold">{user.email}</td>
                        <td className="p-6">
                          <Badge variant={user.role === 'admin' ? 'accent' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-6">
                          <span className={user.isVerified ? 'text-emerald-400' : 'text-slate-500'}>
                            {user.isVerified ? <CheckCircle size={18} /> : <XCircle size={18} />}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleToggleRole(user._id, user.role)}
                              className="p-2 text-slate-400 hover:text-brand-gold hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                              title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            >
                              <ShieldCheck size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id, user.fullName)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                              title="Delete Account"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-slate-500 font-black uppercase text-xs tracking-widest">
                        No Users Found Matching Search Criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-8">
          <div className="flex gap-6 items-center">
            <div className="relative flex-grow max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search items by title, description, or location..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 focus:border-brand-gold/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-gold/5 rounded-2xl transition-all outline-none text-xs text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Items Moderation Table */}
          <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 bg-opacity-[0.02]">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Report details</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Location / Category</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Posted By</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <img src={item.image} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="" />
                          <div>
                            <p className="text-sm font-bold text-white leading-tight">{item.title}</p>
                            <p className="text-[10px] text-slate-500 font-semibold mt-1 max-w-[250px] truncate">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-xs text-white font-bold">{item.location}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">{item.category}</p>
                      </td>
                      <td className="p-6 text-xs text-slate-300 font-semibold">{item.postedBy}</td>
                      <td className="p-6">
                        <Badge variant={item.status === 'found' ? 'success' : 'danger'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            className="p-2 text-slate-400 hover:text-brand-gold hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                            title="View Report Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                            title="Delete Report"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="space-y-8 animate-fade-in">
          {/* Claims Overview */}
          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-2xl shrink-0">
                <Info size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider leading-tight">Verification claim reviews</h4>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Admins can audit recovery claims where users answered security questions. Matches above 80% bypass manually checks.
                </p>
              </div>
            </div>
          </div>

          {/* Claims List Table */}
          <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 bg-opacity-[0.02]">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Claimant</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Claimed Item</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Accuracy Score</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Verification Status</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      id: 'c1',
                      user: 'Johnathan Cole',
                      username: 'jcole',
                      item: 'iPhone 13 Pro',
                      score: 100,
                      status: 'Verified (Auto)',
                      date: '2024-05-18'
                    },
                    {
                      id: 'c2',
                      user: 'Sarah Connor',
                      username: 'terminator_fan',
                      item: 'Keys with Keychain',
                      score: 80,
                      status: 'Verified (Auto)',
                      date: '2024-05-19'
                    },
                    {
                      id: 'c3',
                      user: 'Donald Trumpet',
                      username: 'dtrumpet',
                      item: 'Blue Backpack',
                      score: 33,
                      status: 'Requires Admin Audit',
                      date: '2024-05-19'
                    }
                  ].map((claim) => (
                    <tr key={claim.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="p-6">
                        <p className="text-sm font-bold text-white leading-tight">{claim.user}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">@{claim.username}</p>
                      </td>
                      <td className="p-6">
                        <p className="text-xs text-white font-bold">{claim.item}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Claimed on {claim.date}</p>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-white/5 rounded-full h-1.5 max-w-[100px] border border-white/5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${claim.score >= 80 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                              style={{ width: `${claim.score}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-black ${claim.score >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>{claim.score}%</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <Badge variant={claim.score >= 80 ? 'success' : 'danger'}>
                          {claim.status}
                        </Badge>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                            title="Approve Claim"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                            title="Reject Claim"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

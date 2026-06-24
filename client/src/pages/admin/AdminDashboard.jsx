import React, { useEffect, useState } from 'react';
import useAdminStore from '../../store/useAdminStore';
import useItemStore from '../../store/useItemStore';
import useAuthStore from '../../store/useAuthStore';
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
  Info,
  Crown,
  Flag,
  ArrowUpCircle,
  Hourglass
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const {
    users,
    claims,
    stats,
    loading: adminLoading,
    error: adminError,
    fetchStats,
    fetchUsers,
    fetchClaims,
    updateUserRole,
    deleteUser
  } = useAdminStore();

  const { items, fetchItems, deleteItem } = useItemStore();
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.isSuperAdmin === true;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [flaggedClaims, setFlaggedClaims] = useState([]);
  const [loadingFlagged, setLoadingFlagged] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [adminNotes, setAdminNotes] = useState({});

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchClaims();
    fetchItems();
  }, [fetchStats, fetchUsers, fetchClaims, fetchItems]);

  // Load flagged claims when switching to that tab
  useEffect(() => {
    if (activeTab !== 'flagged') return;
    setLoadingFlagged(true);
    import('../../api/claimApi').then(mod => {
      mod.default.getFlaggedClaims()
        .then(res => setFlaggedClaims(res.data || []))
        .catch(() => setFlaggedClaims([]))
        .finally(() => setLoadingFlagged(false));
    });
  }, [activeTab]);

  // Load complaints when switching to that tab
  useEffect(() => {
    if (activeTab !== 'complaints') return;
    setLoadingComplaints(true);
    import('../../api/complaintApi').then(mod => {
      mod.default.getComplaints()
        .then(res => setComplaints(res.data || []))
        .catch(() => setComplaints([]))
        .finally(() => setLoadingComplaints(false));
    });
  }, [activeTab]);

  // Handle promoting/demoting user
  const handleToggleRole = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    toast(`Change role to ${newRole}?`, {
      action: {
        label: 'Confirm',
        onClick: async () => {
          try {
            await updateUserRole(userId, newRole);
            toast.success(`Role updated to ${newRole}.`);
          } catch (err) {
            toast.error(err.message || 'Failed to update role');
          }
        }
      },
      cancel: { label: 'Cancel' }
    });
  };

  // Handle deleting user
  const handleDeleteUser = (userId, name) => {
    toast.warning(`Permanently delete ${name}'s account?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteUser(userId);
            toast.success(`${name}'s account deleted.`);
          } catch (err) {
            toast.error(err.message || 'Failed to delete user');
          }
        }
      },
      cancel: { label: 'Cancel' }
    });
  };

  // Handle admin item delete
  const handleDeleteItem = (item) => {
    const id = item._id || item.id;
    toast.warning(`Delete report "${item.title}"?`, {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteItem(id);
            toast.success('Report deleted.');
          } catch (err) {
            toast.error(err.message || 'Failed to delete report.');
          }
        }
      },
      cancel: { label: 'Cancel' }
    });
  };

  // Handle Claims action
  const handleUpdateClaim = async (claimId, status) => {
    try {
      const claimApi = (await import('../../api/claimApi')).default;
      await claimApi.updateClaimStatus(claimId, status);
      fetchClaims();
      fetchStats();
      toast.success(`Claim ${status}.`);
    } catch(err) {
      toast.error('Failed to update claim');
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/10 border border-brand-gold/20 rounded-full text-brand-gold text-[10px] font-black uppercase tracking-wider">
              <ShieldAlert size={12} />
              Administrator Panel
            </div>
            {isSuperAdmin && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-wider">
                <Crown size={12} />
                Super Admin
              </div>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            CIRS <span className="text-brand-gold">Control Center</span>
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
          { id: 'flagged', label: 'Flagged Claims', icon: Flag },
          { id: 'complaints', label: 'Complaints', icon: ArrowUpCircle },
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
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
              <div key={i} className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-white/5 relative overflow-hidden group">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-12">
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
                <div className="p-5 sm:p-8 space-y-6">
                  {users.slice(0, 4).map((user) => (
                    <div key={user._id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-b-0 last:pb-0 first:pt-0">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black border shadow-lg ${user.isSuperAdmin ? 'bg-gradient-to-br from-amber-500/30 to-amber-700/30 text-amber-400 border-amber-500/30' : 'bg-gradient-to-br from-brand-blue to-brand-blue-dark text-brand-gold border-white/10'}`}>
                          {user.isSuperAdmin ? <Crown size={20} /> : user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-white leading-tight">{user.fullName}</p>
                            {user.isSuperAdmin && (
                              <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded-md text-[9px] font-black text-amber-400 uppercase tracking-wider">Super Admin</span>
                            )}
                          </div>
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
              
              <div className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-white/5 space-y-6">
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
                      <tr key={user._id} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${user.isSuperAdmin ? 'bg-amber-500/5' : ''}`}>
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black border shrink-0 ${user.isSuperAdmin ? 'bg-gradient-to-br from-amber-500/30 to-amber-700/30 text-amber-400 border-amber-500/30' : 'bg-gradient-to-br from-brand-blue to-brand-blue-dark text-brand-gold border-white/10'}`}>
                              {user.isSuperAdmin ? <Crown size={16} /> : user.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-white leading-tight">{user.fullName}</p>
                                {user.isSuperAdmin && (
                                  <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded-md text-[9px] font-black text-amber-400 uppercase tracking-wider">Super Admin</span>
                                )}
                              </div>
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
                            {/* Role toggle — super admin only, and cannot change another super admin */}
                            {isSuperAdmin && !user.isSuperAdmin ? (
                              <button
                                onClick={() => handleToggleRole(user._id, user.role)}
                                className="p-2 text-slate-400 hover:text-brand-gold hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                                title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                              >
                                <ShieldCheck size={18} />
                              </button>
                            ) : !user.isSuperAdmin ? (
                              <span
                                className="p-2 text-slate-700 rounded-xl cursor-not-allowed"
                                title="Only the super admin can change roles"
                              >
                                <ShieldCheck size={18} />
                              </span>
                            ) : null}
                            {/* Delete — disabled for super admin */}
                            {!user.isSuperAdmin ? (
                              <button
                                onClick={() => handleDeleteUser(user._id, user.fullName)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                                title="Delete Account"
                              >
                                <Trash2 size={18} />
                              </button>
                            ) : (
                              <span
                                className="p-2 text-slate-700 rounded-xl cursor-not-allowed"
                                title="Super admin account is protected"
                              >
                                <Trash2 size={18} />
                              </span>
                            )}
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
                    <tr key={item._id || item.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
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
                      <td className="p-6 text-xs text-slate-300 font-semibold">{item.postedBy?.fullName || item.postedBy?.username || '—'}</td>
                      <td className="p-6">
                        <Badge variant={item.status === 'found' ? 'success' : 'danger'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => navigate(`/item/${item._id || item.id}`)}
                            className="p-2 text-slate-400 hover:text-brand-gold hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                            title="View Report Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
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
          <div className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-2xl shrink-0">
                <Info size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider leading-tight">Risk-Routed Claim Reviews</h4>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Claims are scored using answer accuracy, location, time, and detail quality. HIGH-risk or fraud-flagged claims require admin approval.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('flagged')}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
            >
              <Flag size={14} />
              View Flagged
            </button>
          </div>

          {/* Claims List Table */}
          <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 bg-opacity-[0.02]">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Claimant</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Item / Risk</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Composite Score</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status / Route</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.length > 0 ? (
                    claims.map((claim) => {
                      const composite = claim.compositeScore ?? Math.round(
                        claim.answers?.length > 0
                          ? (claim.answers.filter(a => a.isCorrect).length / claim.answers.length) * 100
                          : 0
                      );
                      const isActionable = ['under_review', 'escalated', 'pending'].includes(claim.status) && !claim.passed;
                      const riskLevel = claim.item?.riskLevel || 'LOW';

                      return (
                        <tr key={claim._id} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${claim.isFlagged ? 'bg-red-950/10' : ''}`}>
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-brand-blue/50 rounded-xl flex items-center justify-center text-brand-gold font-black text-sm border border-white/10 shrink-0">
                                {claim.claimant?.fullName?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white leading-tight">{claim.claimant?.fullName}</p>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">@{claim.claimant?.username}</p>
                              </div>
                            </div>
                            {claim.isFlagged && (
                              <div className="flex items-center gap-1 mt-2 text-[9px] text-red-400 font-black uppercase tracking-wider">
                                <Flag size={9} />
                                {claim.fraudFlags?.length} flag{claim.fraudFlags?.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </td>
                          <td className="p-6">
                            <p className="text-xs text-white font-bold">{claim.item?.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                riskLevel === 'HIGH'   ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                riskLevel === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                                          'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              }`}>{riskLevel}</span>
                              <span className="text-[10px] text-slate-500">{new Date(claim.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-full bg-white/5 rounded-full h-1.5 max-w-[80px] border border-white/5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${composite >= 75 ? 'bg-emerald-400' : composite >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                  style={{ width: `${composite}%` }}
                                />
                              </div>
                              <span className={`text-xs font-black ${composite >= 75 ? 'text-emerald-400' : composite >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {composite}%
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-600 mt-1">{claim.score}/{claim.totalQuestions} correct answers</p>
                          </td>
                          <td className="p-6">
                            <div className="space-y-1.5">
                              <Badge variant={
                                claim.status === 'approved'    ? 'success' :
                                claim.status === 'rejected'    ? 'danger' :
                                claim.status === 'escalated'   ? 'accent' :
                                                                  'warning'
                              }>
                                {claim.status === 'under_review' ? '⏳ under review' :
                                 claim.status === 'escalated'    ? '⬆ escalated' : claim.status}
                              </Badge>
                              {claim.riskRoute && (
                                <p className="text-[9px] text-slate-600 uppercase tracking-wider">{claim.riskRoute?.replace(/_/g, ' ')}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-6 text-right">
                            {isActionable ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleUpdateClaim(claim._id, 'approved')}
                                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleUpdateClaim(claim._id, 'rejected')}
                                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                                  title="Reject"
                                >
                                  <XCircle size={18} />
                                </button>
                                <button
                                  onClick={() => navigate(`/item/${claim.item?._id}`)}
                                  className="p-2 text-slate-400 hover:text-brand-gold hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                                  title="View Item"
                                >
                                  <Eye size={18} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => navigate(`/item/${claim.item?._id}`)}
                                className="p-2 text-slate-400 hover:text-brand-gold hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
                                title="View Item"
                              >
                                <Eye size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-slate-500 font-black uppercase text-xs tracking-widest">
                        No Claims Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── FLAGGED CLAIMS TAB ── */}
      {activeTab === 'flagged' && (
        <div className="space-y-8 animate-fade-in">
          <div className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-white/5 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl shrink-0">
              <Flag size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider">Fraud-Flagged Claims</h4>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Claims automatically flagged by the fraud detection engine. Review carefully before approving or rejecting.
              </p>
            </div>
          </div>

          {loadingFlagged ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
            </div>
          ) : flaggedClaims.length === 0 ? (
            <div className="p-12 glass-card rounded-[2.5rem] border-white/5 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No flagged claims</p>
              <p className="text-slate-600 text-xs mt-2">All claims appear clean. Fraud detection has not raised any alerts.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {flaggedClaims.map(claim => (
                <div key={claim._id} className="glass-card p-5 sm:p-8 rounded-[2rem] border-red-500/20 bg-red-950/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shrink-0">
                        <Flag size={20} className="text-red-400" />
                      </div>
                      <div>
                        <p className="text-white font-black">{claim.claimant?.fullName}</p>
                        <p className="text-xs text-slate-500">@{claim.claimant?.username} · {claim.claimant?.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-white">{claim.item?.title}</p>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                        claim.item?.riskLevel === 'HIGH'   ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                        claim.item?.riskLevel === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                                              'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      }`}>{claim.item?.riskLevel || 'LOW'} risk</span>
                    </div>
                  </div>

                  {/* Fraud flags */}
                  <div className="p-4 bg-red-950/30 border border-red-500/20 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Detected Flags</p>
                    <div className="flex flex-wrap gap-2">
                      {claim.fraudFlags?.map((flag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-red-500/20 text-red-300 text-[10px] font-bold rounded-xl border border-red-500/20">
                          {flag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Answers</p>
                      <p className="text-sm font-black text-white">{claim.score}/{claim.totalQuestions} correct</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Composite Score</p>
                      <p className={`text-sm font-black ${claim.compositeScore >= 75 ? 'text-emerald-400' : claim.compositeScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {claim.compositeScore ?? 'N/A'}/100
                      </p>
                    </div>
                  </div>

                  {/* Route reason */}
                  {claim.routeReason && (
                    <p className="text-[10px] text-slate-500 italic">{claim.routeReason}</p>
                  )}

                  {/* Actions */}
                  {['under_review', 'escalated', 'pending'].includes(claim.status) && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={async () => {
                          try {
                            const claimApiMod = (await import('../../api/claimApi')).default;
                            await claimApiMod.updateClaimStatus(claim._id, 'approved', 'Approved by admin after fraud review');
                            setFlaggedClaims(prev => prev.filter(c => c._id !== claim._id));
                            fetchClaims(); fetchStats();
                            toast.success('Claim approved.');
                          } catch { toast.error('Failed to approve.'); }
                        }}
                        className="flex-1 py-2.5 bg-emerald-500/15 text-emerald-400 text-xs font-black rounded-2xl hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20"
                      >
                        ✓ Approve Anyway
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const claimApiMod = (await import('../../api/claimApi')).default;
                            await claimApiMod.updateClaimStatus(claim._id, 'rejected', 'Rejected by admin — fraud flags');
                            setFlaggedClaims(prev => prev.filter(c => c._id !== claim._id));
                            fetchClaims(); fetchStats();
                            toast.success('Claim rejected.');
                          } catch { toast.error('Failed to reject.'); }
                        }}
                        className="flex-1 py-2.5 bg-rose-500/15 text-rose-400 text-xs font-black rounded-2xl hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20"
                      >
                        ✗ Reject — Fraud
                      </button>
                      <button
                        onClick={() => navigate(`/item/${claim.item?._id}`)}
                        className="px-4 py-2.5 bg-white/5 text-slate-400 hover:text-brand-gold text-xs font-black rounded-2xl transition-colors border border-white/10"
                        title="View item"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COMPLAINTS TAB ── */}
      {activeTab === 'complaints' && (
        <div className="space-y-8 animate-fade-in">
          <div className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-white/5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl shrink-0">
              <ArrowUpCircle size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider">Ownership Complaints</h4>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Appeals from claimants who failed verification but believe they are the rightful owner.
                Approving a complaint will notify the claimant and (if a claim exists) release the finder's contact details.
              </p>
            </div>
          </div>

          {loadingComplaints ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 glass-card rounded-[2.5rem] border-white/5 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No complaints</p>
              <p className="text-slate-600 text-xs mt-2">No users have filed ownership appeals.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map(complaint => (
                <div key={complaint._id} className={`glass-card p-5 sm:p-8 rounded-[2rem] border space-y-5 ${
                  complaint.status === 'pending'
                    ? 'border-amber-500/20 bg-amber-500/5'
                    : complaint.status === 'approved'
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-white/5 bg-white/2'
                }`}>
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shrink-0">
                        <ArrowUpCircle size={20} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white font-black">{complaint.claimant?.fullName}</p>
                        <p className="text-xs text-slate-500">@{complaint.claimant?.username} · {complaint.claimant?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-xl border ${
                        complaint.status === 'pending'
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : complaint.status === 'approved'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-slate-500 bg-white/5 border-white/10'
                      }`}>{complaint.status}</span>
                      <button
                        onClick={() => navigate(`/item/${complaint.item?._id}`)}
                        className="p-2 text-slate-400 hover:text-brand-gold rounded-xl transition-colors"
                        title="View item"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Item info */}
                  {complaint.item && (
                    <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-4">
                      {complaint.item.image && (
                        <img src={complaint.item.image} alt={complaint.item.title} className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-black text-white">{complaint.item.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{complaint.item.category} · {complaint.item.location}</p>
                      </div>
                      {complaint.claim && (
                        <div className="ml-auto text-right shrink-0">
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Claim score</p>
                          <p className="text-sm font-black text-white">
                            {complaint.claim.score}/{complaint.claim.totalQuestions}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Complaint message */}
                  <div className="p-5 bg-white/5 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Claimant's Statement</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{complaint.message}</p>
                  </div>

                  {/* Admin note (if already reviewed) */}
                  {complaint.adminNote && (
                    <div className="p-4 bg-white/5 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Admin Note</p>
                      <p className="text-xs text-slate-400 italic">{complaint.adminNote}</p>
                    </div>
                  )}

                  {/* Actions (pending only) */}
                  {complaint.status === 'pending' && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">
                          Admin Note (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Add a note for the claimant..."
                          value={adminNotes[complaint._id] || ''}
                          onChange={e => setAdminNotes(prev => ({ ...prev, [complaint._id]: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/5 focus:border-brand-gold/50 focus:bg-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 outline-none transition-all"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            try {
                              const mod = (await import('../../api/complaintApi')).default;
                              await mod.reviewComplaint(complaint._id, 'approved', adminNotes[complaint._id] || '');
                              setComplaints(prev => prev.map(c => c._id === complaint._id ? { ...c, status: 'approved', adminNote: adminNotes[complaint._id] || '' } : c));
                              toast.success('Complaint approved — claimant notified.');
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Failed to approve complaint.');
                            }
                          }}
                          className="flex-1 py-2.5 bg-emerald-500/15 text-emerald-400 text-xs font-black rounded-2xl hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20"
                        >
                          ✓ Approve Claim
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const mod = (await import('../../api/complaintApi')).default;
                              await mod.reviewComplaint(complaint._id, 'dismissed', adminNotes[complaint._id] || '');
                              setComplaints(prev => prev.map(c => c._id === complaint._id ? { ...c, status: 'dismissed', adminNote: adminNotes[complaint._id] || '' } : c));
                              toast.success('Complaint dismissed.');
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Failed to dismiss complaint.');
                            }
                          }}
                          className="flex-1 py-2.5 bg-rose-500/15 text-rose-400 text-xs font-black rounded-2xl hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20"
                        >
                          ✗ Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

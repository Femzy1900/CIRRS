import React, { useState, useEffect } from 'react';
import useItemStore from '../store/useItemStore';
import useAuthStore from '../store/useAuthStore';
import {
  FileText,
  Search,
  Filter,
  ExternalLink,
  Edit,
  Trash2,
  ArrowLeft,
  X,
  Save,
  Package,
  MapPin,
  Calendar,
  Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { toast } from 'sonner';

export default function MyReports() {
  const { items, fetchItems, updateItem, deleteItem } = useItemStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const userId = user?._id?.toString() || user?.id?.toString();
  const myItems = items.filter(item => {
    const isOwner = userId && (item.postedBy?._id || item.postedBy)?.toString() === userId;
    if (!isOwner) return false;
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const openEdit = (item) => {
    setEditingItem(item._id || item.id);
    setEditForm({
      title: item.title,
      description: item.description,
      location: item.location,
      category: item.category,
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
    });
  };

  const closeEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      await updateItem(id, editForm);
      toast.success('Report updated successfully.');
      closeEdit();
    } catch (err) {
      toast.error(err.message || 'Failed to update report.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (item) => {
    const id = item._id || item.id;
    toast.warning(`Remove "${item.title}"?`, {
      description: 'This action cannot be undone.',
      action: {
        label: 'Remove',
        onClick: async () => {
          try {
            await deleteItem(id);
            toast.success('Report removed.');
          } catch (err) {
            toast.error(err.message || 'Failed to remove report.');
          }
        }
      },
      cancel: { label: 'Cancel' }
    });
  };

  const categories = ['Electronics', 'Documents', 'Personal Effects', 'Keys', 'Bags', 'Other'];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-2 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            My <span className="text-brand-gold">Reports</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Track and manage all the items you have reported as lost or found on campus.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
          {['all', 'lost', 'found'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === type
                  ? 'bg-brand-gold text-brand-blue-dark shadow-lg scale-105'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 gap-6">
        {myItems.length > 0 ? (
          myItems.map((item) => {
            const id = item._id || item.id;
            const isEditing = editingItem === id;
            return (
              <div key={id} className="group glass-card p-6 rounded-[2.5rem] border-white/5 hover:border-brand-gold/30 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {isEditing ? (
                  /* ── Edit form ── */
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-black text-white uppercase tracking-widest">Editing Report</h3>
                      <button onClick={closeEdit} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Title</label>
                        <div className="relative group/input">
                          <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input
                            className="input-field pl-10 w-full"
                            value={editForm.title || ''}
                            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Category</label>
                        <div className="relative group/input">
                          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <select
                            className="input-field pl-10 w-full appearance-none cursor-pointer"
                            value={editForm.category || ''}
                            onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                          >
                            {categories.map(c => (
                              <option key={c} value={c} className="bg-slate-900">{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Date</label>
                        <div className="relative group/input">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input
                            type="date"
                            className="input-field pl-10 w-full"
                            value={editForm.date || ''}
                            onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Location</label>
                        <div className="relative group/input">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input
                            className="input-field pl-10 w-full"
                            value={editForm.location || ''}
                            onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Description</label>
                        <textarea
                          rows="3"
                          className="input-field p-4 w-full resize-none"
                          value={editForm.description || ''}
                          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="accent" size="sm" icon={Save} loading={saving} onClick={() => handleSave(id)}>Save Changes</Button>
                      <Button variant="ghost" size="sm" onClick={closeEdit}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal row ── */
                  <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-full md:w-48 h-48 rounded-[2rem] overflow-hidden shrink-0 border border-white/10 shadow-2xl">
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.title} />
                    </div>

                    <div className="flex-grow space-y-4 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <Badge variant={item.status === 'found' ? 'success' : item.status === 'resolved' ? 'accent' : 'danger'}>
                          {item.status}
                        </Badge>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold/60">REF: {id.slice(0, 8)}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
                      </div>

                      <div>
                        <h3 className="text-3xl font-black text-white tracking-tighter group-hover:text-brand-gold transition-colors">{item.title}</h3>
                        <p className="text-sm text-slate-400 font-medium mt-2 max-w-2xl">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-center md:justify-start gap-6 text-slate-500">
                        <div className="flex items-center gap-2">
                          <Filter size={14} className="text-brand-gold" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Search size={14} className="text-brand-gold" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-3 shrink-0">
                      <Link to={`/item/${id}`}>
                        <Button variant="secondary" size="sm" icon={ExternalLink} className="w-full">Details</Button>
                      </Link>
                      <Button variant="ghost" size="sm" icon={Edit} onClick={() => openEdit(item)}>Edit</Button>
                      <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleRemove(item)}>Remove</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-32 glass-card rounded-[4rem] border-2 border-dashed border-white/10">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
              <FileText size={40} className="text-slate-700" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-widest">No reports found</h3>
            <p className="text-slate-400 mt-4 font-medium max-w-sm mx-auto leading-relaxed">
              You haven't submitted any reports in this category yet.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link to="/report-lost">
                <Button variant="accent" size="lg">Report Lost</Button>
              </Link>
              <Link to="/report-found">
                <Button variant="secondary" size="lg">Report Found</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

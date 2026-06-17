import React, { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  ArrowLeft,
  Settings,
  Lock,
  Globe,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import { toast } from 'sonner';

export default function Profile() {
  const { user, updateProfile, deleteAccount, logout } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    faculty: user?.faculty || '',
  });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);

  const handleChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    toast.warning('Permanently delete your account?', {
      description: 'All your reports and data will be removed. This cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteAccount();
            navigate('/');
            toast.success('Account deleted.');
          } catch (err) {
            toast.error('Failed to delete account.');
          }
        }
      },
      cancel: { label: 'Cancel' }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-2 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            Account <span className="text-brand-gold">Profile</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Manage your personal information and security settings.
          </p>
        </div>
        <Button variant="secondary" size="md" icon={Settings} onClick={() => setShowPwSection(s => !s)}>
          {showPwSection ? 'Hide Security' : 'Account Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-12">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-white/5 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-brand-blue to-brand-blue-dark -z-10"></div>
            <div className="relative inline-block mx-auto mt-8">
              <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] border-4 border-[#020617] flex items-center justify-center text-brand-gold text-5xl font-black shadow-2xl relative z-10">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="mt-8 space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">{user?.fullName || 'Student Name'}</h2>
              <p className="text-sm text-slate-500 font-medium">{user?.email}</p>
              <div className="pt-4 flex items-center justify-center gap-2">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck size={14} />
                  Verified
                </div>
              </div>
            </div>
          </div>

          {/* Security panel */}
          <div className="bg-brand-blue/30 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/5 backdrop-blur-md space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
              <Lock className="text-brand-gold" size={18} />
              Security
            </h3>
            <div className="space-y-4">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-4" onClick={() => setShowPwSection(s => !s)}>
                Change Password
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-4 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-8">
          <form className="glass-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-white/5 space-y-6 sm:space-y-8" onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div className="md:col-span-2">
                <InputField
                  label="Full Name"
                  icon={User}
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="md:col-span-2">
                <InputField
                  label="University Email"
                  icon={Mail}
                  value={user?.email || ''}
                  placeholder="student@university.edu"
                  disabled
                />
                <p className="text-[10px] text-slate-500 mt-2 px-1 font-medium italic">Email cannot be changed after verification.</p>
              </div>
              <div>
                <InputField
                  label="Phone Number"
                  icon={Phone}
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <InputField
                  label="Faculty / Department"
                  icon={Globe}
                  value={form.faculty}
                  onChange={handleChange('faculty')}
                  placeholder="e.g. Faculty of Technology"
                />
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center gap-4">
              <Button variant="accent" size="lg" type="submit" icon={Save} loading={saving} className="w-full sm:w-auto px-12">
                Save Changes
              </Button>
              <Button variant="ghost" size="lg" type="button" className="w-full sm:w-auto"
                onClick={() => setForm({ fullName: user?.fullName || '', phone: user?.phone || '', faculty: user?.faculty || '' })}>
                Discard
              </Button>
            </div>
          </form>

          {/* Change Password Section */}
          {showPwSection && (
            <div className="glass-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-white/5 space-y-6 sm:space-y-8 animate-fade-in">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Lock className="text-brand-gold" size={18} />
                Change Password
              </h3>
              <p className="text-xs text-slate-400 font-medium -mt-4">
                Use the Forgot Password flow from the login page to securely change your password via email.
              </p>
              <Link to="/forgot-password">
                <Button variant="secondary" size="md">Go to Forgot Password</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

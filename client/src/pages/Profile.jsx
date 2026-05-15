import React from 'react';
import useAuthStore from '../store/useAuthStore';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Camera, 
  ArrowLeft,
  Settings,
  Lock,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';

export default function Profile() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-2 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            Account <span className="text-brand-gold">Profile</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Manage your personal information, security settings, and notification preferences.
          </p>
        </div>
        <Button variant="secondary" size="md" icon={Settings}>Account Settings</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
           <div className="glass-card p-10 rounded-[3rem] border-white/5 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-brand-blue to-brand-blue-dark -z-10"></div>
              <div className="relative inline-block mx-auto mt-8">
                 <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] border-4 border-[#020617] flex items-center justify-center text-brand-gold text-5xl font-black shadow-2xl relative z-10">
                    {user?.name?.charAt(0) || 'U'}
                 </div>
                 <button className="absolute bottom-0 right-0 p-3 bg-brand-gold text-brand-blue-dark rounded-2xl border-4 border-[#020617] shadow-xl hover:scale-110 transition-transform z-20">
                    <Camera size={20} />
                 </button>
              </div>
              <div className="mt-8 space-y-2">
                 <h2 className="text-2xl font-black text-white tracking-tight">{user?.name || 'Student Name'}</h2>
                 <p className="text-sm text-slate-500 font-medium">{user?.email || 'student@university.edu'}</p>
                 <div className="pt-4 flex items-center justify-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                       <ShieldCheck size={14} />
                       Verified Student
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-brand-blue/30 p-10 rounded-[3rem] border border-white/5 backdrop-blur-md space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Lock className="text-brand-gold" size={18} />
                Security
              </h3>
              <div className="space-y-4">
                 <Button variant="ghost" size="sm" className="w-full justify-start gap-4">
                    Change Password
                 </Button>
                 <Button variant="ghost" size="sm" className="w-full justify-start gap-4 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500">
                    Delete Account
                 </Button>
              </div>
           </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
           <form className="glass-card p-10 rounded-[3rem] border-white/5 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="md:col-span-2">
                    <InputField 
                       label="Full Name" 
                       icon={User} 
                       defaultValue={user?.name || ''}
                       placeholder="Enter your full name" 
                    />
                 </div>
                 <div className="md:col-span-2">
                    <InputField 
                       label="University Email" 
                       icon={Mail} 
                       defaultValue={user?.email || ''}
                       placeholder="student@university.edu" 
                       disabled
                    />
                    <p className="text-[10px] text-slate-500 mt-2 px-1 font-medium italic">Email cannot be changed after verification.</p>
                 </div>
                 <div>
                    <InputField 
                       label="Phone Number" 
                       icon={Phone} 
                       placeholder="+1 (555) 000-0000" 
                    />
                 </div>
                 <div>
                    <InputField 
                       label="Faculty/Department" 
                       icon={Globe} 
                       placeholder="e.g. Faculty of Technology" 
                    />
                 </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center gap-4">
                 <Button variant="accent" size="lg" className="w-full sm:w-auto px-12">Save Changes</Button>
                 <Button variant="ghost" size="lg" className="w-full sm:w-auto">Discard</Button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}

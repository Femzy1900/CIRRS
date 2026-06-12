import React from 'react';
import { Shield, Users, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 relative min-h-[80vh]">
      {/* Background glowing orbs */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-brand-blue/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[400px] h-[400px] bg-brand-gold/10 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-6xl mx-auto space-y-20">
        {/* Hero Section */}
        <div className="text-center space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
            About <span className="text-brand-gold">CIRS</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-400 font-medium leading-relaxed">
            The Campus Item Recovery System (CIRS) is a centralized, secure platform designed exclusively to help students, faculty, and staff find lost belongings and report found items across the university campus.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-[2rem] border-white/10 hover:border-brand-gold/30 transition-all duration-500 group">
            <div className="bg-brand-blue/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-brand-blue/50 group-hover:scale-110 transition-transform">
              <Shield className="text-brand-gold" size={32} />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Secure Claims</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Our advanced verification system ensures that items are only returned to their rightful owners through mandatory proof-of-ownership questions.
            </p>
          </div>

          <div className="glass-card p-8 rounded-[2rem] border-white/10 hover:border-brand-gold/30 transition-all duration-500 group">
            <div className="bg-brand-blue/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-brand-blue/50 group-hover:scale-110 transition-transform delay-75">
              <Users className="text-brand-gold" size={32} />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Community Driven</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Powered by the campus community. Thousands of students helping each other recover lost valuables every single semester.
            </p>
          </div>

          <div className="glass-card p-8 rounded-[2rem] border-white/10 hover:border-brand-gold/30 transition-all duration-500 group">
            <div className="bg-brand-blue/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-brand-blue/50 group-hover:scale-110 transition-transform delay-150">
              <Clock className="text-brand-gold" size={32} />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Real-time Matching</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instantly browse recently found items, or get notified when someone reports finding an item that matches your lost report.
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="glass-card p-10 md:p-16 rounded-[3rem] border-white/10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-black text-white tracking-tighter">Our Mission</h2>
            <p className="text-slate-400 leading-relaxed">
              Losing an item on a busy campus is stressful. Traditional lost and found boxes are scattered, unorganized, and insecure. We built CIRS to bring modern technology into the recovery process—making it transparent, extremely fast, and highly secure.
            </p>
            <ul className="space-y-3 pt-4">
              {[
                'Centralized database for all campus buildings',
                'Admin-verified item handoffs',
                'Email notifications for matches',
                'Strict privacy and data security'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                  <CheckCircle2 className="text-brand-gold" size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full relative">
            <div className="aspect-square rounded-[2rem] bg-gradient-to-tr from-brand-blue to-[#020617] border border-white/10 p-8 shadow-2xl flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="text-center z-10">
                <div className="text-6xl font-black text-white mb-2">98%</div>
                <div className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">Recovery Rate<br/>for verified items</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8 pb-12">
          <h2 className="text-2xl font-black text-white mb-6">Ready to join the community?</h2>
          <Link to="/register" className="btn-accent inline-flex items-center gap-3 py-4 px-8 rounded-2xl text-sm uppercase tracking-widest font-black group">
            <span>Create Account</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#010a1a] text-slate-400 pt-12 sm:pt-24 pb-8 sm:pb-12 border-t border-white/5 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-blue/10 rounded-full blur-[120px] -z-10"></div>
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-16 mb-10 sm:mb-20">
          {/* Brand */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-brand-gold border border-white/10 shadow-2xl">
                <span className="font-black text-xl">C</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-black text-white tracking-tighter">CIRS</span>
                <span className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em]">Campus Recovery</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed font-medium">
              The official portal for students to recover lost belongings and foster a culture of honesty and community care.
            </p>
            <div className="flex gap-4">
              {[Twitter, Instagram, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="p-3 bg-white/5 hover:bg-brand-gold hover:text-brand-blue-dark rounded-xl transition-all duration-300 border border-white/5 hover:border-transparent group">
                  <Icon size={18} className="group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-black mb-8 text-sm uppercase tracking-[0.2em]">Quick Links</h3>
            <ul className="space-y-4">
              {['Home', 'Browse Items', 'Report Lost', 'Report Found'].map((link) => (
                <li key={link}>
                  <Link to={link === 'Home' ? '/' : `/${link.toLowerCase().replace(' ', '-')}`} className="hover:text-brand-gold transition-colors font-bold text-sm">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-black mb-8 text-sm uppercase tracking-[0.2em]">Campus Resources</h3>
            <ul className="space-y-4">
              {['FAQ', 'Privacy Policy', 'Terms of Service', 'Contact Security'].map((link) => (
                <li key={link}>
                  <Link to={`/${link.toLowerCase().replace(' ', '-')}`} className="hover:text-brand-gold transition-colors font-bold text-sm">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-black mb-8 text-sm uppercase tracking-[0.2em]">Get in Touch</h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="p-2 bg-brand-blue/50 rounded-lg border border-white/5">
                  <MapPin size={18} className="text-brand-gold" />
                </div>
                <span className="text-sm font-medium leading-relaxed">Main Campus Security Office,<br />Central Administration Building.</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="p-2 bg-brand-blue/50 rounded-lg border border-white/5">
                  <Phone size={18} className="text-brand-gold" />
                </div>
                <span className="text-sm font-medium">+1 (555) CAMPUS-SEC</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="p-2 bg-brand-blue/50 rounded-lg border border-white/5">
                  <Mail size={18} className="text-brand-gold" />
                </div>
                <span className="text-sm font-medium">security@campus-recovery.edu</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            © {new Date().getFullYear()} CIRS — Campus Item Reporting and Recovery System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

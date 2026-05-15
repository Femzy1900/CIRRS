import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Calendar, Tag, Image, Send, ArrowLeft, Info } from 'lucide-react';
import useItemStore from '../store/useItemStore';
import { useState } from 'react';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Please select a category'),
  location: z.string().min(3, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export default function ReportItem({ type }) {
  const navigate = useNavigate();
  const { addItem } = useItemStore();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      addItem({
        ...data,
        status: type,
        image: preview || 'https://images.unsplash.com/photo-1586769852044-692d6e3703a0?auto=format&fit=crop&w=800&q=80',
        postedBy: 'Demo User',
      });
      setLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const isFound = type === 'found';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 mb-2 transition-colors">
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Report {isFound ? 'Found' : 'Lost'} Item
          </h1>
          <p className="text-slate-500">Provide as many details as possible to help the recovery process.</p>
        </div>
        
        <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 border shadow-sm ${
          isFound ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          <div className={`w-3 h-3 rounded-full animate-pulse ${isFound ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <span className="text-xs font-bold uppercase tracking-widest">{type} reporting mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form */}
        <div className="lg:col-span-2">
          <form className="glass-card p-8 rounded-[40px] space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Item Title</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    {...register('title')}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl transition-all outline-none text-slate-700"
                    placeholder="e.g. Blue Nike Backpack"
                  />
                </div>
                {errors.title && <p className="mt-1 text-xs text-rose-500 px-1 font-medium">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Category</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    {...register('category')}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl transition-all outline-none text-slate-700 appearance-none"
                  >
                    <option value="">Select category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Documents">Documents</option>
                    <option value="Personal Effects">Personal Effects</option>
                    <option value="Keys">Keys</option>
                    <option value="Bags">Bags</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.category && <p className="mt-1 text-xs text-rose-500 px-1 font-medium">{errors.category.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Date {isFound ? 'Found' : 'Lost'}</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    {...register('date')}
                    type="date"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl transition-all outline-none text-slate-700"
                  />
                </div>
                {errors.date && <p className="mt-1 text-xs text-rose-500 px-1 font-medium">{errors.date.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Specific Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    {...register('location')}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl transition-all outline-none text-slate-700"
                    placeholder="e.g. Chemistry Lab, Desk 4"
                  />
                </div>
                {errors.location && <p className="mt-1 text-xs text-rose-500 px-1 font-medium">{errors.location.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Description</label>
                <textarea
                  {...register('description')}
                  rows="4"
                  className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl transition-all outline-none text-slate-700"
                  placeholder="Include color, brand, unique markings..."
                ></textarea>
                {errors.description && <p className="mt-1 text-xs text-rose-500 px-1 font-medium">{errors.description.message}</p>}
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-lg font-bold transition-all active:scale-95 shadow-lg ${
                isFound ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
              } text-white disabled:opacity-70`}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Submit Report</span>
                  <Send size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar / Instructions */}
        <div className="space-y-8">
           <div className="glass-card p-8 rounded-[40px] space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Image className="text-sky-500" size={20} />
                Item Photo
              </h3>
              <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 group hover:border-sky-500 transition-colors">
                 {preview ? (
                   <>
                     <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                     <button 
                       onClick={() => setPreview(null)}
                       className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full text-rose-500 shadow-lg hover:scale-110 transition-transform"
                     >
                       <Plus className="rotate-45" size={20} />
                     </button>
                   </>
                 ) : (
                   <div className="text-center p-6 cursor-pointer" onClick={() => document.getElementById('image-upload').click()}>
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300 group-hover:text-sky-500 transition-colors">
                        <Plus size={32} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Click to upload</p>
                      <p className="text-[10px] text-slate-400 mt-2">JPG, PNG up to 5MB</p>
                   </div>
                 )}
                 <input 
                   id="image-upload"
                   type="file" 
                   className="hidden" 
                   accept="image/*"
                   onChange={handleImageChange}
                 />
              </div>
           </div>

           <div className="bg-sky-50 p-8 rounded-[40px] border border-sky-100">
              <h3 className="text-lg font-bold text-sky-900 flex items-center gap-2 mb-4">
                <Info size={20} />
                Guidelines
              </h3>
              <ul className="space-y-4">
                 {[
                   'Be specific with the title.',
                   'Mention unique identifiers.',
                   'Double check the location.',
                   'Privacy is protected.'
                 ].map((t, i) => (
                   <li key={i} className="flex gap-3 text-sm text-sky-800 font-medium">
                      <div className="w-5 h-5 bg-sky-200 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      {t}
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}

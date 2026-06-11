import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  MapPin, 
  Calendar, 
  Tag, 
  Image as ImageIcon, 
  Send, 
  ArrowLeft, 
  Info,
  Plus,
  Upload
} from 'lucide-react';
import useItemStore from '../store/useItemStore';
import uploadApi from '../api/uploadApi';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import Badge from '../components/ui/Badge';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Please select a category'),
  location: z.string().min(3, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export default function ReportLostItem() {
  const navigate = useNavigate();
  const { addItem } = useItemStore();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      let imageUrl = 'https://placehold.co/600x400/020617/FFFFFF?text=No+Image+Available';
      
      if (imageFile) {
        const uploadRes = await uploadApi.uploadImage(imageFile);
        if (uploadRes.success) {
          imageUrl = uploadRes.url;
        }
      }

      await addItem({
        ...data,
        status: 'lost',
        image: imageUrl
      });
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      console.error('Failed to submit lost item:', err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20 pt-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-2 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            Report <span className="text-rose-500">Lost Item</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Provide detailed information about your missing item. The more details you give, the higher the chance of a match.
          </p>
        </div>
        <Badge variant="danger" className="h-fit py-2 px-4 text-xs">Lost Reporting Mode</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <form className="glass-card p-10 rounded-[3rem] border-white/5 space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <InputField
                  label="Item Title"
                  icon={Package}
                  placeholder="e.g. Blue Nike Backpack"
                  error={errors.title?.message}
                  {...register('title')}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] px-1">Category</label>
                <div className="relative group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={18} />
                  <select
                    {...register('category')}
                    className="input-field pl-12 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">Select category</option>
                    <option value="Electronics" className="bg-slate-900">Electronics</option>
                    <option value="Documents" className="bg-slate-900">Documents</option>
                    <option value="Personal Effects" className="bg-slate-900">Personal Effects</option>
                    <option value="Keys" className="bg-slate-900">Keys</option>
                    <option value="Bags" className="bg-slate-900">Bags</option>
                    <option value="Money" className="bg-slate-900">Money / Cash</option>
                    <option value="Cards" className="bg-slate-900">Cards (ATM / ID)</option>
                    <option value="Other" className="bg-slate-900">Other</option>
                  </select>
                </div>
                {errors.category && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest px-1">{errors.category.message}</p>}
              </div>

              <InputField
                label="Date Lost"
                type="date"
                icon={Calendar}
                error={errors.date?.message}
                {...register('date')}
              />

              <div className="md:col-span-2">
                <InputField
                  label="Specific Location"
                  icon={MapPin}
                  placeholder="e.g. Chemistry Lab, Desk 4"
                  error={errors.location?.message}
                  {...register('location')}
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] px-1">Description</label>
                <textarea
                  {...register('description')}
                  rows="5"
                  className="input-field p-6 min-h-[150px] resize-none"
                  placeholder="Include color, brand, unique markings..."
                ></textarea>
                {errors.description && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest px-1">{errors.description.message}</p>}
              </div>
            </div>

            <Button
              loading={loading}
              type="submit"
              variant="secondary"
              size="xl"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white border-transparent"
              icon={Send}
            >
              Submit Lost Report
            </Button>
          </form>
        </div>

        <div className="space-y-10">
           {/* Image Upload */}
           <div className="glass-card p-10 rounded-[3rem] border-white/5 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                <ImageIcon className="text-brand-gold" size={20} />
                Item Photo
              </h3>
              <div 
                onClick={() => document.getElementById('image-upload').click()}
                className="relative aspect-square rounded-3xl overflow-hidden border-2 border-dashed border-white/10 flex flex-col items-center justify-center bg-white/5 group hover:border-brand-gold/50 transition-all cursor-pointer"
              >
                 {preview ? (
                   <>
                     <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload size={32} className="text-white" />
                     </div>
                   </>
                 ) : (
                   <div className="text-center p-6">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-500 group-hover:text-brand-gold transition-colors">
                        <Plus size={32} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Click to upload</p>
                      <p className="text-[8px] font-bold text-slate-600 mt-2">JPG, PNG up to 5MB</p>
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

           {/* Tips */}
           <div className="bg-brand-blue/30 p-10 rounded-[3rem] border border-white/5 backdrop-blur-md">
              <h3 className="text-sm font-black text-brand-gold flex items-center gap-3 mb-8 uppercase tracking-widest">
                <Info size={20} />
                Pro Tips
              </h3>
              <ul className="space-y-6">
                 {[
                   'Be very specific with the item title.',
                   'Mention unique scratches or stickers.',
                   'Double check the last seen location.',
                   'Add a photo if you have one from before.'
                 ].map((t, i) => (
                   <li key={i} className="flex gap-4 text-xs text-slate-300 font-medium leading-relaxed">
                      <div className="w-6 h-6 bg-brand-gold/10 rounded-lg flex items-center justify-center text-[10px] font-black text-brand-gold shrink-0">
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

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
  Upload,
  Trash2
} from 'lucide-react';
import useItemStore from '../store/useItemStore';
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

export default function ReportFoundItem() {
  const navigate = useNavigate();
  const { addItem } = useItemStore();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  
  // Verification Questions State (Enforced 3-5 range)
  const [questions, setQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const addQuestion = () => {
    if (questions.length < 5) {
      setQuestions([...questions, { question: '', answer: '' }]);
    }
  };

  const removeQuestion = (index) => {
    if (questions.length > 3) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const onSubmit = (data) => {
    // Filter out empty questions
    const validQuestions = questions.filter(q => q.question.trim() && q.answer.trim());
    
    setLoading(true);
    setTimeout(() => {
      addItem({
        ...data,
        status: 'found',
        image: preview || 'https://images.unsplash.com/photo-1586769852044-692d6e3703a0?auto=format&fit=crop&w=800&q=80',
        postedBy: 'Demo User',
        verificationQuestions: validQuestions,
        contactInfo: {
          phone: '+234 812 345 6789',
          email: 'finder@campus.edu'
        }
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

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20 pt-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-2 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            Report <span className="text-emerald-400">Found Item</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Did you find something on campus? Help it find its way back to its owner by providing accurate details.
          </p>
        </div>
        <Badge variant="success" className="h-fit py-2 px-4 text-xs">Found Reporting Mode</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <form className="glass-card p-10 rounded-[3rem] border-white/5 space-y-12" onSubmit={handleSubmit(onSubmit)}>
            {/* Basic Info */}
            <div className="space-y-8">
              <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-px bg-brand-gold/30"></span>
                Basic Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <InputField
                    label="What did you find?"
                    icon={Package}
                    placeholder="e.g. Silver Keychain with 3 keys"
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
                      <option value="Other" className="bg-slate-900">Other</option>
                    </select>
                  </div>
                  {errors.category && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest px-1">{errors.category.message}</p>}
                </div>

                <InputField
                  label="Date Found"
                  type="date"
                  icon={Calendar}
                  error={errors.date?.message}
                  {...register('date')}
                />

                <div className="md:col-span-2">
                  <InputField
                    label="Exact Location Found"
                    icon={MapPin}
                    placeholder="e.g. Near the Law Faculty entrance"
                    error={errors.location?.message}
                    {...register('location')}
                  />
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] px-1">Detailed Description</label>
                  <textarea
                    {...register('description')}
                    rows="4"
                    className="input-field p-6 min-h-[120px] resize-none"
                    placeholder="Include any identifying marks, color, or condition..."
                  ></textarea>
                  {errors.description && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest px-1">{errors.description.message}</p>}
                </div>
              </div>
            </div>

            {/* Verification Questions Builder */}
            <div className="space-y-8 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <span className="w-8 h-px bg-brand-gold/30"></span>
                  Security Questions
                </h2>
                <Badge variant="warning">Ownership Vetting</Badge>
              </div>
              
              <div className="p-6 bg-brand-blue/30 rounded-[2rem] border border-white/5 flex gap-4 mb-6">
                <Info size={20} className="text-brand-gold shrink-0 mt-1" />
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Set <span className="text-brand-gold font-bold">3-5</span> specific questions only the owner can answer. Claimers must score at least <span className="text-brand-gold font-bold">80%</span> to see your contact info.
                </p>
              </div>

              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div key={index} className="glass-card p-6 rounded-[2rem] border-white/5 space-y-6 relative group/q animate-fade-in">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Question {index + 1}</span>
                       {questions.length > 3 && (
                         <button 
                           type="button"
                           onClick={() => removeQuestion(index)}
                           className="text-rose-500 hover:text-rose-400 transition-colors"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <InputField
                         placeholder="e.g. What color is the inner lining?"
                         value={q.question}
                         onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                       />
                       <InputField
                         placeholder="Answer (One word preferred)"
                         value={q.answer}
                         onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                       />
                    </div>
                  </div>
                ))}
                
                {questions.length < 5 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    icon={Plus}
                    onClick={addQuestion}
                    className="w-full border-dashed border-white/10 hover:border-brand-gold/30"
                  >
                    Add Security Question
                  </Button>
                )}
              </div>
            </div>

            <Button
              loading={loading}
              type="submit"
              variant="accent"
              size="xl"
              className="w-full"
              icon={Send}
            >
              Submit Found Report
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

           {/* Security Warning */}
           <div className="bg-amber-950/20 p-10 rounded-[3rem] border border-amber-900/30 backdrop-blur-sm">
              <h3 className="text-sm font-black text-amber-500 flex items-center gap-3 mb-8 uppercase tracking-widest">
                <Info size={20} />
                Safety First
              </h3>
              <ul className="space-y-6">
                 {[
                   'Never give the item to someone without proof.',
                   'Use the built-in messaging system.',
                   'Meet in well-lit, public campus areas.',
                   'You can drop the item at the Security Office.'
                 ].map((t, i) => (
                   <li key={i} className="flex gap-4 text-xs text-amber-200/70 font-medium leading-relaxed">
                      <div className="w-6 h-6 bg-amber-900/40 rounded-lg flex items-center justify-center text-[10px] font-black text-amber-500 shrink-0">
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

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package, MapPin, Calendar, Tag, Image as ImageIcon,
  Send, ArrowLeft, Info, Plus, Upload, Trash2,
  AlertTriangle, ShieldCheck, Lightbulb, Eye, EyeOff
} from 'lucide-react';
import useItemStore from '../store/useItemStore';
import uploadApi from '../api/uploadApi';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import Badge from '../components/ui/Badge';
import { toast } from 'sonner';

/* ── Per-category config ─────────────────────────────────────── */
const CATEGORY_CONFIG = {
  Money: {
    level: 'critical',
    title: '⚠️ Cash / Money Found',
    warning: 'Anyone can claim to own money. The system requires ALL answers correct (3/3) for cash items. Set very specific questions that only the real owner would know.',
    suggestions: [
      { q: 'What denomination(s) were in the wallet/envelope?', a: '' },
      { q: 'What type of container was the money in (wallet, envelope, bag)?', a: '' },
      { q: 'What color/brand was the container?', a: '' },
      { q: 'Approximately how much money was there in total?', a: '' },
    ],
  },
  Cards: {
    level: 'critical',
    title: '⚠️ ATM / ID Cards Found',
    warning: 'IMPORTANT: Please blur or cover the card number, expiry date, and CVV in your photo. Do NOT post a clear image of any card. Use those blurred details as verification questions below.',
    suggestions: [
      { q: 'What are the last 4 digits of the card number?', a: '' },
      { q: 'What is the full name printed on the card?', a: '' },
      { q: 'What bank or institution issued this card?', a: '' },
      { q: 'What is the card expiry month and year?', a: '' },
    ],
  },
  Documents: {
    level: 'warning',
    title: '📄 Documents Found',
    warning: 'Please blur any ID numbers, file numbers, or sensitive information in your photo. Add those details as verification questions so only the real owner can answer them.',
    suggestions: [
      { q: 'What is the full name on the document?', a: '' },
      { q: 'What type of document is this?', a: '' },
      { q: 'What institution or body issued this document?', a: '' },
      { q: 'What is the document reference or file number (last 4 digits)?', a: '' },
    ],
  },
  Keys: {
    level: 'info',
    title: '🔑 Keys Found',
    warning: 'Good questions to ask: number of keys on the ring, keychain description, or what the keys are for.',
    suggestions: [
      { q: 'How many keys are on the ring?', a: '' },
      { q: 'What does the keychain look like?', a: '' },
      { q: 'What is the key used for (e.g. room, car, locker)?', a: '' },
    ],
  },
  Bags: {
    level: 'info',
    title: '🎒 Bag Found',
    warning: 'Ask about the brand, color, and contents. Contents questions are the most reliable identifiers.',
    suggestions: [
      { q: 'What is the brand of the bag?', a: '' },
      { q: 'What color is the bag lining or interior?', a: '' },
      { q: 'Name one item that was inside the bag.', a: '' },
    ],
  },
  Electronics: {
    level: 'info',
    title: '📱 Electronics Found',
    warning: 'Serial numbers, IMEI, or physical damage descriptions make the best verification questions.',
    suggestions: [
      { q: 'What brand and model is the device?', a: '' },
      { q: 'What color is the phone case or device?', a: '' },
      { q: 'Describe any physical damage or sticker on the device.', a: '' },
    ],
  },
};

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Please select a category'),
  location: z.string().min(3, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

const CATEGORIES = ['Electronics', 'Documents', 'Personal Effects', 'Keys', 'Bags', 'Money', 'Cards', 'Other'];

export default function ReportFoundItem() {
  const navigate = useNavigate();
  const { addItem } = useItemStore();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [revealAnswers, setRevealAnswers] = useState({});

  const [questions, setQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const selectedCategory = watch('category');
  const categoryConfig = CATEGORY_CONFIG[selectedCategory];

  // Auto-fill suggestion questions when category changes
  const prevCategoryRef = useRef('');
  useEffect(() => {
    if (selectedCategory && selectedCategory !== prevCategoryRef.current && categoryConfig?.suggestions) {
      setQuestions(
        categoryConfig.suggestions.map(s => ({ question: s.q, answer: s.a }))
      );
      prevCategoryRef.current = selectedCategory;
    }
  }, [selectedCategory, categoryConfig]);

  const addQuestion = () => {
    if (questions.length < 5) setQuestions([...questions, { question: '', answer: '' }]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 3) setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const toggleReveal = (index) => {
    setRevealAnswers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const onSubmit = async (data) => {
    const validQuestions = questions.filter(q => q.question.trim() && q.answer.trim());
    if (validQuestions.length < 3) {
      toast.error('You must fill in at least 3 complete verification questions (question + answer).');
      return;
    }

    try {
      setLoading(true);
      let imageUrl = 'https://placehold.co/600x400/020617/FFFFFF?text=No+Image+Available';

      if (imageFile) {
        const uploadRes = await uploadApi.uploadImage(imageFile);
        if (uploadRes.success) imageUrl = uploadRes.url;
      }

      await addItem({
        ...data,
        status: 'found',
        image: imageUrl,
        verificationQuestions: validQuestions,
      });

      toast.success('Found item reported successfully!');
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || 'Failed to submit. Please try again.');
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

  const warningStyles = {
    critical: 'bg-rose-950/30 border-rose-500/40 text-rose-300',
    warning: 'bg-amber-950/30 border-amber-500/40 text-amber-200',
    info: 'bg-brand-blue/30 border-white/10 text-slate-300',
  };

  const warningIconStyles = {
    critical: 'text-rose-500',
    warning: 'text-amber-500',
    info: 'text-brand-gold',
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
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            Report <span className="text-emerald-400">Found Item</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Did you find something on campus? Help it find its way back to its owner.
          </p>
        </div>
        <Badge variant="success" className="h-fit py-2 px-4 text-xs">Found Reporting Mode</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <form className="glass-card p-10 rounded-[3rem] border-white/5 space-y-12" onSubmit={handleSubmit(onSubmit)}>

            {/* ── Basic Details ── */}
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
                    <select {...register('category')} className="input-field pl-12 appearance-none cursor-pointer">
                      <option value="" className="bg-slate-900">Select category</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c} className="bg-slate-900">{c}</option>
                      ))}
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
                    placeholder="e.g. Near the Law Faculty entrance, Block B staircase"
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
                    placeholder="Include colour, size, any visible marks or condition..."
                  />
                  {errors.description && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest px-1">{errors.description.message}</p>}
                </div>
              </div>
            </div>

            {/* ── Category Warning Banner ── */}
            {categoryConfig && (
              <div className={`p-6 rounded-[2rem] border flex gap-4 animate-fade-in ${warningStyles[categoryConfig.level]}`}>
                <AlertTriangle size={20} className={`${warningIconStyles[categoryConfig.level]} shrink-0 mt-0.5`} />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest">{categoryConfig.title}</p>
                  <p className="text-xs leading-relaxed opacity-80">{categoryConfig.warning}</p>
                </div>
              </div>
            )}

            {/* ── Verification Questions Builder ── */}
            <div className="space-y-8 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <span className="w-8 h-px bg-brand-gold/30"></span>
                  Ownership Questions
                </h2>
                <Badge variant={selectedCategory === 'Money' || selectedCategory === 'Cards' ? 'danger' : 'warning'}>
                  {selectedCategory === 'Money' || selectedCategory === 'Cards' ? 'All must pass' : '2 of 3 must pass'}
                </Badge>
              </div>

              <div className="p-6 bg-brand-blue/30 rounded-[2rem] border border-white/5 flex gap-4">
                <ShieldCheck size={20} className="text-brand-gold shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-white uppercase tracking-widest">How this works</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You set the questions and answers. The claimer only sees the questions — they type their answers.
                    The system auto-grades using fuzzy matching (ignores casing, punctuation, word order, and small typos).
                    {selectedCategory === 'Money' || selectedCategory === 'Cards'
                      ? ' For this category, the claimer must get ALL questions correct.'
                      : ' The claimer must get at least 2 correct to unlock your contact details.'}
                  </p>
                </div>
              </div>

              {categoryConfig?.suggestions && (
                <div className="p-5 bg-emerald-500/5 rounded-[1.5rem] border border-emerald-500/20 flex gap-3">
                  <Lightbulb size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-300/80">
                    We pre-filled suggested questions for this category. Edit them to match this specific item.
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div key={index} className="glass-card p-6 rounded-[2rem] border-white/5 space-y-5 relative animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-brand-gold/10 text-brand-gold rounded-lg flex items-center justify-center text-[10px] font-black border border-brand-gold/20">
                          Q{index + 1}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {index < 3 ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      {questions.length > 3 && (
                        <button type="button" onClick={() => removeQuestion(index)} className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1">
                          Question <span className="text-rose-500">*</span>
                        </label>
                        <input
                          className="input-field w-full"
                          placeholder="e.g. What color is the inner lining of the bag?"
                          value={q.question}
                          onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1">
                          Correct Answer <span className="text-rose-500">*</span>
                          <span className="text-slate-600 normal-case ml-2 font-medium">(hidden from claimer)</span>
                        </label>
                        <div className="relative">
                          <input
                            className="input-field w-full pr-12"
                            type={revealAnswers[index] ? 'text' : 'password'}
                            placeholder="Enter the correct answer"
                            value={q.answer}
                            onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => toggleReveal(index)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-gold transition-colors"
                          >
                            {revealAnswers[index] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
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
                    Add Another Question ({questions.length}/5)
                  </Button>
                )}
              </div>
            </div>

            <Button loading={loading} type="submit" variant="accent" size="xl" className="w-full" icon={Send}>
              Submit Found Report
            </Button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          {/* Image Upload */}
          <div className="glass-card p-10 rounded-[3rem] border-white/5 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
              <ImageIcon className="text-brand-gold" size={20} />
              Item Photo
            </h3>
            {(selectedCategory === 'Cards' || selectedCategory === 'Documents') && (
              <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl flex gap-3">
                <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-rose-300 font-bold leading-relaxed">
                  Blur or crop out all sensitive details before uploading.
                </p>
              </div>
            )}
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
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500 group-hover:text-brand-gold transition-colors">
                    <Plus size={32} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Click to upload</p>
                  <p className="text-[8px] font-bold text-slate-600 mt-2">JPG, PNG up to 5MB</p>
                </div>
              )}
              <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-amber-950/20 p-10 rounded-[3rem] border border-amber-900/30 backdrop-blur-sm">
            <h3 className="text-sm font-black text-amber-500 flex items-center gap-3 mb-8 uppercase tracking-widest">
              <Info size={20} />
              Safety First
            </h3>
            <ul className="space-y-6">
              {[
                'Never hand over the item without verification.',
                'Meet in well-lit, public campus areas.',
                'You can drop the item at the Security Office.',
                'Your contact info is only shared after the claimer passes the quiz.',
              ].map((t, i) => (
                <li key={i} className="flex gap-4 text-xs text-amber-200/70 font-medium leading-relaxed">
                  <div className="w-6 h-6 bg-amber-900/40 rounded-lg flex items-center justify-center text-[10px] font-black text-amber-500 shrink-0">{i + 1}</div>
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

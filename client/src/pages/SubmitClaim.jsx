import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useItemStore from '../store/useItemStore';
import { 
  ShieldCheck, 
  ArrowLeft, 
  FileText, 
  Info,
  Send,
  Lock
} from 'lucide-react';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import Badge from '../components/ui/Badge';
import claimApi from '../api/claimApi';

export default function SubmitClaim() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items } = useItemStore();
  const item = items.find(i => (i._id || i.id) === id);
  
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null); // { score: number, passed: boolean }

  if (!item) return <div className="text-white p-20 text-center font-black">ITEM NOT FOUND</div>;

  const questions = item.verificationQuestions || [];
  const hasQuestions = questions.length > 0;

  const handleAnswerChange = (index, value) => {
    setAnswers({ ...answers, [index]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedAnswers = questions.map((q, index) => ({
        question: q.question,
        providedAnswer: answers[index] || ''
      }));

      await claimApi.submitClaim(item._id || item.id, formattedAnswers);
      
      setResult({ submitted: true });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      alert(err.response?.data?.message || 'Failed to submit claim. You may have already submitted one.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link to={`/item/${id}`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-2 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Item
          </Link>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            Verify <span className="text-brand-gold">Ownership</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            You are claiming: <span className="text-white font-bold">{item.title}</span>. 
            {hasQuestions 
              ? ' Please answer the security questions below to verify ownership.' 
              : ' Provide detailed evidence to verify you are the rightful owner.'}
          </p>
        </div>
        <Badge variant={result?.submitted ? 'success' : 'warning'}>
          {result?.submitted ? 'Claim Pending' : 'Verification Required'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
           {result?.submitted ? (
             /* Success State - Pending Approval */
             <div className="glass-card p-10 rounded-[3rem] border-emerald-500/30 bg-emerald-500/5 space-y-8 animate-scale-in">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-brand-blue-dark shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                      <ShieldCheck size={32} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">Claim Submitted!</h2>
                      <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mt-1">Pending Finder Approval</p>
                   </div>
                </div>

                <div className="p-8 bg-brand-blue/40 rounded-[2rem] border border-white/5 space-y-6">
                   <p className="text-sm text-slate-300 font-medium leading-relaxed">
                      Your claim has been securely sent to the finder. They will review your answers to their security questions. If approved, you will receive an email with their contact information to arrange a safe retrieval.
                   </p>
                </div>

                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="w-full">Return to Dashboard</Button>
             </div>
           ) : (
             /* Form State */
             <form className="glass-card p-10 rounded-[3rem] border-white/5 space-y-10" onSubmit={handleSubmit}>


                <div className="space-y-8">
                   {hasQuestions ? (
                     /* Render Security Questions */
                     questions.map((q, index) => (
                       <div key={index} className="space-y-4">
                          <InputField
                            label={`Question ${index + 1}`}
                            placeholder={q.question}
                            value={answers[index] || ''}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            required
                            className="bg-transparent"
                          />
                          <p className="text-[10px] text-slate-500 font-medium italic px-1">Answer the above question as accurately as possible.</p>
                       </div>
                     ))
                   ) : (
                     /* Fallback for items without questions */
                     <div className="space-y-6">
                        <div className="space-y-3">
                           <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] px-1">Verification Details</label>
                           <textarea
                              required
                              rows="6"
                              className="input-field p-6 min-h-[200px] resize-none"
                              placeholder="Please provide specific details to prove ownership (serial numbers, internal contents, etc)..."
                           ></textarea>
                        </div>
                        <InputField 
                           label="Proof URL (Optional)" 
                           icon={Lock} 
                           placeholder="Link to a photo or invoice" 
                        />
                     </div>
                   )}
                </div>

                <div className="pt-6">
                   <Button 
                      loading={loading}
                      type="submit" 
                      variant="accent" 
                      size="xl" 
                      className="w-full"
                      icon={ShieldCheck}
                   >
                      Verify & Reveal Contact
                   </Button>
                </div>
             </form>
           )}
        </div>

        <div className="space-y-10">
           <div className="glass-card p-10 rounded-[3rem] border-white/5 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Info className="text-brand-gold" size={20} />
                Security Process
              </h3>
              <div className="space-y-6">
                 {[
                   'Answer all security questions.',
                   'Score 80% or higher to pass.',
                   'Get instant access to finder details.',
                   'Arrange a safe public meet-up.'
                 ].map((step, i) => (
                   <div key={i} className="flex gap-4 items-center">
                      <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-500 border border-white/10 shrink-0">
                         0{i + 1}
                      </div>
                      <span className="text-xs font-bold text-slate-300 leading-tight">{step}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-rose-950/20 p-10 rounded-[3rem] border border-rose-900/30 backdrop-blur-sm">
              <p className="text-[10px] text-rose-300/70 leading-relaxed font-medium">
                 <span className="font-black text-rose-500 uppercase tracking-widest block mb-2">Legal Notice</span> 
                 False ownership claims are a violation of campus policy and may lead to disciplinary action.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}


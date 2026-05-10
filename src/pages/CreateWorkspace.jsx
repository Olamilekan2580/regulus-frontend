import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Rocket, ArrowRight, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function CreateWorkspace() {
  const [orgName, setOrgName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    const res = await api.post('/orgs', { name: orgName });
    
    // Sync the storage
    localStorage.setItem('current_org_id', res.data.id);
    localStorage.setItem('current_org_name', res.data.name);

    // Redirect to home
    window.location.href = '/'; 
  } catch (err) {
    alert('Failed to create workspace.');
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-white/10 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          <Building2 size={32} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-3xl font-black text-navy mb-2 tracking-tight">Launch Your Agency</h1>
        <p className="text-gray-500 mb-8 font-medium leading-relaxed">
          Welcome to Regulus. To get started, give your workspace a name. This will appear on your invoices and client portals.
        </p>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Agency Brand Name</label>
            <input 
              required
              type="text"
              autoFocus
              placeholder="e.g. Omole Systems Architect"
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-accent text-navy font-bold transition-all placeholder:text-gray-300"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !orgName.trim()}
            className="w-full py-4 bg-navy text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-navy/90 hover:shadow-xl hover:shadow-navy/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Rocket size={20} />}
            {isSubmitting ? 'Provisioning Workspace...' : 'Create My Workspace'}
            {!isSubmitting && <ArrowRight size={18} className="ml-auto opacity-50" />}
          </button>
        </form>
      </div>
    </div>
  );
}
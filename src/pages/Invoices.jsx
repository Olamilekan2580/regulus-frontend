import { useState, useEffect } from 'react';
import { Plus, Receipt, Calendar, DollarSign, Download, Trash2, PlusCircle, AlertCircle, Send, Link as LinkIcon, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  CAD: 'CA$'
};

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ 
    client_id: '', 
    project_id: '', 
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`, 
    currency: 'USD',
    status: 'Draft', 
    due_date: '',
    line_items: [{ description: '', quantity: 1, rate: 0 }]
  });

  const fetchData = async () => {
    try {
      const [invRes, clientRes, projRes] = await Promise.all([
        api.get('/invoices'), 
        api.get('/clients'),
        api.get('/projects').catch(() => ({ data: [] }))
      ]);
      
      const safeInvoices = Array.isArray(invRes.data) ? invRes.data : (invRes.data?.data || []);
      const safeClients = Array.isArray(clientRes.data) ? clientRes.data : (clientRes.data?.data || []);
      const safeProjects = Array.isArray(projRes.data) ? projRes.data : (projRes.data?.data || []);

      setInvoices(safeInvoices);
      setClients(safeClients);
      setProjects(safeProjects);
      
      if (safeClients.length > 0) {
        setFormData(prev => ({ ...prev, client_id: safeClients[0].id }));
      }
    } catch (err) { 
      console.error('[Fetch Error]:', err); 
      setInvoices([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { description: '', quantity: 1, rate: 0 }]
    }));
  };

  const handleRemoveLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...formData.line_items];
    updatedItems[index][field] = value;
    setFormData({ ...formData, line_items: updatedItems });
  };

  const calculateTotal = () => {
    return formData.line_items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.rate || 0)), 0);
  };

  const getClientDetails = (clientId) => {
    const foundClient = clients.find(c => c.id === clientId);
    if (!foundClient) return { name: 'Unknown Client', email: 'No email provided' };
    return {
      name: foundClient.company || foundClient.name || 'Unknown Client',
      email: foundClient.email || 'No email provided'
    };
  };

  // 🔒 THE FIX: Scoped correctly outside of handleSubmit
  const handleCopyLink = (id) => {
    const publicUrl = `${window.location.origin}/invoices/${id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 🔒 THE FIX: Replaces updateStatus and talks directly to the DB
  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/invoices/${id}`, { status: newStatus });
      fetchData(); 
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update invoice status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const orgId = localStorage.getItem('current_org_id');
    
    if (!orgId) {
      setError('Workspace context missing. Please refresh.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const sanitizedPayload = {
        ...formData,
        org_id: orgId,
        project_id: formData.project_id || null, 
        total: calculateTotal(),
        line_items: formData.line_items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 1,
          rate: parseFloat(item.rate) || 0
        }))
      };

      await api.post('/invoices', sanitizedPayload);
      
      setIsModalOpen(false);
      setFormData({
        client_id: clients.length > 0 ? clients[0].id : '',
        project_id: '',
        invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        currency: 'USD',
        status: 'Draft',
        due_date: '',
        line_items: [{ description: '', quantity: 1, rate: 0 }]
      });
      fetchData();
    } catch (err) { 
      console.error('Invoice Creation Error:', err.response?.data);
      setError(err.response?.data?.error || 'Database execution failed. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (invoice) => {
    setDownloadingId(invoice.id);
    try {
      const response = await api.get(`/invoices/${invoice.id}/pdf`, { responseType: 'blob' });
      const clientData = getClientDetails(invoice.client_id);
      const safeClientName = clientData.name.replace(/\s+/g, '_');
      const filename = `${invoice.invoice_number}_${safeClientName}.pdf`;

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF Download Failed:', err);
      alert('Server failed to generate the PDF document. Check backend logs.');
    } finally {
      setDownloadingId(null);
    }
  };

  const statusColors = {
    'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
    'Sent': 'bg-blue-50 text-blue-700 border-blue-200',
    'Paid': 'bg-accent/10 text-accent border-accent/20',
    'Overdue': 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Global billing and dynamic line items</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-navy/90 transition-all active:scale-95"
        >
          <Plus size={20} /> Create Invoice
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mr-3"></div>
          Syncing records...
        </div>
      ) : invoices?.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <Receipt size={40} className="text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-navy mb-2">Clean slate</h3>
          <p className="text-gray-500 text-sm max-w-xs mb-6 font-medium">No invoices found. Start by creating one for your clients.</p>
          <button onClick={() => setIsModalOpen(true)} className="bg-navy text-white px-6 py-2.5 rounded-lg font-bold">Initiate Billing</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map(invoice => {
            const client = getClientDetails(invoice.client_id);
            const symbol = currencySymbols[invoice.currency] || '$';
            return (
              <div key={invoice.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:border-accent/30 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-navy group-hover:text-accent transition-colors">
                      {invoice.invoice_number || `INV-${invoice.id.substring(0,4).toUpperCase()}`}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {client.name}
                    </p>
                  </div>
                  
                  <select 
                    value={invoice.status}
                    onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-all cursor-pointer outline-none appearance-none ${statusColors[invoice.status] || statusColors['Draft']}`}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-2xl font-black text-navy">
                    <span className="text-gray-300 mr-1">{symbol}</span>
                    {parseFloat(invoice.total).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                  <div className="text-xs text-gray-400 flex items-center gap-2 font-medium">
                    <Calendar size={14} /> {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon receipt'}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(invoice)}
                      disabled={downloadingId === invoice.id}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-accent transition-colors disabled:opacity-50 px-2 py-1.5"
                      title="Download PDF"
                    >
                      {downloadingId === invoice.id ? <div className="w-3 h-3 border-2 border-accent border-t-transparent animate-spin rounded-full" /> : <Download size={14} />}
                      {downloadingId === invoice.id ? 'SYNK' : 'PDF'}
                    </button>

                    <button 
                      onClick={() => handleCopyLink(invoice.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-navy transition-colors"
                      title="Copy Public Link"
                    >
                      {copiedId === invoice.id ? <Check size={14} className="text-green-500" /> : <LinkIcon size={14} />}
                    </button>
                    
                    <button 
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Send size={14} /> View / Pay
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative overflow-hidden">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-navy">Create Invoice</h2>
                <p className="text-sm text-gray-500 font-medium">Add specific deliverables, hours, or services.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-navy transition-colors bg-white rounded-full p-1 border border-gray-200 shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium animate-in slide-in-from-top-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Client</label>
                    <select required className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 transition-all font-semibold text-sm appearance-none" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Project</label>
                    <select className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 transition-all font-semibold text-sm appearance-none" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                      <option value="">No Project Attached</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Due Date</label>
                    <input type="date" required className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-semibold text-sm outline-none focus:ring-2 focus:ring-accent/20 transition-all" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Line Items</label>
                    <select className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg text-xs font-bold outline-none cursor-pointer" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                      {Object.keys(currencySymbols).map(code => <option key={code} value={code}>{code} ({currencySymbols[code]})</option>)}
                    </select>
                  </div>

                  <div className="space-y-3">
                    {formData.line_items.map((item, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 items-start group">
                        <div className="flex-1 w-full">
                          <input type="text" placeholder="Description (e.g., API Integration)" required className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-accent transition-colors" value={item.description} onChange={e => handleLineItemChange(index, 'description', e.target.value)} />
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                          <div className="w-24 shrink-0">
                            <input type="number" min="1" step="0.5" placeholder="Qty" required className="w-full border border-gray-200 p-3 rounded-xl text-sm text-center outline-none focus:border-accent transition-colors" value={item.quantity} onChange={e => handleLineItemChange(index, 'quantity', e.target.value)} />
                          </div>
                          <div className="w-32 shrink-0">
                            <input type="number" min="0" step="0.01" placeholder="Rate" required className="w-full border border-gray-200 p-3 rounded-xl text-sm text-right outline-none focus:border-accent transition-colors" value={item.rate} onChange={e => handleLineItemChange(index, 'rate', e.target.value)} />
                          </div>
                          <button type="button" onClick={() => handleRemoveLineItem(index)} disabled={formData.line_items.length === 1} className="p-3 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-30 shrink-0">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={handleAddLineItem} className="mt-4 flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80 transition-colors">
                    <PlusCircle size={16} /> Add Item
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl flex justify-between items-center mt-6 border border-gray-100">
                  <span className="text-gray-500 font-bold uppercase text-sm tracking-wider">Total</span>
                  <span className="text-2xl font-black text-navy">{currencySymbols[formData.currency] || '$'}{calculateTotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-navy transition-colors">Discard</button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8 py-2.5 bg-navy text-white rounded-xl font-bold hover:shadow-lg hover:shadow-navy/20 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : 'Generate Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Plus, Receipt, Calendar, DollarSign } from 'lucide-react';
import api from '../lib/api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ 
    client_id: '', 
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`, 
    total: '', 
    status: 'Draft', 
    due_date: '' 
  });

  const fetchData = async () => {
    try {
      const [invRes, clientRes] = await Promise.all([
        api.get('/invoices'), 
        api.get('/clients')
      ]);
      setInvoices(invRes.data || []);
      setClients(clientRes.data || []);
      if (clientRes.data.length > 0) {
        setFormData(prev => ({ ...prev, client_id: clientRes.data[0].id }));
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', { ...formData, total: parseFloat(formData.total) });
      setIsModalOpen(false);
      fetchData();
    } catch (err) { 
      console.error('Failed to create'); 
    }
  };

  const updateStatus = async (id, newStatus) => {
    // Optimistic UI update
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
    try {
      await api.put(`/updates/invoices/${id}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update database');
      fetchData(); // Revert on failure
    }
  };

  const statusColors = {
    'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
    'Sent': 'bg-blue-50 text-blue-700 border-blue-200',
    'Paid': 'bg-green-50 text-green-700 border-green-200',
    'Overdue': 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage billing and payments</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-navy/90 transition-colors"
        >
          <Plus size={20} /> Create Invoice
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mr-3"></div>
          Loading invoices...
        </div>
      ) : invoices?.length === 0 ? (
        /* PREMIUM EMPTY STATE */
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Receipt size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-navy mb-2">No invoices yet</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Get paid faster. Create your first invoice and send it directly to your clients.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 bg-navy text-white px-6 py-2.5 rounded-lg font-medium shadow-sm hover:bg-navy/90 transition-colors"
          >
            <Plus size={18} /> Create First Invoice
          </button>
        </div>
      ) : (
        /* THE DATA GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map(invoice => (
            <div key={invoice.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-navy">{invoice.invoice_number}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{invoice.clients?.company || 'Unknown Client'}</p>
                </div>
                {/* INTERACTIVE STATUS DROPDOWN */}
                <select 
                  value={invoice.status}
                  onChange={(e) => updateStatus(invoice.id, e.target.value)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold border outline-none cursor-pointer appearance-none ${statusColors[invoice.status] || statusColors['Draft']}`}
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2 mb-6">
                <DollarSign size={20} className="text-gray-400" />
                <span className="text-2xl font-bold text-navy">{invoice.total}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-gray-50 pt-4">
                <Calendar size={14} className="text-gray-400" />
                Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon receipt'}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Premium Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-navy mb-1">Create Invoice</h2>
            <p className="text-sm text-gray-500 mb-6">Generate a new billing request.</p>
            
            {clients.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-600 mb-4 font-medium">You need to add a Client before creating an Invoice.</p>
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-navy text-white font-medium rounded-xl hover:bg-navy/90 transition-all">Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client *</label>
                  <select required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium appearance-none" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount ($) *</label>
                    <input type="number" step="0.01" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.total} onChange={e => setFormData({...formData, total: e.target.value})} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Date *</label>
                    <input type="date" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium text-gray-700" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-medium text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 font-medium text-sm bg-navy text-white rounded-xl hover:bg-navy/90 transition-all shadow-sm active:scale-95">Save Invoice</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
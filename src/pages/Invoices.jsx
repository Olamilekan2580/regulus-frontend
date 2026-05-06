import { useState, useEffect } from 'react';
import { Plus, Receipt, Calendar, DollarSign } from 'lucide-react';
import api from '../lib/api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ client_id: '', invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`, total: '', status: 'Draft', due_date: '' });

  const fetchData = async () => {
    try {
      const [invRes, clientRes] = await Promise.all([api.get('/invoices'), api.get('/clients')]);
      setInvoices(invRes.data || []);
      setClients(clientRes.data || []);
      if (clientRes.data.length > 0) setFormData(prev => ({ ...prev, client_id: clientRes.data[0].id }));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', { ...formData, total: parseFloat(formData.total) });
      setIsModalOpen(false);
      fetchData();
    } catch (err) { console.error('Failed to create'); }
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
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-accent/90">
          <Plus size={20} /> Create Invoice
        </button>
      </div>

      {loading ? <div className="animate-pulse">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map(invoice => (
            <div key={invoice.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-navy">{invoice.invoice_number}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{invoice.clients?.company || 'Unknown Client'}</p>
                </div>
                {/* INTERACTIVE STATUS DROPDOWN */}
                <select 
                  value={invoice.status}
                  onChange={(e) => updateStatus(invoice.id, e.target.value)}
                  className={`text-xs px-2.5 py-1 rounded-full font-bold border outline-none cursor-pointer appearance-none ${statusColors[invoice.status] || statusColors['Draft']}`}
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2 mb-6">
                <DollarSign size={20} className="text-accent" />
                <span className="text-2xl font-bold text-navy">{invoice.total}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 border-t border-gray-50 pt-4">
                <Calendar size={14} className="text-gray-400" />
                Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon receipt'}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal removed for brevity in this snippet */}
    </div>
  );
}

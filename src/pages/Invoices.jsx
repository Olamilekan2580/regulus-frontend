import { useState, useEffect } from 'react';
import { Plus, Receipt, Calendar, DollarSign, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import api from '../lib/api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  
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

  // ARCHITECTURE FIX: Maps client data locally to prevent "Unknown Client"
  const getClientDetails = (clientId) => {
    const foundClient = clients.find(c => c.id === clientId);
    if (!foundClient) return { name: 'Unknown Client', email: 'No email provided' };
    return {
      name: foundClient.company || foundClient.name || 'Unknown Client',
      email: foundClient.email || 'No email provided'
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', { ...formData, total: parseFloat(formData.total) });
      setIsModalOpen(false);
      fetchData();
    } catch (err) { 
      console.error('Failed to create invoice'); 
    }
  };

  const updateStatus = async (id, newStatus) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
    try {
      await api.put(`/invoices/${id}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status');
      fetchData(); 
    }
  };

  // CLIENT-SIDE ENGINE: Bypasses WSL/Backend deadlocks
  const handleDownload = async (invoice) => {
    setDownloadingId(invoice.id);
    
    try {
      const clientData = getClientDetails(invoice.client_id);
      const dateIssued = new Date(invoice.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Upon receipt';

      const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; padding: 60px; color: #0f172a; background: white; min-height: 1056px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #f8fafc; padding-bottom: 32px;">
            <div>
              <div style="font-size: 32px; font-weight: 900;">Regulus.</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">High-Performance Architecture</div>
            </div>
            <div style="text-align: right">
              <div style="font-size: 24px; font-weight: 800; color: #e2e8f0; text-transform: uppercase;">Invoice</div>
              <div style="font-size: 16px; font-weight: 600;">${invoice.invoice_number}</div>
            </div>
          </div>

          <div style="margin-top: 48px; display: flex; justify-content: space-between;">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 12px;">Billed To</div>
              <div style="font-weight: 700; font-size: 18px;">${clientData.name}</div>
              <div style="color: #64748b; font-size: 14px;">${clientData.email}</div>
            </div>
            <div style="text-align: right">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 8px;">Due Date</div>
              <div style="font-weight: 600; font-size: 14px;">${dueDate}</div>
            </div>
          </div>

          <table style="width: 100%; margin-top: 64px; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="text-align: left; padding: 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Description</th>
                <th style="text-align: right; padding: 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 24px 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px;">Professional Services & Automation</td>
                <td style="padding: 24px 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; font-weight: 600; text-align: right;">$${parseFloat(invoice.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 48px; text-align: right; background: #f8fafc; padding: 32px; border-radius: 16px; float: right; min-width: 300px;">
            <div style="font-size: 12px; text-transform: uppercase; font-weight: 800; color: #94a3b8;">Total Amount Due</div>
            <div style="font-size: 36px; font-weight: 900; color: #0f172a; margin-top: 8px;">$${parseFloat(invoice.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `Invoice_${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      const worker = html2pdf().set(opt).from(htmlContent).save();
      await worker;

    } catch (err) {
      console.error('PDF Generation Failed:', err);
      alert('Local PDF generation failed. Check browser console.');
    } finally {
      setDownloadingId(null);
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
      {/* Header section... */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage billing and payments</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-navy/90">
          <Plus size={20} /> Create Invoice
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mr-3"></div>
          Loading invoices...
        </div>
      ) : invoices?.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <Receipt size={32} className="text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-navy mb-2">No invoices yet</h3>
          <button onClick={() => setIsModalOpen(true)} className="bg-navy text-white px-6 py-2.5 rounded-lg mt-4">Create First Invoice</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map(invoice => {
            const client = getClientDetails(invoice.client_id);
            return (
              <div key={invoice.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-navy">{invoice.invoice_number}</h3>
                    <p className="text-sm text-gray-500">{client.name}</p>
                  </div>
                  <select 
                    value={invoice.status}
                    onChange={(e) => updateStatus(invoice.id, e.target.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold border ${statusColors[invoice.status]}`}
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
                
                <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar size={14} /> Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon receipt'}
                  </div>
                  
                  <button
                    onClick={() => handleDownload(invoice)}
                    disabled={downloadingId === invoice.id}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-navy disabled:opacity-50"
                  >
                    {downloadingId === invoice.id ? <div className="w-3 h-3 border-2 border-navy border-t-transparent animate-spin rounded-full" /> : <Download size={14} />}
                    {downloadingId === invoice.id ? 'Generating...' : 'PDF'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Modal remains the same... */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold text-navy mb-6">Create Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client *</label>
                <select required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount ($) *</label>
                  <input type="number" step="0.01" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl" value={formData.total} onChange={e => setFormData({...formData, total: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Date *</label>
                  <input type="date" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-navy text-white rounded-xl">Save Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
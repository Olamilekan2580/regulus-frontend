import { useState, useEffect } from 'react';
import { Plus, Receipt, Calendar, DollarSign, Download, CheckCircle, Trash2, PlusCircle } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import api from '../lib/api';

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  CAD: 'CA$'
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  
  // UPGRADE: Added line_items array to state
  const [formData, setFormData] = useState({ 
    client_id: '', 
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`, 
    currency: 'USD',
    status: 'Draft', 
    due_date: '',
    line_items: [{ description: '', quantity: 1, rate: 0 }]
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

  // --- LINE ITEM LOGIC ---
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

  // Auto-calculate total from line items
  const calculateTotal = () => {
    return formData.line_items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.rate || 0)), 0);
  };
  // -----------------------

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
      // Calculate final total right before sending
      const finalTotal = calculateTotal();
      
      await api.post('/invoices', { 
        ...formData, 
        total: finalTotal 
      });
      
      setIsModalOpen(false);
      // Reset form
      setFormData({
        client_id: clients.length > 0 ? clients[0].id : '',
        invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        currency: 'USD',
        status: 'Draft',
        due_date: '',
        line_items: [{ description: '', quantity: 1, rate: 0 }]
      });
      fetchData();
    } catch (err) { 
      console.error('Failed to create invoice', err); 
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

  const handleDownload = async (invoice) => {
    setDownloadingId(invoice.id);
    const symbol = currencySymbols[invoice.currency] || '$';
    
    try {
      const clientData = getClientDetails(invoice.client_id);
      const dateIssued = new Date(invoice.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Upon receipt';

      const watermark = invoice.status === 'Paid' 
        ? `<div style="position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 150px; font-weight: 900; color: rgba(0, 200, 150, 0.08); z-index: 0; pointer-events: none; letter-spacing: 15px;">PAID</div>` 
        : '';

      // UPGRADE: Dynamically loop through line items to generate HTML rows
      const itemsHtml = (invoice.line_items || []).map(item => `
        <tr>
          <td style="padding: 24px 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px;">${item.description || 'Service'}</td>
          <td style="padding: 24px 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; text-align: center;">${item.quantity}</td>
          <td style="padding: 24px 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; text-align: right;">${symbol}${parseFloat(item.rate).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
          <td style="padding: 24px 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; font-weight: 600; text-align: right;">${symbol}${(item.quantity * item.rate).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <div style="font-family: 'Inter', system-ui, sans-serif; padding: 60px; color: #0A0F1E; background: white; min-height: 1056px; position: relative;">
          ${watermark}
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #f8fafc; padding-bottom: 32px; position: relative; z-index: 1;">
            <div>
              <div style="font-size: 32px; font-weight: 900; color: #0A0F1E;">Regulus.</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">High-Performance Architecture</div>
            </div>
            <div style="text-align: right">
              <div style="font-size: 24px; font-weight: 800; color: #e2e8f0; text-transform: uppercase;">Invoice</div>
              <div style="font-size: 16px; font-weight: 600;">${invoice.invoice_number}</div>
            </div>
          </div>

          <div style="margin-top: 48px; display: flex; justify-content: space-between; position: relative; z-index: 1;">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 12px;">Billed To</div>
              <div style="font-weight: 700; font-size: 18px;">${clientData.name}</div>
              <div style="color: #64748b; font-size: 14px;">${clientData.email}</div>
            </div>
            <div style="text-align: right">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 8px;">Date Issued</div>
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 16px;">${dateIssued}</div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 8px;">Due Date</div>
              <div style="font-weight: 600; font-size: 14px;">${dueDate}</div>
            </div>
          </div>

          <table style="width: 100%; margin-top: 64px; border-collapse: collapse; position: relative; z-index: 1;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="text-align: left; padding: 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Description</th>
                <th style="text-align: center; padding: 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Qty / Hrs</th>
                <th style="text-align: right; padding: 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Rate</th>
                <th style="text-align: right; padding: 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 48px; text-align: right; background: #f8fafc; padding: 32px; border-radius: 16px; float: right; min-width: 300px; position: relative; z-index: 1;">
            <div style="font-size: 12px; text-transform: uppercase; font-weight: 800; color: #94a3b8;">Total Amount Due</div>
            <div style="font-size: 36px; font-weight: 900; color: #0A0F1E; margin-top: 8px;">${symbol}${parseFloat(invoice.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `${invoice.invoice_number}_${clientData.name.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(htmlContent).save();

    } catch (err) {
      console.error('PDF Generation Failed:', err);
      alert('Local PDF generation failed.');
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
          <p className="text-sm text-gray-500 mt-1">Global billing and dynamic line items</p>
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
          <p className="text-gray-500 text-sm max-w-xs mb-6">No invoices found. Start by creating one for your clients.</p>
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
                    <h3 className="font-bold text-lg text-navy group-hover:text-accent transition-colors">{invoice.invoice_number}</h3>
                    <p className="text-sm text-gray-500 font-medium">{client.name}</p>
                  </div>
                  <select 
                    value={invoice.status}
                    onChange={(e) => updateStatus(invoice.id, e.target.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-all cursor-pointer outline-none appearance-none ${statusColors[invoice.status]}`}
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
                    {parseFloat(invoice.total).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                  <div className="text-xs text-gray-400 flex items-center gap-2 font-medium">
                    <Calendar size={14} /> {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon receipt'}
                  </div>
                  
                  <button
                    onClick={() => handleDownload(invoice)}
                    disabled={downloadingId === invoice.id}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-accent transition-colors disabled:opacity-50"
                  >
                    {downloadingId === invoice.id ? <div className="w-3 h-3 border-2 border-accent border-t-transparent animate-spin rounded-full" /> : <Download size={14} />}
                    {downloadingId === invoice.id ? 'SYNK' : 'PDF'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Modal Upgrade: Dynamic Line Items */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <h2 className="text-2xl font-bold text-navy mb-2">Create Invoice</h2>
            <p className="text-sm text-gray-500 mb-8 font-medium">Add specific deliverables, hours, or services.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Client</label>
                  <select required className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 transition-all font-semibold text-sm" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Due Date</label>
                  <input type="date" required className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-semibold text-sm" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                </div>
              </div>

              {/* DYNAMIC LINE ITEMS SECTION */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Line Items</label>
                  <select className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg text-xs font-bold outline-none" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                    {Object.keys(currencySymbols).map(code => <option key={code} value={code}>{code} ({currencySymbols[code]})</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  {formData.line_items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start group">
                      <div className="flex-1">
                        <input type="text" placeholder="Description (e.g., API Integration)" required className="w-full border border-gray-200 p-3 rounded-xl text-sm" value={item.description} onChange={e => handleLineItemChange(index, 'description', e.target.value)} />
                      </div>
                      <div className="w-24">
                        <input type="number" min="1" step="0.5" placeholder="Qty" required className="w-full border border-gray-200 p-3 rounded-xl text-sm text-center" value={item.quantity} onChange={e => handleLineItemChange(index, 'quantity', e.target.value)} />
                      </div>
                      <div className="w-32">
                        <input type="number" min="0" step="0.01" placeholder="Rate" required className="w-full border border-gray-200 p-3 rounded-xl text-sm text-right" value={item.rate} onChange={e => handleLineItemChange(index, 'rate', e.target.value)} />
                      </div>
                      <button type="button" onClick={() => handleRemoveLineItem(index)} disabled={formData.line_items.length === 1} className="p-3 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-30">
                        <Trash2 size={20} />
                      </button>
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

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-navy">Discard</button>
                <button type="submit" className="px-8 py-2.5 bg-navy text-white rounded-xl font-bold hover:shadow-lg hover:shadow-navy/20 transition-all">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
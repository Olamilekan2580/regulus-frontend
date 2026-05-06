import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, FileText, Download, CreditCard } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import axios from 'axios';

const PayButton = ({ invoice, client, settings }) => {
  if (!settings.paystack_public_key) return <span className="text-xs text-red-500 font-bold">Setup Incomplete</span>;

  const config = {
    reference: (new Date()).getTime().toString(),
    email: client.email || 'billing@client.com',
    amount: parseFloat(invoice.total) * 100,
    publicKey: settings.paystack_public_key,
    metadata: {
      invoice_id: invoice.id,
      freelancer_id: client.freelancer_id // CRITICAL: Tells webhook whose secret key to use
    }
  };

  const initializePayment = usePaystackPayment(config);

  if (invoice.status === 'Paid') return <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Paid</span>;

  return (
    <button 
      onClick={() => initializePayment(() => window.location.reload(), () => console.log('Closed'))}
      style={{ backgroundColor: settings.brand_color || '#1E293B' }}
      className="flex items-center gap-2 text-white px-3 py-1.5 rounded text-sm hover:opacity-90 transition-opacity font-medium shadow-sm"
    >
      <CreditCard size={16} /> Pay Now
    </button>
  );
};

export default function ClientPortal() {
  const { token } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/public/portal/${token}`)
      .then(res => setData(res.data)).catch(() => setData('error'));
  }, [token]);

  if (!data) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (data === 'error') return <div className="min-h-screen flex items-center justify-center text-red-500">Invalid link.</div>;

  const { client, projects, invoices, settings } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-end border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: settings.brand_color }}>{client.company || client.name}</h1>
            <p className="text-gray-500 mt-1">Client Collaboration Portal</p>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl italic" style={{ color: settings.brand_color }}>
              {settings.brand_name || 'Regulus.'}
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: settings.brand_color }}><CheckCircle className="text-green-500" /> Active Projects</h2>
          <div className="grid gap-4">
            {projects.map(proj => (
              <div key={proj.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div><h3 className="font-bold text-gray-900">{proj.name}</h3><p className="text-sm text-gray-500">{proj.description}</p></div>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{proj.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: settings.brand_color }}><FileText /> Invoices & Billing</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Number</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-gray-600">${inv.total}</td>
                    <td className="px-6 py-4 text-right flex justify-end">
                      <PayButton invoice={inv} client={client} settings={settings} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

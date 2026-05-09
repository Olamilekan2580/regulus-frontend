import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import HealthDashboard from '../components/HealthDashboard';

export default function ClientDetail() {
  const { id } = useParams(); // Client ID from URL
  const [client, setClient] = useState(null);
  const [uptimeData, setUptimeData] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientStats = async () => {
      try {
        const [clientRes, milestonesRes, healthRes] = await Promise.all([
          api.get(`/clients/${id}`),
          api.get(`/milestones/${id}`),
          api.get(`/health/${id}`) // Hits your Node.js proxy
        ]);

        setClient(clientRes.data);
        setMilestones(milestonesRes.data || []);
        setUptimeData(healthRes.data);
      } catch (err) {
        console.error('System sync failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientStats();
  }, [id]);

  if (loading) return <div className="p-12 text-center animate-pulse text-navy">Syncing Environment...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-navy">{client?.company || client?.name}</h1>
        <p className="text-gray-500 font-medium">{client?.website_url}</p>
      </header>

      {/* The Wired Up Dashboard */}
      <HealthDashboard uptimeData={uptimeData} milestones={milestones} />

      {/* Rest of your client detail UI (Invoices, Documents, etc) */}
      <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Active Deliverables</h2>
        {/* Map through milestones here for a detailed list */}
      </section>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ 
    clientCount: 0, 
    projectCount: 0, 
    revenue: 0, 
    outstanding: 0,
    chartData: [] 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        // Fetch Dashboard Stats directly - Onboarding check is handled by ProtectedRoute
        const statsRes = await api.get('/stats');
        
        setStats({
          clientCount: statsRes.data?.clientCount || 0,
          projectCount: statsRes.data?.projectCount || 0,
          revenue: statsRes.data?.revenue || 0,
          outstanding: statsRes.data?.outstanding || 0,
          chartData: statsRes.data?.chartData || []
        });
      } catch (err) {
        console.error('[Dashboard Error]:', err);
      } finally {
        setLoading(false);
      }
    };
    
    initDashboard();
  }, []); // <-- Empty array ensures this runs exactly once

  if (loading) return (
    <div className="flex items-center justify-center p-12 text-gray-400">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mr-3"></div>
      Loading dashboard metrics...
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time business performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Clients', value: stats.clientCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Projects', value: stats.projectCount, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Revenue', value: `$${stats.revenue}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Outstanding', value: `$${stats.outstanding}`, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 ${card.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <card.icon className={card.color} size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-navy mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-navy mb-6">Revenue Overview</h2>
        <div className="h-[300px] w-full">
          {stats.revenue === 0 || stats.chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                <TrendingUp size={24} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-700 mb-1">No Revenue Data</h3>
              <p className="text-xs text-gray-500 max-w-[250px] text-center">
                Your revenue chart will appear here once your invoices start getting paid.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                <Tooltip cursor={{stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '3 3'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
import { Activity, Globe, Zap, CheckCircle2 } from 'lucide-react';

export default function HealthDashboard({ uptimeData, milestones }) {
  const completedWeight = milestones
    .filter(m => m.status === 'Completed')
    .reduce((sum, m) => sum + m.weight, 0);
  const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
  const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Uptime Card */}
      <div className="bg-navy rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">System Health</p>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              {uptimeData?.status === 2 ? 'Operational' : 'Issues Detected'}
              <span className={`w-3 h-3 rounded-full animate-pulse ${uptimeData?.status === 2 ? 'bg-accent' : 'bg-red-500'}`} />
            </h3>
          </div>
          <Activity className="text-accent/20" size={48} />
        </div>
        
        <div className="mt-8 flex items-end gap-4 relative z-10">
          <div>
            <span className="text-4xl font-black">{uptimeData?.all_time_uptime_ratio || '99.9'}%</span>
            <p className="text-gray-400 text-[10px] font-bold uppercase mt-1">30-Day Uptime</p>
          </div>
        </div>
        
        {/* Subtle background decoration */}
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Project Velocity Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Project Velocity</p>
            <h3 className="text-2xl font-bold text-navy">{Math.round(progress)}% Complete</h3>
          </div>
          <Zap className="text-navy/10" size={40} />
        </div>

        <div className="mt-8">
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-accent h-full transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <div className="flex justify-between mt-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Milestones</span>
            <span className="text-[10px] font-black text-navy uppercase tracking-tighter">
              {milestones.filter(m => m.status === 'Completed').length} / {milestones.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
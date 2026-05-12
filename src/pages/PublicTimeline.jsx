import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { Calendar, CheckCircle, Clock, FileText, Download, Activity } from 'lucide-react';

const PublicTimeline = () => {
  const { token } = useParams();
  const [data, setData] = useState({ project: null, updates: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await api.get(`/public/updates/${token}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Invalid or expired timeline link.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C896]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-xl p-8 text-center shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const { project, updates } = data;

  const statusColors = {
    'Planning': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'Active': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Completed': 'text-[#00C896] bg-[#00C896]/10 border-[#00C896]/20'
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Project Header Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C896]/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="uppercase tracking-widest text-xs font-bold text-[#00C896] mb-3 flex items-center gap-2">
                <Activity size={14} /> Live Workspace
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{project.name}</h1>
              <p className="text-slate-400 text-lg">Client: {project.clients?.company || project.clients?.name}</p>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[200px]">
              <div className="bg-[#0A0F1E] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColors[project.status] || statusColors['Planning']}`}>
                  {project.status}
                </span>
              </div>
              <div className="bg-[#0A0F1E] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Deadline</span>
                <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                  <Calendar size={14} className="text-[#00C896]" />
                  {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'TBD'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Clock className="text-[#00C896]" size={20} /> Project Log & Deliverables
          </h2>

          {updates.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
              <FileText className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-lg font-medium text-slate-300">No updates yet</h3>
              <p className="text-slate-500 mt-1">Your developer hasn't posted any updates to this timeline.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-800 ml-3 md:ml-4 space-y-10">
              {updates.map((update, index) => (
                <div key={update.id} className="relative pl-8 md:pl-10">
                  {/* Timeline Dot */}
                  <div className="absolute w-6 h-6 bg-slate-900 rounded-full border-4 border-[#00C896] -left-[13px] top-1"></div>
                  
                  {/* Update Content */}
                  <div className="bg-[#0A0F1E] border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                      <h3 className="text-lg font-bold text-white">{update.title}</h3>
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(update.created_at).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    {update.description && (
                      <p className="text-slate-400 text-sm whitespace-pre-wrap leading-relaxed mb-6">
                        {update.description}
                      </p>
                    )}

                    {/* Render Files if they exist */}
                    {update.files && update.files.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800/50">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Deliverables & Assets</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {update.files.map((fileUrl, idx) => (
                            <a 
                              key={idx} 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-700 rounded-lg hover:border-[#00C896]/50 transition-colors group"
                            >
                              <div className="bg-slate-800 p-2 rounded-md group-hover:bg-[#00C896]/20 transition-colors">
                                <Download size={16} className="text-[#00C896]" />
                              </div>
                              <span className="text-sm font-medium text-slate-300 truncate">View Attachment {idx + 1}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PublicTimeline;
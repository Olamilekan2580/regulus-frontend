import React, { useState, useEffect, useCallback } from 'react';
import { Inbox, RefreshCw, Calendar, User, FileText, Image as ImageIcon, Download, AlertCircle, FileArchive } from 'lucide-react';
import api from '../lib/api';

const ClientSubmissionsFeed = ({ projectId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchSubmissions = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    setError(null);
    
    try {
      const res = await api.get(`/projects/${projectId}/submissions`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setSubmissions(data);
    } catch (err) {
      console.error('[Feed Error]:', err);
      setError('Failed to load client submissions. The backend may be unreachable.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchSubmissions();
  }, [projectId, fetchSubmissions]);

  // Utility to determine file icon based on URL extension
  const getFileIcon = (url) => {
    if (!url || typeof url !== 'string') return <FileText size={16} className="text-gray-500" />;
    const ext = url.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return <ImageIcon size={16} className="text-blue-500" />;
    if (['zip', 'rar', 'tar'].includes(ext)) return <FileArchive size={16} className="text-yellow-500" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  // Utility to safely render unknown form_data values
  const renderSafeValue = (value) => {
    if (value === null || value === undefined || value === '') return <span className="italic text-gray-300">No response provided</span>;
    if (typeof value === 'object') return <pre className="text-[10px] bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>;
    return value.toString();
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mb-4"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Syncing Vault...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00C896]/10 text-[#00C896] rounded-lg">
            <Inbox size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy leading-tight">Client Intake Feed</h3>
            <p className="text-xs text-gray-500 font-medium">Data & files submitted via portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded-md uppercase tracking-widest">
            {submissions.length} Entries
          </span>
          <button 
            onClick={() => fetchSubmissions(true)}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-navy hover:bg-gray-50 rounded-lg transition-all disabled:opacity-50"
            title="Force Sync"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-accent" : ""} />
          </button>
        </div>
      </div>

      {/* Error Boundary */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Main Feed */}
      {submissions.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <Inbox size={24} className="text-gray-300" />
          </div>
          <h4 className="text-sm font-bold text-navy mb-1">Awaiting Client Data</h4>
          <p className="text-xs text-gray-500 max-w-[200px]">When the client submits their intake form, it will appear here instantly.</p>
        </div>
      ) : (
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {submissions.map((sub) => {
            // ARCHITECT FIX 1: Safely handle both file array structures
            const activeFiles = sub.files || sub.project_assets || [];

            return (
              <div key={sub.id} className="relative pl-6 border-l-2 border-gray-100 hover:border-accent transition-colors pb-2 last:pb-0">
                {/* Timeline Node */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-200 group-hover:border-accent"></div>
                
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 hover:bg-white hover:shadow-md transition-all group">
                  
                  {/* Meta Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <Calendar size={12} />
                      {new Date(sub.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-[#00C896] bg-[#00C896]/10 px-2 py-1 rounded uppercase tracking-widest border border-[#00C896]/20">
                      <User size={10} /> Client
                    </div>
                  </div>

                  {/* ARCHITECT FIX 2: Explicitly render the native client_requirements string */}
                  {sub.client_requirements && (
                    <div className="mb-4">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Project Brief / Requirements
                      </label>
                      <div className="text-sm text-navy font-medium leading-relaxed bg-white p-3 rounded-lg border border-gray-100 shadow-sm whitespace-pre-wrap">
                        {sub.client_requirements}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Form Data (Fallback) */}
                  {sub.form_data && Object.keys(sub.form_data).length > 0 && (
                    <div className="space-y-4 mb-4">
                      {Object.entries(sub.form_data).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            {key.replace(/_/g, ' ')}
                          </label>
                          <div className="text-sm text-navy font-medium leading-relaxed bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                            {renderSafeValue(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attached Files Wrapper */}
                  {activeFiles.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Deliverables Attached</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeFiles.map((fileUrl, idx) => {
                          const fileName = fileUrl.split('/').pop().split('?')[0] || `Attachment ${idx + 1}`;
                          const decodedName = decodeURIComponent(fileName);
                          
                          return (
                            <a 
                              key={idx}
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 bg-white border border-gray-200 p-2.5 rounded-lg hover:border-accent hover:shadow-sm transition-all group/link"
                              title={decodedName}
                            >
                              <div className="p-1.5 bg-gray-50 rounded-md shrink-0">
                                {getFileIcon(decodedName)}
                              </div>
                              <span className="text-xs font-bold text-navy truncate flex-1">
                                {decodedName}
                              </span>
                              <Download size={14} className="text-gray-300 group-hover/link:text-accent shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientSubmissionsFeed;
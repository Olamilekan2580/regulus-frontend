import React, { useState } from 'react';

const ProjectShareLinks = ({ project }) => {
  const [copiedIntake, setCopiedIntake] = useState(false);
  const [copiedTimeline, setCopiedTimeline] = useState(false);

  // Dynamically adapt to localhost or Vercel production domain
  const getBaseUrl = () => {
    return window.location.origin; 
  };

  const copyToClipboard = async (type, token) => {
    const url = `${getBaseUrl()}/public/${type}/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      if (type === 'intake') {
        setCopiedIntake(true);
        setTimeout(() => setCopiedIntake(false), 2000);
      } else {
        setCopiedTimeline(true);
        setTimeout(() => setCopiedTimeline(false), 2000);
      }
    } catch (err) {
      console.error('[Clipboard Error]: Failed to copy', err);
    }
  };

  if (!project) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-2">Secure Client Links</h3>
      <p className="text-sm text-slate-400 mb-6">
        Share these unique, passwordless links with your client. They route directly to this specific project's isolated data vault.
      </p>

      <div className="space-y-4">
        {/* 1. Intake Form Link */}
        <div className="flex items-center justify-between p-4 bg-[#0A0F1E] rounded-lg border border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-300">Project Intake Form</p>
            <p className="text-xs mt-1">
              {project.intake_submitted 
                ? <span className="text-[#00C896] font-medium">✓ Requirements Submitted</span>
                : <span className="text-amber-500 font-medium">Waiting on Client...</span>}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard('intake', project.intake_token)}
            disabled={project.intake_submitted}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              project.intake_submitted 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-transparent'
                : copiedIntake 
                  ? 'bg-[#00C896]/20 text-[#00C896] border border-[#00C896]/50'
                  : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {copiedIntake ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* 2. Timeline / Updates Link */}
        <div className="flex items-center justify-between p-4 bg-[#0A0F1E] rounded-lg border border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-300">Live Project Timeline</p>
            <p className="text-xs text-slate-500 mt-1">Read-only updates, file deliverables, and status feed.</p>
          </div>
          <button
            onClick={() => copyToClipboard('updates', project.update_token)}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              copiedTimeline 
                ? 'bg-[#00C896]/20 text-[#00C896] border border-[#00C896]/50'
                : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {copiedTimeline ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectShareLinks;
import React, { useState } from 'react';
import { Copy, CheckCircle2, Workflow, Box, ArrowRight } from 'lucide-react';

// Static Data: The actual JSON blueprints
const blueprints = [
  {
    id: 1,
    title: 'Client Intake to Asana & Slack',
    description: 'Triggers when a new client submits the Regulus portal form. Creates a project in Asana and pings the team in Slack.',
    tools: ['Regulus Webhook', 'Asana', 'Slack'],
    // This is a minimal valid n8n node structure for demonstration
    payload: `{"nodes":[{"parameters":{"path":"regulus-intake","options":{}},"name":"Webhook","type":"n8n-nodes-base.webhook","typeVersion":1,"position":[250,300]},{"parameters":{"text":"New Client Intake Received!","channel":"#sales"},"name":"Slack","type":"n8n-nodes-base.slack","typeVersion":1,"position":[450,300]}]}`
  },
  {
    id: 2,
    title: 'Invoice Paid to QuickBooks',
    description: 'Listens for a Stripe webhook via Regulus and automatically generates a paid receipt record in QuickBooks Online.',
    tools: ['Regulus Webhook', 'Stripe', 'QuickBooks'],
    payload: `{"nodes":[{"parameters":{"path":"invoice-paid","options":{}},"name":"Webhook","type":"n8n-nodes-base.webhook","typeVersion":1,"position":[250,300]},{"parameters":{"resource":"invoice","operation":"create"},"name":"QuickBooks","type":"n8n-nodes-base.quickbooks","typeVersion":1,"position":[450,300]}]}`
  },
  {
    id: 3,
    title: 'New Milestone to Client Email',
    description: 'When you mark a project milestone as "Complete" in Regulus, automatically send a branded status update email to the client via SendGrid.',
    tools: ['Regulus Webhook', 'SendGrid'],
    payload: `{"nodes":[{"parameters":{"path":"milestone-complete","options":{}},"name":"Webhook","type":"n8n-nodes-base.webhook","typeVersion":1,"position":[250,300]},{"parameters":{"fromEmail":"updates@agency.com","toEmail":"={{$json.body.client_email}}","subject":"Project Update"},"name":"SendGrid","type":"n8n-nodes-base.sendGrid","typeVersion":1,"position":[450,300]}]}`
  }
];

export default function AutomationHub() {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = async (id, payload) => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 3000); // Reset after 3 seconds
    } catch (err) {
      console.error('Failed to copy blueprint:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 flex items-center gap-3">
            <Workflow className="text-[#00C896]" size={36} />
            Automation Blueprints
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Don't build from scratch. Copy these pre-configured JSON payloads and paste them directly into your n8n or Make.com canvas to deploy enterprise infrastructure in seconds.
          </p>
        </div>

        {/* Blueprints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blueprints.map((blueprint) => (
            <div 
              key={blueprint.id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col hover:border-slate-700 transition-colors shadow-xl"
            >
              <div className="mb-4">
                <div className="flex gap-2 mb-4">
                  {blueprint.tools.map((tool, index) => (
                    <span 
                      key={index} 
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#0A0F1E] px-2.5 py-1 rounded-md border border-slate-800"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{blueprint.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed min-h-[60px]">
                  {blueprint.description}
                </p>
              </div>

              {/* Action Button Area */}
              <div className="mt-auto pt-6 border-t border-slate-800">
                <button
                  onClick={() => handleCopy(blueprint.id, blueprint.payload)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                    copiedId === blueprint.id 
                      ? 'bg-[#00C896]/10 text-[#00C896] border border-[#00C896]/30' 
                      : 'bg-[#24292F] text-white hover:bg-[#1b1f23] border border-transparent'
                  }`}
                >
                  {copiedId === blueprint.id ? (
                    <>
                      <CheckCircle2 size={18} />
                      Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy n8n Blueprint
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Instructions */}
        <div className="mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-[#0A0F1E] p-4 rounded-xl border border-slate-800">
            <Box className="text-[#00C896]" size={32} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-1">How to deploy these blueprints</h4>
            <p className="text-sm text-slate-400">
              Click the copy button above. Open your n8n workspace, create a blank workflow, click anywhere on the canvas, and press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono text-xs">Ctrl+V</kbd> (or Cmd+V). The nodes will instantly generate.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
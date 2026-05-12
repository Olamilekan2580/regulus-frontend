import React, { useState } from 'react';
import { Copy, CheckCircle2, Workflow, Box } from 'lucide-react';
import { blueprints } from '../data/blueprints'; // Importing from the new registry

export default function AutomationHub() {
  const [copiedId, setCopiedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  // Dynamically extract unique categories from the data file
  const categories = ['All', ...new Set(blueprints.map(b => b.category))];

  // Filter the blueprints based on the selected category pill
  const filteredBlueprints = activeCategory === 'All' 
    ? blueprints 
    : blueprints.filter(b => b.category === activeCategory);

  const handleCopy = async (id, payload) => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 3000); 
    } catch (err) {
      console.error('Failed to copy blueprint:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-navy mb-3 flex items-center gap-3">
            <div className="p-3 bg-accent/20 text-accent rounded-xl">
              <Workflow size={32} />
            </div>
            Automation Blueprints
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl font-medium">
            Deploy enterprise infrastructure in seconds. Copy these pre-configured payloads and paste them directly into your n8n or Make.com canvas.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat 
                  ? 'bg-navy text-white shadow-lg scale-105' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-navy hover:shadow-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blueprints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlueprints.map((blueprint) => (
            <div 
              key={blueprint.id} 
              className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col hover:border-accent hover:shadow-xl transition-all duration-300 group"
            >
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {blueprint.tools.map((tool, index) => (
                    <span 
                      key={index} 
                      className="text-[10px] font-bold uppercase tracking-wider text-navy bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-accent transition-colors">{blueprint.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed min-h-[60px] font-medium">
                  {blueprint.description}
                </p>
              </div>

              {/* Action Button Area */}
              <div className="mt-auto pt-6 border-t border-gray-100">
                <button
                  onClick={() => handleCopy(blueprint.id, blueprint.payload)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-200 ${
                    copiedId === blueprint.id 
                      ? 'bg-accent/20 text-accent border border-accent/30 shadow-inner' 
                      : 'bg-navy text-white hover:bg-navy/90 hover:shadow-md'
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
                      Copy n8n Payload
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Instructions */}
        <div className="mt-12 bg-white border border-gray-200 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <Box className="text-navy" size={32} />
          </div>
          <div>
            <h4 className="text-lg font-black text-navy mb-1">How to deploy these blueprints</h4>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Click the copy button above. Open your n8n workspace, create a blank workflow, click anywhere on the canvas, and press <kbd className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded text-navy font-mono text-xs shadow-sm mx-1">Ctrl+V</kbd> (or Cmd+V). The workflow nodes will generate instantly.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
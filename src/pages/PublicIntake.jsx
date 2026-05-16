import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, UploadCloud, X, Send, Lock, FileText } from 'lucide-react';
import api from '../lib/api';
import { supabase } from '../lib/supabase';

const PublicIntake = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form State
  const [requirements, setRequirements] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchIntakeDetails = async () => {
      try {
        const res = await api.get(`/public/intake/${token}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Invalid or expired intake link.');
      } finally {
        setLoading(false);
      }
    };

    fetchIntakeDetails();
  }, [token]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requirements.trim() && files.length === 0) return;
    
    setIsSubmitting(true);
    let uploadedFileUrls = [];

    try {
      // 1. Upload files to the secure Supabase bucket and get public URLs
      if (files.length > 0) {
        for (const file of files) {
          // 🔒 Sanitize the file name to prevent the 400 Path Error
          const fileExt = file.name.split('.').pop();
          const safeBaseName = file.name
            .split('.')[0]
            .replace(/[^a-z0-9]/gi, '_') 
            .substring(0, 30);
            
          const fileName = `client_${safeBaseName}_${Date.now()}.${fileExt}`;

          const { error: uploadErr } = await supabase.storage
            .from('project-vault')
            .upload(fileName, file);

          if (uploadErr) {
            console.error('File upload failed:', uploadErr.message);
            throw new Error(`Failed to upload ${file.name}`);
          }

          const { data: publicUrlData } = supabase.storage
            .from('project-vault')
            .getPublicUrl(fileName);
            
          uploadedFileUrls.push(publicUrlData.publicUrl);
        }
      }

      // 2. Submit formatted data to the NEW enterprise backend route
      await api.post(`/public/intake/${token}`, { 
        requirements: requirements,
        assets: uploadedFileUrls
      });

      setSuccess(true);
    } catch (err) {
      console.error('[Submit Error]:', err);
      alert('Failed to submit project details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER STATES ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-red-100 rounded-[2rem] p-10 text-center shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-navy mb-2">Access Denied</h2>
          <p className="text-gray-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const { project, organization } = data;
  const brand = organization?.brand_settings || {};
  const primaryColor = brand.primary || '#0A0F1E';
  const accentColor = brand.accent || '#00C896';

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-10 text-center shadow-xl animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-50">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-navy mb-2">Details Received</h2>
          <p className="text-gray-500 font-medium mb-8">
            Your project requirements and files have been securely transmitted to {organization.name}. You may now close this window.
          </p>
          <button 
            onClick={() => window.close()} 
            className="w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-3xl w-full bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl overflow-hidden">
        
        {/* Dynamic Brand Header Section */}
        <div className="p-10 text-white" style={{ backgroundColor: primaryColor }}>
          <div className="uppercase tracking-[0.2em] text-[10px] font-black mb-2 opacity-70">Secure Client Portal</div>
          <h1 className="text-3xl font-black mb-3">Project Intake: {project.name}</h1>
          <p className="text-white/80 font-medium text-sm">
            Welcome, {project.clients?.name || 'Client'}. Please provide the necessary details, credentials, and files required to commence development.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          
          {/* Requirements Textarea */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-black text-navy mb-3">
              Project Requirements & Objectives <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows="6"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 text-navy font-medium placeholder-gray-400 focus:outline-none focus:ring-2 transition-all resize-y"
              style={{ '--tw-ring-color': accentColor }}
              placeholder="Describe your goals, required features, technical constraints, or target audience..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            ></textarea>
          </div>

          {/* Secure File Upload */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-black text-navy mb-3">
              Secure File Upload (Assets, PDFs, Mockups)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-200 border-dashed rounded-2xl hover:border-gray-300 transition-colors bg-gray-50">
              <div className="space-y-2 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-500 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-bold hover:opacity-80 transition-opacity" style={{ color: accentColor }}>
                    <span>Upload files</span>
                    <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1 font-medium">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-400 font-medium">PNG, JPG, PDF, ZIP up to 50MB</p>
              </div>
            </div>

            {/* File Queue Preview */}
            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between py-3 px-4 bg-white border border-gray-100 rounded-xl text-sm shadow-sm">
                    <div className="flex items-center truncate">
                      <FileText className="w-4 h-4 mr-3 text-gray-400 shrink-0" />
                      <span className="truncate font-bold text-navy">{file.name}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <Lock size={14} /> End-to-End Encrypted
            </div>
            <button
              type="submit"
              disabled={isSubmitting || (!requirements.trim() && files.length === 0)}
              className="w-full sm:w-auto flex justify-center py-4 px-10 border border-transparent rounded-xl shadow-xl text-white font-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
              style={{ backgroundColor: accentColor }}
            >
              {isSubmitting ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div> Processing...</>
              ) : (
                <><Send size={18} /> Submit Project Details</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicIntake;
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { supabase } from '../lib/supabase';

const PublicIntake = () => {
  const { token } = useParams();
  const [project, setProject] = useState(null);
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
        setProject(res.data);
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
          // 🔒 THE FIX: Sanitize the file name to prevent the 400 Path Error
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

          // Generate the public URL so the freelancer can download it later
          const { data: publicUrlData } = supabase.storage
            .from('project-vault')
            .getPublicUrl(fileName);
            
          uploadedFileUrls.push(publicUrlData.publicUrl);
        }
      }

      // 2. Submit formatted data to the NEW backend route
      // Format the text into a JSON object so it renders cleanly in the feed
      const intakeData = {
        project_requirements: requirements
      };

      // Hit the specific project submission endpoint
      await api.post(`/projects/${project.id}/submissions`, { 
        form_data: intakeData,
        files: uploadedFileUrls
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
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C896]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-xl p-8 text-center shadow-2xl">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-[#00C896]/30 rounded-xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-[#00C896]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#00C896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Details Received</h2>
          <p className="text-slate-400">
            Thank you! Your project requirements and files have been securely transmitted to your developer. You may now close this window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4 py-12">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-800/50 p-8 border-b border-slate-800">
          <div className="uppercase tracking-widest text-xs font-bold text-[#00C896] mb-2">Secure Client Portal</div>
          <h1 className="text-3xl font-bold text-white mb-2">Project Intake: {project.name}</h1>
          <p className="text-slate-400">
            Welcome, {project.clients?.name || 'Client'}. Please provide the necessary details, credentials, and files required to commence development on your project.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Requirements Textarea */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Project Requirements & Objectives <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows="6"
              className="w-full bg-[#0A0F1E] border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00C896] focus:ring-1 focus:ring-[#00C896] transition-colors"
              placeholder="Describe your goals, required features, technical constraints, or target audience..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            ></textarea>
          </div>

          {/* Secure File Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Secure File Upload (Assets, PDFs, Mockups)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-700 border-dashed rounded-xl hover:border-slate-500 transition-colors bg-[#0A0F1E]">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-slate-400 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-[#00C896] hover:text-[#00a87e] focus-within:outline-none">
                    <span>Upload files</span>
                    <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">PNG, JPG, PDF, ZIP up to 50MB</p>
              </div>
            </div>

            {/* File Queue Preview */}
            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between py-2 px-4 bg-slate-800 rounded-lg text-sm text-slate-300 border border-slate-700">
                    <div className="flex items-center truncate">
                      <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      <span className="truncate">{file.name}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="ml-4 text-red-400 hover:text-red-300 font-medium">Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!requirements.trim() && files.length === 0)}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-slate-900 bg-[#00C896] hover:bg-[#00a87e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1E] focus:ring-[#00C896] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Encrypting & Submitting...' : 'Submit Project Details'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicIntake;
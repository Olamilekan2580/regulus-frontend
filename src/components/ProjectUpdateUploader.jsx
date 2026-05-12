import React, { useState } from 'react';
import { Upload, X, Send, Paperclip } from 'lucide-react';
import api from '../lib/api';
import { supabase } from '../lib/supabase';

const ProjectUpdateUploader = ({ projectId, onUpdatePosted }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('An update title is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    let uploadedFileUrls = [];

    try {
      // 1. Upload files to Supabase Storage
      if (files.length > 0) {
        for (const file of files) {
          // 🔒 THE FIX: Sanitize filename to prevent "path is invalid" errors
          const fileExt = file.name.split('.').pop();
          const safeBaseName = file.name
            .split('.')[0]
            .replace(/[^a-z0-9]/gi, '_') // Replace special chars with underscore
            .substring(0, 30);           // Keep it short
          
          // Use a simple, flat path. Complex nested folders often trigger RLS or Path issues.
          const fileName = `${safeBaseName}_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;

          const { error: uploadErr } = await supabase.storage
            .from('project-vault')
            .upload(fileName, file);

          if (uploadErr) {
            console.error('File upload failed:', uploadErr.message);
            throw new Error(`Upload failed: ${uploadErr.message}`);
          }

          // Generate the public URL
          const { data: publicUrlData } = supabase.storage
            .from('project-vault')
            .getPublicUrl(fileName);
            
          uploadedFileUrls.push(publicUrlData.publicUrl);
        }
      }

      // 2. Post the update to the internal API
      const response = await api.post(`/projects/${projectId}/updates`, {
        title,
        description,
        files: uploadedFileUrls
      });

      // 3. Reset form
      setTitle('');
      setDescription('');
      setFiles([]);
      if (onUpdatePosted) onUpdatePosted(response.data);

    } catch (err) {
      console.error('[Update Error]:', err);
      setError(err.message || 'Failed to post project update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-navy mb-1">Post Project Update</h3>
      <p className="text-sm text-gray-500 mb-6">
        This update will be instantly visible on the client's public timeline.
      </p>

      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            required
            className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium"
            placeholder="Update Title (e.g., Wireframes Completed)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <textarea
            className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium resize-none h-24"
            placeholder="Details, release notes, or instructions for the client..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deliverables</span>
            <label className="cursor-pointer text-[#00C896] hover:text-[#00a87e] flex items-center gap-1.5 text-sm font-bold transition-colors">
              <Paperclip size={16} /> Attach Files
              <input type="file" multiple className="sr-only" onChange={handleFileChange} />
            </label>
          </div>

          {files.length > 0 && (
            <ul className="space-y-2 mt-3">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  <span className="truncate max-w-[80%] font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-50 mt-6">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy/90 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Pushing...
              </span>
            ) : (
              <>
                <Send size={16} /> Push to Timeline
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectUpdateUploader;
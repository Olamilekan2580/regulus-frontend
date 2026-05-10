import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../lib/api';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token'); // Extract the token from the URL

  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    fullName: '',
    inviteToken: inviteToken || '' // Inject it into the form state
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Optional: If they arrived with a token, we can pre-fill the email later 
  // if we add an endpoint to fetch invite details, but for now, sending the token is enough.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // The backend auth.js we updated will now see the inviteToken in this payload
      await api.post('/auth/signup', formData);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
      setLoading(false);
    }
  };

  // SUCCESS STATE UI
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Check your email</h1>
          <p className="text-gray-500 mb-8">
            We sent a verification link to <span className="font-medium text-navy">{formData.email}</span>. 
            Please verify your email address to activate your account.
          </p>
          <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-navy text-white px-6 py-2.5 rounded-lg font-medium hover:bg-navy/90 transition-colors w-full">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // STANDARD FORM UI
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">
            {inviteToken ? 'Join Workspace' : 'Create Account'}
          </h1>
          <p className="text-gray-500">
            {inviteToken ? 'You have been invited to collaborate.' : 'Start managing your freelance business.'}
          </p>
        </div>

        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" required className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent outline-none" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="email" required className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="password" required className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent outline-none" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full flex items-center justify-center gap-2 bg-accent text-white py-2.5 rounded-lg font-medium hover:bg-accent/90 transition-colors mt-2 disabled:opacity-70">
            {loading ? 'Creating Account...' : (inviteToken ? 'Accept Invitation' : 'Sign Up')} <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-navy font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
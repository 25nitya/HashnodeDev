import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { KeyRound, ArrowRight,Eye,EyeOff } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setResetUrl('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      setStatusMessage(res.data?.message || 'If this email is registered, a password reset link has been generated.');

      // Check common response keys for the generated URL or token
      const receivedUrl =
        res.data?.reset_url ||
        res.data?.resetUrl ||
        res.data?.link ||
        (res.data?.token ? `/reset-password/${res.data.token}` : '');

      if (receivedUrl) {
        setResetUrl(receivedUrl);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Reset Password</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your registered email address to receive a password reset link.
        </p>

        {statusMessage && (
          <div className="mb-4 p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
            <p>{statusMessage}</p>

            {/* Clickable link shown directly in dev mode */}
            {resetUrl && (
              <div className="pt-2 border-t border-emerald-200">
                <p className="text-xs text-emerald-700 font-medium mb-1.5">Development Reset Link:</p>
                {resetUrl.startsWith('http') ? (
                  <a
                    href={resetUrl}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    <span>Proceed to Reset Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link
                    to={resetUrl}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                  >
                    <span>Proceed to Reset Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Sending...'
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-blue-600 hover:underline font-medium">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
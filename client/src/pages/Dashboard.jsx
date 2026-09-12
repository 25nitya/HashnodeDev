import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Edit3, Trash2, FileText, CheckCircle2, Clock, User, Lock, Eye, EyeOff } from 'lucide-react';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile modal state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: '',
    avatarUrl: '',
    github: '',
    website: '',
  });

  // Password change state
  const [pwdData, setPwdData] = useState({ current_password: '', new_password: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });

  const fetchMyPosts = async () => {
    try {
      const res = await api.get('/posts/mine');
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load dashboard posts', err);
    } finally {
      setLoading(false);
    }
  };

  // Load current user profile details
  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data) {
        // Strip auto-appended connect footer for cleaner editing in the textarea
        const rawBio = res.data.bio || '';
        const cleanBio = rawBio.split('\n\nConnect:')[0].trim();

        setProfileForm({
          bio: cleanBio,
          avatarUrl: res.data.avatarUrl || '',
          github: res.data.github || '',
          website: res.data.website || '',
        });
      }
    } catch (err) {
      console.warn('Could not load user profile', err);
    }
  };

  useEffect(() => {
    fetchMyPosts();
    loadUser();
  }, []);

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => (p.id || p._id) !== postId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete post');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    // 1. Clean base bio of any existing auto-appended footer
    const cleanBio = (profileForm.bio || '').split('\n\nConnect:')[0].trim();

    // 2. Build markdown link tokens from GitHub & Website fields
    const linkSnippets = [];

    if (profileForm.github && profileForm.github.trim()) {
      const gh = profileForm.github.trim().startsWith('http')
        ? profileForm.github.trim()
        : `https://${profileForm.github.trim()}`;
      linkSnippets.push(`[GitHub](${gh})`);
    }

    if (profileForm.website && profileForm.website.trim()) {
      const web = profileForm.website.trim().startsWith('http')
        ? profileForm.website.trim()
        : `https://${profileForm.website.trim()}`;
      linkSnippets.push(`[Portfolio](${web})`);
    }

    // 3. Merge base bio with links
    let finalBio = cleanBio;
    if (linkSnippets.length > 0) {
      finalBio = cleanBio
        ? `${cleanBio}\n\nConnect: ${linkSnippets.join(' • ')}`
        : `Connect: ${linkSnippets.join(' • ')}`;
    }

    const payload = {
      ...profileForm,
      bio: finalBio,
    };

    try {
      await api.put('/auth/me', payload);
      setProfileForm((prev) => ({ ...prev, bio: cleanBio }));
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMessage({ type: '', text: '' });

    if (pwdData.new_password.length < 6) {
      setPwdMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        current_password: pwdData.current_password,
        new_password: pwdData.new_password,
      });

      setPwdMessage({ type: 'success', text: res.data?.message || 'Password updated successfully!' });
      setPwdData({ current_password: '', new_password: '' });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to update password.';
      setPwdMessage({ type: 'error', text: detail });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Author Dashboard</h1>
          <p className="text-sm text-gray-500">Manage all your articles, drafts, and profile</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setPwdMessage({ type: '', text: '' });
              setPwdData({ current_password: '', new_password: '' });
              setShowCurrentPassword(false);
              setShowNewPassword(false);
              loadUser();
              setIsEditingProfile(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition"
          >
            <User className="w-4 h-4 text-gray-500" />
            Edit Profile
          </button>
          <Link
            to="/create"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            <Edit3 className="w-4 h-4" />
            New Article
          </Link>
        </div>
      </div>

      {/* Posts Listing */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading your posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">You haven't created any articles yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const postId = post.id || post._id;

            return (
              <div
                key={postId}
                className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md ${
                        post.status === 'published'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {post.status === 'published' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {post.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <Link
                    to={post.status === 'published' ? `/post/${post.slug || postId}` : `/edit/${postId}`}
                    className="text-lg font-bold text-gray-900 hover:text-blue-600 transition block"
                  >
                    {post.title}
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/edit/${postId}`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Post"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(postId)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 my-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Profile Info Form */}
            <form onSubmit={handleProfileSave} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-500" />
                Profile Information
              </h3>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={profileForm.avatarUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                  className="w-full text-sm px-3 py-2 border rounded-lg outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full text-sm px-3 py-2 border rounded-lg outline-none focus:border-blue-500"
                  placeholder="Tell readers about yourself..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">GitHub URL</label>
                  <input
                    type="text"
                    value={profileForm.github}
                    onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
                    className="w-full text-sm px-3 py-2 border rounded-lg outline-none focus:border-blue-500"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    className="w-full text-sm px-3 py-2 border rounded-lg outline-none focus:border-blue-500"
                    placeholder="https://yourdomain.com"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
                >
                  Save Profile Details
                </button>
              </div>
            </form>

            {/* Change Password Form */}
            <div className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-gray-500" />
                Change Password
              </h3>

              {pwdMessage.text && (
                <div
                  className={`p-2.5 mb-3 text-xs rounded-lg border ${
                    pwdMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {pwdMessage.text}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-3">
                {/* Current Password with Eye Toggle */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={pwdData.current_password}
                      onChange={(e) => setPwdData({ ...pwdData, current_password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password with Eye Toggle */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">New Password (Min 6 characters)</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={pwdData.new_password}
                      onChange={(e) => setPwdData({ ...pwdData, new_password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 rounded-lg transition"
                  >
                    {pwdLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
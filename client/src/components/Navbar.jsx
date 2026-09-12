import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Edit3, Search, LogOut, BookOpen } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const avatarUrl = user?.avatarUrl;
  const userName = user?.name || 'User';
  const initial = userName.charAt(0).toUpperCase();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [imgError, setImgError] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/');
    }
  };

  const avatarElement =
    avatarUrl && !imgError ? (
      <img
        src={avatarUrl}
        alt={userName}
        className="w-7 h-7 rounded-full object-cover border border-gray-200"
        onError={() => setImgError(true)}
      />
    ) : (
      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
        {initial}
      </div>
    );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 tracking-tight">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <span>Hashnode<span className="text-gray-900">Dev</span></span>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative hidden sm:block">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search articles, topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/create"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>Write</span>
              </Link>

              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                {avatarElement}
                <span className="font-semibold">{userName}</span>
              </Link>

              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
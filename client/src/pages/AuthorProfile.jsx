import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Calendar, ArrowUpRight, BookOpen, ExternalLink } from 'lucide-react';

const renderBioWithClickableLinks = (text) => {
  if (!text) return null;

  const linkRegex =
    /\[([^\]]+)\]\(((?:https?:\/\/|www\.)[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s,]+)|((?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|dev|in|co|me|app)(?:\/[^\s,]*)?)/gi;

  const elements = [];
  let lastIdx = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      elements.push(text.slice(lastIdx, match.index));
    }

    if (match[1] && match[2]) {
      const href = match[2].startsWith('http') ? match[2] : `https://${match[2]}`;
      elements.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition"
        >
          {match[1]}
        </a>
      );
    } else {
      const raw = match[3] || match[4];
      const href = raw.startsWith('http') ? raw : `https://${raw}`;
      elements.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium break-all transition"
        >
          {raw}
        </a>
      );
    }

    lastIdx = linkRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    elements.push(text.slice(lastIdx));
  }

  return elements;
};

export default function AuthorProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAuthor = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/auth/users/${id}`);
        setProfile(res.data);
      } catch (err) {
        setError('Author profile not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchAuthor();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping" />
          Loading author profile...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-600 font-medium text-lg">{error || 'Unable to load profile.'}</p>
        <Link
          to="/"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm"
        >
          Back to Feed
        </Link>
      </div>
    );
  }

  const { author, posts } = profile;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Header Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">
          {author.avatarUrl ? (
            <img
              src={author.avatarUrl}
              alt={author.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-slate-100 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-bold border border-blue-100 shadow-sm shrink-0">
              {author.name?.charAt(0)?.toUpperCase()}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {author.name}
              </h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">Author</p>
            </div>

            {/* Bio */}
            <div className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl whitespace-pre-line break-words">
              {author.bio ? (
                renderBioWithClickableLinks(author.bio)
              ) : (
                <span className="italic text-slate-400">Technical writer &amp; software enthusiast.</span>
              )}
            </div>

            {/* Links & Socials */}
            <div className="flex items-center justify-center sm:justify-start gap-4 pt-1">
              {author.github && (
                <a
                  href={author.github.startsWith('http') ? author.github : `https://${author.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Published Posts by Author */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Published Articles
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200/70 text-slate-700 rounded-full">
              {posts.length}
            </span>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              No published articles yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {posts.map((p) => (
                <article
                  key={p.id || p._id}
                  className="group bg-white border border-slate-200/80 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all duration-150"
                >
                  <Link
                    to={`/post/${p.slug || p.id || p._id}`}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                        {p.title}
                      </h3>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recent'}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0 mt-1" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
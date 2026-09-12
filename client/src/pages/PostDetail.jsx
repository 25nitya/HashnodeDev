import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Calendar, ArrowLeft } from 'lucide-react';

export default function PostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/${slug}`);
        setPost(res.data);
      } catch (err) {
        setError('Article not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  // Robust URL & Markdown Link Parser for Bio
  const renderBioWithClickableLinks = (text) => {
    if (!text) return null;

    // Matches [Label](https://...) OR https?://... OR www.... OR common domains (github.com, etc.)
    const linkRegex = /\[([^\]]+)\]\(((?:https?:\/\/|www\.)[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s,]+)|((?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|dev|in|co|me|app)(?:\/[^\s,]*)?)/gi;

    const elements = [];
    let lastIdx = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        elements.push(text.slice(lastIdx, match.index));
      }

      if (match[1] && match[2]) {
        // Formatted Markdown Link: [Name](URL)
        const href = match[2].startsWith('http') ? match[2] : `https://${match[2]}`;
        elements.push(
          <a
            key={match.index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {match[1]}
          </a>
        );
      } else {
        // Raw URL or Domain: https://... or github.com/...
        const raw = match[3] || match[4];
        const href = raw.startsWith('http') ? raw : `https://${raw}`;
        elements.push(
          <a
            key={match.index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium break-all"
            onClick={(e) => e.stopPropagation()}
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

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading article...</div>;
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">404 - Post Not Found</h2>
        <Link to="/" className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>
      </div>
    );
  }

  const authorId = post.author?.id || post.author?._id;
  const authorName = post.author?.name || 'Anonymous';
  const authorBio = post.author?.bio;
  const avatarUrl = post.author?.avatarUrl;
  const initial = authorName.charAt(0).toUpperCase();

  const authorAvatar =
    avatarUrl && !imgError ? (
      <img
        src={avatarUrl}
        alt={authorName}
        className="w-14 h-14 rounded-full object-cover border border-gray-200 shadow-sm flex-shrink-0"
        onError={() => setImgError(true)}
      />
    ) : (
      <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-sm flex-shrink-0">
        {initial}
      </div>
    );

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-blue-600 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </Link>

      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-8 border border-gray-200"
        />
      )}

      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-6">
        {post.title}
      </h1>

      {/* Author Header Banner */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {authorId ? (
          <Link to={`/author/${authorId}`} className="hover:opacity-90 transition">
            {authorAvatar}
          </Link>
        ) : (
          authorAvatar
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {authorId ? (
              <Link
                to={`/author/${authorId}`}
                className="text-base font-bold text-gray-900 hover:text-blue-600 transition"
              >
                {authorName}
              </Link>
            ) : (
              <span className="text-base font-bold text-gray-900">{authorName}</span>
            )}

            <span className="text-gray-400 text-xs">•</span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Bio with custom parser */}
          {authorBio ? (
            <p className="text-sm text-gray-600 leading-relaxed break-words whitespace-pre-line">
              {renderBioWithClickableLinks(authorBio)}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">Author has not set a bio yet.</p>
          )}
        </div>

        {authorId && (
          <Link
            to={`/author/${authorId}`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-lg shadow-xs hover:bg-blue-50 transition sm:self-center"
          >
            View Profile →
          </Link>
        )}
      </div>

      {/* Article Content */}
      <div className="prose max-w-none text-gray-800 leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="rounded-xl overflow-hidden my-5 border border-gray-800 shadow-md">
                  <div className="bg-gray-800 px-4 py-1.5 text-xs text-gray-300 font-mono flex justify-between items-center">
                    <span>{match[1]}</span>
                  </div>
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: '#1e1e1e',
                      fontSize: '0.875rem',
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code
                  className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {/* Tags Section */}
      <div className="flex flex-wrap gap-2 pt-8 mt-12 border-t border-gray-200">
        {post.tags?.map((t, idx) => {
          const tagName = typeof t === 'string' ? t : t?.name;
          const tagSlug = typeof t === 'string' ? t.toLowerCase() : t?.slug || tagName?.toLowerCase();
          if (!tagName) return null;

          return (
            <Link
              key={t?.id || tagSlug || idx}
              to={`/?tag=${tagSlug}`}
              className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
            >
              #{tagName}
            </Link>
          );
        })}
      </div>
    </article>
  );
}
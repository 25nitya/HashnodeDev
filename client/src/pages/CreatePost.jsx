import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Eye, Edit3, Send, Save } from 'lucide-react';

export default function CreatePost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [error, setError] = useState('');

  // Fetch and restore draft content
  useEffect(() => {
    if (id) {
      const fetchDraft = async () => {
        setLoadingDraft(true);
        try {
          const res = await api.get('/posts/mine');
          const existing = res.data.find(
            (p) => String(p.id) === String(id) || String(p._id) === String(id)
          );

          if (existing) {
            setTitle(existing.title || '');
            setContent(existing.content || '');
            setCoverImage(existing.coverImage || '');
            const existingTags = existing.tags
              ? existing.tags
                  .map((t) => (typeof t === 'string' ? t : t.name || t.slug))
                  .join(', ')
              : '';
            setTagsInput(existingTags);
          } else {
            setError('Post or draft not found.');
          }
        } catch (err) {
          setError('Failed to load draft content.');
        } finally {
          setLoadingDraft(false);
        }
      };
      fetchDraft();
    }
  }, [id]);

  const handleSubmit = async (status) => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    // Format tags into structured objects expected by MongoDB & backend models
    const formattedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));

    // Auto-generate plain text excerpt
    const plainText = content.replace(/[#*`_~[\]()]/g, '').trim();
    const excerpt = plainText.length > 150 ? plainText.slice(0, 150) + '...' : plainText;

    const payload = {
      title: title.trim(),
      content: content.trim(),
      excerpt,
      tags: formattedTags,
      coverImage: coverImage.trim() || undefined,
      status,
    };

    try {
      let res;
      if (id) {
        // Update existing post/draft
        res = await api.put(`/posts/${id}`, payload);
      } else {
        // Create new post
        res = await api.post('/posts', payload);
      }

      if (status === 'published') {
        const postSlug = res.data?.slug;
        if (postSlug) {
          navigate(`/post/${postSlug}`);
        } else {
          navigate('/');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Publish error:', err.response?.data);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Handle FastAPI validation error arrays
        setError(detail.map((d) => d.msg || d.loc?.join('.')).join(', '));
      } else {
        setError(detail || 'Failed to save article. Please check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingDraft) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
        Loading content...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-md transition ${
              activeTab === 'write'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-md transition ${
              activeTab === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('draft')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('published')}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <input
          type="text"
          placeholder="Article Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl sm:text-3xl font-bold placeholder-gray-300 border-none outline-none focus:ring-0"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <input
            type="text"
            placeholder="Tags (comma-separated: python, fastapi, react)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Cover Image URL (optional)"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
          />
        </div>

        {activeTab === 'write' ? (
          <textarea
            placeholder="Write your article in Markdown..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="w-full font-mono text-sm p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="prose max-w-none min-h-[350px] p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-y-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="rounded-xl overflow-hidden my-4 border border-gray-800 shadow-md">
                      <div className="bg-gray-800 px-4 py-1 text-xs text-gray-300 font-mono">
                        {match[1]}
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
                      className="bg-gray-200 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content || '*Nothing to preview yet...*'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
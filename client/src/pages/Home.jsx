import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Tag, Calendar, Eye,EyeOff} from 'lucide-react';

export default function Home() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const activeTag = searchParams.get('tag') || '';

  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchFeed = async () => {
      setLoading(true);

      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (activeTag) queryParams.append('tag', activeTag);

      const queryString = queryParams.toString();
      const postUrl = queryString ? `/posts?${queryString}` : '/posts';

      // 1. Fetch articles first so feed renders right away
      try {
        const postsRes = await api.get(postUrl);
        if (isMounted) {
          setPosts(postsRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }

      // 2. Fetch sidebar tags from /posts/tags (matches router prefix)
      try {
        const tagsRes = await api.get('/posts/tags');
        if (isMounted) {
          setTags(tagsRes.data || []);
        }
      } catch (err) {
        console.warn('Failed to load tags sidebar:', err);
      }
    };

    fetchFeed();

    return () => {
      isMounted = false;
    };
  }, [search, activeTag]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Feed */}
        <main className="lg:col-span-3 space-y-6">
          {(search || activeTag) && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl">
              <span className="text-sm text-blue-900 font-medium">
                Showing results for: {search && `"${search}"`} {activeTag && `#${activeTag}`}
              </span>
              <Link to="/" className="text-xs font-semibold text-blue-600 hover:underline">
                Clear Filters
              </Link>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading articles...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <p className="text-gray-500 text-lg">No articles found.</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to publish one!</p>
            </div>
          ) : (
            posts.map((post) => {
              const authorId = post.author?.id || post.author?._id;
              const authorName = post.author?.name || 'Anonymous';
              const avatarUrl = post.author?.avatarUrl;
              const initial = authorName.charAt(0).toUpperCase();

              // Reusable Avatar Node
              const avatarElement = avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={authorName}
                  className="w-7 h-7 rounded-full object-cover border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {initial}
                </div>
              );

              return (
                <article
                  key={post.id || post._id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    {/* Author Profile Link with Avatar */}
                    {authorId ? (
                      <Link
                        to={`/author/${authorId}`}
                        className="flex items-center gap-2 font-medium text-gray-700 hover:text-blue-600 transition"
                      >
                        {avatarElement}
                        <span className="text-sm font-semibold">{authorName}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 font-medium text-gray-700">
                        {avatarElement}
                        <span className="text-sm font-semibold">{authorName}</span>
                      </div>
                    )}

                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <Link to={`/post/${post.slug || post.id || post._id}`}>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-blue-600 transition mb-2">
                  {post.title}
                  </h2>
                  </Link>

                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{post.excerpt}</p>

                  <div className="flex flex-wrap items-center gap-2">
                    {post.tags?.map((t, idx) => {
                      const tagName = typeof t === 'string' ? t : (t?.name || '');
                      const tagSlug = typeof t === 'string' ? t.toLowerCase() : (t?.slug || tagName.toLowerCase());
                      if (!tagName) return null;

                      return (
                        <Link
                          key={t?.id || t?.slug || idx}
                          to={`/?tag=${tagSlug}`}
                          className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
                        >
                          #{tagName}
                        </Link>
                      );
                    })}
                  </div>
                </article>
              );
            })
          )}
        </main>

        {/* Sidebar Tags */}
        <aside className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              <Tag className="w-4 h-4 text-blue-600" />
              Popular Topics
            </h3>

            <div className="flex flex-wrap gap-2">
              {tags.map((t, idx) => {
                const tagName = t?.name || (typeof t === 'string' ? t : '');
                const tagSlug = t?.slug || tagName.toLowerCase();
                const postCount = t?.postCount ?? null;

                if (!tagName) return null;

                return (
                  <Link
                    key={t?.id || tagSlug || idx}
                    to={`/?tag=${tagSlug}`}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                      activeTag.toLowerCase() === tagSlug.toLowerCase()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tagName} {postCount !== null && <span className="opacity-70 text-[10px]">({postCount})</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
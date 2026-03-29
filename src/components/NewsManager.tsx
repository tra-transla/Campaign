import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Edit2, Save, X, Megaphone } from 'lucide-react';
import { motion } from 'motion/react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function NewsManager() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNews = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      setError('Vui lòng nhập tiêu đề và nội dung tin tức');
      return;
    }

    try {
      setError(null);
      const { data, error } = await supabase
        .from('news')
        .insert([{ title: newTitle.trim(), content: newContent.trim() }])
        .select();

      if (error) throw error;

      if (data) {
        setNews([data[0], ...news]);
        setNewTitle('');
        setNewContent('');
        setIsAdding(false);
      }
    } catch (err: any) {
      console.error('Error adding news:', err);
      setError(err.message);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin tức này?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNews(news.filter(n => n.id !== id));
    } catch (err: any) {
      console.error('Error deleting news:', err);
      setError(err.message);
    }
  };

  const startEditing = (item: NewsItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleUpdateNews = async () => {
    if (!editingId || !editTitle.trim() || !editContent.trim()) {
      setError('Vui lòng nhập tiêu đề và nội dung tin tức');
      return;
    }

    try {
      setError(null);
      const { data, error } = await supabase
        .from('news')
        .update({ title: editTitle.trim(), content: editContent.trim() })
        .eq('id', editingId)
        .select();

      if (error) throw error;

      if (data) {
        setNews(news.map(n => n.id === editingId ? data[0] : n));
        cancelEditing();
      }
    } catch (err: any) {
      console.error('Error updating news:', err);
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
      <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Megaphone className="text-zinc-500" size={20} />
          <h2 className="text-lg font-semibold text-zinc-800">Quản lý Tin tức</h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 bg-camo-accent hover:bg-camo-accent/90 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'Hủy' : 'Thêm tin tức'}
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-zinc-50 rounded-lg border border-zinc-200"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Tiêu đề</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-camo-accent"
                  placeholder="Nhập tiêu đề tin tức..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nội dung</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-camo-accent min-h-[100px]"
                  placeholder="Nhập nội dung tin tức..."
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleAddNews}
                  className="flex items-center gap-2 bg-camo-accent hover:bg-camo-accent/90 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  <Save size={16} />
                  Lưu tin tức
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-8 text-zinc-500">Đang tải tin tức...</div>
        ) : news.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">Chưa có tin tức nào</div>
        ) : (
          <div className="space-y-4">
            {news.map((item) => (
              <div key={item.id} className="border border-zinc-200 rounded-lg p-4">
                {editingId === item.id ? (
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-camo-accent"
                      />
                    </div>
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-camo-accent min-h-[100px]"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-md text-sm font-medium"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleUpdateNews}
                        className="flex items-center gap-1 bg-camo-accent hover:bg-camo-accent/90 text-white px-3 py-1.5 rounded-md text-sm font-medium"
                      >
                        <Save size={16} />
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-zinc-900">{item.title}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteNews(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-zinc-600 whitespace-pre-wrap text-sm mb-2">{item.content}</p>
                    <div className="text-xs text-zinc-400">
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

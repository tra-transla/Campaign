import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    team: '',
    inGameName: '',
    tanks: ''
  });
  const [customTeam, setCustomTeam] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const teams = ['Cá Kiếm', 'Minato', 'Team 3 (Tự điền)', 'Team 4 (Tự điền)'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const finalTeam = formData.team.includes('Tự điền') ? customTeam : formData.team;

    if (!finalTeam || !formData.inGameName || !formData.tanks) {
      setStatus('error');
      setErrorMessage('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    try {
      const { error } = await supabase
        .from('registrations')
        .insert([{ 
          team: finalTeam, 
          in_game_name: formData.inGameName, 
          tanks: formData.tanks 
        }]);

      if (error) throw error;
      
      setStatus('success');
      setFormData({ team: '', inGameName: '', tanks: '' });
      setCustomTeam('');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Đăng ký thành công!</h2>
          <p className="text-zinc-500 mb-8">Cảm ơn bạn đã đăng ký tham gia Campaign 2026.</p>
          <button 
            onClick={() => setStatus('idle')}
            className="w-full bg-zinc-900 text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
          >
            Đăng ký thêm
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">Campaign 2026</h1>
        <p className="text-zinc-500">Đăng ký thông tin tham gia giải đấu</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100 max-w-md w-full"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Chọn Team
            </label>
            <select
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all bg-white"
              required
            >
              <option value="" disabled>-- Chọn team của bạn --</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          {formData.team.includes('Tự điền') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Tên Team (Tự điền)
              </label>
              <input
                type="text"
                value={customTeam}
                onChange={(e) => setCustomTeam(e.target.value)}
                placeholder="Nhập tên team của bạn"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all"
                required
              />
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Tên trong game (In-game Name)
            </label>
            <input
              type="text"
              value={formData.inGameName}
              onChange={(e) => setFormData({ ...formData, inGameName: e.target.value })}
              placeholder="Ví dụ: PlayerOne123"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Tanks (Các xe tăng sử dụng)
            </label>
            <textarea
              value={formData.tanks}
              onChange={(e) => setFormData({ ...formData, tanks: e.target.value })}
              placeholder="Liệt kê các xe tăng bạn sẽ sử dụng..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all resize-none"
              required
            />
          </div>

          {status === 'error' && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-zinc-900 text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {status === 'submitting' ? 'Đang gửi...' : (
              <>
                <Send size={18} />
                Gửi Đăng Ký
              </>
            )}
          </button>
        </form>
      </motion.div>
      
      <div className="mt-8 text-sm text-zinc-400">
        <a href="/admin/login" className="hover:text-zinc-600 transition-colors">Quản trị viên</a>
      </div>
    </div>
  );
}

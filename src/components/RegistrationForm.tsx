import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, CheckCircle2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Registration {
  id: string | number;
  team: string;
  in_game_name: string;
  tanks: string;
  created_at: string;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    team: '',
    inGameName: '',
    tanks: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [teams, setTeams] = useState<string[]>(['Cá Kiếm', 'Minato', 'Team đấu giá', 'Team vá lốp']);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);

  useEffect(() => {
    fetchRegistrations();
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('name')
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      if (data && data.length > 0) {
        setTeams(data.map(t => t.name));
      }
    } catch (error) {
      console.error('Failed to fetch teams', error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      if (data) setRegistrations(data);
    } catch (error) {
      console.error('Failed to fetch registrations', error);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    if (!formData.team || !formData.inGameName || !formData.tanks) {
      setStatus('error');
      setErrorMessage('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    try {
      const { error } = await supabase
        .from('registrations')
        .insert([{ 
          team: formData.team, 
          in_game_name: formData.inGameName, 
          tanks: formData.tanks 
        }]);

      if (error) throw error;
      
      setStatus('success');
      setFormData({ team: '', inGameName: '', tanks: '' });
      fetchRegistrations(); // Refresh list after successful registration
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    }
  };

  // Group registrations by team
  const groupedRegistrations = registrations.reduce((acc, reg) => {
    const teamName = reg.team || 'Khác';
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(reg);
    return acc;
  }, {} as Record<string, Registration[]>);

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
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">Campaign 2026</h1>
          <p className="text-zinc-500">Đăng ký thông tin tham gia giải đấu</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-zinc-100 sticky top-8"
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
            
            <div className="mt-8 text-sm text-zinc-400 text-center lg:text-left">
              <a href="/admin/login" className="hover:text-zinc-600 transition-colors">Quản trị viên</a>
            </div>
          </div>

          {/* Right Column - Registered Teams */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-zinc-100 min-h-[600px]"
            >
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-100">
                <div className="bg-zinc-100 p-2 rounded-lg text-zinc-600">
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Danh sách đăng ký</h2>
                  <p className="text-sm text-zinc-500">Thông tin các team đã đăng ký tham gia</p>
                </div>
              </div>

              {loadingRegistrations ? (
                <div className="flex justify-center items-center h-64 text-zinc-500">
                  Đang tải dữ liệu...
                </div>
              ) : Object.keys(groupedRegistrations).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                  <Users size={48} className="mb-4 opacity-20" />
                  <p>Chưa có team nào đăng ký</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(groupedRegistrations).map(([teamName, members]: [string, Registration[]]) => (
                    <div key={teamName} className="bg-zinc-50 rounded-xl border border-zinc-200 overflow-hidden">
                      <div className="bg-zinc-900 px-4 py-3 flex justify-between items-center">
                        <h3 className="font-semibold text-white">{teamName}</h3>
                        <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md font-medium">
                          {members.length} thành viên
                        </span>
                      </div>
                      <div className="p-4">
                        <ul className="space-y-4">
                          {members.map((member, index) => (
                            <li key={member.id} className={index !== members.length - 1 ? "border-b border-zinc-200 pb-4" : ""}>
                              <div className="font-medium text-zinc-900 mb-1">{member.in_game_name}</div>
                              <div className="text-sm text-zinc-500">
                                <span className="font-medium text-zinc-700">Tanks:</span> {member.tanks}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

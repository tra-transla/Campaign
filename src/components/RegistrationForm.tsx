import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, CheckCircle2, Users, Swords, ChevronDown, ChevronRight, Megaphone, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Registration {
  id: string | number;
  team: string;
  in_game_name: string;
  tanks: string;
  is_winner?: boolean;
  created_at: string;
}

interface TeamOption {
  name: string;
  is_locked: boolean;
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
  const [teams, setTeams] = useState<TeamOption[]>([
    { name: 'Cá Kiếm', is_locked: false },
    { name: 'Minato', is_locked: false },
    { name: 'Team đấu giá', is_locked: false },
    { name: 'Team vá lốp', is_locked: false }
  ]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [activeTab, setActiveTab] = useState<'registrations' | 'news'>('registrations');
  const [listTab, setListTab] = useState<'all' | 'results'>('all');
  const [news, setNews] = useState<any[]>([]);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchRegistrations();
    fetchTeams();
    fetchNews();

    // Subscribe to real-time changes
    const registrationsSubscription = supabase
      .channel('public:registrations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        fetchRegistrations();
      })
      .subscribe();

    const teamsSubscription = supabase
      .channel('public:teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(registrationsSubscription);
      supabase.removeChannel(teamsSubscription);
    };
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('name, is_locked')
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      if (data && data.length > 0) {
        setTeams(data.map(t => ({ name: t.name, is_locked: t.is_locked || false })));
      }
    } catch (error) {
      console.error('Failed to fetch teams', error);
    }
  };

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setNews(data);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
    }
  };

  const toggleTeam = (teamName: string) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamName]: prev[teamName] === false ? true : false
    }));
  };

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('id, team, in_game_name, tanks, created_at, is_winner')
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

    if (!formData.team.trim() || !formData.inGameName.trim() || !formData.tanks.trim()) {
      setStatus('error');
      setErrorMessage('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    const selectedTeam = teams.find(t => t.name === formData.team);
    if (selectedTeam?.is_locked) {
      setStatus('error');
      setErrorMessage('Team này đã chốt danh sách, không thể đăng ký thêm.');
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
  const filteredRegistrations = registrations.filter(reg => listTab === 'all' || reg.is_winner);
  const groupedRegistrations = filteredRegistrations.reduce((acc, reg) => {
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
            className="w-full bg-tank-camo bg-tank-camo-hover text-camo-light py-3 rounded-xl font-medium transition-colors"
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
        <div className="mb-8 flex items-center gap-4">
          <img 
            src="https://i.ibb.co/nsCSz9mT/AFO.png" 
            alt="Campaign Logo" 
            className="w-[75px] h-[75px] object-contain"
          />
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Campaign 2026</h1>
            <p className="text-zinc-500">Spring Maneuvers: 23/03/2026 đến 06/04/2026</p>
          </div>
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
                    Chọn Team <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all bg-white"
                    required
                  >
                    <option value="" disabled>-- Chọn team của bạn --</option>
                    {teams.map(team => (
                      <option 
                        key={team.name} 
                        value={team.name}
                        disabled={team.is_locked}
                      >
                        {team.name} {team.is_locked ? '(Đã chốt)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Tên trong game (In-game Name) <span className="text-red-500">*</span>
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
                    Tanks (Các xe tăng sử dụng) <span className="text-red-500">*</span>
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
                  className="w-full bg-tank-camo bg-tank-camo-hover text-camo-light py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {status === 'submitting' ? 'Đang gửi...' : (
                    <>
                      <Send size={18} />
                      Gửi Đăng Ký
                    </>
                  )}
                </button>
                
                <div className="text-center text-sm font-medium text-zinc-900 opacity-50 pt-2">
                  © 2026 • Ice Tea
                </div>
              </form>
            </motion.div>
            
            <div className="mt-8 text-sm text-zinc-400 text-center lg:text-left">
              <a href="/admin/login" className="hover:text-zinc-600 transition-colors">Quản trị viên</a>
            </div>
          </div>

          {/* Right Column - Registered Teams & News */}
          <div className="lg:col-span-8 space-y-8">
            {news.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-zinc-100"
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    <Megaphone size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">Tin tức mới nhất</h2>
                    <p className="text-sm text-zinc-500">Thông báo từ ban tổ chức</p>
                  </div>
                </div>
                <div className="h-[250px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                  {news.map((item) => (
                    <div key={item.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                      <h3 className="font-bold text-lg text-zinc-900 mb-2">{item.title}</h3>
                      <p className="text-zinc-600 whitespace-pre-wrap text-sm mb-3">{item.content}</p>
                      <div className="text-xs text-zinc-400">
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-zinc-100 min-h-[600px]"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-100 p-2 rounded-lg text-zinc-600">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">Danh sách đăng ký</h2>
                    <p className="text-sm text-zinc-500">Thông tin các team đã đăng ký tham gia</p>
                  </div>
                </div>
                <div className="flex bg-zinc-100 p-1 rounded-lg">
                  <button
                    onClick={() => setListTab('results')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                      listTab === 'results' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    <Trophy size={16} className={listTab === 'results' ? "text-yellow-500" : ""} />
                    Kết quả
                  </button>
                  <button
                    onClick={() => setListTab('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      listTab === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    Danh sách
                  </button>
                </div>
              </div>

              {loadingRegistrations ? (
                <div className="flex justify-center items-center h-64 text-zinc-500">
                  Đang tải dữ liệu...
                </div>
              ) : Object.keys(groupedRegistrations).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                  {listTab === 'results' ? (
                    <>
                      <Trophy size={48} className="mb-4 opacity-20" />
                      <p>Chưa có kết quả nào được công bố</p>
                    </>
                  ) : (
                    <>
                      <Users size={48} className="mb-4 opacity-20" />
                      <p>Chưa có team nào đăng ký</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(groupedRegistrations)
                    .sort(([teamA], [teamB]) => teamA.localeCompare(teamB))
                    .map(([teamName, members]: [string, Registration[]]) => {
                      const isExpanded = expandedTeams[teamName] !== false;
                      return (
                      <div key={teamName} className="bg-zinc-50 rounded-xl border border-zinc-200 overflow-hidden">
                        <div 
                          className="bg-tank-camo px-4 py-3 flex justify-between items-center cursor-pointer select-none"
                          onClick={() => toggleTeam(teamName)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown size={18} className="text-camo-accent" />
                            ) : (
                              <ChevronRight size={18} className="text-camo-accent" />
                            )}
                            <Swords size={18} className="text-camo-accent" />
                            <h3 className="font-semibold text-camo-light">{teamName}</h3>
                          </div>
                          <span className="bg-camo-accent text-camo-light text-xs px-2 py-1 rounded-md font-medium">
                            {members.length} thành viên
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="p-4">
                            <ul className="space-y-4">
                              {members.map((member, index) => (
                                <li key={member.id} className={index !== members.length - 1 ? "border-b border-zinc-200 pb-4" : ""}>
                                  <div className="font-medium text-zinc-900 mb-1 flex items-center gap-2">
                                    {member.in_game_name}
                                    {member.is_winner && listTab === 'all' && (
                                      <Trophy size={14} className="text-yellow-500 fill-yellow-500" title="Đã chọn vào kết quả" />
                                    )}
                                  </div>
                                  <div className="text-sm text-zinc-500">
                                    <span className="font-medium text-zinc-700">Tanks:</span> {member.tanks}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )})}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

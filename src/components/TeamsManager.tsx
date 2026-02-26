import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Users, Edit2, Save, X, Swords } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  created_at: string;
}

export default function TeamsManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');

  useEffect(() => {
    fetchTeams();

    // Subscribe to real-time changes
    const teamsSubscription = supabase
      .channel('manager:teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(teamsSubscription);
    };
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      if (data) setTeams(data);
    } catch (error) {
      console.error('Failed to fetch teams', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{ name: newTeamName.trim() }])
        .select();

      if (error) throw error;
      
      if (data) {
        setTeams([...teams, data[0]]);
        setNewTeamName('');
      }
    } catch (error: any) {
      console.error('Failed to add team', error);
      alert('Lỗi khi thêm team: ' + error.message);
    }
  };

  const handleEditClick = (team: Team) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setEditTeamName('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTeamName.trim()) return;

    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: editTeamName.trim() })
        .eq('id', id);

      if (error) throw error;

      setTeams(teams.map(t => t.id === id ? { ...t, name: editTeamName.trim() } : t));
      setEditingTeamId(null);
    } catch (error: any) {
      console.error('Failed to update team', error);
      alert('Lỗi khi cập nhật team: ' + error.message);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa team này?')) return;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTeams(teams.filter(t => t.id !== id));
    } catch (error: any) {
      console.error('Failed to delete team', error);
      alert('Lỗi khi xóa team: ' + error.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
          <Users size={20} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Quản lý Team</h2>
      </div>

      <form onSubmit={handleAddTeam} className="flex gap-4 mb-8">
        <input
          type="text"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="Tên team mới..."
          className="flex-1 px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          type="submit"
          disabled={!newTeamName.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-500 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={18} />
          Thêm Team
        </button>
      </form>

      {loading ? (
        <div className="text-center py-8 text-zinc-500">Đang tải...</div>
      ) : (
        <div className="border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-sm font-medium text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-4">Tên Team</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-zinc-500">
                    Chưa có team nào
                  </td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr key={team.id} className="hover:bg-zinc-50 transition-colors">
                    {editingTeamId === team.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleSaveEdit(team.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors font-medium"
                              title="Lưu"
                            >
                              <Save size={16} />
                              <span>Lưu</span>
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors font-medium"
                              title="Hủy"
                            >
                              <X size={16} />
                              <span>Hủy</span>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-medium text-zinc-900">
                          <div className="flex items-center gap-2">
                            <Swords size={16} className="text-zinc-400" />
                            {team.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEditClick(team)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
                              title="Chỉnh sửa"
                            >
                              <Edit2 size={16} />
                              <span>Sửa</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteTeam(team.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium"
                              title="Xóa team"
                            >
                              <Trash2 size={16} />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

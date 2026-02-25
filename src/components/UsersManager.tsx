import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, ShieldAlert, UserPlus } from 'lucide-react';

interface User {
  id: string;
  username: string;
  role: string;
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Điều hành');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, role')
        .order('username', { ascending: true });
        
      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ 
          username: newUsername.trim(),
          password: newPassword,
          role: newRole
        }])
        .select('id, username, role');

      if (error) throw error;
      
      if (data) {
        setUsers([...users, data[0]]);
        setNewUsername('');
        setNewPassword('');
        setNewRole('Điều hành');
      }
    } catch (error: any) {
      console.error('Failed to add user', error);
      alert('Lỗi khi thêm người dùng: ' + error.message);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}"?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsers(users.filter(u => u.id !== id));
    } catch (error: any) {
      console.error('Failed to delete user', error);
      alert('Lỗi khi xóa người dùng: ' + error.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
          <ShieldAlert size={20} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Quản lý Người dùng</h2>
      </div>

      <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="Tên đăng nhập..."
          className="px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          required
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mật khẩu..."
          className="px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          required
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className="px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
        >
          <option value="Điều hành">Điều hành</option>
          <option value="Quản trị">Quản trị</option>
        </select>
        <button
          type="submit"
          disabled={!newUsername.trim() || !newPassword.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <UserPlus size={18} />
          Thêm
        </button>
      </form>

      {loading ? (
        <div className="text-center py-8 text-zinc-500">Đang tải...</div>
      ) : (
        <div className="border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-sm font-medium text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-4">Tên đăng nhập</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                    Chưa có người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        u.role === 'Quản trị' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium"
                          title="Xóa người dùng"
                        >
                          <Trash2 size={16} />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
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

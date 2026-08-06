import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '@/services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = useSelector((state) => state.auth);

  const toggleAdminStatus = async (user) => {
    const newIsStaff = !user.is_staff;
    try {
      await api.patch(`admin/users/${user.id}/`, { is_staff: newIsStaff });
      // Обновляем локальный список без полной перезагрузки
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_staff: newIsStaff } : u))
      );
    } catch (err) {
      console.error(err);
      setError('Не удалось обновить права пользователя');
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('admin/users/');
        setUsers(response.data);
      } catch (err) {
        setError(
          err.response?.status === 403
            ? 'Нет прав администратора'
            : err.response?.data?.detail || err.message || 'Ошибка загрузки'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (!auth.isAuthenticated) return <div>Требуется авторизация</div>;
  if (!auth.isAdmin) {
    return (
      <div sx={{ padding: 20, color: '#666' }}>
        <h2>Админ-панель</h2>
        <p>У вас нет прав администратора.</p>
      </div>
    );
  }
  if (loading) return <div sx={{ padding: 20 }}>Загрузка списка пользователей...</div>;
  if (error) return <div sx={{ padding: 20, color: 'red' }}>{error}</div>;

  return (
    <div sx={{ padding: '20px' }}>
      <h2>Управление пользователями</h2>
      <table sx={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr sx={{ background: '#f5f5f5' }}>
            <th sx={cellStyle}>ID</th>
            <th sx={cellStyle}>Username</th>
            <th sx={cellStyle}>Email</th>
            <th sx={cellStyle}>Роль</th>
            <th sx={cellStyle}>Файлы (шт)</th>
            <th sx={cellStyle}>Место</th>
            <th sx={{ ...cellStyle, textAlign: 'center' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td sx={cellStyle}>{u.id}</td>
              <td sx={cellStyle}>{u.username}</td>
              <td sx={cellStyle}>{u.email}</td>
              <td sx={{ ...cellStyle, fontWeight: 'bold' }}>
                {u.is_superuser ? (
                  <span sx={{ color: '#d9534f' }}>SuperAdmin</span>
                ) : u.is_staff ? (
                  <span sx={{ color: '#5bc0de' }}>Staff (Админ)</span>
                ) : (
                  'User'
                )}
              </td>
              <td sx={cellStyle}>{u.files_count || 0}</td>
              <td sx={cellStyle}>
                {(u.files_size_bytes / 1024 / 1024).toFixed(2)} MB
              </td>
              <td sx={{ ...cellStyle, textAlign: 'center' }}>
                <button
                  onClick={() => toggleAdminStatus(u)}
                  disabled={u.is_superuser}
                  sx={{
                    padding: '6px 12px',
                    cursor: u.is_superuser ? 'not-allowed' : 'pointer',
                    backgroundColor: u.is_staff ? '#d9534f' : '#5cb85c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                >
                  {u.is_staff ? 'Снять админа' : 'Сделать админом'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cellStyle = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left',
};

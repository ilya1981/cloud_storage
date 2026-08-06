import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { logout } from '@/store/authSlice';
import {
  Box, Typography, Paper, Alert, Button, LinearProgress, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Tooltip, CircularProgress
} from '@mui/material';






const formatSize = (bytes) => {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function AdminPanel() {
  const { enqueueSnackbar } = useSnackbar;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('admin/users/');
        setUsers(response.data);
      } catch (err) {
        console.error('Ошибка загрузки пользователей:', err);
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

  // Проверка прав
  if (!auth.user || !auth.user.is_staff) {
    return (
      <div style={{ padding: 20 }}>
        Требуется авторизация с правами администратора
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20 }}>Загрузка списка пользователей...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

const handleLogout = async () => {
  try {
    await api.post('logout/'); // вместо /api/auth/logout/
    dispatch(logout());
  } catch (err) {
    console.error('Ошибка выхода:', err);
    dispatch(logout()); // всё равно выходим на клиенте
  }
};


  const toggleAdminStatus = async (user) => {
    setProcessingId(user.id);
    const newIsStaff = !user.is_staff;
    try {
      await api.patch(`admin/users/${user.id}/`, { is_staff: newIsStaff });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_staff: newIsStaff } : u))
      );
    } catch (err) {
      enqueueSnackbar('Не удалось обновить права пользователя. Проверьте консоль.', {variant: 'error'});
    } finally {
      setProcessingId(null);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя "${user.username}"?\n\nВнимание: файлы пользователя останутся в хранилище.`)) {
      return;
    }

    setProcessingId(user.id);
    try {
      await api.delete(`admin/users/${user.id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      enqueueSnackbar('Не удалось удалить пользователя. Возможно, у вас недостаточно прав.', {variant: 'error'});
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div sx={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Шапка с кнопкой выхода */}
      <header sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2 sx={{ margin: 0 }}>Админ-панель: управление пользователями</h2>
        <div sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span sx={{ fontWeight: '500', color: '#333' }}>
            Вы вошли как: <strong>{auth.user.username}</strong>
          </span>
          <button
            onClick={handleLogout}
            sx={{
              padding: '8px 16px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#b71c1c')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#d32f2f')}
          >
            Выход
          </button>
        </div>
      </header>

      <p>Всего пользователей: {users.length}</p>

      <table sx={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr sx={{ background: '#f5f5f5' }}>
            <th sx={cellStyle}>ID</th>
            <th sx={cellStyle}>Username</th>
            <th sx={cellStyle}>Email</th>
            <th sx={cellStyle}>Дата регистрации</th>
            <th sx={{ ...cellStyle, width: '220px' }}>Файлы</th>
            <th sx={{ ...cellStyle, width: '120px' }}>Статус</th>
            <th sx={{ ...cellStyle, textAlign: 'center', width: '280px' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} sx={{ borderBottom: '1px solid #ddd' }}>
              <td sx={cellStyle}>{u.id}</td>
              <td sx={{ ...cellStyle, fontWeight: 'bold' }}>{u.username}</td>
              <td sx={cellStyle}>{u.email || '-'}</td>
              <td sx={cellStyle}>
                {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '-'}
              </td>

              <td sx={{ ...cellStyle, verticalAlign: 'top', padding: '12px 10px' }}>
                <div><strong>Кол-во:</strong> {u.files_count || 0}</div>
                <div><strong>Размер:</strong> {formatSize(u.files_size_bytes || 0)}</div>

                <br />
                <small sx={{ color: '#555' }}>
                   <Button
                      variant="text"
                      color="primary"
                      onClick={() => navigate('/dashboard/')}
                      sx={{ textTransform: 'none', padding: 0, fontSize: '0.95rem' }}
                    >
                      → Управлять файлами ({u.username})
                    </Button>
                </small>
              </td>

              <td sx={{ ...cellStyle, color: u.is_staff ? '#2e7d32' : '#d32f2f', fontWeight: 'bold', textAlign: 'center' }}>
                {u.is_staff ? 'Администратор' : 'Пользователь'}
              </td>

              <td sx={{ ...cellStyle, textAlign: 'center', verticalAlign: 'middle' }}>
                <div sx={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                  <button
                    onClick={() => toggleAdminStatus(u)}
                    disabled={processingId === u.id}
                    sx={{
                      padding: '6px 12px',
                      backgroundColor: u.is_staff ? '#ef5350' : '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: processingId === u.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {processingId === u.id ? 'Обработка...' : u.is_staff ? 'Снять админа' : 'Сделать админом'}
                  </button>

                  <button
                    onClick={() => deleteUser(u)}
                    disabled={processingId === u.id}
                    sx={{
                      padding: '6px 12px',
                      backgroundColor: '#ff5252',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: processingId === u.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {processingId === u.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cellStyle = {
  padding: '10px',
  textAlign: 'left',
  borderBottom: '1px solid #eee',
};

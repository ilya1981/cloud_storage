import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PrivateRoute from '@/components/PrivateRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import DashBoard from '@/pages/DashBoard';
import LinksList from '@/pages/LinksList';
import AdminUsers from '@/pages/AdminUsers';
import AdminPanel from '@/pages/AdminPanel';
import { restoreSession } from '@/store/authSlice';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  // Обёртки для читаемости
  const dashboardWrapper = (
    <PrivateRoute>
      <DashBoard />
    </PrivateRoute>
  );

  const adminWrapper = (element) => (
    <PrivateRoute requireAdmin={true}>
      {element}
    </PrivateRoute>
  );

  return (
    <Routes>
      {/* Публичные страницы */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Дашборд: оба пути ведут на один экран */}
      <Route path="/" element={dashboardWrapper} />
      <Route path="/dashboard" element={dashboardWrapper} />

      {/* Админ-панель и пользователи: только для админов */}
      <Route
        path="/admin"
        element={adminWrapper(<AdminPanel />)}
      />
      <Route
        path="/admin/users"
        element={adminWrapper(<AdminUsers />)}
      />

      {/* Список ссылок */}
      <Route
        path="/links"
        element={
          <PrivateRoute>
            <LinksList />
          </PrivateRoute>
        }
      />

      {/* Запасной маршрут: если URL не найден — редирект на login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const auth = useSelector((state) => state.auth);
  const user = auth?.user;
  const loading = auth?.loading;
  const location = useLocation();

  // Пока восстанавливаем сессию — показываем лоадер
  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 40, fontSize: 18 }}>
        Восстановление сессии...
      </div>
    );
  }

  // Если пользователя нет — на логин
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Определяем, является ли пользователь админом (на основе Django-флагов)
  const isAdmin = !!(user.is_staff || user.is_superuser);

  // Если требуется доступ админа, а у пользователя его нет — показываем «Нет прав»
  if (requireAdmin && !isAdmin) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Доступ запрещён</h2>
        <p>У вас нет прав администратора для просмотра этой страницы.</p>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;

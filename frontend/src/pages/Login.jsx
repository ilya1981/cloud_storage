import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, restoreSession } from '@/store/authSlice';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Редирект при наличии валидной сессии (после перезагрузки страницы и т.п.)
  useEffect(() => {
    if (auth.user) {
      const user = auth.user;

      if (user.is_staff || user.is_superuser) {
        navigate('/admin', { replace: true });
        return;
      }

      navigate('/dashboard', { replace: true });
    }
  }, [auth.user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Сначала логин (создаёт сессию на сервере)
      await dispatch(login({ username, password })).unwrap();

      // 2. Сразу после успешного логина запрашиваем полные данные пользователя
      await dispatch(restoreSession()).unwrap();

      // 3. Дальше сработает useEffect по auth.user — он сделает редирект
      // Здесь ничего дополнительно делать не нужно.

    } catch (error) {
      console.error('Ошибка входа:', error);
      // Ошибки уже сохранены в auth.error / auth.backendErrors слайсом
    }
  };

  const usernameError = auth.backendErrors?.username?.join(', ') || '';
  const passwordError = auth.backendErrors?.password?.join(', ') || '';

  let globalErrorMessage = '';
  if (auth.error && !auth.user) {
    if (typeof auth.error === 'object' && auth.error.error) {
      globalErrorMessage = auth.error.error;
    } else if (typeof auth.error === 'object' && auth.error.message) {
      globalErrorMessage = auth.error.message;
    } else if (typeof auth.error === 'string') {
      globalErrorMessage = auth.error;
    }
  }

  return (
    <Box
      sx={{
        maxWidth: 400,
        margin: '40px auto',
        padding: 3,
        borderRadius: 2,
        backgroundColor: '#fff',
        boxShadow: 1,
      }}
    >
      <Typography variant="h5" gutterBottom align="center">
        Вход в облачное хранилище
      </Typography>

      {globalErrorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalErrorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Логин"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          autoFocus
          margin="normal"
          error={!!usernameError}
          helperText={usernameError}
        />
        <TextField
          fullWidth
          label="Пароль"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          margin="normal"
          error={!!passwordError}
          helperText={passwordError}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={auth.loading}
        >
          {auth.loading ? 'Вход...' : 'Войти'}
        </Button>
      </form>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Нет аккаунта?{' '}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/register')}
          sx={{ mt: 1 }}
        >
          Зарегистрироваться
        </Button>
      </Box>
    </Box>
  );
}

export default Login;

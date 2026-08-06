import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, TextField, Button, Alert } from '@mui/material';
import { register } from '@/store/authSlice';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error: globalError, backendErrors } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
  });
  const [localErrors, setLocalErrors] = useState({});

  const validateUsername = (val) => /^[a-zA-Z][a-zA-Z0-9]{3,19}$/.test(val);
  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePassword = (val) => val.length >= 6 && !/\s/.test(val);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localErrors[name]) {
      setLocalErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newLocalErrors = {};

    if (!validateUsername(formData.username)) {
      newLocalErrors.username = 'Только латиница/цифры, первый символ — буква, 4–20 символов';
    }
    if (!validateEmail(formData.email)) {
      newLocalErrors.email = 'Некорректный email';
    }
    if (!validatePassword(formData.password)) {
      newLocalErrors.password = 'Минимум 6 символов, без пробелов';
    }

    if (Object.keys(newLocalErrors).length > 0) {
      setLocalErrors(newLocalErrors);
      return;
    }

    try {
      await dispatch(
        register({
          username: formData.username,
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
        })
      ).unwrap();

      // ✅ Успех: редирект на логин
      navigate('/login');
    } catch (err) {
      // ❌ Ошибка: ничего не делаем, Redux уже сохранил backendErrors
      console.error('Регистрация не удалась:', err);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, margin: '40px auto', padding: 3 }}>
      <Typography variant="h5" gutterBottom align="center">Регистрация</Typography>

      {globalError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalError?.detail || globalError?.message || String(globalError)}
        </Alert>
      )}



      <form onSubmit={handleSubmit}>
        <Grid container columnSpacing={2} rowSpacing={2}>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              label="Логин"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              required
              error={!!localErrors.username || !!backendErrors?.username}
              helperText={
                localErrors.username
                  || (backendErrors?.username?.join(', ') || 'Только латиница, первый символ — буква')
              }
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              label="Полное имя"
              name="full_name"
              autoComplete="name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
              error={!!localErrors.email || !!backendErrors?.email}
              helperText={
                localErrors.email
                  || (backendErrors?.email?.join(', ') || 'Корректный email-адрес')
              }
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              error={!!localErrors.password || !!backendErrors?.password}
              helperText={
                localErrors.password
                  || (backendErrors?.password?.join(', ') || 'Минимум 6 символов')
              }
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          Уже есть аккаунт?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{ color: '#1976d2', cursor: 'pointer', fontWeight: 600 }}
          >
            Войти
          </span>
        </Box>
      </form>
    </Box>
  );
};

export default Register;

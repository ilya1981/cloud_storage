import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

export const register = createAsyncThunk('auth/register', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('auth/register/', credentials);
    return response.data?.user || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка регистрации');
  }
});

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('auth/login/', credentials);
    return response.data?.user || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Ошибка входа');
  }
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
  console.log('🔄 Запуск restoreSession...');
  try {
    const response = await api.get('auth/me/');
    console.log('📦 RAW DATA FROM SERVER:', response.data);

    const payload = response.data?.user || response.data;

    if (!payload) {
      console.warn('⚠️ Данные пользователя не найдены в ответе сервера');
      return null;
    }

    return payload;
  } catch (error) {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      console.log(`🔒 Нет активной сессии (${status}). Возвращаем null.`);
      return null;
    }

    const payload = error.response?.data || {
      detail: error.message || 'Неизвестная ошибка',
    };
    return rejectWithValue(payload);
  }
});

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('auth/logout/');
      return response.data;
    } catch (error) {
      console.error('Ошибка выхода:', error);
      return rejectWithValue(error.response?.data || 'Не удалось выйти');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    backendErrors: {},
    globalError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
    // --- Login ---
      .addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
      .addCase(login.fulfilled, (state, action) => {
      console.log('✅ Login Success (неполные данные):', action.payload);
      state.loading = false;
    })
      .addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    // --- Restore Session ---
      .addCase(restoreSession.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
      .addCase(restoreSession.fulfilled, (state, action) => {
      console.log('💾 RESTORE SUCCESS! В стор записано:', action.payload);
      state.user = action.payload ?? null;
      state.loading = false;
      state.error = null;
    })
      .addCase(restoreSession.rejected, (state, action) => {
      console.error('❌ RESTORE FAILED:', action.payload);
      state.loading = false;
      state.error = action.payload;
    })

    // --- Logout ---
      .addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.loading = false;
    })
      .addCase(logout.rejected, (state, action) => {
      console.warn('Сессия могла не сброситься на сервере, но выходим на клиентском уровне');
      state.user = null;
      state.loading = false;
    })

    // --- Register ---
      .addCase(register.rejected, (state, action) => {
      state.loading = false;
      const payload = action.payload;

      if (payload?.errors) {
        state.backendErrors = payload.errors;
        state.globalError = null;
      } else {
        state.globalError = payload?.detail || payload?.message || 'Произошла ошибка';
        state.backendErrors = {};
      }
    });
  },
});

export default authSlice.reducer;

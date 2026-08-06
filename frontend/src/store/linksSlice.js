import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

// ✅ fetchLinks: используем api.get(), путь относительный (без /api/)
export const fetchLinks = createAsyncThunk('links/fetchLinks', async (_, { rejectWithValue }) => {
  try {
    // axios автоматически добавит baseURL: http://localhost:8000/api/
    const response = await api.get('links/');
    return response.data;
  } catch (e) {
    console.error('Ошибка получения ссылок:', e);
    return rejectWithValue(e.response?.data || e.message);
  }
});

// ✅ deleteLink: используем api.delete(), путь относительный
export const deleteLink = createAsyncThunk('links/deleteLink', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`links/${id}/`);
    return id;
  } catch (e) {
    console.error('Ошибка удаления ссылки:', e);
    return rejectWithValue(e.response?.data || e.message);
  }
});

const linksSlice = createSlice({
  name: 'links',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    addLink: (state, action) => {
      state.items.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLinks.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
      .addCase(fetchLinks.fulfilled, (state, action) => {
      state.loading = false;
      // ✅ Важно: DRF возвращает массив, но иногда может быть объект с полем results (если пагинация)
      const data = action.payload;
      state.items = Array.isArray(data) ? data : (data?.results || []);
    })
      .addCase(fetchLinks.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
      .addCase(deleteLink.fulfilled, (state, action) => {
      state.items = state.items.filter((l) => l.id !== action.payload);
    });
  },
});

export default linksSlice.reducer;

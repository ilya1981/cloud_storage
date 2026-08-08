import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

const normalizeError = (error) => {
    return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    'Произошла ошибка при выполнении операции'
    );
};

export const renameFileAsync = createAsyncThunk(
    'files/renameFile',
    async ({ fileId, newName }, { rejectWithValue }) => {
        try {
            const response = await api.post(`files/${fileId}/rename/`, {
                new_name: newName,
            });
            return response.data;
        } catch (error) {
            console.error('Ошибка переименования:', error);
            return rejectWithValue(normalizeError(error));
        }
    }
);

export const generatePublicLinkAsync = createAsyncThunk(
    'files/generatePublicLink',
    async (fileId, { rejectWithValue }) => {
        const res = await api.post(`files/${fileId}/generate-link/`);
        return res.data;
    },
    {
        extraOptions: { showError: true },
    }
);

export const deleteFileAsync = createAsyncThunk(
    'files/delete',
    async (fileId, { rejectWithValue }) => {
        try {
            await api.delete(`files/${fileId}/`);
            return { id: fileId };
        } catch (error) {
            console.error('Ошибка удаления файла:', error);
            return rejectWithValue(normalizeError(error));
        }
    }
);

export const uploadFile = createAsyncThunk(
    'files/upload',
    async ({ formData, onProgress }, { rejectWithValue }) => {
        const config = {
            // ✅ НЕ ставь Content-Type вручную — Axios сам всё сделает для FormData
            onUploadProgress: (progressEvent) => {
                if (progressEvent.lengthComputable && onProgress) {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percent);
                }
            },
        };

        const response = await api.post('files/', formData, config);
        return response.data;
    }
);

export const fetchFiles = createAsyncThunk(
    'files/fetchList',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('files/');
            const data = response.data;
            return Array.isArray(data) ? data : (data?.files || []);
        } catch (error) {
            console.error('Ошибка получения списка файлов:', error);
            return rejectWithValue(normalizeError(error));
        }
    }
);
const filesSlice = createSlice({
    name: 'files',
    initialState: {
        loading: false,
        error: null,
        progress: 0,
        list: [],
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(uploadFile.pending, (state) => {
            state.loading = true;
            state.error = null;
            state.progress = 0;
        })
            .addCase(uploadFile.fulfilled, (state, action) => {
            console.log('✅ Файл загружен:', action.payload);
            state.loading = false;
            const exists = state.list.some((f) => f.id === action.payload.id);
            if (!exists) {
                state.list = [action.payload, ...state.list];
            } else {
                const index = state.list.findIndex((f) => f.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
            }
        })
            .addCase(uploadFile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
            state.progress = 0;
        })

            .addCase(deleteFileAsync.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(deleteFileAsync.fulfilled, (state, action) => {
            const idToRemove = action.meta.arg;
            state.loading = false;
            state.list = state.list.filter((file) => file.id !== idToRemove);
        })
            .addCase(deleteFileAsync.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

            .addCase(fetchFiles.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
         .addCase(fetchFiles.fulfilled, (state, action) => {
            state.loading = false;
            state.list = action.payload || [];
        })
            .addCase(fetchFiles.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

            .addCase(generatePublicLinkAsync.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(generatePublicLinkAsync.fulfilled, (state, action) => {
            state.loading = false;
        })
            .addCase(generatePublicLinkAsync.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

            .addCase(renameFileAsync.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(renameFileAsync.fulfilled, (state, action) => {
            const updatedFile = action.payload;
            const fileId = action.meta.arg.fileId;

            const index = state.list.findIndex((file) => file.id === fileId);
            if (index !== -1) {
                state.list[index] = updatedFile;
            }

            state.loading = false;
            console.log(`✅ Файл #${fileId} переименован в "${updatedFile.name}"`);
        })
            .addCase(renameFileAsync.rejected, (state, action) => { // ✅ Теперь это реально подключено
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export default filesSlice.reducer;


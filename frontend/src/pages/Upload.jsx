import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, LinearProgress, Typography, Alert, Paper } from '@mui/material'; Button
import { uploadFile } from '@/store/filesSlice';

const Upload = () => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.files);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localProgress, setLocalProgress] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        enqueueSnackbar('Файл слишком большой! Максимум 100 МБ.', {variant: 'error'});
        return;
      }
      setSelectedFile(file);
      setLocalProgress(0); // Сброс при выборе нового файла
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // ✅ Передаем функцию обновления localProgress прямо в thunk
      await dispatch(uploadFile({
        formData,
        onProgress: (percent) => setLocalProgress(percent)
      }));

      // Успех: сбрасываем всё
      setSelectedFile(null);
      setLocalProgress(100); // Визуально доводим до 100%
      setTimeout(() => setLocalProgress(0), 1000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: '40px auto', padding: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Загрузка файла в облако
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <input
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input">
          <Button variant="contained" color="primary" size="large">
            {selectedFile ? `Выбран: ${selectedFile.name}` : 'Выбрать файл'}
          </Button>
        </label>

        {selectedFile && !loading && (
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Размер: {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
          </Typography>
        )}

        <Box sx={{ mt: 4 }}>
          {/* ✅ Показываем localProgress, который обновляется в реальном времени */}
          {loading && localProgress > 0 && (
            <>
              <LinearProgress variant="determinate" value={localProgress} sx={{ height: 8, mb: 2 }} />
              <Typography variant="body2">{Math.round(localProgress)}%</Typography>
            </>
          )}

          {!loading && selectedFile && (
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleUpload}
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Загрузка...' : 'Загрузить'}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Upload;

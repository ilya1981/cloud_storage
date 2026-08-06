import React, { useState, useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  Box, Typography, Paper, Alert, Button, LinearProgress, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Tooltip, CircularProgress
} from '@mui/material';

import {
  Clear as ClearIcon, Logout as LogoutIcon, Edit as EditIcon, Download as DownloadIcon,
  Link as LinkIcon, Visibility as VisibilityIcon, Delete as DeleteIcon,
} from '@mui/icons-material';

import {
  uploadFile, fetchFiles,
  deleteFileAsync, generatePublicLinkAsync, renameFileAsync,
} from '@/store/filesSlice';

import { logout } from '@/store/authSlice';
import api from '@/services/api';

const formatBytes = (bytes) => {
  if (bytes == null || typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return '—';
  }

  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  if (bytes === 0) return '0 Б';

  const i = Math.max(0, Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k))));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(2).replace(/\.00$/, '')} ${sizes[i]}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('ru-RU');
};

const Dashboard = () => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading: globalLoading, error } = useSelector((state) => state.files);
  const [lastCopiedFileId, setLastCopiedFileId] = useState(null);
  const [copiedStatus, setCopiedStatus] = useState('idle'); // 'idle' | 'copied' | 'error'
  const [selectedFile, setSelectedFile] = useState(null);
  const [localProgress, setLocalProgress] = useState(0);
  const [comment, setComment] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef(null);



  useEffect(() => {
    dispatch(fetchFiles());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 100 * 1024 * 1024; // 100 МБ
    if (file.size > maxSize) {
      enqueueSnackbar(`Файл слишком большой! Максимум ${maxSize / (1024 * 1024)} МБ.`, {variant: 'error'});
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setLocalProgress(0);
    setComment('');
  };

  const triggerFileInput = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

    const handleUpload = async () => {
      if (!selectedFile) return;

      const formData = new FormData();
      formData.append('file', selectedFile);

      // ✅ ДОБАВЬ ЭТУ СТРОКУ: чтобы поле name сразу было заполнено
      formData.append('name', selectedFile.name);

      if (comment.trim()) {
        formData.append('description', comment.trim());
      }

      try {
        await dispatch(uploadFile({
          formData,
          onProgress: (percent) => setLocalProgress(percent),
        })).unwrap();

        setSelectedFile(null);
        setComment('');
        setLocalProgress(0);
        enqueueSnackbar('Файл успешно загружен!', {variant: 'success'});
        dispatch(fetchFiles());
      } catch (err) {
        // ... обработка ошибок
      } finally {
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    };



  const openRenameDialog = (file) => {
    setSelectedFile(file);

    // ✅ ПРАВИЛЬНО: сначала original_name, потом name, потом заглушка
    const displayName =
      (file.name && file.name.trim())
        ? file.name
        : (file.name && file.name.trim())
          ? file.name
          : 'unnamed';

    setNewName(displayName);
    setRenameDialogOpen(true);
  };


  const handleRename = async () => {
    if (!selectedFile || !newName.trim()) return;

    try {
      // Переименовываем и слайс сам обновит список локально
      await dispatch(renameFileAsync({
        fileId: selectedFile.id,
        newName: newName.trim(),
      })).unwrap();

      setRenameDialogOpen(false);
      enqueueSnackbar('Файл переименован', {variant: 'success'});


    } catch (err) {
      console.error('Ошибка переименования:', err);
      let msg = 'Не удалось переименовать файл';
      if (err?.response?.data) {
        msg += ': ' + JSON.stringify(err.response.data);
      } else if (err.message) {
        msg += ': ' + err.message;
      }
      enqueueSnackbar(msg, {variant: 'error'});
    }
  };



  const handleDelete = async (fileId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот файл? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await dispatch(deleteFileAsync(fileId)).unwrap();
      dispatch(fetchFiles());
      enqueueSnackbar('Файл удалён', {variant: 'info'});
    } catch (err) {
      console.error('Ошибка удаления:', err);
      let msg = 'Не удалось удалить файл';
      if (err?.response?.data) {
        msg += ': ' + JSON.stringify(err.response.data);
      }
      enqueueSnackbar(msg, {variant: 'error'});
    }
  };

  const handleCopyLink = async (fileId) => {
      setCopiedStatus('Загрузка...  ')
    try {
      const result = await dispatch(generatePublicLinkAsync(fileId)).unwrap();
      console.log('Ответ от API (generatePublicLinkAsync):', result);
      const link = result?.public_url;
      if (!link || typeof link !== 'string') {
          enqueueSnackbar('Не удалось получить ссылку: ответ сервера не содержит link/url', {variant: 'error'});
        return;
      }

      await navigator.clipboard.writeText(link);
      alert('Ссылка скопирована в буфер обмена');
      console.log('Публичная ссылка:', link);
    } catch (err) {
      console.error('Ошибка генерации ссылки:', err);
      let msg = 'Не удалось получить публичную ссылку';
      if (err?.response?.data) {
        msg += ': ' + JSON.stringify(err.response.data);
      } else if (err.message) {
        msg += ': ' + err.message;
      }
      enqueueSnackbar(msg, {variant: 'error'});
    }
  };



     const handleDownload = async (fileObj) => {
       const directUrl = fileObj.download_url || fileObj.url;
       if (directUrl) {
         window.open(directUrl, '_self');
         dispatch(fetchFiles());
         return;
       }

       try {
         const response = await api.get(`files/${fileObj.id}/download/`, {
           withCredentials: true,
           responseType: 'blob',
         });

         const contentType = response.headers['content-type'] || '';

         // Если сервер вернул JSON (ошибка), не пытаемся сделать из него файл
         if (contentType.startsWith('application/json')) {
           const blob = new Blob([response.data], { type: 'text/plain' });
           const text = await blob.text();
           let detail = '';
           try {
             const json = JSON.parse(text);
             detail = json.detail || json.message || text;
           } catch (e) {
             detail = text;
           }
           enqueueSnackbar('Не удалось скачать файл: ' + detail, {variant: 'error'});
           return;
         }

         const blob = new Blob([response.data], {
           type: contentType || 'application/octet-stream',
         });
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = fileObj.original_name || fileObj.name || `file_${fileObj.id}`;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         window.URL.revokeObjectURL(url);

         dispatch(fetchFiles());
       } catch (err) {
         console.error('Ошибка скачивания:', err);
         let msg = 'Не удалось скачать файл';
         if (err?.response?.data) {
           msg += ': ' + JSON.stringify(err.response.data);
         } else if (err.message) {
           msg += ': ' + err.message;
         }
         enqueueSnackbar(msg, {variant: 'error'});
       }
     };





  const handleView = async (fileObj) => {
    const url = fileObj.view_url || fileObj.download_url || fileObj.url;

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const response = await api.get(`files/${fileObj.id}/view/`, {
        withCredentials: true,
      });
      const viewUrl = response.data?.url || response.data;
      if (viewUrl) {
        window.open(viewUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch (err) {
      console.warn('Не удалось получить URL для просмотра:', err);
    }

    enqueueSnackbar('Нет возможности просмотра в браузере (реализуй view-эндпоинт на Django)', {variant: 'error'});
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '40px auto', padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Облачное хранилище — Панель управления
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          size="large"
        >
          Выход
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} variant="filled">
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Загрузить файл
        </Typography>

        <Box sx={{ textAlign: 'center' }}>
          <input
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={triggerFileInput}
            sx={{ mb: 2 }}
          >
            {selectedFile ? `Выбран: ${selectedFile.name}` : '📂 Выбрать файл'}
          </Button>

          {selectedFile && (
            <IconButton
              aria-label="Сбросить файл"
              onClick={() => {
                setSelectedFile(null);
                setComment('');
                setLocalProgress(0);
                if (inputRef.current) inputRef.current.value = '';
              }}
              sx={{ ml: 1, verticalAlign: 'middle' }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          )}

          {selectedFile && !globalLoading && (
            <Typography sx={{ mt: 1, color: 'text.secondary' }}>
              Размер: {formatBytes(selectedFile.size)}
            </Typography>
          )}

          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Комментарий к файлу (необязательно)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />

            {globalLoading && localProgress > 0 && (
              <>
                <LinearProgress
                  variant="determinate"
                  value={localProgress}
                  sx={{ height: 8, mb: 1 }}
                />
                <Typography variant="body2">
                  {Math.round(localProgress)}%
                </Typography>
              </>
            )}

            {!globalLoading && selectedFile && (
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={handleUpload}
                sx={{ mt: 2 }}
                disabled={globalLoading}
              >
                Загрузить
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ваши файлы
        </Typography>

        {globalLoading && !selectedFile && (
          <Typography>Загрузка списка файлов...</Typography>
        )}

        {!globalLoading && list.length === 0 && (
          <Typography color="text.secondary">
            У вас пока нет загруженных файлов.
          </Typography>
        )}

        {list.length > 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Имя файла </strong></TableCell>
                  <TableCell><strong>Комментарий</strong></TableCell>
                  <TableCell align="right"><strong>Размер</strong></TableCell>
                  <TableCell><strong>Дата загрузки</strong></TableCell>
                  <TableCell><strong>Последнее скачивание</strong></TableCell>
                  <TableCell><strong>Действия</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((file) => {
                  const rowKey = file.id ?? `temp-${Math.random().toString(36).substring(2, 9)}`;

                  const displayName =
                    (file.original_name && file.original_name.trim())
                      ? file.original_name
                      : (file.name && file.name.trim())
                        ? file.name
                        : (file.filename && file.filename.trim())
                          ? file.filename
                          : 'Без имени';

                  return (
                    <TableRow
                      key={rowKey}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Typography noWrap sx={{ fontWeight: 600 }}>
                          {file.name || file.original_name || 'Без имени'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={file.description || '—'}
                          size="small"
                          color="default"
                        />
                      </TableCell>

                      <TableCell align="right">
                        {formatBytes(file.size)}
                      </TableCell>

                      <TableCell>
                        {formatDate(file.uploaded_at)}
                      </TableCell>

                      <TableCell>
                        {file.last_downloaded ? (
                          formatDate(file.last_downloaded)
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Не скачивался
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Просмотр/открыть">
                            <IconButton size="small" onClick={() => handleView(file)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Скачать">
                            <IconButton size="small" onClick={() => handleDownload(file)}>
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={copiedStatus === 'copied' && lastCopiedFileId === file.id ? 'Скопировано!' : 'Получить публичную ссылку'}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopyLink(file.id)}
                              disabled={copiedStatus === 'loading'}
                              sx={copiedStatus === 'copied' && lastCopiedFileId === file.id ? { color: 'success.main' } : {}}
                            >
                              {copiedStatus === 'loading' && lastCopiedFileId === file.id
                                ? <CircularProgress size={20} color="inherit" />
                                : <LinkIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Переименовать">
                            <IconButton size="small" onClick={() => openRenameDialog(file)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Удалить">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(file.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Диалог переименования */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Переименовать файл</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Новое имя файла"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" color="primary" onClick={handleRename}>
            Переименовать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;

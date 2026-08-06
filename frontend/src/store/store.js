import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/authSlice';
import  filesReducer from '@/store/filesSlice';
import linksReducer from '@/store/linksSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    files: filesReducer,
    links: linksReducer,
  },
});

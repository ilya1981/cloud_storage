import React from 'react';
import { SnackbarProvider } from 'notistack';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import { store } from '@/store/store';


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <SnackbarProvider
        autoHideDuration={4000}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'} }
        >
      <App />
      </SnackbarProvider>
    </BrowserRouter>
  </Provider>
);

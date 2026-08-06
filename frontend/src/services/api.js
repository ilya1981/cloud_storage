import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

function getCookie(name) {
    const matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

api.interceptors.request.use((config) => {
    const csrftoken = getCookie('csrftoken');

    if (csrftoken && !['GET', 'HEAD'].includes(config.method.toUpperCase())) {
        config.headers['X-CSRFToken'] = csrftoken;
    }

    console.log('🍪 CSRF token found:', !!csrftoken, '| method:', config.method);

    // Для FormData (загрузка файлов) браузер сам поставит правильный Content-Type
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    return config;
});

export default api;

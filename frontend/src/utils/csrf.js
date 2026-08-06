export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

export async function fetchWithCsrf(url, options = {}) {
  const token = getCookie("csrftoken");
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("X-CSRFToken", token);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // критически важно для сессий Django
  });
}
import axios from 'axios';

// Backend runs on :5454 per application.properties (server.port=5454)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5454';

const client = axios.create({
  baseURL: API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('cv_jwt');
  if (token) {
    config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    // NOTE on this backend's error shape (com.vishal.exception.GlobelExeptions):
    // ErrorDetails fields are declared as (error, message, timestamp), but the
    // handlers construct it as `new ErrorDetails(ex.getMessage(), req.getDescription(false), now)`.
    // That means the *human-readable* text actually lands in the `error` field,
    // while `message` ends up holding the request URI (e.g. "uri=/api/orders/pay").
    // We read `error` first so the real message is shown instead of a raw URI string.
    const data = err?.response?.data;
    const looksLikeUri = (s) => typeof s === 'string' && /^uri=/i.test(s.trim());

    let message =
      (data?.error && !looksLikeUri(data.error) && data.error) ||
      (data?.message && !looksLikeUri(data.message) && data.message) ||
      err?.message ||
      'Something went wrong. Please try again.';

    // Final safety net: never show a raw "uri=..." string to the user.
    if (looksLikeUri(message)) {
      message = 'Something went wrong. Please try again.';
    }

    return Promise.reject({ ...err, friendlyMessage: message });
  }
);

export default client;

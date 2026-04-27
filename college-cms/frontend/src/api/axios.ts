import axios from 'axios';

let _token: string | null = localStorage.getItem('sanskriti_token');

export const getAccessToken = () => _token;
export const setAccessToken = (t: string) => {
  _token = t;
  localStorage.setItem('sanskriti_token', t);
};
export const clearAccessToken = () => {
  _token = null;
  localStorage.removeItem('sanskriti_token');
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: any) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (val?: any) => void; reject: (err?: any) => void }[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data?.accessToken;

        if (!newToken) throw new Error("No token returned");

        setAccessToken(newToken);
        failedQueue.forEach((p) => p.resolve(newToken));
        failedQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach((p) => p.reject(refreshError));
        failedQueue = [];
        clearAccessToken();

        // Only redirect if we are not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

import axios, { AxiosResponse } from "axios";

const apiAxios = axios.create({
  baseURL: "https://ec2api.deltatech-backend.com/api/v1",
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRrefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
};

const getToken = async (): Promise<string | null> => {
  const token = localStorage.getItem("access_token_installation");
  const expiration = localStorage.getItem("expiration_installation");
  if (token && expiration && new Date(expiration) > new Date()) {
    return token;
  }
  return null;
};

apiAxios.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiAxios.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const {
      config,
      response: { status },
    } = error;
    const originalRequest = config;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshToken = localStorage.getItem(
            "refresh_token_installation"
          );
          const expirationRefreshToken = localStorage.getItem(
            "expiration_refresh_token_installation"
          );
          if (
            refreshToken &&
            expirationRefreshToken &&
            new Date(expirationRefreshToken) > new Date()
          ) {
            const { data } = await axios.post(
              "https://ec2api.deltatech-backend.com/api/v1/auth/refresh",
              {
                token: refreshToken,
              }
            );
            localStorage.setItem(
              "access_token_installation",
              data.access_token
            );
            localStorage.setItem("expiration_installation", data.expiration);
            localStorage.setItem(
              "refresh_token_installation",
              data.refresh_token
            );
            localStorage.setItem(
              "expiration_refresh_token_installation",
              data.expiration_refresh_token
            );
            isRefreshing = false;
            onRrefreshed(data.access_token);
          } else {
            isRefreshing = false;
            // Handle case where refresh token is also expired
            localStorage.removeItem("access_token_installation");
            localStorage.removeItem("expiration_installation");
            localStorage.removeItem("refresh_token_installation");
            localStorage.removeItem("expiration_refresh_token_installation");
            window.location.href = "/"; // Redirect to login page
            return Promise.reject(error);
          }
        } catch (err) {
          isRefreshing = false;
          return Promise.reject(err);
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          originalRequest.headers["Authorization"] = "Bearer " + token;
          resolve(apiAxios(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default apiAxios;

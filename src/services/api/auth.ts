import _axios from "@/lib/_axios";
import axios from "axios";

export const signup = async (data: {
  username: string;
  password: string;
  publicKey: string;
}) => {
  return (await _axios.post(`/api/auth/signup`, data)).data;
};

export const login = async (data: { username: string; password: string }) => {
  return (await _axios.post(`/api/auth/login`, data)).data;
};

export const verifyRouteApiReq = async (): Promise<any> => {
  return await _axios.get(`/api/auth/verifyRoute`);
};

export const changeUsernameApi = async (data: { username: string }) => {
  return (await _axios.post(`/api/auth/update-username`, data)).data;
};

export const loginTokenApi = async (data: {
  userId: string;
  loginToken: string;
}) => {
  return (await _axios.post(`/api/auth/login/token`, data)).data;
};

export const createAccessTokenFromRefreshToken = async () => {
  return (
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    )
  ).data;
};

export const logoutApi = (data: {}) => {
  return _axios.post(`/api/auth/logout`, data);
};

import apiClient from "./axios";
import { User, SuccessResponse } from "../types";

export const loginApi = async (data: any) => {
  const response = await apiClient.post<SuccessResponse<{ user: User; access_token: string }>>("/auth/login", data);
  return response.data;
};

export const registerApi = async (data: any) => {
  const response = await apiClient.post<SuccessResponse<{ user: User; access_token: string }>>("/auth/register", data);
  return response.data;
};

export const logoutApi = async () => {
  const response = await apiClient.post<SuccessResponse<{ message: string }>>("/auth/logout");
  return response.data;
};

export const fetchMeApi = async () => {
  const response = await apiClient.get<SuccessResponse<User>>("/auth/me");
  return response.data;
};

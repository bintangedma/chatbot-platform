import apiClient from "./axios";
import { Project, SuccessResponse } from "../types";

export const createProjectApi = async (data: { name: string; system_prompt: string }) => {
  const response = await apiClient.post<SuccessResponse<Project>>("/projects", data);
  return response.data;
};

export const fetchProjectsApi = async () => {
  const response = await apiClient.get<SuccessResponse<Project[]>>("/projects");
  return response.data;
};

export const fetchProjectDetailApi = async (projectId: string) => {
  const response = await apiClient.get<SuccessResponse<Project>>(`/projects/${projectId}`);
  return response.data;
};

export const updateProjectApi = async (projectId: string, data: { name?: string; system_prompt?: string }) => {
  const response = await apiClient.put<SuccessResponse<Project>>(`/projects/${projectId}`, data);
  return response.data;
};

export const deleteProjectApi = async (projectId: string) => {
  const response = await apiClient.delete<SuccessResponse<{ message: string }>>(`/projects/${projectId}`);
  return response.data;
};

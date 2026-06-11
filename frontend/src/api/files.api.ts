import apiClient from "./axios";
import { ProjectFile, SuccessResponse } from "../types";

export const uploadFileApi = async (projectId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await apiClient.post<SuccessResponse<ProjectFile>>(
    `/projects/${projectId}/files`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const fetchFilesApi = async (projectId: string) => {
  const response = await apiClient.get<SuccessResponse<ProjectFile[]>>(`/projects/${projectId}/files`);
  return response.data;
};

export const deleteFileApi = async (projectId: string, fileId: string) => {
  const response = await apiClient.delete<SuccessResponse<{ message: string }>>(
    `/projects/${projectId}/files/${fileId}`
  );
  return response.data;
};

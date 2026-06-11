import apiClient from "./axios";
import { Message, SuccessResponse } from "../types";

export interface PaginatedMessages {
  messages: Message[];
  total: number;
  page: number;
  total_pages: number;
}

export const fetchMessagesApi = async (projectId: string, page = 1, limit = 50) => {
  const response = await apiClient.get<SuccessResponse<PaginatedMessages>>(
    `/projects/${projectId}/messages`,
    { params: { page, limit } }
  );
  return response.data;
};

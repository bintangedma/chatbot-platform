export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  project_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  openai_file_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  system_prompt: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  file_count?: number;
  messages?: Message[];
  files?: ProjectFile[];
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  status_code: number;
}

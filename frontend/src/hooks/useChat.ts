import { useQuery } from "@tanstack/react-query";
import { fetchMessagesApi } from "../api/chat.api";

export const useChat = () => {
  const useMessagesQuery = (projectId: string, page = 1, limit = 50, enabled = true) =>
    useQuery({
      queryKey: ["messages", projectId, page],
      queryFn: () => fetchMessagesApi(projectId, page, limit),
      select: (res) => res.data,
      enabled: !!projectId && enabled,
    });

  return {
    useMessagesQuery,
  };
};
export default useChat;

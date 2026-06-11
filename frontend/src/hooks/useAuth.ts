import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loginApi, registerApi, logoutApi, fetchMeApi } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const loginStore = useAuthStore((state) => state.login);
  const logoutStore = useAuthStore((state) => state.logout);

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (res) => {
      loginStore(res.data.user, res.data.access_token);
      queryClient.setQueryData(["me"], res.data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (res) => {
      loginStore(res.data.user, res.data.access_token);
      queryClient.setQueryData(["me"], res.data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
    },
  });

  const meQuery = (enabled: boolean) =>
    useQuery({
      queryKey: ["me"],
      queryFn: fetchMeApi,
      select: (res) => res.data,
      enabled,
    });

  return {
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
    meQuery,
  };
};
export default useAuth;

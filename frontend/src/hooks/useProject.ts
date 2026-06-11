import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProjectApi,
  fetchProjectsApi,
  fetchProjectDetailApi,
  updateProjectApi,
  deleteProjectApi,
} from "../api/projects.api";
import { uploadFileApi, deleteFileApi } from "../api/files.api";

export const useProject = () => {
  const queryClient = useQueryClient();

  const useProjectsQuery = () =>
    useQuery({
      queryKey: ["projects"],
      queryFn: fetchProjectsApi,
      select: (res) => res.data,
    });

  const useProjectDetailQuery = (projectId: string, enabled = true) =>
    useQuery({
      queryKey: ["project", projectId],
      queryFn: () => fetchProjectDetailApi(projectId),
      select: (res) => res.data,
      enabled: !!projectId && enabled,
    });

  const createProjectMutation = useMutation({
    mutationFn: createProjectApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { name?: string; system_prompt?: string } }) =>
      updateProjectApi(projectId, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: deleteProjectApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: ({ projectId, file }: { projectId: string; file: File }) =>
      uploadFileApi(projectId, file),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: ({ projectId, fileId }: { projectId: string; fileId: string }) =>
      deleteFileApi(projectId, fileId),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
    },
  });

  return {
    useProjectsQuery,
    useProjectDetailQuery,
    createProject: createProjectMutation,
    updateProject: updateProjectMutation,
    deleteProject: deleteProjectMutation,
    uploadFile: uploadFileMutation,
    deleteFile: deleteFileMutation,
  };
};
export default useProject;

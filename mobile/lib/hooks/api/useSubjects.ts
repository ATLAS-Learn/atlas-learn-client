import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { CreateSubjectPayload, UpdateSubjectPayload, SubjectQueryOptions } from "@/lib/types";

function normalizeSubjectQueryOptions(options: SubjectQueryOptions): SubjectQueryOptions {
    const includeChapters = options.includeChapters ?? false;
    return {
        includeChapters,
        includeChapterDetails: includeChapters ? options.includeChapterDetails ?? false : false,
    };
}

export function useSubjects(options: SubjectQueryOptions = {}) {
    const normalizedOptions = normalizeSubjectQueryOptions(options);

    return useQuery({
        queryKey: [
            "subjects",
            normalizedOptions.includeChapters ?? false,
            normalizedOptions.includeChapterDetails ?? false,
        ],
        queryFn: () => apiClient.getSubjects(normalizedOptions),
    });
}

export function useSubject(subjectId: string | undefined, options: SubjectQueryOptions = {}) {
    const normalizedOptions = normalizeSubjectQueryOptions(options);

    return useQuery({
        queryKey: [
            "subjects",
            subjectId,
            normalizedOptions.includeChapters ?? false,
            normalizedOptions.includeChapterDetails ?? false,
        ],
        queryFn: () => apiClient.getSubjectById(subjectId!, normalizedOptions),
        enabled: !!subjectId,
    });
}

export function useSubjectByCode(code: string | undefined, options: SubjectQueryOptions = {}) {
    const normalizedOptions = normalizeSubjectQueryOptions(options);

    return useQuery({
        queryKey: [
            "subjects",
            "code",
            code,
            normalizedOptions.includeChapters ?? false,
            normalizedOptions.includeChapterDetails ?? false,
        ],
        queryFn: () => apiClient.getSubjectByCode(code!, normalizedOptions),
        enabled: !!code,
    });
}

export function useCreateSubject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSubjectPayload) => apiClient.createSubject(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["subjects"] });
        },
    });
}

export function useUpdateSubject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ subjectId, data }: { subjectId: string; data: UpdateSubjectPayload }) =>
            apiClient.updateSubject(subjectId, data),
        onSuccess: (updatedSubject) => {
            queryClient.setQueryData(["subjects", updatedSubject.id], updatedSubject);
            void queryClient.invalidateQueries({ queryKey: ["subjects"] });
        },
    });
}

export function useDeleteSubject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (subjectId: string) => apiClient.deleteSubject(subjectId),
        onSuccess: (_, subjectId) => {
            queryClient.removeQueries({ queryKey: ["subjects", subjectId] });
            void queryClient.invalidateQueries({ queryKey: ["subjects"] });
        },
    });
}

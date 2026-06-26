import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoles, updateModulePermissions } from '../services/phan-quyen-service';
import type { ActionType } from '../core/types';
import { toast } from 'sonner';
import { txt } from '../../../../lib/text';
import { queryKeys } from '@/lib/query-keys';
import { masterDataQueryOptions } from '@/lib/supabase/query-config';
import { getErrorMessage } from '@/lib/utils';

const rolesQueryKey = queryKeys.roles.all;

export const useRoles = () => {
  return useQuery({
    queryKey: rolesQueryKey,
    queryFn: getRoles,
    ...masterDataQueryOptions,
  });
};

export const useUpdateModulePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      updates,
    }: {
      moduleId: string;
      updates: { roleId: string; actions: ActionType[] }[];
    }) => updateModulePermissions(moduleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      toast.success(txt('permission.toast.updateSuccess'));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
};

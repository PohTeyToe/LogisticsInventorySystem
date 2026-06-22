import { useQuery } from '@tanstack/react-query';
import { getAuditLogs, type AuditLogParams } from '../../api/auditLog';

export const auditLogKeys = {
  all: ['auditLogs'] as const,
  list: (params: AuditLogParams) => [...auditLogKeys.all, 'list', params] as const,
};

export function useAuditLogs(params: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => getAuditLogs(params),
  });
}

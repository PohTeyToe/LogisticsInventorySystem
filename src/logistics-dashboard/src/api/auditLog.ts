import client from './client';
import type { AuditLogEntry, PaginatedAuditLogResponse } from '../types';

export interface AuditLogParams {
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function getAuditLogs(params: AuditLogParams = {}): Promise<PaginatedAuditLogResponse> {
  const { data } = await client.get<PaginatedAuditLogResponse>('/api/auditlog', { params });
  return data;
}

export async function getEntityHistory(type: string, id: number): Promise<AuditLogEntry[]> {
  const { data } = await client.get<AuditLogEntry[]>(`/api/auditlog/entity/${type}/${id}`);
  return data;
}

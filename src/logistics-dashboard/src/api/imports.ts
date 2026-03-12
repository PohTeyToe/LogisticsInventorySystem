import client from './client';
import type { ImportResult } from '../types';

export async function importInventoryCsv(file: File, validateOnly = false) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post<ImportResult>(
    `/api/import/inventory${validateOnly ? '?validateOnly=true' : ''}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

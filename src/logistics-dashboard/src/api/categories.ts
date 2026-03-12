import client from './client';
import type { Category } from '../types';

export async function getCategories() {
  const { data } = await client.get<Category[]>('/api/category');
  return data;
}

export async function createCategory(category: { name: string; description?: string }) {
  const { data } = await client.post<Category>('/api/category', category);
  return data;
}

export async function updateCategory(id: number, category: { name?: string; description?: string }) {
  const { data } = await client.put<Category>(`/api/category/${id}`, category);
  return data;
}

export async function deleteCategory(id: number) {
  await client.delete(`/api/category/${id}`);
}

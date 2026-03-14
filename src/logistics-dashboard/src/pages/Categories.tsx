import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit3, Search } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import FormField from '../components/shared/FormField';
import SkeletonTable from '../components/shared/SkeletonTable';
import ToastContainer from '../components/shared/ToastContainer';
import Pagination from '../components/shared/Pagination';
import BulkActionBar from '../components/shared/BulkActionBar';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { useCategoriesList, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/queries/useCategoryQueries';
import { exportToCsv } from '../utils/exportCsv';
import { exportTableToPdf } from '../utils/exportPdf';
import ExportDropdown from '../components/shared/ExportDropdown';
import { useToast } from '../hooks/useToastSimple';
import { useBulkSelect } from '../hooks/useBulkSelect';
import { useTableSort } from '../hooks/useTableSort';
import { usePagination } from '../hooks/usePagination';
import type { Category } from '../types';
import styles from './CrudPage.module.css';

type SortKey = 'name' | 'itemCount';

const accessor = (item: Category, key: SortKey) => {
  switch (key) {
    case 'name': return item.name;
    case 'itemCount': return item.itemCount ?? 0;
  }
};

export default function Categories() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [search, setSearch] = useState('');
  const { toasts, addToast, dismiss } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  // Bulk select
  const bulk = useBulkSelect();
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const { data: items = [], isLoading: loading } = useCategoriesList();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q))
    );
  }, [items, search]);

  const { sortedItems, toggleSort, getSortIndicator } = useTableSort<Category, SortKey>(filtered, accessor);
  const { paginatedItems, page, pageSize, totalPages, setPage, setPageSize, startIndex, endIndex, totalItems } = usePagination(sortedItems);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); };
  const openEdit = (item: Category) => { setEditing(item); setForm({ name: item.name, description: item.description }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) {
      addToast('Please fill in all required fields', 'danger');
      return;
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, category: form });
        addToast('Category updated successfully', 'success');
      } else {
        await createMutation.mutateAsync(form);
        addToast('Category created successfully', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to save category', 'danger');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Category deleted successfully', 'success');
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete category', 'danger');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all([...bulk.selectedIds].map((id) => deleteMutation.mutateAsync(id)));
      addToast(`${bulk.count} category(ies) deleted successfully`, 'success');
      bulk.clearSelection();
      setBulkConfirmOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete some categories', 'danger');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Name', 'Description', 'Item Count'];
    const rows = items.map((item) => [item.name, item.description || '', item.itemCount ?? 0]);
    exportToCsv('categories.csv', headers, rows);
  };

  const handleExportPdf = () => {
    const headers = ['Name', 'Description', 'Item Count'];
    const rows = items.map((item) => [item.name, item.description || '', String(item.itemCount ?? 0)]);
    exportTableToPdf('Categories', headers, rows, 'categories');
  };

  return (
    <>
      <Header title="Categories" />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search categories..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ExportDropdown onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} />
            <Button variant="primary" size="md" onClick={openCreate}><Plus size={14} /> Add Category</Button>
          </div>
        </div>

        <BulkActionBar count={bulk.count} onDelete={() => setBulkConfirmOpen(true)} onClear={bulk.clearSelection} />

        <Card title="All Categories" count={totalItems} noPadding>
          <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={bulk.isAllSelected(paginatedItems.map((i) => i.id))}
                    onChange={() => bulk.toggleSelectAll(paginatedItems.map((i) => i.id))}
                  />
                </th>
                <th className={styles.sortable} onClick={() => toggleSort('name')}>Name{getSortIndicator('name')}</th>
                <th className={styles.hideMobile}>Description</th>
                <th className={styles.sortable} onClick={() => toggleSort('itemCount')}>Items{getSortIndicator('itemCount')}</th>
                <th></th>
              </tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={5} cols={5} />
            ) : (
            <tbody>
              {paginatedItems.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>No categories found</td></tr>
              )}
              {paginatedItems.map((item) => (
                <tr key={item.id} className={bulk.isSelected(item.id) ? styles.rowSelected : ''}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={bulk.isSelected(item.id)}
                      onChange={() => bulk.toggleSelect(item.id)}
                    />
                  </td>
                  <td className={styles.primary}>{item.name}</td>
                  <td className={styles.hideMobile}>{item.description || '-'}</td>
                  <td className={styles.mono}>{item.itemCount ?? '-'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => openEdit(item)}><Edit3 size={14} /></button>
                      <button className={styles.actionBtn} onClick={() => setConfirmDelete({ id: item.id, name: item.name })}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            )}
          </table>
          </div>
          <Pagination
            page={page} totalPages={totalPages} pageSize={pageSize}
            totalItems={totalItems} startIndex={startIndex} endIndex={endIndex}
            onPageChange={setPage} onPageSizeChange={setPageSize}
          />
        </Card>

        <Modal title={editing ? 'Edit Category' : 'Add Category'} open={modalOpen} onClose={() => setModalOpen(false)}
          footer={<><Button onClick={() => setModalOpen(false)}>Cancel</Button><Button variant="primary" size="md" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button></>}>
          <FormField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" />
          <FormField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
        </Modal>
        <ConfirmDialog
          open={!!confirmDelete}
          title="Delete Category"
          message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
        <ConfirmDialog
          open={bulkConfirmOpen}
          title="Delete Selected Categories"
          message={`Are you sure you want to delete ${bulk.count} selected category(ies)? This action cannot be undone.`}
          confirmLabel="Delete All"
          variant="danger"
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkConfirmOpen(false)}
        />
        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </main>
    </>
  );
}

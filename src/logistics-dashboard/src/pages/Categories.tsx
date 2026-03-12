import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Edit3, Download } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import FormField from '../components/shared/FormField';
import SkeletonTable from '../components/shared/SkeletonTable';
import ToastContainer from '../components/shared/ToastContainer';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import { exportToCsv } from '../utils/exportCsv';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { useToast } from '../hooks/useToastSimple';
import type { Category } from '../types';
import styles from './CrudPage.module.css';

export default function Categories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const { toasts, addToast, dismiss } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getCategories()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); };
  const openEdit = (item: Category) => { setEditing(item); setForm({ name: item.name, description: item.description }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) {
      addToast('Please fill in all required fields', 'danger');
      return;
    }
    try {
      if (editing) {
        await updateCategory(editing.id, form);
        addToast('Category updated successfully', 'success');
      } else {
        await createCategory(form);
        addToast('Category created successfully', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
      addToast('Failed to save category', 'danger');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      addToast('Category deleted successfully', 'success');
      setConfirmDelete(null);
      load();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete category', 'danger');
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Description', 'Item Count'];
    const rows = items.map((item) => [item.name, item.description || '', item.itemCount ?? 0]);
    exportToCsv('categories.csv', headers, rows);
  };

  return (
    <>
      <Header title="Categories" />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <div />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download size={14} /> Export
            </Button>
            <Button variant="primary" size="md" onClick={openCreate}><Plus size={14} /> Add Category</Button>
          </div>
        </div>

        <Card title="All Categories" count={items.length} noPadding>
          <table className={styles.table}>
            <thead>
              <tr><th>Name</th><th>Description</th><th>Items</th><th></th></tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={5} cols={4} />
            ) : (
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={4} className={styles.empty}>No categories found</td></tr>
              )}
              {items.map((item) => (
                <tr key={item.id}>
                  <td className={styles.primary}>{item.name}</td>
                  <td>{item.description || '-'}</td>
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
        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </main>
    </>
  );
}

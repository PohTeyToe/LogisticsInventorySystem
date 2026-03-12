import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Edit3, Download } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import FormField from '../components/shared/FormField';
import SkeletonTable from '../components/shared/SkeletonTable';
import ToastContainer from '../components/shared/ToastContainer';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api/suppliers';
import { exportToCsv } from '../utils/exportCsv';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { useToast } from '../hooks/useToastSimple';
import type { Supplier } from '../types';
import styles from './CrudPage.module.css';

export default function Suppliers() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', contactEmail: '', phone: '', address: '' });
  const { toasts, addToast, dismiss } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getSuppliers()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ name: '', contactEmail: '', phone: '', address: '' }); setModalOpen(true); };
  const openEdit = (item: Supplier) => { setEditing(item); setForm({ name: item.name, contactEmail: item.contactEmail, phone: item.phone, address: item.address }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) {
      addToast('Please fill in all required fields', 'danger');
      return;
    }
    try {
      if (editing) {
        await updateSupplier(editing.id, form);
        addToast('Supplier updated successfully', 'success');
      } else {
        await createSupplier(form);
        addToast('Supplier created successfully', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
      addToast('Failed to save supplier', 'danger');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSupplier(id);
      addToast('Supplier deleted successfully', 'success');
      setConfirmDelete(null);
      load();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete supplier', 'danger');
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Address', 'Active Orders'];
    const rows = items.map((item) => [
      item.name, item.contactEmail || '', item.phone || '',
      item.address || '', item.activeOrderCount,
    ]);
    exportToCsv('suppliers.csv', headers, rows);
  };

  return (
    <>
      <Header title="Suppliers" />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <div />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download size={14} /> Export
            </Button>
            <Button variant="primary" size="md" onClick={openCreate}><Plus size={14} /> Add Supplier</Button>
          </div>
        </div>

        <Card title="All Suppliers" count={items.length} noPadding>
          <table className={styles.table}>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th></th></tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={5} cols={5} />
            ) : (
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>No suppliers found</td></tr>
              )}
              {items.map((item) => (
                <tr key={item.id}>
                  <td className={styles.primary}>{item.name}</td>
                  <td>{item.contactEmail || '-'}</td>
                  <td className={styles.mono}>{item.phone || '-'}</td>
                  <td>{item.address || '-'}</td>
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

        <Modal title={editing ? 'Edit Supplier' : 'Add Supplier'} open={modalOpen} onClose={() => setModalOpen(false)}
          footer={<><Button onClick={() => setModalOpen(false)}>Cancel</Button><Button variant="primary" size="md" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button></>}>
          <FormField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Supplier name" />
          <FormField label="Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="contact@example.com" />
          <FormField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
          <FormField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
        </Modal>
        <ConfirmDialog
          open={!!confirmDelete}
          title="Delete Supplier"
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

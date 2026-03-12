import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Edit3, Download } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import FormField from '../components/shared/FormField';
import StatusBadge from '../components/shared/StatusBadge';
import SkeletonTable from '../components/shared/SkeletonTable';
import ToastContainer from '../components/shared/ToastContainer';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../api/warehouses';
import { exportToCsv } from '../utils/exportCsv';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { useToast } from '../hooks/useToastSimple';
import type { Warehouse } from '../types';
import styles from './CrudPage.module.css';

export default function Warehouses() {
  const [items, setItems] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({ name: '', address: '', capacity: 100 });
  const { toasts, addToast, dismiss } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getWarehouses()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ name: '', address: '', capacity: 100 }); setModalOpen(true); };
  const openEdit = (item: Warehouse) => { setEditing(item); setForm({ name: item.name, address: item.address, capacity: item.capacity }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim() || form.capacity <= 0) {
      addToast('Please fill in all required fields', 'danger');
      return;
    }
    try {
      if (editing) {
        await updateWarehouse(editing.id, form);
        addToast('Warehouse updated successfully', 'success');
      } else {
        await createWarehouse(form);
        addToast('Warehouse created successfully', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
      addToast('Failed to save warehouse', 'danger');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWarehouse(id);
      addToast('Warehouse deleted successfully', 'success');
      setConfirmDelete(null);
      load();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete warehouse', 'danger');
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Address', 'Capacity', 'Item Count', 'Utilization %', 'Active'];
    const rows = items.map((item) => [
      item.name, item.address || '', item.capacity, item.itemCount,
      item.utilizationPercentage, item.isActive ? 'Yes' : 'No',
    ]);
    exportToCsv('warehouses.csv', headers, rows);
  };

  return (
    <>
      <Header title="Warehouses" />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <div />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download size={14} /> Export
            </Button>
            <Button variant="primary" size="md" onClick={openCreate}><Plus size={14} /> Add Warehouse</Button>
          </div>
        </div>

        <Card title="All Warehouses" count={items.length} noPadding>
          <table className={styles.table}>
            <thead>
              <tr><th>Name</th><th>Address</th><th>Capacity</th><th>Status</th><th></th></tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={5} cols={5} />
            ) : (
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>No warehouses found</td></tr>
              )}
              {items.map((item) => (
                <tr key={item.id}>
                  <td className={styles.primary}>{item.name}</td>
                  <td>{item.address || '-'}</td>
                  <td className={styles.mono}>{item.capacity.toLocaleString()}</td>
                  <td>
                    <StatusBadge variant={item.isActive ? 'success' : 'danger'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </td>
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

        <Modal title={editing ? 'Edit Warehouse' : 'Add Warehouse'} open={modalOpen} onClose={() => setModalOpen(false)}
          footer={<><Button onClick={() => setModalOpen(false)}>Cancel</Button><Button variant="primary" size="md" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button></>}>
          <FormField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Warehouse name" />
          <FormField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
          <FormField label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        </Modal>
        <ConfirmDialog
          open={!!confirmDelete}
          title="Delete Warehouse"
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

import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit3, Search } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import FormField from '../components/shared/FormField';
import StatusBadge from '../components/shared/StatusBadge';
import SkeletonTable from '../components/shared/SkeletonTable';
import ToastContainer from '../components/shared/ToastContainer';
import Pagination from '../components/shared/Pagination';
import BulkActionBar from '../components/shared/BulkActionBar';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { useWarehousesList, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '../hooks/queries/useWarehouseQueries';
import { exportToCsv } from '../utils/exportCsv';
import { exportTableToPdf } from '../utils/exportPdf';
import ExportDropdown from '../components/shared/ExportDropdown';
import { useToast } from '../hooks/useToastSimple';
import { useBulkSelect } from '../hooks/useBulkSelect';
import { useTableSort } from '../hooks/useTableSort';
import { usePagination } from '../hooks/usePagination';
import type { Warehouse } from '../types';
import styles from './CrudPage.module.css';

type SortKey = 'name' | 'address' | 'capacity';

const accessor = (item: Warehouse, key: SortKey) => {
  switch (key) {
    case 'name': return item.name;
    case 'address': return item.address || '';
    case 'capacity': return item.capacity;
  }
};

export default function Warehouses() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({ name: '', address: '', capacity: 100 });
  const [search, setSearch] = useState('');
  const { toasts, addToast, dismiss } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  // Bulk select
  const bulk = useBulkSelect();
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const { data: items = [], isLoading: loading } = useWarehousesList();
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      (i.address && i.address.toLowerCase().includes(q))
    );
  }, [items, search]);

  const { sortedItems, toggleSort, getSortIndicator } = useTableSort<Warehouse, SortKey>(filtered, accessor);
  const { paginatedItems, page, pageSize, totalPages, setPage, setPageSize, startIndex, endIndex, totalItems } = usePagination(sortedItems);

  const openCreate = () => { setEditing(null); setForm({ name: '', address: '', capacity: 100 }); setModalOpen(true); };
  const openEdit = (item: Warehouse) => { setEditing(item); setForm({ name: item.name, address: item.address, capacity: item.capacity }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim() || form.capacity <= 0) {
      addToast('Please fill in all required fields', 'danger');
      return;
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, warehouse: form });
        addToast('Warehouse updated successfully', 'success');
      } else {
        await createMutation.mutateAsync(form);
        addToast('Warehouse created successfully', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to save warehouse', 'danger');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Warehouse deleted successfully', 'success');
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete warehouse', 'danger');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all([...bulk.selectedIds].map((id) => deleteMutation.mutateAsync(id)));
      addToast(`${bulk.count} warehouse(s) deleted successfully`, 'success');
      bulk.clearSelection();
      setBulkConfirmOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete some warehouses', 'danger');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Name', 'Address', 'Capacity', 'Item Count', 'Utilization %', 'Active'];
    const rows = items.map((item) => [
      item.name, item.address || '', item.capacity, item.itemCount,
      item.utilizationPercentage, item.isActive ? 'Yes' : 'No',
    ]);
    exportToCsv('warehouses.csv', headers, rows);
  };

  const handleExportPdf = () => {
    const headers = ['Name', 'Address', 'Capacity', 'Item Count', 'Utilization %', 'Active'];
    const rows = items.map((item) => [
      item.name, item.address || '', String(item.capacity), String(item.itemCount),
      String(item.utilizationPercentage), item.isActive ? 'Yes' : 'No',
    ]);
    exportTableToPdf('Warehouses', headers, rows, 'warehouses');
  };

  return (
    <>
      <Header title="Warehouses" />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search warehouses..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ExportDropdown onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} />
            <Button variant="primary" size="md" onClick={openCreate}><Plus size={14} /> Add Warehouse</Button>
          </div>
        </div>

        <BulkActionBar count={bulk.count} onDelete={() => setBulkConfirmOpen(true)} onClear={bulk.clearSelection} />

        <Card title="All Warehouses" count={totalItems} noPadding>
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
                <th className={`${styles.sortable} ${styles.hideMobile}`} onClick={() => toggleSort('address')}>Address{getSortIndicator('address')}</th>
                <th className={styles.sortable} onClick={() => toggleSort('capacity')}>Capacity{getSortIndicator('capacity')}</th>
                <th>Utilization</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={5} cols={7} />
            ) : (
            <tbody>
              {paginatedItems.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>No warehouses found</td></tr>
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
                  <td className={styles.hideMobile}>{item.address || '-'}</td>
                  <td className={styles.mono}>{item.capacity.toLocaleString()}</td>
                  <td>
                    <div className={styles.utilBarWrap}>
                      <div className={styles.utilBarBg}>
                        <div
                          className={`${styles.utilBarFill} ${
                            item.utilizationPercentage > 85 ? styles.utilHigh :
                            item.utilizationPercentage > 60 ? styles.utilMid : styles.utilLow
                          }`}
                          style={{ width: `${Math.min(item.utilizationPercentage, 100)}%` }}
                        />
                      </div>
                      <span className={styles.mono}>{Math.round(item.utilizationPercentage)}%</span>
                    </div>
                  </td>
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
          </div>
          <Pagination
            page={page} totalPages={totalPages} pageSize={pageSize}
            totalItems={totalItems} startIndex={startIndex} endIndex={endIndex}
            onPageChange={setPage} onPageSizeChange={setPageSize}
          />
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
        <ConfirmDialog
          open={bulkConfirmOpen}
          title="Delete Selected Warehouses"
          message={`Are you sure you want to delete ${bulk.count} selected warehouse(s)? This action cannot be undone.`}
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

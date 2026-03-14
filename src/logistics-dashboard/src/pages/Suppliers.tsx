import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit3, Download, Search, BarChart3 } from 'lucide-react';
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
import ErrorState from '../components/shared/ErrorState';
import { useSuppliersList, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../hooks/queries/useSupplierQueries';
import { getSupplierPerformance } from '../api/suppliers';
import { exportToCsv } from '../utils/exportCsv';
import { useToast } from '../hooks/useToastSimple';
import { useBulkSelect } from '../hooks/useBulkSelect';
import { useTableSort } from '../hooks/useTableSort';
import { usePagination } from '../hooks/usePagination';
import type { Supplier, SupplierPerformance } from '../types';
import styles from './CrudPage.module.css';
import perfStyles from './Suppliers.module.css';

type SortKey = 'name' | 'contactEmail' | 'phone';

const accessor = (item: Supplier, key: SortKey) => {
  switch (key) {
    case 'name': return item.name;
    case 'contactEmail': return item.contactEmail || '';
    case 'phone': return item.phone || '';
  }
};

export default function Suppliers() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', contactEmail: '', phone: '', address: '' });
  const [search, setSearch] = useState('');
  const { toasts, addToast, dismiss } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  // Bulk select
  const bulk = useBulkSelect();
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const [perfSupplier, setPerfSupplier] = useState<Supplier | null>(null);
  const [perfData, setPerfData] = useState<SupplierPerformance | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);

  const { data: items = [], isLoading: loading, isError, refetch } = useSuppliersList();
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const openPerformance = async (supplier: Supplier) => {
    setPerfSupplier(supplier);
    setPerfData(null);
    setPerfLoading(true);
    try {
      const data = await getSupplierPerformance(supplier.id);
      setPerfData(data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load supplier performance', 'danger');
      setPerfSupplier(null);
    } finally {
      setPerfLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      (i.contactEmail && i.contactEmail.toLowerCase().includes(q)) ||
      (i.phone && i.phone.toLowerCase().includes(q)) ||
      (i.address && i.address.toLowerCase().includes(q))
    );
  }, [items, search]);

  const { sortedItems, toggleSort, getSortIndicator } = useTableSort<Supplier, SortKey>(filtered, accessor);
  const { paginatedItems, page, pageSize, totalPages, setPage, setPageSize, startIndex, endIndex, totalItems } = usePagination(sortedItems);

  const openCreate = () => { setEditing(null); setForm({ name: '', contactEmail: '', phone: '', address: '' }); setModalOpen(true); };
  const openEdit = (item: Supplier) => { setEditing(item); setForm({ name: item.name, contactEmail: item.contactEmail, phone: item.phone, address: item.address }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) {
      addToast('Please fill in all required fields', 'danger');
      return;
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, supplier: form });
        addToast('Supplier updated successfully', 'success');
      } else {
        await createMutation.mutateAsync(form);
        addToast('Supplier created successfully', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to save supplier', 'danger');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Supplier deleted successfully', 'success');
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete supplier', 'danger');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all([...bulk.selectedIds].map((id) => deleteMutation.mutateAsync(id)));
      addToast(`${bulk.count} supplier(s) deleted successfully`, 'success');
      bulk.clearSelection();
      setBulkConfirmOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete some suppliers', 'danger');
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
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download size={14} /> Export
            </Button>
            <Button variant="primary" size="md" onClick={openCreate}><Plus size={14} /> Add Supplier</Button>
          </div>
        </div>

        <BulkActionBar count={bulk.count} onDelete={() => setBulkConfirmOpen(true)} onClear={bulk.clearSelection} />

        {isError && !loading && <ErrorState message="Failed to load suppliers" onRetry={() => refetch()} />}

        <Card title="All Suppliers" count={totalItems} noPadding>
          <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    aria-label="Select all"
                    checked={bulk.isAllSelected(paginatedItems.map((i) => i.id))}
                    onChange={() => bulk.toggleSelectAll(paginatedItems.map((i) => i.id))}
                  />
                </th>
                <th className={styles.sortable} onClick={() => toggleSort('name')}>Name{getSortIndicator('name')}</th>
                <th className={styles.sortable} onClick={() => toggleSort('contactEmail')}>Email{getSortIndicator('contactEmail')}</th>
                <th className={`${styles.sortable} ${styles.hideMobile}`} onClick={() => toggleSort('phone')}>Phone{getSortIndicator('phone')}</th>
                <th className={styles.hideMobile}>Address</th>
                <th></th>
              </tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={5} cols={6} />
            ) : (
            <tbody>
              {paginatedItems.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>No suppliers found</td></tr>
              )}
              {paginatedItems.map((item) => (
                <tr key={item.id} className={bulk.isSelected(item.id) ? styles.rowSelected : ''}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      aria-label={`Select ${item.name}`}
                      checked={bulk.isSelected(item.id)}
                      onChange={() => bulk.toggleSelect(item.id)}
                    />
                  </td>
                  <td className={styles.primary}>{item.name}</td>
                  <td>{item.contactEmail || '-'}</td>
                  <td className={`${styles.mono} ${styles.hideMobile}`}>{item.phone || '-'}</td>
                  <td className={styles.hideMobile}>{item.address || '-'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Performance" aria-label="View performance" onClick={() => openPerformance(item)}><BarChart3 size={14} /></button>
                      <button className={styles.actionBtn} aria-label={`Edit ${item.name}`} onClick={() => openEdit(item)}><Edit3 size={14} /></button>
                      <button className={styles.actionBtn} aria-label={`Delete ${item.name}`} onClick={() => setConfirmDelete({ id: item.id, name: item.name })}><Trash2 size={14} /></button>
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

        <Modal title={editing ? 'Edit Supplier' : 'Add Supplier'} open={modalOpen} onClose={() => setModalOpen(false)}
          footer={<><Button onClick={() => setModalOpen(false)}>Cancel</Button><Button variant="primary" size="md" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>{createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}</Button></>}>
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
        <ConfirmDialog
          open={bulkConfirmOpen}
          title="Delete Selected Suppliers"
          message={`Are you sure you want to delete ${bulk.count} selected supplier(s)? This action cannot be undone.`}
          confirmLabel="Delete All"
          variant="danger"
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkConfirmOpen(false)}
        />
        <Modal
          title={`Performance — ${perfSupplier?.name ?? ''}`}
          open={!!perfSupplier}
          onClose={() => setPerfSupplier(null)}
        >
          {perfLoading ? (
            <div className={perfStyles.perfLoading}>Loading metrics...</div>
          ) : perfData ? (
            <div className={perfStyles.perfGrid}>
              <div className={perfStyles.perfCard}>
                <div className={perfStyles.perfValue}>{perfData.totalOrders}</div>
                <div className={perfStyles.perfLabel}>Total Orders</div>
              </div>
              <div className={perfStyles.perfCard}>
                <div className={`${perfStyles.perfValue} ${perfStyles.perfValueSuccess}`}>{perfData.completedOrders}</div>
                <div className={perfStyles.perfLabel}>Completed</div>
              </div>
              <div className={perfStyles.perfCard}>
                <div className={`${perfStyles.perfValue} ${perfData.onTimeDeliveryRate >= 80 ? perfStyles.perfValueSuccess : perfData.onTimeDeliveryRate >= 50 ? perfStyles.perfValueAmber : perfStyles.perfValueDanger}`}>
                  {perfData.onTimeDeliveryRate}%
                </div>
                <div className={perfStyles.perfLabel}>On-Time Rate</div>
              </div>
              <div className={perfStyles.perfCard}>
                <div className={perfStyles.perfValue}>{perfData.averageLeadTimeDays}d</div>
                <div className={perfStyles.perfLabel}>Avg Lead Time</div>
              </div>
              <div className={perfStyles.perfCardFull}>
                <div className={`${perfStyles.perfValue} ${perfStyles.perfValueTeal}`}>
                  ${perfData.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={perfStyles.perfLabel}>Total Spend</div>
              </div>
            </div>
          ) : null}
        </Modal>
        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </main>
    </>
  );
}

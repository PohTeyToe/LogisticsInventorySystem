import { useState } from 'react';
import { Plus, Trash2, Edit3, Search, Eye } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import FormField from '../components/shared/FormField';
import StatusBadge from '../components/shared/StatusBadge';
import SkeletonTable from '../components/shared/SkeletonTable';
import ToastContainer from '../components/shared/ToastContainer';
import DetailDrawer from '../components/shared/DetailDrawer';
import InventoryDetail from '../components/shared/InventoryDetail';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import ExportDropdown from '../components/shared/ExportDropdown';
import BulkActionBar from '../components/shared/BulkActionBar';
import { useInventoryList, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem } from '../hooks/queries/useInventoryQueries';
import { useCategoriesList } from '../hooks/queries/useCategoryQueries';
import { useWarehousesList } from '../hooks/queries/useWarehouseQueries';
import { useItemMovementHistory } from '../hooks/queries/useStockMovementQueries';
import { getInventory } from '../api/inventory';
import { exportToCsv } from '../utils/exportCsv';
import { exportTableToPdf } from '../utils/exportPdf';
import { useToast } from '../hooks/useToastSimple';
import { useBulkSelect } from '../hooks/useBulkSelect';
import { useTableSort } from '../hooks/useTableSort';
import Pagination from '../components/shared/Pagination';
import { getPageSize, formatCurrency } from '../hooks/useSettings';
import type { InventoryItem, CreateInventoryItemRequest } from '../types';
import styles from './CrudPage.module.css';

type SortKey = 'sku' | 'name' | 'quantity' | 'unitPrice';
const sortAccessor = (item: InventoryItem, key: SortKey) => {
  switch (key) {
    case 'sku': return item.sku;
    case 'name': return item.name;
    case 'quantity': return item.quantity;
    case 'unitPrice': return item.unitPrice;
  }
};

export default function Inventory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<CreateInventoryItemRequest>({
    sku: '', name: '', quantity: 0, unitPrice: 0, categoryId: 0, warehouseId: 0, reorderLevel: 10,
  });
  const { toasts, addToast, dismiss } = useToast();

  // Detail drawer state
  const [drawerItemId, setDrawerItemId] = useState<number | null>(null);
  const [drawerItem, setDrawerItem] = useState<InventoryItem | null>(null);

  // Bulk select
  const bulk = useBulkSelect();
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  // Confirm dialog state
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const pageSize = getPageSize(20);

  // TanStack Query hooks
  const { data: inventoryData, isLoading: loading } = useInventoryList(page, pageSize, search || undefined);
  const { data: categories = [] } = useCategoriesList();
  const { data: warehouses = [] } = useWarehousesList();
  const { data: drawerMovements = [] } = useItemMovementHistory(drawerItemId ?? 0);

  const items = inventoryData?.items ?? [];
  const totalCount = inventoryData?.totalCount ?? 0;
  const { sortedItems, toggleSort, getSortIndicator } = useTableSort<InventoryItem, SortKey>(items, sortAccessor);

  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();

  const openCreate = () => {
    setEditing(null);
    setForm({ sku: '', name: '', quantity: 0, unitPrice: 0, categoryId: categories[0]?.id || 0, warehouseId: warehouses[0]?.id || 0, reorderLevel: 10 });
    setModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      sku: item.sku, name: item.name, description: item.description, quantity: item.quantity,
      location: item.location ?? undefined, unitPrice: item.unitPrice, categoryId: item.categoryId,
      warehouseId: item.warehouseId, reorderLevel: item.reorderLevel,
    });
    setModalOpen(true);
  };

  const openDetail = (item: InventoryItem) => {
    setDrawerItem(item);
    setDrawerItemId(item.id);
  };

  const handleSave = async () => {
    if (!form.sku.trim() || !form.name.trim() || form.categoryId <= 0 || form.warehouseId <= 0) {
      addToast('Please fill in all required fields', 'danger');
      return;
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, item: form });
        addToast('Item updated successfully', 'success');
      } else {
        await createMutation.mutateAsync(form);
        addToast('Item created successfully', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to save item', 'danger');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Item deleted successfully', 'success');
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete item', 'danger');
    }
  };

  const getAllItems = async (): Promise<InventoryItem[]> => {
    let allItems: InventoryItem[] = [];
    let pg = 1;
    let hasMore = true;
    while (hasMore) {
      const res = await getInventory(pg, 100);
      allItems = allItems.concat(res.items);
      hasMore = pg < res.totalPages;
      pg++;
    }
    return allItems;
  };

  const exportHeaders = ['SKU', 'Name', 'Category', 'Warehouse', 'Quantity', 'Unit Price', 'Total Value'];
  const toExportRows = (data: InventoryItem[]) =>
    data.map((item) => [
      item.sku, item.name, item.categoryName, item.warehouseName,
      String(item.quantity), String(item.unitPrice), String(item.quantity * item.unitPrice),
    ]);

  const handleExportCsv = async () => {
    try {
      const allItems = await getAllItems();
      exportToCsv('inventory.csv', exportHeaders, allItems.map((item) => [
        item.sku, item.name, item.categoryName, item.warehouseName,
        item.quantity, item.unitPrice, item.quantity * item.unitPrice,
      ]));
    } catch (err) {
      console.error(err);
      addToast('Failed to export inventory', 'danger');
    }
  };

  const handleExportPdf = async () => {
    try {
      const allItems = await getAllItems();
      exportTableToPdf('Inventory Items', exportHeaders, toExportRows(allItems), 'inventory');
    } catch (err) {
      console.error(err);
      addToast('Failed to export inventory', 'danger');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all([...bulk.selectedIds].map((id) => deleteMutation.mutateAsync(id)));
      addToast(`${bulk.count} item(s) deleted successfully`, 'success');
      bulk.clearSelection();
      setBulkConfirmOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete some items', 'danger');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const fmtCurrency = (n: number) => formatCurrency(n, 2);

  return (
    <>
      <Header title="Inventory Items" />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ExportDropdown onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} />
            <Button variant="primary" size="md" onClick={openCreate}>
              <Plus size={14} /> Add Item
            </Button>
          </div>
        </div>

        <BulkActionBar count={bulk.count} onDelete={() => setBulkConfirmOpen(true)} onClear={bulk.clearSelection} />

        <Card title="All Items" count={totalCount} noPadding>
          <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={bulk.isAllSelected(sortedItems.map((i) => i.id))}
                    onChange={() => bulk.toggleSelectAll(sortedItems.map((i) => i.id))}
                  />
                </th>
                <th className={styles.sortable} onClick={() => toggleSort('sku')}>SKU{getSortIndicator('sku')}</th>
                <th className={styles.sortable} onClick={() => toggleSort('name')}>Name{getSortIndicator('name')}</th>
                <th className={styles.hideMobile}>Category</th>
                <th className={styles.hideMobile}>Warehouse</th>
                <th className={styles.sortable} onClick={() => toggleSort('quantity')}>Qty{getSortIndicator('quantity')}</th>
                <th className={styles.sortable} onClick={() => toggleSort('unitPrice')}>Unit Price{getSortIndicator('unitPrice')}</th>
                <th className={styles.hideMobile}>Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={10} cols={10} />
            ) : (
            <tbody>
              {sortedItems.length === 0 && (
                <tr><td colSpan={10} className={styles.empty}>No inventory items found</td></tr>
              )}
              {sortedItems.map((item) => (
                <tr key={item.id} onClick={() => openDetail(item)} style={{ cursor: 'pointer' }} className={bulk.isSelected(item.id) ? styles.rowSelected : ''}>
                  <td className={styles.checkboxCell} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={bulk.isSelected(item.id)}
                      onChange={() => bulk.toggleSelect(item.id)}
                    />
                  </td>
                  <td className={styles.mono}>{item.sku}</td>
                  <td className={styles.primary}>{item.name}</td>
                  <td className={styles.hideMobile}>{item.categoryName}</td>
                  <td className={styles.hideMobile}>{item.warehouseName}</td>
                  <td className={styles.mono}>{item.quantity.toLocaleString()}</td>
                  <td className={styles.mono}>{fmtCurrency(item.unitPrice)}</td>
                  <td className={`${styles.mono} ${styles.hideMobile}`}>{fmtCurrency(item.quantity * item.unitPrice)}</td>
                  <td>
                    {item.quantity <= item.reorderLevel ? (
                      <StatusBadge variant="danger">Low Stock</StatusBadge>
                    ) : (
                      <StatusBadge variant="success">In Stock</StatusBadge>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); openDetail(item); }} title="View">
                        <Eye size={14} />
                      </button>
                      <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); openEdit(item); }} title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: item.id, name: item.name }); }} title="Delete">
                        <Trash2 size={14} />
                      </button>
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
            totalItems={totalCount} startIndex={(page - 1) * pageSize}
            endIndex={Math.min(page * pageSize, totalCount)}
            onPageChange={setPage} onPageSizeChange={() => { /* server-side page size is fixed */ }}
          />
        </Card>

        <Modal
          title={editing ? 'Edit Inventory Item' : 'Add Inventory Item'}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleSave}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <FormField label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. STL-BLT-010" />
          <FormField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
          <FormField label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          <FormField label="Unit Price" type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} />
          <FormField label="Location" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Shelf/Bin location" />
          <FormField label="Reorder Level" type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })} />
          <div className={styles.selectField}>
            <label className={styles.selectLabel} htmlFor="category">Category</label>
            <select id="category" className={styles.select} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.selectField}>
            <label className={styles.selectLabel} htmlFor="warehouse">Warehouse</label>
            <select id="warehouse" className={styles.select} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: Number(e.target.value) })}>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </Modal>

        <DetailDrawer
          open={!!drawerItem}
          onClose={() => { setDrawerItem(null); setDrawerItemId(null); }}
          title={drawerItem?.name || 'Item Details'}
        >
          {drawerItem && (
            <InventoryDetail item={drawerItem} movements={drawerMovements} />
          )}
        </DetailDrawer>

        <ConfirmDialog
          open={!!confirmDelete}
          title="Delete Inventory Item"
          message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />

        <ConfirmDialog
          open={bulkConfirmOpen}
          title="Delete Selected Items"
          message={`Are you sure you want to delete ${bulk.count} selected item(s)? This action cannot be undone.`}
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

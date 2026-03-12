import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Edit3, Search, Download, Eye } from 'lucide-react';
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
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../api/inventory';
import { getCategories } from '../api/categories';
import { getWarehouses } from '../api/warehouses';
import { getStockMovements } from '../api/stockMovements';
import { exportToCsv } from '../utils/exportCsv';
import { useToast } from '../hooks/useToastSimple';
import type { InventoryItem, Category, Warehouse, CreateInventoryItemRequest, StockMovement } from '../types';
import styles from './CrudPage.module.css';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<CreateInventoryItemRequest>({
    sku: '', name: '', quantity: 0, unitPrice: 0, categoryId: 0, warehouseId: 0, reorderLevel: 10,
  });
  const { toasts, addToast, dismiss } = useToast();

  // Detail drawer state
  const [drawerItem, setDrawerItem] = useState<InventoryItem | null>(null);
  const [drawerMovements, setDrawerMovements] = useState<StockMovement[]>([]);

  // Confirm dialog state
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, cats, whs] = await Promise.all([
        getInventory(page, pageSize, search || undefined),
        getCategories(),
        getWarehouses(),
      ]);
      setItems(res.items);
      setTotalCount(res.totalCount);
      setCategories(cats);
      setWarehouses(whs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ sku: '', name: '', quantity: 0, unitPrice: 0, categoryId: categories[0]?.id || 0, warehouseId: warehouses[0]?.id || 0, reorderLevel: 10 });
    setModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      sku: item.sku, name: item.name, description: item.description, quantity: item.quantity,
      location: item.location, unitPrice: item.unitPrice, categoryId: item.categoryId,
      warehouseId: item.warehouseId, reorderLevel: item.reorderLevel,
    });
    setModalOpen(true);
  };

  const openDetail = async (item: InventoryItem) => {
    setDrawerItem(item);
    try {
      const movements = await getStockMovements({});
      setDrawerMovements(movements.filter((m) => m.itemSku === item.sku));
    } catch {
      setDrawerMovements([]);
    }
  };

  const handleSave = async () => {
    if (!form.sku.trim() || !form.name.trim() || form.categoryId <= 0 || form.warehouseId <= 0) {
      addToast('Please fill in all required fields', 'danger');
      return;
    }
    try {
      if (editing) {
        await updateInventoryItem(editing.id, form);
        addToast('Item updated successfully', 'success');
      } else {
        await createInventoryItem(form);
        addToast('Item created successfully', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
      addToast('Failed to save item', 'danger');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteInventoryItem(id);
      addToast('Item deleted successfully', 'success');
      setConfirmDelete(null);
      load();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete item', 'danger');
    }
  };

  const handleExport = async () => {
    try {
      let allItems: InventoryItem[] = [];
      let pg = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await getInventory(pg, 100);
        allItems = allItems.concat(res.items);
        hasMore = pg < res.totalPages;
        pg++;
      }
      const headers = ['SKU', 'Name', 'Category', 'Warehouse', 'Quantity', 'Unit Price', 'Total Value'];
      const rows = allItems.map((item) => [
        item.sku, item.name, item.categoryName, item.warehouseName,
        item.quantity, item.unitPrice, item.quantity * item.unitPrice,
      ]);
      exportToCsv('inventory.csv', headers, rows);
    } catch (err) {
      console.error(err);
      addToast('Failed to export inventory', 'danger');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const fmtCurrency = (n: number) => `$${n.toFixed(2)}`;

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
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download size={14} /> Export
            </Button>
            <Button variant="primary" size="md" onClick={openCreate}>
              <Plus size={14} /> Add Item
            </Button>
          </div>
        </div>

        <Card title="All Items" count={totalCount} noPadding>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Warehouse</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            {loading ? (
              <SkeletonTable rows={10} cols={9} />
            ) : (
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={9} className={styles.empty}>No inventory items found</td></tr>
              )}
              {items.map((item) => (
                <tr key={item.id} onClick={() => openDetail(item)} style={{ cursor: 'pointer' }}>
                  <td className={styles.mono}>{item.sku}</td>
                  <td className={styles.primary}>{item.name}</td>
                  <td>{item.categoryName}</td>
                  <td>{item.warehouseName}</td>
                  <td className={styles.mono}>{item.quantity.toLocaleString()}</td>
                  <td className={styles.mono}>{fmtCurrency(item.unitPrice)}</td>
                  <td className={styles.mono}>{fmtCurrency(item.quantity * item.unitPrice)}</td>
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
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <span className={styles.mono}>Page {page} of {totalPages} ({totalCount} items)</span>
              <div className={styles.pageButtons}>
                <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
                <Button size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
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
            <label className={styles.selectLabel}>Category</label>
            <select className={styles.select} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.selectField}>
            <label className={styles.selectLabel}>Warehouse</label>
            <select className={styles.select} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: Number(e.target.value) })}>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </Modal>

        <DetailDrawer
          open={!!drawerItem}
          onClose={() => setDrawerItem(null)}
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

        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </main>
    </>
  );
}

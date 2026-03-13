import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import { createStockMovement } from '../../api/stockMovements';
import { getInventory } from '../../api/inventory';
import type { InventoryItem, StockMovementType } from '../../types';
import styles from './CreateMovementModal.module.css';

interface CreateMovementModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const movementTypes: { value: StockMovementType; label: string }[] = [
  { value: 'IN', label: 'IN — Stock received' },
  { value: 'OUT', label: 'OUT — Stock dispatched' },
  { value: 'ADJUSTMENT', label: 'ADJUSTMENT — Correction' },
];

const initialForm = {
  type: 'IN' as StockMovementType,
  inventoryItemId: 0,
  quantity: 1,
  referenceNumber: '',
  notes: '',
};

export default function CreateMovementModal({ open, onClose, onCreated }: CreateMovementModalProps) {
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      getInventory(1, 200)
        .then((res) => {
          setItems(res.items);
          setForm((f) => {
            if (res.items.length > 0 && f.inventoryItemId === 0) {
              return { ...f, inventoryItemId: res.items[0].id };
            }
            return f;
          });
        })
        .catch(() => setError('Failed to load inventory items'));
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setError('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (form.inventoryItemId === 0) {
      setError('Please select an inventory item');
      return;
    }
    if (form.quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const reason = [form.referenceNumber, form.notes].filter(Boolean).join(' — ');
      await createStockMovement({
        inventoryItemId: form.inventoryItemId,
        type: form.type,
        quantity: form.quantity,
        reason: reason || undefined,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create movement';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Record Stock Movement"
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Recording...' : 'Record Movement'}
          </Button>
        </>
      }
    >
      {error && <div className={styles.errorMsg}>{error}</div>}

      <div className={styles.selectField}>
        <label className={styles.selectLabel}>Movement Type</label>
        <select
          className={styles.select}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as StockMovementType })}
        >
          {movementTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.selectField}>
        <label className={styles.selectLabel}>Inventory Item</label>
        <select
          className={styles.select}
          value={form.inventoryItemId}
          onChange={(e) => setForm({ ...form, inventoryItemId: Number(e.target.value) })}
        >
          <option value={0} disabled>Select an item...</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.sku} — {item.name} (Qty: {item.quantity})
            </option>
          ))}
        </select>
      </div>

      <FormField
        label="Quantity"
        type="number"
        min={1}
        value={form.quantity}
        onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
      />

      <FormField
        label="Reference Number"
        value={form.referenceNumber}
        onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
        placeholder="e.g. PO-0012, ADJ-003"
      />

      <div className={styles.selectField}>
        <label className={styles.selectLabel}>Notes</label>
        <textarea
          className={styles.textarea}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Optional notes about this movement"
          rows={3}
        />
      </div>
    </Modal>
  );
}

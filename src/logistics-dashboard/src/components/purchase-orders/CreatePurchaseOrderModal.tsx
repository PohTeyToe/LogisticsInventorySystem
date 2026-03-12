import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { getSuppliers } from '../../api/suppliers';
import { getInventory } from '../../api/inventory';
import { createPurchaseOrder } from '../../api/purchaseOrders';
import type { Supplier, InventoryItem } from '../../types';
import styles from './CreatePurchaseOrderModal.module.css';

interface LineItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

interface CreatePurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  addToast: (message: string, variant: 'success' | 'danger') => void;
}

const emptyLine = (): LineItem => ({ itemName: '', quantity: 1, unitPrice: 0 });

export default function CreatePurchaseOrderModal({
  open,
  onClose,
  onCreated,
  addToast,
}: CreatePurchaseOrderModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [supplierId, setSupplierId] = useState(0);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    // Reset form when opening
    setLineItems([emptyLine()]);
    setExpectedDeliveryDate('');
    setError('');
    setSubmitting(false);

    Promise.all([getSuppliers(), getInventory(1, 200)]).then(
      ([s, inv]) => {
        setSuppliers(s);
        setInventoryItems(inv.items);
        if (s.length > 0) setSupplierId(s[0].id);
      },
      () => addToast('Failed to load form data', 'danger'),
    );
  }, [open, addToast]);

  const updateLine = (index: number, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  const removeLine = (index: number) => {
    setLineItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const addLine = () => setLineItems((prev) => [...prev, emptyLine()]);

  const selectInventoryItem = (index: number, itemName: string) => {
    const match = inventoryItems.find((inv) => inv.name === itemName);
    updateLine(index, {
      itemName,
      unitPrice: match ? match.unitPrice : 0,
    });
  };

  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const handleSubmit = async () => {
    setError('');
    if (supplierId <= 0) {
      setError('Please select a supplier.');
      return;
    }
    const validLines = lineItems.filter((li) => li.itemName.trim() !== '');
    if (validLines.length === 0) {
      setError('Please add at least one line item.');
      return;
    }
    for (const li of validLines) {
      if (li.quantity <= 0 || li.unitPrice <= 0) {
        setError('All line items must have quantity > 0 and unit price > 0.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await createPurchaseOrder({
        supplierId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        items: validLines,
      });
      addToast('Purchase order created successfully', 'success');
      onCreated();
      onClose();
    } catch {
      addToast('Failed to create purchase order', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const fmtCurrency = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <Modal
      title="Create Purchase Order"
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Order'}
          </Button>
        </>
      }
    >
      {/* Supplier */}
      <div className={styles.selectField}>
        <label className={styles.sectionLabel}>Supplier</label>
        <select
          className={styles.select}
          value={supplierId}
          onChange={(e) => setSupplierId(Number(e.target.value))}
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Expected Delivery Date */}
      <div className={styles.selectField}>
        <label className={styles.sectionLabel}>Expected Delivery Date</label>
        <input
          type="date"
          className={styles.lineInput}
          value={expectedDeliveryDate}
          onChange={(e) => setExpectedDeliveryDate(e.target.value)}
        />
      </div>

      {/* Line Items */}
      <div className={styles.formSection}>
        <span className={styles.sectionLabel}>Line Items</span>
        <div className={styles.lineItems}>
          {/* Column headers for first row */}
          {lineItems.length > 0 && (
            <div className={styles.lineItemRow}>
              <div className={styles.lineFieldLabel}>Item</div>
              <div className={styles.lineFieldLabel}>Qty</div>
              <div className={styles.lineFieldLabel}>Unit Price</div>
              <div />
            </div>
          )}
          {lineItems.map((li, idx) => (
            <div key={idx} className={styles.lineItemRow}>
              <select
                className={styles.select}
                value={li.itemName}
                onChange={(e) => selectInventoryItem(idx, e.target.value)}
              >
                <option value="">Select item...</option>
                {inventoryItems.map((inv) => (
                  <option key={inv.id} value={inv.name}>
                    {inv.name} ({inv.sku})
                  </option>
                ))}
              </select>
              <input
                type="number"
                className={styles.lineInput}
                min={1}
                value={li.quantity}
                onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
              />
              <input
                type="number"
                className={styles.lineInput}
                step="0.01"
                min={0}
                value={li.unitPrice}
                onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })}
              />
              <button
                className={styles.removeBtn}
                onClick={() => removeLine(idx)}
                title="Remove line"
                disabled={lineItems.length <= 1}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button className={styles.addLineBtn} onClick={addLine} type="button">
            <Plus size={14} /> Add Line Item
          </button>
        </div>

        {/* Total */}
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Estimated Total</span>
          <span className={styles.totalValue}>{fmtCurrency(total)}</span>
        </div>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
    </Modal>
  );
}

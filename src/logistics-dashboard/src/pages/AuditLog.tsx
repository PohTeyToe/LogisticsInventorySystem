import { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import SkeletonTable from '../components/shared/SkeletonTable';
import Pagination from '../components/shared/Pagination';
import ToastContainer from '../components/shared/ToastContainer';
import { getAuditLogs } from '../api/auditLog';
import { useToast } from '../hooks/useToastSimple';
import type { AuditLogEntry, AuditAction } from '../types';
import styles from './AuditLog.module.css';

const ENTITY_TYPES = ['All', 'InventoryItem', 'Category', 'Warehouse', 'Supplier', 'PurchaseOrder', 'StockMovement'];

const ACTION_BADGE: Record<AuditAction, string> = {
  Create: styles.badgeCreate,
  Update: styles.badgeUpdate,
  Delete: styles.badgeDelete,
};

interface ChangeDiff {
  Old: unknown;
  New: unknown;
}

function parseChanges(changes: string | null): Record<string, ChangeDiff | unknown> | null {
  if (!changes) return null;
  try {
    return JSON.parse(changes);
  } catch {
    return null;
  }
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '(null)';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const { toasts, addToast, dismiss } = useToast();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize };
      if (entityType !== 'All') params.entityType = entityType;
      if (dateFrom) params.from = new Date(dateFrom).toISOString();
      if (dateTo) params.to = new Date(dateTo + 'T23:59:59').toISOString();
      const result = await getAuditLogs(params);
      setLogs(result.items);
      setTotalCount(result.totalCount);
    } catch {
      addToast('Failed to load audit logs', 'danger');
    } finally {
      setLoading(false);
    }
  }, [entityType, dateFrom, dateTo, page, pageSize, addToast]);

  useEffect(() => { load(); }, [load]);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEntityTypeChange = (val: string) => {
    setEntityType(val);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + logs.length, totalCount);

  return (
    <>
      <Header title="Audit Log" />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Entity Type</label>
              <select
                className={styles.filterSelect}
                value={entityType}
                onChange={(e) => handleEntityTypeChange(e.target.value)}
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>From</label>
              <input
                type="date"
                className={styles.filterInput}
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To</label>
              <input
                type="date"
                className={styles.filterInput}
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        <Card title="Activity History" count={totalCount} noPadding>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Timestamp</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Action</th>
                  <th className={styles.hideMobile}>User</th>
                </tr>
              </thead>
              {loading ? (
                <SkeletonTable rows={8} cols={6} />
              ) : (
                <tbody>
                  {logs.length === 0 && (
                    <tr><td colSpan={6} className={styles.empty}>No audit logs found</td></tr>
                  )}
                  {logs.map((log) => {
                    const expanded = expandedRows.has(log.id);
                    const parsed = parseChanges(log.changes);
                    const hasChanges = parsed !== null;
                    return (
                      <>
                        <tr key={log.id}>
                          <td>
                            {hasChanges && (
                              <button
                                className={styles.expandBtn}
                                onClick={() => toggleRow(log.id)}
                                aria-label={expanded ? 'Collapse changes' : 'Expand changes'}
                              >
                                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            )}
                          </td>
                          <td className={styles.mono}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className={styles.primary}>{log.entityType}</td>
                          <td className={styles.mono}>{log.entityId}</td>
                          <td>
                            <span className={`${styles.badge} ${ACTION_BADGE[log.action] || ''}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className={styles.hideMobile}>{log.userId || '-'}</td>
                        </tr>
                        {expanded && hasChanges && (
                          <tr key={`${log.id}-changes`} className={styles.changesRow}>
                            <td colSpan={6}>
                              <div className={styles.changesWrap}>
                                <table className={styles.changesTable}>
                                  <thead>
                                    <tr>
                                      <th>Field</th>
                                      {log.action === 'Update' ? (
                                        <>
                                          <th>Old Value</th>
                                          <th>New Value</th>
                                        </>
                                      ) : (
                                        <th>Value</th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(parsed!).map(([field, value]) => {
                                      const diff = value as ChangeDiff;
                                      const isUpdateDiff = log.action === 'Update' && diff && typeof diff === 'object' && 'Old' in diff;
                                      return (
                                        <tr key={field}>
                                          <td>{field}</td>
                                          {isUpdateDiff ? (
                                            <>
                                              <td className={styles.oldValue}>{formatValue(diff.Old)}</td>
                                              <td className={styles.newValue}>{formatValue(diff.New)}</td>
                                            </>
                                          ) : (
                                            <td>{formatValue(value)}</td>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalCount}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </main>
    </>
  );
}

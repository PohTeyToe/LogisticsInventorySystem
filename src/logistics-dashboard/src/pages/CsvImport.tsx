import { useState, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import ToastContainer from '../components/shared/ToastContainer';
import { importInventoryCsv } from '../api/imports';
import { useToast } from '../hooks/useToastSimple';
import type { ImportResult } from '../types';
import styles from './CrudPage.module.css';

export default function CsvImport() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, dismiss } = useToast();

  const handleFile = (f: File | undefined) => {
    if (f && f.name.endsWith('.csv')) {
      setFile(f);
      setResult(null);
    } else if (f) {
      addToast('Only .csv files are supported', 'danger');
    }
  };

  const handleImport = async (validateOnly: boolean) => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await importInventoryCsv(file, validateOnly);
      setResult(res);
      if (!validateOnly && res.successCount > 0) {
        addToast(`Successfully imported ${res.successCount} items`, 'success');
      }
      if (res.errorCount > 0) {
        addToast(`${res.errorCount} rows had errors`, 'danger');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to import CSV', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="CSV Import" />
      <main className={styles.content}>
        <Card title="Import Inventory Data">
          <div
            className={styles.uploadArea}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          >
            <input ref={inputRef} type="file" accept=".csv" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
            {file ? (
              <>
                <FileText size={32} className={styles.uploadIcon} />
                <div className={styles.uploadText}>{file.name}</div>
                <div className={styles.uploadHint}>{(file.size / 1024).toFixed(1)} KB</div>
              </>
            ) : (
              <>
                <Upload size={32} className={styles.uploadIcon} />
                <div className={styles.uploadText}>Drop a CSV file here or click to browse</div>
                <div className={styles.uploadHint}>Supports .csv files with inventory data</div>
              </>
            )}
          </div>

          {file && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button variant="ghost" size="md" onClick={() => handleImport(true)} disabled={loading}>
                Validate Only
              </Button>
              <Button variant="primary" size="md" onClick={() => handleImport(false)} disabled={loading}>
                {loading ? 'Processing...' : 'Import'}
              </Button>
            </div>
          )}
        </Card>

        {result && (
          <>
            <div className={styles.resultCards} style={{ marginTop: 16 }}>
              <div className={`${styles.resultCard} ${styles.resultCardDefault}`}>
                <div className={styles.resultValue}>{result.totalRows}</div>
                <div className={styles.resultLabel}>Total Rows</div>
              </div>
              <div className={`${styles.resultCard} ${styles.resultCardSuccess}`}>
                <div className={styles.resultValue}>{result.successCount}</div>
                <div className={styles.resultLabel}>Successful</div>
              </div>
              <div className={`${styles.resultCard} ${styles.resultCardError}`}>
                <div className={styles.resultValue}>{result.errorCount}</div>
                <div className={styles.resultLabel}>Errors</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <Card title="Import Errors" count={result.errors.length} noPadding>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Row</th><th>Field</th><th>Message</th></tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td className={styles.mono}>{e.row}</td>
                        <td className={styles.primary}>{e.field}</td>
                        <td>{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )}
        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </main>
    </>
  );
}

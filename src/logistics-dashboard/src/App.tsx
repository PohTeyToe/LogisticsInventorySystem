import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';

const Inventory = lazy(() => import('./pages/Inventory'));
const Categories = lazy(() => import('./pages/Categories'));
const Warehouses = lazy(() => import('./pages/Warehouses'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const StockMovements = lazy(() => import('./pages/StockMovements'));
const CsvImport = lazy(() => import('./pages/CsvImport'));
const Reports = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', fontSize: 13 }}>
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Suspense fallback={<PageLoader />}><Inventory /></Suspense>} />
            <Route path="/categories" element={<Suspense fallback={<PageLoader />}><Categories /></Suspense>} />
            <Route path="/warehouses" element={<Suspense fallback={<PageLoader />}><Warehouses /></Suspense>} />
            <Route path="/suppliers" element={<Suspense fallback={<PageLoader />}><Suppliers /></Suspense>} />
            <Route path="/purchase-orders" element={<Suspense fallback={<PageLoader />}><PurchaseOrders /></Suspense>} />
            <Route path="/stock-movements" element={<Suspense fallback={<PageLoader />}><StockMovements /></Suspense>} />
            <Route path="/import" element={<Suspense fallback={<PageLoader />}><CsvImport /></Suspense>} />
            <Route path="/reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
            <Route path="/analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
            <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/shared/ErrorBoundary';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Layout from './components/layout/Layout';
import { SignalRProvider } from './contexts/SignalRContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

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
const AuditLog = lazy(() => import('./pages/AuditLog'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', fontSize: 13 }}>
      Loading...
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SignalRProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route element={<Protected><Layout /></Protected>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Inventory /></Suspense></ErrorBoundary>} />
                <Route path="/categories" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Categories /></Suspense></ErrorBoundary>} />
                <Route path="/warehouses" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Warehouses /></Suspense></ErrorBoundary>} />
                <Route path="/suppliers" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Suppliers /></Suspense></ErrorBoundary>} />
                <Route path="/purchase-orders" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><PurchaseOrders /></Suspense></ErrorBoundary>} />
                <Route path="/stock-movements" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><StockMovements /></Suspense></ErrorBoundary>} />
                <Route path="/import" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><CsvImport /></Suspense></ErrorBoundary>} />
                <Route path="/reports" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Reports /></Suspense></ErrorBoundary>} />
                <Route path="/analytics" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Analytics /></Suspense></ErrorBoundary>} />
                <Route path="/settings" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><Settings /></Suspense></ErrorBoundary>} />
                <Route path="/audit-log" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AuditLog /></Suspense></ErrorBoundary>} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </SignalRProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

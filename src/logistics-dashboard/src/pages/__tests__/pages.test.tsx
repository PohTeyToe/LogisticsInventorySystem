import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ---- Mock all API modules ----

vi.mock('../../api/inventory', () => ({
  getInventory: vi.fn().mockResolvedValue({ items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 }),
  getInventoryItem: vi.fn().mockResolvedValue(null),
  createInventoryItem: vi.fn().mockResolvedValue({}),
  updateInventoryItem: vi.fn().mockResolvedValue({}),
  deleteInventoryItem: vi.fn().mockResolvedValue(undefined),
  getLowStockItems: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../api/categories', () => ({
  getCategories: vi.fn().mockResolvedValue([]),
  createCategory: vi.fn().mockResolvedValue({}),
  updateCategory: vi.fn().mockResolvedValue({}),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../api/warehouses', () => ({
  getWarehouses: vi.fn().mockResolvedValue([]),
  createWarehouse: vi.fn().mockResolvedValue({}),
  updateWarehouse: vi.fn().mockResolvedValue({}),
  deleteWarehouse: vi.fn().mockResolvedValue(undefined),
  getWarehouseUtilization: vi.fn().mockResolvedValue({}),
}))

vi.mock('../../api/suppliers', () => ({
  getSuppliers: vi.fn().mockResolvedValue([]),
  createSupplier: vi.fn().mockResolvedValue({}),
  updateSupplier: vi.fn().mockResolvedValue({}),
  deleteSupplier: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../api/purchaseOrders', () => ({
  getPurchaseOrders: vi.fn().mockResolvedValue([]),
  getPurchaseOrder: vi.fn().mockResolvedValue(null),
  createPurchaseOrder: vi.fn().mockResolvedValue({}),
  updatePurchaseOrderStatus: vi.fn().mockResolvedValue({}),
  deletePurchaseOrder: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../api/stockMovements', () => ({
  getStockMovements: vi.fn().mockResolvedValue([]),
  createStockMovement: vi.fn().mockResolvedValue({}),
  getItemMovementHistory: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../api/reports', () => ({
  getValuationReport: vi.fn().mockResolvedValue({
    totalItems: 0, totalValue: 0, categoryBreakdown: [], warehouseBreakdown: [],
  }),
  getLowStockReport: vi.fn().mockResolvedValue([]),
  getTotalValue: vi.fn().mockResolvedValue({ totalValue: 0 }),
}))

vi.mock('../../api/imports', () => ({
  importInventoryCsv: vi.fn().mockResolvedValue({ success: true, importedCount: 0, errors: [] }),
}))

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({}),
  },
  getTenantId: vi.fn().mockReturnValue('1'),
  setTenantId: vi.fn(),
}))

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  Treemap: () => null,
}))

// ---- Import pages ----

import Dashboard from '../Dashboard'
import Inventory from '../Inventory'
import Analytics from '../Analytics'
import Reports from '../Reports'
import Settings from '../Settings'
import Categories from '../Categories'
import Warehouses from '../Warehouses'
import Suppliers from '../Suppliers'
import PurchaseOrders from '../PurchaseOrders'
import StockMovements from '../StockMovements'

// ---- Helpers ----

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 } },
})

function renderInRouter(element: React.ReactElement, path = '/') {
  queryClient.clear()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Outlet context={{ onSearchClick: vi.fn(), onMenuClick: vi.fn() }} />}>
            <Route path="*" element={element} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// ---- Tests ----

describe('Page smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    // Mock fetch for Settings health check
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    // Mock performance.now for animated counter
    vi.stubGlobal('performance', { now: vi.fn().mockReturnValue(0) })
  })

  it('Dashboard renders without crashing', async () => {
    renderInRouter(<Dashboard />)
    expect(await screen.findByText('Operations Dashboard')).toBeInTheDocument()
  })

  it('Inventory renders without crashing', async () => {
    renderInRouter(<Inventory />)
    expect(await screen.findByText('Inventory Items')).toBeInTheDocument()
  })

  it('Analytics renders without crashing', async () => {
    renderInRouter(<Analytics />)
    expect(await screen.findByText('Analytics')).toBeInTheDocument()
  })

  it('Reports renders without crashing', async () => {
    renderInRouter(<Reports />)
    expect(await screen.findByText('Reports')).toBeInTheDocument()
  })

  it('Settings renders without crashing', async () => {
    renderInRouter(<Settings />)
    expect(await screen.findByText('Settings')).toBeInTheDocument()
  })

  it('Categories renders without crashing', async () => {
    renderInRouter(<Categories />)
    expect(await screen.findByText('Categories')).toBeInTheDocument()
  })

  it('Warehouses renders without crashing', async () => {
    renderInRouter(<Warehouses />)
    expect(await screen.findByText('Warehouses')).toBeInTheDocument()
  })

  it('Suppliers renders without crashing', async () => {
    renderInRouter(<Suppliers />)
    expect(await screen.findByText('Suppliers')).toBeInTheDocument()
  })

  it('PurchaseOrders renders without crashing', async () => {
    renderInRouter(<PurchaseOrders />)
    const headings = await screen.findAllByText('Purchase Orders')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('StockMovements renders without crashing', async () => {
    renderInRouter(<StockMovements />)
    expect(await screen.findByText('Stock Movements')).toBeInTheDocument()
  })
})

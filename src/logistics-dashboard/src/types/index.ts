// API Response types matching the .NET DTOs

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  location: string | null;
  unitPrice: number;
  categoryId: number;
  categoryName: string;
  warehouseId: number;
  warehouseName: string;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
  lotNumber: string | null;
  serialNumber: string | null;
  expiryDate: string | null;
  unitOfMeasure: string | null;
  warehouseZone: string | null;
  currencyCode: string | null;
}

export interface CreateInventoryItemRequest {
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  location?: string;
  unitPrice: number;
  categoryId: number;
  warehouseId: number;
  reorderLevel: number;
  lotNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  unitOfMeasure?: string;
  warehouseZone?: string;
  currencyCode?: string;
}

export interface UpdateInventoryItemRequest {
  sku?: string;
  name?: string;
  description?: string;
  quantity?: number;
  location?: string;
  unitPrice?: number;
  categoryId?: number;
  warehouseId?: number;
  reorderLevel?: number;
  lotNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  unitOfMeasure?: string;
  warehouseZone?: string;
  currencyCode?: string;
}

export interface LowStockAlert {
  itemId: number;
  sku: string;
  name: string;
  currentQuantity: number;
  reorderLevel: number;
  warehouseName: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  itemCount: number;
}

export interface Warehouse {
  id: number;
  name: string;
  address: string;
  capacity: number;
  isActive: boolean;
  itemCount: number;
  utilizationPercentage: number;
}

export interface WarehouseUtilization {
  warehouseId: number;
  warehouseName: string;
  capacity: number;
  currentCount: number;
  utilizationPercentage: number;
  uniqueSkus: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactEmail: string;
  phone: string;
  address: string;
  activeOrderCount: number;
}

export interface SupplierPerformance {
  totalOrders: number;
  completedOrders: number;
  onTimeDeliveryRate: number;
  averageLeadTimeDays: number;
  totalSpend: number;
}

export type PurchaseOrderStatus = 'Pending' | 'Approved' | 'Shipped' | 'Received' | 'Cancelled';

export interface PurchaseOrder {
  id: number;
  supplierName: string;
  orderDate: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  inventoryItemId?: number;
  itemName: string;
  itemSKU: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockMovement {
  id: number;
  itemName: string;
  itemSku: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  timestamp: string;
  movementReasonCode: string | null;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ValuationReport {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  categoryBreakdown: CategoryValuation[];
  warehouseBreakdown: WarehouseValuation[];
}

export interface CategoryValuation {
  categoryName: string;
  itemCount: number;
  totalValue: number;
}

export interface WarehouseValuation {
  warehouseName: string;
  itemCount: number;
  totalValue: number;
}

export type AuditAction = 'Create' | 'Update' | 'Delete';

export interface AuditLogEntry {
  id: number;
  entityType: string;
  entityId: number;
  action: AuditAction;
  changes: string | null;
  userId: string | null;
  timestamp: string;
  tenantId: number;
}

export interface PaginatedAuditLogResponse {
  items: AuditLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

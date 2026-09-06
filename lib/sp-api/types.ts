export interface RecentOrder {
  orderId: string;
  purchaseDate: string;
  status: string;
  total: number;
  currency: string;
  itemsShipped: number;
  itemsUnshipped: number;
}

export interface SalesMetricPoint {
  date: string;
  revenue: number;
  currency: string;
  orderCount: number;
  unitCount: number;
}

export interface InventoryItem {
  sku: string;
  asin: string;
  fulfillable: number;
  totalQuantity: number;
}

export interface ReturnRecord {
  returnDate: string;
  orderId: string;
  sku: string;
  quantity: number;
  reason: string;
}

export interface FinanceSummary {
  revenue: number;
  fees: number;
  net: number;
  currency: string;
  eventCount: number;
}

export interface FeedbackSummary {
  available: boolean;
  positiveCount?: number;
  neutralCount?: number;
  negativeCount?: number;
  message?: string;
}

export interface DashboardData {
  orders: { data: RecentOrder[]; error?: string };
  sales: { data: SalesMetricPoint[]; error?: string };
  inventory: { data: InventoryItem[]; error?: string };
  returns: { data: ReturnRecord[]; error?: string };
  finance: { data: FinanceSummary | null; error?: string };
  feedback: { data: FeedbackSummary | null; error?: string };
  authRevoked: boolean;
}

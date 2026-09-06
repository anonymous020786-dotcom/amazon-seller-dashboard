import {
  getRecentOrders,
  getSalesMetrics,
  getInventorySummary,
  getReturnsReport,
  getFinancialSummary,
  getFeedbackSummary,
} from "./domains";
import type { SellerContext } from "./domains";
import { isAuthRevokedError } from "./errors";
import type { DashboardData } from "./types";

async function settle<T>(promise: Promise<T>): Promise<{ data: T | null; error?: string; authRevoked?: boolean }> {
  try {
    return { data: await promise };
  } catch (err) {
    if (isAuthRevokedError(err)) {
      return { data: null, error: "This seller revoked the app's authorization.", authRevoked: true };
    }
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function loadDashboardData(seller: SellerContext): Promise<DashboardData> {
  const [orders, sales, inventory, returns, finance, feedback] = await Promise.all([
    settle(getRecentOrders(seller, 7)),
    settle(getSalesMetrics(seller, 30)),
    settle(getInventorySummary(seller)),
    settle(getReturnsReport(seller, 30)),
    settle(getFinancialSummary(seller, 7)),
    settle(getFeedbackSummary(seller)),
  ]);

  const authRevoked = [orders, sales, inventory, returns, finance, feedback].some((r) => r.authRevoked);

  return {
    orders: { data: orders.data ?? [], error: orders.error },
    sales: { data: sales.data ?? [], error: sales.error },
    inventory: { data: inventory.data ?? [], error: inventory.error },
    returns: { data: returns.data ?? [], error: returns.error },
    finance: { data: finance.data, error: finance.error },
    feedback: { data: feedback.data, error: feedback.error },
    authRevoked,
  };
}

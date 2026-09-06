import { getSpApiClient } from "./client";
import type { SellerContext } from "./domains";

// Best-effort: App Integrations (2024-04-01) is a newer API and the installed
// amazon-sp-api package only defines its path/method, not its body schema, so
// this payload shape is based on Amazon's public documentation rather than
// verified types. Verify against the live API reference if this starts failing.
export async function sendLowStockNotification(seller: SellerContext, sku: string): Promise<void> {
  const client = getSpApiClient(seller.refreshToken);
  await client.callAPI({
    operation: "appIntegrations.createNotification",
    body: {
      marketplaceId: seller.marketplaceId,
      notificationTexts: [
        {
          value: `Low stock alert: ${sku} is running low on fulfillable inventory.`,
          locale: "en-US",
        },
      ],
      attributes: {
        mainButtonText: "View inventory",
      },
    },
    options: { version: "2024-04-01" },
  });
}

import { SellingPartner } from "amazon-sp-api";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getRegion(): "eu" | "na" | "fe" {
  return (process.env.SP_API_REGION || "eu") as "eu" | "na" | "fe";
}

function getAppCredentials() {
  return {
    SELLING_PARTNER_APP_CLIENT_ID: requiredEnv("SP_API_CLIENT_ID"),
    SELLING_PARTNER_APP_CLIENT_SECRET: requiredEnv("SP_API_CLIENT_SECRET"),
  };
}

function sandboxEnabled(): boolean {
  return process.env.SP_API_USE_SANDBOX === "true";
}

// A client authorized for a specific connected seller's refresh token.
export function getSpApiClient(refreshToken: string): SellingPartner {
  return new SellingPartner({
    region: getRegion(),
    refresh_token: refreshToken,
    credentials: getAppCredentials(),
    options: { use_sandbox: sandboxEnabled() },
  });
}

// A grantless client, used only to exchange an OAuth authorization code for a
// seller's refresh token (no seller-specific token exists yet at that point).
export function getGrantlessClient(): SellingPartner {
  return new SellingPartner({
    region: getRegion(),
    credentials: getAppCredentials(),
    options: { only_grantless_operations: true, use_sandbox: sandboxEnabled() },
  });
}

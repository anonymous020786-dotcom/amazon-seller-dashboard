// The amazon-sp-api package throws a CustomError whose `code` mirrors either
// Amazon's LWA OAuth error code (token refresh) or the SP-API error code
// (regular calls). A revoked/expired refresh token surfaces as one of these —
// the seller de-authorized the app in Seller Central, so no retry will help.
const AUTH_REVOKED_CODES = new Set(["invalid_grant", "unauthorized_client", "invalid_client"]);

export function isAuthRevokedError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" && AUTH_REVOKED_CODES.has(code);
}

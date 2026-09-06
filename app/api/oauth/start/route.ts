import { NextResponse } from "next/server";
import { createState } from "@/lib/oauth/state";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export async function GET() {
  const applicationId = requiredEnv("SP_API_APPLICATION_ID");
  const authHost = process.env.SP_API_AUTH_HOST || "sellercentral.amazon.in";
  const state = createState();

  const url = new URL(`https://${authHost}/apps/authorize/consent`);
  url.searchParams.set("application_id", applicationId);
  url.searchParams.set("state", state);
  if (process.env.SP_API_APP_DRAFT === "true") {
    url.searchParams.set("version", "beta");
  }

  return NextResponse.redirect(url.toString());
}

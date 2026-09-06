import { redirect } from "next/navigation";
import { listSellers, getSeller, type Seller, type SellerWithToken } from "./store";

export function resolveActiveSeller(requestedId: string | undefined): {
  sellers: Seller[];
  seller: SellerWithToken;
  activeId: string;
} {
  const sellers = listSellers();
  if (sellers.length === 0) {
    redirect("/dashboard/sellers");
  }

  const activeId = requestedId && sellers.some((s) => s.id === requestedId) ? requestedId : sellers[0].id;
  const seller = getSeller(activeId);
  if (!seller) {
    redirect("/dashboard/sellers");
  }

  return { sellers, seller, activeId };
}

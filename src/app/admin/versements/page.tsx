"use client";

import { AdminFrame } from "@/components/admin/AdminFrame";
import { PayoutsSection } from "@/components/admin/PayoutsSection";

export default function PayoutsPage() {
  return <AdminFrame permission="payouts.manage">{() => <PayoutsSection />}</AdminFrame>;
}

"use client";

import { AdminFrame } from "@/components/admin/AdminFrame";
import { RefundsSection } from "@/components/admin/RefundsSection";

export default function RefundsPage() {
  return <AdminFrame permission="payouts.manage">{() => <RefundsSection />}</AdminFrame>;
}

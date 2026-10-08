"use client";

import { AdminFrame } from "@/components/admin/AdminFrame";
import { DisputesSection } from "@/components/admin/DisputesSection";

export default function DisputesPage() {
  return <AdminFrame permission="disputes.view">{() => <DisputesSection />}</AdminFrame>;
}

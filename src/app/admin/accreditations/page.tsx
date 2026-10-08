"use client";

import { AdminFrame } from "@/components/admin/AdminFrame";
import { KycSection } from "@/components/admin/KycSection";

export default function AccreditationsPage() {
  return <AdminFrame permission="kyc.review">{() => <KycSection />}</AdminFrame>;
}

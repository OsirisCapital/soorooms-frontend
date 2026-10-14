"use client";

import { AdminFrame } from "@/components/admin/AdminFrame";
import { PartnersSection } from "@/components/admin/PartnersSection";

export default function PartnersPage() {
  return <AdminFrame permission="partners.manage">{() => <PartnersSection />}</AdminFrame>;
}

"use client";

import { AdminFrame } from "@/components/admin/AdminFrame";
import { FinanceReportView } from "@/components/finance/FinanceReportView";
import { getAdminFinanceReport } from "@/lib/finance-api";

export default function AdminFinancePage() {
  return <AdminFrame permission="payments.view">{() => <FinanceReportView mode="admin" load={getAdminFinanceReport} />}</AdminFrame>;
}

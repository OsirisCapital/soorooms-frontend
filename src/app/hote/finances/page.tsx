"use client";

import { AppShell } from "@/components/AppShell";
import { FinanceReportView } from "@/components/finance/FinanceReportView";
import { getHostFinanceReport } from "@/lib/finance-api";

export default function HostFinancePage() {
  return (
    <AppShell title="Mes revenus" backHref="/hote">
      <FinanceReportView mode="host" load={getHostFinanceReport} />
    </AppShell>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company } from "@/types/database";
import { Activity, CheckCircle, XCircle } from "lucide-react";

export function StatsOverview({ data }: { data: Company[] }) {
  const total = data.length;
  const qualified = data.filter((c) => c.status === "QUALIFIED").length;
  const disqualified = data.filter((c) => c.status === "DISQUALIFIED").length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-0">
          <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total Scanned</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-[10px] text-muted-foreground">Companies found</p>
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-0">
          <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Qualified Leads</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <div className="text-2xl font-bold">{qualified}</div>
          <p className="text-[10px] text-muted-foreground">Ready for outreach</p>
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-0">
          <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Disqualified</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <div className="text-2xl font-bold">{disqualified}</div>
          <p className="text-[10px] text-muted-foreground">Low potential</p>
        </CardContent>
      </Card>
    </div>
  );
}
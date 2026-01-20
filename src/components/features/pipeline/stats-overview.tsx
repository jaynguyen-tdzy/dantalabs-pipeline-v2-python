import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company } from "@/types/database";
import { Activity, CheckCircle, XCircle } from "lucide-react";

export function StatsOverview({ data }: { data: Company[] }) {
  const total = data.length;
  const qualified = data.filter((c) => c.status === "QUALIFIED").length;
  const disqualified = data.filter((c) => c.status === "DISQUALIFIED").length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Scanned</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">Companies found</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{qualified}</div>
          <p className="text-xs text-muted-foreground">Ready for outreach</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disqualified</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{disqualified}</div>
          <p className="text-xs text-muted-foreground">Low potential</p>
        </CardContent>
      </Card>
    </div>
  );
}
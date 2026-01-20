import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Company } from "@/types/database";
import { ExternalLink, Lock, Unlock, Gauge, ArrowRight } from "lucide-react";
import Link from "next/link"; // Added Link for navigation

export function CompanyTable({ data }: { data: Company[] }) {
  // Helper: Status Color Logic (Thêm text-white để nổi bật trên nền màu)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "QUALIFIED": return "bg-green-500 hover:bg-green-600 text-white";
      case "DISQUALIFIED": return "bg-red-500 hover:bg-red-600 text-white";
      case "CUSTOMER": return "bg-blue-500 hover:bg-blue-600 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  // Helper: PageSpeed Score Color Logic (Đổi gray sang black, thêm font-bold)
  const getScoreColor = (score: number | null) => {
    if (!score) return "text-black"; 
    if (score < 50) return "text-red-600 font-bold"; // Slow -> Red
    if (score < 90) return "text-yellow-600 font-bold"; // Average -> Yellow
    return "text-green-600 font-bold"; // Fast -> Green
  };

  return (
    <div className="rounded-md border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {/* Cập nhật Header sang màu đen đậm */}
            <TableHead className="text-black font-bold">Company Name</TableHead>
            <TableHead className="text-black font-bold">Website Audit</TableHead>
            <TableHead className="text-black font-bold">Performance</TableHead>
            <TableHead className="text-black font-bold">Status</TableHead>
            <TableHead className="text-right text-black font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((company) => (
            <TableRow key={company.id}>
              {/* Column 1: Name & Website */}
              <TableCell className="font-medium text-black">
                <div className="text-base font-bold">{company.name}</div>
                {company.website_url && (
                  <a 
                    href={company.website_url} 
                    target="_blank" 
                    // Đổi sang màu xanh đậm hơn và in đậm
                    className="text-xs text-blue-700 flex items-center gap-1 hover:underline font-semibold"
                  >
                    {company.website_url} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </TableCell>

              {/* Column 2: SSL & Audit Badge */}
              <TableCell>
                <div className="flex items-center gap-2">
                  {company.has_ssl ? (
                    <Badge variant="outline" className="border-green-600 bg-green-50 text-green-700 gap-1 font-bold">
                      <Lock className="h-3 w-3" /> Secure
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 font-bold">
                      <Unlock className="h-3 w-3" /> No SSL
                    </Badge>
                  )}
                </div>
              </TableCell>

              {/* Column 3: PageSpeed Score */}
              <TableCell>
                <div className={`flex items-center gap-1 text-base ${getScoreColor(company.pagespeed_score)}`}>
                  <Gauge className="h-4 w-4" />
                  <span>{company.pagespeed_score ?? "N/A"}/100</span>
                </div>
              </TableCell>

              {/* Column 4: Status */}
              <TableCell>
                <Badge className={`${getStatusColor(company.status)} font-bold`}>
                  {company.status}
                </Badge>
              </TableCell>

              {/* Column 5: Actions (Details Button) */}
              <TableCell className="text-right">
                <Link href={`/companies/${company.id}`}>
                  <Button variant="ghost" size="sm" className="gap-2 text-black hover:text-black hover:bg-gray-100 font-semibold">
                    Details <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company, Contact } from "@/types/database";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";

interface PipelineAnalyticsProps {
  companies: Company[];
  contacts: Contact[];
}

export function PipelineAnalytics({ companies, contacts }: PipelineAnalyticsProps) {

  // 1. Tính toán số liệu cho Phễu chuyển đổi (Funnel)
  const totalScanned = companies.length;
  const totalQualified = companies.filter(c => c.status === 'QUALIFIED').length;
  // Đếm số công ty đã được liên hệ (dựa trên contact status = CONTACTED)
  // Logic: Lấy danh sách ID công ty từ các contact đã liên hệ -> Deduplicate
  const contactedCompanyIds = new Set(
    contacts.filter(c => c.status === 'CONTACTED').map(c => c.company_id)
  );
  const totalContacted = contactedCompanyIds.size;

  const funnelData = [
    { name: "Scanned", value: totalScanned, fill: "#94a3b8" }, // Slate 400
    { name: "Qualified", value: totalQualified, fill: "#16a34a" }, // Green 600
    { name: "Contacted", value: totalContacted, fill: "#2563eb" }, // Blue 600
  ];

  // 2. Tính toán tỷ lệ chất lượng (Pie Chart)
  const qualifiedCount = companies.filter(c => c.status === 'QUALIFIED').length;
  const disqualifiedCount = companies.filter(c => c.status === 'DISQUALIFIED').length;
  const newCount = companies.filter(c => c.status === 'NEW' || c.status === 'PROCESSING').length;

  const qualityData = [
    { name: "Qualified", value: qualifiedCount, color: "#16a34a" },
    { name: "Disqualified", value: disqualifiedCount, color: "#dc2626" },
    { name: "New/Processing", value: newCount, color: "#94a3b8" },
  ].filter(item => item.value > 0); // Chỉ hiện cái nào có dữ liệu

  return (
    <div className="grid gap-4 md:grid-cols-2">

      {/* BIỂU ĐỒ 1: SALES FUNNEL (PHỄU) */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-semibold">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] p-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" fontSize={10} />
              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* BIỂU ĐỒ 2: LEAD QUALITY (TRÒN) */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-semibold">Lead Quality Ratio</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] p-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={qualityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {qualityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
}
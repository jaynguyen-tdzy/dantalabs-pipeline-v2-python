"use client";

import { useState } from "react";
import { Company, Contact } from "@/types/database";
import { StatsOverview } from "@/components/features/pipeline/stats-overview";
import { CompanyTable } from "@/components/features/pipeline/company-table";
import { PipelineAnalytics } from "@/components/features/pipeline/pipeline-analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface DashboardViewProps {
  initialCompanies: Company[];
  contacts: Contact[];
}

export function DashboardView({ initialCompanies, contacts }: DashboardViewProps) {
  // 1. State quản lý từ khóa đang chọn
  const [selectedCampaign, setSelectedCampaign] = useState<string>("All");

  // 2. Lấy danh sách các Keyword duy nhất
  const allKeywords = Array.from(new Set(initialCompanies.map(c => c.search_keyword || c.industry || "Uncategorized")));

  // Sắp xếp keyword mới nhất lên đầu
  allKeywords.sort((a, b) => {
    const lastDateA = initialCompanies.find(c => (c.search_keyword || c.industry || "Uncategorized") === a)?.created_at || "";
    const lastDateB = initialCompanies.find(c => (c.search_keyword || c.industry || "Uncategorized") === b)?.created_at || "";
    return lastDateB.localeCompare(lastDateA);
  });

  // 3. Logic Lọc dữ liệu
  const filteredCompanies = selectedCampaign === "All"
    ? initialCompanies
    : initialCompanies.filter(c => (c.search_keyword || c.industry || "Uncategorized") === selectedCampaign);

  return (
    <div className="space-y-4">

      {/* KHU VỰC BỘ LỌC (DROPDOWN) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            Campaign Filter
          </h2>
          <p className="text-xs text-slate-500">Select a campaign to view specific performance.</p>
        </div>

        {/* DROPDOWN CHỌN CAMPAIGN */}
        <div className="w-full sm:w-[250px]">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-full h-8 text-xs font-semibold text-black border-slate-300 bg-white">
              <SelectValue placeholder="Select Campaign" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="All" className="font-bold cursor-pointer text-xs">All Campaigns</SelectItem>
              {allKeywords.map((keyword) => (
                <SelectItem key={keyword} value={keyword} className="cursor-pointer capitalize text-xs">
                  {keyword}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Hiển thị Stats theo dữ liệu đã lọc */}
      {/* Khi chọn Campaign, số liệu thống kê sẽ thay đổi theo */}
      <StatsOverview data={filteredCompanies} />

      {/* 5. Hiển thị Biểu đồ theo dữ liệu đã lọc */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">Performance Analytics</h2>
        <PipelineAnalytics companies={filteredCompanies} contacts={contacts} />
      </div>

      {/* 6. Hiển thị Bảng theo dữ liệu đã lọc */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">
          {selectedCampaign === "All" ? "All Recent Companies" : `Results for: ${selectedCampaign}`}
        </h2>
        <CompanyTable data={filteredCompanies} />
      </div>

    </div>
  );
}
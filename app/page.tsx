import { supabase } from "@/lib/supabase/client";
import { ScanDialog } from "@/components/features/pipeline/scan-dialog";
// Import Component Client View mới (chứa Dropdown và logic lọc)
import { DashboardView } from "@/components/features/pipeline/dashboard-view";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  console.log("🚀 Dashboard: Fetching data from Supabase...");

  // 1. Gọi dữ liệu Companies (Công ty)
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  // 2. Gọi dữ liệu Contacts (Người liên hệ)
  const { data: contacts, error: contactError } = await supabase
    .from('contacts')
    .select('*');

  // Kiểm tra lỗi khi gọi dữ liệu
  if (companyError || contactError) {
    console.error("❌ Data Error:", companyError || contactError);
    return (
        <div className="p-8 text-red-500">
            Error loading data. Check console for details.
            <br />
            {companyError?.message || contactError?.message}
        </div>
    );
  }

  // Ép kiểu any tạm thời cho danh sách công ty để tránh lỗi type với trường 'search_keyword'
  // (Phòng trường hợp bạn chưa kịp update file types/database.ts)
  const typedCompanies = (companies || []) as any[]; 
  const typedContacts = (contacts || []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header: Tiêu đề và Nút Scan */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sales Pipeline</h1>
            <p className="text-slate-500">Automated Lead Generation & Qualification System</p>
          </div>
          <ScanDialog />
        </div>

        {/* Gọi Component DashboardView */}
        {/* Component này sẽ hiển thị Dropdown, Biểu đồ, và Bảng dữ liệu có tương tác */}
        <DashboardView initialCompanies={typedCompanies} contacts={typedContacts} />

      </div>
    </div>
  );
}
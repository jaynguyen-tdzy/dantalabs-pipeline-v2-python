export type CompanyStatus = 'NEW' | 'PROCESSING' | 'QUALIFIED' | 'DISQUALIFIED' | 'CUSTOMER';

export interface Company {
  id: string;
  created_at: string;
  name: string;
  website_url: string | null;
  google_maps_url: string | null;
  industry: string | null;
  
  // Thông tin kỹ thuật cũ
  has_ssl: boolean;
  pagespeed_score: number | null;
  
  // --- CÁC TRƯỜNG MỚI ---
  address: string | null;
  company_type: string | null;
  employee_count: string | null;
  revenue_range: string | null;
  is_wordpress: boolean;
  search_keyword?: string
  crm_system: string | null;
  // ----------------------

  status: CompanyStatus;
  disqualify_reason: string | null;
}
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

  // Scraper Data
  emails?: string[];
  socials?: Record<string, string>;
  description?: string;

  status: CompanyStatus;
  disqualify_reason: string | null;
}

export interface Contact {
  id: string;
  company_id: string;
  full_name: string;
  position: string;
  linkedin_url: string | null;
  email: string | null;
  is_primary_decision_maker: boolean;
  status?: string;
}
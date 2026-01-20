import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// In ra Terminal để kiểm tra xem máy có nhận được key không
console.log("Supabase URL:", supabaseUrl ? "Đã nhận" : "❌ Bị thiếu");
console.log("Supabase Key:", supabaseAnonKey ? "Đã nhận" : "❌ Bị thiếu");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Thiếu biến môi trường Supabase! Hãy kiểm tra file .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
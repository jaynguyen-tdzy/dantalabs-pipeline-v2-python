"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface EnrichButtonProps {
  companyId: string;
  companyName: string;
}

export function EnrichButton({ companyId, companyName }: EnrichButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnrich = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        body: JSON.stringify({ companyId, companyName }),
      });

      const data = await res.json();

      if (data.success) {
        // Refresh lại trang để hiện danh sách mới
        router.refresh();
      } else {
        alert("Không tìm thấy ai hoặc lỗi: " + (data.message || data.error));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
        onClick={handleEnrich} 
        disabled={loading}
        className="bg-black text-white hover:bg-gray-800 font-bold"
    >
      {loading ? (
        <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
        </>
      ) : (
        <>
            <UserPlus className="mr-2 h-4 w-4" /> Find Decision Makers
        </>
      )}
    </Button>
  );
}
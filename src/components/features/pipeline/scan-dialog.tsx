"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
// import { toast } from "sonner" // Để dành dùng sau

export function ScanDialog() {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleScan = async () => {
    if (!keyword) return;

    setLoading(true);
    try {
      // Gọi API scan chúng ta vừa tạo
      const res = await fetch("/api/scan", {
        method: "POST",
        body: JSON.stringify({ keyword }),
      });

      if (res.ok) {
        setOpen(false);
        setKeyword("");
        router.refresh(); // Tự động load lại dữ liệu mới
      } else {
        console.error("Scan failed");
      }
    } catch (error) {
      console.error("Scan error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black text-white hover:bg-slate-800">
          + Start New Scan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scan New Leads</DialogTitle>
          <DialogDescription>
            Enter a keyword or industry to search on Google Maps.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="keyword" className="text-right">
              Keyword
            </Label>
            <Input
              id="keyword"
              placeholder="e.g. Real Estate in Hanoi"
              className="col-span-3"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleScan} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Scanning..." : "Start Scan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
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
  // States cho error/suggestion
  const [message, setMessage] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const router = useRouter();

  const handleScan = async () => {
    if (!keyword) return;

    setLoading(true);
    setMessage(null);
    setSuggestion(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: JSON.stringify({ keyword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOpen(false);
        setKeyword("");
        router.refresh();

        // Notification for fallback
        if (data.is_fallback) {
          alert(`Note: Your specific search yielded 0 results. System auto-switched to broad keyword: "${data.fallback_keyword}" and found ${data.count} companies.`);
        }
      } else {
        // Backend trả về OK nhưng success=false (do logic filter/no results)
        // hoặc lỗi 500
        console.error("Scan failed", data);
        setMessage(data.message || "Something went wrong.");
        if (data.suggestion) {
          setSuggestion(data.suggestion);
        }
      }
    } catch (error) {
      console.error("Scan error", error);
      setMessage("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      setKeyword(suggestion);
      setSuggestion(null);
      setMessage(null);
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

          {/* Display Messages & Suggestions */}
          {message && (
            <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
              <div>{message}</div>
              {suggestion && (
                <div className="mt-2">
                  <span className="font-semibold">Suggestion: </span>
                  <button
                    onClick={applySuggestion}
                    className="underline hover:text-yellow-900 font-bold"
                  >
                    Use "{suggestion}"
                  </button>
                </div>
              )}
            </div>
          )}

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
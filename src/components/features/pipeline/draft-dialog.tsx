"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Copy, Check, Send, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface DraftDialogProps {
  contact: any;
  company: any;
  industry?: string;
}

export function DraftDialog({ contact, company, industry }: DraftDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        body: JSON.stringify({
          contactName: contact.full_name,
          position: contact.position,
          companyName: company.name,
          website: company.website_url,
          industry: industry,
          hasSSL: company.has_ssl,
          pageSpeed: company.pagespeed_score,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const bodyWithFooter = `${data.data.body}\n\nVisit our website for more informations: https://dantalabs.com/`;
        
        setDraft({ 
            subject: data.data.subject, 
            body: bodyWithFooter 
        });
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate draft");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    const fullMessage = `Subject: ${draft.subject}\n\n${draft.body}`;
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkAsSent = async () => {
    try {
      const res = await fetch("/api/contacts/update-status", {
        method: "POST",
        body: JSON.stringify({ 
            id: contact.id, 
            status: 'CONTACTED' 
        }),
      });

      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
            variant="default"
            size="sm" 
            className={`gap-2 font-bold ${contact.status === 'CONTACTED' 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "bg-black text-white hover:bg-gray-800"}`}
        >
          {contact.status === 'CONTACTED' ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3 text-yellow-400" />}
          {contact.status === 'CONTACTED' ? "Sent" : "Draft AI Msg"}
        </Button>
      </DialogTrigger>
      
      {/* CẬP NHẬT UI:
          1. bg-black text-white: Nền đen chữ trắng
          2. border-zinc-800: Viền màu xám tối để hòa hợp
      */}
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col bg-black text-white border-zinc-800 shadow-2xl p-0 gap-0">
        
        {/* Header */}
        <div className="p-6 pb-2">
            <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">AI Outreach Generator (Gemini Flash)</DialogTitle>
            <DialogDescription className="text-zinc-400">
                Personalized message for <span className="text-white font-medium">{contact.full_name}</span> ({contact.position})
            </DialogDescription>
            </DialogHeader>
        </div>

        {/* NỘI DUNG CHÍNH:
            - Ẩn thanh cuộn
            - Màu nền đen
        */}
        <div className="px-6 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {!draft ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
                <Sparkles className="h-12 w-12 text-yellow-500 mb-4 animate-pulse" />
                <p className="mb-6 text-zinc-400 max-w-sm">
                Generate a high-converting cold message based on Danta Labs products & industry research.
                </p>
                {/* Nút Generate trên nền đen */}
                <Button onClick={handleGenerate} disabled={loading} className="bg-white text-black hover:bg-zinc-200 font-bold px-8">
                {loading ? "Writing magic..." : "Generate Message"}
                </Button>
            </div>
            ) : (
            <div className="space-y-6 py-2">
                <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wide">Subject Line</label>
                <Input 
                    value={draft.subject} 
                    onChange={(e) => setDraft({...draft, subject: e.target.value})} 
                    // Input tối màu
                    className="font-bold text-lg border-2 border-zinc-800 bg-zinc-900 text-white focus:border-white h-12"
                />
                </div>
                <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wide">Email Body</label>
                <Textarea 
                    value={draft.body} 
                    onChange={(e) => setDraft({...draft, body: e.target.value})} 
                    // Textarea tối màu
                    className="min-h-[400px] border-2 border-zinc-800 bg-zinc-900 text-white focus:border-white font-mono text-sm leading-relaxed resize-y p-4"
                />
                </div>
            </div>
            )}
        </div>

        {/* FOOTER:
            - bg-black: Nền đen (sửa lỗi mảng trắng)
            - sticky bottom-0: Luôn hiển thị
        */}
        {draft && (
          <DialogFooter className="p-6 pt-4 border-t border-zinc-800 bg-black sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 sm:justify-between items-center">
            {/* Nút Reset dễ nhìn trên nền đen */}
            <Button 
                variant="outline" 
                onClick={() => setDraft(null)} 
                className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white font-bold gap-2 w-full sm:w-auto"
            >
                <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            
            <div className="flex gap-3 w-full sm:w-auto">
                {/* NÚT COPY: MÀU TRẮNG NHƯ YÊU CẦU */}
                <Button 
                    onClick={handleCopy} 
                    variant="outline" 
                    className="border-white text-white hover:bg-white hover:text-black font-bold w-full sm:w-auto transition-all"
                >
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
                </Button>

                <Button 
                    onClick={handleMarkAsSent} 
                    className="bg-green-600 text-white hover:bg-green-700 font-bold w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
                >
                    <Send className="mr-2 h-4 w-4" /> Mark as Sent
                </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
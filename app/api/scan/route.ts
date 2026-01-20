import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pythonUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    console.log(`🚀 Proxying SCAN to Python: ${pythonUrl}/scan`);

    const res = await fetch(`${pythonUrl}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    // Nếu Python trả lỗi, trả lỗi về Frontend
    if (!res.ok) {
        console.error("❌ Python Error:", data);
        return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("🔥 Proxy Error:", error);
    return NextResponse.json({ success: false, error: "Cannot connect to Python Backend" }, { status: 500 });
  }
}
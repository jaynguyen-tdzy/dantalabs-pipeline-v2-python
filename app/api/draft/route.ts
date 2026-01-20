import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pythonUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    console.log(`🚀 Proxying DRAFT to Python: ${pythonUrl}/draft`);

    const res = await fetch(`${pythonUrl}/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Cannot connect to Python Backend" }, { status: 500 });
  }
}
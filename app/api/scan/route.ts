import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let pythonUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Ensure absolute URL for server-side fetch (Vercel fix)
    if (pythonUrl.startsWith("/")) {
      const host = request.headers.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      pythonUrl = `${protocol}://${host}${pythonUrl}`;
    }

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

    return NextResponse.json(data);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("🔥 Proxy Error:", error);
    return NextResponse.json({ success: false, error: "Cannot connect to Python Backend" }, { status: 500 });
  }
}
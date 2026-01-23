import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let pythonUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Fix: Ensure absolute URL using VERCEL_URL if available
    if (process.env.VERCEL_URL) {
      pythonUrl = `https://${process.env.VERCEL_URL}/api/python`;
    } else if (pythonUrl.startsWith("/")) {
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

    // Read text first to debug empty/invalid JSON responses
    const responseText = await res.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ Failed to parse JSON:", responseText);
      throw new Error(`Invalid JSON response from Backend: ${responseText.slice(0, 100)}... (Status: ${res.status})`);
    }

    // Nếu Python trả lỗi, trả lỗi về Frontend
    if (!res.ok) {
      console.error("❌ Python Error:", data);
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("🔥 Proxy Error:", error);
    return NextResponse.json(
      { success: false, error: `Proxy Error: ${error.message || error.toString()}`, details: error },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Trỏ thẳng sang Python Backend
    let pythonUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Fix: Ensure absolute URL using VERCEL_URL if available
    if (process.env.VERCEL_URL) {
      pythonUrl = `https://${process.env.VERCEL_URL}/api/python`;
    } else if (pythonUrl.startsWith("/")) {
      // Fallback for local or other environments
      const host = request.headers.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      pythonUrl = `${protocol}://${host}${pythonUrl}`;
    }

    console.log(`🚀 Proxying ENRICH to Python: ${pythonUrl}/enrich`);

    // Fix: Forward Cookies to bypass Vercel Authentication Protection
    const cookieHeader = request.headers.get("cookie") || "";

    const res = await fetch(`${pythonUrl}/enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader, // Forward cookies
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // Nếu Python trả về lỗi, Frontend cũng trả về lỗi để UI hiển thị
    if (!res.ok) {
      console.error("❌ Python Enrich Error:", data);
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("🔥 Proxy Error:", error);
    // Return ACTUAL error for debugging
    return NextResponse.json(
      { success: false, error: `Proxy Error: ${error.message || error.toString()}`, details: error },
      { status: 500 }
    );
  }
}
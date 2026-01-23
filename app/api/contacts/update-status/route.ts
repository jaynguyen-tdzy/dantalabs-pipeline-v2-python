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

    // Lưu ý: Endpoint bên Python là /contacts/update-status
    console.log(`🚀 Proxying UPDATE STATUS to Python: ${pythonUrl}/contacts/update-status`);

    // Fix: Forward Cookies to bypass Vercel Authentication Protection
    const cookieHeader = request.headers.get("cookie") || "";

    const res = await fetch(`${pythonUrl}/contacts/update-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader, // Forward cookies
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

    return NextResponse.json(data, { status: res.status });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Cannot connect to Python Backend" }, { status: 500 });
  }
}
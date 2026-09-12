import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8001/api";

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.path);
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.path);
}

async function handleProxy(request: Request, pathArray: string[]) {
  const path = pathArray.join("/");
  const url = new URL(request.url);
  const targetUrl = `${API_URL}/doador/${path}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set("Accept", "application/json");

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      fetchOptions.body = await request.text();
    }

    const res = await fetch(targetUrl, fetchOptions);
    const data = await res.text();
    
    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete("content-encoding"); // Let NextJS handle encoding

    return new NextResponse(data, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ message: "Erro ao comunicar com o servidor." }, { status: 502 });
  }
}

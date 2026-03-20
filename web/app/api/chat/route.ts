export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Forward the authorization header to maintain authentication
    const authHeader = req.headers.get('authorization');
    const cookieHeader = req.headers.get('cookie');

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authHeader) {
      headers["authorization"] = authHeader;
    }

    if (cookieHeader) {
      headers["cookie"] = cookieHeader;
    }

    const backendResponses = await fetch(
      `${process.env.BACKEND_API_URL}/chat`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        credentials: "include",
      }
    );

    return new Response(backendResponses.body, {
      status: backendResponses.status,
      headers: {
        "Content-Type":
          backendResponses.headers.get("Content-Type") || "text/plain",
      },
    });
  } catch (err) {
    console.error("Error in chat proxy: ", err);
    return new Response(JSON.stringify({ error: "Proxy request failed" }), {
      status: 500,
    });
  }
}

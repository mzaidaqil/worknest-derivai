const DEFAULT_BASE_URL = "https://hr-rag-1v1j.onrender.com";

function getApiBaseUrl() {
  return (
    process.env.CHATBOT_API_URL ||
    process.env.NEXT_PUBLIC_CHATBOT_API_URL ||
    DEFAULT_BASE_URL
  );
}

export async function POST(request) {
  const baseUrl = getApiBaseUrl();

  try {
    const body = await request.json();

    // Extract the user message from whichever field the frontend sends
    const message =
      body?.text ??
      body?.message ??
      body?.query ??
      body?.question ??
      body?.prompt ??
      body?.input ??
      "";

    // Build the payload to match the backend ChatRequest schema exactly:
    //   { user_id: string (required), text: string (required), region?: string | null }
    const payload = {
      user_id: body?.user_id || "user_123",
      text: message
    };

    // Forward optional region hint if provided
    if (body?.region) {
      payload.region = body.region;
    }

    console.log("[chat proxy] ->", baseUrl + "/chat", JSON.stringify(payload));

    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const responseBody = await response.text();

    console.log("[chat proxy] <-", response.status, responseBody.slice(0, 500));

    // If the backend returned a non-JSON error (e.g. plain "Internal Server Error"),
    // wrap it in a JSON envelope so the frontend can always parse the response.
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!response.ok && !isJson) {
      return new Response(
        JSON.stringify({
          error: responseBody || `Backend returned ${response.status} (likely raw HTML or empty)`,
          status: response.status
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": isJson ? "application/json" : contentType
      }
    });
  } catch (error) {
    console.error("[chat proxy] error:", error);
    return new Response(
      JSON.stringify({ error: "Proxy request failed: " + error.message }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

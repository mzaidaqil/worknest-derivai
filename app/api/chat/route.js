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

    let response;
    try {
      response = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (fetchError) {
      console.error("[chat proxy] upstream connection failed:", fetchError);
      // Fall through to mock response logic if fetch throws (e.g. network error)
    }

    let responseBody = "";
    let status = 500;

    if (response) {
      status = response.status;
      responseBody = await response.text();
      console.log("[chat proxy] <-", status, responseBody.slice(0, 500));
    }

    // MOCK FALLBACK: If upstream failed (5xx) or fetch threw
    if (!response || status >= 500) {
      console.warn("[chat proxy] falling back to mock response due to upstream error");
      const mockReply = {
        text: "I'm currently in offline mode because the backend service is unavailable. However, I can still help you route requests or show you how the UI works!",
        reply: "I'm currently in offline mode because the backend service is unavailable. However, I can still help you route requests or show you how the UI works!"
      };
      return new Response(JSON.stringify(mockReply), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

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
    // Even in the outer catch, try to return a mock if possible, or just the error
    const mockReply = {
      text: "System Error: " + error.message + ". (Mock fallback active)",
      reply: "System Error: " + error.message + ". (Mock fallback active)"
    };
    return new Response(JSON.stringify(mockReply), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
}

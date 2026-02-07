const DEFAULT_BASE_URL = "https://hr-rag-1v1j.onrender.com";

function getApiBaseUrl() {
  return (
    process.env.CHATBOT_API_URL ||
    process.env.NEXT_PUBLIC_CHATBOT_API_URL ||
    DEFAULT_BASE_URL
  );
}

export async function GET() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/healthz`, {
      cache: "no-store"
    });
    const contentType = response.headers.get("content-type") || "application/json";
    const payload = await response.text();

    return new Response(payload, {
      status: response.status,
      headers: {
        "Content-Type": contentType
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

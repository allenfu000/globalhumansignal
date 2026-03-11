const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS
  });
}

function getErrorMessage(data, fallbackMessage) {
  return (
    data?.error?.message ||
    data?.message ||
    fallbackMessage ||
    "Unknown error"
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      ...JSON_HEADERS,
      Allow: "POST, OPTIONS"
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env?.OPENAI_API_KEY) {
    return jsonResponse(
      {
        ok: false,
        error: "missing_openai_api_key",
        message: "OPENAI_API_KEY is not configured in Cloudflare Pages."
      },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        error: "invalid_json",
        message: "Request body must be valid JSON."
      },
      400
    );
  }

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return jsonResponse(
      {
        ok: false,
        error: "missing_message",
        message: "Field 'message' is required."
      },
      400
    );
  }

  const model = typeof body?.model === "string" && body.model.trim()
    ? body.model.trim()
    : "gpt-4o-mini";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), 30000);

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        input: message
      }),
      signal: controller.signal
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const code = data?.error?.code || "openai_error";
      const baseMessage = getErrorMessage(data, "OpenAI request failed.");

      if (code === "unsupported_country_region_territory") {
        return jsonResponse(
          {
            ok: false,
            error: code,
            message:
              "OpenAI blocked this request by region. Cloudflare egress location may be unsupported for this API key/org.",
            details: baseMessage,
            hint:
              "Route via a supported region/provider, or use an API endpoint/account allowed in your deployment region."
          },
          403
        );
      }

      return jsonResponse(
        {
          ok: false,
          error: code,
          message: baseMessage,
          upstream_status: upstream.status
        },
        upstream.status
      );
    }

    const text =
      data?.output_text ||
      data?.output?.[0]?.content?.[0]?.text ||
      "";

    return jsonResponse({
      ok: true,
      text,
      data
    });
  } catch (error) {
    if (String(error).includes("timeout")) {
      return jsonResponse(
        {
          ok: false,
          error: "upstream_timeout",
          message: "OpenAI request timed out."
        },
        504
      );
    }

    return jsonResponse(
      {
        ok: false,
        error: "internal_error",
        message: error?.message || "Unexpected server error."
      },
      500
    );
  } finally {
    clearTimeout(timeout);
  }
}
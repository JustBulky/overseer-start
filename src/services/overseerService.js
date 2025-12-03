function normalizeBaseUrl(url) {
  return url ? url.replace(/\/$/, "") : "";
}

function buildProxiedUrl(baseUrl, endpoint, useProxy, proxyUrl) {
  const target = `${normalizeBaseUrl(baseUrl)}${endpoint}`;
  const proxied = useProxy
    ? `${proxyUrl}${encodeURIComponent(target)}`
    : target;
  return { targetUrl: target, finalUrl: proxied };
}

export async function testConnection(settings) {
  const { overseerrUrl, overseerrApiKey, useProxy, proxyUrl } = settings;
  const { finalUrl, targetUrl } = buildProxiedUrl(
    overseerrUrl,
    "/api/v1/auth/me",
    useProxy,
    proxyUrl
  );

  try {
    const headers = { accept: "application/json" };
    if (overseerrApiKey) {
      headers.authorization = `Bearer ${overseerrApiKey}`;
    }

    const response = await fetch(finalUrl, { headers });
    if (!response.ok) {
      return {
        ok: false,
        message: `Failed (${response.status}). Check URL/API key.`,
        debugUrl: finalUrl,
      };
    }
    const data = await response.json();
    return {
      ok: true,
      message: `Connected as ${data?.email || "unknown user"}`,
      debugUrl: finalUrl,
    };
  } catch (error) {
    return { ok: false, message: error.message, debugUrl: finalUrl || targetUrl };
  }
}

export async function submitRequest(settings, toolPayload) {
  const { overseerrUrl, overseerrApiKey, useProxy, proxyUrl } = settings;
  const { finalUrl, targetUrl } = buildProxiedUrl(
    overseerrUrl,
    "/api/v1/request",
    useProxy,
    proxyUrl
  );

  const body = {
    mediaType: toolPayload.mediaType,
    mediaId: toolPayload.mediaId || 0,
    title: toolPayload.title,
  };

  if (toolPayload.mediaType === "tv") {
    body.seasons = Array.isArray(toolPayload.seasons)
      ? toolPayload.seasons
      : [];
  }

  try {
    const headers = {
      "content-type": "application/json",
      accept: "application/json",
    };
    if (overseerrApiKey) {
      headers.authorization = `Bearer ${overseerrApiKey}`;
    }

    const response = await fetch(finalUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        error: `Request failed (${response.status}): ${errorText}`,
        debugUrl: finalUrl,
      };
    }
    const data = await response.json();
    return { ok: true, data, debugUrl: finalUrl };
  } catch (error) {
    return { ok: false, error: error.message, debugUrl: finalUrl || targetUrl };
  }
}

export function describeProxyTarget(baseUrl, endpoint, settings) {
  const { finalUrl } = buildProxiedUrl(
    baseUrl,
    endpoint,
    settings.useProxy,
    settings.proxyUrl
  );
  return finalUrl;
}

"use strict";

const ENDPOINT = "https://api.openai.com/v1/audio/speech";

function createOpenAiProvider(options) {
  const apiKey = String((options && options.apiKey) || process.env.OPENAI_API_KEY || "").trim();
  const fetchImpl = (options && options.fetchImpl) || globalThis.fetch;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for provider=openai");
  if (typeof fetchImpl !== "function") throw new Error("This Node runtime does not provide fetch");
  return {
    id: "openai",
    async synthesize(request) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      try {
        const body = {
          model: request.model,
          input: request.text,
          voice: request.voice,
          response_format: request.format
        };
        if (request.instructions) body.instructions = request.instructions;
        const response = await fetchImpl(ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        if (!response.ok) {
          const detail = (await response.text()).replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 600);
          throw new Error(`OpenAI speech request failed (${response.status}): ${detail}`);
        }
        const bytes = Buffer.from(await response.arrayBuffer());
        if (!bytes.length) throw new Error("OpenAI speech request returned an empty body");
        return { bytes, providerRequestId: response.headers.get("x-request-id") || null };
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

module.exports = { ENDPOINT, createOpenAiProvider };

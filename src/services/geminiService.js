const ambiguousTitles = ["the office", "skins", "ghost", "misfits"];

const toolDefinition = {
  name: "request_media",
  description: "Request a movie or TV show in Overseerr",
  parameters: ["mediaId", "mediaType", "title", "seasons"],
};

function estimateTokens(text) {
  return Math.max(20, Math.ceil(text.split(/\s+/).length * 1.35));
}

function detectMediaType(text) {
  const lower = text.toLowerCase();
  if (lower.includes("season") || lower.includes("episode") || lower.includes("series")) {
    return "tv";
  }
  if (lower.includes("movie")) return "movie";
  return null;
}

function parseSeasons(text) {
  const match = text.match(/season\s+(\d+)/i);
  if (match) return [parseInt(match[1], 10)];
  const range = text.match(/seasons\s+(\d+)-(\d+)/i);
  if (range) {
    const start = parseInt(range[1], 10);
    const end = parseInt(range[2], 10);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }
  return null;
}

export async function generateAssistantResponse({ messages }) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const reply = {
    reply: "",
    tokenDelta: 0,
    toolRequest: null,
  };

  if (!lastUser) {
    reply.reply = "Tell me the title and whether it's a movie or TV show.";
    reply.tokenDelta = 25;
    return reply;
  }

  const userText = lastUser.content.trim();
  const lower = userText.toLowerCase();
  const mediaType = detectMediaType(userText);
  const seasons = parseSeasons(userText);
  const isAmbiguous = ambiguousTitles.some((title) => lower.includes(title));

  if (isAmbiguous && !lower.includes("us") && !lower.includes("uk")) {
    reply.reply =
      "I found multiple versions of that title. Did you mean the US or UK release?";
    reply.tokenDelta = estimateTokens(reply.reply + userText);
    return reply;
  }

  if (!mediaType) {
    reply.reply =
      "Is this a movie or a TV show? If it's a show, let me know which seasons you want.";
    reply.tokenDelta = estimateTokens(reply.reply + userText);
    return reply;
  }

  const normalizedTitle = userText.replace(/request|please|movie|tv show|tv/gi, "").trim();
  const chosenTitle = normalizedTitle || "your title";

  reply.reply =
    seasons && seasons.length
      ? `Got it. I'll request ${chosenTitle} as a ${mediaType === "tv" ? "TV show" : "movie"} covering seasons ${seasons.join(
          ", "
        )}.`
      : `Got it. I'll request ${chosenTitle} as a ${mediaType === "tv" ? "TV show" : "movie"}.`;

  reply.toolRequest = {
    name: toolDefinition.name,
    title: chosenTitle,
    mediaType,
    mediaId: Date.now(),
    seasons: seasons ? seasons.join(",") : "all",
  };
  reply.tokenDelta = estimateTokens(reply.reply + userText);
  return reply;
}

export const toolSchema = toolDefinition;

import React, { useMemo, useRef, useState, useEffect } from "react";
import htm from "htm";
import {
  Settings,
  Send,
  ServerCog,
  MessageCircle,
  Loader2,
  Bot,
  User,
  Coins,
} from "lucide-react";
import { generateAssistantResponse } from "./services/geminiService.js";
import { submitRequest, testConnection } from "./services/overseerService.js";

const html = htm.bind(React.createElement);

const initialAssistant = {
  id: "assistant-intro",
  role: "assistant",
  content:
    "Hi! I'm your Overseerr helper. Tell me a movie or TV show you want to request, and I'll ask questions if anything is unclear.",
};

const defaultSettings = {
  overseerrUrl: "http://localhost:5055",
  overseerrApiKey: "",
  geminiApiKey: "",
  useProxy: true,
  proxyUrl: "https://corsproxy.io/?",
};

const costPerThousandTokens = 0.002;

function RoleBadge({ role }) {
  const iconMap = {
    user: User,
    assistant: Bot,
    tool: ServerCog,
  };
  const Icon = iconMap[role] || MessageCircle;
  return html`<div
    class="flex items-center justify-center h-10 w-10 rounded-full bg-slate-800 border border-slate-700"
  >
    <${Icon} class="h-5 w-5 text-sky-400" />
  </div>`;
}

function ChatBubble({ message }) {
  return html`<div class="flex gap-3 items-start">
    <${RoleBadge} role=${message.role} />
    <div class="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 w-full shadow-lg shadow-slate-900/40">
      <p class="whitespace-pre-wrap text-sm leading-relaxed">${message.content}</p>
      ${message.meta
        ? html`<div class="mt-3 text-xs text-slate-400">${message.meta}</div>`
        : null}
    </div>
  </div>`;
}

function SettingsModal({
  isOpen,
  onClose,
  settings,
  updateSettings,
  onTest,
  testing,
  testResult,
  debugUrl,
  tokenUsage,
}) {
  if (!isOpen) return null;

  return html`<div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
    role="dialog"
    aria-modal="true"
  >
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl shadow-black/60">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <${Settings} class="h-5 w-5 text-sky-400" />
          <h2 class="text-lg font-semibold">Settings</h2>
        </div>
        <button
          class="text-slate-400 hover:text-slate-100 transition"
          onClick=${onClose}
        >
          ✕
        </button>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <label class="flex flex-col gap-2 text-sm">
          <span class="text-slate-300">Overseerr URL</span>
          <input
            class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="http://72.61.x.x:5055"
            value=${settings.overseerrUrl}
            onChange=${(e) => updateSettings({ overseerrUrl: e.target.value })}
          />
        </label>
        <label class="flex flex-col gap-2 text-sm">
          <span class="text-slate-300">Overseerr API Key</span>
          <input
            class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Copy from Overseerr"
            value=${settings.overseerrApiKey}
            onChange=${(e) => updateSettings({ overseerrApiKey: e.target.value })}
          />
        </label>
        <label class="flex flex-col gap-2 text-sm">
          <span class="text-slate-300">Gemini API Key</span>
          <input
            class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Paste your Gemini key"
            value=${settings.geminiApiKey}
            onChange=${(e) => updateSettings({ geminiApiKey: e.target.value })}
          />
        </label>
        <label class="flex flex-col gap-2 text-sm">
          <span class="text-slate-300">Custom Proxy URL</span>
          <input
            class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="https://corsproxy.io/?"
            value=${settings.proxyUrl}
            onChange=${(e) => updateSettings({ proxyUrl: e.target.value })}
          />
        </label>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            class="form-checkbox rounded border-slate-700 bg-slate-950 text-sky-500"
            checked=${settings.useProxy}
            onChange=${(e) => updateSettings({ useProxy: e.target.checked })}
          />
          Use CORS Proxy
        </label>
        <button
          onClick=${onTest}
          class="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-sm font-semibold transition shadow-lg shadow-sky-500/20"
        >
          ${testing
            ? html`<${Loader2} class="h-4 w-4 animate-spin" />`
            : html`<${ServerCog} class="h-4 w-4" />`}
          Test Connection
        </button>
      </div>

      <div class="mt-3 text-xs text-slate-400">
        <p><strong>Debug View:</strong> ${debugUrl || "(No test yet)"}</p>
        ${testResult
          ? html`<p class="mt-1 ${
              testResult.ok ? "text-green-400" : "text-red-400"
            }">${testResult.message}</p>`
          : null}
      </div>

      <div class="mt-6 p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
        <div class="flex items-center gap-2 text-slate-300">
          <${Coins} class="h-5 w-5 text-amber-400" />
          <div>
            <p class="text-sm">Session Tokens: ${tokenUsage}</p>
            <p class="text-xs text-slate-400">
              Est. Cost: ${((tokenUsage / 1000) * costPerThousandTokens).toFixed(4)} USD
            </p>
          </div>
        </div>
        <button
          class="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500"
          onClick=${() => updateSettings({})}
        >
          Keep Settings
        </button>
      </div>
    </div>
  </div>`;
}

export default function App() {
  const [messages, setMessages] = useState([initialAssistant]);
  const [input, setInput] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [debugUrl, setDebugUrl] = useState("");
  const [tokenUsage, setTokenUsage] = useState(0);
  const listRef = useRef(null);

  const tokenCost = useMemo(
    () => ((tokenUsage / 1000) * costPerThousandTokens).toFixed(4),
    [tokenUsage]
  );

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const updateSettings = (patch) => setSettings((prev) => ({ ...prev, ...patch }));

  const handleToolExecution = async (toolPayload) => {
    if (!settings.overseerrUrl || !settings.overseerrApiKey) {
      const missing = {
        id: `tool-missing-${Date.now()}`,
        role: "assistant",
        content:
          "I need your Overseerr URL and API key before I can send a request. Add them in Settings.",
      };
      setMessages((prev) => [...prev, missing]);
      return;
    }

    const prepMessage = {
      id: `tool-prep-${Date.now()}`,
      role: "assistant",
      content: `Calling request_media for ${toolPayload.title} (${toolPayload.mediaType.toUpperCase()})...`,
      meta: settings.useProxy
        ? `Using proxy: ${settings.proxyUrl}`
        : "Proxy disabled",
    };
    setMessages((prev) => [...prev, prepMessage]);
    const result = await submitRequest(settings, toolPayload);
    const resultMsg = {
      id: `tool-result-${Date.now()}`,
      role: "tool",
      content: result.ok
        ? `Request sent successfully to Overseerr. Title: ${toolPayload.title}.`
        : `Request failed: ${result.error || "Unknown error"}.`,
      meta: `URL: ${result.debugUrl}`,
    };
    setMessages((prev) => [...prev, resultMsg]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await generateAssistantResponse({
        messages: [...messages, userMessage],
        settings,
      });
      if (response.tokenDelta) {
        setTokenUsage((prev) => prev + response.tokenDelta);
      }
      if (response.reply) {
        setMessages((prev) => [
          ...prev,
          { id: `assistant-${Date.now()}`, role: "assistant", content: response.reply },
        ]);
      }
      if (response.toolRequest) {
        const tool = response.toolRequest;
        const toolMsg = {
          id: `tool-${Date.now()}`,
          role: "assistant",
          content: `Requesting "${tool.title}" as a ${tool.mediaType === "tv" ? "TV Show" : "Movie"} (${tool.seasons || "full"} seasons) now...`,
        };
        setMessages((prev) => [...prev, toolMsg]);
        await handleToolExecution(tool);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: "assistant", content: `Something went wrong: ${error.message}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(settings);
    setDebugUrl(result.debugUrl);
    setTestResult({ ok: result.ok, message: result.message });
    setTesting(false);
  };

  return html`<div class="min-h-screen flex flex-col">
    <header class="border-b border-slate-800 bg-slate-900/70 backdrop-blur px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-sky-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-lg shadow-sky-500/30">
          OS
        </div>
        <div>
          <h1 class="text-lg font-semibold">Overseerr-StartPage</h1>
          <p class="text-xs text-slate-400">Conversational assistant for Overseerr requests</p>
        </div>
      </div>
      <div class="flex items-center gap-3 text-sm text-slate-300">
        <div class="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
          Tokens: ${tokenUsage}
        </div>
        <div class="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
          Est. Cost: $${tokenCost}
        </div>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg font-semibold text-sm transition shadow-lg shadow-sky-500/20"
          onClick=${() => setIsModalOpen(true)}
        >
          <${Settings} class="h-4 w-4" /> Settings
        </button>
      </div>
    </header>

    <main class="flex-1 grid md:grid-cols-[2fr,1fr] gap-6 px-6 py-6">
      <section class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-2xl shadow-black/50">
        <div class="flex items-center gap-2 mb-4">
          <${MessageCircle} class="h-5 w-5 text-sky-400" />
          <h2 class="text-base font-semibold">Chat</h2>
        </div>
        <div
          ref=${listRef}
          class="flex-1 overflow-y-auto space-y-4 pr-2"
          style="max-height: calc(100vh - 250px)"
        >
          ${messages.map((msg) => html`<${ChatBubble} key=${msg.id} message=${msg} />`)}
        </div>
        <div class="mt-4">
          <label class="text-xs text-slate-400">What would you like to request?</label>
          <div class="mt-2 flex items-end gap-3">
            <textarea
              class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm min-h-[68px] focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g., The Office (US) all seasons"
              value=${input}
              onChange=${(e) => setInput(e.target.value)}
              onKeyDown=${handleKeyDown}
            ></textarea>
            <button
              class="h-[68px] w-14 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center shadow-lg shadow-sky-500/25 transition"
              onClick=${handleSend}
              disabled=${isSending}
            >
              ${isSending
                ? html`<${Loader2} class="h-5 w-5 animate-spin" />`
                : html`<${Send} class="h-5 w-5" />`}
            </button>
          </div>
        </div>
      </section>

      <aside class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl shadow-black/50 space-y-4">
        <div class="flex items-center gap-2">
          <${ServerCog} class="h-5 w-5 text-sky-400" />
          <h3 class="text-base font-semibold">Request Helper</h3>
        </div>
        <p class="text-sm text-slate-300 leading-relaxed">
          The assistant distinguishes movies vs TV shows, asks clarifying questions (like US vs UK for "The Office"), and routes your request through your configured Overseerr proxy to avoid mixed-content issues.
        </p>
        <div class="text-xs text-slate-400 space-y-2">
          <p>• Configure Overseerr URL, API keys, proxy behavior, and Gemini access in Settings.</p>
          <p>• Use the Test Connection button to ping <code>/api/v1/auth/me</code> and inspect the exact URL via Debug View.</p>
          <p>• Session token usage and estimated cost are tracked for transparency.</p>
        </div>
      </aside>
    </main>

    <${SettingsModal}
      isOpen=${isModalOpen}
      onClose=${() => setIsModalOpen(false)}
      settings=${settings}
      updateSettings=${updateSettings}
      onTest=${handleTestConnection}
      testing=${testing}
      testResult=${testResult}
      debugUrl=${debugUrl}
      tokenUsage=${tokenUsage}
    />
  </div>`;
}

// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import "./embed.css";

// ─── Types ───────────────────────────────────────────
interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

interface EmbedData {
  authorName: string;
  authorIcon: string;
  authorUrl: string;
  title: string;
  titleUrl: string;
  description: string;
  color: string;
  fields: EmbedField[];
  thumbnailUrl: string;
  imageUrl: string;
  footerText: string;
  footerIcon: string;
  timestamp: boolean;
  content: string; // message content above embed
}

type TemplateKey = "announcement" | "event" | "reward" | "video" | "custom";

interface Template {
  key: TemplateKey;
  label: string;
  icon: string;
  defaults: Partial<EmbedData>;
  visibleFields: (keyof EmbedData)[];
}

// ─── Component Types ─────────────────────────────────
type ComponentType = "none" | "role_buttons" | "link_buttons" | "role_select" | "confirm_button";

interface RoleBtnConfig { role_id: string; label: string; style: string; emoji: string; }
interface LinkBtnConfig { label: string; url: string; emoji: string; }
interface SelectOptionConfig { role_id: string; label: string; description: string; emoji: string; }

interface ComponentsConfig {
  type: ComponentType;
  // role_buttons
  roleButtons: RoleBtnConfig[];
  // link_buttons
  linkButtons: LinkBtnConfig[];
  // role_select
  selectPlaceholder: string;
  selectOptions: SelectOptionConfig[];
  // confirm_button
  confirmLabel: string;
  confirmStyle: string;
  confirmMessage: string;
  confirmRoleId: string;
  confirmActionType: string;
}

// ─── Templates ───────────────────────────────────────
const TEMPLATES: Template[] = [
  {
    key: "announcement",
    label: "📢 Announcement",
    icon: "📢",
    defaults: { color: "#f0a030", timestamp: true },
    visibleFields: ["title", "description", "color", "imageUrl", "footerText", "timestamp"],
  },
  {
    key: "event",
    label: "🎉 Event",
    icon: "🎉",
    defaults: {
      color: "#5865f2",
      fields: [
        { name: "📅 Date", value: "", inline: true },
        { name: "📍 Location", value: "", inline: true },
      ],
      timestamp: true,
    },
    visibleFields: ["title", "description", "color", "fields", "imageUrl", "footerText", "timestamp"],
  },
  {
    key: "reward",
    label: "🏆 Reward",
    icon: "🏆",
    defaults: {
      color: "#eb459e",
      fields: [
        { name: "🏅 Reward", value: "", inline: true },
        { name: "📊 Requirement", value: "", inline: true },
        { name: "⏰ Deadline", value: "", inline: false },
      ],
      timestamp: true,
    },
    visibleFields: ["title", "description", "color", "fields", "thumbnailUrl", "footerText", "timestamp"],
  },
  {
    key: "video",
    label: "🎬 Video Share",
    icon: "🎬",
    defaults: { color: "#ed4245", timestamp: true },
    visibleFields: ["authorName", "authorIcon", "title", "titleUrl", "description", "color", "imageUrl", "thumbnailUrl", "footerText", "timestamp"],
  },
  {
    key: "custom",
    label: "📝 Custom",
    icon: "📝",
    defaults: { color: "#5865f2" },
    visibleFields: ["content", "authorName", "authorIcon", "authorUrl", "title", "titleUrl", "description", "color", "fields", "thumbnailUrl", "imageUrl", "footerText", "footerIcon", "timestamp"],
  },
];

const COLOR_PRESETS = [
  { label: "🔵 Blue", hex: "#5865f2" },
  { label: "🔴 Red", hex: "#ed4245" },
  { label: "🟢 Green", hex: "#57f287" },
  { label: "🟡 Yellow", hex: "#fee75c" },
  { label: "🟠 Orange", hex: "#f0a030" },
  { label: "🟣 Purple", hex: "#eb459e" },
  { label: "⚪ Gray", hex: "#747f8d" },
  { label: "⚫ Dark", hex: "#2b2d31" },
  { label: "🩵 Cyan", hex: "#00a8fc" },
];

const DEFAULT_EMBED: EmbedData = {
  authorName: "",
  authorIcon: "",
  authorUrl: "",
  title: "",
  titleUrl: "",
  description: "",
  color: "#5865f2",
  fields: [],
  thumbnailUrl: "",
  imageUrl: "",
  footerText: "",
  footerIcon: "",
  timestamp: false,
  content: "",
};

const WEBHOOK_STORAGE_KEY = "discord_embed_webhook_url";
const DRAFT_STORAGE_KEY = "discord_embed_draft";

// ─── Helpers ─────────────────────────────────────────
function hexToDecimal(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

// ─── Discord Markdown Renderer ───────────────────────
function renderDiscordMarkdown(text: string): string {
  if (!text) return "";
  // 1) Escape HTML
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // 2) Code blocks (multi-line)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g,
    (_m, lang, code) => `<pre class="md-codeblock"><code>${code}</code></pre>`);
  // 3) Inline code (must run before bold/italic to protect backticks inside code)
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
  // 4) Bold + italic (***text***)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // 5) Bold (**text**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // 6) Italic (*text* or _text_)
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  html = html.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '<em>$1</em>');
  // 7) Underline (__text__)
  html = html.replace(/__([^_\n]+)__/g, '<u>$1</u>');
  // 8) Strikethrough (~~text~~)
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // 9) Headings (### / ## / # at start of line)
  html = html.replace(/^### (.+)$/gm, '<span class="md-heading md-h3">$1</span>');
  html = html.replace(/^## (.+)$/gm, '<span class="md-heading md-h2">$1</span>');
  html = html.replace(/^# (.+)$/gm, '<span class="md-heading md-h1">$1</span>');
  // 10) Block quotes (> at start of line)
  html = html.replace(/^&gt; (.+)$/gm, '<span class="md-quote">$1</span>');
  // 10) Bullet lists — lines starting with - or *
  html = html.replace(/^[-*] (.+)$/gm, '<span class="md-bullet">• $1</span>');
  // 11) Masked links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<span class="md-link" data-url="$2">$1</span>');
  // 12) Line breaks
  html = html.replace(/\n/g, "<br/>");
  return html;
}

// ─── Button Style Helpers ─────────────────────────────
const BTN_STYLE_MAP: Record<string, { bg: string; text: string }> = {
  primary:    { bg: "#5865f2", text: "#ffffff" },
  secondary:  { bg: "#4e5058", text: "#ffffff" },
  success:    { bg: "#57f287", text: "#1a1a1a" },
  danger:     { bg: "#ed4245", text: "#ffffff" },
};

function buildEmbedPayload(data: EmbedData) {
  const embed: Record<string, unknown> = {};
  if (data.authorName) {
    embed.author = { name: data.authorName };
    if (data.authorIcon) (embed.author as Record<string, string>).icon_url = data.authorIcon;
    if (data.authorUrl) (embed.author as Record<string, string>).url = data.authorUrl;
  }
  if (data.title) embed.title = data.title;
  if (data.titleUrl) embed.url = data.titleUrl;
  if (data.description) embed.description = data.description;
  if (data.color) embed.color = hexToDecimal(data.color);
  if (data.fields.length > 0) {
    embed.fields = data.fields.map((f) => ({ name: f.name, value: f.value || "​", inline: f.inline }));
  }
  if (data.thumbnailUrl) embed.thumbnail = { url: data.thumbnailUrl };
  if (data.imageUrl) embed.image = { url: data.imageUrl };
  if (data.footerText) {
    embed.footer = { text: data.footerText };
    if (data.footerIcon) (embed.footer as Record<string, string>).icon_url = data.footerIcon;
  }
  if (data.timestamp) embed.timestamp = new Date().toISOString();
  return embed;
}

function buildComponentsJSON(c: ComponentsConfig) {
  if (c.type === "none") return null;
  if (c.type === "role_buttons") {
    return {
      type: "role_buttons",
      buttons: c.roleButtons.filter(b => b.role_id).map(b => ({
        role_id: b.role_id, label: b.label || `Role ${b.role_id}`, style: b.style || "primary",
        ...(b.emoji ? { emoji: b.emoji } : {}),
      })),
    };
  }
  if (c.type === "link_buttons") {
    return {
      type: "link_buttons",
      buttons: c.linkButtons.filter(b => b.url).map(b => ({
        label: b.label || "Link", url: b.url,
        ...(b.emoji ? { emoji: b.emoji } : {}),
      })),
    };
  }
  if (c.type === "role_select") {
    return {
      type: "role_select",
      placeholder: c.selectPlaceholder,
      options: c.selectOptions.filter(o => o.role_id).map(o => ({
        role_id: o.role_id, label: o.label || `Role ${o.role_id}`,
        ...(o.description ? { description: o.description } : {}),
        ...(o.emoji ? { emoji: o.emoji } : {}),
      })),
    };
  }
  if (c.type === "confirm_button") {
    return {
      type: "confirm_button",
      label: c.confirmLabel, style: c.confirmStyle,
      confirm_message: c.confirmMessage,
      action_type: c.confirmActionType,
      ...(c.confirmRoleId ? { role_id: c.confirmRoleId } : {}),
    };
  }
  return null;
}

function buildFullPayload(embed: EmbedData, components: ComponentsConfig) {
  const payload: Record<string, unknown> = {};
  if (embed.content.trim()) payload.content = embed.content;
  payload.embeds = [buildEmbedPayload(embed)];
  const comp = buildComponentsJSON(components);
  if (comp) payload.components = comp;
  return payload;
}

// ─── Component ───────────────────────────────────────
export default function DiscordEmbedBuilder() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [templateKey, setTemplateKey] = useState<TemplateKey>("announcement");
  const [embed, setEmbed] = useState<EmbedData>(DEFAULT_EMBED);
  const [sendStatus, setSendStatus] = useState<"" | "sending" | "ok" | "fail">("");
  const [previewTheme, setPreviewTheme] = useState<"dark" | "light">("dark");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [components, setComponents] = useState<ComponentsConfig>({
    type: "none",
    roleButtons: [],
    linkButtons: [],
    selectPlaceholder: "Select a role...",
    selectOptions: [],
    confirmLabel: "✅ Confirm",
    confirmStyle: "success",
    confirmMessage: "Confirmed!",
    confirmRoleId: "",
    confirmActionType: "message",
  });

  // Load saved state
  useEffect(() => {
    const saved = localStorage.getItem(WEBHOOK_STORAGE_KEY);
    if (saved) setWebhookUrl(saved);
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setEmbed((prev) => ({ ...prev, ...parsed }));
        if (parsed._template) setTemplateKey(parsed._template);
      } catch { /* ignore */ }
    }
  }, []);

  // Save draft on change
  const saveDraft = useCallback((data: EmbedData, tpl: TemplateKey) => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...data, _template: tpl }));
  }, []);

  const updateEmbed = useCallback(
    (patch: Partial<EmbedData>) => {
      setEmbed((prev) => {
        const next = { ...prev, ...patch };
        saveDraft(next, templateKey);
        return next;
      });
    },
    [templateKey, saveDraft]
  );

  // Apply template
  const applyTemplate = useCallback(
    (key: TemplateKey) => {
      setTemplateKey(key);
      const tpl = TEMPLATES.find((t) => t.key === key)!;
      const merged: EmbedData = {
        ...DEFAULT_EMBED,
        ...tpl.defaults,
        fields: tpl.defaults.fields || [],
      };
      setEmbed(merged);
      saveDraft(merged, key);
    },
    [saveDraft]
  );

  const activeTemplate = TEMPLATES.find((t) => t.key === templateKey)!;
  const isVisible = (field: keyof EmbedData) => activeTemplate.visibleFields.includes(field);

  // Field handlers
  const updateField = (index: number, patch: Partial<EmbedField>) => {
    const next = embed.fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    updateEmbed({ fields: next });
  };

  const addField = () => updateEmbed({ fields: [...embed.fields, { name: "", value: "", inline: true }] });
  const removeField = (index: number) => updateEmbed({ fields: embed.fields.filter((_, i) => i !== index) });

  // Save webhook
  const saveWebhook = () => {
    localStorage.setItem(WEBHOOK_STORAGE_KEY, webhookUrl);
    setSendStatus("ok");
    setTimeout(() => setSendStatus(""), 1500);
  };

  // Send
  const sendToDiscord = async () => {
    if (!webhookUrl.trim()) return;
    setSendStatus("sending");
    try {
      const payload: Record<string, unknown> = { embeds: [buildEmbedPayload(embed)] };
      if (embed.content.trim()) payload.content = embed.content;

      const res = await fetch(webhookUrl.trim() + "?wait=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSendStatus("ok");
      } else {
        const err = await res.text();
        console.error("Webhook error:", err);
        setSendStatus("fail");
      }
    } catch (e) {
      console.error("Send failed:", e);
      setSendStatus("fail");
    }
    setTimeout(() => setSendStatus(""), 3000);
  };

  // Preview embed for rendering
  const previewEmbed = buildEmbedPayload(embed);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">🔧 Discord Embed Builder</h1>
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="Discord Webhook URL..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono"
            />
            <button
              onClick={saveWebhook}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium whitespace-nowrap transition"
            >
              💾 Save
            </button>
            <button
              onClick={sendToDiscord}
              disabled={sendStatus === "sending" || !webhookUrl.trim()}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition text-white ${
                sendStatus === "sending"
                  ? "bg-gray-400 cursor-wait"
                  : sendStatus === "ok"
                  ? "bg-green-500"
                  : sendStatus === "fail"
                  ? "bg-red-500"
                  : "bg-[#5865f2] hover:bg-[#4752c4]"
              } disabled:opacity-50`}
            >
              {sendStatus === "sending" ? "⏳ Sending..." : sendStatus === "ok" ? "✅ Sent!" : sendStatus === "fail" ? "❌ Failed" : "📤 Send"}
            </button>
          </div>
          <button
            onClick={() => setPreviewTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-600 transition whitespace-nowrap"
          >
            {previewTheme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-[1400px] mx-auto p-4 flex gap-4 flex-col lg:flex-row">
        {/* Editor */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Template selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Template</label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => applyTemplate(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    templateKey === t.key ? "bg-[#5865f2] text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content (message above embed) */}
          {isVisible("content") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Message Content</label>
              <textarea
                value={embed.content}
                onChange={(e) => updateEmbed({ content: e.target.value })}
                placeholder="Optional text above the embed..."
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
              />
            </div>
          )}

          {/* Author */}
          {(isVisible("authorName") || isVisible("authorIcon")) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">👤 Author</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {isVisible("authorName") && (
                  <input
                    value={embed.authorName}
                    onChange={(e) => updateEmbed({ authorName: e.target.value })}
                    placeholder="Author name"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {isVisible("authorIcon") && (
                  <input
                    value={embed.authorIcon}
                    onChange={(e) => updateEmbed({ authorIcon: e.target.value })}
                    placeholder="Icon URL (optional)"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {isVisible("authorUrl") && (
                  <input
                    value={embed.authorUrl}
                    onChange={(e) => updateEmbed({ authorUrl: e.target.value })}
                    placeholder="Author link URL (optional)"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
              </div>
            </div>
          )}

          {/* Title + URL */}
          {isVisible("title") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📌 Title</label>
              <div className="flex gap-2">
                <input
                  value={embed.title}
                  onChange={(e) => updateEmbed({ title: e.target.value })}
                  placeholder="Embed title"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                {isVisible("titleUrl") && (
                  <input
                    value={embed.titleUrl}
                    onChange={(e) => updateEmbed({ titleUrl: e.target.value })}
                    placeholder="Title link URL"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {isVisible("description") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📝 Description</label>
              <textarea
                value={embed.description}
                onChange={(e) => updateEmbed({ description: e.target.value })}
                placeholder="Embed description (supports markdown-like formatting)..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-y"
              />
              <p className="text-xs text-gray-400 mt-1">
                Tip: Use **bold**, *italic*, __underline__, bullet lists, etc.
              </p>
            </div>
          )}

          {/* Color */}
          {isVisible("color") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🎨 Color (left border)</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => updateEmbed({ color: c.hex })}
                    className={`w-9 h-9 rounded-full border-2 transition shadow-sm ${
                      embed.color === c.hex ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 hover:border-gray-500 transition"
                  >
                    +
                  </button>
                  {showColorPicker && (
                    <div className="absolute top-10 left-0 bg-white rounded-lg shadow-lg border p-2 z-20">
                      <input
                        type="color"
                        value={embed.color}
                        onChange={(e) => {
                          updateEmbed({ color: e.target.value });
                        }}
                        className="w-32 h-32"
                      />
                      <input
                        value={embed.color}
                        onChange={(e) => updateEmbed({ color: e.target.value })}
                        className="w-full mt-1 text-xs font-mono border rounded px-1 py-0.5"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fields */}
          {isVisible("fields") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📋 Fields</label>
                <button onClick={addField} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition">
                  + Add Field
                </button>
              </div>
              {embed.fields.length === 0 && (
                <p className="text-sm text-gray-400 italic">No fields. Click &ldquo;+ Add Field&rdquo; to add one.</p>
              )}
              <div className="space-y-2">
                {embed.fields.map((f, i) => (
                  <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-lg p-2 border">
                    <div className="flex-1 space-y-1">
                      <input
                        value={f.name}
                        onChange={(e) => updateField(i, { name: e.target.value })}
                        placeholder="Field name"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-medium"
                      />
                      <input
                        value={f.value}
                        onChange={(e) => updateField(i, { value: e.target.value })}
                        placeholder="Field value"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                      />
                    </div>
                    <label className="flex items-center gap-1 text-xs text-gray-500 pt-1 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={f.inline}
                        onChange={(e) => updateField(i, { inline: e.target.checked })}
                        className="rounded"
                      />
                      Inline
                    </label>
                    <button onClick={() => removeField(i)} className="text-red-400 hover:text-red-600 text-sm pt-1 px-1" title="Remove">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Components (Buttons/Menus for Discord Bot) ─── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              🎮 Interactive Components <span className="text-gray-400 font-normal">(for /post_embed bot command)</span>
            </label>
            <select
              value={components.type}
              onChange={(e) => setComponents((c) => ({ ...c, type: e.target.value as ComponentType }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-3"
            >
              <option value="none">None (embed only)</option>
              <option value="role_buttons">🔘 Role Toggle Buttons</option>
              <option value="link_buttons">🔗 Link Buttons</option>
              <option value="role_select">📋 Role Select Dropdown</option>
              <option value="confirm_button">✅ Confirm Button</option>
            </select>

            {/* Role Buttons Config */}
            {components.type === "role_buttons" && (
              <div className="space-y-2">
                {components.roleButtons.map((b, i) => (
                  <div key={i} className="flex gap-2 items-center bg-gray-50 rounded-lg p-2 border">
                    <input value={b.emoji} onChange={(e) => { const n = [...components.roleButtons]; n[i] = { ...n[i], emoji: e.target.value }; setComponents((c) => ({ ...c, roleButtons: n })); }} placeholder="🎮" className="w-12 rounded border px-2 py-1 text-sm" />
                    <input value={b.label} onChange={(e) => { const n = [...components.roleButtons]; n[i] = { ...n[i], label: e.target.value }; setComponents((c) => ({ ...c, roleButtons: n })); }} placeholder="Button label" className="flex-1 rounded border px-2 py-1 text-sm" />
                    <input value={b.role_id} onChange={(e) => { const n = [...components.roleButtons]; n[i] = { ...n[i], role_id: e.target.value }; setComponents((c) => ({ ...c, roleButtons: n })); }} placeholder="Role ID" className="w-28 rounded border px-2 py-1 text-sm font-mono" />
                    <select value={b.style} onChange={(e) => { const n = [...components.roleButtons]; n[i] = { ...n[i], style: e.target.value }; setComponents((c) => ({ ...c, roleButtons: n })); }} className="w-28 rounded border px-2 py-1 text-xs">
                      <option value="primary">Primary</option><option value="secondary">Secondary</option>
                      <option value="success">Success</option><option value="danger">Danger</option>
                    </select>
                    <button onClick={() => setComponents((c) => ({ ...c, roleButtons: c.roleButtons.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 px-1">✕</button>
                  </div>
                ))}
                <button onClick={() => setComponents((c) => ({ ...c, roleButtons: [...c.roleButtons, { role_id: "", label: "", style: "primary", emoji: "" }] }))} className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-medium transition">
                  + Add Role Button
                </button>
              </div>
            )}

            {/* Link Buttons Config */}
            {components.type === "link_buttons" && (
              <div className="space-y-2">
                {components.linkButtons.map((b, i) => (
                  <div key={i} className="flex gap-2 items-center bg-gray-50 rounded-lg p-2 border">
                    <input value={b.emoji} onChange={(e) => { const n = [...components.linkButtons]; n[i] = { ...n[i], emoji: e.target.value }; setComponents((c) => ({ ...c, linkButtons: n })); }} placeholder="🔗" className="w-12 rounded border px-2 py-1 text-sm" />
                    <input value={b.label} onChange={(e) => { const n = [...components.linkButtons]; n[i] = { ...n[i], label: e.target.value }; setComponents((c) => ({ ...c, linkButtons: n })); }} placeholder="Button label" className="flex-1 rounded border px-2 py-1 text-sm" />
                    <input value={b.url} onChange={(e) => { const n = [...components.linkButtons]; n[i] = { ...n[i], url: e.target.value }; setComponents((c) => ({ ...c, linkButtons: n })); }} placeholder="https://..." className="flex-1 rounded border px-2 py-1 text-sm font-mono" />
                    <button onClick={() => setComponents((c) => ({ ...c, linkButtons: c.linkButtons.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 px-1">✕</button>
                  </div>
                ))}
                <button onClick={() => setComponents((c) => ({ ...c, linkButtons: [...c.linkButtons, { label: "", url: "", emoji: "" }] }))} className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-medium transition">
                  + Add Link Button
                </button>
              </div>
            )}

            {/* Role Select Config */}
            {components.type === "role_select" && (
              <div className="space-y-2">
                <input value={components.selectPlaceholder} onChange={(e) => setComponents((c) => ({ ...c, selectPlaceholder: e.target.value }))} placeholder="Dropdown placeholder text" className="w-full rounded border px-3 py-2 text-sm mb-2" />
                {components.selectOptions.map((o, i) => (
                  <div key={i} className="flex gap-2 items-center bg-gray-50 rounded-lg p-2 border">
                    <input value={o.emoji} onChange={(e) => { const n = [...components.selectOptions]; n[i] = { ...n[i], emoji: e.target.value }; setComponents((c) => ({ ...c, selectOptions: n })); }} placeholder="🎮" className="w-12 rounded border px-2 py-1 text-sm" />
                    <input value={o.label} onChange={(e) => { const n = [...components.selectOptions]; n[i] = { ...n[i], label: e.target.value }; setComponents((c) => ({ ...c, selectOptions: n })); }} placeholder="Option label" className="flex-1 rounded border px-2 py-1 text-sm" />
                    <input value={o.role_id} onChange={(e) => { const n = [...components.selectOptions]; n[i] = { ...n[i], role_id: e.target.value }; setComponents((c) => ({ ...c, selectOptions: n })); }} placeholder="Role ID" className="w-28 rounded border px-2 py-1 text-sm font-mono" />
                    <input value={o.description} onChange={(e) => { const n = [...components.selectOptions]; n[i] = { ...n[i], description: e.target.value }; setComponents((c) => ({ ...c, selectOptions: n })); }} placeholder="Description" className="w-32 rounded border px-2 py-1 text-sm" />
                    <button onClick={() => setComponents((c) => ({ ...c, selectOptions: c.selectOptions.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 px-1">✕</button>
                  </div>
                ))}
                <button onClick={() => setComponents((c) => ({ ...c, selectOptions: [...c.selectOptions, { role_id: "", label: "", description: "", emoji: "" }] }))} className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-medium transition">
                  + Add Option
                </button>
              </div>
            )}

            {/* Confirm Button Config */}
            {components.type === "confirm_button" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Button Label</label>
                    <input value={components.confirmLabel} onChange={(e) => setComponents((c) => ({ ...c, confirmLabel: e.target.value }))} className="w-full rounded border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Button Style</label>
                    <select value={components.confirmStyle} onChange={(e) => setComponents((c) => ({ ...c, confirmStyle: e.target.value }))} className="w-full rounded border px-3 py-2 text-sm">
                      <option value="success">Success (Green)</option><option value="primary">Primary (Blue)</option>
                      <option value="danger">Danger (Red)</option><option value="secondary">Secondary (Gray)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Confirmation Message</label>
                    <input value={components.confirmMessage} onChange={(e) => setComponents((c) => ({ ...c, confirmMessage: e.target.value }))} className="w-full rounded border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Action Type</label>
                    <select value={components.confirmActionType} onChange={(e) => setComponents((c) => ({ ...c, confirmActionType: e.target.value }))} className="w-full rounded border px-3 py-2 text-sm">
                      <option value="message">Show Message Only</option>
                      <option value="role_toggle">Toggle Role</option>
                    </select>
                  </div>
                </div>
                {components.confirmActionType === "role_toggle" && (
                  <div>
                    <label className="text-xs text-gray-500">Role ID to Toggle</label>
                    <input value={components.confirmRoleId} onChange={(e) => setComponents((c) => ({ ...c, confirmRoleId: e.target.value }))} placeholder="Discord Role ID" className="w-full rounded border px-3 py-2 text-sm font-mono" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Images */}
          {(isVisible("thumbnailUrl") || isVisible("imageUrl")) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🖼️ Images</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {isVisible("thumbnailUrl") && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Thumbnail URL (small, top-right)</label>
                    <input
                      value={embed.thumbnailUrl}
                      onChange={(e) => updateEmbed({ thumbnailUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                )}
                {isVisible("imageUrl") && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Image URL (large, below)</label>
                    <input
                      value={embed.imageUrl}
                      onChange={(e) => updateEmbed({ imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          {(isVisible("footerText") || isVisible("footerIcon")) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📎 Footer</label>
              <div className="flex gap-2">
                {isVisible("footerText") && (
                  <input
                    value={embed.footerText}
                    onChange={(e) => updateEmbed({ footerText: e.target.value })}
                    placeholder="Footer text"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
                {isVisible("footerIcon") && (
                  <input
                    value={embed.footerIcon}
                    onChange={(e) => updateEmbed({ footerIcon: e.target.value })}
                    placeholder="Footer icon URL"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          {isVisible("timestamp") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={embed.timestamp}
                  onChange={(e) => updateEmbed({ timestamp: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">🕐 Show timestamp (current time)</span>
              </label>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:w-[540px] lg:sticky lg:top-20 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">👁 Live Preview</label>
            <div className={`discord-preview ${previewTheme === "light" ? "light" : ""}`}>
              {/* Avatar + username row */}
              <div className="discord-message-wrapper">
                <div className="discord-message-avatar">🤖</div>
                <div className="discord-message-content-area">
                  <div className="discord-username-row">
                    <span className="discord-username">Webhook Bot</span>
                    <span className="discord-webhook-bot">
                      <svg width="10" height="10" viewBox="0 0 16 16"><path fill="white" d="M9.6 1.6c-.3-.7-1.1-1-1.8-.7L1.3 4C.7 4.3.4 5 .6 5.6l2.5 5.9 6.5-6.5zm-4 11.5l6.5-6.5 2.5 5.9c.3.7 0 1.4-.7 1.7l-6.5 3.1c-.7.3-1.4 0-1.8-.7l-2.5-5.9z"/></svg>
                      BOT
                    </span>
                    <span className="discord-timestamp-small">Today at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  {/* Message content */}
                  {embed.content && <div className="discord-embed-content" dangerouslySetInnerHTML={{ __html: renderDiscordMarkdown(embed.content) }} />}

                  {/* Embed */}
                  <div className="discord-embed" style={{ borderLeftColor: embed.color || "#5865f2" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Author */}
                      {(previewEmbed.author as Record<string, string> | undefined)?.name && (
                        <div className="discord-embed-author">
                          {((previewEmbed.author as Record<string, string> | undefined)?.icon_url) && (
                            <img
                              src={(previewEmbed.author as Record<string, string>).icon_url}
                              alt=""
                              className="discord-embed-author-icon"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                          <span className="discord-embed-author-name">
                            {((previewEmbed.author as Record<string, string> | undefined)?.url) ? (
                              <a href={(previewEmbed.author as Record<string, string>).url} target="_blank" rel="noopener">
                                {(previewEmbed.author as Record<string, string>).name}
                              </a>
                            ) : (
                              (previewEmbed.author as Record<string, string>).name
                            )}
                          </span>
                        </div>
                      )}

                      {/* Title */}
                      {previewEmbed.title && (
                        <div className="discord-embed-title">
                          {previewEmbed.url ? (
                            <a href={previewEmbed.url as string} target="_blank" rel="noopener">
                              {previewEmbed.title as string}
                            </a>
                          ) : (
                            (previewEmbed.title as string)
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {previewEmbed.description && (
                        <div className="discord-embed-description"
                          dangerouslySetInnerHTML={{ __html: renderDiscordMarkdown(previewEmbed.description as string) }}
                        />
                      )}

                      {/* Fields */}
                      {Array.isArray(previewEmbed.fields) && previewEmbed.fields.length > 0 && (
                        <div className="discord-embed-fields">
                          {(previewEmbed.fields as Array<{ name: string; value: string; inline: boolean }>).map(
                            (f, i) => (
                              <div key={i} className={`discord-embed-field ${f.inline ? "inline" : "full"}`}>
                                <div className="discord-embed-field-name"
                                  dangerouslySetInnerHTML={{ __html: renderDiscordMarkdown(f.name || "​") }}
                                />
                                <div className="discord-embed-field-value"
                                  dangerouslySetInnerHTML={{ __html: renderDiscordMarkdown(f.value || "​") }}
                                />
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* Image */}
                      {previewEmbed.image && (
                        <img
                          src={(previewEmbed.image as Record<string, string>).url}
                          alt="Embed image"
                          className="discord-embed-image"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}

                      {/* Footer */}
                      {previewEmbed.footer && (
                        <div className="discord-embed-footer">
                          {((previewEmbed.footer as Record<string, string>).icon_url) && (
                            <img
                              src={(previewEmbed.footer as Record<string, string>).icon_url}
                              alt=""
                              className="discord-embed-footer-icon"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                          <span className="discord-embed-footer-text"
                            dangerouslySetInnerHTML={{ __html: renderDiscordMarkdown((previewEmbed.footer as Record<string, string>).text) }}
                          />
                        </div>
                      )}

                      {/* Timestamp */}
                      {previewEmbed.timestamp && (
                        <div className="discord-embed-timestamp">
                          {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date().toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail */}
                    {previewEmbed.thumbnail && (
                      <img
                        src={(previewEmbed.thumbnail as Record<string, string>).url}
                        alt=""
                        className="discord-embed-thumbnail"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Component Preview (Buttons / Select Menu) ─── */}
            {components.type !== "none" && (
              <div className="mt-3 discord-preview-component">
                {/* Role Buttons Preview */}
                {components.type === "role_buttons" && components.roleButtons.filter(b => b.role_id).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {components.roleButtons.filter(b => b.role_id).map((b, i) => {
                      const style = BTN_STYLE_MAP[b.style] || BTN_STYLE_MAP.primary;
                      return (
                        <div key={i} className="discord-btn-preview"
                          style={{ backgroundColor: style.bg, color: style.text }}>
                          {b.emoji && <span>{b.emoji}</span>}
                          <span>{b.label || `Role ${b.role_id}`}</span>
                        </div>
                      );
                    })}
                    <span className="discord-component-hint text-xs text-gray-500 self-center ml-2">
                      ← Click to toggle role
                    </span>
                  </div>
                )}

                {/* Link Buttons Preview */}
                {components.type === "link_buttons" && components.linkButtons.filter(b => b.url).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {components.linkButtons.filter(b => b.url).map((b, i) => {
                      const url = b.url.length > 40 ? b.url.slice(0, 40) + "..." : b.url;
                      return (
                        <div key={i} className="discord-btn-preview discord-btn-link"
                          title={b.url}>
                          {b.emoji && <span>{b.emoji}</span>}
                          <span>{b.label || url}</span>
                          <span className="discord-link-icon">↗</span>
                        </div>
                      );
                    })}
                    <span className="discord-component-hint text-xs text-gray-500 self-center ml-2">
                      ← Opens URL in browser
                    </span>
                  </div>
                )}

                {/* Role Select Preview */}
                {components.type === "role_select" && components.selectOptions.filter(o => o.role_id).length > 0 && (
                  <div className="discord-select-preview">
                    <div className="discord-select-placeholder">
                      {components.selectPlaceholder || "Select a role..."}
                      <span className="discord-select-arrow">▼</span>
                    </div>
                    <div className="discord-select-options">
                      {components.selectOptions.filter(o => o.role_id).map((o, i) => (
                        <div key={i} className="discord-select-option">
                          {o.emoji && <span>{o.emoji}</span>}
                          <span>{o.label || `Role ${o.role_id}`}</span>
                          {o.description && <span className="discord-select-desc">{o.description}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm Button Preview */}
                {components.type === "confirm_button" && (
                  <div className="flex items-center gap-2">
                    <div className="discord-btn-preview"
                      style={{
                        backgroundColor: BTN_STYLE_MAP[components.confirmStyle]?.bg || "#57f287",
                        color: BTN_STYLE_MAP[components.confirmStyle]?.text || "#1a1a1a",
                      }}>
                      {components.confirmLabel || "✅ Confirm"}
                    </div>
                    <span className="text-xs text-gray-500">
                      → &ldquo;{components.confirmMessage}&rdquo;
                      {components.confirmActionType === "role_toggle" && components.confirmRoleId && (
                        <span> + toggle role <code className="text-xs bg-gray-100 px-1 rounded">{components.confirmRoleId}</code></span>
                      )}
                    </span>
                  </div>
                )}

                {((components.type === "role_buttons" && components.roleButtons.filter(b => b.role_id).length === 0) ||
                  (components.type === "link_buttons" && components.linkButtons.filter(b => b.url).length === 0) ||
                  (components.type === "role_select" && components.selectOptions.filter(o => o.role_id).length === 0)) && (
                  <p className="text-xs text-gray-400 italic">Add buttons/options above to see preview</p>
                )}
              </div>
            )}

            {/* JSON preview */}
            <details className="mt-3">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Show JSON payload (for Webhook or /post_embed)</summary>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    const json = JSON.stringify(buildFullPayload(embed, components), null, 2);
                    navigator.clipboard.writeText(json).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition"
                >
                  {copied ? "✅ Copied!" : "📋 Copy JSON"}
                </button>
              </div>
              <pre className="text-xs bg-gray-900 text-green-400 rounded-lg p-3 mt-2 overflow-x-auto max-h-64">
                {JSON.stringify(buildFullPayload(embed, components), null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

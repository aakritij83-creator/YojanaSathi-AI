import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, MessageSquarePlus, Send, Trash2 } from 'lucide-react';
import type { ChatMessageRecord, ConversationRecord } from '../../../backend/types/index.ts';
import { ErrorBanner } from '../components/UiPrimitives.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { apiRequest } from '../services/api.ts';
import { translateVerificationStatus } from '../translations/domainLabels.ts';

export function AiAssistantPage() {
  const { language, t } = useLanguage();
  const suggestedQuestions = [
    t.assistant.suggestedQ1,
    t.assistant.suggestedQ2,
    t.assistant.suggestedQ3,
    t.assistant.suggestedQ4,
  ];
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [input, setInput] = useState('');
  const [includeProfile, setIncludeProfile] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await apiRequest<{ items: ConversationRecord[] }>('/api/ai/conversations');
      setConversations(res.items);
      if (res.items.length > 0 && !activeConvId) {
        setActiveConvId(res.items[0].id);
      }
    } catch {
      // handled cleanly
    }
  }, [activeConvId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    apiRequest<{ messages: ChatMessageRecord[] }>(`/api/ai/conversations/${activeConvId}/messages`)
      .then((res) => setMessages(res.messages))
      .catch(() => setMessages([]));
  }, [activeConvId]);

  const startNewConversation = async () => {
    setError(null);
    const res = await apiRequest<{ item: ConversationRecord }>('/api/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ language }),
    });
    setConversations((prev) => [res.item, ...prev]);
    setActiveConvId(res.item.id);
    setMessages([]);
  };

  const deleteConversation = async (id: string) => {
    await apiRequest(`/api/ai/conversations/${id}`, { method: 'DELETE' });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const prompt = (textToSend ?? input).trim();
    if (!prompt || sending) return;

    setError(null);
    setLastFailedPrompt(null);
    setSending(true);
    if (!textToSend) setInput('');

    try {
      const res = await apiRequest<{
        conversationId: string;
        userMessage: ChatMessageRecord;
        assistantMessage: ChatMessageRecord;
      }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: activeConvId || undefined,
          message: prompt,
          language,
          includeProfile,
        }),
      });

      if (!activeConvId || activeConvId !== res.conversationId) {
        setActiveConvId(res.conversationId);
        await loadConversations();
      }
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
      setLastFailedPrompt(prompt);
    } finally {
      setSending(false);
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <DashboardLayout title={t.assistant.title}>
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Conversation History Sidebar */}
        <section className="rounded-2xl border border-[#E6E1D6] bg-white p-4 lg:col-span-4 dark:border-[#1F2E42] dark:bg-[#111C2B]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold">{t.assistant.conversations}</h2>
            <button
              type="button"
              onClick={startNewConversation}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1D2E] px-3 py-1.5 text-xs font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span>{t.assistant.newChat}</span>
            </button>
          </div>

          <div className="mt-4 space-y-1.5">
            {conversations.length === 0 ? (
              <p className="text-xs text-[#64748B] dark:text-[#8E9BAE]">{t.assistant.noSavedSessions}</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs ${
                    activeConvId === conv.id
                      ? 'bg-[#EFECE4] font-semibold text-[#0F1D2E] dark:bg-[#1A2A3F] dark:text-[#F4F1EA]'
                      : 'text-[#465362] hover:bg-[#FAF8F4] dark:text-[#A9B4C2] dark:hover:bg-[#162334]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveConvId(conv.id)}
                    className="min-w-0 flex-1 truncate text-left"
                  >
                    {conv.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteConversation(conv.id)}
                    aria-label={`${t.assistant.deleteConvAria}: ${conv.title}`}
                    className="shrink-0 p-1 text-[#64748B] hover:text-[#9E3B3B]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 border-t border-[#E6E1D6] pt-4 dark:border-[#1F2E42]">
            <label className="flex items-center gap-2 text-xs text-[#465362] dark:text-[#A9B4C2]">
              <input
                type="checkbox"
                checked={includeProfile}
                onChange={(e) => setIncludeProfile(e.target.checked)}
                className="h-4 w-4 rounded accent-[#1F6F78]"
              />
              <span>{t.assistant.includeProfile}</span>
            </label>
          </div>
        </section>

        {/* Active Chat Panel */}
        <section className="flex min-h-[540px] flex-col justify-between rounded-2xl border border-[#E6E1D6] bg-white p-5 lg:col-span-8 dark:border-[#1F2E42] dark:bg-[#111C2B]">
          <div>
            <p className="text-xs text-[#5B6777] dark:text-[#A9B4C2]">{t.assistant.subtitle}</p>
          </div>

          <div className="my-4 flex-1 space-y-4 overflow-y-auto pr-1 max-h-[460px]">
            {messages.length === 0 ? (
              <div className="py-6">
                <p className="text-sm text-[#465362] dark:text-[#A9B4C2]">{t.assistant.emptyChat}</p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#5F7F6E] dark:text-[#78A08B]">
                  {t.assistant.suggestedTitle}
                </p>
                <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] p-3 text-left text-xs text-[#0F1D2E] transition-colors hover:border-[#1F6F78] dark:border-[#1F2E42] dark:bg-[#0A121C] dark:text-[#F4F1EA]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-2xl p-4 text-sm ${
                    m.role === 'user'
                      ? 'ml-auto max-w-[85%] bg-[#0F1D2E] text-[#FAF8F4] dark:bg-[#1D314A]'
                      : 'mr-auto max-w-[92%] border border-[#E6E1D6] bg-[#FAF8F4] text-[#0F1D2E] dark:border-[#1F2E42] dark:bg-[#0A121C] dark:text-[#F4F1EA]'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-3 border-t border-[#E6E1D6] pt-2.5 text-xs dark:border-[#1F2E42]">
                      <p className="font-semibold text-[#5F7F6E] dark:text-[#78A08B]">{t.assistant.sources}:</p>
                      <ul className="mt-1 space-y-1">
                        {m.citations.map((c) => (
                          <li key={c.schemeName} className="flex flex-wrap items-center gap-2">
                            <a
                              href={c.officialSourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-[#1F6F78] underline dark:text-[#CBB07A]"
                            >
                              <span>{c.schemeName}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <span className="font-mono text-[11px] text-[#64748B]">
                              ({translateVerificationStatus(c.verificationStatus, language)} · {c.lastVerifiedDate})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] opacity-75">
                    <span className="font-mono tabular-nums">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => copyText(m.id, m.content)}
                        className="inline-flex items-center gap-1 hover:opacity-100"
                      >
                        {copiedId === m.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedId === m.id ? t.assistant.copied : t.assistant.copy}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-4 py-3 text-xs text-[#5B6777] dark:border-[#1F2E42] dark:bg-[#0A121C] dark:text-[#A9B4C2]">
                {t.assistant.thinking}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-3">
              <ErrorBanner
                message={error}
                onRetry={lastFailedPrompt ? () => sendMessage(lastFailedPrompt) : undefined}
              />
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2 border-t border-[#E6E1D6] pt-3 dark:border-[#1F2E42]"
          >
            <label htmlFor="ai-chat-input" className="sr-only">
              {t.assistant.placeholder}
            </label>
            <input
              id="ai-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.assistant.placeholder}
              className="flex-1 rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-4 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F1D2E] px-5 py-2.5 text-xs font-semibold text-[#FAF8F4] disabled:opacity-50 dark:bg-[#CBB07A] dark:text-[#0A121C]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{t.assistant.send}</span>
            </button>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

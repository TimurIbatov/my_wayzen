import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Plus, RefreshCw, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetGeminiConversationQueryKey, getGetProfileQueryKey,
  getListGeminiConversationsQueryKey, getSendGeminiMessageUrl,
  useCreateGeminiConversation, useDeleteGeminiConversation,
  useGetGeminiConversation, useGetProfile, useListGeminiConversations,
} from '@workspace/api-client-react';
import type { Conversation } from '@workspace/api-client-react';
import { LoadError } from '@/components/LoadError';
import { showErrorText } from '@/lib/errors';
import { useI18n } from '@/lib/i18n';
import { streamSse } from '@/lib/sse';

type ChatLine = { role: 'user' | 'assistant'; content: string };

export function AIChat() {
  const { t } = useI18n();
  const { isSignedIn } = useAuth();
  const client = useQueryClient();
  const profile = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), enabled: Boolean(isSignedIn) } });
  const histories = useListGeminiConversations({ query: { queryKey: getListGeminiConversationsQueryKey(), enabled: Boolean(isSignedIn), staleTime: 15_000 } });
  const createConversation = useCreateGeminiConversation({ mutation: { onSuccess: () => void client.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() }) } });
  const deleteConversation = useDeleteGeminiConversation({ mutation: { onSuccess: () => void client.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() }) } });
  const [conversationId, setConversationId] = useState<number>();
  const conversation = useGetGeminiConversation(conversationId ?? 0, { query: { queryKey: getGetGeminiConversationQueryKey(conversationId ?? 0), enabled: Boolean(isSignedIn && conversationId) } });
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [chatError, setChatError] = useState('');
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => { if (conversation.data) setMessages(conversation.data.messages.map(message => ({ role: message.role, content: message.content }))); }, [conversation.data?.id, conversation.data?.updatedAt]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);

  const send = async (value = draft) => {
    const text = value.trim(); if (!text || busy || text.length > 2000) return;
    setBusy(true); setDraft(''); setChatError('');
    setMessages(current => [...current, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    try {
      let targetId = conversationId;
      if (isSignedIn && !targetId) {
        const created = await createConversation.mutateAsync({ data: { title: text.slice(0, 80) } });
        targetId = created.id;
      }
      let answer = '';
      const url = isSignedIn && targetId ? getSendGeminiMessageUrl(targetId) : '/api/wayzen/chat';
      const payload = isSignedIn && targetId ? { content: text } : { messages: [...messages, { role: 'user' as const, content: text }].slice(-12) };
      await streamSse(url, payload, chunk => {
        answer += chunk;
        setMessages(current => current.map((message, index) => index === current.length - 1 ? { ...message, content: answer } : message));
      });
      if (isSignedIn && targetId) {
        setConversationId(targetId);
        void client.invalidateQueries({ queryKey: getGetGeminiConversationQueryKey(targetId) });
        void client.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
        void client.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      }
    } catch (error) {
      const message = showErrorText(error); setChatError(message);
      setMessages(current => current.map((item, index) => index === current.length - 1 ? { ...item, content: message } : item));
    } finally { setBusy(false); }
  };

  const startNew = () => { setConversationId(undefined); setMessages([]); setChatError(''); };
  const starters = [t('chat.starter1'), t('chat.starter2'), t('chat.starter3')];
  const quota = !isSignedIn
    ? t('chat.quotaGuest')
    : profile.data?.aiChatLimit === -1
      ? t('chat.quotaPass')
      : profile.data
        ? t('chat.quotaFree', { used: profile.data.aiChatUsedToday, limit: profile.data.aiChatLimit })
        : t('chat.quotaUnknown');

  return (
    <main className="wz-page wz-chat-page" data-testid="page-ai-chat">
      <header className="wz-page-top">
        <span className="wz-dot-label">{t('chat.kicker')}</span>
        <button className="wz-ghost-btn" type="button" onClick={startNew} data-testid="button-new-conversation">
          <RefreshCw size={15} />{t('chat.new')}
        </button>
      </header>

      <div className="wz-chat-stage" ref={log} role="log" aria-live="polite" data-testid="chat-message-list">
        {!messages.length ? (
          <div className="wz-chat-hero">
            <div className="wz-bot-badge" aria-hidden><Bot size={28} /></div>
            <span className="wz-kicker">{t('chat.brandLine')}</span>
            <h1>{t('chat.title')}</h1>
            <p>{t('chat.lead')}</p>
            <div className="wz-starter-block">
              <span className="wz-kicker">{t('chat.startersTitle')}</span>
              <div className="wz-starter-grid">
                {starters.map((prompt, i) => (
                  <button className="wz-starter-card" key={prompt} type="button" onClick={() => void send(prompt)} data-testid={`button-chat-starter-${i}`}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="wz-message-stack">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`message ${message.role}`} data-testid={`chat-message-${message.role}-${index}`}>
                {message.content || (busy && index === messages.length - 1 ? t('chat.typing') : '')}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="unverified wz-quota" role="note" data-testid="text-chat-quota">{quota}</div>
      {chatError && (
        <div className="error-card" role="alert" style={{ margin: '0 0 12px' }} data-testid="status-chat-error">
          {chatError}
          <button className="btn btn-quiet" type="button" onClick={() => void send(messages.filter(item => item.role === 'user').at(-1)?.content ?? '')} data-testid="button-retry-chat">{t('chat.retry')}</button>
        </div>
      )}

      <form className="wz-compose" onSubmit={event => { event.preventDefault(); void send(); }} data-testid="form-chat">
        <textarea
          value={draft}
          maxLength={2000}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }}
          placeholder={t('chat.placeholder')}
          aria-label={t('chat.send')}
          data-testid="input-chat-message"
        />
        <div className="wz-compose-bar">
          <span>{t('chat.hint')}</span>
          <span>{draft.length}/2000</span>
          <button className="wz-send" type="submit" disabled={busy || !draft.trim()} aria-label={t('chat.send')} data-testid="button-send-chat">
            <Send size={16} />
          </button>
        </div>
      </form>

      {isSignedIn && (
        <aside className="wz-chat-history-rail" aria-label={t('chat.new')}>
          <button className="btn btn-quiet" type="button" onClick={startNew} data-testid="button-new-conversation-rail"><Plus size={15} /><MessageCircle size={15} /></button>
          {histories.isLoading ? <div className="skeleton" style={{ height: 48 }} /> : histories.isError ? <LoadError error={histories.error} onRetry={() => void histories.refetch()} /> :
            histories.data?.length ? histories.data.map((item: Conversation) => (
              <div className="wz-hist-row" key={item.id}>
                <button className={`chat-history-item ${conversationId === item.id ? 'active' : ''}`} type="button" onClick={() => { setConversationId(item.id); setChatError(''); }} data-testid={`button-conversation-${item.id}`}>{item.title}</button>
                <button className="icon-btn" type="button" style={{ width: 32, height: 32 }} aria-label={t('nav.signOut')} onClick={() => { if (window.confirm('?')) { deleteConversation.mutate({ id: item.id }); if (conversationId === item.id) startNew(); } }} data-testid={`button-delete-conversation-${item.id}`}><Trash2 size={13} /></button>
              </div>
            )) : <p className="wz-muted">{t('chat.signInHistory')}</p>}
        </aside>
      )}
    </main>
  );
}

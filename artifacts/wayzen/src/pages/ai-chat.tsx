import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Plus, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetGeminiConversationQueryKey, getGetProfileQueryKey,
  getListGeminiConversationsQueryKey, getSendGeminiMessageUrl,
  useCreateGeminiConversation, useDeleteGeminiConversation,
  useGetGeminiConversation, useGetProfile, useListGeminiConversations,
} from '@workspace/api-client-react';
import type { Conversation } from '@workspace/api-client-react';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { showErrorText } from '@/lib/errors';
import { streamSse } from '@/lib/sse';

type ChatLine = { role: 'user' | 'assistant'; content: string };

export function AIChat() {
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
  const starters = ['Где в архиве искать тихую природу?', 'Какие места связаны с ремёслами?', 'Помоги придумать основу самостоятельной поездки.'];
  return <main className="wrap">
    <div className="intro"><span className="eyebrow">Путевой собеседник</span><h1 className="display">Спросите WayZen.</h1><p>AI работает с предварительными зацепками. Он должен явно отмечать неизвестное, а не додумывать расписания, цены, безопасность или доступ.</p></div>
    <ArchiveNotice compact />
    <div className="chat-layout" style={{ marginTop: 18 }}>
      <aside className="chat-history"><button className="btn btn-primary" onClick={startNew} data-testid="button-new-conversation"><Plus size={15} />Новый разговор</button>
        {isSignedIn ? histories.isLoading ? <div className="skeleton" style={{ height: 70 }} /> : histories.isError ? <LoadError error={histories.error} onRetry={() => void histories.refetch()} /> :
          histories.data?.map((item: Conversation) => <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} key={item.id}><button className={`chat-history-item ${conversationId === item.id ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => { setConversationId(item.id); setChatError(''); }} data-testid={`button-conversation-${item.id}`}>{item.title}</button><button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Удалить разговор" onClick={() => { if (window.confirm('Удалить разговор?')) { deleteConversation.mutate({ id: item.id }); if (conversationId === item.id) startNew(); } }} data-testid={`button-delete-conversation-${item.id}`}><Trash2 size={13} /></button></div>) :
            <p style={{ fontSize: 11, color: '#718077' }}>Войдите, чтобы сохранять историю разговоров в аккаунте.</p>}
      </aside>
      <section className="chat-main">
        <div className="chat-head"><span><span className="eyebrow">WayZen · AI-гид</span><br /><strong style={{ font: '600 18px var(--app-font-serif)' }}>{conversation.data?.title ?? 'Новый разговор'}</strong></span><span className="unverified">Архив предварительный</span></div>
         <div className="unverified" role="note" data-testid="text-chat-quota" style={{ margin: '10px 14px 0', justifyContent: 'center' }}>
           {!isSignedIn ? 'Гостевой AI-чат: до 10 сообщений за день по Самарканду.' : profile.data?.aiChatLimit === -1 ? 'Trip Pass: дневного лимита AI-чата нет.' : profile.data ? `Free: ${profile.data.aiChatUsedToday} из ${profile.data.aiChatLimit} сообщений за день по Самарканду.` : 'Лимит зависит от плана аккаунта.'}
         </div>
        <div className="messages" ref={log} role="log" aria-live="polite" data-testid="chat-message-list">
          {!messages.length ? <div style={{ margin: 'auto', maxWidth: 580, textAlign: 'center' }}><div className="empty-icon"><MessageCircle size={22} /></div><h2 style={{ font: '600 30px var(--app-font-serif)' }}>Ищем путь через любопытство.</h2><p style={{ color: '#6a796f', lineHeight: 1.65 }}>Расскажите, что вам интересно. Ответы — идеи для самостоятельной проверки, а не актуальные сведения о местах.</p><div style={{ display: 'grid', gap: 8, marginTop: 19 }}>{starters.map((prompt, i) => <button className="btn btn-quiet" key={prompt} onClick={() => void send(prompt)} data-testid={`button-chat-starter-${i}`}>{prompt}</button>)}</div></div> :
            messages.map((message, index) => <div key={`${index}-${message.role}`} className={`message ${message.role}`} data-testid={`chat-message-${message.role}-${index}`}>{message.content || (busy && index === messages.length - 1 ? 'Пишу ответ…' : '')}</div>)}
        </div>
        {chatError && <div className="error-card" role="alert" style={{ margin: '0 16px 12px' }} data-testid="status-chat-error">{chatError}<button className="btn btn-quiet" onClick={() => void send(messages.filter(item => item.role === 'user').at(-1)?.content ?? '')} data-testid="button-retry-chat">Повторить</button></div>}
        <form className="compose" onSubmit={event => { event.preventDefault(); void send(); }} data-testid="form-chat">
          <div className="compose-inner"><textarea value={draft} maxLength={2000} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Например: какие архивные места подходят для интереса к ремёслам?" aria-label="Сообщение WayZen" data-testid="input-chat-message" /><button className="btn btn-primary" type="submit" disabled={busy || !draft.trim()} aria-label="Отправить сообщение" data-testid="button-send-chat"><Send size={16} /></button></div>
          <div style={{ textAlign: 'right', color: '#78847a', fontSize: 10, paddingRight: 8 }}>{draft.length}/2000 · Shift + Enter — новая строка</div>
        </form>
      </section>
    </div><Footer />
  </main>;
}

export async function streamSse(url: string, payload: unknown, onChunk: (chunk: string) => void) {
  const response = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify(payload) });
  if (!response.ok) { let message = 'Не удалось получить ответ. Попробуйте ещё раз.'; try { const body = await response.json() as { error?: string }; if (body.error) message = body.error; } catch { /* Error may not be JSON. */ } throw new Error(message); }
  if (!response.body) throw new Error('Поток ответа недоступен. Попробуйте ещё раз.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = ''; let completed = false;
  while (!completed) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const frames = buffer.split(/\r?\n\r?\n/); buffer = frames.pop() ?? '';
    for (const frame of frames) {
      const data = frame.split(/\r?\n/).find(line => line.startsWith('data:'))?.slice(5).trim();
      if (!data) continue;
      try { const item = JSON.parse(data) as { content?: string; done?: boolean; error?: string }; if (item.content) onChunk(item.content); if (item.error) throw new Error(item.error); if (item.done) completed = true; }
      catch (error) { if (error instanceof SyntaxError) continue; throw error; }
    }
    if (done) break;
  }
  if (buffer.trim()) {
    const data = buffer.split(/\r?\n/).find(line => line.startsWith('data:'))?.slice(5).trim();
    if (data) try { const item = JSON.parse(data) as { content?: string; error?: string }; if (item.content) onChunk(item.content); if (item.error) throw new Error(item.error); } catch (error) { if (!(error instanceof SyntaxError)) throw error; }
  }
}

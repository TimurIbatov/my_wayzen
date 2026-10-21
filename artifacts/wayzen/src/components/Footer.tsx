import { getHealthCheckQueryKey, useHealthCheck } from '@workspace/api-client-react';

export function Footer() {
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60_000 } });
  return <footer className="footer"><div className="footer-inner"><span>WAYZEN · Uzbekistan, at your own pace.</span><span>50 preliminary archive entries · not verified · confirm conditions locally.</span><span data-testid="status-api-health">{health.isLoading ? 'Проверяем подключение…' : health.isError ? 'Сервис сейчас недоступен' : `API: ${health.data?.status ?? 'готов'}`}</span></div></footer>;
}

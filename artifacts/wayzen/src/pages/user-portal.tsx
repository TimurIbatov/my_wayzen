import { ArrowRight, Compass, MapPin, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  getGetOverviewQueryKey,
  getGetProfileQueryKey,
  useGetOverview,
  useGetProfile,
} from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { EmptyState } from '@/components/EmptyState';
import { LoadError } from '@/components/LoadError';
import { LoadingCards } from '@/components/LoadingCards';
import { PlaceCard } from '@/components/PlaceCard';
import { useFavoritesState } from '@/hooks/use-favorites';
import { fetchRecommendedPlaces } from '@/lib/recommended';
import { useI18n } from '@/lib/i18n';

export function UserPortal() {
  const { t } = useI18n();
  const favorites = useFavoritesState();
  const profile = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), enabled: true } });
  const overview = useGetOverview({ query: { queryKey: getGetOverviewQueryKey() } });
  const recommended = useQuery({
    queryKey: ['places', 'recommended', profile.data?.interests?.join('|') ?? ''],
    queryFn: fetchRecommendedPlaces,
    enabled: Boolean(profile.data),
    staleTime: 30_000,
  });

  const featured = overview.data?.featuredPlaces?.slice(0, 4) ?? [];
  const interests = profile.data?.interests ?? [];
  const recPlaces = recommended.data?.places ?? [];
  const mode = recommended.data?.mode;
  const showPersonalized = mode === 'personalized' && recPlaces.length > 0;

  return (
    <main className="wz-page" data-testid="page-user-portal">
      <div className="wz-intro">
        <span className="wz-kicker">Для вас</span>
        <h1>Места по вашим интересам</h1>
        <p>
          Подборка строится по пересечению сохранённых предпочтений с категорией и тегами архива —
          без «магии» и без смены статуса preliminary.
        </p>
      </div>

      <ArchiveNotice compact />

      {profile.isLoading || recommended.isLoading ? (
        <LoadingCards count={4} />
      ) : profile.isError ? (
        <LoadError error={profile.error} onRetry={() => void profile.refetch()} />
      ) : recommended.isError ? (
        <LoadError error={recommended.error} onRetry={() => void recommended.refetch()} />
      ) : showPersonalized ? (
        <section className="section" data-testid="section-recommended">
          <div className="section-head">
            <div>
              <span className="eyebrow">Рекомендации</span>
              <h2>Подобрано по интересам</h2>
              <p className="wz-muted" style={{ marginTop: 8 }}>
                Интересы: {interests.join(' · ')}
              </p>
            </div>
            <Link href="/profile" className="btn btn-quiet" data-testid="link-edit-prefs">
              Изменить <ArrowRight size={15} />
            </Link>
          </div>
          <div className="place-grid">
            {recPlaces.map((place, i) => (
              <div key={place.slug} className="wz-rec-card" data-testid={`card-rec-${place.slug}`}>
                <PlaceCard
                  place={place}
                  index={i}
                  saved={favorites.values.includes(place.slug)}
                  onSave={() => favorites.toggle(place.slug)}
                />
                {place.matchReasons?.length ? (
                  <p className="wz-rec-reasons" data-testid={`text-rec-reasons-${place.slug}`}>
                    Почему в подборке: {place.matchReasons.join(' · ')}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="wz-panel" data-testid="section-recs-empty" style={{ marginTop: 18 }}>
          <span className="wz-kicker">Предпочтения</span>
          <h2>
            {mode === 'no_matches'
              ? 'Пока нет точных совпадений в архиве'
              : 'Сначала выберите интересы'}
          </h2>
          <p className="wz-muted">
            {mode === 'no_matches'
              ? 'В каталоге мало мест под текущие интересы. Расширьте предпочтения или откройте полный атлас — все карточки остаются preliminary.'
              : 'После онбординга или в профиле отметьте природу, наследие, ремёсла и другое — главная покажет объяснимую подборку из архива.'}
          </p>
          <div className="feature-actions" style={{ marginTop: 16 }}>
            <Link className="btn btn-primary" href="/onboarding" data-testid="link-portal-onboarding">
              {interests.length ? 'Обновить интересы' : 'Пройти онбординг'} <ArrowRight size={15} />
            </Link>
            <Link className="btn btn-quiet" href="/places" data-testid="link-portal-atlas">
              Открыть атлас
            </Link>
          </div>
        </section>
      )}

      {!showPersonalized && (
        <section className="section" data-testid="section-featured-fallback">
          <div className="section-head">
            <div>
              <span className="eyebrow">Архив</span>
              <h2>Несколько мест из каталога</h2>
              <p className="wz-muted" style={{ marginTop: 8 }}>
                Общая витрина (не персональная). Для гостей и до выбора интересов.
              </p>
            </div>
            <Link href="/places" className="btn btn-quiet">
              Все места <ArrowRight size={15} />
            </Link>
          </div>
          {overview.isLoading ? (
            <LoadingCards count={4} />
          ) : featured.length ? (
            <div className="place-grid">
              {featured.map((place, i) => (
                <PlaceCard
                  key={place.slug}
                  place={place}
                  index={i}
                  saved={favorites.values.includes(place.slug)}
                  onSave={() => favorites.toggle(place.slug)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MapPin size={22} />}
              title="Каталог пока пуст"
              copy="Когда записи появятся в архиве, они будут здесь."
            />
          )}
        </section>
      )}

      <section className="feature-band" style={{ marginTop: 28 }}>
        <div>
          <span className="eyebrow">Дальше</span>
          <h2>Соберите поездку или спросите AI-гид</h2>
          <p>
            Рекомендации — только ранжирование архива. Часы, цены и безопасность по-прежнему нужно
            проверять самостоятельно.
          </p>
        </div>
        <div className="feature-actions">
          <Link href="/planner" className="btn btn-quiet" data-testid="link-portal-planner">
            <Compass size={15} /> Планер
          </Link>
          <Link href="/ai" className="btn btn-primary" data-testid="link-portal-ai">
            <Sparkles size={15} /> {t('nav.ai')} <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}

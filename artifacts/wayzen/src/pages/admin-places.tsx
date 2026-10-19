import { useEffect, useState } from 'react';
import { MapPin, Plus, ShieldAlert, Trash2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetPlaceQueryKey, getGetProfileQueryKey, getGetStorageObjectUrl,
  getListAdminPlacesQueryKey, getListPlacesQueryKey,
  useCreatePlace, useDeletePlace, useGetProfile, useListAdminPlaces,
  useRequestUploadUrl, useUpdatePlace,
} from '@workspace/api-client-react';
import type { Place, PlaceInput, PlaceUpdate } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import {
  Form, FormControl, FormField, FormItem, FormLabel,
} from '@/components/ui/form';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { showErrorText } from '@/lib/errors';
import { placeName } from '@/lib/place';

type AdminForm = {
  slug: string; nameRu: string; nameEn: string; nameUz: string; latitude: number; longitude: number;
  region: string; category: string; kind: string; summaryRu: string; summaryEn: string;
  storyRu: string; storyEn: string; practicalNotesRu: string; practicalNotesEn: string;
  imageUrls: string; tags: string; seasonality: string; accessDifficulty: string;
  verificationStatus: 'draft' | 'preliminary' | 'verified' | 'stale'; source: string;
};
const adminBlank: AdminForm = { slug: '', nameRu: '', nameEn: '', nameUz: '', latitude: 0, longitude: 0, region: '', category: '', kind: '', summaryRu: '', summaryEn: '', storyRu: '', storyEn: '', practicalNotesRu: '', practicalNotesEn: '', imageUrls: '', tags: '', seasonality: '', accessDifficulty: '', verificationStatus: 'draft', source: '' };
function adminValues(place?: Place): AdminForm {
  return place ? { slug: place.slug, nameRu: place.nameRu, nameEn: place.nameEn, nameUz: place.nameUz ?? '', latitude: place.latitude, longitude: place.longitude, region: place.region, category: place.category, kind: place.kind, summaryRu: place.summaryRu, summaryEn: place.summaryEn, storyRu: place.storyRu, storyEn: place.storyEn, practicalNotesRu: place.practicalNotesRu, practicalNotesEn: place.practicalNotesEn, imageUrls: place.imageUrls.join('\n'), tags: place.tags.join(', '), seasonality: place.seasonality.join(', '), accessDifficulty: place.accessDifficulty, verificationStatus: place.verificationStatus, source: place.source } : adminBlank;
}
async function optimizeAdminImage(file: File): Promise<File> {
  if (file.size > 25 * 1024 * 1024) throw new Error('Исходный файл больше 25 МБ.');
  if (typeof createImageBitmap !== 'function') return file;
  const bitmap = await createImageBitmap(file);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / bitmap.width, maxDimension / bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) { bitmap.close(); return file; }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.82));
  if (!blob) return file;
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'wayzen-photo';
  return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
}

export function AdminPlaces() {
  const { isSignedIn } = useAuth();
  const client = useQueryClient();
  const profile = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), enabled: Boolean(isSignedIn) } });
  const admin = useListAdminPlaces({ query: { queryKey: getListAdminPlacesQueryKey(), enabled: Boolean(isSignedIn && profile.data?.isAdmin) } });
  const create = useCreatePlace({ mutation: { onSuccess: () => { void client.invalidateQueries({ queryKey: getListAdminPlacesQueryKey() }); void client.invalidateQueries({ queryKey: getListPlacesQueryKey() }); } } });
  const update = useUpdatePlace({ mutation: { onSuccess: (place) => { void client.invalidateQueries({ queryKey: getListAdminPlacesQueryKey() }); void client.invalidateQueries({ queryKey: getListPlacesQueryKey() }); void client.invalidateQueries({ queryKey: getGetPlaceQueryKey(place.slug) }); } } });
  const remove = useDeletePlace({ mutation: { onSuccess: () => { void client.invalidateQueries({ queryKey: getListAdminPlacesQueryKey() }); void client.invalidateQueries({ queryKey: getListPlacesQueryKey() }); } } });
  const requestUploadUrl = useRequestUploadUrl();
  const [editing, setEditing] = useState<Place | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const form = useForm<AdminForm>({ defaultValues: adminBlank });
  const previewUrls = form.watch('imageUrls').split('\n').map(item => item.trim()).filter(Boolean);
  useEffect(() => { form.reset(adminValues(editing ?? undefined)); }, [editing, creating, form]);
  const uploadPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setUploadError('');
    try {
      for (const original of Array.from(files)) {
        const file = await optimizeAdminImage(original);
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
        if (!allowedTypes.includes(file.type as typeof allowedTypes[number])) {
          throw new Error('Поддерживаются JPG, PNG и WebP.');
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('После сжатия фото должно быть не больше 10 МБ.');
        }
        const signed = await requestUploadUrl.mutateAsync({
          data: { name: file.name, size: file.size, contentType: file.type as typeof allowedTypes[number] },
        });
        const uploaded = await fetch(signed.uploadURL, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!uploaded.ok) throw new Error('Хранилище не приняло фото. Попробуйте загрузить его ещё раз.');
        const path = getGetStorageObjectUrl(signed.objectPath.replace(/^\/objects\//, ''));
        const current = form.getValues('imageUrls').split('\n').map(item => item.trim()).filter(Boolean);
        if (!current.includes(path)) form.setValue('imageUrls', [...current, path].join('\n'), { shouldDirty: true });
      }
    } catch (error) {
      setUploadError(showErrorText(error));
    } finally {
      setUploading(false);
    }
  };
  if (!isSignedIn) return <main className="wrap load-shell"><EmptyState icon={<ShieldAlert />} title="Нужен вход" copy="Модерация доступна только авторизованным пользователям с ролью администратора." action={<Link className="btn btn-primary" href="/sign-in">Войти</Link>} /></main>;
  if (profile.isLoading) return <main className="wrap load-shell"><div className="skeleton" style={{ height: 250 }} /></main>;
  if (!profile.data?.isAdmin) return <main className="wrap load-shell"><EmptyState icon={<ShieldAlert />} title="Доступ закрыт" copy="У этого аккаунта нет прав модератора." action={<Link className="btn btn-quiet" href="/">На главную</Link>} /></main>;
  const submit = form.handleSubmit(values => {
    const common = {
      nameRu: values.nameRu, nameEn: values.nameEn, nameUz: values.nameUz || null, latitude: Number(values.latitude), longitude: Number(values.longitude),
      region: values.region, category: values.category, kind: values.kind, summaryRu: values.summaryRu, summaryEn: values.summaryEn,
      storyRu: values.storyRu, storyEn: values.storyEn, practicalNotesRu: values.practicalNotesRu, practicalNotesEn: values.practicalNotesEn,
      imageUrls: values.imageUrls.split('\n').map(item => item.trim()).filter(Boolean), tags: values.tags.split(',').map(item => item.trim()).filter(Boolean),
      seasonality: values.seasonality.split(',').map(item => item.trim()).filter(Boolean), accessDifficulty: values.accessDifficulty,
      verificationStatus: values.verificationStatus, source: values.source,
    };
    if (editing) { const { nameRu, nameEn, ...rest } = common; const patch: PlaceUpdate = { ...rest, nameRu, nameEn }; update.mutate({ slug: editing.slug, data: patch }); }
    else { const data: PlaceInput = { slug: values.slug, ...common }; create.mutate({ data }); }
    setEditing(null); setCreating(false);
  });
  const busy = create.isPending || update.isPending;
  return <main className="wrap">
    <div className="intro"><span className="eyebrow">WayZen · администрация</span><h1 className="display">Модерация мест.</h1><p>Изменения архивных записей сохраняются через модерационные API. Статус «проверено» должен означать реальную редакционную проверку, а не косметическое действие.</p></div>
    <ArchiveNotice compact />
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginTop: 18 }}><span className="unverified">{admin.data?.length ?? 0} записей · проверка данных обязательна</span><button className="btn btn-primary" onClick={() => { setEditing(null); setCreating(true); }} data-testid="button-create-place"><Plus size={15} />Новая запись</button></div>
    {(creating || editing) && <section className="panel" style={{ marginTop: 16 }}><div className="section-head"><h2>{editing ? `Изменить: ${placeName(editing)}` : 'Новая запись'}</h2><button className="icon-btn" onClick={() => { setEditing(null); setCreating(false); }} aria-label="Закрыть редактор" data-testid="button-close-editor"><X size={17} /></button></div>
      <Form {...form}><form onSubmit={submit} data-testid="form-admin-place"><div className="form-grid">
        {([
          ['slug', 'Slug'], ['nameRu', 'Название (RU)'], ['nameEn', 'Название (EN)'], ['nameUz', 'Название (UZ)'], ['latitude', 'Широта'], ['longitude', 'Долгота'], ['region', 'Область'], ['category', 'Категория'], ['kind', 'Тип'], ['accessDifficulty', 'Доступность (исходная запись)'], ['source', 'Источник'],
          ['summaryRu', 'Описание (RU)'], ['summaryEn', 'Описание (EN)'], ['storyRu', 'История (RU)'], ['storyEn', 'История (EN)'], ['practicalNotesRu', 'Заметки (RU)'], ['practicalNotesEn', 'Заметки (EN)'], ['tags', 'Теги, через запятую'], ['seasonality', 'Сезонность, через запятую'], ['imageUrls', 'Ссылки на фото, по одной на строку'],
        ] as const).map(([name, label]) => <FormField key={name} control={form.control} name={name} render={({ field }) => <FormItem className="field-label"><FormLabel>{label}</FormLabel><FormControl>{name === 'storyRu' || name === 'storyEn' || name.includes('Notes') || name.includes('summary') || name === 'imageUrls' ? <textarea className="textarea" {...field} value={String(field.value ?? '')} data-testid={`input-admin-${name}`} /> : <input className="field" {...field} type={name === 'latitude' || name === 'longitude' ? 'number' : 'text'} step={name === 'latitude' || name === 'longitude' ? 'any' : undefined} value={String(field.value ?? '')} data-testid={`input-admin-${name}`} />}</FormControl></FormItem>} />)}
        <FormField control={form.control} name="verificationStatus" render={({ field }) => <FormItem className="field-label"><FormLabel>Статус проверки</FormLabel><FormControl><select className="select" {...field} data-testid="select-admin-verification"><option value="draft">Черновик</option><option value="preliminary">Предварительно</option><option value="verified">Проверено</option><option value="stale">Устарело</option></select></FormControl></FormItem>} />
        <div className="field-label" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="admin-photo-upload">Загрузить фото</label>
          <input id="admin-photo-upload" className="field" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={event => { void uploadPhotos(event.target.files); event.target.value = ''; }} data-testid="input-admin-photo-upload" />
          <small>Фото уменьшается до 1600 px и WebP, затем загружается через <code>/api/storage/uploads/request-url</code> в App Storage. URL добавляется в поле «Ссылки на фото». JPG, PNG или WebP; до 10 МБ после сжатия.</small>
          {uploading && <p role="status">Оптимизируем и загружаем фото…</p>}
          {uploadError && <p role="alert" data-testid="status-admin-photo-error">{uploadError}</p>}
          {previewUrls.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginTop: 10 }} data-testid="admin-photo-preview">
            {previewUrls.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`Превью ${index + 1}`} loading="lazy" style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 10, background: '#e6e9e2' }} onError={event => { event.currentTarget.style.display = 'none'; }} />)}
          </div>}
        </div>
      </div><button type="submit" disabled={busy || uploading} className="btn btn-primary" data-testid="button-save-place">{busy ? 'Сохраняем…' : uploading ? 'Загружаем фото…' : 'Сохранить запись'}</button></form></Form>
    </section>}
    {admin.isLoading ? <div className="load-shell"><div className="skeleton" style={{ height: 280 }} /></div> : admin.isError ? <div style={{ marginTop: 16 }}><LoadError error={admin.error} onRetry={() => void admin.refetch()} /></div> :
      admin.data?.length ? <section className="section">{admin.data.map(place => <div className="trip-row" key={place.slug}><span className="trip-index"><MapPin size={18} /></span><span className="trip-copy"><strong>{placeName(place)}</strong><span>{place.slug} · {place.region} · {place.verificationStatus}</span></span><button className="btn btn-quiet" onClick={() => { setCreating(false); setEditing(place); }} data-testid={`button-edit-place-${place.slug}`}>Изменить</button><button className="icon-btn" aria-label="Удалить место" onClick={() => { if (window.confirm(`Удалить запись «${placeName(place)}»?`)) remove.mutate({ slug: place.slug }); }} data-testid={`button-delete-place-${place.slug}`}><Trash2 size={16} /></button></div>)}</section> :
        <div style={{ marginTop: 18 }}><EmptyState icon={<MapPin />} title="Архив пока пуст" copy="Добавьте первую запись только на основе подтверждённого источника." /></div>}
    <Footer />
  </main>;
}

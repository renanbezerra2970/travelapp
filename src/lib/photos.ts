import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export const PHOTO_LIMIT = 20;
const BUCKET = 'trip-photos';
/** Lado maior após compressão: bom para vídeo 4K vertical e leve para subir no 4G */
const MAX_SIDE = 2560;

export type TripPhoto = {
  id: string;
  trip_id: string;
  user_id: string;
  day: string; // "31/10"
  path: string;
  caption: string | null;
  taken_at: string | null;
  lat: number | null;
  lng: number | null;
  width: number | null;
  height: number | null;
  favorite: boolean;
  created_at: string;
};

export const dayFolder = (day: string) => day.replace('/', '-');

/** Miniatura ao lado do arquivo: {uuid}.jpg → {uuid}_t.jpg */
export const thumbPath = (path: string) => path.replace(/\.\w+$/, '_t.jpg');

function toJpeg(bmp: ImageBitmap, maxSide: number, quality: number) {
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  return new Promise<{ blob: Blob; width: number; height: number }>((res, rej) =>
    canvas.toBlob((b) => (b ? res({ blob: b, width: w, height: h }) : rej(new Error('falha ao comprimir'))), 'image/jpeg', quality),
  );
}

/** Redimensiona e converte para JPEG no próprio aparelho, e gera a miniatura */
async function compress(file: File) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions).catch(() => null);
  if (!bmp) throw new Error('Formato de foto não suportado neste aparelho. Tente exportar como JPEG.');
  const main = await toJpeg(bmp, MAX_SIDE, 0.86);
  const thumb = await toJpeg(bmp, 480, 0.75);
  bmp.close();
  return { ...main, thumb: thumb.blob };
}

export async function uploadPhoto(opts: { tripId: string; userId: string; day: string; file: File; caption?: string; at?: { lat: number; lng: number } | null }) {
  const { tripId, userId, day, file, caption, at } = opts;
  const { blob, width, height, thumb } = await compress(file);
  const path = `${tripId}/${userId}/${dayFolder(day)}/${crypto.randomUUID()}.jpg`;
  const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (up.error) throw new Error(up.error.message);
  await supabase.storage.from(BUCKET).upload(thumbPath(path), thumb, { contentType: 'image/jpeg', upsert: false });
  const { data, error } = await supabase
    .from('trip_photos')
    .insert({
      trip_id: tripId,
      user_id: userId,
      day,
      path,
      caption: caption?.trim() || null,
      taken_at: file.lastModified ? new Date(file.lastModified).toISOString() : null,
      lat: at?.lat ?? null,
      lng: at?.lng ?? null,
      width: width || null,
      height: height || null,
    })
    .select()
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([path, thumbPath(path)]);
    throw new Error(error.message.includes('limite') ? `Limite de ${PHOTO_LIMIT} fotos por dia atingido.` : error.message);
  }
  return data as TripPhoto;
}

export async function deletePhoto(p: TripPhoto) {
  await supabase.from('trip_photos').delete().eq('id', p.id);
  await supabase.storage.from(BUCKET).remove([p.path, thumbPath(p.path)]);
}

export async function updatePhoto(id: string, patch: Partial<Pick<TripPhoto, 'caption' | 'favorite'>>) {
  await supabase.from('trip_photos').update(patch).eq('id', id);
}

// URLs assinadas (bucket privado), em lote e com cache
const urlCache = new Map<string, { url: string; exp: number }>();
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const missing = [...new Set(paths)].filter((p) => !((urlCache.get(p)?.exp ?? 0) > now));
  for (let i = 0; i < missing.length; i += 100) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(missing.slice(i, i + 100), 3600);
    data?.forEach((d) => d.signedUrl && d.path && urlCache.set(d.path, { url: d.signedUrl, exp: now + 3500_000 }));
  }
  return Object.fromEntries(paths.map((p) => [p, urlCache.get(p)?.url ?? '']));
}

/** Fotos da viagem com atualização em tempo real */
export function useTripPhotos(tripId: string | null) {
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!tripId || tripId === 'demo') return setLoading(false);
    const { data } = await supabase.from('trip_photos').select('*').eq('trip_id', tripId).order('taken_at', { ascending: true, nullsFirst: false });
    setPhotos((data as TripPhoto[]) ?? []);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    reload();
    if (!tripId || tripId === 'demo') return;
    const ch = supabase
      .channel(`photos-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_photos', filter: `trip_id=eq.${tripId}` }, (p) => {
        if (p.eventType === 'DELETE') setPhotos((s) => s.filter((x) => x.id !== (p.old as TripPhoto).id));
        else {
          const n = p.new as TripPhoto;
          setPhotos((s) => (s.some((x) => x.id === n.id) ? s.map((x) => (x.id === n.id ? n : x)) : [...s, n]));
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [tripId, reload]);

  return { photos, setPhotos, loading, reload };
}

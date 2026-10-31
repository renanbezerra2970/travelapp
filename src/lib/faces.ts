import { supabase } from './supabase';

const BUCKET = 'avatars';
const SIZE = 640;

/** Recorte quadrado da foto do rosto, um pouco acima do centro (onde costuma ficar o rosto) */
export async function cropFace(file: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions).catch(() => null);
  if (!bmp) throw new Error('Não foi possível ler esta foto. Tente outra (JPEG ou PNG).');
  const side = Math.min(bmp.width, bmp.height);
  const sx = (bmp.width - side) / 2;
  const sy = bmp.height > bmp.width ? Math.max(0, (bmp.height - side) * 0.3) : 0;
  const c = document.createElement('canvas');
  c.width = c.height = Math.min(SIZE, side);
  c.getContext('2d')!.drawImage(bmp, sx, sy, side, side, 0, 0, c.width, c.height);
  bmp.close();
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('falha ao processar a foto'))), 'image/jpeg', 0.88));
}

/** Sobe a foto e grava no perfil; o nome do arquivo muda a cada troca (evita cache antigo) */
export async function uploadFace(userId: string, blob: Blob, previous?: string | null): Promise<string> {
  const path = `${userId}/${Date.now()}.jpg`;
  const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
  if (up.error) throw new Error(up.error.message);
  const { error } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', userId);
  if (error) throw new Error(error.message);
  if (previous) supabase.storage.from(BUCKET).remove([previous]).then(() => {});
  window.dispatchEvent(new Event('profile-updated'));
  return path;
}

const cache = new Map<string, { url: string; exp: number }>();
export async function faceUrls(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const missing = [...new Set(paths)].filter((p) => !((cache.get(p)?.exp ?? 0) > now));
  if (missing.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(missing, 3600);
    data?.forEach((d) => d.signedUrl && d.path && cache.set(d.path, { url: d.signedUrl, exp: now + 3500_000 }));
  }
  return Object.fromEntries(paths.map((p) => [p, cache.get(p)?.url ?? '']));
}

export const initials = (name?: string) =>
  (name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

/** HTML do rosto para marcadores do mapa (fora do React) */
export function faceHtml(name: string | undefined, url?: string) {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  return url ? `<img src="${esc(url)}" alt="" draggable="false">` : `<b>${esc(initials(name))}</b>`;
}

// ─── CMS DATA ACCESS — MEDIA (SUPABASE STORAGE + TABLE) ──────────────────────
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import { list, create, remove, update } from './_base';

const NOT_CONFIGURED = { data: null, error: 'Supabase is not configured.' };
const TABLE = 'media';
const BUCKET = 'media';

export async function listMedia({ search, limit: lim = 60 } = {}) {
  const res = await list(TABLE, { orderField: 'created_at', orderDir: 'desc', lim });
  if (res.error) return res;
  let items = res.data;
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(m => m.file_name?.toLowerCase().includes(s));
  }
  return { data: items, error: null, count: items.length };
}

export async function uploadMedia(file, { altText = '', userId } = {}) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  try {
    const client = getSupabaseClient();
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await client.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000',
    });
    if (upErr) return { data: null, error: upErr.message };

    const { data: pub } = client.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub?.publicUrl;

    let width = null, height = null;
    if (typeof window !== 'undefined' && file.type?.startsWith('image/')) {
      try {
        const dims = await new Promise((res, rej) => {
          const img = new window.Image();
          img.onload = () => res({ width: img.width, height: img.height });
          img.onerror = rej;
          img.src = URL.createObjectURL(file);
        });
        width = dims.width;
        height = dims.height;
      } catch { /* non-fatal */ }
    }

    return create(TABLE, {
      storage_path: path,
      public_url: publicUrl,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      width, height,
      alt_text: altText,
      uploaded_by: userId || null,
    }, { userId });
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function deleteMedia(id, storagePath) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  try {
    const client = getSupabaseClient();
    if (storagePath) {
      await client.storage.from(BUCKET).remove([storagePath]);
    }
    return remove(TABLE, id);
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function replaceMedia(id, storagePath, newFile, opts = {}) {
  const del = await deleteMedia(id, storagePath);
  if (del.error) return del;
  return uploadMedia(newFile, opts);
}

export async function updateMediaAltText(id, altText) {
  return update(TABLE, id, { alt_text: altText }, {});
}

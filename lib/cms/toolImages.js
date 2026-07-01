// lib/cms/toolImages.js — Supabase Storage upload for tool logos & screenshots
// Returns { url, storagePath } or { error }
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';

const BUCKET = 'media';

function makeKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function uploadTo(file, path) {
  const client = getSupabaseClient();
  const { error: upErr } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
  });
  if (upErr) return { url: null, storagePath: null, error: upErr.message };
  const { data: pub } = client.storage.from(BUCKET).getPublicUrl(path);
  return { url: pub?.publicUrl || null, storagePath: path, error: null };
}

export async function uploadToolLogo(file, toolSlug) {
  if (!isSupabaseConfigured()) return { error: 'Supabase not configured.' };
  try {
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `tools/${toolSlug}/logo-${makeKey()}.${ext}`;
    return uploadTo(file, path);
  } catch (err) {
    return { url: null, storagePath: null, error: err.message };
  }
}

export async function uploadToolScreenshot(file, toolSlug) {
  if (!isSupabaseConfigured()) return { error: 'Supabase not configured.' };
  try {
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `tools/${toolSlug}/screenshots/${makeKey()}.${ext}`;
    return uploadTo(file, path);
  } catch (err) {
    return { url: null, storagePath: null, error: err.message };
  }
}

export async function deleteStorageFile(storagePath) {
  if (!isSupabaseConfigured() || !storagePath) return;
  try {
    const client = getSupabaseClient();
    await client.storage.from(BUCKET).remove([storagePath]);
  } catch (err) {
    console.error('Storage delete failed:', err.message);
  }
}

import { Buffer } from "buffer";
import { createClient } from "@supabase/supabase-js";

export type StoredObject = {
  storageKey: string;
  storageData?: Buffer | null;
  backend: "supabase" | "database";
};

export type StorageUploadInput = {
  key: string;
  bytes: Buffer;
  contentType: string;
};

export type StorageDownloadInput = {
  key: string;
  fallbackData?: Uint8Array | Buffer | null;
};

function supabaseStorageConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET || "career-documents";
  if (!url || !serviceRole || !bucket) return null;
  return { url, serviceRole, bucket };
}

function supabaseStorageClient() {
  const config = supabaseStorageConfig();
  if (!config) return null;
  const client = createClient(config.url, config.serviceRole, { auth: { persistSession: false } });
  return { client, bucket: config.bucket };
}

export function isCloudStorageConfigured() {
  return Boolean(supabaseStorageConfig());
}

export async function storeUploadedObject(input: StorageUploadInput): Promise<StoredObject> {
  const storage = supabaseStorageClient();
  if (!storage) {
    return { storageKey: input.key, storageData: input.bytes, backend: "database" };
  }

  const { error } = await storage.client.storage.from(storage.bucket).upload(input.key, input.bytes, {
    contentType: input.contentType || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    return { storageKey: input.key, storageData: input.bytes, backend: "database" };
  }

  return { storageKey: input.key, storageData: null, backend: "supabase" };
}

export async function readStoredObject(input: StorageDownloadInput): Promise<Buffer | null> {
  if (input.fallbackData) return Buffer.from(input.fallbackData);

  const storage = supabaseStorageClient();
  if (!storage) return null;

  const { data, error } = await storage.client.storage.from(storage.bucket).download(input.key);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}


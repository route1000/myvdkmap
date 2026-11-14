import { env } from "cloudflare:workers";
export async function savePhoto(value: string) {
  const m = /^data:(image\/[\w.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!m) return value;
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length > 2_000_000) throw new Error("Размер фото превышает 2 МБ");
  const key = `issues/${crypto.randomUUID()}`;
  await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: m[1] } });
  return `r2:${key}`;
}
export async function deletePhoto(value: string) {
  if (value.startsWith("r2:")) await env.BUCKET.delete(value.slice(3));
}
export async function readStoredPhoto(value: string) {
  if (!value.startsWith("r2:")) return null;
  const obj = await env.BUCKET.get(value.slice(3));
  if (!obj) return null;
  return new Response(obj.body as ReadableStream, { headers: { "Content-Type":obj.httpMetadata?.contentType ?? "application/octet-stream", "X-Content-Type-Options":"nosniff", "Content-Security-Policy":"default-src 'none'; sandbox", "Cache-Control":"private, max-age=3600" } });
}

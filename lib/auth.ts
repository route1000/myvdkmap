// Server auth (§5.8): scrypt passwords, random session token in an httpOnly cookie, only its SHA-256 in the DB.
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import type { User } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;
const SESSION_COOKIE = "vdk_session";
const SESSION_DAYS = 30;

// --- validation ---
const email = z.string({ error: "Укажите почту" }).trim().toLowerCase().pipe(z.email("Проверьте адрес почты").max(200, "Слишком длинная почта"));
export const PasswordSchema = z
  .string({ error: "Укажите пароль" })
  .min(8, "Пароль — не короче 8 символов")
  .max(200, "Пароль — не длиннее 200 символов");
export const NameSchema = z.string({ error: "Укажите имя" }).trim().min(1, "Укажите имя").max(80, "Имя — не длиннее 80 символов");

export const RegisterSchema = z.object({ email, password: PasswordSchema, name: NameSchema });
export const LoginSchema = z.object({ email, password: z.string({ error: "Укажите пароль" }).min(1, "Укажите пароль").max(200) });

// --- passwords ---
const ITERATIONS = 100_000;
async function derivePassword(password: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations }, key, 256);
  return Buffer.from(bits);
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await derivePassword(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${salt}$${hash.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts[0] === "pbkdf2") {
    const [, rounds, salt, hex] = parts;
    if (Number(rounds) !== ITERATIONS || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{64}$/.test(hex ?? "")) return false;
    return timingSafeEqual(Buffer.from(hex, "hex"), await derivePassword(password, salt, ITERATIONS));
  }
  // Existing Node installations can still verify their original scrypt hashes.
  const [scheme, salt, hex] = parts;
  if (scheme !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(hex ?? "")) return false;
  try { return timingSafeEqual(Buffer.from(hex, "hex"), await scryptAsync(password, salt, KEY_LENGTH)); }
  catch { return false; }
}

// --- sessions ---
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.session.create({ data: { id: sha256(token), userId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Secure only over HTTPS (nginx sets X-Forwarded-Proto), so login also works on a plain-HTTP server.
    secure: (await headers()).get("x-forwarded-proto") === "https",
    path: "/",
    expires: expiresAt,
  });
}

/** The signed-in user, or null (no cookie, unknown or expired session). */
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { id: sha256(token) }, include: { user: true } });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.user;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

/** What the client sees about the user. */
export const publicUser = (u: User) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  phone: u.phone,
  verified: u.verified,
  esia: u.esiaId !== null,
  hasPassword: u.passwordHash !== null,
});
export type PublicUser = ReturnType<typeof publicUser>;

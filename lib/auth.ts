import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "wg-session";
const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function createSession(): Promise<string> {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySession(token);
}

export async function validateCredentials(email: string, password: string): Promise<boolean> {
  if (email !== process.env.AUTH_EMAIL) return false;

  const hash = process.env.AUTH_PASSWORD_HASH;
  if (hash) {
    // Dynamic import to avoid loading Node.js crypto in Edge middleware
    const { compareSync } = await import("bcryptjs");
    return compareSync(password, hash);
  }

  // Fallback to plaintext comparison during migration (remove after setting hash)
  return password === process.env.AUTH_PASSWORD;
}

export { SESSION_COOKIE };

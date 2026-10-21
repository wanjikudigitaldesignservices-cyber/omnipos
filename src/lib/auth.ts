import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, tenants, sessions, User, Tenant } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "omnipos-super-secret-jwt-key-2026-secure-token"
);

export const COOKIE_NAME = "omnipos_session";
const SESSION_DURATION_HOURS = 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  tenantId: string;
  onboardingCompleted: boolean;
  role?: string;
  fullName?: string;
}

// --- Password & PIN Hashing ---
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(8);
  return bcrypt.hash(pin, salt);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// --- JWT Token Generation & Verification ---
export async function generateToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// --- Database-Backed Session Management ---
export async function createSession(
  userId: string,
  tenantId: string,
  onboardingCompleted = false,
  role?: string,
  fullName?: string
): Promise<string> {
  const token = await generateToken({ userId, tenantId, onboardingCompleted, role, fullName });
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  try {
    // Store in sessions table
    await db.insert(sessions).values({
      userId,
      token,
      expiresAt,
    });
  } catch (err) {
    console.error("Could not insert session into DB (will rely on encrypted JWT):", err);
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    try {
      await db.delete(sessions).where(eq(sessions.token, token));
    } catch (e) {
      console.error("Failed to delete session from db:", e);
    }
  }

  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<{ user: User; tenant: Tenant } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload?.userId || !payload?.tenantId) return null;

    // Fetch user and tenant
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!dbUser || !dbUser.isActive) return null;

    const dbTenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, payload.tenantId),
    });

    if (!dbTenant) return null;

    return { user: dbUser, tenant: dbTenant };
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

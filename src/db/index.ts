import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
    !url.includes("YOUR_PASSWORD") &&
    !url.includes("ep-empty") &&
    !url.includes("dummy@") &&
    url.startsWith("postgres")
  );
};

const getDatabaseUrl = () => {
  return process.env.DATABASE_URL || "postgresql://neondb_owner:dummy@ep-empty.us-east-2.aws.neon.tech/neondb?sslmode=require";
};

// Neon HTTP client for serverless queries
export const getSql = () => neon(getDatabaseUrl());

// Drizzle instance initialized with Neon HTTP client and schema
export const db = drizzle(getSql(), { schema });

export * from "./schema";

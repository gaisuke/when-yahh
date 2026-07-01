import { promises as fs } from "fs";
import path from "path";

// Two storage backends:
// 1. Upstash Redis (REST API, no SDK needed) — used when env vars are set.
//    This is what you want once you deploy to Vercel, since serverless
//    functions don't share a filesystem between invocations.
// 2. A local JSON file in /tmp — used automatically for `next dev` so you
//    can test everything on your laptop without setting anything up.

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LOCAL_FILE = path.join("/tmp", "reunion-locations.json");
const KEY = "reunion:locations";

const usingUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

async function upstashCommand(command) {
  const res = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
  return res.json();
}

async function readLocalFile() {
  try {
    const raw = await fs.readFile(LOCAL_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeLocalFile(data) {
  await fs.writeFile(LOCAL_FILE, JSON.stringify(data), "utf-8");
}

export async function getLocations() {
  if (usingUpstash) {
    const { result } = await upstashCommand(["GET", KEY]);
    return result ? JSON.parse(result) : {};
  }
  return readLocalFile();
}

export async function setLocation(person, lat, lng) {
  const data = await getLocations();
  data[person] = { lat, lng, updatedAt: Date.now() };

  if (usingUpstash) {
    await upstashCommand(["SET", KEY, JSON.stringify(data)]);
  } else {
    await writeLocalFile(data);
  }
  return data;
}

export const storageBackend = usingUpstash ? "upstash" : "local-file (dev only)";

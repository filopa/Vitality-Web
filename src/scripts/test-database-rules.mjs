import assert from "node:assert/strict";
import { getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

const projectId = "demo-vitality";
const databaseUrl =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  `https://${projectId}-default-rtdb.firebaseio.com`;

if (!process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
  throw new Error(
    "Run this test through Firebase Emulator Suite so FIREBASE_DATABASE_EMULATOR_HOST is set.",
  );
}

const app =
  getApps()[0] ??
  initializeApp({
    projectId,
    databaseURL: databaseUrl,
  });
const adminDatabase = getDatabase(app);
const emulatorHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
const emulatorUrl = `http://${emulatorHost}`;

function databaseUrlFor(path, uid) {
  const url = new URL(`${emulatorUrl}/${path}.json`);
  url.searchParams.set("ns", projectId);
  if (uid) {
    url.searchParams.set(
      "auth_variable_override",
      JSON.stringify({ uid }),
    );
  }
  return url;
}

async function get(path, uid) {
  return fetch(databaseUrlFor(path, uid));
}

async function write(path, uid, value) {
  return fetch(databaseUrlFor(path, uid), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

await adminDatabase.ref().set({
  users: {
    alice: { uid: "alice", email: "alice@example.test", showFollowers: true },
    bob: { uid: "bob", email: "bob@example.test", showFollowers: false },
  },
  publicProfiles: {
    alice: { uid: "alice", username: "alice", followersCount: 1 },
    bob: { uid: "bob", username: "bob", followersCount: 0 },
  },
  followers: { alice: { bob: 1 }, bob: {} },
  following: { alice: {}, bob: { alice: 1 } },
  publicFollowers: { alice: { bob: true }, bob: {} },
});

const checks = [
  ["anonymous users read is denied", async () => assert.notEqual((await get("users/alice")).status, 200)],
  ["owner can read own private user node", async () => assert.equal((await get("users/alice", "alice")).status, 200)],
  ["other user cannot read private user node", async () => assert.notEqual((await get("users/alice", "bob")).status, 200)],
  ["owner cannot write private user node", async () => assert.notEqual((await write("users/alice", "alice", { uid: "alice" })).status, 200)],
  ["public profile can be read anonymously", async () => assert.equal((await get("publicProfiles/alice")).status, 200)],
  ["public profile cannot be modified by a user", async () => assert.notEqual((await write("publicProfiles/alice", "alice", { uid: "alice" })).status, 200)],
  ["owner can read own followers", async () => assert.equal((await get("followers/alice", "alice")).status, 200)],
  ["other user cannot read followers", async () => assert.notEqual((await get("followers/alice", "bob")).status, 200)],
  ["owner can read own following", async () => assert.equal((await get("following/alice", "alice")).status, 200)],
  ["other user cannot read following", async () => assert.notEqual((await get("following/alice", "bob")).status, 200)],
  ["public followers are readable with opt-in", async () => assert.equal((await get("publicFollowers/alice")).status, 200)],
  ["public followers are hidden without opt-in", async () => assert.notEqual((await get("publicFollowers/bob")).status, 200)],
];

try {
  for (const [name, run] of checks) {
    await run();
    console.log(`PASS ${name}`);
  }
} finally {
  await adminDatabase.ref().remove();
  await app.delete();
}

#!/usr/bin/env node
/**
 * Installs what the the app demo needs on a Didit application: two lists and
 * four transaction rules, all defined in lib/igaming/policy.ts.
 *
 * Usage:
 *   npm run setup              # create what is missing, update the rest
 *   npm run setup -- --dry-run # print the payloads, change nothing
 *
 * Reads API_KEY from the environment or from .env.
 * Safe to run any number of times: lists and rules are matched by name/title,
 * created when missing and PATCHed back to the definition when present. Run it
 * once per Didit application. It also creates the two workflows the app needs and
 * writes their ids to .env.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { API_BASE, ensureWorkflows, writeEnv } from "./lib/workflows.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(repoRoot, ".env");

if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

// Loaded in main(), once the workflows exist and their ids are in the environment.
let policy;

const dryRun = process.argv.includes("--dry-run");
const apiKey = process.env.API_KEY;
const base = API_BASE;

async function didit(method, pathname, body) {
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `${method} ${pathname} returned ${response.status}: ${JSON.stringify(data)}`,
    );
  }

  return data;
}

const results = (data) => (Array.isArray(data) ? data : data?.results ?? []);

async function ensureList(definition) {
  const existing = results(await didit("GET", `/v3/lists/${policy.LISTS_QUERY}`)).find(
    (list) => list.name === definition.name,
  );
  const { entries, ...listBody } = definition;
  let listId = existing?.uuid;

  if (!listId) {
    if (dryRun) {
      console.log(`would create list "${definition.name}"`, listBody);

      return "<new-list-id>";
    }
    listId = (await didit("POST", "/v3/lists/", listBody)).uuid;
    console.log(`created list "${definition.name}" ${listId}`);
  } else {
    console.log(`list "${definition.name}" ${listId}`);
  }

  if (entries.length === 0) return listId;

  const present = new Set(
    results(await didit("GET", `/v3/lists/${listId}/entries/?limit=1000`)).map(
      (entry) => String(entry.value).toUpperCase(),
    ),
  );

  for (const entry of entries) {
    if (present.has(entry.value.toUpperCase())) continue;
    if (dryRun) {
      console.log(`  would add ${entry.value} (${entry.display_label})`);
      continue;
    }
    await didit("POST", `/v3/lists/${listId}/entries/`, entry);
    console.log(`  added ${entry.value} (${entry.display_label})`);
  }

  return listId;
}

async function main() {
  if (!apiKey) {
    console.error("API_KEY is not set (environment or .env).");
    process.exit(1);
  }

  console.log(`Didit application behind API_KEY on ${base}\n`);

  const ids = await ensureWorkflows({ apiKey, dryRun });

  policy = await import("../lib/igaming/policy.ts");
  console.log("");

  const [markets, verified] = policy.listDefinitions();
  const marketsListId = await ensureList(markets);
  const verifiedListId = await ensureList(verified);

  const rules = policy.ruleDefinitions({
    marketsListId,
    verifiedListId,
    kycWorkflowId: policy.KYC_WORKFLOW_ID,
  });
  const installed = results(
    await didit("GET", "/v3/transactions/rules/?limit=500"),
  );

  console.log("");
  for (const rule of rules) {
    const existing = installed.find((item) => item.title === rule.title);

    if (dryRun) {
      console.log(
        `would ${existing ? "update" : "create"} rule "${rule.title}"\n${JSON.stringify(rule, null, 2)}`,
      );
      continue;
    }
    if (existing) {
      await didit("PATCH", `/v3/transactions/rules/${existing.uuid}/`, rule);
      console.log(`updated rule "${rule.title}" ${existing.uuid}`);
    } else {
      const created = await didit("POST", "/v3/transactions/rules/", rule);

      console.log(`created rule "${rule.title}" ${created.uuid}`);
    }
  }

  if (!dryRun) writeEnv(ids);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

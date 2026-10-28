// Creates the Didit workflows this app needs and writes their ids to .env.
// Used by scripts/setup.mjs. Idempotent: a workflow is found by its label, a
// variable that is already set is respected, nothing is ever edited or deleted.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const API_BASE = "https://verification.didit.me";

/** The workflows this app needs: the variable that holds the id, and the create body. */
export const WORKFLOWS = [
  {
    "env": "DIDIT_WORKFLOW_AGE",
    "purpose": "Age check opened before the first bet (age estimation, ID check as the fallback).",
    "body": {
      "workflow_label": "Aurora Play - age check",
      "is_desktop_allowed": true,
      "features": [
        {
          "feature": "AGE_ESTIMATION",
          "config": {
            "minimum_age_threshold": 18,
            "enable_id_verification_fallback": true
          }
        }
      ]
    }
  },
  {
    "env": "DIDIT_WORKFLOW_KYC",
    "purpose": "ID check opened when deposits reach 2,000 EUR in 30 days (ID, liveness, face match, IP).",
    "body": {
      "workflow_label": "Aurora Play - ID check",
      "is_desktop_allowed": true,
      "features": [
        {
          "feature": "OCR"
        },
        {
          "feature": "LIVENESS"
        },
        {
          "feature": "FACE_MATCH"
        },
        {
          "feature": "IP_ANALYSIS"
        }
      ]
    }
  }
];

async function call(apiKey, method, pathname, body) {
  const response = await fetch(`${API_BASE}${pathname}`, {
    method,
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${method} ${pathname} returned ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

async function listWorkflows(apiKey) {
  const rows = [];
  let next = "/v3/workflows/?limit=100";

  while (next) {
    const data = await call(apiKey, "GET", next);

    rows.push(...(Array.isArray(data) ? data : (data?.results ?? [])));
    next = !Array.isArray(data) && data?.next ? data.next.replace(/^https?:\/\/[^/]+/, "") : null;
  }

  return rows;
}

/**
 * Makes sure every workflow exists on the application behind the API key and
 * returns { VARIABLE: id }. A variable that is already set is kept as it is.
 */
export async function ensureWorkflows({ apiKey, dryRun = false, only = null }) {
  const ids = {};
  const rows = await listWorkflows(apiKey);

  for (const workflow of WORKFLOWS) {
    if (only && !only.includes(workflow.env)) continue;
    const preset = (process.env[workflow.env] || "").trim();

    if (preset) {
      console.log(`${workflow.env}=${preset} (already set)`);
      ids[workflow.env] = preset;
      continue;
    }

    const label = workflow.body.workflow_label;
    const found = rows.find((row) => row.workflow_label === label && !row.is_archived);

    if (found) {
      console.log(`workflow "${label}" ${found.workflow_id}`);
      ids[workflow.env] = found.workflow_id;
    } else if (dryRun) {
      console.log(`would create workflow "${label}"`);
      ids[workflow.env] = "<new-workflow-id>";
    } else {
      const created = await call(apiKey, "POST", "/v3/workflows/", workflow.body);

      console.log(`created workflow "${label}" ${created.workflow_id}`);
      ids[workflow.env] = created.workflow_id;
    }
    process.env[workflow.env] = ids[workflow.env];
  }

  return ids;
}

/** Writes VARIABLE=value lines into .env (created from .env.example when missing). */
export function writeEnv(values) {
  const envFile = path.join(root, ".env");
  const example = path.join(root, ".env.example");
  let text = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : fs.existsSync(example) ? fs.readFileSync(example, "utf8") : "";

  for (const [name, value] of Object.entries(values)) {
    const line = `${name}=${value}`;
    const pattern = new RegExp(`^${name}=.*$`, "m");

    text = pattern.test(text) ? text.replace(pattern, line) : `${text.trimEnd()}\n${line}\n`;
  }
  fs.writeFileSync(envFile, text);
  console.log(`\nWrote ${Object.keys(values).join(", ")} to .env`);
}

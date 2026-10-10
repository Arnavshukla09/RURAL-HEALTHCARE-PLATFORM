#!/usr/bin/env node

/**
 * scripts/check_gemini.mjs
 *
 * Verifies that the models in GEMINI_MODELS exist on Google Gemini API
 * using process.env.GEMINI_API_KEY.
 * NEVER prints the API key value.
 */

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Error: GEMINI_API_KEY is not set in environment.");
  console.error("Usage: GEMINI_API_KEY=your_key node scripts/check_gemini.mjs");
  process.exit(1);
}

const configuredModels = (process.env.GEMINI_MODELS || "gemini-3.5-flash,gemini-3.1-flash-lite,gemini-2.5-flash")
  .split(",")
  .map(m => m.trim())
  .filter(Boolean);

console.log(`Checking configured models: ${configuredModels.join(", ")}`);

async function checkModels() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models`, {
      headers: {
        "x-goog-api-key": apiKey
      }
    });

    if (!res.ok) {
      console.error(`❌ Gemini API call failed with status ${res.status}: ${res.statusText}`);
      process.exit(1);
    }

    const data = await res.json();
    const availableModelNames = (data.models || []).map(m => m.name.replace("models/", ""));

    console.log("\nModel verification results:");
    for (const model of configuredModels) {
      const exists = availableModelNames.includes(model);
      console.log(`- ${model}: ${exists ? "✅ Available" : "⚠️ Not found in account's model list"}`);
    }

    console.log(`\nTotal available models returned: ${availableModelNames.length}`);
  } catch (err) {
    console.error("❌ Connection error while querying Gemini:", err.message);
    process.exit(1);
  }
}

checkModels();

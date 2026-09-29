import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Load the actual TS modules without adding a test-runner dependency.
async function moduleUrl(file, replacements = {}) {
  let source = await readFile(new URL(`../src/lib/${file}.ts`, import.meta.url), "utf8");
  for (const [from, to] of Object.entries(replacements)) source = source.replace(from, to);
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}

const privacyUrl = await moduleUrl("prompt-privacy");
const { maskInterviewPrompt } = await import(privacyUrl);
const replacements = { '"@/lib/prompt-privacy"': JSON.stringify(privacyUrl) };
const { buildInterviewOnepagerPromptContext } = await import(
  await moduleUrl("interview-master-prompt", replacements)
);

test("masks known names, standalone name parts, email and location throughout free text", () => {
  const text = maskInterviewPrompt(
    "Anna Müller aus München. MÜLLER: anna.mueller@example.org; Anna nutzt SQL.",
    {
      name: "Anna Müller",
      location: "München",
    },
  );
  for (const value of ["Anna", "Müller", "MÜLLER", "München", "example.org"])
    assert.ok(!text.includes(value), value);
  assert.ok(text.includes("SQL"));
});

test("masks common contact, address, date and bank formats", () => {
  for (const text of [
    "+49 (0) 170 1234567",
    "0049 170 1234567",
    "030 / 12345678",
    "01701234567",
    "Hauptstraße 12a",
    "Berliner Str. 42",
    "10115 Berlin",
    "12.03.1990",
    "1990-03-12",
    "DE89 3704 0044 0532 0130 00",
    "https://linkedin.com/in/anna",
    "www.example.org/anna",
  ]) {
    const result = maskInterviewPrompt(text);
    assert.match(result, /^\[[A-Z ]+\]$/, `${text}: ${result}`);
  }
});

test("preserves relevant skills, years, experience and question limits", () => {
  const text =
    "Python, SQL, C++, C#, Node.js. 2019–2024, 2020-2023. 6 Jahre Erfahrung. 3 technische Fragen, 2 Soft Skills, 1 Teamfit.";
  assert.equal(maskInterviewPrompt(text), text);
  assert.equal(maskInterviewPrompt("Annabelle", { name: "Anna" }), "Annabelle");
});

test("handles regex characters in known identities and remains idempotent", () => {
  const identity = { name: "Anne (Test)", location: "Frankfurt (Oder)" };
  const once = maskInterviewPrompt("Anne (Test), Frankfurt (Oder), anne@example.org", identity);
  assert.equal(once, "[PERSON], [ORT], [EMAIL]");
  assert.equal(maskInterviewPrompt(once, identity), once);
});

test("generated prompt is masked, originals stay unchanged", () => {
  const application = {
    name: "Anna Müller",
    email: "anna@example.org",
    location: "München",
    shortProfile: "Anna: anna@example.org, Python",
    skills: ["Python"],
    yearsExperience: 6,
  };
  const original = structuredClone(application);
  const prompt = buildInterviewOnepagerPromptContext({
    application,
    teamContext: "",
    stage1Comments: "Müller: SQL",
    interviewGuide: [],
    questions: [],
    openRisks: [],
  });
  assert.ok(!/Anna|Müller|München|example\.org/.test(prompt));
  assert.ok(prompt.includes("Python"));
  assert.deepEqual(application, original);
});

test("server masks direct requests, rejects oversized prompts and hides error body", async () => {
  const serverUrl = await moduleUrl("openai-onepager", {
    ...replacements,
    'import { createServerFn } from "@tanstack/react-start";':
      "const createServerFn = () => ({ inputValidator: validate => ({ handler: handle => input => handle({ data: validate(input) }) }) });",
  });
  const { generateInterviewOnepager } = await import(serverUrl);
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  let body;
  try {
    process.env.OPENAI_API_KEY = "synthetic-test-key";
    globalThis.fetch = async (_url, options) => {
      body = JSON.parse(options.body);
      return new Response(JSON.stringify({ output_text: "- Python vertiefen" }), { status: 200 });
    };
    const raw =
      'Interviewdaten: {"kandidat":{"name":"Anna Müller","location":"München","shortProfile":"anna@example.org"}}';
    await generateInterviewOnepager({ prompt: raw });
    assert.ok(!/Anna|Müller|München|example\.org/.test(JSON.stringify(body)));
    assert.equal(body.store, false);
    await generateInterviewOnepager({ prompt: "x ".repeat(13990) + " anna@example.org" });
    assert.ok(!JSON.stringify(body).includes("anna@"));
    assert.throws(
      () => generateInterviewOnepager({ prompt: "x".repeat(28001) }),
      /Prompt ist zu lang/,
    );
    globalThis.fetch = async () => new Response("sensitive provider echo", { status: 400 });
    await assert.rejects(generateInterviewOnepager({ prompt: raw }), (error) => {
      assert.equal(error.message, "OpenAI Anfrage fehlgeschlagen (400).");
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});

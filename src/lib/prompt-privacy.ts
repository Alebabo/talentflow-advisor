export type CandidateIdentity = {
  name?: string;
  email?: string;
  location?: string;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Best-effort masking, not a guarantee of anonymous free text.
export function maskInterviewPrompt(prompt: string, identity: CandidateIdentity = {}) {
  const identities = [identity];
  // Also cover identities retained in an edited/older generated prompt.
  for (const match of prompt.matchAll(/"kandidat"\s*:\s*(\{[^{}]*\})/g)) {
    try {
      const candidate = JSON.parse(match[1]);
      identities.push(candidate);
    } catch {
      // Manually edited JSON can be invalid; generic patterns still apply.
    }
  }

  const replacements = new Map<string, string>();
  for (const candidate of identities) {
    for (const [field, marker] of [
      ["name", "[PERSON]"],
      ["email", "[EMAIL]"],
      ["location", "[ORT]"],
    ] as const) {
      const value = candidate[field];
      if (typeof value !== "string" || !value.trim() || value.includes("[")) continue;
      replacements.set(value.trim(), marker);
      if (field === "name") {
        for (const part of value.split(/[\s,]+/)) {
          if (part.length >= 3) replacements.set(part, marker);
        }
      }
    }
  }

  let masked = prompt
    .normalize("NFC")
    .replace(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu, "[EMAIL]")
    .replace(/\b(?:https?:\/\/|www\.)[^\s"<>]+/gi, "[LINK]");
  for (const [value, marker] of [...replacements].sort((a, b) => b[0].length - a[0].length)) {
    const pattern = escapeRegex(value.normalize("NFC")).replace(/\s+/g, "\\s+");
    masked = masked.replace(
      new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, "giu"),
      marker,
    );
  }

  return masked
    .replace(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]){11,30}\b/gi, "[IBAN]")
    .replace(
      /(?<!\d)(?:\+\d{1,3}[\s()./-]*|00\d{1,3}[\s()./-]*|0\d{2,5}[\s()./-]+)(?:\d[\s()./-]*){6,13}\d(?!\d)/g,
      "[TELEFON]",
    )
    .replace(/(?<!\d)0\d{8,14}(?!\d)/g, "[TELEFON]")
    .replace(/\b(?:\d{1,2}[./]\d{1,2}[./](?:19|20)\d{2}|(?:19|20)\d{2}-\d{2}-\d{2})\b/g, "[DATUM]")
    .replace(
      /\b(?:[\p{L}.-]{1,64}[ \t]+){0,3}[\p{L}.-]{0,64}(?:straße|strasse|str\.|weg|allee|platz|gasse)[ \t]+\d+[a-z]?(?:[ \t]*[-/][ \t]*\d+[a-z]?)?/giu,
      "[ADRESSE]",
    )
    .replace(/\b\d{5}\s+[\p{L}][\p{L}-]*(?:\s+(?:am|an der|im)\s+[\p{L}-]+)?/gu, "[PLZ ORT]");
}

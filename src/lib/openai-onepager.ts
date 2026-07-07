import { createServerFn } from "@tanstack/react-start";

type GenerateOnepagerInput = {
  prompt: string;
};

type OpenAITextPart = {
  type?: string;
  text?: string;
};

type OpenAIOutputItem = {
  content?: OpenAITextPart[];
};

type OpenAIResponsesResult = {
  output_text?: string;
  output?: OpenAIOutputItem[];
};

function parseGenerateOnepagerInput(input: unknown): GenerateOnepagerInput {
  if (
    !input ||
    typeof input !== "object" ||
    !("prompt" in input) ||
    typeof (input as { prompt?: unknown }).prompt !== "string"
  ) {
    throw new Error("Prompt fehlt.");
  }

  const prompt = (input as GenerateOnepagerInput).prompt.trim();
  if (prompt.length < 20) throw new Error("Prompt ist zu kurz.");

  return {
    prompt: prompt.slice(0, 28_000),
  };
}

function extractResponseText(result: OpenAIResponsesResult) {
  if (result.output_text?.trim()) return result.output_text.trim();

  return (
    result.output
      ?.flatMap((item) => item.content ?? [])
      .map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

export const generateInterviewOnepager = createServerFn({ method: "POST" })
  .inputValidator(parseGenerateOnepagerInput)
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY ist serverseitig nicht gesetzt.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Du erstellst sehr kurze, interviewtaugliche Recruiting-Onepager. Antworte ausschliesslich mit Stichpunkten.",
          },
          {
            role: "user",
            content: `${data.prompt}\n\nGib jetzt nur den Abschnitt Gespraechsfokus als 4-6 kurze Stichpunkte zurueck. Behalte die Vorgabe 4 technische/job-spezifische, 2 Soft-Skill- und 2 Team-/Culture-Fit-Fragen sowie den CV-Luecken-Check bei.`,
          },
        ],
        max_output_tokens: 700,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`OpenAI Anfrage fehlgeschlagen (${response.status}): ${message.slice(0, 300)}`);
    }

    const result = (await response.json()) as OpenAIResponsesResult;
    const text = extractResponseText(result);
    if (!text) throw new Error("OpenAI hat keinen Text zurueckgegeben.");

    return { text };
  });

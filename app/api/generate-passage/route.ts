import { NextRequest, NextResponse } from "next/server";
import { passageBank } from "../../../lib/passages";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawDifficulty = searchParams.get("difficulty") || "medium";
  const difficulty = (["easy", "medium", "hard"].includes(rawDifficulty)
    ? rawDifficulty
    : "medium") as "easy" | "medium" | "hard";

  // Select 3 random/shuffled static fallback passages
  const getThreeStaticFallbacks = () => {
    const list = passageBank[difficulty];
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map((item) => item.text);
    while (selected.length < 3) {
      selected.push(list[0]?.text || "A beautiful day to practice typing and improve speed.");
    }
    return selected;
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. Falling back to static passages.");
    return NextResponse.json({ passages: getThreeStaticFallbacks(), source: "static" });
  }

  // Define word count guidelines
  let wordCountGuide = "approximately 60 words";
  let description = "standard narrative prose, moderate punctuation, and normal vocabulary";
  if (difficulty === "easy") {
    wordCountGuide = "approximately 30 words";
    description = "simple vocabulary, short and straightforward sentences, and minimal punctuation";
  } else if (difficulty === "hard") {
    wordCountGuide = "approximately 100 words";
    description = "complex sentence structure, advanced vocabulary/technical jargon, and high density of punctuation";
  }

  const prompt = `Generate exactly THREE (3) distinct, high-quality typing test passages of ${wordCountGuide}. Each passage must be a single coherent and natural paragraph of ${description}, suitable for a general audience.
Strict Formatting Instructions:
- Return ONLY a valid JSON array of strings containing exactly 3 strings (the 3 passages).
- Do NOT include any markdown formatting wrappers (e.g., do NOT wrap the JSON in markdown code blocks like \`\`\`json).
- Do NOT include any preamble, conversational filler, or introductory/explanatory text.
- Example structure:
[
  "Passage 1 text...",
  "Passage 2 text...",
  "Passage 3 text..."
]`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Gemini API error (Status ${response.status}). Falling back to static.`);
      return NextResponse.json({ passages: getThreeStaticFallbacks(), source: "static" });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== "string") {
      console.warn("Gemini API returned malformed or empty content. Falling back to static.");
      return NextResponse.json({ passages: getThreeStaticFallbacks(), source: "static" });
    }

    // Clean potential markdown wrappers
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim();
    }

    try {
      const parsed = JSON.parse(cleanedText);
      if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every((item) => typeof item === "string")) {
        return NextResponse.json({
          passages: parsed.slice(0, 3).map((p) => p.trim()),
          source: "ai",
        });
      }
    } catch (parseError) {
      console.warn("Failed to parse Gemini output as JSON array. Raw output:", cleanedText, parseError);
    }

    return NextResponse.json({ passages: getThreeStaticFallbacks(), source: "static" });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
      console.warn("Gemini API call timed out after 3 seconds. Falling back to static.");
    } else {
      console.warn("Gemini API call failed with error:", error);
    }
    return NextResponse.json({ passages: getThreeStaticFallbacks(), source: "static" });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { passageBank } from "../../../lib/passages";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawDifficulty = searchParams.get("difficulty") || "medium";
  const difficulty = (["easy", "medium", "hard"].includes(rawDifficulty)
    ? rawDifficulty
    : "medium") as "easy" | "medium" | "hard";

  // Silently choose a fallback static passage to use in case of any failure
  const getStaticFallback = () => {
    const list = passageBank[difficulty];
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex].text;
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. Falling back to static passage.");
    return NextResponse.json({ passage: getStaticFallback(), source: "static" });
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

  const prompt = `Generate a typing test passage of ${wordCountGuide}. The content should be a coherent and natural paragraph of ${description}, suitable for a general audience.
Strict Formatting Instructions:
- Return ONLY the raw plain text of the passage.
- Do NOT include any preamble, introduction, or conversational filler (e.g., do NOT say "Here is the passage" or similar).
- Do NOT wrap the text in quotation marks (single or double).
- Do NOT use markdown formatting (no asterisks, backticks, bolding, etc.).
- Avoid empty lines or line breaks; return as a single continuous paragraph.`;

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
          temperature: 0.7,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Gemini API error (Status ${response.status}). Falling back to static.`);
      return NextResponse.json({ passage: getStaticFallback(), source: "static" });
    }

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== "string") {
      console.warn("Gemini API returned malformed or empty content. Falling back to static.");
      return NextResponse.json({ passage: getStaticFallback(), source: "static" });
    }

    // Server-side light sanitization
    text = text.trim();

    if (!text) {
      console.warn("Gemini API returned empty string. Falling back to static.");
      return NextResponse.json({ passage: getStaticFallback(), source: "static" });
    }

    return NextResponse.json({ passage: text, source: "ai" });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
      console.warn("Gemini API call timed out after 3 seconds. Falling back to static.");
    } else {
      console.warn("Gemini API call failed with error:", error);
    }
    return NextResponse.json({ passage: getStaticFallback(), source: "static" });
  }
}

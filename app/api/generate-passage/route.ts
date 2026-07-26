import { NextRequest, NextResponse } from "next/server";
import { passageBank } from "../../../lib/passages";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawDifficulty = searchParams.get("difficulty") || "medium";
  const difficulty = (["easy", "medium", "hard"].includes(rawDifficulty)
    ? rawDifficulty
    : "medium") as "easy" | "medium" | "hard";

  const rawCategory = searchParams.get("category") || "programming";
  const category = (["programming", "general_knowledge"].includes(rawCategory)
    ? rawCategory
    : "programming") as "programming" | "general_knowledge";

  // Select a single random static fallback passage from the matching category and difficulty
  const getStaticFallback = () => {
    const list = passageBank[difficulty].filter((p) => p.category === category);
    if (list.length === 0) {
      const anyList = passageBank[difficulty];
      const fallbackItem = anyList[Math.floor(Math.random() * anyList.length)]?.text || "Practice typing daily to enhance your speed and accuracy.";
      return [fallbackItem];
    }
    const randomItem = list[Math.floor(Math.random() * list.length)];
    return [randomItem.text];
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. Falling back to static passages.");
    return NextResponse.json({ passages: getStaticFallback(), source: "static" });
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

  // Inject category descriptions
  let themeInstruction = "themed around a general knowledge topic (science, geography, space, history, or factual trivia)";
  if (category === "programming") {
    themeInstruction = "themed around a programming, tech, or software engineering concept, written entirely in normal English prose without actual code syntax, symbols, brackets, or programming tags";
  }

  const prompt = `Generate exactly ONE (1) distinct, high-quality typing test passage of ${wordCountGuide}. The passage must be a single coherent and natural paragraph of ${description} ${themeInstruction}, suitable for a general audience.
Strict Formatting Instructions:
- Return ONLY a valid JSON array of strings containing exactly 1 string (the passage).
- Do NOT include any markdown formatting wrappers (e.g., do NOT wrap the JSON in markdown code blocks like \`\`\`json).
- Do NOT include any preamble, conversational filler, or introductory/explanatory text.
- Example structure:
[
  "The generated passage text goes here..."
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
      return NextResponse.json({ passages: getStaticFallback(), source: "static" });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== "string") {
      console.warn("Gemini API returned malformed or empty content. Falling back to static.");
      return NextResponse.json({ passages: getStaticFallback(), source: "static" });
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
      if (Array.isArray(parsed) && parsed.length >= 1 && parsed.every((item) => typeof item === "string")) {
        return NextResponse.json({
          passages: parsed.slice(0, 1).map((p) => p.trim()),
          source: "ai",
        });
      }
    } catch (parseError) {
      console.warn("Failed to parse Gemini output as JSON array. Raw output:", cleanedText, parseError);
    }

    return NextResponse.json({ passages: getStaticFallback(), source: "static" });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
      console.warn("Gemini API call timed out after 3 seconds. Falling back to static.");
    } else {
      console.warn("Gemini API call failed with error:", error);
    }
    return NextResponse.json({ passages: getStaticFallback(), source: "static" });
  }
}

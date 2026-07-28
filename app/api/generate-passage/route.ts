import { NextRequest, NextResponse } from "next/server";
import { passageBank } from "../../../lib/passages";

export const dynamic = "force-dynamic";

type NewCategory = "code_arena" | "knowledge_quest" | "ai_lab" | "world_explorer" | "weak_key_drill" | "speed_sprint";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawDifficulty = searchParams.get("difficulty") || "medium";
  const difficulty = (["easy", "medium", "hard"].includes(rawDifficulty)
    ? rawDifficulty
    : "medium") as "easy" | "medium" | "hard";

  const rawCategory = searchParams.get("category") || "code_arena";
  const category = (["code_arena", "knowledge_quest", "ai_lab", "world_explorer", "weak_key_drill", "speed_sprint"].includes(rawCategory)
    ? rawCategory
    : "code_arena") as NewCategory;

  const weakKeys = searchParams.get("weak_keys") || "";
  const wordCountParam = searchParams.get("word_count");

  // Select a single random static fallback passage from the matching category and difficulty
  const getStaticFallback = () => {
    // Speed sprint always bypasses standard difficulty, but we check if we can get a matching sprint passage
    const list = passageBank[difficulty].filter((p) => p.category === category);
    if (list.length === 0) {
      // Find sprint in any difficulty if currently on one where none is defined
      if (category === "speed_sprint") {
        for (const diff of ["easy", "medium", "hard"] as const) {
          const sprintList = passageBank[diff].filter((p) => p.category === "speed_sprint");
          if (sprintList.length > 0) {
            return [sprintList[Math.floor(Math.random() * sprintList.length)].text];
          }
        }
      }
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
  if (wordCountParam) {
    const parsedWordTarget = parseInt(wordCountParam, 10);
    if (!isNaN(parsedWordTarget) && parsedWordTarget > 0) {
      wordCountGuide = `exactly ${parsedWordTarget} words`;
    }
  } else if (category === "speed_sprint") {
    wordCountGuide = "strictly approximately 15-20 words";
    description = "highly punchy, neutral sentences designed for quick typing tests";
  } else if (difficulty === "easy") {
    wordCountGuide = "approximately 30 words";
    description = "simple vocabulary, short and straightforward sentences, and minimal punctuation";
  } else if (difficulty === "hard") {
    wordCountGuide = "approximately 100 words";
    description = "complex sentence structure, advanced vocabulary/technical jargon, and high density of punctuation";
  }

  // Inject category descriptions (system prompts for themed categories)
  let themeInstruction = "";
  if (category === "code_arena") {
    themeInstruction = "themed specifically around a software concept, history, or use-case of one of these programming technologies: Python, JavaScript, HTML/CSS, or SQL. It must be written entirely in normal, natural, typeable English prose (plain prose) and MUST NOT contain any actual code syntax, symbols like brackets or braces, or code snippets. Keep it focused on the conceptual, historic, or cultural aspects of Python, JavaScript, HTML/CSS, or SQL.";
  } else if (category === "knowledge_quest") {
    themeInstruction = "themed around factual general knowledge and trivia, including science, astronomy, history, discoveries, or general factual information. Keep it informative and highly educational.";
  } else if (category === "ai_lab") {
    themeInstruction = "themed specifically around artificial intelligence, machine learning, neural networks, futures, emerging technologies, or human-machine interaction. Focus on modern ML advancements and future tech concepts.";
  } else if (category === "world_explorer") {
    themeInstruction = "themed around world geography, cultural traditions, travel, natural wonders, scenic landscapes, or narrative world history. It should have a vivid, narrative, storytelling tone like a travel magazine rather than dry facts.";
  } else if (category === "weak_key_drill") {
    const listStr = weakKeys ? weakKeys.split(",").join(", ") : "E, T, A, O, I, N";
    themeInstruction = `specifically designed as a typing drill to help the user practice these weak characters/letters: [${listStr}]. You MUST generate a natural, grammatically correct, and cohesive paragraph in plain English that frequently and density-wise utilizes these target letters: [${listStr}] significantly more often than normal prose. Avoid complex code syntax or symbols; keep it natural-reading.`;
  } else if (category === "speed_sprint") {
    themeInstruction = "designed as a high-pressure typing sprint. It must consist of simple, neutral, punchy words without complex punctuation, structured as a clean and motivating single sentence of exactly 15 to 20 words.";
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

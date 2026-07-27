import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const fallbackTips = [
  "Maintain a steady cadence. Focus on flowing smoothly between letters rather than rushing individual words.",
  "When encountering tricky letters, reduce your speed slightly to reinforce correct muscle memory.",
  "Keep your wrists floating gently above the keyboard to reach keys without awkward angles.",
  "If you notice mistakes on a specific character, practice common words containing that letter to build speed.",
  "Take deep, relaxed breaths. A calm posture drastically reduces keyboard tension and improves consistency."
];

export async function POST(request: NextRequest) {
  try {
    const { wpm, accuracy, consistency, difficulty, category, errors } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

    // Rotate fallback tips based on time or wpm/accuracy if Gemini is not configured
    const getFallback = () => {
      const idx = Math.abs(parseInt(wpm, 10) || 0) % fallbackTips.length;
      return fallbackTips[idx];
    };

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to local coach feedback.");
      return NextResponse.json({ feedback: getFallback(), source: "local" });
    }

    // Format errors list if any
    let errorSummary = "None";
    if (errors && typeof errors === "object" && Object.keys(errors).length > 0) {
      errorSummary = Object.entries(errors)
        .map(([k, v]) => `${k} (mistyped ${v} times)`)
        .join(", ");
    }

    const prompt = `You are a professional, direct, and elite speed typing coach.
Analyze this user's typing performance on a test and provide a SHORT, specific, and highly actionable coaching observation (1 to 2 sentences max).
Do NOT include generic praise like "Great job!", "Excellent work!", or conversational filler. Start directly with the feedback.
Explicitly focus on one concrete, specific observation drawn from the provided data.

Performance Data:
- Speed: ${wpm} WPM
- Accuracy: ${accuracy}%
- Consistency Score: ${consistency}% (measures pace stability across the test)
- Difficulty Level: ${difficulty}
- Content Category: ${category}
- Specific characters mistyped: ${errorSummary}

Example Feedbacks:
- "You slow down noticeably around punctuation — try keeping your rhythm steady through commas and periods rather than pausing."
- "You struggled with the '${Object.keys(errors || {})[0] || 'T'}' and '${Object.keys(errors || {})[1] || 'S'}' keys in this run — slow down slightly on these transitions to build precise muscle memory."
- "While your accuracy is excellent, your lower consistency of ${consistency}% suggests jerky typing bursts; try pacing yourself with a metronome-like rhythm."

Return ONLY the plain feedback text in 1-2 sentences. No JSON, no markdown formatting.`;

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
      console.warn(`Gemini API error (Status ${response.status}) in coach API. Using fallback.`);
      return NextResponse.json({ feedback: getFallback(), source: "local" });
    }

    const data = await response.json();
    const feedbackText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!feedbackText || typeof feedbackText !== "string") {
      console.warn("Gemini API returned malformed content. Using fallback.");
      return NextResponse.json({ feedback: getFallback(), source: "local" });
    }

    return NextResponse.json({
      feedback: feedbackText.trim().replace(/^"|"$/g, ""),
      source: "ai"
    });

  } catch (error: unknown) {
    console.warn("Error in coach-feedback API:", error);
    return NextResponse.json({
      feedback: fallbackTips[Math.floor(Math.random() * fallbackTips.length)],
      source: "local"
    });
  }
}

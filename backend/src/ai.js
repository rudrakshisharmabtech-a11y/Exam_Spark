function aiConfiguration() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    const error = new Error("AI study tools are not configured. Set AI_API_KEY on the server.");
    error.status = 503;
    throw error;
  }
  return {
    apiKey,
    baseUrl: (process.env.AI_API_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
    model: process.env.AI_MODEL || "gpt-4o-mini",
    transcriptionModel: process.env.AI_TRANSCRIPTION_MODEL || "whisper-1",
  };
}

export async function generateStudyAnswer({ system, prompt, maxTokens = 700 }) {
  const config = aiConfiguration();
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error?.message || "The configured AI provider could not complete the request.");
    error.status = 502;
    throw error;
  }
  const text = result.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    const error = new Error("The AI provider returned an empty response.");
    error.status = 502;
    throw error;
  }
  return text.trim();
}

export async function transcribeAudio(file) {
  const config = aiConfiguration();
  const form = new FormData();
  form.append("model", config.transcriptionModel);
  form.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  const response = await fetch(`${config.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body: form,
    signal: AbortSignal.timeout(60000),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error?.message || "The configured transcription service could not process this audio.");
    error.status = 502;
    throw error;
  }
  if (typeof result.text !== "string" || !result.text.trim()) {
    const error = new Error("The transcription service returned no transcript.");
    error.status = 422;
    throw error;
  }
  return result.text.trim();
}

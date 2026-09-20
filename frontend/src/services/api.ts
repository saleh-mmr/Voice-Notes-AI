const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function getErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (typeof data.message === "string") {
      return data.message;
    }
  } catch {
    // Ignore JSON parsing errors and use the fallback below.
  }

  return `${fallbackMessage}: ${response.status}`;
}


export type SourceType = "text" | "audio";

export type AudioMetadata = {
  filename: string;
  content_type: string | null;
};

export type TextProcessRequest = {
  text: string;
  clean_with_llm: boolean;
  system_prompt: string;
};

export type ProcessResponse = {
  source: SourceType;
  original_text: string;
  cleaned_text: string;
  clean_with_llm: boolean;
  system_prompt: string;
  audio: AudioMetadata | null;
};



export async function processText(
  payload: TextProcessRequest
): Promise<ProcessResponse> {
  const response = await fetch(`${API_BASE_URL}/text/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "Text processing failed"
    );

    throw new Error(message);
  }

  return response.json();
}

export async function processAudio(
  file: File,
  cleanWithLLM: boolean,
  systemPrompt: string
): Promise<ProcessResponse> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("clean_with_llm", String(cleanWithLLM));
  formData.append("system_prompt", systemPrompt);

  const response = await fetch(`${API_BASE_URL}/audio/process`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "Audio processing failed"
    );

    throw new Error(message);
  }

  return response.json();
}
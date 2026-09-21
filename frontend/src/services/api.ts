import type {
  ApiErrorResponse,
  ProcessResponse,
  PromptType,
  TextProcessRequest,
} from "../types/api";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";


async function getErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const data =
      (await response.json()) as ApiErrorResponse;

    if (
      typeof data.detail === "string" &&
      data.detail.trim()
    ) {
      return data.detail;
    }

    if (
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }
  } catch {
    // The backend did not return JSON.
  }

  return `${fallbackMessage} (${response.status})`;
}


export async function processText(
  payload: TextProcessRequest
): Promise<ProcessResponse> {
  const response = await fetch(
    `${API_BASE_URL}/text/process`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Text processing failed"
      )
    );
  }

  return (await response.json()) as ProcessResponse;
}


export async function processAudio(
  file: File,
  cleanWithLLM: boolean,
  systemPrompt: PromptType
): Promise<ProcessResponse> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "clean_with_llm",
    String(cleanWithLLM)
  );
  formData.append(
    "system_prompt",
    systemPrompt
  );

  const response = await fetch(
    `${API_BASE_URL}/audio/process`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Audio processing failed"
      )
    );
  }

  return (await response.json()) as ProcessResponse;
}
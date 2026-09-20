const API_BASE_URL = "http://127.0.0.1:8000";

export type TextProcessRequest = {
  text: string;
  clean_with_llm: boolean;
  system_prompt: string;
};

export type TextProcessResponse = {
  original_text: string;
  cleaned_text: string;
  clean_with_llm: boolean;
  system_prompt: string;
};

export type AudioUploadResponse = {
  filename: string;
  content_type: string | null;
};

export async function processText(
  payload: TextProcessRequest
): Promise<TextProcessResponse> {
  const response = await fetch(`${API_BASE_URL}/text/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Text processing failed: ${response.status}`);
  }

  return response.json();
}

export async function uploadAudio(
  file: File
): Promise<AudioUploadResponse> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/audio/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Audio upload failed: ${response.status}`);
  }

  return response.json();
}
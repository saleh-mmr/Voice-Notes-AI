import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  processAudio,
  processText,
} from "./api";


afterEach(() => {
  vi.restoreAllMocks();
});


describe("processText", () => {
  it("returns processed text", async () => {
    const responseData = {
      source: "text",
      original_text: "um hello",
      cleaned_text: "Hello.",
      clean_with_llm: true,
      system_prompt: "default",
      audio: null,
    };

    vi.spyOn(
      globalThis,
      "fetch"
    ).mockResolvedValue(
      new Response(
        JSON.stringify(responseData),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    const result = await processText({
      text: "um hello",
      clean_with_llm: true,
      system_prompt: "default",
    });

    expect(result.original_text).toBe(
      "um hello"
    );

    expect(result.cleaned_text).toBe(
      "Hello."
    );

    expect(fetch).toHaveBeenCalledOnce();
  });


  it("throws backend error details", async () => {
    vi.spyOn(
      globalThis,
      "fetch"
    ).mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: "Ollama is not running or cannot be reached.",
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    await expect(
      processText({
        text: "hello",
        clean_with_llm: true,
        system_prompt: "default",
      })
    ).rejects.toThrow(
      "Ollama is not running or cannot be reached."
    );
  });
});


describe("processAudio", () => {
  it("returns transcription results", async () => {
    const responseData = {
      source: "audio",
      original_text: "Raw transcript.",
      cleaned_text: "Clean transcript.",
      clean_with_llm: true,
      system_prompt: "default",
      audio: {
        filename: "recording.wav",
        content_type: "audio/wav",
      },
    };

    vi.spyOn(
      globalThis,
      "fetch"
    ).mockResolvedValue(
      new Response(
        JSON.stringify(responseData),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    const file = new File(
      ["fake audio"],
      "recording.wav",
      {
        type: "audio/wav",
      }
    );

    const result = await processAudio(
      file,
      true,
      "default"
    );

    expect(result.source).toBe("audio");

    expect(result.original_text).toBe(
      "Raw transcript."
    );

    expect(result.cleaned_text).toBe(
      "Clean transcript."
    );

    expect(fetch).toHaveBeenCalledOnce();
  });


  it("throws audio processing errors", async () => {
    vi.spyOn(
      globalThis,
      "fetch"
    ).mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: "Unsupported audio format.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    const file = new File(
      ["fake"],
      "test.txt",
      {
        type: "text/plain",
      }
    );

    await expect(
      processAudio(
        file,
        false,
        "default"
      )
    ).rejects.toThrow(
      "Unsupported audio format."
    );
  });
});
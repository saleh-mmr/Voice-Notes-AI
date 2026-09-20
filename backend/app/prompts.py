SYSTEM_PROMPTS = {
    "default": (
        "Clean the transcript while preserving the original meaning. "
        "Remove filler words, fix grammar and punctuation, and improve readability. "
        "Do not add new information."
    ),

    "formal": (
        "Rewrite the transcript in a clear, professional, and formal style. "
        "Preserve the original meaning, fix grammar and punctuation, "
        "remove filler words, and do not add new information."
    ),

    "short": (
        "Create a concise version of the transcript. "
        "Keep only the important information, remove repetition and filler words, "
        "preserve the original meaning, and do not add new information."
    ),
}


def get_system_prompt(prompt_name: str) -> str:
    return SYSTEM_PROMPTS.get(
        prompt_name,
        SYSTEM_PROMPTS["default"],
    )
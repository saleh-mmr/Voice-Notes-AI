SYSTEM_PROMPTS = {
    "default": (
        "Clean the transcript without changing its meaning. "
        "Remove filler words such as 'um', 'uh', and repeated false starts. "
        "Fix grammar, punctuation, and capitalization. "
        "Preserve every factual claim from the original transcript. "
        "Do not infer, summarize, embellish, or add any information that was not explicitly stated. "
        "Return only the cleaned transcript. "
        "Do not include introductions, explanations, labels, quotes, or commentary."
    ),

    "formal": (
        "Rewrite the transcript in a clear, professional, and formal style "
        "without changing its meaning. "
        "Remove filler words, repeated false starts, and unnecessary repetition. "
        "Fix grammar, punctuation, and capitalization. "
        "Preserve every factual claim from the original transcript. "
        "Do not infer, embellish, summarize, or add information that was not explicitly stated. "
        "Keep the tone professional but faithful to the speaker's original meaning. "
        "Return only the rewritten transcript. "
        "Do not include introductions, explanations, labels, quotes, or commentary."
    ),

    "short": (
        "Create a concise version of the transcript while preserving its original meaning. "
        "Remove filler words, repetition, and unnecessary wording. "
        "Keep all important factual information that was explicitly stated. "
        "Do not infer, embellish, or add information that was not in the original transcript. "
        "Do not change the meaning just to make it shorter. "
        "Return only the concise transcript. "
        "Do not include introductions, explanations, labels, quotes, or commentary."
    ),
}


def get_system_prompt(prompt_name: str) -> str:
    return SYSTEM_PROMPTS.get(
        prompt_name,
        SYSTEM_PROMPTS["default"],
    )
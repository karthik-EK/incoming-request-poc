import json
import re
from dataclasses import dataclass

import httpx

from app.config import get_settings


REQUEST_TYPES = {"complaint", "general_enquiry", "service_request", "escalation_urgent"}
URGENCIES = {"low", "medium", "high", "critical"}


@dataclass(frozen=True)
class ClassificationResult:
    classification: str
    urgency: str
    confidence: float
    subtopic: str
    rationale: str


SYSTEM_PROMPT = """
You classify customer operations requests for an enterprise support workflow.
Return strict JSON with keys: classification, urgency, confidence, subtopic, rationale.
classification must be one of: complaint, general_enquiry, service_request, escalation_urgent.
urgency must be one of: low, medium, high, critical.
confidence must be a number from 0 to 1.
Keep rationale under 35 words.
"""


async def classify_request(subject: str, description: str) -> ClassificationResult:
    settings = get_settings()
    if settings.openai_api_key:
        try:
            return await _classify_with_openai(settings, subject, description)
        except Exception:
            return _heuristic_classify(subject, description, "OpenAI-compatible call failed; deterministic fallback used.")
    return _heuristic_classify(subject, description, "No API key configured; deterministic fallback used.")


async def _classify_with_openai(settings, subject: str, description: str) -> ClassificationResult:
    url = settings.openai_base_url.rstrip("/") + "/chat/completions"
    payload = {
        "model": settings.openai_model,
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT.strip()},
            {"role": "user", "content": f"Subject: {subject}\nDescription: {description}"},
        ],
    }
    headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=12) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    data = json.loads(content)
    return _normalize_result(data, "Classified with OpenAI-compatible API.")


def _normalize_result(data: dict, fallback_rationale: str) -> ClassificationResult:
    classification = str(data.get("classification", "general_enquiry")).lower().strip().replace(" ", "_")
    urgency = str(data.get("urgency", "low")).lower().strip()
    if classification not in REQUEST_TYPES:
        classification = "general_enquiry"
    if urgency not in URGENCIES:
        urgency = "low"
    try:
        confidence = max(0.0, min(1.0, float(data.get("confidence", 0.72))))
    except (TypeError, ValueError):
        confidence = 0.72
    return ClassificationResult(
        classification=classification,
        urgency=urgency,
        confidence=confidence,
        subtopic=str(data.get("subtopic", "General"))[:100],
        rationale=str(data.get("rationale") or fallback_rationale),
    )


def _heuristic_classify(subject: str, description: str, prefix: str) -> ClassificationResult:
    text = f"{subject} {description}".lower()
    score = {
        "escalation_urgent": _hits(text, ["urgent", "immediately", "legal", "fraud", "breach", "supervisor", "escalate", "critical"]),
        "complaint": _hits(text, ["complaint", "angry", "unacceptable", "refund", "dispute", "wrong", "failed", "charged"]),
        "service_request": _hits(text, ["request", "install", "activate", "change", "update", "reset", "provision", "schedule"]),
        "general_enquiry": _hits(text, ["question", "enquiry", "inquiry", "how", "what", "pricing", "hours", "information"]),
    }
    classification = max(score, key=score.get)
    if score[classification] == 0:
        classification = "general_enquiry"

    urgency = "low"
    if classification == "service_request":
        urgency = "medium"
    if classification == "complaint":
        urgency = "high"
    if classification == "escalation_urgent":
        urgency = "critical"
    if re.search(r"\b(today|asap|immediately|urgent|critical|legal|fraud)\b", text):
        urgency = "critical" if classification == "escalation_urgent" else "high"

    subtopic = _subtopic(text)
    confidence = 0.92 if score[classification] >= 2 else 0.76 if score[classification] == 1 else 0.64
    rationale = f"{prefix} Keywords indicate {classification.replace('_', ' ')} with {urgency} urgency."
    return ClassificationResult(classification, urgency, confidence, subtopic, rationale)


def _hits(text: str, keywords: list[str]) -> int:
    return sum(1 for keyword in keywords if keyword in text)


def _subtopic(text: str) -> str:
    if any(word in text for word in ["bill", "billing", "charged", "invoice", "refund", "payment"]):
        return "Billing"
    if any(word in text for word in ["login", "password", "account", "access"]):
        return "Account Access"
    if any(word in text for word in ["install", "device", "connection", "service", "provision"]):
        return "Service Delivery"
    if any(word in text for word in ["pricing", "plan", "feature", "hours"]):
        return "Product Information"
    return "General"

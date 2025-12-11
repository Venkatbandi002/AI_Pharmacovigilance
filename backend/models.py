# backend/models.py
from pydantic import BaseModel, Field

# --- New Model for Heatmap Entry ---
class HeatmapEntry(BaseModel):
    """Represents a single entry in the Safety Contradiction Heatmap."""
    adverse_event: str = Field(
        ...,
        description="The specific adverse event (e.g., 'Hepatotoxicity', 'Severe Rash')."
    )
    # This must be extracted from the Trial Claim text or inferred
    trial_frequency_percent: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Reported frequency in the trial/label (0.0 to 100.0)."
    )
    # This must be extracted from the Case Report text or inferred
    post_market_severity_score: int = Field(
        ...,
        ge=1,
        le=5,
        description="Severity/unexpectedness score from the case report/FAERS (1: Low, 5: Critical)."
    )
    contradiction_level: str = Field(
        ...,
        description="Level of contradiction: 'Low', 'Medium', 'High', 'Critical'."
    )


class ContradictionRequest(BaseModel):
    """Data sent from the frontend to the analysis endpoint."""
    trial_claim: str = Field(
        ...,
        description="The primary safety claim from a trial or label."
    )
    case_report: str = Field(
        ...,
        description="The post-market case report or adverse event data."
    )
    session_id: str = Field(
        ...,
        description="Unique ID to track user history (Memo0/Redis key)."
    )

class ContradictionResponse(BaseModel):
    """
    The structured output from the Gemini LLM and the final API response,
    matching the project's Core Goal outputs.
    """
    contradiction_detected: str = Field(
        ...,
        description="Binary verdict: 'Yes' or 'No'."
    )
    signal_confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score from 0.0 to 1.0 (The primary output)."
    )
    contradiction_reasoning: str = Field(
        ...,
        description="The analytical justification for the verdict and why the scores were assigned, referencing RAG/History."
    )
    safety_contradiction_heatmap: list[HeatmapEntry] = Field(
        ...,
        description="Structured data for the safety contradiction heatmap (key events and severity metrics)."
    )
    regulatory_reporting_draft: str = Field(
        ...,
        description="Draft narrative (max 200 words) for a potential regulatory submission (e.g., SUSAR or CIOMS)."
    )
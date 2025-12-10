# backend/models.py
from pydantic import BaseModel, Field

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
        description="Unique ID to track user history (Memo0)."
    )

class ContradictionResponse(BaseModel):
    """The structured output from the Gemini LLM and the final API response."""
    contradiction_detected: str = Field(
        ...,
        description="Binary verdict: 'Yes' or 'No'."
    )
    signal_confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score from 0.0 to 1.0."
    )
    contradiction_reasoning: str = Field(
        ...,
        description="The analytical justification for the verdict."
    )
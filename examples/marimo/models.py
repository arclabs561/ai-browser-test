"""
Pydantic models for ai-browser-test API responses.

These models match the TypeScript interfaces defined in index.d.ts,
providing type safety and validation for JSON responses from the Node.js package.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class EstimatedCost(BaseModel):
    """Estimated cost for API usage."""
    inputTokens: int
    outputTokens: int
    inputCost: str
    outputCost: str
    totalCost: str
    currency: str = "USD"


class Viewport(BaseModel):
    """Viewport dimensions."""
    width: int
    height: int


class SemanticInfo(BaseModel):
    """Semantic information extracted from VLLM judgment."""
    score: Optional[float] = Field(None, ge=0, le=10, description="Score from 0-10")
    issues: list[str] = Field(default_factory=list)
    assessment: Optional[str] = None
    reasoning: str
    brutalistViolations: Optional[list[str]] = None
    zeroToleranceViolations: Optional[list[str]] = None


class ValidationResult(BaseModel):
    """Result from validateScreenshot function."""
    enabled: bool
    provider: str
    score: Optional[float] = Field(None, ge=0, le=10, description="Score from 0-10")
    issues: list[str] = Field(default_factory=list)
    assessment: Optional[str] = None
    reasoning: str
    estimatedCost: Optional[EstimatedCost] = None
    responseTime: int = Field(..., description="Response time in milliseconds")
    cached: Optional[bool] = False
    judgment: Optional[str] = None
    raw: Optional[dict] = None
    semantic: Optional[SemanticInfo] = None
    error: Optional[str] = None
    message: Optional[str] = None
    pricing: Optional[dict[str, float]] = None
    timestamp: Optional[str] = None
    testName: Optional[str] = None
    viewport: Optional[Viewport] = None


class Persona(BaseModel):
    """Persona configuration for testing."""
    name: str
    perspective: str
    focus: list[str] = Field(default_factory=list)


class TemporalScreenshot(BaseModel):
    """Temporal screenshot information."""
    path: str
    timestamp: int
    elapsed: int
    step: Optional[str] = None
    description: Optional[str] = None


class TemporalNote(BaseModel):
    """Temporal note from persona experience."""
    step: str
    persona: Optional[str] = None
    observation: Optional[str] = None
    timestamp: int
    elapsed: int
    pageState: Optional[dict] = None
    renderedCode: Optional[dict] = None


class RenderedCode(BaseModel):
    """Rendered code structure."""
    html: str
    css: Optional[str] = None
    criticalCSS: Optional[dict[str, dict[str, str]]] = None
    domStructure: dict = Field(default_factory=dict)


class PerspectiveEvaluation(BaseModel):
    """Evaluation from a specific persona perspective."""
    persona: Persona
    perspective: Optional[str] = None
    focus: Optional[str] = None
    evaluation: ValidationResult


class MultiModalValidationResult(BaseModel):
    """Result from multiModalValidation function."""
    screenshotPath: str
    renderedCode: Optional[RenderedCode] = None
    gameState: dict = Field(default_factory=dict)
    temporalScreenshots: list[TemporalScreenshot] = Field(default_factory=list)
    perspectives: list[PerspectiveEvaluation] = Field(default_factory=list)
    codeValidation: dict = Field(default_factory=dict)
    aggregatedScore: Optional[float] = Field(None, ge=0, le=10)
    aggregatedIssues: list[str] = Field(default_factory=list)
    timestamp: int


class PersonaExperienceResult(BaseModel):
    """Result from experiencePageAsPersona or experiencePageWithPersonas."""
    persona: Persona
    notes: list[TemporalNote] = Field(default_factory=list)
    screenshots: list[TemporalScreenshot] = Field(default_factory=list)
    renderedCode: Optional[RenderedCode] = None
    gameState: Optional[dict] = None
    evaluation: Optional[ValidationResult] = None
    timestamp: int
    # Additional fields from actual implementation
    device: Optional[str] = None
    viewport: Optional[Viewport] = None
    duration: Optional[int] = None
    timeScale: Optional[Literal["human", "mechanical"]] = None
    trace: Optional[dict] = None



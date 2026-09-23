from pydantic import BaseModel, Field


class AnalyzeDistressRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    use_ai: bool = True


class RuleMatch(BaseModel):
    phrase: str
    category: str
    level: str


class RuleAnalysis(BaseModel):
    level: str
    matches: list[RuleMatch]
    categories: list[str]
    is_crisis_rule: bool
    match_count: int


class AiAnalysis(BaseModel):
    sentiment: str
    emotions: list[str]
    distress_level: str
    indicators: list[str]
    confidence: float
    requires_escalation: bool
    source: str


class LayersUsed(BaseModel):
    rule_based: bool
    ai_based: bool


class DistressAnalysisResponse(BaseModel):
    id: str | None = None
    level: str
    requires_escalation: bool
    indicators: list[str]
    rule_matches: RuleAnalysis
    ai_analysis: AiAnalysis | None = None
    layers_used: LayersUsed

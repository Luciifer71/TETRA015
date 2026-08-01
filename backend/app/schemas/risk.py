from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class RiskFactor(BaseModel):
    rule: str
    triggered: bool
    weight: int
    description: str
    severity: str


class RuleResult(BaseModel):
    rule: str
    passed: bool
    weight: int
    severity: str


class RiskReportBase(BaseModel):
    risk_score: int = Field(ge=0, le=100)
    risk_level: str
    risk_factors: List[RiskFactor]
    rule_results: Optional[List[RuleResult]] = None
    confidence_score: Optional[float] = None
    explanation: Optional[str] = None
    recommendations: Optional[str] = None
    duplicate_of: Optional[str] = None
    similarity_score: Optional[float] = None
    requires_review: bool = False


class RiskReportResponse(RiskReportBase):
    id: str
    invoice_id: str
    reviewed: bool = False
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RiskDistributionData(BaseModel):
    name: str
    value: int
    percentage: int
    color: str


class RiskDistributionResponse(BaseModel):
    chart_type: str = "pie"
    data: List[RiskDistributionData]
    colors: List[str]
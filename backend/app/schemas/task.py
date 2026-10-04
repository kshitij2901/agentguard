from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    goal: str = Field(..., min_length=3, description="The user's high-level intent / goal")
    allowed_paths: List[str] = Field(default_factory=list, description="File-system paths the agent may access")
    sensitive_access_allowed: bool = False
    network_access_allowed: bool = False
    destructive_actions_allowed: bool = False
    git_push_allowed: bool = False


class TaskResponse(BaseModel):
    id: str
    goal: str
    allowed_paths: List[str]
    sensitive_access_allowed: bool
    network_access_allowed: bool
    destructive_actions_allowed: bool
    git_push_allowed: bool
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}

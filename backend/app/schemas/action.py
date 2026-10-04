from typing import Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime


class ActionType(str, Enum):
    FILE_READ = "FILE_READ"
    FILE_WRITE = "FILE_WRITE"
    COMMAND_EXECUTE = "COMMAND_EXECUTE"
    NETWORK_REQUEST = "NETWORK_REQUEST"
    GIT_OPERATION = "GIT_OPERATION"


class ActionCreate(BaseModel):
    task_id: str
    type: ActionType = Field(..., alias="type", description="One of FILE_READ, FILE_WRITE, COMMAND_EXECUTE, NETWORK_REQUEST, GIT_OPERATION")
    target: str = Field(..., description="The file path, command string, URL, or git ref being acted upon")
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class ActionResponse(BaseModel):
    id: str
    task_id: str
    action_type: str
    target: str
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

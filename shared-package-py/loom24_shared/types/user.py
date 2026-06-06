from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel


class User(BaseModel):
    id:        str
    name:      str
    email:     str
    img:       Optional[str] = None
    credits:   int
    createdAt: Optional[Any] = None
    updatedAt: Optional[Any] = None

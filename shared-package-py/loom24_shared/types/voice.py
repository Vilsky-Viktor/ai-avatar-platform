from __future__ import annotations

from pydantic import BaseModel

from .avatar import AvatarGender


class Voice(BaseModel):
    id:         str
    name:       str
    gender:     AvatarGender
    age:        str
    category:   str
    description: str
    language:   str
    previewUrl: str
    useCase:    str

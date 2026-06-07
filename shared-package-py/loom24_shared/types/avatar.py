from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel


class AvatarGender(str, Enum):
    male   = 'male'
    female = 'female'


class AvatarTypes(str, Enum):
    twin      = 'twin'
    synthetic = 'synthetic'


class AvatarParameters(BaseModel):
    gender:        AvatarGender
    ethnicity:     str
    skinColor:     str
    age:           str
    attractiveness: str
    body:          str
    face:          str
    hairStyle:     str
    hairColor:     str
    eyes:          str
    skin:          str
    facialHair:    str
    nose:          str
    eyeLashes:     str
    eyeBrows:      str
    lips:          str
    bustSize:      str
    ears:          str
    bodyHair:      str
    height:        str


class Avatar(BaseModel):
    id:            Optional[str] = None
    userId:        Optional[str] = None
    name:          str
    slug:          str
    type:          AvatarTypes
    parameters:    AvatarParameters
    mainImagePath: Optional[str] = None
    voiceId:       Optional[str] = None
    createdAt:     Optional[Any] = None
    updatedAt:     Optional[Any] = None

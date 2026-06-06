from enum import Enum


class VideoRatios(str, Enum):
    ratio_16_9 = '16:9'
    ratio_1_1  = '1:1'
    ratio_9_16 = '9:16'

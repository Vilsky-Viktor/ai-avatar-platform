from enum import Enum


class ImageRatios(str, Enum):
    ratio_4_3  = '4:3'
    ratio_16_9 = '16:9'
    ratio_1_1  = '1:1'
    ratio_3_4  = '3:4'
    ratio_9_16 = '9:16'


class OutputFormats(str, Enum):
    png  = 'png'
    jpeg = 'jpeg'


class OutputMimeTypes(str, Enum):
    jpeg = 'image/jpeg'
    png  = 'image/png'

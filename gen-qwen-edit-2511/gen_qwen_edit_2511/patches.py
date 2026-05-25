import sys
import types
import torchvision.transforms.functional as _tvf

# torchvision.transforms.functional_tensor was removed in torchvision 0.16+; basicsr still references it
if 'torchvision.transforms.functional_tensor' not in sys.modules:
    _m = types.ModuleType('torchvision.transforms.functional_tensor')
    _m.rgb_to_grayscale = _tvf.rgb_to_grayscale
    sys.modules['torchvision.transforms.functional_tensor'] = _m

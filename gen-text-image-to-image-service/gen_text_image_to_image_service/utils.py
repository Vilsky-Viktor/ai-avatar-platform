import io
import time
import functools
from gen_text_image_to_image_service.logger import get_logger

logger = get_logger("utils")

def to_image_bytes(obj, format = "PNG") -> bytes:
    if isinstance(obj, bytes):
        return obj
    if hasattr(obj, 'save'):
        buf = io.BytesIO()
        obj.save(buf, format=format)
        return buf.getvalue()
    raise ValueError(f"Cannot convert to bytes: {type(obj)}")

def timeit(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        logger.info(f"⏱ {func.__name__} took {elapsed:.3f}s")
        return result
    return wrapper
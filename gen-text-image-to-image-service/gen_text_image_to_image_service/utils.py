import io

def to_image_bytes(obj, format = "PNG") -> bytes:
    if isinstance(obj, bytes):
        return obj
    if hasattr(obj, 'save'):
        buf = io.BytesIO()
        obj.save(buf, format=format)
        return buf.getvalue()
    raise ValueError(f"Cannot convert to bytes: {type(obj)}")
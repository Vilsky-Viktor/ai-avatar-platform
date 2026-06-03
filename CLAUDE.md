# Rules

## Code style
- All imports must be at the top of the file. No inline or deferred imports inside functions or conditionals.
- Write readable and testable code. Split logic into small, focused functions. No large functions that do multiple things — each function should have one clear responsibility.

## Error handling and observability
- Always handle errors. Never let failures silently disappear — every error path must log enough context to diagnose the problem without a debugger.
- When writing subprocess calls, capture full stdout and stderr and log them on failure. Never truncate error output to the point where the traceback is cut off.
- When writing code that calls external processes or services, always ask: "If this fails, will I know why?" If the answer is no, add logging before shipping.

## Dependencies
- Never install packages or dependencies yourself. Instead, provide the exact command for the user to run.

## External libraries and APIs
- Before writing any code that uses an external library, look up the actual API first (PyPI page, GitHub source, or official docs).
- Never assume an API from memory, training data, or example pseudocode. Verify the real method signatures, return types, and parameter names before writing a single line.
- If unsure about a return type or behavior, search for it explicitly before writing code that depends on it.
- If the API is not available on the internet, ask the user to clone the repo and provide the local path so the source can be read directly.

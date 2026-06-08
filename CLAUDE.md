# Rules

## Code style
- All imports must be at the top of the file. No inline or deferred imports inside functions or conditionals.
- Write readable and testable code. Split logic into small, focused functions. No large functions that do multiple things — each function should have one clear responsibility.
- Do not use comments. No inline comments, no block comments, no docstrings.
- Use only self-descriptive variable names. No single-letter or two-letter variable names (e.g. use `index` not `i`, `error` not `e`, `key` not `k`).

## Error handling and observability
- Always handle errors. Never let failures silently disappear — every error path must log enough context to diagnose the problem without a debugger.
- When writing subprocess calls, capture full stdout and stderr and log them on failure. Never truncate error output to the point where the traceback is cut off.
- When writing code that calls external processes or services, always ask: "If this fails, will I know why?" If the answer is no, add logging before shipping.

## Dependencies
- Never install packages or dependencies yourself. Instead, provide the exact command for the user to run.
- Always pin dependencies to a concrete version. Never use range specifiers (`^`, `~`, `>=`, `>`). Every dependency in every package file must have an exact version (e.g. `"fastapi": "0.136.3"`, `ultralytics = "8.3.202"`).

## Documentation
- After making any code or configuration changes, check whether the affected service's README and the root README need updating. Update them as part of the same change.

## External libraries and APIs
- Before writing any code that uses an external library, look up the actual API first (PyPI page, GitHub source, or official docs).
- Never assume an API from memory, training data, or example pseudocode. Verify the real method signatures, return types, and parameter names before writing a single line.
- If unsure about a return type or behavior, search for it explicitly before writing code that depends on it.
- If the API is not available on the internet, ask the user to clone the repo and provide the local path so the source can be read directly.

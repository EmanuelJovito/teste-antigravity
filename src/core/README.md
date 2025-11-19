# Core Layer (The Hexagon)

This directory contains the pure business logic of the application.
**Rules:**
- NO dependencies on React, Next.js, or external libraries (except utility libraries like Zod or date-fns if absolutely necessary and decoupled).
- NO UI code.
- NO Database access code (only interfaces).

## Structure
- **domain/**: Entities and business rules.
- **ports/**: Interfaces (Contracts) for driving (input) and driven (output) adapters.
- **services/**: Application services implementing use cases.

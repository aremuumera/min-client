# Project Context – Mandatory Read

## Migration History
This project (`customer-frontend-next`) is a **migration** from an older React project.

### Original Project
- Folder name: `customer-frontend`
- Framework: React
- UI Library: MUI
- Status: Stable and working
- Purpose: Source of truth for logic and workflows

### Current Project
- Folder name: `customer-frontend-next`
- Framework: Next.js (App Router)
- UI Library: None (custom UI) but we have a UI library in `src/components/ui` and it is built using tailwind css
- Status: Migrated version with bugs and inconsistencies

## Critical Rules for Antigravity

1. ❗ This project was **NOT built from scratch**
2. ❗ Any bug, error, or unexpected behavior in the Next.js code **must be cross-checked** against the original React project
3. ❗ Business logic, data flow, API usage, and workflows in `customer-frontend` are the reference standard
4. ❗ If a module, hook, or component behaves differently:
   - First inspect the implementation in `customer-frontend`
   - Then align `customer-frontend-next` to match the intended behavior
5. ❗ Do NOT introduce new workflows unless the old project explicitly lacked them

## Debugging Workflow

When solving issues:
1. Identify the failing feature in `customer-frontend-next`
2. Locate the same feature in `customer-frontend`
3. Compare:
   - State management
   - API calls
   - Side effects
   - Component lifecycle differences (React vs Next.js)
   - UI differences
   -  Auth differences, Guarded routes, Protected routes, security
4. Fix the Next.js implementation to match the original intent

## Folder Priority
- Reference first: `customer-frontend`
- Modify second: `customer-frontend-next`
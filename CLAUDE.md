# Claude Project Brief — Earthmoving Management Desktop MVP

## Overview

Desktop application for **Viana Transporte e Terraplenagem** — a small transport and earthmoving business.

This project is **not** a generic ERP.  
It is a focused operational management system for a company that executes services such as:

- material transport (caminhão)
- earthmoving and land grading
- soil removal
- excavation support
- machine-based field services tied to construction projects

The business operates primarily with a **truck (caminhão)** and two drivers (**Marcelo** and **Michel**). Revenue is tracked per service, trip, daily rate, or by tonnage formula. Costs include fuel, maintenance, driver payments, and taxes.

The goal of this MVP is to help the business owner or manager control the **daily operation of projects**, the **use of machines**, and the **financial result per project**.

This file defines **what the product must include**.

---

## MVP Delivery Status

**All 6 phases are complete as of 2026-04-01.**

| Phase | Description | Status |
| ----- | ----------- | ------ |
| Phase 1 | Foundation — project setup, routing, DB, shared UI | ✅ Done |
| Phase 2 | Core CRUD — Clients, Projects, Machines, Operators | ✅ Done |
| Phase 3 | Operational Core — Daily Logs, project detail views | ✅ Done |
| Phase 4 | Financial Core — Costs, Revenues, profitability | ✅ Done |
| Phase 5 | Management Overview — Dashboard, Reports | ✅ Done |
| Phase 6 | Refinement — loading states, toast notifications, detail pages | ✅ Done |

Known bugs exist and will be addressed in the next iteration. The system is functional and covers all MVP success criteria.

---

## Technical Stack

- **Framework:** Electron 41 with `electron-vite`
- **Frontend:** React 18 + TypeScript
- **Routing:** React Router 6 with `HashRouter` (required for `file://` protocol)
- **Database:** LibSQL (SQLite) via `@libsql/client` + Drizzle ORM (async queries)
- **IPC pattern:** `ipcMain.handle('entity:action', async (_, ...args) => {...})` in main; `contextBridge` exposes typed `window.api`
- **UI components:** Custom shadcn-style components (forwardRef, cn(), CSS variables) — no Radix UI except where already installed
- **Styling:** Tailwind CSS with custom brand tokens

### Design System

The application uses a custom brand palette defined in `tailwind.config.cjs` and `src/renderer/index.css`. **Do not change colors, fonts, or visual tokens without the user's explicit instruction.**

Brand tokens:

- `brand.deep` — #3852B4 (primary blue)
- `brand.sky` — #5E7AC4
- `brand.sand` — #F3BE7A (accent/warm)
- `brand.orange` — #F08D39
- `brand.cream` — #FFF8EF
- `brand.ink` — #22315F (text dark)

CSS variable radius: `--radius: 0.9rem`  
Font stack: Segoe UI → Inter → Roboto → Helvetica Neue

Key component patterns:

- Cards/sections use `rounded-[28px] border border-border/80 bg-white/84 shadow-sm backdrop-blur-sm`
- Form container: `FormCard` component
- Detail page sections: `SurfaceSection` component
- Filter bars: `FilterPanel` component

---

## Application Structure (implemented)

| Route | Page |
| ----- | ---- |
| `/dashboard` | Dashboard overview |
| `/clients` | Clients list |
| `/clients/new`, `/clients/:id/edit` | Client form |
| `/clients/:id` | Client detail (with projects) |
| `/projects` | Projects list with status filter |
| `/projects/new`, `/projects/:id/edit` | Project form |
| `/projects/:id` | Project detail (tabs: Geral, Registros, Custos, Receitas, Resumo) |
| `/machines` | Machines list |
| `/machines/new`, `/machines/:id/edit` | Machine form |
| `/machines/:id` | Machine detail (with usage history) |
| `/operators` | Operators list |
| `/operators/new`, `/operators/:id/edit` | Operator form |
| `/operators/:id` | Operator detail (with daily logs) |
| `/daily-logs` | Daily logs with filters (project, machine, operator, date) |
| `/daily-logs/new`, `/daily-logs/:id/edit` | Daily log form |
| `/costs` | Costs with filters (project, category, date) |
| `/costs/new`, `/costs/:id/edit` | Cost form |
| `/revenues` | Revenues with filters (project, status, date) |
| `/revenues/new`, `/revenues/:id/edit` | Revenue form |
| `/reports` | Reports (4 tabs: Projetos, Registros, Máquinas, Custos) |

---

---

## Product Goal

The system must allow the business owner to answer these questions clearly:

1. Which projects are currently active?
2. Which machines and operators are working on each project?
3. How many hours were worked on each project?
4. What costs were generated for each project?
5. What revenue has been recorded for each project?
6. Is each project profitable or not?

The MVP should be centered around **project-level visibility**.

---

## Main Product Principle

Everything in the system should revolve around the **project**.

The owner does not just want isolated records.  
The owner wants to understand the operational and financial reality of each project.

That means:

- daily work must be linked to a project
- machine usage must be linked to a project
- costs must be linked to a project
- revenues / measurements must be linked to a project
- the dashboard must summarize project performance

---

## Target Users

### Primary User
- Business owner
- General manager
- Office administrator

### Secondary User
- Administrative assistant responsible for data entry

### Possible Future User
- Field operator or supervisor

For the MVP, assume the main use case is **office-side usage**, with manual data entry performed by administrative staff or management.

---

## MVP Scope

The MVP must include the following modules:

1. Clients
2. Projects
3. Machines
4. Operators
5. Daily Logs
6. Project Costs
7. Project Revenues / Measurements
8. Dashboard
9. Basic Reports

The MVP should be **simple, clear, and operationally useful**.

---

## Out of Scope

The following features must **not** be included in the MVP unless absolutely necessary for the current scope:

- GPS tracking
- telematics integrations
- IoT integrations
- advanced preventive maintenance workflows
- inventory / spare parts control
- tax invoicing
- accounting-grade finance
- payroll
- route optimization
- fuel station integrations
- mobile app
- offline sync complexity
- advanced multi-company support
- advanced role/permission systems
- audit-heavy enterprise workflows
- document OCR
- AI features
- chat features
- notifications infrastructure beyond basic local UX feedback
- overly complex analytics
- custom report builders

Do not expand the scope beyond the MVP.

---

## Core Business Concepts

The domain model is based on these concepts:

### Client
A company or person who hires the earthmoving service.

### Project
A specific work site or contract where the company performs services.

### Machine
An equipment asset used in the operation, such as:
- excavator
- bulldozer
- wheel loader
- motor grader
- roller
- dump truck
- backhoe

### Operator
A worker responsible for operating a machine or performing work associated with the project.

### Daily Log
A daily operational record for a project, including machine usage, operator, hours worked, and notes.

### Project Cost
Any cost attributable to a project, such as:
- fuel
- operator labor
- maintenance expense
- third-party service
- transport
- miscellaneous project expense

### Project Revenue / Measurement
A revenue entry or project measurement representing the amount billed or expected to be billed for work performed.

---

## Core Business Rules

These rules are critical and must guide the product behavior.

1. Every project must belong to one client.
2. Every daily log must belong to one project.
3. A daily log may reference one machine and one operator.
4. Hours worked must be recorded as a positive value.
5. Costs must always be attributable to a project.
6. Revenues / measurements must always be attributable to a project.
7. Project profitability must be calculated as:

   **total revenue - total cost**

8. A project can have one of these statuses at minimum:
   - planned
   - active
   - completed
   - canceled

9. Machines and operators can exist independently, but operational records only become meaningful when linked to a project.
10. The system must preserve historical data and allow users to review past project activity.
11. Editing records should be possible, but the application should maintain internal consistency and avoid ambiguous data.
12. The application should prioritize clarity and speed of administrative use over excessive complexity.

---

## Functional Requirements

## 1. Clients Module

The system must allow the user to manage clients.

### Required fields
- name
- document or registration identifier (optional in MVP if locale-specific complexity is not desired)
- phone
- email
- notes

### Required features
- create client
- list clients
- search clients
- edit client
- view related projects

### Notes
Keep this module simple.  
It mainly exists to organize projects.

---

## 2. Projects Module

This is the central module of the MVP.

### Required fields
- project name
- client
- location
- start date
- end date (optional)
- status
- contract amount or expected contract value
- notes / description

### Required features
- create project
- list projects
- filter by status
- search projects
- edit project
- open project details page
- show project summary:
  - client
  - status
  - date range
  - contract value
  - total costs
  - total revenues
  - estimated profit / loss

### Project details must show
- general info
- daily logs
- costs
- revenues / measurements
- profitability summary

### Notes
This module should make it easy for the user to understand the current state of a project quickly.

---

## 3. Machines Module

The system must manage machine and equipment records.

### Required fields
- machine name
- machine type
- identifier / asset code
- brand or model
- status
- notes

### Example statuses
- available
- allocated
- under maintenance
- inactive

### Required features
- create machine
- list machines
- search machines
- edit machine
- view usage history through daily logs

### Notes
Do not build advanced maintenance logic in this MVP.  
Basic machine registration and usage visibility are enough.

---

## 4. Operators Module

The system must manage operators.

### Required fields
- name
- phone
- role or function
- active status
- notes

### Required features
- create operator
- list operators
- search operators
- edit operator
- view related daily logs

### Notes
Keep this simple.  
This module exists so daily logs can link work to a responsible person.

---

## 5. Daily Logs Module

This is one of the most important parts of the MVP.

A daily log represents the work performed on a given date for a project.

### Required fields
- date
- project
- machine
- operator
- hours worked
- work description / service performed
- fuel quantity (optional but recommended in MVP)
- downtime or occurrence notes
- general notes

### Required features
- create daily log
- list daily logs
- filter by project
- filter by date range
- filter by machine
- filter by operator
- edit daily log
- delete daily log if necessary
- show logs inside the related project detail view

### Daily log purpose
This module must help answer:
- what was done today?
- who worked?
- which machine was used?
- for how many hours?
- was there downtime?
- how much fuel was used?

### Notes
Data entry should be fast and practical.  
Avoid complicated workflows.

---

## 6. Project Costs Module

The system must allow the user to record project-related costs.

### Required categories for MVP
- fuel
- labor
- maintenance
- transport
- outsourced service
- miscellaneous

### Required fields
- date
- project
- category
- description
- amount
- notes
- optional related machine
- optional related operator

### Required features
- create cost entry
- list cost entries
- filter by project
- filter by category
- filter by date range
- edit cost entry
- delete cost entry
- display aggregated project cost totals

### Notes
This is intentionally simple.  
The goal is not full finance management.  
The goal is project cost visibility.

---

## 7. Project Revenues / Measurements Module

The system must allow the user to record revenue or measurement entries associated with a project.

This can represent:
- invoiceable work
- measured progress
- partial billing
- payment expectation
- amount already billed or received

### Required fields
- date
- project
- description
- amount
- status
- notes

### Example statuses
- planned
- billed
- received

### Required features
- create revenue / measurement entry
- list entries
- filter by project
- filter by status
- edit entry
- delete entry
- aggregate totals per project

### Notes
Keep terminology flexible enough for real business usage.  
Some users will think in terms of "revenue", others in terms of "measurement" or "billing entry".

---

## 8. Dashboard Module

The dashboard should provide a quick management overview.

### Required dashboard widgets / summaries
- total active projects
- total completed projects
- total machines
- machines currently allocated
- total project costs
- total project revenues
- estimated overall profit
- recent daily logs
- projects with highest cost
- projects with best or worst result

### Dashboard principle
The dashboard must be useful but simple.  
Avoid building a heavy BI system.

### Notes
The dashboard should emphasize:
- project status
- operational activity
- financial result

---

## 9. Basic Reports

The MVP must include practical reports or report-like views.

### Minimum required reports
1. Project summary report
   - project info
   - total hours
   - total costs
   - total revenues
   - profit / loss

2. Daily logs report
   - filterable by date range and project

3. Machine usage report
   - total hours by machine
   - related project context if possible

4. Cost report
   - total costs by category
   - total costs by project

### Notes
For MVP, these can be implemented as filterable tables with summary cards.  
Do not overcomplicate export infrastructure unless it is already easy and aligned with the chosen architecture.

---

## Non-Functional Expectations

The application should feel like an internal business tool:
- reliable
- simple
- fast
- easy to navigate
- easy to maintain

### UX expectations
- clear administrative interface
- clean layout
- practical forms
- tables with search and filtering
- project-centric navigation
- obvious CRUD actions
- low friction for common workflows

### Data entry expectations
The user should be able to register operational and financial data quickly.  
Avoid requiring too many clicks for common actions.

### Maintainability expectations
The codebase should remain clean, modular, and aligned with the installed Electron skill.  
Do not introduce unnecessary abstractions or libraries.

---

## Suggested Application Structure

The UI should at least include these sections:

- Dashboard
- Clients
- Projects
- Machines
- Operators
- Daily Logs
- Costs
- Revenues / Measurements
- Reports

A sidebar-based admin navigation is acceptable if it matches the skill's implementation preferences.

---

## Suggested Entity Overview

Use the installed skill to decide exact implementation details, but the product should conceptually support these entities:

### Client
- id
- name
- document
- phone
- email
- notes
- createdAt
- updatedAt

### Project
- id
- clientId
- name
- location
- startDate
- endDate
- status
- contractAmount
- description
- createdAt
- updatedAt

### Machine
- id
- name
- type
- identifier
- brandModel
- status
- notes
- createdAt
- updatedAt

### Operator
- id
- name
- phone
- role
- isActive
- notes
- createdAt
- updatedAt

### DailyLog
- id
- date
- projectId
- machineId
- operatorId
- hoursWorked
- workDescription
- fuelQuantity
- downtimeNotes
- notes
- createdAt
- updatedAt

### ProjectCost
- id
- date
- projectId
- machineId
- operatorId
- category
- description
- amount
- notes
- createdAt
- updatedAt

### ProjectRevenue
- id
- date
- projectId
- description
- amount
- status
- notes
- createdAt
- updatedAt

This overview is meant to guide the product scope, not force a rigid technical implementation.

---

## Prioritized Delivery Order

Build the MVP in this order:

### Phase 1 — Foundation
- set up the Electron project according to the installed skill
- establish the project structure
- define routing/navigation
- prepare data persistence strategy
- create shared UI patterns

### Phase 2 — Core CRUD
- Clients
- Projects
- Machines
- Operators

### Phase 3 — Operational Core
- Daily Logs module
- project detail views
- link logs to projects, machines, and operators

### Phase 4 — Financial Core
- Project Costs
- Project Revenues / Measurements
- profitability calculations

### Phase 5 — Management Overview
- Dashboard
- basic report screens
- filters and summary cards

### Phase 6 — Refinement
- UX improvements
- validation improvements
- empty states
- loading states
- error handling
- polishing the administrative workflow

Do not jump to advanced features before the core workflow is complete.

---

## MVP Success Criteria

The MVP is successful if the user can:

1. register clients, projects, machines, and operators
2. log daily operational activity for projects
3. record project-related costs
4. record project-related revenues or measurements
5. open a project and see:
   - its activity
   - its total costs
   - its total revenues
   - its estimated result
6. use the dashboard to understand the current business situation at a high level

If those goals are achieved cleanly, the MVP is already useful.

---

## Design and Product Direction

This is a **business desktop tool**, not a marketing website.

Prioritize:
- clarity
- usability
- fast forms
- good table organization
- strong project-level summaries
- maintainable internal admin UI patterns

Avoid:
- decorative complexity
- over-designed animations
- feature creep
- unnecessary enterprise patterns
- futuristic modules not needed for MVP

---

## Development Constraints

Follow these rules during implementation:

1. Follow the installed Electron skill for architecture and technical decisions.
2. Keep the scope strictly limited to the MVP defined in this file.
3. Prefer maintainable and modular code.
4. Avoid unnecessary libraries and abstractions.
5. Do not implement advanced future features unless they are required by the current MVP.
6. Use clear naming and strong separation of concerns.
7. Prioritize business usability over technical novelty.
8. Keep the codebase easy to expand later into:
   - maintenance
   - fuel control improvements
   - inventory
   - mobile field usage
   - stronger reporting

---

## Final Instruction

Build a clean, maintainable, project-centered desktop MVP for an earthmoving management business.

The application must help the user manage:
- projects
- machines
- operators
- daily operations
- costs
- revenues
- profitability

Use the installed Electron skill for implementation quality and technical best practices.  
Use this document as the source of truth for **product scope and business requirements**.
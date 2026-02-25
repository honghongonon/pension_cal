# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Korean Pension & Retirement Finance Portal — a static HTML/CSS/JS calculator suite for retirement planning (국민연금, 퇴직연금, 개인연금, 절세전략, 건강보험료, 노후자금 설계). Targets users aged 50-60+ with large fonts and accessible design. Based on 2025-2026 Korean regulations.

## Running the Project

No build tools, bundlers, or package manager. Open `index.html` in a browser or serve via any static file server.

## Architecture

### Core Modules (load order matters)

1. **`js/constants.js`** — Single source of truth for all Korean financial parameters (pension rates, tax brackets, insurance rates, deduction schedules). Update this file yearly when regulations change; all pages consume it automatically.

2. **`js/calculator-engine.js`** — `CalcEngine` object with five calculation modules: `nationalPension`, `retirementPension`, `tax`, `healthInsurance`, `retirementFund`. Pure math, no DOM access.

3. **`js/common.js`** — `APP` global with shared utilities: `nav` (dynamic navigation), `format` (Korean number/currency formatting), `input` (money field auto-formatting), `storage` (localStorage with `pension_portal_` prefix), `chart` (Chart.js wrapper), `tooltip`, `disclaimer`.

4. **Pages** (`index.html` + `pages/*.html`) — Each page has its own controller object (e.g., `NationalPension`, `RetirementPension`, `TaxStrategy`, `HealthInsurance`, `RetireFund`, `Dashboard`) defined inline. Pages load scripts in order: constants → calculator-engine → common → inline page script.

### Page Structure Pattern

Every calculator page follows:
```
nav#main-nav → .container → .page-header → .info-box → .calc-layout
  ├── .calc-input-panel (form inputs with .input-section groups)
  └── .calc-result-panel (results, cards, Chart.js canvases)
→ footer#footer
```

### Key Conventions

- **Money fields**: Use `data-type="money"` for auto-comma formatting. Read values via `APP.input.getMoneyValue()`, display via `APP.format.manwon()`.
- **Data persistence**: All forms auto-save/restore to localStorage via `APP.storage.save('form_' + formId, data)` and `APP.storage.restoreForm(formId)`.
- **Charts**: Use `APP.chart.create(canvasId, config)` with predefined color palette in `APP.chart.colors`.
- **ID prefixes**: `np-` (national pension), `rp-` (retirement pension), `pp-` (personal pension), `ts-` (tax strategy), `hi-` (health insurance), `rf-` (retirement fund), `dash-` (dashboard).
- **Inline event handlers**: Pages use `onclick="Controller.method()"` pattern.
- **Commit messages**: Korean, conventional commit style (`feat:`, `fix:`, `style:`).

### CSS Architecture

- `css/common.css` — Theme via CSS variables, fixed nav (70px), responsive grid, component classes (`.card`, `.form-group`, `.result-banner`, `.result-mini-grid`).
- `css/calculator.css` — Two-column calculator layouts, input sections, sticky panels.
- Designed for elderly users: base 16px font, headings 22-36px, high contrast (#1B5E7B primary, #2C3E50 text), generous spacing.

## Maintenance

- **Annual regulatory updates**: Edit `js/constants.js` only — pension A값, 소득대체율, tax brackets, health insurance rate, property grade tables.
- **Adding a new calculator page**: Copy an existing page in `pages/`, create controller object, add nav entry in `APP.nav` items (in `common.js`).
- Korean government reference sites are pre-approved for WebFetch in `.claude/settings.local.json`.

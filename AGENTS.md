# AGENTS.md

This file defines the repository contract for coding agents and maintainers.

## Product intent

Maintain a small, privacy-first, browser-based toolkit for aggregated retail/CX metrics. Prefer simple static code over infrastructure unless a real issue justifies additional complexity.

## Non-negotiable privacy rules

Never add:

- real customer or employee personal data;
- private company exports;
- credentials, tokens or internal URLs;
- proprietary screenshots or brand assets without permission;
- unverifiable claims of production usage, adoption or affiliation.

Use synthetic fixtures for tests and examples.

## Metric integrity

Before adding a KPI, document:

1. grain;
2. population;
3. numerator;
4. denominator;
5. period;
6. maturity/cohort rules;
7. treatment of missing values and zero.

Do not infer conversion, growth or comparison when the source does not support it.

## Required checks

For logic changes, run the relevant Node-compatible suites:

```bash
node tests.js
node nps-tests.js
node agenda-tests.js
node ventas-tests.js
node cotizaciones-tests.js
```

For the local server:

```bash
python3 -m py_compile serve_demo.py
python3 serve_demo.py
```

Browser-level verification is documented in `VERIFICATION.md`. If UI behavior changes, update or rerun the relevant browser regression suite.

## Change discipline

- Keep commits narrowly scoped.
- Add a test for logic changes.
- Preserve zero vs missing semantics.
- Keep total and detail rows distinct in exports.
- Neutralize spreadsheet formulas in exported labels.
- Avoid dependencies unless they remove more complexity than they add.
- Update docs when definitions or limitations change.

## Review checklist

A PR should state:

- problem;
- change;
- verification performed;
- privacy impact;
- known limitations.

If a proposed change depends on private operational evidence, replace it with a synthetic reproduction before committing.

## OSS maintenance

Prefer authentic public maintenance signals over cosmetic activity. Do not create fake issues, contributors, stars, forks, releases or usage claims.

# Optical Retail Metrics

[Español](README.es.md)

**Privacy-first, open-source analytics for retail and customer-experience teams.**  
Optical Retail Metrics is an early-stage static toolkit for exploring aggregated NPS, appointments, sales and quote-recovery metrics locally in the browser.

The project started from optical-retail use cases, but its architecture is intentionally generic: data stays on the user's machine, examples are synthetic, and the app does not require a backend, telemetry, an account or an Internet connection.

> Status: early-stage OSS project. Public adoption, production usage and external contributor activity are **not claimed**. The goal of this repository is to make the tool easier to test, review and improve in public.

## Why this project exists

Retail and CX teams often need to inspect operational exports without sending sensitive data to another service. This project explores a simple model:

- process CSV files locally in the browser;
- validate schemas before calculating metrics;
- keep missing values and zeros semantically distinct;
- avoid inventing rates when cohorts or denominators are not comparable;
- export only the active selection;
- use synthetic fixtures for public tests and examples.

## Modules

| Module | What it shows | Important limitation |
|---|---|---|
| NPS | response counts and weighted NPS | no reconstructed time series |
| Appointments | appointment volumes by period | no attendance/conversion rate without matched cohorts |
| Sales | EUR totals by country | no accounting interpretation beyond the declared source |
| Quotes | offers, quotes, app sales and closed recoveries | measures are independent; no invented conversion rate |

## Try it

### Local demo

Requirements: Python 3 and a modern browser.

```bash
git clone https://github.com/gabrielgomar-droid/optical-retail-metrics.git
cd optical-retail-metrics
python3 serve_demo.py
```

Then open **http://127.0.0.1:8765/home.html**.

### Hosted demo

A GitHub Pages deployment workflow is included in `.github/workflows/pages.yml`. Once Pages is enabled for the repository, the intended URL is:

**https://gabrielgomar-droid.github.io/optical-retail-metrics/home.html**

Do not treat that URL as live until GitHub Pages reports a successful deployment.

## Verification

The repository currently documents:

- **176/176** logic checks across CSV parsing, NPS, appointments, sales and quotes.
- **136/136** browser scenarios in the recorded Chrome regression run.
- synthetic fixtures only;
- CSV formula-injection neutralization on export;
- explicit size/row limits and schema rejection;
- no backend, telemetry or persistence.

See [VERIFICATION.md](VERIFICATION.md) for the exact scope and limitations. These checks support the behavior of the prototype; they do not prove production readiness, public adoption or independent security review.

## Contributing

External testing is useful even if you do not write code.

Good first contributions include:

- report a browser compatibility issue;
- propose a clearer generic KPI definition;
- test a synthetic CSV edge case;
- improve accessibility;
- add a reproducible fixture;
- suggest a generic retail/CX workflow that does not depend on private company data.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR. Bug and feature templates are available in GitHub Issues.

For structured feedback, use the [external tester thread](https://github.com/gabrielgomar-droid/optical-retail-metrics/issues/2).

## Maintainer workflow and Codex

[AGENTS.md](AGENTS.md) documents the repository contract for coding agents and maintainers: privacy constraints, test commands, review expectations and files that should not contain real business data.

GitHub Actions runs the Node-compatible logic suites and Python syntax checks on pushes and pull requests.

## Privacy and data policy

This public repository must not contain:

- customer or employee personal data;
- internal company exports;
- credentials, tokens or private URLs;
- proprietary screenshots or brand assets;
- real operational datasets without explicit permission and an appropriate license.

Use synthetic or independently licensed data in issues and pull requests. See [docs/PRIVACY.md](docs/PRIVACY.md).

## Roadmap

Near-term priorities are intentionally practical:

1. get external testers using the hosted demo;
2. collect real issues instead of manufacturing activity;
3. improve accessibility and cross-browser coverage;
4. publish reproducible releases;
5. generalize schemas where that adds real utility.

See [ROADMAP.md](ROADMAP.md).

## License

MIT for the code and synthetic fixtures included in this repository. Third-party and business data are outside that license unless explicitly stated otherwise.

---

If you work in optical retail, retail operations, CX analytics or privacy-sensitive reporting and want to test the project, open an issue with a **synthetic reproduction**. Real-world feedback is more valuable than stars.

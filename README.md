# GRC Practice Lab

A full-featured browser workspace for practicing Governance, Risk and Compliance workflows.

## What is included

- GRC command dashboard with health score, due dates, risk heatmap and advisor
- Registers for assets, vendors, policies, appetite, risks, controls, treatments, evidence, audits, tests, findings, requirements, exceptions, issues, tasks, incidents, BIA, BCM, SOX and ITGC
- Add, edit, delete, search and filter support across core modules
- Risk matrix, control lifecycle, control mapping, Statement of Applicability and traceability views
- Generated framework library with ISO 27001, NIST CSF, CIS, SOC 2, PCI DSS, SOX ITGC and GDPR practice controls
- Practice scenarios, ISO 27001 Lead Implementer lab, WebGPU setup checklist, community roadmap, local GRC advisor, interview prep, guided missions and portfolio builder
- Beginner mode and developer data-model mode
- JSON import/export, CSV risk export and Markdown executive report

Data is stored in the browser's local storage for this static practice lab. Use Export JSON to back up or move a workspace.

## Tech stack

- React 19
- Next/vinext
- Cloudflare Worker-compatible Sites build output
- Local browser persistence

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by the dev server.

## Validate

```bash
npm run build
```

## Repository notes

This project was built as an original implementation inspired by the workflow shape of a public GRC practice lab. It does not copy the source code or authored content from that site.

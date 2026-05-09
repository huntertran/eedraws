# Express Entry Draws

A dashboard for tracking Canadian Express Entry rounds of invitations. Displays the latest CRS score cutoffs, invitation counts, score distributions, and historical trends — sourced directly from IRCC's official data.

**Live site:** https://huntertran.github.io/eedraws/

## Features

- **Latest draw** — draw number, date, category, CRS cutoff, and invitations issued
- **Score distribution** — bar chart of CRS scores in the current candidate pool
- **CRS history** — line chart of cutoff scores over time, filterable by draw category
- **Score heatmap** — how score distributions have shifted across all draws

## Tech stack

Vanilla JS, Bootstrap 5, Plotly, Knockout.js. No build step.

Data fetched from IRCC:
`https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json`

## Running locally

Open `index.html` in a browser. That's it.

## License

GNU General Public License v3 — see [LICENSE](LICENSE).

# Agentic Engineering und Governance

The published results of a workshop on rules for AI agents at Digital Humanities Craft, served through GitHub Pages at https://digitalhumanitiescraft.github.io/agentic-governance-workspace/. The start page links four parts:

- `leitlinien/`, the card workspace described below,
- the governance draft as Beschlussvorlage 1.0 (PDF) and the pitch deck for the owners (PPTX) in `material/`,
- `northwind/`, a revenue page for a fictional exercise inquiry, built from the Microsoft Northwind sample data and showing sums only.

## Card workspace

A static page that shows the guidelines Digital Humanities Craft derived for the use of AI agents in client projects, research and programming. Every rule and every source is a card. A rule names its status, its goal and the sources it rests on, with pages. A source carries an own summary and a link to the original at its publisher. Selecting a source marks the rules resting on it, selecting a rule marks its sources.

The interface is German, the rules and summaries are English.

## Use

Open `leitlinien/index.html` in a browser, locally by double click or through GitHub Pages. Search, filters and selection run in the browser and are kept in the URL, so a link shows the same view. The page loads no external services, sets no cookies and stores nothing.

## Content and provenance

`data.js` is generated from a private, source-backed knowledge base and holds only:

- metadata of each source (title, publisher, date, category, link to the publisher),
- an own summary of each source in relation to the guiding question,
- the guideline rules with status, goal, field and cited pages.

The sources themselves are not part of this repository and belong to their publishers. Page numbers refer to the PDF of the source as published. Most sources date from 2026; three older legal texts and guidelines on the data protection officer were added as a recorded exception. The rules are a working state of an organisation, not legal advice.

## Structure

| Path | Content |
| --- | --- |
| `index.html`, `start.css` | Start page |
| `leitlinien/` | Card workspace: `index.html`, `style.css`, `app.js`, generated `data.js`, and `assets/` with logo and fonts |
| `material/` | Governance PDF, pitch deck, a contact sheet of the slides and an overview image |
| `northwind/` | Revenue page with generated `data.js` and the licence of the sample data |

## Licence

Texts and data by Digital Humanities Craft under CC BY 4.0, code under MIT, see [LICENSE.md](LICENSE.md). The fonts are under the SIL Open Font License, see `leitlinien/assets/fonts/`. The Northwind sample data are by Microsoft under the MIT License, see `northwind/LICENSE-northwind.txt`.

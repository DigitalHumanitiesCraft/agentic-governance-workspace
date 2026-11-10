# Agentic Engineering und Governance

The published results of a workshop on rules for AI agents at Digital Humanities Craft, served through GitHub Pages at https://dhcraft.org/agentic-governance-workspace/. The workspace described below is the start page. Shared navigation and the materials footer lead to

- the governance draft as Beschlussvorlage 1.0 (PDF) and the pitch deck for the owners (PPTX) in `material/`,
- `northwind/`, a revenue page for a fictional exercise inquiry, built from the Microsoft Northwind sample data and showing sums only,
- the public copy of the vault, https://github.com/DigitalHumanitiesCraft/agentic-governance-vault, without the stored originals of the sources,
- `ueber.html`, an overview with the result image, provenance, limits and licence.

## Workspace

The knowledge view presents rules in compact rows with editorial German navigation labels, their status, goal and source links. Opening a rule shows its complete English wording, the meaning of its status and the cited pages. The short label helps navigation and does not replace the rule. Sources retain their own summaries and publisher links. Selecting a source highlights the rules resting on it.

The work view opens directly on a project. Its overview, deliverables, applied rules, revenue and decisions have separate addressable sections. General work and its history remain accessible through the work navigation. A rule's project link opens the relevant application.

## Use

Open `index.html` in a browser, locally by double click or through GitHub Pages. Search, filters and selection run in the browser and are kept in the URL, so a link shows the same view. The page loads no external services, sets no cookies and stores nothing.

Search covers German navigation labels, complete rule wording, source titles, metadata and summaries available in this public data set. The original source full texts are not included. Suggestions respect active filters and rank title matches before body matches. Use the arrow keys to select a suggestion, Enter to open it and Escape to close the list. Quoted phrases require contiguous wording; unquoted words must all occur. Alternative German umlaut spellings are supported.

Checkboxes retain multiple choices within a facet. Choices within one facet are combined with OR, different facets with AND. Search, filters, selection and the active project section remain in the URL, including browser Back and Forward.

## Content and provenance

`data.js` is generated from a private, source-backed knowledge base and holds only:

- metadata of each source (title, publisher, date, category, link to the publisher),
- an own summary of each source in relation to the guiding question,
- the guideline rules with status, goal, field and cited pages.

The sources themselves are not part of this repository and belong to their publishers. Page numbers refer to the PDF of the source as published. Most sources date from 2026; three older legal texts and guidelines on the data protection officer were added as a recorded exception. The rules are a working state of an organisation, not legal advice.

## Structure

| Path | Content |
| --- | --- |
| `index.html`, `style.css`, `app.js`, `search.js`, `data.js`, `assets/` | Public workspace maintained here; only `data.js` is generated upstream and must not be edited by hand. `assets/` holds logo and fonts |
| `chrome.css` | Shared header, navigation and footer styles |
| `tests/search.test.cjs` | Dependency-free search regression checks |
| `ueber.html`, `start.css` | Overview with the result image, provenance, limits and licence |
| `leitlinien/` | Forwards old links, hash included, to the start page |
| `material/` | Governance PDF, pitch deck, a contact sheet of the slides and an overview image |
| `northwind/` | Revenue page with generated `data.js` and the licence of the sample data |

## Verification

Run `node --check app.js`, `node --check search.js` and `node --test tests/search.test.cjs`. Browser checks cover suggestions with pointer and keyboard, phrase and multiword queries, combined filters, source details, project applications and history navigation. Inspect wide and narrow views with real content, including empty results and an open detail.

The interface keeps classic scripts and the generated global data to support opening the page directly from disk. There is no package installation or build step.

## Licence

Texts and data by Digital Humanities Craft under CC BY 4.0, code under MIT, see [LICENSE.md](LICENSE.md). The fonts are under the SIL Open Font License, see `assets/fonts/`. The Northwind sample data are by Microsoft under the MIT License, see `northwind/LICENSE-northwind.txt`.

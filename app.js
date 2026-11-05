/*
 * Public card workspace of the knowledge base.
 *
 * Data: window.KB_PUBLIC from data.js, written by scripts/build_dashboard.py
 * from the curated public part of the knowledge base (source metadata, own
 * summaries, the guideline rules). Nothing else is loaded.
 *
 * State (search, filters, selected card) lives in the URL hash, so a link
 * shows the same view. Selecting a card adds a history entry; filtering
 * replaces it.
 *
 * Deliberate deviation from the no-build house regime: a classic script and
 * data as a global, so the page also works opened from the file system.
 *
 * Trust boundary: all data is inserted with textContent, except the summary
 * HTML, which the build renders from Markdown with raw HTML escaped and with
 * internal links removed.
 */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && value !== null && value !== false) node.setAttribute(key, value);
    }
    node.append(...children.filter((c) => c !== undefined && c !== null && c !== ""));
    return node;
  }

  const DATA = window.KB_PUBLIC;
  if (!DATA) {
    $("board").replaceChildren(el("p", { class: "empty" }, "Die Daten fehlen. Erzeuge sie mit uv run scripts/build_dashboard.py."));
    return;
  }

  const FIELDS = ["Projekte", "Forschung", "Programmierung", "Organisation"];
  const STATUS = {
    Pflicht: "folgt aus dem Gesetz, hier AI Act und DSGVO",
    Vorgabe: "bindende Regel eines Förderers oder einer Organisation",
    Empfehlung: "Leitlinie einer Behörde oder Einrichtung, nicht bindend",
    Ableitung: "aus den Quellen gezogen, von ihnen selbst nicht so formuliert",
    Befund: "empirisches Ergebnis einer Studie",
  };
  const GOALS = {
    regelkonform: "dient der Einhaltung von Recht, Datenschutz und Fördervorgaben",
    sicher: "schützt Daten, Systeme und Kunden vor Fehlern und Angriffen durch Agents",
    "nachprüfbar": "hält die Arbeit von Agents nachvollziehbar und prüfbar",
  };
  const KINDS = { rule: "Regeln", source: "Quellen" };

  // ---- Search ------------------------------------------------------------------

  // Lower case, without diacritics, hyphens as spaces; "massnahme" also
  // finds "Maßnahme" and "pruefung" finds "Prüfung".
  const fold = (text) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[-‐‑]/g, " ");
  function variants(term) {
    return [...new Set([term, term.replace(/(^|[^q])([aou])e(?=[a-zß]{2})/g, "$1$2"), term.replace(/ss/g, "ß")])];
  }
  const plain = (html) => html.replace(/<[^>]+>/g, " ");

  const sources = DATA.sources.map((s) => ({
    ...s, kind: "source",
    haystack: fold([s.title, s.publisher, s.category, s.abstract, plain(s.summary)].join(" ")),
  }));
  const byId = new Map(sources.map((s) => [s.id, s]));
  const rules = DATA.rules.map((r) => ({
    ...r, kind: "rule",
    haystack: fold([r.text, r.field, r.status, r.goal, ...r.sources.map((s) => `${s.label} ${byId.get(s.id)?.title || ""}`)].join(" ")),
  }));
  for (const r of rules) byId.set(r.id, r);
  const CATEGORIES = [...new Set(sources.map((s) => s.category))].sort((a, b) => a.localeCompare(b, "de"));

  // ---- State -------------------------------------------------------------------

  const LISTS = { kind: "k", field: "f", status: "s", goal: "g", cat: "c" };
  function parseHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    const state = { q: p.get("q") || "", sel: p.get("sel") || "" };
    for (const [key, short] of Object.entries(LISTS)) state[key] = p.get(short) ? p.get(short).split("|") : [];
    return state;
  }
  function hashFor(s) {
    const p = new URLSearchParams();
    if (s.q) p.set("q", s.q);
    for (const [key, short] of Object.entries(LISTS)) if (s[key].length) p.set(short, s[key].join("|"));
    if (s.sel) p.set("sel", s.sel);
    return "#" + p.toString();
  }
  let state = parseHash();
  let opener = null;

  // A selection pushes an entry marked as the app's own, so closing can go
  // back instead of adding another entry.
  function go(changes, push = false) {
    state = { ...state, ...changes };
    if (push) history.pushState({ app: true }, "", hashFor(state));
    else history.replaceState(history.state, "", hashFor(state));
    render();
  }

  // ---- Filtering -------------------------------------------------------------

  function matchesQuery(item) {
    const words = fold(state.q).split(/\s+/).filter(Boolean);
    return words.every((w) => variants(w).some((v) => item.haystack.includes(v)));
  }
  const showKind = (kind) => !state.kind.length || state.kind.includes(kind);
  function ruleVisible(r) {
    return showKind("rule") && matchesQuery(r) &&
      (!state.field.length || state.field.includes(r.field)) &&
      (!state.status.length || state.status.includes(r.status)) &&
      (!state.goal.length || state.goal.includes(r.goal));
  }
  function sourceVisible(s) {
    return showKind("source") && matchesQuery(s) && (!state.cat.length || state.cat.includes(s.category));
  }

  // ---- Highlight -------------------------------------------------------------

  function highlight(node) {
    const needles = fold(state.q).split(/\s+/).filter((w) => w.length > 2).flatMap(variants);
    if (!needles.length) return node;
    const text = node.textContent;
    const folded = fold(text);
    const ranges = [];
    for (const n of needles) {
      for (let at = folded.indexOf(n); at !== -1; at = folded.indexOf(n, at + n.length)) ranges.push([at, at + n.length]);
    }
    if (!ranges.length) return node;
    ranges.sort((a, b) => a[0] - b[0]);
    const parts = [];
    let pos = 0;
    for (const [a, b] of ranges) {
      if (a < pos) continue;
      parts.push(text.slice(pos, a), el("mark", {}, text.slice(a, b)));
      pos = b;
    }
    parts.push(text.slice(pos));
    node.replaceChildren(...parts);
    return node;
  }

  // ---- Controls --------------------------------------------------------------

  function chip(group, value, label) {
    const b = el("button", { type: "button", class: "chip", "data-group": group, "data-value": value, "aria-pressed": "false" }, label, el("span", { class: "n" }));
    b.addEventListener("click", () => {
      const list = state[group].includes(value) ? state[group].filter((v) => v !== value) : [...state[group], value];
      go({ [group]: list });
    });
    return b;
  }

  function buildControls() {
    $("f-kind").append(...Object.entries(KINDS).map(([v, l]) => chip("kind", v, l)));
    $("f-field").append(...FIELDS.map((v) => chip("field", v, v)));
    $("f-status").append(...Object.keys(STATUS).filter((s) => rules.some((r) => r.status === s)).map((v) => chip("status", v, v)));
    $("f-goal").append(...Object.keys(GOALS).map((v) => chip("goal", v, v)));
    $("f-cat").append(...CATEGORIES.map((v) => chip("cat", v, v)));
    $("q").addEventListener("input", (e) => go({ q: e.target.value }));
    $("search-form").addEventListener("submit", (e) => e.preventDefault());
    $("reset").addEventListener("click", () => go({ q: "", kind: [], field: [], status: [], goal: [], cat: [] }));
    const glossary = $("glossary");
    for (const [term, def] of [...Object.entries(STATUS), ...Object.entries(GOALS)]) {
      glossary.append(el("dt", {}, term), el("dd", {}, def));
    }
    $("stand").textContent = DATA.generated;
    // On a phone the filters fold away, so the cards come first.
    if (window.matchMedia("(max-width: 48rem)").matches && !state.q && !Object.keys(LISTS).some((k) => state[k].length)) $("filters").open = false;
  }

  function syncControls() {
    if ($("q").value !== state.q) $("q").value = state.q;
    // Counts per value, given the search and the other filters.
    const countFor = (group, value) => {
      const probe = { ...state, [group]: [value] };
      const saved = state;
      state = probe;
      const n = group === "cat" ? sources.filter(sourceVisible).length
        : group === "kind" ? (value === "rule" ? rules : sources).filter(value === "rule" ? ruleVisible : sourceVisible).length
        : rules.filter(ruleVisible).length;
      state = saved;
      return n;
    };
    for (const b of document.querySelectorAll(".chip")) {
      const { group, value } = b.dataset;
      b.setAttribute("aria-pressed", String(state[group].includes(value)));
      b.querySelector(".n").textContent = String(countFor(group, value));
    }
    const filtered = state.q || Object.keys(LISTS).some((k) => state[k].length);
    $("reset").hidden = !filtered;
  }

  // ---- Cards -------------------------------------------------------------------

  const selected = () => byId.get(state.sel);

  function linkedTo(item) {
    const sel = selected();
    if (!sel || sel === item) return false;
    if (sel.kind === "source") return item.kind === "rule" && item.sources.some((s) => s.id === sel.id);
    return item.kind === "source" && sel.sources.some((s) => s.id === item.id);
  }

  function cardShell(item, ...content) {
    const linked = linkedTo(item);
    const a = el("a", {
      class: `card${item.id === state.sel ? " selected" : ""}${linked ? " linked" : ""}`,
      href: hashFor({ ...state, sel: item.id }),
      "data-id": item.id,
      "aria-current": item.id === state.sel ? "true" : undefined,
    });
    if (linked) a.append(el("span", { class: "link-note" }, selected().kind === "source" ? "beruht auf der gewählten Quelle" : "Grundlage der gewählten Regel"));
    a.append(...content);
    return a;
  }

  function ruleCard(r) {
    const labels = [...new Set(r.sources.map((s) => s.label))].join(", ");
    return cardShell(r,
      highlight(el("p", { class: "text" }, r.text)),
      el("p", { class: "basis" }, `Grundlage: ${labels}`),
      el("p", { class: "meta" }, el("span", { class: "strong" }, r.status), el("span", {}, r.goal)));
  }

  function sourceCard(s) {
    const n = s.rules.length;
    return cardShell(s,
      highlight(el("h4", {}, s.title)),
      highlight(el("p", { class: "abstract" }, s.abstract)),
      el("p", { class: "meta" },
        el("span", {}, s.publisher),
        el("span", {}, s.date),
        el("span", { class: n ? "strong" : undefined }, n === 1 ? "Grundlage für 1 Regel" : n ? `Grundlage für ${n} Regeln` : "keine Regel beruht darauf")));
  }

  function grouped(items, keyOf, order, cardOf) {
    const out = [];
    for (const key of order) {
      const members = items.filter((i) => keyOf(i) === key);
      if (!members.length) continue;
      out.push(el("h3", {}, key, el("span", { class: "n" }, String(members.length))),
        el("div", { class: "grid" }, ...members.map(cardOf)));
    }
    return out;
  }

  function renderBoard() {
    const vr = rules.filter(ruleVisible);
    const vs = sources.filter(sourceVisible);
    $("rules-section").hidden = !showKind("rule");
    $("sources-section").hidden = !showKind("source");
    $("rules-head").replaceChildren("Regeln", el("span", { class: "n" }, `${vr.length} von ${rules.length}`));
    $("sources-head").replaceChildren("Quellen", el("span", { class: "n" }, `${vs.length} von ${sources.length}`));
    const ruleGroups = grouped(vr, (r) => r.field, FIELDS, ruleCard);
    const sourceGroups = grouped(vs, (s) => s.category, CATEGORIES, sourceCard);
    $("rules").replaceChildren(...(ruleGroups.length ? ruleGroups : [el("p", { class: "empty" }, "Keine Regel passt zu Suche und Filtern.")]));
    $("sources").replaceChildren(...(sourceGroups.length ? sourceGroups : [el("p", { class: "empty" }, "Keine Quelle passt zu Suche und Filtern. Viele Quellen sind englisch, ein englischer Begriff findet dort mehr.")]));
    $("status").textContent = `${vr.length + vs.length} Karten`;
  }

  // ---- Panel -------------------------------------------------------------------

  function host(url) {
    try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; }
  }

  function facts(pairs) {
    const dl = el("dl", { class: "facts" });
    for (const [term, value, def] of pairs) {
      if (!value) continue;
      dl.append(el("dt", {}, term), el("dd", {}, value, def ? el("span", { class: "def" }, def) : null));
    }
    return dl;
  }

  function itemLink(item, meta) {
    return el("li", {}, el("a", { href: hashFor({ ...state, sel: item.id }) },
      item.kind === "rule" ? item.text : item.title, el("span", { class: "meta" }, meta)));
  }

  function panelFor(item) {
    const close = el("button", { type: "button", class: "close", "aria-label": "Panel schließen" }, "Schließen");
    close.addEventListener("click", closePanel);
    if (item.kind === "rule") {
      const basis = el("ul", { class: "items" }, ...item.sources.map((s) => {
        const src = byId.get(s.id);
        const pages = s.pages.length ? `S. ${s.pages.join(", ")}` : "Abschnitt im Text";
        return itemLink(src, `${s.label}, ${pages}`);
      }));
      return [close, el("p", { class: "kind" }, `Regel im Feld ${item.field}`),
        el("h2", { id: "panel-title", tabindex: "-1" }, item.text),
        facts([["Status", item.status, STATUS[item.status]], ["Ziel", item.goal, GOALS[item.goal]]]),
        el("h3", {}, "Grundlagen"), basis,
        el("p", { class: "fine" }, "Seitenangaben beziehen sich auf das PDF der Quelle beim Herausgeber.")];
    }
    const ruleList = item.rules.map((id) => byId.get(id));
    const summary = el("div", { class: "summary" });
    summary.innerHTML = item.summary; // rendered at build time, raw HTML escaped, internal links removed
    for (const a of summary.querySelectorAll("a[href]")) { a.target = "_blank"; a.rel = "noopener"; }
    return [close, el("p", { class: "kind" }, `Quelle, ${item.category}`),
      el("h2", { id: "panel-title", tabindex: "-1" }, item.title),
      facts([["Herausgeber", item.publisher], ["Datum", item.dateNote || item.date], ["Verbindlichkeit", item.binding], ["Hinweis", item.note]]),
      item.url ? el("a", { class: "original", href: item.url, target: "_blank", rel: "noopener" }, `Original bei ${host(item.url)} öffnen`) : null,
      el("h3", {}, ruleList.length ? `Regeln auf dieser Grundlage (${ruleList.length})` : "Regeln auf dieser Grundlage"),
      ruleList.length ? el("ul", { class: "items" }, ...ruleList.map((r) => itemLink(r, `${r.status}, ${r.field}`)))
        : el("p", { class: "empty" }, "Keine der Leitlinien beruht auf dieser Quelle. Sie steht in der Wissensbasis als Hintergrund."),
      el("h3", {}, "Zusammenfassung"), summary,
      el("p", { class: "fine" }, "Die Zusammenfassung ist eine eigene Auswertung mit Blick auf die Leitfrage. Seitenangaben beziehen sich auf das PDF der Quelle.")];
  }

  let shown = "";
  function renderPanel() {
    const item = selected();
    const panel = $("panel");
    $("workspace").classList.toggle("selecting", Boolean(item));
    panel.hidden = !item;
    // Where the panel covers the page, the content behind it is out of reach.
    const covering = Boolean(item) && window.matchMedia("(max-width: 72rem)").matches;
    for (const el of document.querySelectorAll(".controls, #board, .foot, .top")) el.inert = covering;
    if (!item) {
      shown = "";
      return;
    }
    if (shown !== item.id) {
      panel.replaceChildren(...panelFor(item));
      panel.scrollTop = 0;
      shown = item.id;
      $("panel-title").focus({ preventScroll: true });
    }
  }

  // Closing returns focus to the card that opened the panel, once the board
  // is drawn again (after history.back() that happens on popstate).
  let returnFocus = false;
  function closePanel() {
    returnFocus = true;
    if (history.state && history.state.app) history.back();
    else go({ sel: "" });
  }

  // ---- Render ------------------------------------------------------------------

  function render() {
    syncControls();
    renderBoard();
    renderPanel();
    if (returnFocus && !state.sel) {
      returnFocus = false;
      const back = opener && document.querySelector(`.card[data-id="${CSS.escape(opener)}"]`);
      (back || $("board")).focus({ preventScroll: Boolean(back) });
    }
  }

  document.addEventListener("click", (event) => {
    // Only links that select a card are handled here; the skip link and
    // other anchors keep their normal behaviour.
    const a = event.target.closest("a[href*='sel=']");
    if (!a || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const card = a.closest(".card");
    if (card) opener = card.dataset.id;
    // Links inside the page only change the selection; filters stay.
    const sel = new URLSearchParams(a.getAttribute("href").slice(1)).get("sel") || "";
    go({ sel }, true);
  });

  document.addEventListener("keydown", (event) => {
    const inField = event.target instanceof Element && event.target.closest("input");
    if (event.key === "Escape" && state.sel && !inField) closePanel();
  });
  window.addEventListener("popstate", () => { state = parseHash(); render(); });
  window.addEventListener("hashchange", () => {
    // An empty hash and "#" are the same state; a second render would drop focus.
    if ((location.hash || "#") !== hashFor(state)) { state = parseHash(); render(); }
  });

  buildControls();
  render();
})();

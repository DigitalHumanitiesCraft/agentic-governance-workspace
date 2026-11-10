/*
 * Source-backed rules and projects from the generated public data.js.
 * Navigation labels are editorial aids; the complete rule wording and its
 * citations remain authoritative in the detail. Search, filters, selection
 * and project sections live in the URL and preserve browser history.
 *
 * Classic scripts and global data deliberately support opening from disk.
 * Upgrade path: serve the application and use modules with JSON data.
 *
 * Trust boundary: HTML in the generated data is escaped by the upstream
 * Markdown exporter. Metadata, navigation labels and source text are always
 * inserted with textContent. No external service is contacted by the search.
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

  const DATA = window.KB_DATA;
  if (!DATA) {
    $("board").replaceChildren(el("p", { class: "empty" },
      "Die Inhalte konnten nicht geladen werden. Lade die Seite erneut."));
    return;
  }

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
  const KINDS = {
    rule: { many: "Regeln", one: "Regel" },
    source: { many: "Quellen", one: "Quelle" },
    knowledge: { many: "Wissensdokumente", one: "Wissensdokument" },
    note: { many: "Notizen, Protokolle und Projekte", one: "Notiz" },
  };
  // Editorial navigation labels; complete rule wording remains in the detail.
  const RULE_LABELS = new Map([
    "Datenflüsse und Verarbeitungsrollen dokumentieren",
    "Verarbeitungsverzeichnis aktualisieren",
    "Rechtsgrundlage und Folgenabschätzung prüfen",
    "Personendaten nur an gebundene Dienste geben",
    "Agentenzugriff auf den Auftrag beschränken",
    "Agentengedächtnis nach Projekt trennen",
    "Folgenreiche Entscheidungen Menschen überlassen",
    "Kunden über den KI-Einsatz informieren",
    "Dialogagenten als KI erkennbar machen",
    "Kennzeichnung interner und öffentlicher Texte prüfen",
    "Verantwortung bei Veröffentlichung dokumentieren",
    "Forschungsstandards in Kooperationen einhalten",
    "KI-Regeln fremder Repositories beachten",
    "KI-Einsatz in Forschungsarbeiten offenlegen",
    "KI-Einsatz in Förderanträgen offenlegen",
    "Referenzen und Tatsachen am Original prüfen",
    "Methodische Prüfpunkte vorsehen",
    "Agentische Forschungsschritte dokumentieren",
    "Rechtsgrundlage für externe Datenweitergabe klären",
    "Forschungsausnahme des AI Act prüfen",
    "Vertraulichkeit und Verantwortung im Peer Review sichern",
    "TEI-Encoding am Ausgangstext prüfen",
    "Quellenauswahl und Synthesen fachlich prüfen",
    "Relevanzschwellen bei Modellwechsel prüfen",
    "Code und Methoden veröffentlichen",
    "Eingaben, Datenzugriff und Autonomie begrenzen",
    "Fremde Inhalte als mögliche Angriffsquelle behandeln",
    "Coding Agents in isolierten Umgebungen ausführen",
    "Folgenreiche Aktionen technisch freigeben lassen",
    "Nur freigegebene Tools in festen Versionen laden",
    "Existenz und Herkunft von Dependencies prüfen",
    "Versionen in CI und Containern festschreiben",
    "Vor Commit und Push auf Secrets prüfen",
    "Agentencode vor dem Merge prüfen",
    "Auch kleine Tools angemessen absichern",
    "XML zusätzlich fachlich prüfen",
    "Agentennachrichten als solche kennzeichnen",
    "Änderungen klein und abgestimmt halten",
    "Eigene Programmierkompetenz erhalten",
    "KI-Kompetenz im Team unterstützen",
    "Pflicht zur Datenschutzbeauftragung prüfen",
    "Verantwortung für den Agenteneinsatz zuweisen",
    "Freigegebene KI-Werkzeuge registrieren",
    "Agenten schrittweise einführen",
    "Agentenprotokolle geschützt aufbewahren",
    "Alle Agenten jederzeit stoppen können"
  ].map((label,i) => [`r-leitlinien-dhcraft-c-${i+1}`, label]));
  const ruleLabel = rule => RULE_LABELS.get(rule.id) || rule.text;
  const SNIPPETS = 2;
  const SNIPPET_RADIUS = 70;

  const { fold, parseQuery, count, score, needles, suggestionsFor, nextSuggestion } = window.KB_SEARCH;

  // Data
  const ruleDocs = DATA.ruleDocs || [];
  const ruleDocLabel = new Map(ruleDocs.map((d) => [d.id, d.label]));
  const DEFAULTS = { pages: [], body: "", summary: "", summaryText: "", bodyText: "", abstract: "", url: "", file: "", binding: "", dateNote: "", note: "", category: "", publisher: "", date: "" };
  const docs = DATA.docs.map((d) => ({ ...DEFAULTS, ...d }));
  const byId = new Map(docs.map((d) => [d.id, d]));
  const rules = DATA.rules.map((r) => ({ ...r, kind: "rule", title: r.text }));
  for (const r of rules) byId.set(r.id, r);

  // Which rules rest on a source, from the sources each rule cites, in the
  // order of the rule documents.
  const docRank = (r) => ruleDocs.findIndex((d) => d.id === r.ruleDoc);
  const basis = new Map();
  for (const r of [...rules].sort((a, b) => docRank(a) - docRank(b))) {
    for (const s of r.sources) {
      if (!basis.has(s.id)) basis.set(s.id, []);
      basis.get(s.id).push(r);
    }
  }
  const rulesOf = (id) => basis.get(id) || [];

  // The Arbeitsbereich and the projects that apply each rule.
  const WORK = DATA.work || null;
  const projects = WORK ? WORK.projects : [];
  const usedIn = new Map();
  for (const p of projects) {
    for (const r of p.rules) {
      if (!usedIn.has(r.id)) usedIn.set(r.id, []);
      usedIn.get(r.id).push({ project: p, why: r.why, scope: r.scope });
    }
  }
  // A project's rules either bind DHCraft in it or carry over into the rule
  // proposal for the client; both lists show them apart.
  const RULE_SCOPES = [
    { scope: "dhcraft", group: "Gilt für DHCraft in diesem Projekt", uses: "Greift in", count: "greift in",
      fine: "Regeln der Leitlinien, die DHCraft in diesem Projekt binden." },
    { scope: "client", group: "Übertragbar in den Regelvorschlag für den Auftraggeber", uses: "Übertragbar in den Regelvorschlag für", count: "übertragbar in",
      fine: "Regeln der Leitlinien, die sich in einen Regelvorschlag für den Auftraggeber übertragen lassen." },
  ];
  const readable = (doc) => Boolean(doc && doc.kind !== "rule" && (doc.pages.length || doc.body));
  const HAS_READER = docs.some(readable);

  function sourceTitles(r) {
    return r.sources.map((s) => `${s.label} ${byId.get(s.id)?.title || ""}`);
  }
  const items = [...rules, ...docs];
  for (const item of items) {
    const rule = item.kind === "rule";
    item.f = {
      title: fold(item.title),
      label: fold(rule ? ruleLabel(item) : item.title),
      meta: fold((rule
        ? [item.status, item.goal, item.field, item.section, ruleDocLabel.get(item.ruleDoc), ...sourceTitles(item)]
        : [item.publisher, item.category]).filter(Boolean).join(" ")),
      summary: fold(item.summaryText || item.abstract || ""),
      body: fold(item.bodyText || ""),
      pages: (item.pages || []).map(fold),
      cited: [],
    };
  }
  // A rule also matches on the pages its sources are cited at, so a search in
  // the words of the sources ("human oversight") finds the rule that rests
  // on them; such hits weigh least. Only where the build holds full text.
  for (const r of rules) {
    r.f.cited = r.sources.flatMap((s) => {
      const src = byId.get(s.id);
      return src ? s.pages.map((n) => src.f.pages[n - 1]).filter(Boolean) : [];
    });
  }
  const KIND_ORDER = Object.keys(KINDS).filter((k) => items.some((i) => i.kind === k));

  // Facets
  // Each facet describes some kinds: a status filter narrows the rules and
  // does not test the sources. While no kind is chosen, an active facet also
  // limits the board to the kinds it describes (see shownKinds), so the
  // result is not buried under cards the filter does not touch. The field
  // facet holds the fields of the guidelines; the sections of the governance
  // draft are no fields, so its rules drop out while a field is chosen.
  const present = (values, valueOf, of) => values.filter((v) => of.some((i) => valueOf(i) === v));
  const sourceDocs = docs.filter((d) => d.kind === "source");
  const CATEGORIES = [...new Set(sourceDocs.map((d) => d.category))]
    .filter(Boolean).sort((a, b) => a.localeCompare(b, "de"));
  const YEARS = [...new Set(sourceDocs.map((d) => d.year))].filter(Boolean).sort().reverse();
  const FACETS = [
    { key: "kind", short: "k", box: "f-kind", kinds: null, value: (i) => i.kind, values: KIND_ORDER, label: (v) => KINDS[v].many },
    { key: "set", short: "r", box: "f-set", kinds: ["rule"], value: (r) => r.ruleDoc, values: ruleDocs.map((d) => d.id), label: (v) => ruleDocLabel.get(v) },
    { key: "field", short: "f", box: "f-field", kinds: ["rule"], value: (r) => r.field, values: present(DATA.fields || [], (r) => r.field, rules), label: (v) => v },
    { key: "status", short: "s", box: "f-status", kinds: ["rule"], value: (r) => r.status, values: present(Object.keys(STATUS), (r) => r.status, rules), label: (v) => v },
    { key: "goal", short: "g", box: "f-goal", kinds: ["rule"], value: (r) => r.goal, values: present(Object.keys(GOALS), (r) => r.goal, rules), label: (v) => v },
    { key: "cat", short: "c", box: "f-cat", kinds: ["source"], value: (d) => d.category, values: CATEGORIES, label: (v) => v },
    { key: "year", short: "y", box: "f-year", kinds: ["source"], value: (d) => d.year, values: YEARS, label: (v) => v },
  ].filter((facet) => {
    // A filter with a single value would change nothing.
    if (facet.values.length > 1) return true;
    $(facet.box).remove();
    return false;
  });

  /** Kinds on the board: the chosen ones, else those the active facets describe. */
  function shownKinds() {
    if (state.kind.length) return state.kind;
    const implied = new Set(FACETS.filter((f) => f.kinds && state[f.key].length).flatMap((f) => f.kinds));
    return implied.size ? KIND_ORDER.filter((k) => implied.has(k)) : KIND_ORDER;
  }

  function passes(item, skip) {
    for (const facet of FACETS) {
      if (facet.key === skip) continue;
      const chosen = state[facet.key];
      if (!chosen.length || (facet.kinds && !facet.kinds.includes(item.kind))) continue;
      if (!chosen.includes(facet.value(item))) return false;
    }
    return true;
  }

  // State, hash and history
  // Short keys as in the published page; the long keys of the former local
  // dashboard are still read, so old links keep working.
  function parseHash(hash) {
    const p = new URLSearchParams(hash.replace(/^#/, ""));
    const s = { q: p.get("q") || "" };
    for (const facet of FACETS) {
      const raw = p.get(facet.short) || p.get(facet.key);
      s[facet.key] = raw ? raw.split("|") : [];
    }
    for (const key of ["sel", "doc", "page", "at", "pr", "wt"]) s[key] = p.get(key) || "";
    s.v = WORK && p.get("v") === "arbeit" ? "arbeit" : "";
    return s;
  }

  function hashFor(s) {
    const p = new URLSearchParams();
    if (s.v) p.set("v", s.v);
    if (s.q) p.set("q", s.q);
    for (const facet of FACETS) if (s[facet.key].length) p.set(facet.short, s[facet.key].join("|"));
    for (const key of ["sel", "doc", "page", "at", "pr", "wt"]) if (s[key]) p.set(key, s[key]);
    return "#" + p.toString();
  }

  let state = parseHash(location.hash);
  const depth = () => (history.state && history.state.depth) || 0;
  const scrollPos = () => ({ y: window.scrollY, panel: $("panel").scrollTop });

  /**
   * Change the state. A push adds a history entry and first stores the scroll
   * position in the current one; typing and filtering replace the entry.
   */
  function go(changes, { push = false, mark = {} } = {}) {
    const prev = state;
    const next = { ...state, ...changes };
    const d = depth();
    if (push) {
      history.replaceState({ ...history.state, depth: d, scroll: scrollPos() }, "");
      history.pushState({ depth: d + 1, ...mark }, "", hashFor(next));
    } else {
      history.replaceState({ ...history.state, depth: d }, "", hashFor(next));
    }
    state = next;
    render(prev);
  }

  // A link inside the page changes only what it opens and the view it opens
  // in; search and filters stay.
  function follow(href) {
    const t = parseHash(href);
    const mark = t.sel && !state.sel && !t.doc ? { panel: true } : {};
    go({ v: t.v, pr: t.pr, wt: t.wt, sel: t.sel, doc: t.doc, page: t.page, at: t.at }, { push: true, mark });
  }

  // Rules and documents open in the Wissen view, projects in the Arbeitsbereich.
  const CLEAR = { v: "", pr: "", wt: "", sel: "", doc: "", page: "", at: "" };
  const hrefSel = (id) => hashFor({ ...state, ...CLEAR, sel: id });
  const hrefDoc = (id, page = "", at = "") => hashFor({ ...state, ...CLEAR, doc: id, page: String(page), at });
  const hrefView = (v) => hashFor({ ...state, ...CLEAR, v });

  function closePanel() {
    if (history.state && history.state.panel) history.back();
    else go({ sel: "" });
  }

  function closeReader() {
    if (depth() > 0) history.back();
    else go({ doc: "", page: "", at: "" });
  }

  // Highlighting
  function highlight(root, list) {
    if (!list.length) return [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const found = [];
    for (const node of nodes) {
      const text = node.nodeValue;
      const folded = fold(text);
      const ranges = [];
      for (const n of list) {
        for (let at = folded.indexOf(n); at !== -1; at = folded.indexOf(n, at + n.length)) ranges.push([at, at + n.length]);
      }
      if (!ranges.length) continue;
      ranges.sort((a, b) => a[0] - b[0]);
      const frag = document.createDocumentFragment();
      let pos = 0;
      for (const [start, end] of ranges) {
        if (start < pos) continue;
        frag.append(text.slice(pos, start));
        const mark = el("mark", {}, text.slice(start, end));
        found.push(mark);
        frag.append(mark);
        pos = end;
      }
      frag.append(text.slice(pos));
      node.replaceWith(frag);
    }
    return found;
  }

  // Controls
  function chip(facet,value) {
    const input=el("input",{type:"checkbox","data-facet":facet.key,"data-value":value});
    input.addEventListener("change",()=>{
      const list=state[facet.key];
      go({[facet.key]:input.checked ? [...list,value] : list.filter(v=>v!==value)});
    });
    return el("label",{class:"filter-option"},input,el("span",{},facet.label(value)));
  }

  let suggestions = [], activeSuggestion = -1, suggestionsDismissed = false;
  function closeSuggestions() {
    suggestionsDismissed = true;
    activeSuggestion = -1;
    $("suggestions").hidden = true;
    $("q").setAttribute("aria-expanded","false");
    $("q").removeAttribute("aria-activedescendant");
  }
  function activateSuggestion(index) {
    activeSuggestion = index;
    const options = $("suggestions").querySelectorAll('[role="option"]');
    options.forEach((option,i)=>option.setAttribute("aria-selected",String(i===index)));
    if(index>=0) {
      $("q").setAttribute("aria-activedescendant",options[index].id);
      options[index].scrollIntoView({block:"nearest"});
    } else $("q").removeAttribute("aria-activedescendant");
  }
  function openSuggestion(index) {
    const item=suggestions[index];
    if(!item) return;
    closeSuggestions();
    follow(item.kind === "rule" || item.kind === "source" ? hrefSel(item.id) : hrefDoc(item.id));
  }
  function suggest() {
    const q=$("q"), query=parseQuery(q.value);
    if(query.empty || suggestionsDismissed || document.activeElement!==q || reading()) {closeSuggestions();return;}
    suggestions=suggestionsFor(items.filter(item=>shownKinds().includes(item.kind)&&passes(item)),query);
    const list=$("suggestions");
    list.replaceChildren(...suggestions.map((item,i)=>{
      const title=item.kind==="rule" ? ruleLabel(item) : item.title;
      const option=el("li",{role:"option",id:`suggestion-${i}`,"aria-selected":"false"},
        el("span",{},title),el("small",{},item.kind==="rule" ? item.status : KINDS[item.kind].one));
      // Keep input focus so the listbox is controlled by its combobox.
      option.addEventListener("pointerdown",event=>event.preventDefault());
      option.addEventListener("click",()=>openSuggestion(i));
      return option;
    }));
    activeSuggestion=-1;
    list.hidden=!suggestions.length;
    q.setAttribute("aria-expanded",String(suggestions.length>0));
    q.removeAttribute("aria-activedescendant");
  }

  function buildControls() {
    for(const facet of FACETS) {
      const box=$(facet.box), label=box.querySelector("p");
      const options=el("div",{class:"filter-options"},...facet.values.map(v=>chip(facet,v)));
      if(facet.key==="kind") box.replaceChildren(label,options);
      else box.replaceChildren(el("details",{class:"facet",open:["field","status"].includes(facet.key)},
        el("summary",{},el("span",{id:label.id},label.textContent),el("span",{class:"facet-value"})),options));
    }
    // The second sentence matters only while a text is open.
    $("q").placeholder="Regel oder Quelle";
    if (HAS_READER) $("q-hint").append(el("span", { class: "on-reader" }, "Enter springt zur nächsten Fundstelle, Umschalt+Enter zur vorigen."));
    const q = $("q");
    q.addEventListener("input",()=>{suggestionsDismissed=false;go({q:q.value});suggest();});
    q.addEventListener("focus",()=>{suggestionsDismissed=false;suggest();});
    q.addEventListener("blur",closeSuggestions);
    q.addEventListener("keydown", (event) => {
      if(!$("suggestions").hidden) {
        if(event.key==="ArrowDown" || event.key==="ArrowUp") {event.preventDefault();activateSuggestion(nextSuggestion(activeSuggestion,event.key==="ArrowDown"?1:-1,suggestions.length));return;}
        if(event.key==="Enter" && activeSuggestion>=0) {event.preventDefault();openSuggestion(activeSuggestion);return;}
        if(event.key==="Escape") {event.preventDefault();closeSuggestions();return;}
        if(event.key==="Enter") closeSuggestions();
      }
      if (event.key === "Enter" && reading()) {
        event.preventDefault();
        stepMark(event.shiftKey ? -1 : 1);
      }
    });
    $("search-form").addEventListener("submit", (event) => event.preventDefault());
    $("reset").addEventListener("click", () => {
      go(Object.fromEntries([["q", ""], ...FACETS.map((f) => [f.key, []])]));
      $("q").focus();
    });
    const glossary = $("glossary");
    for (const [term, def] of [...Object.entries(STATUS), ...Object.entries(GOALS)]) {
      glossary.append(el("dt", {}, term), el("dd", {}, def));
    }
    for (const node of document.querySelectorAll("[data-scope]")) node.hidden = node.dataset.scope !== DATA.scope;
    for (const node of document.querySelectorAll(".stand")) node.textContent = DATA.generated || "";
    if (WORK) {
      $("views").hidden = false;
      for (const node of document.querySelectorAll("[data-work]")) node.hidden = false;
    }
    // On a phone the filters fold away, so the cards come first.
    if (window.matchMedia("(max-width: 48rem)").matches) $("filters").open = false;
  }

  const activeFacets = () => FACETS.reduce((n, f) => n + state[f.key].length, 0);
  const filtered = () => Boolean(state.q) || activeFacets() > 0;

  function syncControls(matching) {
    if ($("q").value !== state.q) $("q").value = state.q;
    const counts = Object.fromEntries(FACETS.map((f) => [f.key, new Map()]));
    for (const item of matching) {
      for (const facet of FACETS) {
        if ((facet.kinds && !facet.kinds.includes(item.kind)) || !passes(item, facet.key)) continue;
        const v = facet.value(item);
        counts[facet.key].set(v, (counts[facet.key].get(v) || 0) + 1);
      }
    }
    for(const input of document.querySelectorAll(".filter-option input")) {
      const {facet,value}=input.dataset;
      input.checked=state[facet].includes(value);
      input.disabled=!input.checked && !(counts[facet].get(value)||0);
    }
    for(const facet of FACETS) {
      const box=$(facet.box), value=box.querySelector(".facet-value");
      if(value) value.textContent=state[facet.key].map(facet.label).join(", ");
      box.hidden=Boolean(facet.kinds)&&!state[facet.key].length&&!facet.kinds.some(k=>shownKinds().includes(k));
    }
    const active = activeFacets();
    $("filter-count").textContent = active ? `${active} aktiv` : "";
    $("reset").hidden = !filtered();
  }

  // Cards
  const selected = () => {
    const item = byId.get(state.sel);
    return item && (item.kind === "rule" || item.kind === "source") ? item : null;
  };

  function linkNote(item) {
    const sel = selected();
    if (!sel || sel === item) return "";
    if (sel.kind === "source" && item.kind === "rule" && item.sources.some((s) => s.id === sel.id)) return "beruht auf der gewählten Quelle";
    if (sel.kind === "rule" && item.kind === "source" && sel.sources.some((s) => s.id === item.id)) return "Grundlage der gewählten Regel";
    return "";
  }

  // The date column may carry a note ("2017-04-05 (exception)"); a card shows
  // the date alone, the panel the date and whether it is an approved exception.
  const shortDate = (date) => (date.match(/^\d{4}(?:-\d{2}){0,2}/) || [date])[0];
  const isException = (date) => /\bexception\b/.test(date);
  // URLs in a date note are evidence for the date; the host is enough here.
  const withHosts = (text) => text.replace(/https?:\/\/[^\s)]+/g, (url) => host(url));

  function excerpt(text, at, length) {
    let start = Math.max(0, at - SNIPPET_RADIUS);
    if (start > 0) start = text.indexOf(" ", start) + 1 || start;
    let end = Math.min(text.length, at + length + SNIPPET_RADIUS * 2);
    if (end < text.length) {
      const space = text.lastIndexOf(" ", end);
      if (space > at + length) end = space;
    }
    return (start > 0 ? "… " : "") + text.slice(start, end).trim() + (end < text.length ? " …" : "");
  }

  function firstIn(folded, list) {
    for (const n of list) {
      const at = folded.indexOf(n);
      if (at !== -1) return { at, length: n.length };
    }
    return null;
  }

  /** Places in the text behind a card where the query occurs: the full
   *  text first, by pages with the most finds, then the summary. */
  function snippets(doc, list) {
    const out = [];
    const pages = doc.f.pages
      .map((folded, i) => ({ i, n: list.reduce((s, needle) => s + count(folded, needle, 50), 0) }))
      .filter((p) => p.n > 0)
      .sort((a, b) => b.n - a.n || a.i - b.i);
    for (const { i } of pages.slice(0, SNIPPETS)) {
      const hit = firstIn(doc.f.pages[i], list);
      out.push({ text: excerpt(doc.pages[i], hit.at, hit.length), page: String(i + 1) });
    }
    for (const [text, folded] of [[doc.bodyText, doc.f.body], [doc.summaryText, doc.f.summary]]) {
      const hit = out.length < SNIPPETS && text && firstIn(folded, list);
      if (hit) out.push({ text: excerpt(text, hit.at, hit.length), page: "" });
    }
    return out;
  }

  function card(item, query) {
    const list = needles(item, query);
    const note = linkNote(item);
    const isSel = item.id === state.sel;
    const box = el("article", {
      class: `card card-${item.kind}${isSel ? " selected" : ""}${note ? " linked" : ""}`,
      "data-id": item.id,
    });
    if (note) box.append(el("p", { class: "link-note" }, note));
    const opensReader = item.kind === "knowledge" || item.kind === "note";
    const link = el("a", {
      class: "card-link",
      href: opensReader ? hrefDoc(item.id) : hrefSel(item.id),
      "data-id": item.id,
      "data-open": opensReader ? item.id : undefined,
      "aria-current": isSel ? "true" : undefined,
    }, item.title);
    highlight(link, list);
    const meta = el("p", { class: "meta" });
    box.append(el("p", { class: "title" }, link));
    if (item.abstract && !query.empty) {
      const abstract = el("p", { class: "abstract" }, item.abstract);
      highlight(abstract, list);
      box.append(abstract);
    }
    if (item.kind === "source") {
      const n = rulesOf(item.id).length;
      meta.append(el("span", {}, item.publisher), el("span", {}, shortDate(item.date)),
        el("span", { class: n ? "strong" : undefined }, n === 1 ? "Grundlage für 1 Regel" : n ? `Grundlage für ${n} Regeln` : "keine Regel beruht darauf"));
    } else if (item.kind === "knowledge") {
      const n = rules.filter((r) => r.ruleDoc === item.id).length;
      if (n) meta.append(el("span", { class: "strong" }, `${n} Regeln`));
    } else {
      meta.append(el("span", {}, item.publisher), el("span", {}, shortDate(item.date)));
    }
    if (meta.childNodes.length) box.append(meta);
    // Finds in the full text, each a way into the text at its page.
    if (list.length && readable(item)) {
      for (const s of snippets(item, list)) {
        const text = el("span", {}, s.text);
        highlight(text, list);
        box.append(el("a", { class: "snippet", href: hrefDoc(item.id, s.page) },
          s.page ? el("span", { class: "where" }, `S. ${s.page}`) : null, text));
      }
    }
    return box;
  }

  function sourceLinks(rule) {
    const box=el("span",{class:"rule-basis"});
    rule.sources.forEach((source,index)=>{if(index)box.append(", ");box.append(el("a",{href:hrefSel(source.id)},source.label));});
    return box;
  }
  function ruleTable(list,query,applications=null) {
    const header=el("tr",{},...["Regel","Status","Ziel","Quellen"].map(label=>el("th",{scope:"col"},label)));
    const body=el("tbody",{},...list.map(rule=>{
      const note=linkNote(rule);
      const link=el("a",{class:"card-link",href:hrefSel(rule.id),"data-id":rule.id,
        "data-rule":applications?rule.id:undefined,"aria-current":state.sel===rule.id?"true":undefined},ruleLabel(rule));
      highlight(link,needles(rule,query));
      const cell=el("td",{class:"rule-name"},link);
      if(!query.empty) {const hit=firstIn(fold(rule.text),needles(rule,query));const text=el("p",{class:"search-excerpt"},excerpt(rule.text,hit?.at||0,hit?.length||40));highlight(text,needles(rule,query));cell.append(text);}
      if(note)cell.append(el("span",{class:"link-note"},note));
      if(applications) {
        const why=applications.find(a=>a.id===rule.id);
        if(why)cell.append(el("details",{class:"application"},el("summary",{},"Projektbezug"),fromHtml("p",{},why.why)));
      }
      return el("tr",{class:`card card-rule${state.sel===rule.id?" selected":""}${note?" linked":""}`,"data-id":rule.id},cell,
        el("td",{class:"rule-status"},el("span",{title:STATUS[rule.status]},rule.status)),
        el("td",{class:"rule-goal"},rule.goal),el("td",{class:"rule-sources"},sourceLinks(rule)));
    }));
    return el("table",{class:"rule-table"},el("thead",{},header),body);
  }
  const grid=(list,query)=>list[0]?.kind==="rule" ? ruleTable(list,query) : el("div",{class:"grid source-list"},...list.map(i=>card(i,query)));


  function defaultOrder(a, b) {
    if (a.kind === "knowledge") return (a.role === "work" ? 0 : 1) - (b.role === "work" ? 0 : 1) || a.title.localeCompare(b.title, "de");
    if (a.kind === "rule") return 0;
    return (b.date || "").localeCompare(a.date || "");
  }

  // Rules by rule document, then by field or section, in document order.
  const ruleGroupOrder = [...new Set(rules.map((r) => `${r.ruleDoc}\u0000${r.field}`))];
  function ruleGroups(list, query) {
    const out = [];
    const several = ruleDocs.length > 1;
    for (const rd of ruleDocs.map((d) => d.id)) {
      const inDoc = list.filter((r) => r.ruleDoc === rd);
      if (!inDoc.length) continue;
      if (several) out.push(el("h3", { class: "doc-head" }, ruleDocLabel.get(rd)));
      for (const key of ruleGroupOrder.filter((k) => k.startsWith(rd + "\u0000"))) {
        const field = key.slice(rd.length + 1);
        const members = inDoc.filter((r) => r.field === field);
        if (members.length) out.push(el(several ? "h4" : "h3", {}, field || "Ohne Abschnitt"), grid(members, query));
      }
    }
    return out;
  }

  function sourceGroups(list, query) {
    return CATEGORIES.flatMap((cat) => {
      const members = list.filter((s) => s.category === cat);
      return members.length ? [el("h3", {}, cat), grid(members, query)] : [];
    });
  }

  let liveTimer = 0;
  function renderBoard(scores, query) {
    const sections = [];
    const said = [];
    const kinds = shownKinds();
    for (const kind of KIND_ORDER) {
      if (!kinds.includes(kind)) continue;
      const all = items.filter((i) => i.kind === kind);
      const shown = all.filter((i) => scores.get(i) > 0 && passes(i))
        .sort((a, b) => (query.empty ? 0 : scores.get(b) - scores.get(a)) || defaultOrder(a, b));
      said.push(`${shown.length} ${KINDS[kind].many}`);
      if (!shown.length) continue;
      const body = kind === "rule" ? ruleGroups(shown, query)
          : kind === "source" ? sourceGroups(shown, query)
            : [grid(shown, query)];
      sections.push(el("section", { class: "group", "aria-labelledby": `head-${kind}` },
        el("h2", { id: `head-${kind}` }, KINDS[kind].many,
          filtered()?el("span",{class:"n"},`${shown.length} Treffer`):null),
        ...body));
    }
    if (!sections.length) sections.push(el("p", { class: "empty" }, "Keine Treffer. Ändere die Suche oder setze die Filter zurück."));
    $("board").replaceChildren(...sections);
    // Screen readers hear the result once typing pauses, not per keystroke.
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { $("status").textContent = said.join(", "); }, 500);
  }

  // Panel
  function host(url) {
    try {
      return new URL(url).host.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  function facts(pairs) {
    const dl = el("dl", { class: "facts" });
    for (const [term, value, def] of pairs) {
      if (value) dl.append(el("dt", {}, term), el("dd", {}, value, def ? el("span", { class: "def" }, def) : null));
    }
    return dl.children.length ? dl : null;
  }

  // Page numbers as links into the full text, or as plain text where the
  // build has no full text.
  function pageRefs(doc, pages) {
    if (!pages.length) return ["ohne Seitenangabe"];
    const out = ["S. "];
    pages.forEach((p, i) => {
      if (i) out.push(", ");
      out.push(readable(doc) ? el("a", { href: hrefDoc(doc.id, p), "data-open": doc.id }, String(p)) : String(p));
    });
    return out;
  }

  function ruleWhere(r) {
    return [ruleDocs.length > 1 ? ruleDocLabel.get(r.ruleDoc) : "", r.field].filter(Boolean).join(", ");
  }

  function linkInternal(root) {
    for (const a of root.querySelectorAll("a[data-doc]")) {
      a.href = hrefDoc(a.dataset.doc, a.dataset.page || "", a.dataset.at || "");
      a.dataset.open = a.dataset.doc;
    }
    for (const a of root.querySelectorAll("a[href^='http']")) {
      a.target = "_blank";
      a.rel = "noopener";
    }
  }

  function prose(htmlText, cls = "prose") {
    const div = el("div", { class: cls });
    div.innerHTML = htmlText; // pre-rendered, raw HTML escaped at build time
    linkInternal(div);
    return div;
  }

  // Pre-rendered HTML from the build (raw HTML escaped there), links made
  // internal like those of the reader.
  function fromHtml(tag, attrs, htmlText) {
    const node = el(tag, attrs);
    node.innerHTML = htmlText;
    linkInternal(node);
    return node;
  }

  /** The projects that apply a rule, by group, each a way back into the Arbeitsbereich. */
  function usesSection(rule) {
    return RULE_SCOPES.flatMap(({ scope, uses: title }) => {
      const uses = (usedIn.get(rule.id) || []).filter((u) => u.scope === scope);
      if (!uses.length) return [];
      return [el("h3", {}, title),
        el("ul", { class: "items" }, ...uses.map((u) => el("li", {},
          el("a", { href: workLink(u.project.id, "rules"), "data-project": u.project.id }, u.project.title),
          fromHtml("span", { class: "meta" }, u.why))))];
    });
  }

  function panelFor(item) {
    const close = el("button", { type: "button", class: "close" }, "Schließen");
    close.addEventListener("click", closePanel);
    const head = el("div", { class: "panel-head" }, close);
    if (item.kind === "rule") {
      const basisList = el("ul", { class: "items" }, ...item.sources.map((s) => {
        const src = byId.get(s.id);
        return el("li", {},
          src ? el("a", { href: hrefSel(s.id) }, src.title) : el("span", {}, s.label),
          el("span", { class: "meta" }, `${s.label}, `, ...(src ? pageRefs(src, s.pages) : [])));
      }));
      const inDoc = readable(byId.get(item.ruleDoc))
        ? el("p", { class: "actions" }, el("a", { href: hrefDoc(item.ruleDoc, "", item.at), "data-open": item.ruleDoc }, "Im Regeldokument lesen"))
        : null;

      return [head,
        el("h2",{id:"panel-title",tabindex:"-1"},ruleLabel(item)),
        el("p",{class:"rule-wording",lang:"en"},item.text),
        facts([["Status", item.status, STATUS[item.status]], ["Ziel", item.goal, GOALS[item.goal]]]),
        inDoc,
        el("h3", {}, "Grundlagen"), basisList,
        ...usesSection(item),
        HAS_READER ? null : el("p", { class: "fine" }, "Seitenangaben beziehen sich auf das PDF der Quelle beim Herausgeber.")];
    }
    const based = rulesOf(item.id);
    const actions = el("p", { class: "actions" },
      readable(item) ? el("a", { href: hrefDoc(item.id), "data-open": item.id }, "Volltext lesen") : null,
      item.url ? el("a", { href: item.url, target: "_blank", rel: "noopener" }, `Original bei ${host(item.url)}`) : null);

    // The binding note of a summary starts with a status word; the panel shows
    // the word with its German meaning, the full note stays in the reader.
    const bindingWord = Object.keys(STATUS).find((w) => item.binding.startsWith(w));
    return [head,
      el("h2", { id: "panel-title", tabindex: "-1" }, item.title),
      facts([["Herausgeber", item.publisher],
        ["Datum", shortDate(item.date), isException(item.date) ? "vor 2026, als Ausnahme aufgenommen" : ""],
        ["Verbindlichkeit", bindingWord || item.binding, bindingWord ? STATUS[bindingWord] : ""],
        ["Hinweis", item.note]]),
      actions.children.length ? actions : null,
      el("h3", {}, based.length ? `Regeln auf dieser Grundlage (${based.length})` : "Regeln auf dieser Grundlage"),
      based.length
        ? el("ul", { class: "items" }, ...based.map((r) => el("li", {},
          el("a", { href: hrefSel(r.id) }, r.text),
          el("span", { class: "meta" }, [r.status, ruleWhere(r)].filter(Boolean).join(", ")))))
        : el("p", { class: "empty" }, "Keine Regel beruht auf dieser Quelle. Sie steht in der Wissensbasis als Hintergrund."),
      el("h3", {}, "Zusammenfassung"),
      prose(item.summary, "prose summary"),
      HAS_READER ? null : el("p", { class: "fine" }, "Die Zusammenfassung ist eine eigene Auswertung mit Blick auf die Leitfrage. Seitenangaben beziehen sich auf das PDF der Quelle.")];
  }

  let shownPanel = "";
  function renderPanel(item, doc) {
    const panel = $("panel");
    const open = Boolean(item) && !doc;
    $("workspace").classList.toggle("selecting", open);
    panel.hidden = !open;
    // Where the panel covers the page, the content behind it is out of reach.
    const covering = open && window.matchMedia("(max-width: 85rem)").matches;
    for (const node of document.querySelectorAll(".controls, .main, .site-footer, .site-header")) node.inert = covering;
    if (!item) {
      shownPanel = "";
      return;
    }
    if (shownPanel !== item.id) {
      panel.replaceChildren(...panelFor(item).filter(Boolean));
      panel.scrollTop = 0;
      shownPanel = item.id;
    }
    if (covering && !panel.contains(document.activeElement)) {
      $("panel-title").focus({ preventScroll: true });
    }
  }

  // Reader
  let readerKey = "";
  let navKey = "";
  let marks = [];
  let markIndex = -1;
  const reading = () => !$("reader").hidden;

  function readerBar(doc) {
    const bar = el("div", { class: "reader-bar" });
    const back = el("button", { type: "button", class: "text-button", id: "back" }, depth() > 0 ? "← Zurück" : "← Zur Übersicht");
    back.addEventListener("click", closeReader);
    bar.append(back);
    if (doc.pages.length) {
      const input = el("input", { type: "number", id: "page-input", min: "1", max: String(doc.pages.length), value: "1", inputmode: "numeric" });
      input.addEventListener("change", () => {
        const n = Math.min(Math.max(1, Number(input.value) || 1), doc.pages.length);
        input.value = String(n);
        go({ page: String(n), at: "" });
      });
      bar.append(el("span", { class: "bar-group" }, el("label", { for: "page-input" }, "Seite"), input, `von ${doc.pages.length}`));
    }
    bar.append(el("span", { class: "bar-group", id: "finds" }));
    if (doc.file) {
      bar.append(el("a", { class: "end", id: "original", href: doc.file, target: "_blank", rel: "noopener" },
        doc.pages.length ? "PDF öffnen" : "Datei öffnen"));
    }
    return bar;
  }

  function citedSection(doc, based) {
    const list = el("ol", { class: "cited" }, ...based.map((r) => {
      const cite = r.sources.find((s) => s.id === doc.id);
      return el("li", {},
        el("a", { class: "rule", href: hrefDoc(r.ruleDoc, "", r.at), "data-open": r.ruleDoc }, r.text),
        el("p", { class: "meta" }, r.status ? el("span", { class: "strong" }, r.status) : null,
          el("span", {}, [ruleDocLabel.get(r.ruleDoc), r.section].filter(Boolean).join(", ")),
          el("span", {}, ...pageRefs(doc, cite ? cite.pages : []))));
    }));
    // A long list folds away, so the summary stays within reach.
    return el("section", { class: "cited-section" },
      el("details", { class: "cited-box", open: based.length <= 6 ? "" : undefined },
        el("summary", {}, `Zitiert in Regeln (${based.length})`), list));
  }

  function renderReader(doc, query) {
    const kindLabel = doc.kind === "note" ? doc.publisher : KINDS[doc.kind].one;
    const meta = el("p", { class: "meta" },
      el("span", {}, kindLabel),
      doc.kind === "note" ? null : el("span", {}, doc.publisher),
      el("span", {}, shortDate(doc.date)),
      doc.category ? el("span", {}, doc.category) : null);
    const header = el("header", {}, meta,
      el("h2", { id: "reader-title", tabindex: "-1" }, doc.title),
      facts([["Verbindlichkeit", doc.binding], ["Datum laut Quelle", withHosts(doc.dateNote)],
        ["Online", doc.url ? el("a", { href: doc.url, target: "_blank", rel: "noopener" }, host(doc.url)) : ""]]));
    const sections = [];
    const based = rulesOf(doc.id);
    if (doc.kind === "source" && based.length) sections.push(citedSection(doc, based));
    if (doc.summary) sections.push(el("section", {}, el("h3", {}, "Zusammenfassung"), prose(doc.summary)));
    if (doc.body) {
      sections.push(doc.kind === "source"
        ? el("section", {}, el("h3", {}, "Volltext"), prose(doc.body))
        : el("section", {}, prose(doc.body)));
    }
    if (doc.pages.length) {
      const s = el("section", {}, el("h3", {}, "Volltext"));
      doc.pages.forEach((text, i) => {
        s.append(el("section", { class: "page", id: `p-${i + 1}`, "aria-label": `Seite ${i + 1}` },
          el("p", { class: "page-no" }, `Seite ${i + 1}`),
          ...text.split("\n\n").filter(Boolean).map((para) => el("p", { class: "page-text" }, para))));
      });
      sections.push(s);
    }
    const reader = $("reader");
    reader.replaceChildren(readerBar(doc), header, ...sections);
    const list = needles(doc, query);
    marks = [...reader.querySelectorAll("#reader-title, .cited, .prose, .page-text")].flatMap((node) => highlight(node, list));
    markIndex = -1;
    renderFinds();
  }

  function renderFinds() {
    const box = $("finds");
    if (!marks.length) {
      box.replaceChildren();
      return;
    }
    const label = el("span", { id: "find-label", "aria-live": "polite" }, `${marks.length} Fundstellen`);
    const prev = el("button", { type: "button", "aria-label": "Vorherige Fundstelle" }, "‹");
    const next = el("button", { type: "button", "aria-label": "Nächste Fundstelle" }, "›");
    prev.addEventListener("click", () => stepMark(-1));
    next.addEventListener("click", () => stepMark(1));
    box.replaceChildren(label, prev, next);
  }

  function setMark(index) {
    marks[markIndex]?.classList.remove("current");
    markIndex = index;
    const mark = marks[markIndex];
    mark.classList.add("current");
    mark.scrollIntoView({ block: "center" });
    $("find-label").textContent = `Fundstelle ${markIndex + 1} von ${marks.length}`;
  }

  function stepMark(direction) {
    if (!marks.length) return;
    if (markIndex === -1) {
      // The first step starts from the reading position, not from the top.
      const below = marks.findIndex((m) => m.getBoundingClientRect().top > 120);
      const start = below === -1 ? marks.length : below;
      setMark(direction > 0 ? start % marks.length : (start - 1 + marks.length) % marks.length);
      return;
    }
    setMark((markIndex + direction + marks.length) % marks.length);
  }

  // Mark the cited passage or page without moving the view.
  function markTarget() {
    for (const old of $("reader").querySelectorAll(".target")) old.classList.remove("target");
    const target = (state.at && document.getElementById(state.at)) || (state.page && document.getElementById(`p-${state.page}`));
    if (target) target.classList.add("target");
    return target;
  }

  // Bring the requested place into view: a cited passage, a page (at its
  // first find, if the query occurs there) or the top of the text.
  function position() {
    const target = markTarget();
    if (target) {
      const first = state.page ? marks.findIndex((m) => target.contains(m)) : -1;
      if (first !== -1) setMark(first);
      else target.scrollIntoView({ block: "start" });
    } else {
      $("reader").scrollIntoView({ block: "start" });
    }
  }

  // The page field and the "PDF öffnen" link follow the page in view: the
  // last page that starts above the upper part of the window.
  function updatePage() {
    const input = $("page-input");
    const doc = byId.get(state.doc);
    if (!input || !doc || !reading()) return;
    let current = 1;
    for (const page of $("reader").querySelectorAll(".page")) {
      if (page.getBoundingClientRect().top > window.innerHeight * 0.4) break;
      current = Number(page.id.slice(2));
    }
    if (document.activeElement !== input) input.value = String(current);
    if ($("original")) $("original").href = `${doc.file}#page=${current}`;
  }

  let pageFrame = 0;
  function trackPage() {
    cancelAnimationFrame(pageFrame);
    pageFrame = requestAnimationFrame(updatePage);
  }

  // Arbeitsbereich
  const number = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
  const longDate = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });
  const isoDay = (iso) => longDate.format(new Date(`${iso}T00:00:00`)); // local time, not UTC

  const htmlList = (list, cls) => el("ul", { class: cls }, ...list.map((h) => fromHtml("li", {}, h)));

  // Bars of one series in one hue, the value as text beside each bar; the
  // longest bar is the largest value of the list.
  function bars(title, rows) {
    const max = Math.max(...rows.map((r) => r[1]), 1);
    return el("div", { class: "bar-list" }, el("h5", {}, title),
      el("ol", { class: "bars" }, ...rows.map(([name, value]) => {
        const bar = el("span", { class: "bar" });
        bar.style.inlineSize = `${(value / max) * 100}%`; // data-driven width
        return el("li", {}, el("span", { class: "name" }, name), el("span", { class: "track" }, bar),
          el("span", { class: "val" }, number.format(value)));
      })));
  }

  function dataPanel(d) {
    const figure = (label, value, cls) => el("div", { class: cls }, el("dt", {}, label), el("dd", {}, value));
    return el("section", { class: "part data-panel" },
      el("h4", {}, "Umsatzdaten"),
      el("dl", { class: "figures" },
        figure("Umsatz gesamt", number.format(d.total), "big"),
        figure("Bestellungen", `${number.format(d.orders)}, davon ${number.format(d.unshipped)} nicht versandt`),
        figure("Zeitraum", `${isoDay(d.first)} bis ${isoDay(d.last)}`)),
      bars("Lieferländer mit dem meisten Umsatz", d.countries),
      bars("Produkte mit dem meisten Umsatz", d.products),
      el("p", { class: "fine" }, "Nur Summen aus Bestellungen und Produkten, ohne Kunden- oder Personaldaten. Der Datensatz nennt keine Währung."),
      el("p", { class: "actions" }, el("a", { href: d.page }, "Ganze Umsatzseite öffnen")));
  }

  function workLink(project,section="") {
    return hashFor({...state,...CLEAR,v:"arbeit",pr:project,wt:section});
  }
  function projectCard(p) {
    const section=["deliverables","rules","data","decisions"].includes(state.wt) && (state.wt !== "data" || p.data) ? state.wt : "";
    const tabs=[["","Überblick"],["deliverables","Leistungen"],["rules","Regeln"],...(p.data?[["data","Umsatz"]]:[]),["decisions","Entscheidungen"]];
    const nav=el("nav",{class:"project-nav","aria-label":"Projektansicht"},...tabs.map(([key,label])=>
      el("a",{href:workLink(p.id,key),"aria-current":key===section?"page":undefined},label)));
    const content=el("div",{class:"project-content"});
    if(section==="deliverables")content.append(el("ul",{class:"deliv",role:"list"},...p.deliverables.map(d=>el("li",{},
      fromHtml("p",{class:"name"},d.name),d.state?fromHtml("p",{class:"state"},d.state):null,d.refs?fromHtml("p",{class:"refs"},d.refs):null))));
    else if(section==="rules") {
      for(const [scope,label] of [["dhcraft","Für DHCraft"],["client","Für den Auftraggeber übertragbar"]]) {
        const applied=p.rules.filter(r=>r.scope===scope), relevant=applied.map(r=>byId.get(r.id)).filter(Boolean);
        if(relevant.length)content.append(el("section",{class:"rule-group"},el("h3",{},label),ruleTable(relevant,parseQuery(""),applied)));
      }
    } else if(section==="data")content.append(dataPanel(p.data));
    else if(section==="decisions")content.append(htmlList(p.decisions,"work-list"));
    else {
      if(p.state)content.append(fromHtml("p",{class:"project-state"},p.state));
      if(p.next)content.append(el("div",{class:"next-action"},el("span",{},"Nächster Schritt"),fromHtml("p",{},p.next)));
      const group=(label,values)=>values.length?el("section",{},el("h3",{},label),htmlList(values,"work-list")):null;
      content.append(el("div",{class:"overview-cols"},group("Fragen an den Auftraggeber",p.questions),group("Beim Inhaber zu klären",p.owner)));
      const todo=WORK.todos.find(g=>g.project===p.id);
      if(todo)content.append(el("details",{class:"project-todos"},el("summary",{},"Weitere nächste Schritte"),htmlList(todo.items,"work-list")));
    }
    return el("article",{class:"project",id:`pr-${p.id}`,"aria-labelledby":`pr-title-${p.id}`},
      fromHtml("h2",{id:`pr-title-${p.id}`,tabindex:"-1"},p.link),nav,content);
  }
  function buildWork() {
    const current=projects.find(p=>p.id===state.pr)||projects[0],general=state.pr==="general"||!current;
    const nav=el("nav",{class:"work-nav","aria-label":"Arbeitsbereich"},
      ...projects.map(p=>el("a",{href:workLink(p.id),"data-project":p.id,"aria-current":!general&&p===current?"page":undefined},projects.length===1?"Projekt":p.title)),
      el("a",{href:workLink("general"),"aria-current":general?"page":undefined},"Allgemeine Arbeit"));
    const content=general?el("section",{class:"general-work"},el("h2",{},"Allgemeine Arbeit"),
      ...WORK.todos.filter(g=>!g.project&&g.items.length).map(g=>el("div",{},htmlList(g.items,"work-list"),fromHtml("p",{class:"origin"},g.where))),
      WORK.running.length?el("details",{class:"work-history"},el("summary",{},"Arbeitsstand und Verlauf"),htmlList(WORK.running,"work-list")):null,
      WORK.questions.length?el("details",{class:"work-history"},el("summary",{},"Offene Fragen"),htmlList(WORK.questions,"work-list")):null):projectCard(current);
    const focusedHref = document.activeElement?.closest("#work a")?.getAttribute("href");
    $("work").replaceChildren(nav,content);
    if (focusedHref) {
      const active = [...$("work").querySelectorAll("a")].find(a=>a.getAttribute("href")===focusedHref);
      active?.focus({preventScroll:true});
    }
  }
  function renderWork(prev, restore) {
    buildWork();
    for (const old of $("work").querySelectorAll(".project.target")) old.classList.remove("target");
    const target = state.pr ? document.getElementById(`pr-${state.pr}`) : null;
    if (target) target.classList.add("target");
    if (restore) return;
    // Entering the view or another project: the project, else the top.
    if (!prev || prev.v !== state.v || prev.pr !== state.pr || prev.wt !== state.wt) {
      window.scrollTo(0, 0);
    }
  }

  // Focus after a change of the Arbeitsbereich: on Back the link that had
  // left it, on a project its title, else the main region, unless the view
  // switch itself was used and keeps the focus.
  function workFocus(prev, restore) {
    const quiet = { preventScroll: true };
    const work = $("work");
    if (restore && prev.v === "arbeit" && (prev.wt !== state.wt || prev.pr !== state.pr)) {
      const active = work.querySelector('.project-nav a[aria-current="page"]') || work.querySelector('.work-nav a[aria-current="page"]');
      active?.focus(quiet);
      return;
    }
    if (restore && prev.v !== "arbeit") {
      const back = (prev.sel && work.querySelector(`a[data-rule="${CSS.escape(prev.sel)}"]`)) ||
        (prev.doc && work.querySelector(`a[data-open="${CSS.escape(prev.doc)}"]`));
      if (back) {
        back.focus(quiet);
        return;
      }
    }
    if (state.pr && (prev.pr !== state.pr || prev.v !== state.v)) {
      // Coming from a rule's panel, the reader lands on that rule in the project.
      const card = prev.sel && document.querySelector(`#pr-${CSS.escape(state.pr)} a[data-rule="${CSS.escape(prev.sel)}"]`);
      if (card) {
        // Show the specific application when returning from its rule detail.
        const disclosure=card.closest(".card").querySelector(".application");
        if(disclosure)disclosure.open=true;
        card.closest(".card").scrollIntoView({ block: "center" });
        card.focus(quiet);
        return;
      }
      const title = document.getElementById(`pr-title-${state.pr}`);
      if (title) {
        title.focus(quiet);
        return;
      }
    }
    if (state.pr === "general" && prev.pr !== state.pr) {
      $("work").querySelector("h2").setAttribute("tabindex", "-1");
      $("work").querySelector("h2").focus(quiet);
      return;
    }
    const inSwitch = document.activeElement && document.activeElement.closest("#views");
    if (prev.v !== state.v && !inSwitch) $("main").focus(quiet);
  }

  function syncViews() {
    if (!WORK) return;
    for (const [v, id] of [["", "view-wissen"], ["arbeit", "view-arbeit"]]) {
      const a = $(id);
      a.href = hrefView(v);
      if (state.v === v) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }
  }

  // Render
  function cardLink(id) {
    return id ? document.querySelector(`.card-link[data-id="${CSS.escape(id)}"]`) : null;
  }

  function render(prev = null, restore = null) {
    syncViews();
    const working = state.v === "arbeit";
    document.body.classList.toggle("working", working);
    $("work").hidden = !working;
    if (working) {
      document.body.classList.remove("reading");
      $("board").hidden = true;
      $("reader").hidden = true;
      readerKey = "";
      navKey = "";
      renderPanel(null, null);
      renderWork(prev, restore);
      if (restore) window.scrollTo(0, restore.y);
      if (prev) workFocus(prev, restore);
      return;
    }
    const query = parseQuery(state.q);
    const scores = new Map(items.map((i) => [i, score(i, query)]));
    syncControls(items.filter((i) => scores.get(i) > 0));
    renderBoard(scores, query);

    const candidate = byId.get(state.doc);
    const doc = readable(candidate) ? candidate : null;
    const item = selected();
    document.body.classList.toggle("reading", Boolean(doc));
    $("board").hidden = Boolean(doc);
    $("reader").hidden = !doc;
    renderPanel(item, doc);

    if (!doc) {
      readerKey = "";
      navKey = "";
    } else {
      const key = `${doc.id}|${state.q}`;
      const nav = `${doc.id}|${state.page}|${state.at}`;
      if (key !== readerKey) {
        // A new query on the same document keeps the reading position.
        const keep = nav === navKey ? window.scrollY : null;
        renderReader(doc, query);
        readerKey = key;
        if (keep !== null) window.scrollTo(0, keep);
      }
      if (restore) markTarget();
      else if (nav !== navKey) position();
      navKey = nav;
      updatePage();
    }

    if (restore) {
      window.scrollTo(0, restore.y);
      $("panel").scrollTop = restore.panel || 0;
    } else if (prev && prev.v && !doc) {
      window.scrollTo(0, 0); // from the Arbeitsbereich to the top of the cards
    }
    if (prev) moveFocus(prev, doc, item, restore);
  }

  // After Back into a text, the link that had left it: the one to the same
  // place, preferably in view (the scroll position is already restored).
  function leavingLink(prev) {
    const links = [...$("reader").querySelectorAll(`a[data-open="${CSS.escape(prev.doc)}"]`)];
    const same = (a) => {
      const t = parseHash(a.getAttribute("href"));
      return t.page === prev.page && t.at === prev.at;
    };
    const inView = (a) => {
      const r = a.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const exact = links.filter(same);
    return exact.find(inView) || links.find(inView) || exact[0] || links[0] || null;
  }

  // Focus follows what opened or closed: the title of an opened document or
  // panel, and on closing the link that had opened it.
  function moveFocus(prev, doc, item, restore) {
    const quiet = { preventScroll: true };
    if (doc && prev.doc !== state.doc) {
      ((restore && prev.doc && leavingLink(prev)) || $("reader-title")).focus(quiet);
    } else if (!doc && prev.doc && !state.doc) {
      const panel = $("panel");
      const target = (!panel.hidden && panel.querySelector(`[data-open="${CSS.escape(prev.doc)}"]`)) ||
        cardLink(prev.doc) || (!panel.hidden && $("panel-title"));
      (target || $("main")).focus(quiet);
    } else if (!doc && item && prev.sel !== state.sel) {
      $("panel-title").focus(quiet);
    } else if (!doc && !item && prev.sel && !state.sel) {
      (cardLink(prev.sel) || $("main")).focus(quiet);
    } else if (prev.v && !state.v && !(document.activeElement && document.activeElement.closest("#views"))) {
      $("main").focus(quiet); // the focused element lay in the Arbeitsbereich
    }
  }

  // Events
  document.addEventListener("click", (event) => {
    // The skip link moves focus only; as a hash it would replace the state.
    const skip = event.target.closest("a.skip");
    if (skip) {
      event.preventDefault();
      $("main").focus();
      return;
    }
    const a = event.target.closest("a[href^='#']");
    if (!a || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    follow(a.getAttribute("href"));
  });

  window.addEventListener("popstate", (event) => {
    const prev = state;
    state = parseHash(location.hash);
    render(prev, (event.state && event.state.scroll) || null);
  });

  // An edited address bar changes only the hash.
  window.addEventListener("hashchange", () => {
    // An empty hash and "#" are the same state; a second render would drop focus.
    if ((location.hash || "#") === hashFor(state)) return;
    const prev = state;
    state = parseHash(location.hash);
    render(prev);
  });

  document.addEventListener("keydown", (event) => {
    const inField = event.target instanceof Element && event.target.closest("input, select, textarea");
    if (event.key === "Escape" && !inField) {
      if (reading()) closeReader();
      else if (selected()) closePanel();
    }
    if (event.key === "F3" && reading()) {
      event.preventDefault();
      stepMark(event.shiftKey ? -1 : 1);
    }
  });

  document.addEventListener("scroll", trackPage, { passive: true });
  window.matchMedia("(max-width: 48rem)").addEventListener("change", event => {
    $("filters").open = !event.matches;
  });
  window.matchMedia("(max-width: 85rem)").addEventListener("change", () => renderPanel(selected(), readable(byId.get(state.doc)) ? byId.get(state.doc) : null));

  history.replaceState({ ...history.state, depth: depth() }, "", hashFor(state));
  buildControls();
  render();
})();

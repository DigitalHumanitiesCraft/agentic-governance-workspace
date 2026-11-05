/*
 * Revenue page for the Northwind exercise data.
 *
 * Data: window.NORTHWIND from data.js, written by
 * scripts/northwind_umsatz.py --web. It holds only sums per month, delivery
 * country and product; no order, customer or person.
 *
 * One shared selection (country, category, product) filters every chart; a
 * chart is not filtered by its own dimension, so its bars stay comparable and
 * the selected one is drawn in the darker step. The selection lives in the
 * URL hash.
 *
 * Classic script and data as a global, so the page works by double click.
 * All text is inserted with textContent; the SVG is built from numbers.
 */
(function () {
  "use strict";

  const D = window.NORTHWIND;
  const $ = (id) => document.getElementById(id);
  const SVG = "http://www.w3.org/2000/svg";
  if (!D) {
    document.querySelector("main").textContent = "Die Daten fehlen. Erzeuge sie mit uv run scripts/northwind_umsatz.py --web.";
    return;
  }

  const fmt = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
  const fmtAxis = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
  const pct = new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 1 });
  const monthName = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
  const monthShort = new Intl.DateTimeFormat("de-DE", { month: "short", year: "2-digit" });
  const dateLong = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });
  const asDate = (ym) => new Date(`${ym}-01T00:00:00`);
  const TOP = 15;

  const productCat = D.products.map(([, cat]) => cat);
  const total = D.cells.reduce((s, c) => s + c[3], 0);

  // ---- State -------------------------------------------------------------------

  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    const find = (list, value) => (value === null ? -1 : list.indexOf(value));
    return {
      country: find(D.countries, p.get("land")),
      category: find(D.categories, p.get("kategorie")),
      product: find(D.products.map((x) => x[0]), p.get("produkt")),
    };
  }
  let state = readHash();
  let showAll = false;

  // Unknown values in the hash are dropped, so the URL shows what is applied.
  function writeHash() {
    const p = new URLSearchParams();
    if (state.country >= 0) p.set("land", D.countries[state.country]);
    if (state.category >= 0) p.set("kategorie", D.categories[state.category]);
    if (state.product >= 0) p.set("produkt", D.products[state.product][0]);
    history.replaceState(null, "", "#" + p.toString());
  }

  // Every click rebuilds the lists, so focus moves to the same control in the
  // new list, or to the filter bar when that control is gone.
  function setState(changes) {
    const key = document.activeElement && document.activeElement.dataset.key;
    state = { ...state, ...changes };
    writeHash();
    render();
    if (key) {
      const target = document.querySelector(`[data-key="${CSS.escape(key)}"]`) || $("chips").querySelector("button") || $("filter-text");
      target.focus({ preventScroll: true });
    }
  }

  // A cell passes all filters except the one named in `skip`.
  function passes(cell, skip) {
    const [, country, product] = cell;
    if (skip !== "country" && state.country >= 0 && country !== state.country) return false;
    if (skip !== "category" && state.category >= 0 && productCat[product] !== state.category) return false;
    if (skip !== "product" && state.product >= 0 && product !== state.product) return false;
    return true;
  }

  function sumBy(keyOf, skip, size) {
    const out = new Array(size).fill(0);
    for (const cell of D.cells) if (passes(cell, skip)) out[keyOf(cell)] += cell[3];
    return out;
  }

  // ---- Tooltip -------------------------------------------------------------------

  const tip = $("tip");
  function showTip(text, x, y) {
    tip.textContent = text;
    tip.hidden = false;
    const { width } = tip.getBoundingClientRect();
    tip.style.left = `${Math.min(x + 12, window.innerWidth - width - 8)}px`;
    tip.style.top = `${y + 14}px`;
  }
  const hideTip = () => { tip.hidden = true; };

  // ---- Bars ----------------------------------------------------------------------

  function bars(container, names, values, selected, onPick, limit = 0, include = () => true) {
    const order = names.map((n, i) => i).filter(include).sort((a, b) => values[b] - values[a] || names[a].localeCompare(names[b], "de"));
    const shown = limit ? order.slice(0, limit) : order;
    // A selected entry stays visible even below the cut.
    if (selected >= 0 && !shown.includes(selected) && order.includes(selected)) shown.push(selected);
    const max = Math.max(...values, 1);
    const rows = shown.map((i) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = values[i] ? "row" : "row zero";
      row.dataset.key = `${container.id}:${i}`;
      row.setAttribute("aria-pressed", String(i === selected));
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = names[i];
      const track = document.createElement("span");
      track.className = "track";
      const bar = document.createElement("span");
      bar.className = "bar";
      bar.style.inlineSize = `${(values[i] / max) * 78}%`;
      const val = document.createElement("span");
      val.className = "val";
      val.textContent = fmt.format(values[i]);
      track.append(bar, val);
      row.append(name, track);
      row.addEventListener("click", () => onPick(i === selected ? -1 : i));
      return row;
    });
    container.replaceChildren(...rows);
  }

  // ---- Line ----------------------------------------------------------------------

  // Smallest round value above v, so the axis does not overshoot the data.
  function niceMax(v) {
    const base = 10 ** Math.floor(Math.log10(v || 1));
    return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((f) => f * base).find((n) => n >= v);
  }

  function el(name, attrs) {
    const node = document.createElementNS(SVG, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  function line(values) {
    const box = $("line");
    const W = Math.max(box.clientWidth, 320);
    const H = 230;
    const m = { top: 12, right: 16, bottom: 26, left: 52 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    // Four equal steps of a round size, so every tick is a round number.
    const top = 4 * niceMax(Math.max(...values) / 4);
    const x = (i) => m.left + (iw * i) / (values.length - 1);
    const y = (v) => m.top + ih - (ih * v) / top;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Umsatz pro Monat, Liniendiagramm" });

    for (let k = 0; k <= 4; k++) {
      const v = (top * k) / 4;
      svg.append(el("line", { class: "gridline", x1: m.left, x2: W - m.right, y1: y(v), y2: y(v) }));
      const t = el("text", { class: "axis", x: m.left - 8, y: y(v) + 4, "text-anchor": "end" });
      t.textContent = v >= 1000 ? `${fmtAxis.format(v / 1000)} Tsd.` : fmt.format(v);
      svg.append(t);
    }
    D.months.forEach((ym, i) => {
      if (i % 3 !== 0) return;
      const t = el("text", { class: "axis", x: x(i), y: H - 6, "text-anchor": "middle" });
      t.textContent = monthShort.format(asDate(ym));
      svg.append(t);
    });

    const pts = values.map((v, i) => `${x(i)},${y(v)}`);
    svg.append(el("path", { class: "area", d: `M${x(0)},${y(0)} L${pts.join(" L")} L${x(values.length - 1)},${y(0)} Z` }));
    const last = values.length - 1;
    // The last month is incomplete: its segment is dashed, its marker pale.
    svg.append(el("path", { class: "path", d: `M${pts.slice(0, last).join(" L")}` }));
    svg.append(el("path", { class: "path partial", d: `M${pts[last - 1]} L${pts[last]}` }));
    // The end-marker labels the last value; the month is partial, so it is pale.
    svg.append(el("circle", { class: "dot partial", cx: x(last), cy: y(values[last]), r: 4 }));

    const cross = el("line", { class: "cross", x1: 0, x2: 0, y1: m.top, y2: m.top + ih, visibility: "hidden" });
    const marker = el("circle", { class: "dot", r: 5, visibility: "hidden" });
    svg.append(cross, marker);
    values.forEach((v, i) => {
      const w = iw / (values.length - 1);
      const hit = el("rect", { class: "hit", x: x(i) - w / 2, y: m.top, width: w, height: ih });
      hit.addEventListener("pointermove", (e) => {
        cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
        marker.setAttribute("cx", x(i)); marker.setAttribute("cy", y(v)); marker.setAttribute("visibility", "visible");
        const partial = i === last ? ", Monat unvollständig" : "";
        showTip(`${monthName.format(asDate(D.months[i]))}: ${fmt.format(v)}${partial}`, e.clientX, e.clientY);
      });
      hit.addEventListener("pointerleave", () => {
        cross.setAttribute("visibility", "hidden"); marker.setAttribute("visibility", "hidden"); hideTip();
      });
      svg.append(hit);
    });

    // Table view of the same values, for keyboard, screen reader and print.
    const wasOpen = Boolean(box.querySelector("details")?.open);
    const table = document.createElement("details");
    table.open = wasOpen;
    const summary = document.createElement("summary");
    summary.textContent = "Als Tabelle";
    const t = document.createElement("table");
    t.createCaption().textContent = "Umsatz pro Monat";
    const head = t.createTHead().insertRow();
    for (const label of ["Monat", "Umsatz"]) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = label;
      head.append(th);
    }
    const body = t.createTBody();
    for (const [i, ym] of D.months.entries()) {
      const tr = body.insertRow();
      tr.insertCell().textContent = monthName.format(asDate(ym));
      const c = tr.insertCell();
      c.textContent = fmt.format(values[i]);
      c.style.textAlign = "end";
    }
    table.className = "note";
    table.append(summary, t);
    box.replaceChildren(svg, table);
  }

  // ---- Render --------------------------------------------------------------------

  function render() {
    const all = sumBy(() => 0, null, 1)[0];
    $("t-rev").textContent = fmt.format(all);
    $("t-share").textContent = pct.format(all / total);
    const day = (iso) => new Date(`${iso}T00:00:00`); // local time, not UTC
    $("t-span").textContent = `${dateLong.format(day(D.first))} bis ${dateLong.format(day(D.last))}`;
    $("t-orders").textContent = `${fmt.format(D.orders)}, davon ${D.unshipped} nicht versandt`;
    $("t-rev-label").textContent = state.country < 0 && state.category < 0 && state.product < 0 ? "Umsatz gesamt" : "Umsatz der Auswahl";

    line(sumBy((c) => c[0], null, D.months.length));
    bars($("countries"), D.countries, sumBy((c) => c[1], "country", D.countries.length), state.country,
      (i) => setState({ country: i }));
    bars($("categories"), D.categories, sumBy((c) => productCat[c[2]], "category", D.categories.length), state.category,
      (i) => setState({ category: i, product: -1 }));
    // Products of the selected category only; the rest are not part of it.
    const inCategory = (i) => state.category < 0 || productCat[i] === state.category;
    const inScope = D.products.filter((p, i) => inCategory(i)).length;
    bars($("products"), D.products.map((p) => p[0]), sumBy((c) => c[2], "product", D.products.length),
      state.product, (i) => setState({ product: i }), showAll ? 0 : TOP, inCategory);
    const more = $("more");
    more.hidden = inScope <= TOP;
    more.textContent = showAll ? `Nur die ${TOP} größten zeigen` : `Alle ${inScope} Produkte zeigen`;

    const chips = [];
    const chip = (label, changes) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.dataset.key = `chip:${label}`;
      b.textContent = `${label} ×`;
      b.setAttribute("aria-label", `Filter ${label} entfernen`);
      b.addEventListener("click", () => setState(changes));
      chips.push(b);
    };
    if (state.country >= 0) chip(D.countries[state.country], { country: -1 });
    if (state.category >= 0) chip(D.categories[state.category], { category: -1 });
    if (state.product >= 0) chip(D.products[state.product][0], { product: -1 });
    if (chips.length) {
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "chip reset";
      reset.textContent = "Alle Filter entfernen";
      reset.addEventListener("click", () => setState({ country: -1, category: -1, product: -1 }));
      chips.push(reset);
    }
    $("chips").replaceChildren(...chips);
    $("filter-text").textContent = chips.length ? "Gefiltert nach:" : "Klicke ein Land, eine Kategorie oder ein Produkt, um die anderen Diagramme danach zu filtern.";
  }

  $("more").addEventListener("click", () => { showAll = !showAll; render(); });
  window.addEventListener("hashchange", () => { state = readHash(); writeHash(); render(); });
  let frame = 0;
  window.addEventListener("resize", () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(render); });
  writeHash();
  render();
})();

/* Local search shared by the browser and its dependency-free regression checks. */
(function (root) {
  "use strict";
  // Text folding and query
  // Lower case, without diacritics, hyphens and dashes as spaces, so that
  // "Prompt-Injection" finds "prompt injection" and ä matches a. The fold
  // keeps the string length, so match positions point into the original
  // text for snippets and highlighting.
  const MARKS = /[̀-ͯ]/g;
  const DASHES = /[-‐‑–]/g;
  function fold(text) {
    const quick = text.toLowerCase().normalize("NFD").replace(MARKS, "");
    let out = quick;
    if (quick.length !== text.length) {
      out = "";
      for (const ch of text) {
        const f = ch.toLowerCase().normalize("NFD").replace(MARKS, "");
        out += f.length === ch.length ? f : ch;
      }
    }
    return out.replace(DASHES, " ");
  }

  // Search forms of one query word: "massnahme" also finds "Maßnahme" and
  // "pruefung" finds "Prüfung"; the reverse needs the unfolded word, because
  // folding drops the umlaut, so "Prüfung" also finds "Pruefung" and
  // "Maßnahme" finds "Massnahme". The umlaut form applies only inside a word,
  // so English "true", "does" or "queue" stay as typed.
  const SPELLED = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
  // Each "ss" may stand for ß or not ("ausschliesslich" is "ausschließlich"),
  // so every combination is a form; three occurrences give eight.
  function sharpS(term) {
    const parts = term.split("ss");
    if (parts.length < 2 || parts.length > 4) return [term.replace(/ss/g, "ß")];
    let out = [parts[0]];
    for (const part of parts.slice(1)) out = out.flatMap((head) => [head + "ss" + part, head + "ß" + part]);
    return out;
  }
  function forms(word) {
    const term = fold(word);
    const set = new Set([term, term.replace(/(^|[^q])([aou])e(?=[a-zß]{2})/g, "$1$2"), ...sharpS(term)]);
    if (/[äöüß]/.test(word)) set.add(fold(word.replace(/[äöüß]/g, (c) => SPELLED[c])));
    return [...set].filter(Boolean);
  }

  /** @returns {{words: string[][], phrase: string[] | null, empty: boolean}} */
  function parseQuery(raw) {
    const lower = raw.toLowerCase().normalize("NFC").replace(DASHES, " ").replace(/[„“”]/g, '"');
    const words = [];
    lower.replace(/"([^"]+)"|(\S+)/g, (_, quoted, word) => {
      const term = (quoted || word).trim().replace(/\s+/g, " ");
      if (term) words.push(forms(term));
      return "";
    });
    const whole = lower.replace(/"/g, "").trim().replace(/\s+/g, " ");
    return { words, phrase: words.length > 1 && whole ? forms(whole) : null, empty: !words.length };
  }

  function count(text, needle, cap) {
    let n = 0;
    for (let at = text.indexOf(needle); at !== -1 && n < cap; at = text.indexOf(needle, at + needle.length)) n += 1;
    return n;
  }

  // Weighted hits of one needle: title before metadata before summary
  // before text; the cited pages of a rule's sources count least.
  function weight(item, needle) {
    return (
      count(item.f.title, needle, 5) * 20 +
      count(item.f.label, needle, 5) * 20 +
      count(item.f.meta, needle, 5) * 6 +
      count(item.f.summary, needle, 10) * 3 +
      count(item.f.body, needle, 30) +
      item.f.pages.reduce((sum, page) => sum + count(page, needle, 10), 0) +
      Math.min(3, item.f.cited.reduce((sum, page) => sum + count(page, needle, 3), 0)) * 0.25
    );
  }
  const best = (item, list) => Math.max(...list.map((v) => weight(item, v)));

  /** Score of an item, 0 if a word is missing. A phrase hit counts most. */
  function score(item, query) {
    if (query.empty) return 1;
    let total = 0;
    for (const list of query.words) {
      const s = best(item, list);
      if (s === 0) return 0;
      total += s;
    }
    if (query.phrase) total += 50 * best(item, query.phrase);
    return total;
  }

  /** Needles to mark: the phrase where it occurs, else the words. */
  function needles(item, query) {
    if (query.empty) return [];
    if (query.phrase && best(item, query.phrase) > 0) return query.phrase;
    const words = query.words.flat();
    const long = words.filter((n) => n.length > 2);
    return long.length ? long : words;
  }


  function suggestionsFor(items, query, limit = 6) {
    return items.map(item => ({ item, rank: score(item, query) }))
      .filter(hit => hit.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, limit).map(hit => hit.item);
  }
  function nextSuggestion(index, direction, length) {
    if (!length) return -1;
    if (index < 0) return direction > 0 ? 0 : length - 1;
    return (index + direction + length) % length;
  }
  const api = { fold, parseQuery, count, score, needles, suggestionsFor, nextSuggestion };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.KB_SEARCH = api;
})(typeof window === "undefined" ? globalThis : window);

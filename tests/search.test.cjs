const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { fold, parseQuery, score, suggestionsFor, nextSuggestion } = require('../search.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(require.resolve('../data.js'), 'utf8'), context);
const data = context.window.KB_DATA;
const index = (title, body = '') => ({ f: { title: fold(title), label: '', meta: '', summary: '', body: fold(body), pages: [], cited: [] } });

test('every unquoted term must occur, including terms in full rule wording', () => {
  const rule = data.rules.find(rule => rule.id === 'r-leitlinien-dhcraft-c-5');
  const item = index('Agentenzugriff auf den Auftrag beschränken', rule.text);
  assert.ok(score(item, parseQuery('Agentenzugriff mailbox')) > 0);
  assert.equal(score(item, parseQuery('Agentenzugriff unicorn')), 0);
});

test('quotes require an adjacent phrase rather than separate word hits', () => {
  const item = index('personal data');
  assert.ok(score(item, parseQuery('"personal data"')) > 0);
  assert.equal(score(index('personal customer data'), parseQuery('"personal data"')), 0);
});

test('umlaut spellings and sharp s find the same German words', () => {
  for (const [title, query] of [['Prüfung', 'pruefung'], ['Pruefung', 'Prüfung'], ['Maßnahme', 'massnahme']]) {
    assert.ok(score(index(title), parseQuery(query)) > 0);
  }
});

test('real source summary text is searchable', () => {
  const source = data.docs.find(doc => doc.id === 'FiveEyes_2026-05-01_careful-adoption-agentic-ai');
  assert.ok(source.summaryText.includes('agentic'));
  const item = index(source.title);
  item.f.summary = fold(source.summaryText);
  assert.ok(score(item, parseQuery('agentic')) > 0);
});

test('title matches rank before body matches', () => {
  const title = index('human oversight');
  const body = index('Agent access', 'human oversight');
  assert.ok(score(body, parseQuery('human oversight')) > 0);
  assert.equal(suggestionsFor([body, title], parseQuery('human oversight'))[0], title);
  assert.equal(suggestionsFor([title], parseQuery('unicorn')).length, 0);
});

test('suggestions handle initial arrows, wrap, and an empty result', () => {
  assert.equal(nextSuggestion(-1, 1, 6), 0);
  assert.equal(nextSuggestion(-1, -1, 6), 5);
  assert.equal(nextSuggestion(5, 1, 6), 0);
  assert.equal(nextSuggestion(0, -1, 6), 5);
  assert.equal(nextSuggestion(-1, 1, 0), -1);
});

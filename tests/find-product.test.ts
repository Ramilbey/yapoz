// Which menu item a customer's words name: the right one, or none. A wrong guess becomes a priced order for the wrong thing.
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { sql } from "../src/db";
import { findProduct, type Catalog } from "../src/agent/knowledge";

const item = (id: string, title: string, sizes: string[] = [], body = "") =>
  ({ id, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), body, variants: sizes.map((size) => ({ size, color: null, option: null })) }) as unknown as Catalog["items"][number];

const items = [
  item("a", "Four Cheese Margherita", ["Regular 10\"", "Large 14\""], "A classic pizza, also lovely with a sushi starter"),
  item("b", "Truffle Wild Mushroom", ["Regular 10\"", "Large 14\""]),
  item("c", "Kuih platter", ["Tray of 40"]),
  item("d", "Satay platter", ["Beef, 10 sticks"]),
  item("e", "Beef burger", [], "Spicy"),
  item("f", "Lamb burger", [], "Spicy"),
];
const catalog = { items, all: items } as unknown as Catalog;
const found = (name: string) => findProduct(catalog, name)?.title ?? null;

after(() => sql.end());

test("the item's own name, part of it, and extra words around it", () => {
  assert.equal(found("Kuih platter"), "Kuih platter");
  assert.equal(found("margherita"), "Four Cheese Margherita");
  assert.equal(found("two Truffle Wild Mushroom please"), "Truffle Wild Mushroom");
});

test("sizes and options may be part of the request", () => {
  assert.equal(found("regular 10 inch margherita"), "Four Cheese Margherita");
  assert.equal(found("large mushroom"), "Truffle Wild Mushroom");
});

test("small typos and plurals still find the item", () => {
  assert.equal(found("marghrita"), "Four Cheese Margherita");
  assert.equal(found("mushrom"), "Truffle Wild Mushroom");
  assert.equal(found("kuih platters"), "Kuih platter");
});

test("a word the item doesn't have means it isn't that item", () => {
  assert.equal(found("Sushi platter"), null);
  assert.equal(found("Nasi lemak"), null);
  assert.equal(found("beer burger"), null);
});

test("a name that fits several items equally is not guessed", () => {
  assert.equal(found("platter"), null);
});

test("a description counts only when it holds every word and fits one item alone", () => {
  assert.equal(found("pizza"), "Four Cheese Margherita");
  assert.equal(found("sushi platter"), null);
  assert.equal(found("spicy"), null);
});

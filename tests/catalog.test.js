import test from "node:test";
import assert from "node:assert/strict";
import {
  demoProducts,
  demoVariants,
  cleanCart,
  totals,
  safeImage,
  money,
} from "../src/catalog.js";
test("delivery threshold is strictly above 10kg", () => {
  const lines = [{ id: "turmeric-1000", qty: 10 }];
  assert.equal(totals(lines, demoVariants, 2400).free, false);
  assert.equal(totals(lines, demoVariants, 2400).shipping, 2400);
  lines.push({ id: "mango-250", qty: 1 });
  assert.equal(totals(lines, demoVariants, 2400).grams, 10250);
  assert.equal(totals(lines, demoVariants, 2400).shipping, 0);
});
test("mixed sizes and quantities calculate exact amounts", () => {
  const r = totals(
    [
      { id: "mango-250", qty: 2 },
      { id: "chilli-500", qty: 3 },
    ],
    demoVariants,
    1500,
  );
  assert.equal(money(12.5), "₹12.5");
  assert.equal(r.grams, 2000);
  assert.equal(r.subtotal, 1632);
  assert.equal(r.total, 3132);
});
test("stored cart rejects invalid lines and caps stock", () => {
  assert.deepEqual(
    cleanCart(
      [
        { id: "missing", qty: 2 },
        { id: "mango-250", qty: 500 },
        { id: "mango-250", qty: 1 },
        { id: "chilli-500", qty: -1 },
        { id: "cumin-250", qty: 1.5 },
      ],
      demoVariants,
    ),
    [{ id: "mango-250", qty: 99 }],
  );
  assert.deepEqual(
    cleanCart(
      [{ id: "mango-250", qty: 2 }],
      demoVariants.map((v) => ({ ...v, stock: 0 })),
    ),
    [],
  );
});
test("inactive packs cannot be restored", () =>
  assert.deepEqual(
    cleanCart(
      [{ id: "mango-250", qty: 2 }],
      demoVariants.map((v) => ({ ...v, active: false })),
    ),
    [],
  ));
test("catalog has 7 independently imaged products and 21 pack sizes", () => {
  assert.equal(demoProducts.length, 7);
  assert.equal(new Set(demoProducts.map((p) => p.image)).size, 7);
  assert.equal(demoVariants.length, 21);
});
test("image URLs reject executable and protocol-relative URLs", () => {
  assert.equal(safeImage("javascript:alert(1)"), false);
  assert.equal(safeImage("//evil.example/x"), false);
  assert.equal(safeImage("/images/mango.webp"), true);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  demoProducts,
  cleanCart,
  cartTotal,
  validProduct,
  safeImage,
} from "../src/catalog.js";
test("cart rejects corrupted persisted data and caps quantities", () => {
  assert.deepEqual(
    cleanCart(
      [
        { id: "mango", qty: 3 },
        { id: "mango", qty: 2 },
        { id: "prawn", qty: 999 },
        { id: "unknown", qty: 1 },
        { id: "chicken", qty: -1 },
      ],
      demoProducts,
    ),
    [
      { id: "mango", qty: 3 },
      { id: "prawn", qty: 20 },
    ],
  );
  assert.deepEqual(cleanCart({ id: "mango" }, demoProducts), []);
});
test("cart prices come from catalog instead of saved browser values", () =>
  assert.equal(
    cartTotal(
      [
        { id: "mango", qty: 2, price: 1 },
        { id: "chicken", qty: 1 },
      ],
      demoProducts,
    ),
    947,
  ));
test("catalog rejects unsafe images and invalid prices", () => {
  assert.ok(demoProducts.every(validProduct));
  assert.equal(validProduct({ ...demoProducts[0], price: -2 }), false);
  assert.equal(safeImage("javascript:alert(1)"), false);
  assert.equal(safeImage("//evil.example/image"), false);
});

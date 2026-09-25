import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { Window } from "happy-dom";
const tick = () => new Promise((r) => setTimeout(r, 30));
test("built storefront: shopping, box, checkout, account and admin preview", async (t) => {
  const window = new Window({
    url: "http://localhost:4173",
    settings: { enableJavaScriptEvaluation: true },
  });
  const html = fs.readFileSync("dist/index.html", "utf8");
  const asset = html.match(/src="(\/assets\/[^" ]+\.js)"/)[1];
  window.document.write(
    html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<link[^>]*>/g, ""),
  );
  window.localStorage.setItem("nr-motion", "off");
  window.eval(fs.readFileSync("dist" + asset, "utf8"));
  const d = window.document;
  const click = (sel) => {
    const el = d.querySelector(sel);
    assert.ok(el, sel);
    el.click();
  };
  const go = async (route) => {
    window.location.hash = route;
    await tick();
  };
  try {
    await t.test("home renders real catalog content", () => {
      assert.match(d.querySelector("h1").textContent, /A little spice/);
      assert.equal(d.querySelectorAll(".product-card").length, 4);
      assert.equal(
        d.querySelector(".hero-art img").getAttribute("src"),
        "/images/box.webp",
      );
    });
    await t.test(
      "shop filters and search return expected products",
      async () => {
        await go("/shop");
        assert.equal(d.querySelectorAll(".product-card").length, 7);
        click('[data-filter="powders"]');
        assert.equal(d.querySelectorAll(".product-card").length, 2);
        const input = d.querySelector("#search");
        input.value = "turmeric";
        input.dispatchEvent(new window.Event("input", { bubbles: true }));
        assert.equal(d.querySelectorAll(".product-card").length, 1);
        assert.match(d.querySelector(".product-card").textContent, /Turmeric/);
        input.value = "";
        input.dispatchEvent(new window.Event("input", { bubbles: true }));
        click('[data-filter="all"]');
      },
    );
    await t.test(
      "custom box reaches 10kg and then unlocks delivery only above it",
      async () => {
        await go("/box");
        d.querySelector("#size-turmeric").value = "turmeric-1000";
        for (let i = 0; i < 10; i++) click('[data-add="turmeric"]');
        assert.match(
          d.querySelector("#builder-summary .weight-info").textContent,
          /10 kg/,
        );
        assert.match(
          d.querySelector("#builder-summary .delivery-message").textContent,
          /at 10 kg/,
        );
        click('[data-add="mango"]');
        assert.match(
          d.querySelector("#builder-summary .weight-info").textContent,
          /10.25 kg/,
        );
        assert.match(
          d.querySelector("#builder-summary .delivery-message").textContent,
          /Free delivery unlocked/,
        );
        assert.equal(
          JSON.parse(window.localStorage.getItem("nr-box")).length,
          2,
        );
      },
    );
    await t.test("quantity removal reverts free delivery", () => {
      click('#builder-summary [data-remove="mango-250"]');
      assert.match(
        d.querySelector("#builder-summary .delivery-message").textContent,
        /at 10 kg/,
      );
      click('#builder-summary [data-qty="turmeric-1000"][data-delta="-1"]');
      assert.match(
        d.querySelector("#builder-summary .weight-info").textContent,
        /9 kg/,
      );
    });
    await t.test(
      "checkout produces an unpaid preview without storing personal details",
      async () => {
        await go("/checkout");
        const form = d.querySelector("#checkout-form");
        for (const [name, value] of Object.entries({
          name: "Sample Customer",
          email: "sample@example.com",
          street: "1 Example Street",
          city: "Example",
          region: "Example",
          postal: "12345",
        }))
          form.elements.namedItem(name).value = value;
        form.dispatchEvent(
          new window.Event("submit", { bubbles: true, cancelable: true }),
        );
        await tick();
        assert.match(
          d.querySelector(".receipt").textContent,
          /No payment taken/,
        );
        assert.match(
          d.querySelector(".receipt").textContent,
          /No personal details were saved/,
        );
        assert.ok(!window.localStorage.getItem("nr-box").includes("Sample"));
      },
    );
    await t.test("unconnected auth is disabled and honest", async () => {
      await go("/account");
      assert.equal(d.querySelector("#auth-form button").disabled, true);
      assert.match(
        d.querySelector(".account-form").textContent,
        /connection pending/,
      );
      click('[data-auth="signup"]');
      assert.match(
        d.querySelector("#auth-form button").textContent,
        /Create account/,
      );
    });
    await t.test("admin preview never presents fake paid orders", async () => {
      await go("/admin");
      await tick();
      assert.match(
        d.querySelector(".admin-main").textContent,
        /READ-ONLY ADMIN PREVIEW/,
      );
      assert.equal(d.querySelectorAll(".admin-product").length, 7);
      assert.ok(
        [...d.querySelectorAll(".admin-product button")].every(
          (b) => b.disabled,
        ),
      );
      click('[data-admin-tab="orders"]');
      await tick();
      assert.match(d.querySelector("#admin-data").textContent, /No orders yet/);
    });
  } finally {
    await window.happyDOM.abort();
    window.happyDOM.close();
  }
});

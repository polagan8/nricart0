import { initMotion } from "./motion.js";
import {
  demoProducts,
  money,
  validProduct,
  cleanCart,
  cartTotal,
} from "./catalog.js";
let products = demoProducts,
  filter = "all",
  liveCatalog = false,
  cart = [];
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const safeRead = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};
try {
  cart = cleanCart(JSON.parse(safeRead("nricart-bag-v1")), products);
} catch {
  cart = [];
}
let toastTimer;
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2600);
}
function card(p) {
  return `<article class="product-card"><button class="product-image-button" data-product="${esc(p.id)}" aria-label="View ${esc(p.name)}"><span class="product-tag">${esc(p.tag || "THE COLLECTION")}</span><img src="${esc(p.image)}" alt="${esc(p.name)} in an open glass jar" width="800" height="800" loading="lazy"><span class="quick-view">Discover the flavour ↗</span></button><div class="product-meta"><span><i class="diet-mark ${p.category === "non-vegetarian" ? "nonveg" : ""}" aria-hidden="true"></i>${p.category === "vegetarian" ? "VEGETARIAN" : "NON-VEGETARIAN"}</span><span>${esc(p.weight)}</span></div><h3><button class="product-name" data-product="${esc(p.id)}">${esc(p.name)}</button></h3><p class="product-desc">${esc(p.notes)}</p><div class="product-purchase"><span class="price">${money(p.price)}<small>/ jar</small></span><button class="add-button" data-add="${esc(p.id)}" aria-label="Add ${esc(p.name)} to bag">+</button></div></article>`;
}
function renderProducts() {
  const visible = products.filter(
    (p) => filter === "all" || p.category === filter,
  );
  $("#product-grid").innerHTML = visible.length
    ? visible.map(card).join("")
    : "<p>No pickles in this collection yet. Try another category.</p>";
  $("#product-count").textContent =
    `${visible.length} favourite${visible.length === 1 ? "" : "s"}`;
}
function persistCart() {
  safeWrite("nricart-bag-v1", JSON.stringify(cart));
  renderCart();
}
function addToCart(id) {
  const p = products.find((p) => p.id === id);
  if (!p) return;
  const line = cart.find((p) => p.id === id);
  if (line && line.qty >= 20) {
    toast("Maximum 20 jars of each flavour.");
    return;
  }
  if (line) line.qty++;
  else cart.push({ id, qty: 1 });
  persistCart();
  toast(`${p.name} added to your bag`);
}
function renderCart() {
  const count = cart.reduce((s, p) => s + p.qty, 0);
  $("#bag-count").textContent = count;
  $("#open-cart").setAttribute(
    "aria-label",
    `Open shopping bag, ${count} items`,
  );
  $("#cart-items-count").textContent = `(${count})`;
  if (!count) {
    $("#cart-content").innerHTML =
      '<div class="cart-empty"><h3>Room for a favourite.</h3><p>Your bag is empty.<br>Let’s find something that tastes like home.</p><button class="button button-dark" id="continue-shopping">Explore the collection <span>↗</span></button></div>';
    $("#cart-footer").innerHTML = "";
    return;
  }
  $("#cart-content").innerHTML = cart
    .map((line) => {
      const p = products.find((p) => p.id === line.id);
      return `<div class="cart-line"><img src="${esc(p.image)}" alt="${esc(p.name)}" width="90" height="105"><div><h3>${esc(p.name)}</h3><p>${esc(p.weight)} · ${money(p.price)}</p><div class="line-actions"><div class="quantity"><button data-quantity="${esc(p.id)}" data-delta="-1" aria-label="Decrease ${esc(p.name)} quantity">−</button><span aria-label="Quantity">${line.qty}</span><button data-quantity="${esc(p.id)}" data-delta="1" aria-label="Increase ${esc(p.name)} quantity" ${line.qty >= 20 ? "disabled" : ""}>+</button></div><button class="remove" data-remove="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">Remove</button></div></div></div>`;
    })
    .join("");
  const msg = `Hi NRICart, I'd like to enquire about these pickles:\n${cart
    .map((line) => {
      const p = products.find((p) => p.id === line.id);
      return `${p.name} (${p.weight}) × ${line.qty}`;
    })
    .join(
      "\n",
    )}\nPlease confirm current prices, ingredients, availability and delivery to my destination.`;
  $("#cart-footer").innerHTML =
    `<div class="subtotal"><span>${liveCatalog ? "Subtotal" : "Preview subtotal"}</span><strong>${money(cartTotal(cart, products))}</strong></div><p class="cart-note">${liveCatalog ? "Delivery and final availability are confirmed by NRICart." : "Prices are illustrative. Confirm actual prices, ingredients and delivery with NRICart."} This sends an enquiry, not a paid order.</p><a class="button button-dark checkout-link" href="https://wa.me/919494608143?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener noreferrer">Enquire about this bag <span>↗</span></a>`;
}
function showProduct(id) {
  const p = products.find((p) => p.id === id);
  if (!p) return;
  $("#product-detail").innerHTML =
    `<img class="detail-photo" src="${esc(p.image)}" alt="${esc(p.name)} in an open glass jar" width="800" height="800"><div class="detail-copy"><span class="eyebrow">${esc(p.tag || "THE COLLECTION")} · ${esc(p.weight)}</span><h2 id="product-title">${esc(p.name)}</h2><p>${esc(p.description)}</p><dl><dt>Flavour</dt><dd>${esc(p.heat || "See product label")}</dd><dt>Pair it with</dt><dd>${esc(p.pairing || "Your favourite meal")}</dd><dt>Preference</dt><dd>${p.category === "vegetarian" ? "Vegetarian" : "Non-vegetarian"}</dd></dl><strong>${money(p.price)} <span style="font-weight:400;font-size:14px">/ ${esc(p.weight)}</span></strong><button class="button button-dark" data-add="${esc(p.id)}">Add to bag <span>+</span></button><p class="detail-note">${liveCatalog ? "" : "Preview product and illustrative pricing. "}Confirm ingredients, allergens and storage instructions with NRICart before ordering.${p.id === "prawn" ? " Contains prawns (shellfish)." : ""}</p></div>`;
  $("#product-dialog").showModal();
}
document.addEventListener("click", (event) => {
  const el = event.target.closest("button");
  if (!el) return;
  if (el.dataset.filter) {
    filter = el.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((b) => {
      b.classList.toggle("active", b === el);
      b.setAttribute("aria-pressed", String(b === el));
    });
    renderProducts();
  }
  if (el.dataset.product) showProduct(el.dataset.product);
  if (el.dataset.add) addToCart(el.dataset.add);
  if (el.dataset.close) document.getElementById(el.dataset.close).close();
  if (el.id === "open-cart") $("#cart-dialog").showModal();
  if (el.id === "continue-shopping") {
    $("#cart-dialog").close();
    $("#collection").scrollIntoView({
      behavior: document.documentElement.classList.contains("motion-off") ? "instant" : "smooth",
    });
  }
  if (el.dataset.remove) {
    cart = cart.filter((p) => p.id !== el.dataset.remove);
    persistCart();
  }
  if (el.dataset.quantity) {
    const line = cart.find((p) => p.id === el.dataset.quantity);
    if (line) {
      line.qty = Math.max(0, Math.min(20, line.qty + Number(el.dataset.delta)));
      cart = cart.filter((p) => p.qty > 0);
      persistCart();
      const target = $(
        `[data-quantity="${CSS.escape(line.id)}"][data-delta="${el.dataset.delta}"]`,
      );
      if (target) target.focus();
    }
  }
});
for (const dialog of document.querySelectorAll("dialog"))
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
$("#year").textContent = new Date().getFullYear();
renderProducts();
renderCart();
initMotion();
async function loadCatalog() {
  const url = import.meta.env.VITE_SUPABASE_URL,
    key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  try {
    const base = new URL(url);
    if (base.protocol !== "https:") throw Error("HTTPS required");
    const response = await fetch(
      `${base.origin}/rest/v1/storefront_products?select=*&active=eq.true&order=sort_order.asc`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) throw Error("Catalog unavailable");
    const data = await response.json();
    if (!Array.isArray(data) || data.some((p) => !validProduct(p)))
      throw Error("Invalid catalog");
    products = data;
    liveCatalog = true;
    filter = "all";
    document.querySelectorAll("[data-filter]").forEach((b) => {
      b.classList.toggle("active", b.dataset.filter === "all");
      b.setAttribute("aria-pressed", String(b.dataset.filter === "all"));
    });
    cart = cleanCart(cart, products);
    $("#catalog-notice").hidden = true;
    renderProducts();
    persistCart();
    if (!products.length)
      $("#catalog-status").textContent =
        "The collection is being updated. Please check back soon.";
  } catch {
    liveCatalog = false;
    $("#catalog-status").textContent =
      "The live collection is temporarily unavailable. Showing the preview collection; please confirm all details with NRICart.";
  }
}
loadCatalog();

if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  for (const tool of [
    {
      name: "read_nricart_collection",
      description:
        "Read the currently displayed NRICart catalog and whether prices are preview or live. No purchase is made.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => ({
        preview: !liveCatalog,
        products: products.map(({ id, name, price, category, weight }) => ({
          id,
          name,
          price,
          category,
          weight,
        })),
        currency: "INR",
      }),
    },
    {
      name: "add_nricart_item_to_bag",
      description:
        "Stage one jar in the local shopping bag. Does not submit an order or contact NRICart.",
      inputSchema: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input) => {
        if (
          !input ||
          typeof input.productId !== "string" ||
          !products.some((p) => p.id === input.productId)
        )
          throw Error("Unknown product");
        if ((cart.find((p) => p.id === input.productId)?.qty || 0) >= 20)
          throw Error("Maximum quantity reached");
        addToCart(input.productId);
        return { bag: cart.map((p) => ({ ...p })), submitted: false };
      },
    },
  ]) {
    try {
      Promise.resolve(
        document.modelContext.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
  }
  addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}

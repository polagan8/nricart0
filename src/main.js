import {
  demoProducts,
  demoVariants,
  demoShipping,
  money,
  weight,
  cleanCart,
  totals,
  validProduct,
  safeImage,
} from "./catalog.js";
import { db, checked, catalog, isAdmin, placePreview } from "./backend.js";
import { motion, setupMotion } from "./motion.js";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let products = demoProducts,
  variants = demoVariants,
  shipping = demoShipping,
  cart = [],
  session = null,
  admin = false,
  loading = !!db,
  failed = false;
let recovering = false;
let category = "all",
  search = "",
  sort = "featured",
  country = "US",
  authMode = "login",
  adminTab = "products",
  requestId = crypto.randomUUID(),
  busy = false;
try {
  cart = cleanCart(
    JSON.parse(localStorage.getItem("nr-box") || "[]"),
    variants,
  );
} catch {}
let toastTimer;
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
const route = () => location.hash.slice(1).split("?")[0] || "/";
const fee = () => shipping.find((s) => s.country === country)?.fee ?? 0;
const notice = () =>
  loading
    ? '<p class="notice">Connecting to the pantry…</p>'
    : failed
      ? '<p class="notice error">The live pantry is unavailable. Ordering is disabled. <button data-retry>Try again</button></p>'
      : !db
        ? '<p class="notice">Preview store · Sample prices, delivery rates and product imagery · Payments are not enabled</p>'
        : '<p class="notice">Preview store · Sample prices and delivery rates · No payment or shipment</p>';
const options = () =>
  shipping
    .map(
      (s) =>
        `<option value="${esc(s.country)}" ${s.country === country ? "selected" : ""}>${esc(s.name)}</option>`,
    )
    .join("");
const variantOptions = (p) =>
  variants
    .filter((v) => v.product_id === p.id && v.active)
    .map(
      (v) =>
        `<option value="${esc(v.id)}" ${v.stock === 0 ? "disabled" : ""}>${weight(v.weight_g)} · ${money(v.price)}${v.stock === 0 ? " · Sold out" : ""}</option>`,
    )
    .join("");
function card(p) {
  const vs = variants.filter((v) => v.product_id === p.id && v.active),
    v = vs.find((v) => v.stock > 0) || vs[0];
  return `<article class="product-card"><button class="product-photo" data-product="${esc(p.id)}" aria-label="Explore ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" width="600" height="600" loading="lazy"><span class="category-label">${esc(p.category)}</span><span class="photo-arrow">↗</span></button><div class="product-copy"><span class="diet">${p.diet === "non-vegetarian" ? "Non-vegetarian" : "Vegetarian"}</span><h3><button data-product="${esc(p.id)}">${esc(p.name)}</button></h3><p>${esc(p.notes)}</p><div class="purchase"><label class="sr-only" for="size-${esc(p.id)}">Size for ${esc(p.name)}</label><select id="size-${esc(p.id)}" ${!v ? "disabled" : ""}>${variantOptions(p)}</select><button data-add="${esc(p.id)}" aria-label="Add ${esc(p.name)} to box" ${!v || !v.stock || failed || loading ? "disabled" : ""}>+</button></div></div></article>`;
}
function home() {
  return `<div class="scroll-progress"></div><section class="hero"><div class="hero-copy"><span class="eyebrow">THE INDIAN PANTRY. WITHOUT THE DISTANCE.</span><h1>A little spice.<br>A lot of <em>home.</em></h1><p>Pickles that spark a memory. Spices that start a ritual.<br>Pack your favourites. We’ll bring India to your table.</p><div class="hero-buttons"><a class="button gold" href="#/box">Build your box <span>↗</span></a><a class="text-link" href="#/shop">Explore the pantry</a></div><div class="hero-note"><span>01 / YOUR PANTRY, YOUR WAY</span><span>Scroll to discover ↓</span></div></div><div class="hero-art"><img src="/images/box.webp" alt="NRICart pantry box with Indian pickles and spices" fetchpriority="high" width="1672" height="941"><div class="round-stamp">PACK A LITTLE<br><strong>home.</strong><br>TAKE IT ANYWHERE</div></div></section>
<div class="ticker" aria-hidden="true"><div class="floating-line">ROOTED IN INDIA &nbsp; ✳ &nbsp; PACKED WITH FEELING &nbsp; ✳ &nbsp; ROOTED IN INDIA &nbsp; ✳ &nbsp; PACKED WITH FEELING</div></div>
<section class="section"><div class="section-heading reveal"><div><span class="eyebrow">01 / THE EVERYDAY ESSENTIALS</span><h2>Small things.<br><em>Big feelings.</em></h2></div><div><p>Your kitchen, a little closer to home.</p><a class="text-link" href="#/shop">Shop the whole pantry ↗</a></div></div>${notice()}<div class="product-grid">${(db ? products.slice(0, 4) : products.filter((p) => ["mango", "turmeric", "chilli", "gongura"].includes(p.id))).map(card).join("")}</div></section>
<section class="box-story"><div class="box-story-art parallax"><img src="/images/box.webp" alt="A custom box of Indian pantry favourites" width="1672" height="941" loading="lazy"></div><div class="box-story-copy reveal"><span class="eyebrow">02 / SOMETHING PERSONAL</span><h2>No two kitchens.<br><em>No two boxes.</em></h2><p>A little more pickle? A whole lot of spice? Choose exactly what belongs in your pantry.</p><ol class="steps"><li><span>01</span>Pick your favourites</li><li><span>02</span>Choose your sizes & quantities</li><li><span>03</span>Go over 10 kg. Delivery is on us.</li></ol><a class="button gold" href="#/box">Make it your own <span>↗</span></a></div></section>
<section class="memory-section"><span class="eyebrow">DISTANCE CHANGES. THE FEELING DOESN’T.</span><div class="floating-line">Not just a pantry.</div><div class="floating-line"><em>A place you belong.</em></div><p>The first crackle of cumin. That unmistakable mango tang.<br>Familiar flavours, for the life you’re building somewhere new.</p><a class="text-link" href="#/story">Meet NRICart ↗</a></section><section class="section help-strip"><div><span class="eyebrow">A FEW THINGS TO KNOW</span><h2>Before you <em>unbox.</em></h2></div>${faq()}</section>`;
}
function faq() {
  return `<div class="faq"><details><summary>How does free delivery work?</summary><p>Choose any mix of products. When their combined product weight is greater than 10 kg, delivery is free to an enabled destination. Exactly 10 kg does not qualify. Packaging weight is not included.</p></details><details><summary>Can I mix pickles and spices?</summary><p>Yes. Pick a size for each product and adjust the quantities in your box. The weight and price update as you build.</p></details><details><summary>Where do you deliver?</summary><p>Select a destination in the box builder. This preview uses illustrative rates. Final destinations and product eligibility must be confirmed before live orders, particularly for meat and seafood.</p></details><details><summary>Are payments live?</summary><p>Not yet. You can preview checkout without entering card details or being charged. No preview order will be shipped.</p></details><details><summary>Ingredients, allergens & storage?</summary><p>Ask NRICart for the verified product label before purchasing. Product descriptions and images in this preview are illustrative. Prawn pickle contains shellfish.</p></details></div>`;
}
function toolbar() {
  return `<div class="toolbar"><div class="filters" role="group" aria-label="Product categories">${[
    ["all", "Everything"],
    ["pickles", "Pickles"],
    ["powders", "Powders"],
    ["spices", "Whole spices"],
  ]
    .map(
      ([v, t]) =>
        `<button data-filter="${v}" class="${category === v ? "active" : ""}" aria-pressed="${category === v}">${t}</button>`,
    )
    .join(
      "",
    )}</div><div class="search-sort"><input id="search" type="search" aria-label="Search pantry" placeholder="Find your favourite…" value="${esc(search)}"><select id="sort" aria-label="Sort products"><option value="featured">Featured</option><option value="low" ${sort === "low" ? "selected" : ""}>Price: low to high</option><option value="high" ${sort === "high" ? "selected" : ""}>Price: high to low</option></select></div></div>`;
}
function filtered() {
  let list = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      `${p.name} ${p.notes}`.toLowerCase().includes(search.toLowerCase()),
  );
  const price = (p) => variants.find((v) => v.product_id === p.id)?.price || 0;
  if (sort !== "featured")
    list.sort((a, b) => (price(a) - price(b)) * (sort === "low" ? 1 : -1));
  return (
    list.map(card).join("") ||
    '<div class="empty"><h3>No favourites found.</h3><p>Try a different search or category.</p><button data-clear class="button dark">Clear filters</button></div>'
  );
}
function shop(box = false) {
  return `<section class="page-heading"><span class="eyebrow">${box ? "YOUR PANTRY. YOUR RULES." : "THE NRICART COLLECTION"}</span><h1>${box ? "Build a box of <em>home.</em>" : "Meet your new <em>essentials.</em>"}</h1><p>${box ? "Mix your favourites. Watch your box grow. Free delivery above 10 kg." : "Pickles, powders and whole spices. A little of everything you miss."}</p></section><section class="section shop-section">${notice()}${toolbar()}<div class="${box ? "builder-layout" : ""}"><div class="product-grid" id="product-grid">${filtered()}</div>${box ? '<aside id="builder-summary" class="box-summary"></aside><div id="mobile-box-status" class="mobile-box-status"></div>' : ""}</div></section>`;
}
function progress(t) {
  return `<div class="weight-info"><span>YOUR BOX WEIGHT</span><strong>${weight(t.grams)}</strong></div><progress max="10000" value="${Math.min(10000, t.grams)}" aria-label="Progress toward free delivery"></progress><p class="delivery-message">${t.free ? "✓ Free delivery unlocked" : t.grams === 10000 ? "You’re at 10 kg. Add one more item for free delivery." : `Add more than ${weight(10000 - t.grams)} for free delivery.`}</p>`;
}
function lineItems() {
  return cart
    .map((l) => {
      const v = variants.find((v) => v.id === l.id),
        p = products.find((p) => p.id === v.product_id);
      if (!p) return "";
      return `<div class="cart-line"><img src="${esc(p.image)}" alt="${esc(p.name)}" width="72" height="72"><div><h3>${esc(p.name)}</h3><p>${weight(v.weight_g)} · ${money(v.price)}</p><div class="quantity"><button data-qty="${esc(v.id)}" data-delta="-1" aria-label="Decrease ${esc(p.name)}">−</button><span>${l.qty}</span><button data-qty="${esc(v.id)}" data-delta="1" aria-label="Increase ${esc(p.name)}" ${l.qty >= Math.min(99, v.stock) ? "disabled" : ""}>+</button><button class="remove" data-remove="${esc(v.id)}" aria-label="Remove ${esc(p.name)}">Remove</button></div></div><strong>${money(v.price * l.qty)}</strong></div>`;
    })
    .join("");
}
function summary(compact = false) {
  const t = totals(cart, variants, fee());
  return `<div class="summary-title"><span class="eyebrow">${compact ? "YOUR CUSTOM BOX" : "PACKED WITH YOUR FAVOURITES"}</span><h2>A taste of home.</h2></div>${progress(t)}${cart.length ? lineItems() : '<div class="empty-box">Your box is waiting.<br>Add something you love.</div>'}<label class="field">Deliver to<select data-country>${options()}</select></label><div class="bill"><div><span>Products</span><strong>${money(t.subtotal)}</strong></div><div><span>${db ? "Delivery" : "Delivery estimate"}</span><strong>${t.free ? "FREE" : money(t.shipping)}</strong></div><div class="total"><span>${db ? "Total" : "Preview total"}</span><strong>${money(t.total)}</strong></div></div><a class="button dark ${!cart.length || failed || loading ? "disabled" : ""}" ${!cart.length || failed || loading ? 'aria-disabled="true" tabindex="-1"' : ""} href="#/checkout">Preview checkout <span>↗</span></a><small>Prices in INR. No payment will be taken.</small>${compact ? '<button class="text-link" data-save-box>Save my box</button>' : ""}`;
}
function renderCart() {
  const count = cart.reduce((a, l) => a + l.qty, 0);
  $("#bag-count").textContent = count;
  $("#cart-body").innerHTML = summary();
  if ($("#builder-summary")) $("#builder-summary").innerHTML = summary(true);
  if ($("#checkout-summary")) $("#checkout-summary").innerHTML = summary();
  if ($("#mobile-box-status")) {
    const t = totals(cart, variants, fee());
    $("#mobile-box-status").innerHTML =
      `<div><strong>${weight(t.grams)} in your box</strong><span>${t.free ? "Free delivery unlocked" : "Free delivery over 10 kg"}</span></div><button data-review-box>Review box (${count}) ↗</button>`;
  }
}
function persist() {
  try {
    localStorage.setItem("nr-box", JSON.stringify(cart));
  } catch {}
  requestId = crypto.randomUUID();
  renderCart();
}
function product(id) {
  const p = products.find((p) => p.id === id);
  if (!p) return;
  $("#product-detail").innerHTML =
    `<img src="${esc(p.image)}" alt="${esc(p.name)}"><div><span class="eyebrow">${esc(p.category)} / ${esc(p.diet)}</span><h2 id="product-title">${esc(p.name)}</h2><p>${esc(p.description)}</p><label class="field">Choose a size<select id="detail-size">${variantOptions(p)}</select></label><button class="button dark" data-detail-add="${esc(p.id)}" ${failed || loading ? "disabled" : ""}>Add to your box <span>+</span></button><small>Illustrative product photograph. Verify ingredients, allergens and shelf life against the final product label.</small></div>`;
  $("#product-dialog").showModal();
}
function checkout() {
  if (!cart.length)
    return '<section class="page-heading"><h1>Your box is <em>empty.</em></h1><a class="button dark" href="#/box">Build your box ↗</a></section>';
  return `<section class="page-heading"><span class="eyebrow">01 BOX → 02 DETAILS → 03 PREVIEW</span><h1>Next stop: <em>your kitchen.</em></h1><p>Checkout preview. No charge. No shipment.</p></section><section class="section checkout-layout"><form id="checkout-form"><h2>Delivery details</h2>${!db ? '<p class="notice">Use sample details to try the flow. These details are not saved.</p>' : !session ? '<p class="notice">Sign in to save this preview order. <a href="#/account">Go to account ↗</a></p>' : ""}<div class="form-grid"><label class="field">Full name<input name="name" required maxlength="100" autocomplete="name"></label><label class="field">Email<input name="email" type="email" required maxlength="254" autocomplete="email" value="${esc(session?.user.email || "")}"></label><label class="field full">Street address<input name="street" required maxlength="200" autocomplete="street-address"></label><label class="field">City<input name="city" required maxlength="100" autocomplete="address-level2"></label><label class="field">State / province<input name="region" required maxlength="100" autocomplete="address-level1"></label><label class="field">Postal code<input name="postal" required maxlength="20" autocomplete="postal-code"></label><label class="field">Country<select name="country" required data-country>${options()}</select></label></div><div class="payment-preview"><span class="eyebrow">PAYMENT · COMING LATER</span><h3>One last step. Soon.</h3><p>Card and local payment options will appear here once a gateway is connected.</p><div class="payment-marks"><span>Credit / debit card</span><span>Local payments</span></div><p>We never ask for card details in this preview.</p></div><label class="check"><input type="checkbox" required> I understand this is a preview and no order will be paid or shipped.</label><p id="checkout-error" class="form-error" role="alert"></p><button class="button dark" type="submit" ${failed || loading || (db && !session) ? "disabled" : ""}>${db ? "Save preview order" : "Create preview receipt"} <span>↗</span></button></form><aside id="checkout-summary" class="box-summary"></aside></section>`;
}
function account() {
  if (session && !recovering)
    return `<section class="page-heading"><span class="eyebrow">YOUR NRICART</span><h1>Welcome <em>home.</em></h1><p>${esc(session.user.email)}</p><button class="text-link" data-signout>Sign out</button></section><section class="section"><div class="section-heading"><h2>Your orders</h2><button class="button dark" data-load-box>Restore saved box</button></div><div id="orders-list">Loading your orders…</div></section>`;
  return `<section class="account-layout"><div class="account-art"><img src="/images/box.webp" alt="NRICart pantry box"><div><span class="eyebrow">YOUR NEXT CHAPTER. A FAMILIAR FLAVOUR.</span><h2>A little closer<br><em>to home.</em></h2></div></div><div class="account-form"><span class="eyebrow">WELCOME TO NRICART</span><h1>${authMode === "signup" ? "Make yourself <em>at home.</em>" : authMode === "reset" ? "A fresh <em>start.</em>" : authMode === "update" ? "Set your <em>password.</em>" : "Good to have<br>you <em>back.</em>"}</h1>${!db ? '<p class="notice">Account connection pending. Sign-in becomes available when Supabase is configured.</p>' : ""}<form id="auth-form">${authMode !== "update" ? '<label class="field">Email address<input name="email" type="email" required autocomplete="email"></label>' : ""}${authMode !== "reset" ? `<label class="field">Password<input name="password" type="password" minlength="8" required autocomplete="${authMode === "login" ? "current-password" : "new-password"}"></label>` : ""}<p id="auth-message" role="status"></p><button class="button dark" ${!db ? "disabled" : ""}>${authMode === "signup" ? "Create account" : authMode === "reset" ? "Send reset link" : authMode === "update" ? "Update password" : "Sign in"} <span>↗</span></button></form><div class="auth-links"><button data-auth="${authMode === "login" ? "signup" : "login"}">${authMode === "login" ? "New here? Create an account" : "Back to sign in"}</button><button data-auth="reset">Forgot password?</button></div><a class="text-link" href="#/shop">Continue browsing ↗</a></div></section>`;
}
async function loadOrders() {
  try {
    const rows = await checked(
      db
        .from("nr_orders")
        .select("*")
        .order("created_at", { ascending: false }),
    );
    if ($("#orders-list"))
      $("#orders-list").innerHTML = rows.length
        ? rows
            .map(
              (o) =>
                `<article class="order"><div><span class="eyebrow">${esc(o.id.slice(0, 8))} · ${new Date(o.created_at).toLocaleDateString()}</span><h3>${money(o.total)} · ${weight(o.weight_g)}</h3><p>${esc(o.status)} · Payment: ${esc(o.payment_status)}</p></div><div>${o.items.map((i) => `<p>${esc(i.name)} · ${weight(i.weight_g)} × ${i.qty}</p>`).join("")}</div></article>`,
            )
            .join("")
        : '<div class="empty"><h3>Your first box is still to come.</h3><a href="#/box" class="button dark">Build your box ↗</a></div>';
  } catch (e) {
    if ($("#orders-list"))
      $("#orders-list").textContent =
        "Orders could not be loaded. Please try again.";
  }
}
function adminPage() {
  if (db && !admin)
    return `<section class="page-heading"><span class="eyebrow">NRICART ADMIN</span><h1>${session ? "Access <em>restricted.</em>" : "Admin <em>sign in.</em>"}</h1><p>${session ? "This account has no admin access." : "Sign in with an administrator account to manage the store."}</p><a class="button dark" href="#/account">Go to account ↗</a></section>`;
  return `<section class="admin-shell"><aside class="admin-nav"><span class="eyebrow">NRICART / STUDIO</span><h2>The pantry<br><em>behind the pantry.</em></h2>${["products", "orders", "delivery"].map((t) => `<button data-admin-tab="${t}" class="${adminTab === t ? "active" : ""}">${t[0].toUpperCase() + t.slice(1)} ↗</button>`).join("")}<a href="#/">Back to storefront</a></aside><div class="admin-main"><span class="eyebrow">${db ? "STORE MANAGEMENT" : "READ-ONLY ADMIN PREVIEW"}</span><h1>${adminTab[0].toUpperCase() + adminTab.slice(1)}</h1>${!db ? '<p class="notice">Sample data. Connect Supabase and assign an administrator to enable changes.</p>' : ""}<div id="admin-data">Loading…</div></div></section>`;
}
async function loadAdmin() {
  if (db && !admin) return;
  try {
    if (adminTab === "products") {
      const ps = db
        ? await checked(db.from("nr_products").select("*").order("sort_order"))
        : products;
      const vs = db
        ? await checked(db.from("nr_variants").select("*").order("weight_g"))
        : variants;
      if (!$("#admin-data")) return;
      $("#admin-data").innerHTML =
        `<div class="stats"><div><strong>${ps.length}</strong><span>Products</span></div><div><strong>${vs.length}</strong><span>Pack sizes</span></div><div><strong>${vs.filter((v) => v.stock < 10).length}</strong><span>Low stock sizes</span></div></div><button class="button dark" data-new-product ${!db ? "disabled" : ""}>Add product +</button><div class="admin-products">${ps
          .map(
            (p) =>
              `<form class="admin-product" data-edit-product="${esc(p.id)}"><img src="${esc(p.image)}" alt="${esc(p.name)}"><div><label class="field">Product name<input name="name" value="${esc(p.name)}" required maxlength="100"></label><label class="field">Image URL<input name="image" value="${esc(p.image)}" required></label><label class="field">Short description<input name="notes" value="${esc(p.notes)}" maxlength="180"></label><label class="field">Description<textarea name="description" maxlength="2000">${esc(p.description)}</textarea></label><label class="check"><input name="active" type="checkbox" ${p.active ? "checked" : ""}> Visible in store</label><div class="variant-head"><span>Pack size</span><span>Price (INR)</span><span>Stock</span></div>${vs
                .filter((v) => v.product_id === p.id)
                .map(
                  (v) =>
                    `<div class="variant-edit"><span>${weight(v.weight_g)}</span><input aria-label="${esc(p.name)} ${weight(v.weight_g)} price" name="price:${esc(v.id)}" type="number" min="1" max="1000000" step=".01" value="${v.price}" required><input aria-label="${esc(p.name)} ${weight(v.weight_g)} stock" name="stock:${esc(v.id)}" type="number" min="0" max="100000" value="${v.stock}" required></div>`,
                )
                .join(
                  "",
                )}<button class="button dark" ${!db ? "disabled" : ""}>Save product</button></div></form>`,
          )
          .join("")}</div>`;
    } else if (adminTab === "orders") {
      const rows = db
        ? await checked(
            db
              .from("nr_orders")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(100),
          )
        : [];
      if ($("#admin-data"))
        $("#admin-data").innerHTML = rows.length
          ? rows
              .map(
                (o) =>
                  `<article class="order"><div><span class="eyebrow">${esc(o.id.slice(0, 8))}</span><h3>${money(o.total)} · ${esc(o.address.name)}</h3><p>${esc(o.address.country)} · ${weight(o.weight_g)} · ${esc(o.payment_status)}</p><p>${o.items.map((i) => `${esc(i.name)} × ${i.qty}`).join(", ")}</p></div><label class="field">Preview status<select data-order-status="${esc(o.id)}"><option value="preview" ${o.status === "preview" ? "selected" : ""}>Preview</option><option value="reviewed" ${o.status === "reviewed" ? "selected" : ""}>Reviewed</option><option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Cancelled</option></select></label></article>`,
              )
              .join("")
          : '<div class="empty"><h2>No orders yet.</h2><p>Customer preview orders appear here when connected. No invented sales or revenue.</p></div>';
    } else {
      const rows = db
        ? await checked(db.from("nr_shipping").select("*"))
        : shipping;
      if ($("#admin-data"))
        $("#admin-data").innerHTML =
          `<p>Free delivery applies strictly above 10,000 g. Rates below are in INR.</p>${rows.map((s) => `<form data-shipping="${esc(s.country)}" class="shipping-row"><strong>${esc(s.name)}</strong><label class="field">Delivery fee<input name="fee" type="number" min="0" max="100000" step=".01" value="${s.fee}" required></label><label class="check"><input name="active" type="checkbox" ${s.active !== false ? "checked" : ""}> Enabled</label><button class="button dark" ${!db ? "disabled" : ""}>Save</button></form>`).join("")}`;
    }
  } catch (e) {
    if ($("#admin-data"))
      $("#admin-data").textContent =
        "Unable to load admin data. Check your connection and administrator access.";
  }
}
function render() {
  const r = route();
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  $("#main").innerHTML =
    r === "/shop"
      ? shop()
      : r === "/box"
        ? shop(true)
        : r === "/checkout"
          ? checkout()
          : r === "/account"
            ? account()
            : r === "/admin"
              ? adminPage()
              : r === "/help"
                ? `<section class="page-heading"><h1>Here to <em>help.</em></h1><p>Your box, delivery and everything in between.</p></section><section class="section">${faq()}<p>Ask us at <a href="https://wa.me/919494608143">+91 94946 08143</a>.</p></section>`
                : r === "/story"
                  ? `<section class="story-page"><span class="eyebrow">WHY NRICART EXISTS</span><h1>Home isn’t always a place.<br>Sometimes, it’s <em>a spoonful.</em></h1><div class="parallax"><img src="/images/table.webp" alt="Indian meal with pickles and rice"></div><p>Maybe it’s rice and pickle after a long day. Or the aroma of cumin hitting a warm pan. NRICart is built around that feeling: the familiar flavours that make a new place feel like your own.</p><p>Choose the things you miss. Put them in a box. Bring a little of home to your everyday table.</p><a class="button dark" href="#/box">Start your box ↗</a></section>`
                  : home();
  document.title = `${r === "/box" ? "Build your box" : r === "/shop" ? "The pantry" : r === "/admin" ? "Admin" : r === "/account" ? "Your account" : "India, wherever you are"} — NRICart`;
  renderCart();
  motion();
  if (r === "/account" && session) loadOrders();
  if (r === "/admin") loadAdmin();
  document.querySelectorAll(".mobile-nav a,header nav a").forEach((a) => {
    if (a.hash === location.hash) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}
function add(id) {
  const v = variants.find((v) => v.id === id);
  if (!v || failed || loading) return;
  const l = cart.find((l) => l.id === id);
  if ((l?.qty || 0) >= Math.min(v.stock, 99))
    return toast("No more of this size is available.");
  if (l) l.qty++;
  else cart.push({ id, qty: 1 });
  persist();
  toast("A little more home, added to your box.");
}
async function action(fn) {
  if (busy) return;
  busy = true;
  try {
    await fn();
  } catch (e) {
    toast(e.message || "Something went wrong. Please try again.");
  } finally {
    busy = false;
  }
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.close) $("#" + b.dataset.close).close();
  if (b.id === "open-cart") $("#cart-dialog").showModal();
  if (b.dataset.product) product(b.dataset.product);
  if (b.dataset.add) add($("#size-" + CSS.escape(b.dataset.add))?.value);
  if (b.dataset.detailAdd) {
    add($("#detail-size").value);
    $("#product-dialog").close();
  }
  if (b.dataset.qty) {
    const l = cart.find((l) => l.id === b.dataset.qty),
      v = variants.find((v) => v.id === b.dataset.qty);
    if (l) {
      l.qty = Math.max(
        0,
        Math.min(v.stock, 99, l.qty + Number(b.dataset.delta)),
      );
      cart = cart.filter((l) => l.qty);
      persist();
      document
        .querySelector(
          `[data-qty="${CSS.escape(b.dataset.qty)}"][data-delta="${b.dataset.delta}"]`,
        )
        ?.focus({ preventScroll: true });
    }
  }
  if (b.dataset.remove) {
    cart = cart.filter((l) => l.id !== b.dataset.remove);
    persist();
  }
  if (b.dataset.filter) {
    category = b.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((el) => {
      el.classList.toggle("active", el === b);
      el.setAttribute("aria-pressed", String(el === b));
    });
    $("#product-grid").innerHTML = filtered();
  }
  if ("clear" in b.dataset) {
    category = "all";
    search = "";
    render();
  }
  if (b.dataset.auth) {
    authMode = b.dataset.auth;
    render();
  }
  if ("signout" in b.dataset)
    action(async () => {
      await checked(db.auth.signOut());
      session = null;
      admin = false;
      render();
    });
  if ("retry" in b.dataset) load();
  if ("reviewBox" in b.dataset)
    $("#builder-summary").scrollIntoView({
      behavior: document.documentElement.classList.contains("motion-off")
        ? "instant"
        : "smooth",
      block: "start",
    });
  if ("saveBox" in b.dataset)
    action(async () => {
      if (!db || !session)
        return toast(
          "Sign in to save your box across devices. Your box is kept on this browser.",
        );
      await checked(
        db.from("nr_boxes").upsert({
          user_id: session.user.id,
          lines: cart,
          updated_at: new Date().toISOString(),
        }),
      );
      toast("Your box has been saved.");
    });
  if ("loadBox" in b.dataset)
    action(async () => {
      const row = await checked(
        db
          .from("nr_boxes")
          .select("lines")
          .eq("user_id", session.user.id)
          .maybeSingle(),
      );
      if (!row) return toast("No saved box yet.");
      cart = cleanCart(row.lines, variants);
      persist();
      location.hash = "/box";
      toast("Saved box restored with current availability.");
    });
  if (b.dataset.adminTab) {
    adminTab = b.dataset.adminTab;
    render();
  }
  if ("newProduct" in b.dataset && admin) {
    $("#admin-data").innerHTML =
      `<form id="new-product"><h2>Add a pantry favourite</h2><label class="field">Product name<input name="name" required maxlength="100"></label><label class="field">Category<select name="category"><option value="pickles">Pickles</option><option value="powders">Powders</option><option value="spices">Whole spices</option></select></label><label class="field">Diet<select name="diet"><option value="vegetarian">Vegetarian</option><option value="non-vegetarian">Non-vegetarian</option></select></label><label class="field">Image URL<input name="image" type="url" required></label><label class="field">250 g price (INR)<input name="price" type="number" min="1" max="1000000" step=".01" required></label><button class="button dark">Create inactive draft</button></form>`;
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "search") {
    search = e.target.value;
    $("#product-grid").innerHTML = filtered();
  }
});
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.id === "sort") {
    sort = el.value;
    $("#product-grid").innerHTML = filtered();
  }
  if ("country" in el.dataset) {
    country = el.value;
    requestId = crypto.randomUUID();
    renderCart();
    document
      .querySelectorAll("[data-country]")
      .forEach((s) => (s.value = country));
  }
  if (el.dataset.orderStatus)
    action(async () => {
      await checked(
        db
          .from("nr_orders")
          .update({ status: el.value })
          .eq("id", el.dataset.orderStatus),
      );
      toast("Preview status updated.");
    });
});
document.addEventListener("submit", async (e) => {
  const form = e.target;
  e.preventDefault();
  const data = new FormData(form);
  if (form.id === "auth-form") {
    const b = form.querySelector("button");
    b.disabled = true;
    try {
      const email = data.get("email"),
        password = data.get("password");
      let result;
      if (authMode === "signup")
        result = await db.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: location.origin + "/#/account" },
        });
      else if (authMode === "reset")
        result = await db.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + "/#/account",
        });
      else if (authMode === "update")
        result = await db.auth.updateUser({ password });
      else result = await db.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (authMode === "signup" || authMode === "reset")
        $("#auth-message").textContent =
          authMode === "signup"
            ? "Check your email to confirm your account."
            : "If this account exists, a reset link is on its way.";
      else {
        authMode = "login";
        recovering = false;
        session = (await db.auth.getSession()).data.session;
        admin = await isAdmin();
        render();
      }
    } catch (err) {
      $("#auth-message").textContent = err.message;
    } finally {
      b.disabled = false;
    }
    return;
  }
  if (form.id === "checkout-form") {
    if (busy) return;
    busy = true;
    const b = form.querySelector('button[type="submit"]');
    b.disabled = true;
    try {
      if (failed || loading || !cart.length)
        throw Error("Your box is not ready.");
      const address = Object.fromEntries(data);
      address.country = country;
      let t = totals(cart, variants, fee());
      let id = "PREVIEW-" + crypto.randomUUID().slice(0, 8);
      if (db) {
        if (!session) throw Error("Please sign in first.");
        id = await placePreview(cart, address, requestId);
        const saved = await checked(
          db.from("nr_orders").select("total,weight_g").eq("id", id).single(),
        );
        t = { ...t, total: saved.total, grams: saved.weight_g };
      }
      $("#main").innerHTML =
        `<section class="receipt"><span class="receipt-check">✓</span><span class="eyebrow">PREVIEW COMPLETE · NOT A PAID ORDER</span><h1>A box full<br>of <em>possibility.</em></h1><p>${db ? "Your preview order is saved in your account." : "Your preview receipt is ready. No personal details were saved."}</p><div class="receipt-details"><span>Reference</span><strong>${esc(id)}</strong><span>Box weight</span><strong>${weight(t.grams)}</strong><span>Preview total</span><strong>${money(t.total)}</strong></div><p>No payment taken. No shipment created.</p><a class="button dark" href="#/box">Back to your box ↗</a></section>`;
      window.scrollTo(0, 0);
    } catch (err) {
      $("#checkout-error").textContent = err.message;
      b.disabled = false;
    } finally {
      busy = false;
    }
    return;
  }
  if (!db || !admin) return;
  if (form.dataset.editProduct)
    action(async () => {
      const id = form.dataset.editProduct,
        image = data.get("image");
      if (!safeImage(image))
        throw Error("Use an HTTPS image URL or local /images path.");
      const changes = [];
      for (const [k, v] of data)
        if (k.startsWith("price:"))
          changes.push({
            id: k.slice(6),
            price: Number(v),
            stock: Number(data.get("stock:" + k.slice(6))),
          });
      await checked(
        db.rpc("nr_save_product", {
          p_id: id,
          p_product: {
            name: data.get("name"),
            image,
            notes: data.get("notes"),
            description: data.get("description"),
            active: data.has("active"),
          },
          p_variants: changes,
        }),
      );
      toast("Product saved.");
      await load(false);
    });
  if (form.dataset.shipping)
    action(async () => {
      await checked(
        db
          .from("nr_shipping")
          .update({ fee: Number(data.get("fee")), active: data.has("active") })
          .eq("country", form.dataset.shipping),
      );
      toast("Delivery settings saved.");
      await load(false);
    });
  if (form.id === "new-product")
    action(async () => {
      await checked(
        db.rpc("nr_create_product", {
          p_name: data.get("name"),
          p_category: data.get("category"),
          p_diet: data.get("diet"),
          p_image: data.get("image"),
          p_price: Number(data.get("price")),
        }),
      );
      toast("Draft created. Add stock and activate it when ready.");
      render();
    });
});
async function load(rerender = true) {
  if (failed) {
    try {
      cart = JSON.parse(localStorage.getItem("nr-box") || "[]");
    } catch {
      cart = [];
    }
  }
  if (!db) {
    render();
    return;
  }
  loading = true;
  failed = false;
  try {
    const [ps, vs, ss] = await catalog();
    if (ps.some((p) => !validProduct(p))) throw Error("Invalid catalog");
    products = ps;
    variants = vs;
    shipping = ss;
    if (!shipping.some((s) => s.country === country))
      country = shipping[0]?.country || "";
    cart = cleanCart(cart, variants);
    session = (await db.auth.getSession()).data.session;
    admin = session ? await isAdmin() : false;
  } catch (e) {
    failed = true;
    products = [];
    variants = [];
    shipping = [];
    cart = [];
  } finally {
    loading = false;
    if (rerender) render();
  }
}
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
  $("#main").focus({ preventScroll: true });
});
setupMotion();
render();
load();
if (db)
  db.auth.onAuthStateChange((event, s) => {
    session = s;
    if (event === "PASSWORD_RECOVERY") {
      authMode = "update";
      recovering = true;
      if (route() !== "/account") location.hash = "/account";
      else render();
    } else if (event === "SIGNED_OUT") {
      admin = false;
      render();
    } else if (event === "SIGNED_IN") {
      setTimeout(async () => {
        try {
          admin = await isAdmin();
        } catch {
          admin = false;
        }
        if (route() === "/account" && !recovering) render();
      }, 0);
    }
  });

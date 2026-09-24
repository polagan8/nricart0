export const demoProducts = [
  [
    "mango",
    "Mango Pickle",
    "pickles",
    249,
    "Tangy, fiery, unmistakably home.",
    "Raw mango in a bold, warming spice blend.",
    "vegetarian",
  ],
  [
    "gongura",
    "Gongura Pickle",
    "pickles",
    279,
    "The signature tang of Andhra.",
    "Sorrel leaves with a deep, savoury chilli warmth.",
    "vegetarian",
  ],
  [
    "chicken",
    "Chicken Pickle",
    "pickles",
    449,
    "Big spice. Rich, savoury comfort.",
    "Andhra-inspired chicken pickle for a flavourful side.",
    "non-vegetarian",
  ],
  [
    "prawn",
    "Prawn Pickle",
    "pickles",
    549,
    "A little taste of the coast.",
    "Prawns in a rich, deeply spiced pickle. Contains shellfish.",
    "non-vegetarian",
  ],
  [
    "turmeric",
    "Turmeric Powder",
    "powders",
    159,
    "Golden colour. Everyday warmth.",
    "Earthy turmeric powder for dals, curries and everyday cooking.",
    "vegetarian",
  ],
  [
    "chilli",
    "Chilli Powder",
    "powders",
    199,
    "A bold red. A beautiful heat.",
    "A warming red chilli powder for your everyday Indian pantry.",
    "vegetarian",
  ],
  [
    "cumin",
    "Whole Cumin",
    "spices",
    189,
    "The beginning of a good tadka.",
    "Aromatic whole cumin seeds for tempering, roasting and grinding.",
    "vegetarian",
  ],
].map(([id, name, category, price, notes, description, diet]) => ({
  id,
  name,
  category,
  price,
  notes,
  description,
  diet,
  image: `/images/${id}.webp`,
  active: true,
  stock: 100,
  weight_g: 250,
}));
export const demoVariants = demoProducts.flatMap((p) =>
  [250, 500, 1000].map((g) => ({
    id: `${p.id}-${g}`,
    product_id: p.id,
    weight_g: g,
    price: Math.round(
      ((p.price * g) / 250) * (g === 1000 ? 0.9 : g === 500 ? 0.95 : 1),
    ),
    stock: 100,
    active: true,
  })),
);
export const demoShipping = [
  { country: "US", name: "United States", fee: 2400 },
  { country: "GB", name: "United Kingdom", fee: 2100 },
  { country: "CA", name: "Canada", fee: 2600 },
  { country: "AU", name: "Australia", fee: 2700 },
  { country: "AE", name: "United Arab Emirates", fee: 1500 },
];
export const money = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(v);
export const weight = (g) =>
  g >= 1000 ? `${Number((g / 1000).toFixed(3))} kg` : `${g} g`;
export const safeImage = (url) =>
  typeof url === "string" && (/^\/(?!\/)/.test(url) || /^https:\/\//.test(url));
export const validProduct = (p) =>
  p &&
  typeof p.id === "string" &&
  typeof p.name === "string" &&
  ["pickles", "powders", "spices"].includes(p.category) &&
  safeImage(p.image);
export function cleanCart(value, variants) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .filter((i) => {
      const v = variants.find((v) => v.id === i.id && v.active);
      if (!v || seen.has(i.id) || !Number.isInteger(i.qty) || i.qty <= 0)
        return false;
      seen.add(i.id);
      return true;
    })
    .map((i) => ({
      id: i.id,
      qty: Math.min(i.qty, 99, variants.find((v) => v.id === i.id).stock),
    }))
    .filter((i) => i.qty > 0);
}
export function totals(cart, variants, fee = 0) {
  let subtotal = 0,
    grams = 0;
  for (const i of cart) {
    const v = variants.find((v) => v.id === i.id);
    if (v) {
      subtotal += Math.round(v.price * 100) * i.qty;
      grams += v.weight_g * i.qty;
    }
  }
  const free = grams > 10000;
  return {
    subtotal: subtotal / 100,
    grams,
    free,
    shipping: free ? 0 : fee,
    total: subtotal / 100 + (free ? 0 : fee),
  };
}
export const cartTotal = (cart, variants) => totals(cart, variants).subtotal;

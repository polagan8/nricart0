export const demoProducts = [
  {
    id: "mango",
    name: "Mango Pickle",
    category: "vegetarian",
    price: 249,
    weight: "250 g",
    image: "/images/mango.webp",
    tag: "THE CLASSIC",
    notes: "Tangy mango. A proper chilli kick.",
    description:
      "The unmistakable tang of raw mango meets a bold, warming spice profile. A familiar companion to rice, dal and everyday meals.",
    heat: "Bold",
    pairing: "Warm rice & ghee",
    active: true,
  },
  {
    id: "gongura",
    name: "Gongura Pickle",
    category: "vegetarian",
    price: 279,
    weight: "250 g",
    image: "/images/gongura.webp",
    tag: "ANDHRA FAVOURITE",
    notes: "Leafy, sharp & full of character.",
    description:
      "A distinctive sour, leafy flavour with the warmth of chilli. For those who like their pickle with a little extra character.",
    heat: "Bold",
    pairing: "Dal rice & dosa",
    active: true,
  },
  {
    id: "chicken",
    name: "Chicken Pickle",
    category: "non-vegetarian",
    price: 449,
    weight: "250 g",
    image: "/images/chicken.webp",
    tag: "THE SAVOURY ONE",
    notes: "Rich spice. A savoury finish.",
    description:
      "A savoury chicken pickle with an intense spice profile. A little on the side brings a different dimension to a simple meal.",
    heat: "Intense",
    pairing: "Steamed rice",
    active: true,
  },
  {
    id: "prawn",
    name: "Prawn Pickle",
    category: "non-vegetarian",
    price: 549,
    weight: "250 g",
    image: "/images/prawn.webp",
    tag: "COASTAL FLAVOURS",
    notes: "Coastal flavour. Lingering warmth.",
    description:
      "Prawn pickle with a rich, savoury character and lingering chilli warmth. A coastal-inspired addition to the table.",
    heat: "Intense",
    pairing: "Rice & dal",
    active: true,
  },
];
export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
export function validProduct(p) {
  return (
    p &&
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    ["vegetarian", "non-vegetarian"].includes(p.category) &&
    Number.isFinite(p.price) &&
    p.price >= 0 &&
    typeof p.image === "string" &&
    safeImage(p.image) &&
    typeof p.weight === "string"
  );
}
export function safeImage(url) {
  try {
    return (
      (url.startsWith("/") && !url.startsWith("//")) ||
      new URL(url).protocol === "https:"
    );
  } catch {
    return false;
  }
}
export function cleanCart(value, products) {
  if (!Array.isArray(value)) return [];
  const ids = new Set(products.map((p) => p.id));
  const result = [];
  for (const item of value) {
    if (
      item &&
      ids.has(item.id) &&
      Number.isInteger(item.qty) &&
      item.qty > 0 &&
      !result.some((p) => p.id === item.id)
    )
      result.push({ id: item.id, qty: Math.min(item.qty, 20) });
  }
  return result;
}
export function cartTotal(cart, products) {
  return cart.reduce(
    (sum, line) =>
      sum + (products.find((p) => p.id === line.id)?.price || 0) * line.qty,
    0,
  );
}

// Sample catalog data for the storefront. Replace with real product/CMS data
// once the commerce layer exists — shape mirrors what a typical products table
// / API response would return.

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  alt: string;
  description: string;
  details: { label: string; value: string }[];
  /** Units on hand. 0 means the piece is sold out. */
  stock: number;
};

export const products: Product[] = [
  {
    id: "wool-coat",
    name: "Structured Wool Coat",
    category: "Outerwear",
    price: 2400,
    image:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1200&auto=format&fit=crop",
    alt: "Model wearing a camel structured wool coat",
    description:
      "Cut from a heavyweight Italian wool, the coat holds a clean architectural line through the shoulder and falls just below the knee. A single-breasted front keeps the silhouette quiet so the cloth does the talking.",
    details: [
      { label: "Composition", value: "100% virgin wool" },
      { label: "Lining", value: "Cupro" },
      { label: "Care", value: "Dry clean only" },
      { label: "Origin", value: "Made in Portugal" },
    ],
    stock: 6,
  },
  {
    id: "bomber-jacket",
    name: "Leather Bomber Jacket",
    category: "Outerwear",
    price: 1450,
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop",
    alt: "Rust leather bomber jacket on a hanger",
    description:
      "Vegetable-tanned lambskin with a lightly burnished finish, cut to a relaxed bomber block. Ribbed trims and a two-way zip keep it easy over knitwear.",
    details: [
      { label: "Composition", value: "100% lambskin leather" },
      { label: "Trim", value: "Wool rib" },
      { label: "Care", value: "Leather specialist clean" },
      { label: "Origin", value: "Made in Italy" },
    ],
    stock: 0,
  },
  {
    id: "fringe-poncho",
    name: "Cream Fringe Poncho",
    category: "Knitwear",
    price: 620,
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1200&auto=format&fit=crop",
    alt: "Cream hand-knit fringe poncho on a hanger",
    description:
      "Hand-knit in a lofty alpaca blend, finished with a hand-tied fringe along the hem. Generous enough to layer over tailoring without adding bulk.",
    details: [
      { label: "Composition", value: "70% alpaca, 30% wool" },
      { label: "Care", value: "Hand wash cold, dry flat" },
      { label: "Origin", value: "Made in Peru" },
    ],
    stock: 2,
  },
  {
    id: "ankle-boots",
    name: "Leather Ankle Boots",
    category: "Footwear",
    price: 980,
    image:
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1200&auto=format&fit=crop",
    alt: "Pair of dark brown leather lace-up ankle boots",
    description:
      "A lace-up ankle boot on a stacked leather heel, built over a rounded last that reads as easily with denim as it does with a suit.",
    details: [
      { label: "Composition", value: "Calf leather" },
      { label: "Sole", value: "Stacked leather" },
      { label: "Care", value: "Condition and polish" },
      { label: "Origin", value: "Made in Spain" },
    ],
    stock: 11,
  },
  {
    id: "leather-tote",
    name: "Structured Leather Tote",
    category: "Accessories",
    price: 1290,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200&auto=format&fit=crop",
    alt: "Rust orange structured leather tote bag",
    description:
      "A softly structured tote in vegetable-tanned leather, unlined so it takes on a patina with use. Fits a laptop and a day's worth of everything else.",
    details: [
      { label: "Composition", value: "Vegetable-tanned leather" },
      { label: "Hardware", value: "Brushed brass" },
      { label: "Care", value: "Wipe with a dry cloth" },
      { label: "Origin", value: "Made in Italy" },
    ],
    stock: 4,
  },
  {
    id: "suede-oxfords",
    name: "Suede Oxford Shoes",
    category: "Footwear",
    price: 860,
    image:
      "https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=1200&auto=format&fit=crop",
    alt: "Teal suede oxford shoe on a styled plinth",
    description:
      "A lean suede oxford on a leather sole, dyed in a deep teal that shifts with the light. Blake-stitched for a close, flexible break-in.",
    details: [
      { label: "Composition", value: "Calf suede" },
      { label: "Sole", value: "Leather, Blake-stitched" },
      { label: "Care", value: "Brush and protect with suede spray" },
      { label: "Origin", value: "Made in England" },
    ],
    stock: 3,
  },
  {
    id: "pendant-necklace",
    name: "Gold Pendant Necklace",
    category: "Accessories",
    price: 340,
    image:
      "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=1200&auto=format&fit=crop",
    alt: "Gold pendant necklace worn over a white shirt",
    description:
      "A single hand-finished pendant on a fine cable chain, weighted to sit flat against the collarbone. Solid gold throughout, so it can be worn daily without re-plating.",
    details: [
      { label: "Composition", value: "18k solid gold" },
      { label: "Chain length", value: "45 cm, adjustable" },
      { label: "Care", value: "Store dry, polish with a soft cloth" },
      { label: "Origin", value: "Made in Italy" },
    ],
    stock: 14,
  },
  {
    id: "silk-blouse",
    name: "Silk Chiffon Blouse",
    category: "Ready-to-Wear",
    price: 780,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop",
    alt: "Model wearing a sheer black silk chiffon blouse",
    description:
      "Featherweight silk chiffon cut on a relaxed shirt block, with a concealed placket and softly gathered cuffs. Sheer by design — layer as intended.",
    details: [
      { label: "Composition", value: "100% silk chiffon" },
      { label: "Care", value: "Dry clean only" },
      { label: "Origin", value: "Made in France" },
    ],
    stock: 1,
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

/**
 * Same-category pieces first, then filled out from the wider catalog so the
 * related rail never looks sparse for a one-of-a-kind category.
 */
export function getRelatedProducts(id: string, limit = 4): Product[] {
  const current = getProductById(id);
  if (!current) return [];

  const others = products.filter((product) => product.id !== id);
  const sameCategory = others.filter(
    (product) => product.category === current.category,
  );
  const rest = others.filter((product) => product.category !== current.category);

  return [...sameCategory, ...rest].slice(0, limit);
}

export type Collection = {
  id: string;
  title: string;
  href: string;
  image: string;
  alt: string;
};

export const collections: Collection[] = [
  {
    id: "women",
    title: "Women",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop",
    alt: "Woman in a burgundy wool coat carrying shopping bags",
  },
  {
    id: "men",
    title: "Men",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1000&auto=format&fit=crop",
    alt: "Man in a tan leather jacket and sunglasses",
  },
  {
    id: "accessories",
    title: "Accessories",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=1000&auto=format&fit=crop",
    alt: "Gold pendant necklace detail",
  },
];

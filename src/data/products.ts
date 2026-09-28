// Sample catalog data for the storefront homepage. Replace with real
// product/CMS data once the commerce layer exists — shape mirrors what a
// typical products table / API response would return.

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  alt: string;
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
  },
  {
    id: "bomber-jacket",
    name: "Leather Bomber Jacket",
    category: "Outerwear",
    price: 1450,
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop",
    alt: "Rust leather bomber jacket on a hanger",
  },
  {
    id: "fringe-poncho",
    name: "Cream Fringe Poncho",
    category: "Knitwear",
    price: 620,
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1200&auto=format&fit=crop",
    alt: "Cream hand-knit fringe poncho on a hanger",
  },
  {
    id: "ankle-boots",
    name: "Leather Ankle Boots",
    category: "Footwear",
    price: 980,
    image:
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1200&auto=format&fit=crop",
    alt: "Pair of dark brown leather lace-up ankle boots",
  },
  {
    id: "leather-tote",
    name: "Structured Leather Tote",
    category: "Accessories",
    price: 1290,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200&auto=format&fit=crop",
    alt: "Rust orange structured leather tote bag",
  },
  {
    id: "suede-oxfords",
    name: "Suede Oxford Shoes",
    category: "Footwear",
    price: 860,
    image:
      "https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=1200&auto=format&fit=crop",
    alt: "Teal suede oxford shoe on a styled plinth",
  },
  {
    id: "pendant-necklace",
    name: "Gold Pendant Necklace",
    category: "Accessories",
    price: 340,
    image:
      "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=1200&auto=format&fit=crop",
    alt: "Gold pendant necklace worn over a white shirt",
  },
  {
    id: "silk-blouse",
    name: "Silk Chiffon Blouse",
    category: "Ready-to-Wear",
    price: 780,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop",
    alt: "Model wearing a sheer black silk chiffon blouse",
  },
];

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

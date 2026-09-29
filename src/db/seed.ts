// Seeds the catalog with the sample data the storefront shipped with. Idempotent:
// re-running upserts every row, so it doubles as "reset to a known catalog" after
// experimenting in Drizzle Studio.
//
//   npm run db:seed
//
// Runs through tsx (see package.json) rather than plain `node`: Node's native
// type stripping requires explicit extensions on relative imports, which the
// extensionless `export * from './users'` barrel in ./schema/index.ts does not have.

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db, getClient } from './connection';
import { categories, products, type ProductDetail } from './schema';

const categoryRows = [
  { id: 'outerwear', name: 'Outerwear', sortOrder: 0 },
  { id: 'knitwear', name: 'Knitwear', sortOrder: 1 },
  { id: 'footwear', name: 'Footwear', sortOrder: 2 },
  { id: 'accessories', name: 'Accessories', sortOrder: 3 },
  { id: 'ready-to-wear', name: 'Ready-to-Wear', sortOrder: 4 },
];

type ProductRow = {
  id: string;
  name: string;
  categoryId: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
  imageAlt: string;
  description: string;
  details: ProductDetail[];
  sortOrder: number;
};

// sortOrder 0-3 is the New Arrivals rail, 4-7 the Best Sellers rail — the same
// split the homepage used to get from `products.slice(0, 4)` / `slice(4, 8)`.
const productRows: ProductRow[] = [
  {
    id: 'wool-coat',
    name: 'Structured Wool Coat',
    categoryId: 'outerwear',
    priceCents: 240000,
    stock: 6,
    imageUrl:
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Model wearing a camel structured wool coat',
    description:
      'Cut from a heavyweight Italian wool, the coat holds a clean architectural line through the shoulder and falls just below the knee. A single-breasted front keeps the silhouette quiet so the cloth does the talking.',
    details: [
      { label: 'Composition', value: '100% virgin wool' },
      { label: 'Lining', value: 'Cupro' },
      { label: 'Care', value: 'Dry clean only' },
      { label: 'Origin', value: 'Made in Portugal' },
    ],
    sortOrder: 0,
  },
  {
    id: 'bomber-jacket',
    name: 'Leather Bomber Jacket',
    categoryId: 'outerwear',
    priceCents: 145000,
    stock: 0,
    imageUrl:
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Rust leather bomber jacket on a hanger',
    description:
      'Vegetable-tanned lambskin with a lightly burnished finish, cut to a relaxed bomber block. Ribbed trims and a two-way zip keep it easy over knitwear.',
    details: [
      { label: 'Composition', value: '100% lambskin leather' },
      { label: 'Trim', value: 'Wool rib' },
      { label: 'Care', value: 'Leather specialist clean' },
      { label: 'Origin', value: 'Made in Italy' },
    ],
    sortOrder: 1,
  },
  {
    id: 'fringe-poncho',
    name: 'Cream Fringe Poncho',
    categoryId: 'knitwear',
    priceCents: 62000,
    stock: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Cream hand-knit fringe poncho on a hanger',
    description:
      'Hand-knit in a lofty alpaca blend, finished with a hand-tied fringe along the hem. Generous enough to layer over tailoring without adding bulk.',
    details: [
      { label: 'Composition', value: '70% alpaca, 30% wool' },
      { label: 'Care', value: 'Hand wash cold, dry flat' },
      { label: 'Origin', value: 'Made in Peru' },
    ],
    sortOrder: 2,
  },
  {
    id: 'ankle-boots',
    name: 'Leather Ankle Boots',
    categoryId: 'footwear',
    priceCents: 98000,
    stock: 11,
    imageUrl:
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Pair of dark brown leather lace-up ankle boots',
    description:
      'A lace-up ankle boot on a stacked leather heel, built over a rounded last that reads as easily with denim as it does with a suit.',
    details: [
      { label: 'Composition', value: 'Calf leather' },
      { label: 'Sole', value: 'Stacked leather' },
      { label: 'Care', value: 'Condition and polish' },
      { label: 'Origin', value: 'Made in Spain' },
    ],
    sortOrder: 3,
  },
  {
    id: 'leather-tote',
    name: 'Structured Leather Tote',
    categoryId: 'accessories',
    priceCents: 129000,
    stock: 4,
    imageUrl:
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Rust orange structured leather tote bag',
    description:
      "A softly structured tote in vegetable-tanned leather, unlined so it takes on a patina with use. Fits a laptop and a day's worth of everything else.",
    details: [
      { label: 'Composition', value: 'Vegetable-tanned leather' },
      { label: 'Hardware', value: 'Brushed brass' },
      { label: 'Care', value: 'Wipe with a dry cloth' },
      { label: 'Origin', value: 'Made in Italy' },
    ],
    sortOrder: 4,
  },
  {
    id: 'suede-oxfords',
    name: 'Suede Oxford Shoes',
    categoryId: 'footwear',
    priceCents: 86000,
    stock: 3,
    imageUrl:
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Teal suede oxford shoe on a styled plinth',
    description:
      'A lean suede oxford on a leather sole, dyed in a deep teal that shifts with the light. Blake-stitched for a close, flexible break-in.',
    details: [
      { label: 'Composition', value: 'Calf suede' },
      { label: 'Sole', value: 'Leather, Blake-stitched' },
      { label: 'Care', value: 'Brush and protect with suede spray' },
      { label: 'Origin', value: 'Made in England' },
    ],
    sortOrder: 5,
  },
  {
    id: 'pendant-necklace',
    name: 'Gold Pendant Necklace',
    categoryId: 'accessories',
    priceCents: 34000,
    stock: 14,
    imageUrl:
      'https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Gold pendant necklace worn over a white shirt',
    description:
      'A single hand-finished pendant on a fine cable chain, weighted to sit flat against the collarbone. Solid gold throughout, so it can be worn daily without re-plating.',
    details: [
      { label: 'Composition', value: '18k solid gold' },
      { label: 'Chain length', value: '45 cm, adjustable' },
      { label: 'Care', value: 'Store dry, polish with a soft cloth' },
      { label: 'Origin', value: 'Made in Italy' },
    ],
    sortOrder: 6,
  },
  {
    id: 'silk-blouse',
    name: 'Silk Chiffon Blouse',
    categoryId: 'ready-to-wear',
    priceCents: 78000,
    stock: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Model wearing a sheer black silk chiffon blouse',
    description:
      'Featherweight silk chiffon cut on a relaxed shirt block, with a concealed placket and softly gathered cuffs. Sheer by design — layer as intended.',
    details: [
      { label: 'Composition', value: '100% silk chiffon' },
      { label: 'Care', value: 'Dry clean only' },
      { label: 'Origin', value: 'Made in France' },
    ],
    sortOrder: 7,
  },
];

async function seed() {
  // Categories first — products reference them.
  await db
    .insert(categories)
    .values(categoryRows)
    .onConflictDoUpdate({
      target: categories.id,
      set: {
        name: sql`excluded.name`,
        sortOrder: sql`excluded.sort_order`,
      },
    });

  await db
    .insert(products)
    .values(productRows)
    .onConflictDoUpdate({
      target: products.id,
      set: {
        name: sql`excluded.name`,
        categoryId: sql`excluded.category_id`,
        priceCents: sql`excluded.price_cents`,
        stock: sql`excluded.stock`,
        imageUrl: sql`excluded.image_url`,
        imageAlt: sql`excluded.image_alt`,
        description: sql`excluded.description`,
        details: sql`excluded.details`,
        sortOrder: sql`excluded.sort_order`,
        updatedAt: sql`now()`,
      },
    });

  console.log(
    `Seeded ${categoryRows.length} categories and ${productRows.length} products.`,
  );
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  // Without this the postgres-js pool keeps the process alive.
  .finally(() => getClient().end());

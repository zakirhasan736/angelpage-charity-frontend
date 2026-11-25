/**
 * Keyword map by topic. One source for titles, descriptions, meta keywords,
 * llms.txt and category landing copy.
 *
 * The US is the first market, so US search terms ("thrift", "secondhand",
 * "donate") lead; UK/Canada terms ("charity shop", "pre-loved") follow so
 * the same page ranks in all three markets. Google ignores the keywords
 * meta tag for ranking, but Bing and AI crawlers still read it, and the
 * same phrases drive the visible copy, which is what ranks.
 */
import { categoriesData } from '@/libs/categoriesData';

export const BRAND_KEYWORDS = ['Angelpage', 'Angelpage charity marketplace', 'angelpage.shop'];

/** Head terms the whole site competes for. */
export const CORE_KEYWORDS = [
  'charity marketplace',
  'online charity shop',
  'shop for charity',
  'sell for charity',
  'donate items to charity',
  'secondhand clothes online',
  'pre-loved clothes',
  'online thrift store',
  'sustainable shopping',
  'second hand designer',
];

export const TOPIC_KEYWORDS = {
  home: [...CORE_KEYWORDS, 'buy secondhand support charity', 'charity shop USA', 'charity shop UK', 'charity shop Canada'],
  shop: ['shop pre-loved', 'secondhand marketplace', 'thrift online', 'charity shop online', 'pre-loved fashion', 'used homeware', 'refurbished electronics'],
  sell: ['sell clothes for charity', 'sell items to support charity', 'declutter for charity', 'donate and sell online', 'charity selling platform'],
  charities: ['find a charity', 'verified charities', 'charity storefront', 'support local charity', 'charity shop near me', 'online fundraising for charities'],
  events: ['charity appeal', 'charity fundraiser online', 'donate to charity appeal', 'community vote charity', 'charity live stream', 'charity events'],
  blog: ['charity shopping tips', 'how to declutter', 'sustainable fashion guide', 'charity news', 'selling online for charity shops'],
  howItWorks: ['how charity marketplace works', 'choose charity split', 'where your money goes charity', 'buyer protection charity shop'],
  about: ['about Angelpage', 'charity marketplace mission', 'social enterprise marketplace'],
  faq: ['Angelpage FAQ', 'charity marketplace questions', 'how donations work'],
  reels: ['charity impact stories', 'charity videos', 'impact reels'],
} as const;

/** Extra search phrasing per category (what people actually type). */
const CATEGORY_TERMS: Record<string, { adjective: string; extra: string[] }> = {
  women: { adjective: "women's", extra: ["secondhand women's clothing", "women's thrift clothes", "pre-loved womenswear"] },
  men: { adjective: "men's", extra: ["secondhand men's clothing", "men's thrift clothes", 'pre-loved menswear'] },
  children: { adjective: "children's", extra: ['secondhand kids clothes', "pre-loved children's clothing", 'kids thrift'] },
  clothing: { adjective: '', extra: ['secondhand clothing', 'thrift clothing online', 'pre-loved clothes'] },
  shoes: { adjective: '', extra: ['secondhand shoes', 'pre-loved trainers', 'used designer shoes'] },
  bags: { adjective: '', extra: ['pre-loved handbags', 'secondhand designer bags', 'used luggage'] },
  accessories: { adjective: '', extra: ['secondhand accessories', 'pre-loved sunglasses', 'vintage scarves'] },
  jewellery: { adjective: '', extra: ['pre-loved jewelry', 'secondhand jewellery', 'vintage watches'] },
  homeware: { adjective: '', extra: ['secondhand homeware', 'used furniture', 'pre-loved home decor'] },
  books: { adjective: '', extra: ['secondhand books', 'used books online', 'charity shop books'] },
  electronics: { adjective: '', extra: ['refurbished electronics', 'secondhand phones', 'used laptops'] },
};

/** How people name the top-level categories in search. */
const CATEGORY_TITLES: Record<string, string> = {
  women: "Women's Clothing",
  men: "Men's Clothing",
  children: "Kids' Clothing",
  clothing: 'Clothing',
  shoes: 'Shoes and Trainers',
  bags: 'Bags and Handbags',
  accessories: 'Accessories',
  jewellery: 'Jewelry and Watches',
  homeware: 'Homeware and Furniture',
  books: 'Books',
  electronics: 'Electronics and Phones',
};

export type CategoryInfo = { id: string; name: string; subCategories: { id: string; name: string }[] };

export function findCategory(id?: string): CategoryInfo | undefined {
  return categoriesData.categories.find(c => c.id === id) as CategoryInfo | undefined;
}

export function findSubcategory(categoryId?: string, subId?: string) {
  return findCategory(categoryId)?.subCategories.find(s => s.id === subId);
}

/** "women's dresses", "boots", "homeware". */
function subject(categoryId: string, subName?: string) {
  const cat = findCategory(categoryId);
  const adj = CATEGORY_TERMS[categoryId]?.adjective;
  const base = subName || cat?.name || categoryId;
  return `${adj && subName ? `${adj} ` : ''}${base}`.toLowerCase();
}

export function categoryKeywords(categoryId: string, subId?: string): string[] {
  const cat = findCategory(categoryId);
  const sub = findSubcategory(categoryId, subId);
  const s = subject(categoryId, sub?.name);
  const list = [
    `pre-loved ${s}`,
    `secondhand ${s}`,
    `second hand ${s}`,
    `thrift ${s}`,
    `${s} charity shop`,
    `buy ${s} for charity`,
    ...(sub ? [] : CATEGORY_TERMS[categoryId]?.extra || []),
    cat?.name || categoryId,
    ...BRAND_KEYWORDS.slice(0, 1),
  ];
  return [...new Set(list)];
}

/** Title (≤ 60 chars before the brand suffix) and description (≤ 155). */
export function categoryCopy(categoryId: string, subId?: string) {
  const cat = findCategory(categoryId);
  const sub = findSubcategory(categoryId, subId);
  const s = subject(categoryId, sub?.name);
  const Subject = s.replace(/(^|\s)\S/g, m => m.toUpperCase()).replace(/'S\b/g, "'s");
  const catTitle = CATEGORY_TITLES[categoryId] || cat?.name || Subject;
  const title = sub ? `Pre-loved ${Subject}` : `Pre-loved ${catTitle}`;
  const h1 = sub ? `Pre-loved ${s}` : `Pre-loved ${catTitle.toLowerCase()}`;
  const description = sub
    ? `Shop secondhand ${s} on Angelpage. Every piece funds a verified charity, and you see the split before you buy. USA, Canada and UK.`
    : `Thrift pre-loved ${catTitle.toLowerCase()} on Angelpage, the charity marketplace. Up to 90% of every sale goes to a verified charity. USA, Canada and UK.`;
  const intro = sub
    ? `Every item here is listed by a person or a charity shop, and most of the price goes to the charity they picked. You see the split on every listing.`
    : `Browse ${catTitle.toLowerCase()} from sellers and charity shops. Pick a section below, or scroll the latest listings. Each purchase funds a verified charity.`;
  return { title, h1, description, intro };
}

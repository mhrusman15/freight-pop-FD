const TASK_DAILY_LIMIT = 30;

/** Bump when TASK_IMAGE_POOL or sequencing rules change — invalidates persisted `image_cycle_state`. */
export const IMAGE_CYCLE_VERSION = 4;

const TASK_CATALOG = [
  { title: "Premium Order", image: "/assets/tasks/Girl-bag.jpg", min: 55000, max: 65000, commissionMin: 1800, commissionMax: 2600 },
  { title: "Vault Collection", image: "/assets/tasks/Man-Watch.jpg", min: 42000, max: 58000, commissionMin: 1200, commissionMax: 1900 },
  { title: "Elite Selection", image: "/assets/tasks/Man-Shoes.jpg", min: 20000, max: 35000, commissionMin: 700, commissionMax: 1200 },
];

const TASK_IMAGE_POOL = [
  "/assets/tasks/Man-Shoes.jpg",
  "/assets/tasks/Woman-shoes.jpg",
  "/assets/tasks/heals.jpg",
  "/assets/tasks/Shoes-men.jpg",
  "/assets/tasks/Men-Jacket.jpg",
  "/assets/tasks/Man-Watch.jpg",
  "/assets/tasks/Woman-watch.jpg",
  "/assets/tasks/Health-watch.jpg",
  "/assets/tasks/Smart Watch.jpg",
  "/assets/tasks/Clock.jpg",
  "/assets/tasks/Sony-headphone.jpg",
  "/assets/tasks/Girl-bag.jpg",
  "/assets/tasks/laptop-bag.jpg",
  "/assets/tasks/Girl-Stoler.jpg",
  "/assets/tasks/Laptop.jpg",
  "/assets/tasks/ipad.jpg",
  "/assets/tasks/USB-128Gb.jpg",
  "/assets/tasks/speaker.jpg",
  "/assets/tasks/glasses.jpg",
  "/assets/tasks/Bike-Helmet.jpg",
  "/assets/tasks/Canon-Camera.jpg",
  "/assets/tasks/Makeup-kit.jpg",
  "/assets/tasks/Toy.jpg",
  "/assets/tasks/Toy-gun.jpg",
  "/assets/tasks/Tree-light.jpg",
  "/assets/tasks/purfume.jpg",
  "/assets/tasks/charger.jpg",
  "/assets/tasks/earring.jpg",
  "/assets/tasks/study-table.jpg",
  "/assets/tasks/toolbox.jpg",
  "/assets/tasks/voltmeter.jpg",
  "/assets/tasks/water-bottle.jpg",
];

/** Women’s dresses, luxury perfumes, luxury men’s watches, luxury women’s bags — not in random daily rotation. */
const LUXURY_EXCLUSIVE_IMAGE_PATHS = [
  "/assets/tasks/Serenity Silk Gown.jpg",
  "/assets/tasks/Elysian Evening Dress.jpg",
  "/assets/tasks/Radiant Luxe Sundress.jpg",
  "/assets/tasks/Opal Grace Ball Dress.jpg",
  "/assets/tasks/Celestia Satin Frock.jpg",
  "/assets/tasks/Eternal Noir Essence.jpg",
  "/assets/tasks/Velvet Opulence Scent.jpg",
  "/assets/tasks/Midnight Amber Luxe.jpg",
  "/assets/tasks/Royal Oud Signature.jpg",
  "/assets/tasks/Celestial Bloom Elixir.jpg",
  "/assets/tasks/Regal Chronos Elite.jpg",
  "/assets/tasks/Titanium Marquis.jpg",
  "/assets/tasks/Imperium Grandmaster.jpg",
  "/assets/tasks/Noble Conqueror.jpg",
  "/assets/tasks/Heritage Sovereign.jpg",
  "/assets/tasks/Aurora Elegance Tote.jpg",
  "/assets/tasks/Celeste Leather Clutch.jpg",
  "/assets/tasks/Opulence Satchel.jpg",
  "/assets/tasks/Seraphina Handbag.jpg",
  "/assets/tasks/Luxe Horizon Shoulder Bag.jpg",
];

const LUXURY_EXCLUSIVE_FILE_SET = new Set(
  LUXURY_EXCLUSIVE_IMAGE_PATHS.map((p) => String(p).split("/").pop() || ""),
);

/** Prime-only catalog (never in normal random box). */
const PRIME_EXCLUSIVE_IMAGE_PATHS = [
  "/assets/tasks/prime-Shoes-combo.jpg",
  "/assets/tasks/prime-Samsung-LED.jpg",
  "/assets/tasks/prime-watch-gold.jpg",
  "/assets/tasks/Prime-Yamaha-Piano.jpg",
  "/assets/tasks/prime-iphone-17 pro.jpg",
  "/assets/tasks/prime-iphone 17 pro max.jpg",
  "/assets/tasks/Prime-Piano.jpg",
  "/assets/tasks/Prime-luxury watch box.jpg",
];

const PRIME_EXCLUSIVE_FILE_SET = new Set(
  PRIME_EXCLUSIVE_IMAGE_PATHS.map((p) => String(p).split("/").pop() || ""),
);

/** Prime grab order + luxury catalog (deterministic prime tasks + high-balance normal). */
const PRIME_GRAB_IMAGE_POOL = [...PRIME_EXCLUSIVE_IMAGE_PATHS, ...LUXURY_EXCLUSIVE_IMAGE_PATHS];

const PRIME_PRODUCT_FALLBACK_IMAGE = "/assets/tasks/prime-Shoes-combo.jpg";
export const PRIME_PRODUCT_OPTIONS = [
  { key: "prime-shoes-combo", title: "Prime Shoes Combo", min: 250000, max: 400000, image: "/assets/tasks/prime-Shoes-combo.jpg" },
  { key: "prime-samsung-led", title: "Prime Samsung LED", min: 200000, max: 350000, image: "/assets/tasks/prime-Samsung-LED.jpg" },
  { key: "prime-watch-gold", title: "Prime Watch Gold", min: 250000, max: 500000, image: "/assets/tasks/prime-watch-gold.jpg" },
  { key: "prime-yamaha-piano", title: "Prime Yamaha Piano", min: 200000, max: 300000, image: "/assets/tasks/Prime-Yamaha-Piano.jpg" },
  { key: "prime-piano", title: "Prime Piano", min: 200000, max: 350000, image: "/assets/tasks/Prime-Piano.jpg" },
  { key: "prime-iphone-17-pro", title: "Prime iPhone 17 Pro", min: 250000, max: 280000, image: "/assets/tasks/prime-iphone-17 pro.jpg" },
  { key: "prime-iphone-17-pro-max", title: "Prime iPhone 17 Pro Max", min: 300000, max: 350000, image: "/assets/tasks/prime-iphone 17 pro max.jpg" },
  { key: "prime-luxury-watch-box", title: "Prime Luxury Watch Box", min: 80000, max: 90000, image: "/assets/tasks/Prime-luxury watch box.jpg" },
  { key: "prime-ferrari-car-model-diecast", title: "Prime Ferrari Car Model (Diecast)", min: 500000, max: 700000, image: PRIME_PRODUCT_FALLBACK_IMAGE },
  { key: "prime-designer-sofa-set", title: "Prime Designer Sofa Set", min: 1200000, max: 1500000, image: PRIME_PRODUCT_FALLBACK_IMAGE },
  { key: "prime-home-theater-system", title: "Prime Home Theater System", min: 800000, max: 1200000, image: PRIME_PRODUCT_FALLBACK_IMAGE },
  { key: "prime-diamond-necklace", title: "Prime Diamond Necklace", min: 1000000, max: 3000000, image: PRIME_PRODUCT_FALLBACK_IMAGE },
  { key: "prime-sports-bike-yamaha-ninja", title: "Prime Sports Bike (Yamaha/Ninja)", min: 2000000, max: 3500000, image: PRIME_PRODUCT_FALLBACK_IMAGE },
];

const PRIME_PRODUCT_OPTIONS_BY_KEY = new Map(PRIME_PRODUCT_OPTIONS.map((p) => [p.key, p]));

/** Minimum wallet balance (PKR) to allow luxury catalog in normal (non-prime) tasks. */
const LUXURY_MIN_BALANCE_FOR_NORMAL_PKR = 25000;

/** Chance (1–100) to show a luxury item when balance qualifies (normal tasks only). */
const LUXURY_NORMAL_ROLL_PCT = 30;

const SMALL_PRODUCT_BALANCE_MAX = 1500;
const SMALL_PRODUCT_FILES = new Set([
  "charger.jpg",
  "Tree-light.jpg",
  "water-bottle.jpg",
  "USB-128Gb.jpg",
  "Girl-Stoler.jpg",
  "Toy.jpg",
  "Toy-gun.jpg",
]);

/** Product-specific Rs ranges (exact list from business). */
const PRODUCT_PRICE_RANGES = {
  "Man-Shoes.jpg": { min: 6000, max: 12000 },
  "Woman-shoes.jpg": { min: 5000, max: 10000 },
  "heals.jpg": { min: 4500, max: 9000 },
  "Shoes-men.jpg": { min: 7000, max: 15000 },
  "Men-Jacket.jpg": { min: 8000, max: 18000 },
  "Man-Watch.jpg": { min: 12000, max: 35000 },
  "Woman-watch.jpg": { min: 10000, max: 28000 },
  "Health-watch.jpg": { min: 6000, max: 15000 },
  "Smart Watch.jpg": { min: 9000, max: 20000 },
  "Clock.jpg": { min: 4000, max: 12000 },
  "Sony-headphone.jpg": { min: 6000, max: 18000 },
  "speaker.jpg": { min: 5000, max: 16000 },
  "charger.jpg": { min: 1500, max: 4000 },
  "Girl-bag.jpg": { min: 7000, max: 20000 },
  "laptop-bag.jpg": { min: 2500, max: 6000 },
  "Girl-Stoler.jpg": { min: 2000, max: 5000 },
  "Laptop.jpg": { min: 120000, max: 220000 },
  "ipad.jpg": { min: 80000, max: 180000 },
  "USB-128Gb.jpg": { min: 2000, max: 5000 },
  "glasses.jpg": { min: 3000, max: 10000 },
  "earring.jpg": { min: 2500, max: 12000 },
  "Bike-Helmet.jpg": { min: 4000, max: 12000 },
  "Canon-Camera.jpg": { min: 90000, max: 250000 },
  "Makeup-kit.jpg": { min: 3000, max: 9000 },
  "purfume.jpg": { min: 3500, max: 12000 },
  "Toy.jpg": { min: 2000, max: 6000 },
  "Toy-gun.jpg": { min: 2500, max: 7000 },
  "Tree-light.jpg": { min: 1500, max: 4500 },
  "study-table.jpg": { min: 15000, max: 40000 },
  "toolbox.jpg": { min: 6000, max: 20000 },
  "voltmeter.jpg": { min: 4000, max: 15000 },
  "water-bottle.jpg": { min: 1500, max: 5000 },
  "Serenity Silk Gown.jpg": { min: 25000, max: 35000 },
  "Elysian Evening Dress.jpg": { min: 30000, max: 45000 },
  "Radiant Luxe Sundress.jpg": { min: 20000, max: 32000 },
  "Opal Grace Ball Dress.jpg": { min: 35000, max: 50000 },
  "Celestia Satin Frock.jpg": { min: 28000, max: 40000 },
  "Eternal Noir Essence.jpg": { min: 40000, max: 60000 },
  "Velvet Opulence Scent.jpg": { min: 35000, max: 55000 },
  "Midnight Amber Luxe.jpg": { min: 45000, max: 65000 },
  "Royal Oud Signature.jpg": { min: 50000, max: 75000 },
  "Celestial Bloom Elixir.jpg": { min: 55000, max: 80000 },
  "Regal Chronos Elite.jpg": { min: 120000, max: 200000 },
  "Titanium Marquis.jpg": { min: 130000, max: 220000 },
  "Imperium Grandmaster.jpg": { min: 150000, max: 250000 },
  "Noble Conqueror.jpg": { min: 110000, max: 210000 },
  "Heritage Sovereign.jpg": { min: 140000, max: 280000 },
  "Aurora Elegance Tote.jpg": { min: 70000, max: 120000 },
  "Celeste Leather Clutch.jpg": { min: 65000, max: 110000 },
  "Opulence Satchel.jpg": { min: 75000, max: 130000 },
  "Seraphina Handbag.jpg": { min: 80000, max: 140000 },
  "Luxe Horizon Shoulder Bag.jpg": { min: 85000, max: 150000 },
  "prime-Shoes-combo.jpg": { min: 250000, max: 400000 },
  "prime-Samsung-LED.jpg": { min: 200000, max: 350000 },
  "prime-watch-gold.jpg": { min: 250000, max: 500000 },
  "Prime-Yamaha-Piano.jpg": { min: 200000, max: 300000 },
  "Prime-Piano.jpg": { min: 200000, max: 350000 },
  "prime-iphone-17 pro.jpg": { min: 250000, max: 280000 },
  "prime-iphone 17 pro max.jpg": { min: 300000, max: 350000 },
  "Prime-luxury watch box.jpg": { min: 80000, max: 90000 },
};

/** Realistic Rs ranges by product category (filename/title hints). Commission = task_price × (bps/10000), clamped. */
const DEFAULT_BAND = {
  min: 1000,
  max: 15000,
  commissionMin: 40,
  commissionMax: 65,
  commissionPctMinBps: 80,
  commissionPctMaxBps: 200,
};

function commissionBandFromPriceRange(min, max) {
  const lo = Math.max(10, Math.round(Number(min || 0) * 0.003));
  const hiRaw = Math.max(lo, Math.round(Number(max || 0) * 0.012));
  const hi = Math.min(3000, hiRaw);
  return { commissionMin: lo, commissionMax: hi, commissionPctMinBps: 80, commissionPctMaxBps: 200 };
}

function priceBandForImagePath(imagePath) {
  const f = String(imagePath || "").toLowerCase();
  const file = String(imagePath || "").split("/").pop() || "";
  if (PRODUCT_PRICE_RANGES[file]) {
    const { min, max } = PRODUCT_PRICE_RANGES[file];
    return { min, max, ...commissionBandFromPriceRange(min, max) };
  }
  if (f.includes("usb"))
    return { min: 500, max: 3000, commissionMin: 25, commissionMax: 55, commissionPctMinBps: 80, commissionPctMaxBps: 180 };
  if (
    f.includes("shoe") ||
    f.includes("heal") ||
    f.includes("jacket") ||
    f.includes("helmet") ||
    f.includes("bag") ||
    f.includes("stoler")
  ) {
    return { min: 2000, max: 10000, commissionMin: 35, commissionMax: 70, commissionPctMinBps: 70, commissionPctMaxBps: 160 };
  }
  if (
    f.includes("laptop") ||
    f.includes("ipad") ||
    f.includes("camera") ||
    f.includes("speaker") ||
    f.includes("headphone") ||
    f.includes("watch") ||
    f.includes("voltmeter") ||
    f.includes("charger") ||
    f.includes("smart")
  ) {
    return { min: 5000, max: 50000, commissionMin: 50, commissionMax: 90, commissionPctMinBps: 60, commissionPctMaxBps: 140 };
  }
  return DEFAULT_BAND;
}

const FICTIONAL_PRODUCT_NAMES = {
  "Man-Shoes.jpg": "Classic Oxford Pair",
  "Woman-shoes.jpg": "Elegance Heel Set",
  "heals.jpg": "Stiletto Charm",
  "Shoes-men.jpg": "Urban Runner Elite",
  "Men-Jacket.jpg": "Alpine Windbreaker",
  "Man-Watch.jpg": "Chrono Elite Watch",
  "Woman-watch.jpg": "Luna Timepiece",
  "Health-watch.jpg": "VitaBand Pro",
  "Smart Watch.jpg": "Nexus Wristlet",
  "Clock.jpg": "Meridian Desk Clock",
  "Sony-headphone.jpg": "Aura Headphones",
  "Girl-bag.jpg": "Prism Leather Tote",
  "laptop-bag.jpg": "Nova Laptop Sleeve",
  "Girl-Stoler.jpg": "Silk Whisper Scarf",
  "Laptop.jpg": "Zenith Notebook Pro",
  "ipad.jpg": "Slate Digital Tablet",
  "USB-128Gb.jpg": "DataVault 128 Drive",
  "speaker.jpg": "Echo Chamber Speaker",
  "glasses.jpg": "Crystal Vision Frames",
  "Bike-Helmet.jpg": "Guardian Helm",
  "Canon-Camera.jpg": "Aperture Lens Pro",
  "Makeup-kit.jpg": "Glow Palette Kit",
  "Toy.jpg": "JoyBlock Classic",
  "Toy-gun.jpg": "Foam Blaster Toy",
  "Tree-light.jpg": "Starlight String Set",
  "purfume.jpg": "Aroma Essence Bottle",
  "charger.jpg": "VoltRush Adapter",
  "earring.jpg": "Sparkle Drop Pair",
  "study-table.jpg": "Scholar Desk",
  "toolbox.jpg": "CraftMaster Toolkit",
  "voltmeter.jpg": "PrecisionMeter Pro",
  "water-bottle.jpg": "AquaPure Flask",
  "Serenity Silk Gown.jpg": "Serenity Silk Gown",
  "Elysian Evening Dress.jpg": "Elysian Evening Dress",
  "Radiant Luxe Sundress.jpg": "Radiant Luxe Sundress",
  "Opal Grace Ball Dress.jpg": "Opal Grace Ball Dress",
  "Celestia Satin Frock.jpg": "Celestia Satin Frock",
  "Eternal Noir Essence.jpg": "Eternal Noir Essence",
  "Velvet Opulence Scent.jpg": "Velvet Opulence Scent",
  "Midnight Amber Luxe.jpg": "Midnight Amber Luxe",
  "Royal Oud Signature.jpg": "Royal Oud Signature",
  "Celestial Bloom Elixir.jpg": "Celestial Bloom Elixir",
  "Regal Chronos Elite.jpg": "Regal Chronos Elite",
  "Titanium Marquis.jpg": "Titanium Marquis",
  "Imperium Grandmaster.jpg": "Imperium Grandmaster",
  "Noble Conqueror.jpg": "Noble Conqueror",
  "Heritage Sovereign.jpg": "Heritage Sovereign",
  "Aurora Elegance Tote.jpg": "Aurora Elegance Tote",
  "Celeste Leather Clutch.jpg": "Celeste Leather Clutch",
  "Opulence Satchel.jpg": "Opulence Satchel",
  "Seraphina Handbag.jpg": "Seraphina Handbag",
  "Luxe Horizon Shoulder Bag.jpg": "Luxe Horizon Shoulder Bag",
  "prime-Shoes-combo.jpg": "Prime Shoes Combo",
  "prime-Samsung-LED.jpg": "Prime Samsung LED",
  "prime-watch-gold.jpg": "Prime Watch Gold",
  "Prime-Yamaha-Piano.jpg": "Prime Yamaha Piano",
  "prime-iphone-17 pro.jpg": "Prime iPhone 17 Pro",
  "prime-iphone 17 pro max.jpg": "Prime iPhone 17 Pro Max",
  "Prime-Piano.jpg": "Prime Piano",
  "Prime-luxury watch box.jpg": "Prime Luxury Watch Box",
};

function isPrimeImagePath(imagePath) {
  const file = String(imagePath || "").split("/").pop() || "";
  return PRIME_EXCLUSIVE_FILE_SET.has(file);
}

function isLuxuryExclusiveImagePath(imagePath) {
  const file = String(imagePath || "").split("/").pop() || "";
  return LUXURY_EXCLUSIVE_FILE_SET.has(file);
}

function isSmallProductImagePath(imagePath) {
  const file = String(imagePath || "").split("/").pop() || "";
  return SMALL_PRODUCT_FILES.has(file);
}

const COMMISSION_TIERS_HARDCODED = {
  0: { min: 40, max: 50 },
  1: { min: 100, max: 110 },
  2: { min: 200, max: 210 },
};

const DEFAULT_PRICE_RANGES = [
  { min_capital: 0, max_capital: 2000, min_price: 5000, max_price: 14000 },
  { min_capital: 2001, max_capital: 19999, min_price: 10000, max_price: 16000 },
  { min_capital: 20000, max_capital: null, min_price: 15000, max_price: 19000 },
];

/**
 * Task order value + commission by total capital (report “Total Capital”, prime-adjusted).
 * Bands: 0–2000 → commission 45–55; 5000–20000 → 200–220; 21000–100000 → 700–900.
 * Gaps 2001–4999 use low-tier commission; 20001–20999 use mid-tier (same as up to 20k).
 */
export function resolveCapitalTaskBand(totalCapital) {
  const c = Math.max(0, Number(totalCapital) || 0);
  if (c <= 2000) {
    const capPrice = c <= 0 ? 0 : Math.min(2000, c);
    const low = c <= 0 ? 0 : Math.max(1, Math.min(200, Math.floor(c * 0.05)));
    return { priceMin: low, priceMax: capPrice, commissionMin: 45, commissionMax: 55 };
  }
  if (c < 5000) {
    return {
      priceMin: Math.max(200, Math.floor(c * 0.1)),
      priceMax: Math.max(1, Math.min(4999, Math.floor(c * 0.95))),
      commissionMin: 45,
      commissionMax: 55,
    };
  }
  if (c < 21000) {
    return {
      priceMin: 2000,
      priceMax: Math.min(20000, c),
      commissionMin: 200,
      commissionMax: 220,
    };
  }
  if (c <= 100000) {
    return {
      priceMin: 5000,
      priceMax: Math.min(100000, c),
      commissionMin: 700,
      commissionMax: 900,
    };
  }
  return {
    priceMin: 8000,
    priceMax: Math.min(c, 100000),
    commissionMin: 700,
    commissionMax: 900,
  };
}

function pickQuantityFromPriceBand(priceMin, priceMax, bal) {
  const balRaw = Number(bal);
  const b = Number.isFinite(balRaw) ? Math.max(0, balRaw) : 0;
  let low = Math.max(0, Math.floor(Number(priceMin) || 0));
  let high = Math.max(low, Math.floor(Number(priceMax) || 0));
  high = Math.min(high, b);
  if (b <= 0) return 0;
  if (high < low) {
    low = Math.min(low, b);
    high = b;
  }
  if (low >= high) return Number(Math.min(high, b).toFixed(2));
  return Number(randomInt(Math.max(1, low), high).toFixed(2));
}

function commissionFromCapitalBand(band, isPrime) {
  const lo = Math.round(Number(band.commissionMin) * 100);
  const hi = Math.round(Number(band.commissionMax) * 100);
  const base = randomInt(lo, hi) / 100;
  const c = isPrime ? base * 5 : base;
  return Number(c.toFixed(2));
}

export { TASK_DAILY_LIMIT, TASK_CATALOG, TASK_IMAGE_POOL, FICTIONAL_PRODUCT_NAMES };

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clampInt(n, lo, hi) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return lo;
  return Math.max(lo, Math.min(hi, x));
}

export function nowIso() {
  return new Date().toISOString();
}

export function imagePathToTitle(imagePath) {
  const file = String(imagePath || "").split("/").pop() || "task";
  if (FICTIONAL_PRODUCT_NAMES[file]) return FICTIONAL_PRODUCT_NAMES[file];
  return file.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

/**
 * Deterministic Grab Order product for a prime task (same until cycle changes via admin grant).
 * @param {string} userId
 * @param {number} taskNo
 * @param {string} cycleKey - e.g. task_assignment_granted_at ISO or first-cycle id
 */
export function stablePrimeGrabProduct(userId, taskNo, cycleKey) {
  const uid = String(userId || "");
  const tn = Math.max(1, Math.floor(Number(taskNo) || 1));
  const ck = String(cycleKey ?? "");
  const seed = `${uid}:${tn}:${ck}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const pool = PRIME_GRAB_IMAGE_POOL.length
    ? PRIME_GRAB_IMAGE_POOL
    : ["/assets/tasks/prime-Shoes-combo.jpg"];
  const idx = Math.abs(h) % pool.length;
  const image = pool[idx];
  return { image, title: imagePathToTitle(image) };
}

export function getPrimeProductOptions() {
  return PRIME_PRODUCT_OPTIONS;
}

export function getPrimeProductByKey(key) {
  const k = String(key || "").trim();
  if (!k) return null;
  return PRIME_PRODUCT_OPTIONS_BY_KEY.get(k) || null;
}

export function randomNonPrimeProductForPrimeTask() {
  const pool = TASK_IMAGE_POOL.filter((img) => !isPrimeImagePath(img));
  const source = pool.length ? pool : TASK_IMAGE_POOL;
  const image = source[randomInt(0, source.length - 1)];
  return { image, title: imagePathToTitle(image) };
}

export function getCommissionRangeForTier(tier) {
  const t = Math.max(0, Math.floor(Number(tier) || 0));
  if (COMMISSION_TIERS_HARDCODED[t]) return COMMISSION_TIERS_HARDCODED[t];
  const baseMin = 40;
  const baseMax = 50;
  const multiplier = Math.pow(2, t);
  return { min: baseMin * multiplier, max: baseMax * multiplier };
}

export function computeTierCommissionRs(tier) {
  const range = getCommissionRangeForTier(tier);
  const c = randomInt(Math.round(range.min * 100), Math.round(range.max * 100)) / 100;
  return Number(c.toFixed(2));
}

/**
 * base_commission = task_price × (random bps / 10000), clamped to band min/max Rs.
 * @param {number} quantityRs
 * @param {string} imagePath
 */
export function computeBaseCommissionFromTaskPrice(quantityRs, imagePath) {
  const q = Math.max(0, Number(quantityRs) || 0);
  const band = priceBandForImagePath(imagePath);
  const loBps = Math.max(1, Math.floor(Number(band.commissionPctMinBps) || 80));
  const hiBps = Math.max(loBps, Math.floor(Number(band.commissionPctMaxBps) || 200));
  const bps = randomInt(loBps, hiBps);
  const raw = q * (bps / 10000);
  const floor = Number(band.commissionMin) || 0;
  const ceil = Number(band.commissionMax);
  const capped =
    Number.isFinite(ceil) && ceil > 0 ? Math.min(ceil, Math.max(floor, raw)) : Math.max(floor, raw);
  return Number(capped.toFixed(2));
}

export function computeDisplayPrice(capital, priceRanges = null) {
  const ranges = priceRanges || DEFAULT_PRICE_RANGES;
  const cap = Math.max(0, Number(capital) || 0);
  for (const range of ranges) {
    const minCap = Number(range.min_capital) ?? 0;
    const maxCap = range.max_capital != null ? Number(range.max_capital) : Infinity;
    if (cap >= minCap && cap <= maxCap) {
      return randomInt(range.min_price, range.max_price);
    }
  }
  return randomInt(5000, 14000);
}

export function shuffle(arr) {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function pickItemsWithReplacement(source, count) {
  const out = [];
  if (!source.length || count <= 0) return out;
  for (let i = 0; i < count; i += 1) {
    out.push(source[randomInt(0, source.length - 1)]);
  }
  return out;
}

export function buildImageCycles() {
  const unique = Array.from(new Set(TASK_IMAGE_POOL));
  const base = shuffle(unique);
  let sequence = base.slice(0, TASK_DAILY_LIMIT);
  if (!sequence.length) {
    sequence = pickItemsWithReplacement(TASK_IMAGE_POOL, TASK_DAILY_LIMIT);
  }
  if (sequence.length < TASK_DAILY_LIMIT && unique.length > 0) {
    const minGap = Math.min(10, Math.max(1, unique.length - 1));
    const recent = [...sequence];
    while (sequence.length < TASK_DAILY_LIMIT) {
      const blocked = new Set(recent.slice(-minGap));
      const candidates = unique.filter((img) => !blocked.has(img));
      const pool = candidates.length ? candidates : unique;
      const next = pool[randomInt(0, pool.length - 1)];
      sequence.push(next);
      recent.push(next);
    }
  }
  return { index: 0, sequence, version: IMAGE_CYCLE_VERSION };
}

export function generateOrderNumber(now = new Date()) {
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdhms =
    String(now.getFullYear()) +
    pad2(now.getMonth() + 1) +
    pad2(now.getDate()) +
    pad2(now.getHours()) +
    pad2(now.getMinutes()) +
    pad2(now.getSeconds());
  return `02${randomInt(1000, 9999)}${ymdhms}${randomInt(10, 99)}`;
}

/**
 * @param {number} userBalance - wallet balance; task price will not exceed this.
 * @param {number|null|undefined} totalCapitalForTier - when set (incl. 0), price + commission follow {@link resolveCapitalTaskBand}.
 */
export function makeActivityTask(taskNo, isPrime, imagePathForBand, userBalance = Infinity, totalCapitalForTier = null) {
  const capTier =
    totalCapitalForTier != null && Number.isFinite(Number(totalCapitalForTier))
      ? resolveCapitalTaskBand(totalCapitalForTier)
      : null;

  if (capTier) {
    const quantityRs = pickQuantityFromPriceBand(capTier.priceMin, capTier.priceMax, userBalance);
    const commission = commissionFromCapitalBand(capTier, isPrime);
    return {
      taskNo,
      title: "Product",
      image: imagePathForBand,
      quantityRs,
      commissionRs: commission,
      rewards: 1,
      isPrime,
    };
  }

  if (isPrime) {
    const band = priceBandForImagePath(imagePathForBand);
    const balRaw = Number(userBalance);
    const bal = Number.isFinite(balRaw) ? Math.max(0, balRaw) : band.max;
    let low = band.min;
    let high = Math.min(band.max, bal);
    if (high < low) {
      low = Math.min(low, bal);
      high = bal;
    }
    let quantityRs;
    if (bal <= 0) {
      quantityRs = 0;
    } else if (low >= high) {
      quantityRs = high;
    } else {
      quantityRs = randomInt(Math.max(1, low), high);
    }
    quantityRs = Number(Math.min(quantityRs, bal).toFixed(2));
    const baseCommission = computeBaseCommissionFromTaskPrice(quantityRs, imagePathForBand);
    const commission = Number((baseCommission * 5).toFixed(2));
    return {
      taskNo,
      title: "Product",
      image: imagePathForBand,
      quantityRs,
      commissionRs: commission,
      rewards: 1,
      isPrime: true,
    };
  }

  const band = priceBandForImagePath(imagePathForBand);
  const balRaw = Number(userBalance);
  const bal = Number.isFinite(balRaw) ? Math.max(0, balRaw) : band.max;
  let low = band.min;
  let high = Math.min(band.max, bal);
  if (high < low) {
    low = Math.min(low, bal);
    high = bal;
  }
  let quantityRs;
  if (bal <= 0) {
    quantityRs = 0;
  } else if (low >= high) {
    quantityRs = high;
  } else {
    quantityRs = randomInt(Math.max(1, low), high);
  }
  quantityRs = Number(Math.min(quantityRs, bal).toFixed(2));
  const baseCommission = computeBaseCommissionFromTaskPrice(quantityRs, imagePathForBand);
  const commission = Number(baseCommission.toFixed(2));
  return {
    taskNo,
    title: "Product",
    image: imagePathForBand,
    quantityRs,
    commissionRs: commission,
    rewards: 1,
    isPrime: false,
  };
}

/**
 * Dynamic task price based on capital.
 * Formula: random int between 10% and 90% of capital, then scaled by multiplier.
 * @param {number} capital - user's current total capital (>=0)
 * @param {number} multiplier - commission/task multiplier (>=1)
 */
export function computeDynamicTaskPrice(capital, multiplier = 1) {
  const cap = Math.max(0, Number(capital) || 0);
  const mult = Math.max(1, clampInt(multiplier, 1, 1_000_000));
  if (cap <= 0) return 0;
  const low = Math.floor(cap * 0.1);
  const high = Math.floor(cap * 0.9);
  const base = low >= high ? high : randomInt(Math.max(0, low), Math.max(0, high));
  return Math.max(0, Math.floor(base * mult));
}

/**
 * Base commission range (pre-multiplier).
 * @returns {number} commission in Rs (2 decimals)
 */
export function computeBaseCommissionRs() {
  // Keep it small as per spec (e.g. Rs 40–50).
  const c = randomInt(40 * 100, 50 * 100) / 100;
  return Number(c.toFixed(2));
}

export function makeUserTaskFromState(taskNo, isPrime, imageState, userBalance = Infinity, totalCapitalForTier = null) {
  if (!isPrime) {
    const { image, state } = nextTaskImageForUser(imageState, userBalance);
    const task = makeActivityTask(taskNo, false, image, userBalance, totalCapitalForTier);
    task.image = image;
    task.title = imagePathToTitle(image);
    return { task, imageState: state };
  }
  const task = makeActivityTask(taskNo, true, TASK_CATALOG[0].image, userBalance, totalCapitalForTier);
  return { task, imageState: imageState };
}

function advanceImageCycleIndex(st) {
  st.index += 1;
  if (st.index >= st.sequence.length) {
    const refreshed = buildImageCycles();
    st.index = refreshed.index;
    st.sequence = refreshed.sequence;
    st.version = refreshed.version;
  }
}

function nextTaskImageForUser(state, userBalance = Infinity) {
  const st = state || buildImageCycles();
  const balRaw = Number(userBalance);
  const bal = Number.isFinite(balRaw) ? Math.max(0, balRaw) : Infinity;

  if (
    bal > SMALL_PRODUCT_BALANCE_MAX &&
    bal >= LUXURY_MIN_BALANCE_FOR_NORMAL_PKR &&
    LUXURY_EXCLUSIVE_IMAGE_PATHS.length &&
    randomInt(1, 100) <= LUXURY_NORMAL_ROLL_PCT
  ) {
    const image =
      LUXURY_EXCLUSIVE_IMAGE_PATHS[randomInt(0, LUXURY_EXCLUSIVE_IMAGE_PATHS.length - 1)];
    advanceImageCycleIndex(st);
    return { image, state: st };
  }

  const maxScans = Math.max(1, st.sequence?.length || TASK_DAILY_LIMIT);
  let fallbackNonPrime = null;
  let fallbackSmall = null;

  for (let i = 0; i < maxScans; i += 1) {
    const image = st.sequence[st.index] || TASK_IMAGE_POOL[0];
    advanceImageCycleIndex(st);

    if (isPrimeImagePath(image)) continue;
    if (isLuxuryExclusiveImagePath(image)) continue;

    if (!fallbackNonPrime) fallbackNonPrime = image;
    if (!fallbackSmall && isSmallProductImagePath(image)) fallbackSmall = image;

    if (bal <= SMALL_PRODUCT_BALANCE_MAX) {
      if (isSmallProductImagePath(image)) return { image, state: st };
      continue;
    }

    const band = priceBandForImagePath(image);
    if (Number(band.min) <= bal) return { image, state: st };
  }

  if (bal <= SMALL_PRODUCT_BALANCE_MAX) {
    return { image: fallbackSmall || fallbackNonPrime || TASK_IMAGE_POOL[0], state: st };
  }
  return { image: fallbackNonPrime || TASK_IMAGE_POOL[0], state: st };
}

export function buildEmailCandidates(emailRaw) {
  const base = String(emailRaw || "").trim().toLowerCase();
  if (!base) return [];
  const set = new Set([base]);
  if (base === "admin@gamil.com") set.add("admin@gmail.com");
  if (base === "admin@gmail.com") set.add("admin@gamil.com");
  return [...set];
}

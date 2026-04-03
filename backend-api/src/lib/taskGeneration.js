const TASK_DAILY_LIMIT = 30;

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

/** Realistic Rs ranges by product category (filename/title hints). Commission = task_price × (bps/10000), clamped. */
const DEFAULT_BAND = {
  min: 1000,
  max: 15000,
  commissionMin: 40,
  commissionMax: 65,
  commissionPctMinBps: 80,
  commissionPctMaxBps: 200,
};

function priceBandForImagePath(imagePath) {
  const f = String(imagePath || "").toLowerCase();
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
};

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
  const pool = TASK_IMAGE_POOL.length ? TASK_IMAGE_POOL : ["/assets/tasks/Man-Shoes.jpg"];
  const idx = Math.abs(h) % pool.length;
  const image = pool[idx];
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
  const base = shuffle(TASK_IMAGE_POOL);
  const sequence = base.length ? base : pickItemsWithReplacement(TASK_IMAGE_POOL, TASK_DAILY_LIMIT);
  return { index: 0, sequence };
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
    const { image, state } = nextTaskImageForUser(imageState);
    const task = makeActivityTask(taskNo, false, image, userBalance, totalCapitalForTier);
    task.image = image;
    task.title = imagePathToTitle(image);
    return { task, imageState: state };
  }
  const task = makeActivityTask(taskNo, true, TASK_CATALOG[0].image, userBalance, totalCapitalForTier);
  return { task, imageState: imageState };
}

function nextTaskImageForUser(state) {
  const st = state || buildImageCycles();
  const image = st.sequence[st.index] || TASK_IMAGE_POOL[0];
  st.index += 1;
  if (st.index >= st.sequence.length) {
    const refreshed = buildImageCycles();
    st.index = refreshed.index;
    st.sequence = refreshed.sequence;
  }
  return { image, state: st };
}

export function buildEmailCandidates(emailRaw) {
  const base = String(emailRaw || "").trim().toLowerCase();
  if (!base) return [];
  const set = new Set([base]);
  if (base === "admin@gamil.com") set.add("admin@gmail.com");
  if (base === "admin@gmail.com") set.add("admin@gamil.com");
  return [...set];
}

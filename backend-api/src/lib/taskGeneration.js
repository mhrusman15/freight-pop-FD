const TASK_DAILY_LIMIT = 30;

const TASK_CATALOG = [
  { title: "Prime order", image: "/assets/tasks/Girl-bag.jpg", min: 55000, max: 65000, commissionMin: 1800, commissionMax: 2600 },
  { title: "Brand Vault", image: "/assets/tasks/Man-Watch.jpg", min: 42000, max: 58000, commissionMin: 1200, commissionMax: 1900 },
  { title: "Elite Choice", image: "/assets/tasks/Man-Shoes.jpg", min: 20000, max: 35000, commissionMin: 700, commissionMax: 1200 },
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

export { TASK_DAILY_LIMIT, TASK_CATALOG, TASK_IMAGE_POOL };

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function nowIso() {
  return new Date().toISOString();
}

export function imagePathToTitle(imagePath) {
  const file = String(imagePath || "").split("/").pop() || "task";
  return file.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
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

export function makeActivityTask(taskNo, isPrime) {
  const template = isPrime ? TASK_CATALOG[0] : TASK_CATALOG[randomInt(1, TASK_CATALOG.length - 1)];
  const quantity = randomInt(template.min, template.max);
  const baseCommission = randomInt(40 * 100, 65 * 100) / 100;
  const commission = isPrime ? Number((baseCommission * 5).toFixed(2)) : baseCommission;
  return {
    taskNo,
    title: template.title,
    image: template.image,
    quantityRs: Number(quantity.toFixed ? quantity.toFixed(2) : quantity),
    commissionRs: Number(commission.toFixed(2)),
    rewards: 1,
    isPrime,
  };
}

export function makeUserTaskFromState(taskNo, isPrime, imageState) {
  const task = makeActivityTask(taskNo, isPrime);
  if (!isPrime) {
    const { image, state } = nextTaskImageForUser(imageState);
    task.image = image;
    task.title = imagePathToTitle(image);
    return { task, imageState: state };
  }
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

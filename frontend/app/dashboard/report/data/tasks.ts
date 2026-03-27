export type Category = "shoes" | "watch" | "bag";

export type Task = {
  id: number;
  category: Category;
  title: string;
  image: string;
  price: number;
  commission: number;
  rewards: number;
};

export const TOTAL_TASKS = 30;

export const categories: Category[] = ["shoes", "watch", "bag"];

const categoryImageMap: Record<Category, string[]> = {
  shoes: [
    "Man-Shoes.jpg",
    "Woman-shoes.jpg",
    "heals.jpg",
    "Shoes-men.jpg",
    "Men-Jacket.jpg",
    "Bike-Helmet.jpg",
  ],
  watch: [
    "Man-Watch.jpg",
    "Woman-watch.jpg",
    "Health-watch.jpg",
    "Smart Watch.jpg",
    "Clock.jpg",
    "Sony-headphone.jpg",
    "Canon-Camera.jpg",
    "voltmeter.jpg",
    "charger.jpg",
  ],
  bag: [
    "Girl-bag.jpg",
    "laptop-bag.jpg",
    "Girl-Stoler.jpg",
    "Laptop.jpg",
    "ipad.jpg",
    "USB-128Gb.jpg",
    "speaker.jpg",
    "glasses.jpg",
    "Makeup-kit.jpg",
    "purfume.jpg",
    "Toy.jpg",
    "Toy-gun.jpg",
    "Tree-light.jpg",
    "earring.jpg",
    "study-table.jpg",
    "toolbox.jpg",
    "water-bottle.jpg",
  ],
};

const imageToCategory: Record<string, Category> = Object.entries(categoryImageMap).reduce(
  (acc, [category, images]) => {
    images.forEach((img) => {
      acc[img] = category as Category;
    });
    return acc;
  },
  {} as Record<string, Category>,
);

const allTaskImages = Object.values(categoryImageMap).flat();
let taskSequence: string[] = [];
let taskSequenceIndex = 0;

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
}

function pickWithReplacement(source: string[], count: number): string[] {
  if (!source.length || count <= 0) return [];
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(source[Math.floor(Math.random() * source.length)]);
  }
  return out;
}

function refillTaskSequence(): void {
  const shuffled = shuffle(allTaskImages);
  // Use full pool before repeating so image variety stays high.
  taskSequence = shuffled.length
    ? shuffled
    : pickWithReplacement(allTaskImages, TOTAL_TASKS);
  taskSequenceIndex = 0;
}

export const getImageByCategory = (category: Category): string => {
  const images = categoryImageMap[category];
  const pick = images[Math.floor(Math.random() * images.length)] ?? `${category}.png`;
  return `/assets/tasks/${pick}`;
};

export const getNextTaskImage = (): string => {
  if (!taskSequence.length || taskSequenceIndex >= taskSequence.length) {
    refillTaskSequence();
  }
  const next = taskSequence[taskSequenceIndex] ?? allTaskImages[0];
  taskSequenceIndex += 1;
  return `/assets/tasks/${next}`;
};

export const getRandomCategory = (): Category =>
  categories[Math.floor(Math.random() * categories.length)];

export const getTitleFromImageName = (imagePath: string): string => {
  const filename = imagePath.split("/").pop() ?? "task";
  const withoutExt = filename.replace(/\.[^.]+$/, "");
  return withoutExt
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

export function createRandomTask(id: number): Task {
  const image = getNextTaskImage();
  const file = image.split("/").pop() || "";
  const category = imageToCategory[file] ?? "bag";
  const price = 8000 + Math.floor(Math.random() * 2000);
  let commission = Number((Math.random() * 50 + 30).toFixed(2));
  if (id === 1) commission = 56.53;
  if (id === 2) commission = 51.08;

  return {
    id,
    category,
    image,
    title: getTitleFromImageName(image),
    price,
    commission,
    rewards: 1,
  };
}


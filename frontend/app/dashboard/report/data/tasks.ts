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
  ],
  watch: [
    "Man-Watch.jpg",
    "Woman-watch.jpg",
    "Health-watch.jpg",
    "Smart Watch.jpg",
    "Clock.jpg",
    "Sony-headphone.jpg",
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
let shuffledImageQueue: string[] = [];

function refillImageQueue(): void {
  shuffledImageQueue = [...allTaskImages];
  for (let i = shuffledImageQueue.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffledImageQueue[i];
    shuffledImageQueue[i] = shuffledImageQueue[j];
    shuffledImageQueue[j] = tmp;
  }
}

export const getImageByCategory = (category: Category): string => {
  const images = categoryImageMap[category];
  const pick = images[Math.floor(Math.random() * images.length)] ?? `${category}.png`;
  return `/assets/tasks/${pick}`;
};

export const getNextTaskImage = (): string => {
  if (shuffledImageQueue.length === 0) refillImageQueue();
  const next = shuffledImageQueue.shift() ?? allTaskImages[0];
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


export type Category = "shoes" | "perfume" | "watch" | "bag";

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

export const categories: Category[] = ["shoes", "perfume", "watch", "bag"];

const categoryImageMap: Record<Category, string[]> = {
  shoes: ["Man-Shoes.jpg", "Woman-shoes.jpg", "heals.jpg"],
  perfume: ["perfume.png", "Makeup-kit.jpg", "earring.jpg"],
  watch: ["Man-Watch.jpg", "Woman-watch.jpg", "Health-watch.jpg", "Smart Watch.jpg"],
  bag: ["Girl-bag.jpg", "laptop-bag.jpg", "Girl-Stoler.jpg"],
};

export const getImageByCategory = (category: Category): string => {
  const images = categoryImageMap[category];
  const pick = images[Math.floor(Math.random() * images.length)] ?? `${category}.png`;
  return `/assets/tasks/${pick}`;
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
  const category = getRandomCategory();
  const image = getImageByCategory(category);
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


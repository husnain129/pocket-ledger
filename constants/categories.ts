export type DefaultCategorySeed = {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId?: string | null;
};

export const DEFAULT_CATEGORY_SEEDS: DefaultCategorySeed[] = [
  { id: "food", name: "Food", icon: "food-apple", color: "#f97316" },
  {
    id: "food-groceries",
    name: "Groceries",
    icon: "cart",
    color: "#ea580c",
    parentId: "food",
  },
  {
    id: "food-restaurant",
    name: "Restaurant",
    icon: "silverware-fork-knife",
    color: "#fb923c",
    parentId: "food",
  },
  {
    id: "food-coffee",
    name: "Coffee",
    icon: "coffee",
    color: "#b45309",
    parentId: "food",
  },
  { id: "transport", name: "Transport", icon: "car", color: "#0f766e" },
  {
    id: "transport-fuel",
    name: "Fuel",
    icon: "gas-station",
    color: "#14b8a6",
    parentId: "transport",
  },
  {
    id: "transport-ride-share",
    name: "Ride Share",
    icon: "car-hatchback",
    color: "#2dd4bf",
    parentId: "transport",
  },
  {
    id: "transport-public",
    name: "Public Transit",
    icon: "train",
    color: "#5eead4",
    parentId: "transport",
  },
  { id: "health", name: "Health", icon: "medical-bag", color: "#db2777" },
  {
    id: "health-pharmacy",
    name: "Pharmacy",
    icon: "pill",
    color: "#ec4899",
    parentId: "health",
  },
  {
    id: "health-clinic",
    name: "Clinic",
    icon: "stethoscope",
    color: "#f43f5e",
    parentId: "health",
  },
  { id: "shopping", name: "Shopping", icon: "shopping", color: "#8b5cf6" },
  {
    id: "shopping-fashion",
    name: "Fashion",
    icon: "tshirt-crew",
    color: "#a855f7",
    parentId: "shopping",
  },
  {
    id: "shopping-home",
    name: "Home",
    icon: "home-heart",
    color: "#c084fc",
    parentId: "shopping",
  },
  {
    id: "bills",
    name: "Bills",
    icon: "file-document-outline",
    color: "#2563eb",
  },
  {
    id: "bills-rent",
    name: "Rent",
    icon: "home-city",
    color: "#3b82f6",
    parentId: "bills",
  },
  {
    id: "bills-subscriptions",
    name: "Subscriptions",
    icon: "repeat",
    color: "#60a5fa",
    parentId: "bills",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "movie-open",
    color: "#f59e0b",
  },
  {
    id: "entertainment-games",
    name: "Games",
    icon: "controller-classic",
    color: "#fbbf24",
    parentId: "entertainment",
  },
  {
    id: "entertainment-events",
    name: "Events",
    icon: "party-popper",
    color: "#f97316",
    parentId: "entertainment",
  },
  { id: "education", name: "Education", icon: "school", color: "#10b981" },
  {
    id: "education-courses",
    name: "Courses",
    icon: "book-open-page-variant",
    color: "#34d399",
    parentId: "education",
  },
  {
    id: "education-books",
    name: "Books",
    icon: "book",
    color: "#059669",
    parentId: "education",
  },
  { id: "other", name: "Other", icon: "shape", color: "#64748b" },
  {
    id: "other-misc",
    name: "Misc",
    icon: "dots-horizontal-circle",
    color: "#475569",
    parentId: "other",
  },
];

export const PAYMENT_METHODS = [
  "Cash",
  "Card",
  "Transfer",
  "Mobile Wallet",
  "Other",
] as const;

export const RECURRING_RULES = ["daily", "weekly", "monthly"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type RecurrenceRule = (typeof RECURRING_RULES)[number];

export type CategoryItem = {
  name: string;
  slug: string;
};

export const categories: CategoryItem[] = [
  { name: "Revision Books", slug: "books" },
  { name: "Exam Papers & Practice", slug: "exams" },
  { name: "Stationery Essentials", slug: "stationery" },
  { name: "Lab Supplies", slug: "lab-equipment" },
];

export const howItWorksSteps = [
  {
    step: 1,
    title: "Choose your books & supplies",
    description:
      "Browse revision books, exams, stationery, and lab supplies for your needs.",
  },
  {
    step: 2,
    title: "Send your order on WhatsApp",
    description:
      "Tell us what you need and we’ll confirm availability, pricing, and next steps.",
  },
  {
    step: 3,
    title: "Confirm and receive delivery",
    description: "Approve your order details and we’ll arrange delivery to your location.",
  },
] as const;

export type WhyChooseUsItem = {
  title: string;
  subtext: string;
};

export const whyChooseUs: readonly WhyChooseUsItem[] = [
  {
    title: "CBC-aligned materials for all grades",
    subtext: "Carefully selected books that match the Kenyan curriculum.",
  },
  {
    title: "Reliable nationwide delivery",
    subtext: "We deliver across Kenya — fast and dependable.",
  },
  {
    title: "Quick WhatsApp support",
    subtext: "Get replies fast and place your order without delays.",
  },
  {
    title: "Trusted by schools and parents",
    subtext: "Supplying learning materials to schools and families across Kenya.",
  },
];

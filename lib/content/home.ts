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
    title: "Choose your books and supplies",
    description: "Browse curriculum books, exams, stationery and lab supplies for home or school.",
  },
  {
    step: 2,
    title: "Send your order on WhatsApp",
    description: "Tell us what you need and we will confirm availability, pricing and the next steps.",
  },
  {
    step: 3,
    title: "Confirm and receive delivery",
    description: "Approve your order details and we will arrange delivery to your location in Kenya.",
  },
] as const;

export type WhyChooseUsItem = {
  title: string;
  subtext: string;
};

export const whyChooseUs: readonly WhyChooseUsItem[] = [
  {
    title: "CBC-focused materials for Kenyan learners",
    subtext: "Carefully selected books and practice resources for classroom and home study.",
  },
  {
    title: "Reliable nationwide delivery",
    subtext: "We help schools and families source materials quickly across Kenya.",
  },
  {
    title: "Fast WhatsApp support",
    subtext: "Get stock checks, pricing and order guidance without long back-and-forth.",
  },
  {
    title: "Trusted by schools and parents",
    subtext: "A dependable partner for termly learning materials and bulk school supply.",
  },
];

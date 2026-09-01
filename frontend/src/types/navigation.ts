export type PageId =
  | "overview"
  | "dna"
  | "agents"
  | "guardian"
  | "twin"
  | "scenarios"
  | "pareto"
  | "settings";

export interface NavItem {
  id: PageId;
  label: string;
  badge?: string | number;
  badgeVariant?: "cyan" | "warning" | "danger" | "neutral";
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

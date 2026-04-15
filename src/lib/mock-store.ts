export type StartupProject = {
  id: string;
  name: string;
  description: string;
  total_tokens: number;
  price_per_token: number;
  sold_tokens: number;
};

export type InvestmentRecord = {
  user_wallet: string;
  project_id: string;
  tokens_owned: number;
  transaction_hash: string;
  created_at: string;
};

export const defaultProjects: StartupProject[] = [
  {
    id: "proj-1",
    name: "SolarMesh",
    description: "Peer-to-peer solar energy credits for residential grids.",
    total_tokens: 100_000,
    price_per_token: 0.005,
    sold_tokens: 18_450,
  },
  {
    id: "proj-2",
    name: "MediLink AI",
    description: "AI-first clinical workflow automation for small hospitals.",
    total_tokens: 80_000,
    price_per_token: 0.0075,
    sold_tokens: 22_100,
  },
  {
    id: "proj-3",
    name: "AquaChain",
    description: "Smart water quality sensors with immutable compliance logs.",
    total_tokens: 120_000,
    price_per_token: 0.004,
    sold_tokens: 35_760,
  },
  {
    id: "proj-4",
    name: "EduVerse",
    description: "Skill-based micro-certification marketplace for creators.",
    total_tokens: 90_000,
    price_per_token: 0.006,
    sold_tokens: 12_300,
  },
];

export const inMemoryState: {
  projects: StartupProject[];
  investments: InvestmentRecord[];
} = {
  projects: [...defaultProjects],
  investments: [],
};

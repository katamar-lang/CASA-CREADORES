// Tipos compartidos entre backend y frontend de Casa Creadores

export enum UserRole {
  MARCA = "MARCA",
  CREADOR = "CREADOR",
  ADMIN = "ADMIN",
}

export enum CampaignStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum VerifiedStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
}

export interface Brand {
  id: string;
  userId: string;
  companyName: string;
  website: string;
  industry: string;
  createdAt: string;
}

export interface Creator {
  id: string;
  userId: string;
  bio: string;
  xHandle: string | null;
  igHandle: string | null;
  tiktokHandle: string | null;
  verifiedStatus: VerifiedStatus;
  followerCount: number;
  nichos: string[];
  createdAt: string;
}

export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  description: string;
  budgetUSDC: number;
  duration: number;
  minFollowers: number;
  minEngagementRate: number;
  status: CampaignStatus;
  createdAt: string;
}

export interface CampaignApplication {
  id: string;
  campaignId: string;
  creatorId: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface Payment {
  id: string;
  brandId: string;
  campaignId: string;
  amountUSDC: number;
  txHash: string | null;
  status: PaymentStatus;
  createdAt: string;
}

export const NICHOS_CRIPTO = [
  "DeFi",
  "NFTs",
  "Trading",
  "Web3 Gaming",
  "Fintech",
  "Educación Cripto",
  "Blockchain",
  "Stablecoins",
] as const;

export const INDUSTRIAS = ["Cripto", "Fintech", "Exchange", "Wallet", "DeFi Protocol"] as const;

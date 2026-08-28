export type Role = "ADMIN" | "LO" | "REALTOR";
export type FlyerStatus = "DRAFT" | "SAVED";
export type ApprovalStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface CompanySettings {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  logoUrlLight: string | null;
  website: string | null;
  phone: string | null;
  licenseText: string | null;
  standardDisclaimer: string | null;
  stateDisclaimers: Record<string, string> | null;
}

export interface LoanOfficer {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  title: string;
  nmlsNumber: string;
  officePhone: string | null;
  cellPhone: string | null;
  email: string;
  website: string | null;
  branchAddress: string | null;
  branchStreet: string | null;
  branchSuite: string | null;
  branchCity: string | null;
  branchState: string | null;
  branchZip: string | null;
  branchNmls: string | null;
  headshotUrl: string | null;
  user: { email: string; isActive: boolean; hasPassword?: boolean };
  createdAt: string;
}

export interface Realtor {
  id: string;
  loanOfficerId: string;
  firstName: string;
  lastName: string;
  title: string;
  companyName: string;
  officePhone: string | null;
  cellPhone: string | null;
  email: string | null;
  website: string | null;
  officeAddress: string | null;
  officeStreet: string | null;
  officeSuite: string | null;
  officeCity: string | null;
  officeState: string | null;
  officeZip: string | null;
  headshotUrl: string | null;
  companyLogoUrl: string | null;
  brandPrimary: string | null;
  brandSecondary: string | null;
  account?: { email: string; isActive: boolean; hasPassword: boolean } | null;
  createdAt: string;
}

export interface PropertyData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number | null;
  lotSize: string | null;
  yearBuilt: number | null;
  garage: string | null;
  propertyType: string | null;
  propertyUse: string | null;
  stories: number | null;
  units: number | null;
  description: string | null;
  photos: string[];
  mlsNumber: string | null;
  openHouseDate: string | null;
  openHouseStartTime: string | null;
  openHouseEndTime: string | null;
}

export interface LoanScenario {
  label: string;
  purchasePrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  interestRate: number;
  apr: number;
  term: number;
  loanType: string;
  monthlyPayment: number;
  piPayment: number;
  taxesInsurance: number | null;
  hoaFee: number | null;
  miPayment: number | null;
  upfrontMip: number | null;
  monthlyMip: number | null;
  vaFundingFee: number | null;
  usdaGuaranteeFee: number | null;
  usdaAnnualFee: number | null;
}

export interface Flyer {
  id: string;
  loanOfficerId: string;
  loanOfficer?: LoanOfficer;
  realtorId: string | null;
  realtor?: Realtor | null;
  templateId: string;
  title: string | null;
  propertyData: PropertyData | null;
  loanScenarios: LoanScenario[] | null;
  qrCodeData: string | null;
  pdfUrl: string | null;
  shareToken: string | null;
  status: FlyerStatus;
  distributionState: string | null;
  approvalStatus: ApprovalStatus;
  submittedForReviewAt: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlyerTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  hasLoanScenarios: boolean;
  maxScenarios: number;
  photoLayout: "single" | "grid" | "hero-strip";
}

export const FLYER_TEMPLATES: FlyerTemplate[] = [
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Full-bleed hero photo with clean property details",
    thumbnail: "/templates/modern-minimal.png",
    hasLoanScenarios: false,
    maxScenarios: 0,
    photoLayout: "single",
  },
  {
    id: "gallery-grid",
    name: "Gallery Grid",
    description: "Multi-photo grid with property information panel",
    thumbnail: "/templates/gallery-grid.png",
    hasLoanScenarios: false,
    maxScenarios: 0,
    photoLayout: "grid",
  },
  {
    id: "showcase-one-rate",
    name: "Showcase + Rate",
    description: "Hero photo, property details, and one loan scenario",
    thumbnail: "/templates/showcase-one-rate.png",
    hasLoanScenarios: true,
    maxScenarios: 1,
    photoLayout: "hero-strip",
  },
  {
    id: "market-leader",
    name: "Market Leader",
    description: "Full property showcase with up to 3 loan scenarios",
    thumbnail: "/templates/market-leader.png",
    hasLoanScenarios: true,
    maxScenarios: 3,
    photoLayout: "grid",
  },
];

export interface REBrand {
  name: string;
  aliases: string[];
  primaryColor: string;
  secondaryColor: string;
}

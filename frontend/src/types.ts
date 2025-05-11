export interface Role {
  ID: number;
  name: string;
}

export interface UserProps {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  Roles: Role[];
  publicWalletAddress: string | undefined;
}

export interface Offer {
  ID: number;
  tenderNumber: string;
  contractAddress: string;
  sectorID: number;
  location?: string;
  Sector: Sector;
  description: string;
  title: string;
  budget: number;
  currency: string;
  proposalSubmissionStart: string; // ISO timestamp
  proposalSubmissionEnd: string; // ISO timestamp
  proposalReviewStart: string; // ISO timestamp
  proposalReviewEnd: string; // ISO timestamp
  minQualificationLevel?: string;
  status: "Open" | "Closed" | string;
  CreatedBy: number;
  CreatedAt: string; // ISO timestamp
  UpdatedAt: string; // ISO timestamp
  DeletedAt?: string | null; // ISO timestamp or null
  Documents: Document[];
  Proposals?: Proposal[];
}

export interface Sector {
  ID: number;
  code: string;
  description: string;
}

export interface Document {
  ID: number;
  documentType: string;
  documentPath: string;
  documentableID: number;
  documentableType: string;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt?: string | null;
}

export interface Proposal {
  ID: number;
  contractID: number;
  proposerID: number;
  details?: string;
  status: string;
  submittedAt: string;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt?: string | null;
}

export interface ErrorResponse {
  msg: string;
}

export type ServerFormError = {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
};

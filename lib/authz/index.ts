import { Role, StateStatus } from "@prisma/client";

export type Actor = {
  userId: string;
  role: Role;
  lenderOrgId?: string;
  orgRole?: "ORG_ADMIN" | "LO";
};

export type Action =
  | "listing:create"
  | "listing:read"
  | "listing:update"
  | "listing:read:masked"
  | "identity:read"
  | "wallet:read"
  | "billing:manage"
  | "stateRule:manage"
  | "approval:manage"
  | "dispute:manage";

type ListingResource = {
  type: "listing";
  borrowerUserId: string;
  state: string;
  purpose: string;
  loanAmount: number;
  stateStatus: StateStatus;
  coverageBox?: CoverageBoxResource;
};

type IdentityResource = {
  type: "identity";
  borrowerUserId: string;
  lenderOrgId: string;
  hasIdentityGrant: boolean;
};

type OrgResource = {
  type: "lenderOrg";
  lenderOrgId: string;
};

type AdminResource = {
  type: "admin";
};

type CoverageBoxResource = {
  states: string[];
  purposes: string[];
  loanMin: number;
  loanMax: number;
};

export type Resource =
  | ListingResource
  | IdentityResource
  | OrgResource
  | AdminResource;

export function can(
  actor: Actor | null,
  action: Action,
  resource: Resource,
): boolean {
  if (!actor) {
    return false;
  }

  if (actor.role === Role.ADMIN) {
    return true;
  }

  if (
    action === "stateRule:manage" ||
    action === "approval:manage" ||
    action === "dispute:manage"
  ) {
    return false;
  }

  if (resource.type === "listing") {
    return canAccessListing(actor, action, resource);
  }

  if (resource.type === "identity") {
    return canReadIdentity(actor, action, resource);
  }

  if (resource.type === "lenderOrg") {
    return canAccessOrg(actor, action, resource);
  }

  return false;
}

function canAccessListing(
  actor: Actor,
  action: Action,
  resource: ListingResource,
): boolean {
  if (actor.role === Role.BORROWER) {
    return (
      (action === "listing:read" || action === "listing:update") &&
      resource.borrowerUserId === actor.userId
    );
  }

  if (action !== "listing:read:masked" || actor.role !== Role.LENDER) {
    return false;
  }

  return (
    resource.stateStatus === StateStatus.GREEN &&
    Boolean(resource.coverageBox) &&
    coverageMatches(resource.coverageBox, resource)
  );
}

function canReadIdentity(
  actor: Actor,
  action: Action,
  resource: IdentityResource,
): boolean {
  if (action !== "identity:read") {
    return false;
  }

  if (actor.role === Role.BORROWER) {
    return resource.borrowerUserId === actor.userId;
  }

  return (
    actor.role === Role.LENDER &&
    actor.lenderOrgId === resource.lenderOrgId &&
    resource.hasIdentityGrant
  );
}

function canAccessOrg(
  actor: Actor,
  action: Action,
  resource: OrgResource,
): boolean {
  if (
    actor.role !== Role.LENDER ||
    actor.lenderOrgId !== resource.lenderOrgId
  ) {
    return false;
  }

  if (action === "wallet:read") {
    return true;
  }

  return action === "billing:manage" && actor.orgRole === "ORG_ADMIN";
}

function coverageMatches(
  coverageBox: CoverageBoxResource | undefined,
  listing: Pick<ListingResource, "state" | "purpose" | "loanAmount">,
): boolean {
  if (!coverageBox) {
    return false;
  }

  return (
    coverageBox.states.includes(listing.state) &&
    coverageBox.purposes.includes(listing.purpose) &&
    listing.loanAmount >= coverageBox.loanMin &&
    listing.loanAmount <= coverageBox.loanMax
  );
}

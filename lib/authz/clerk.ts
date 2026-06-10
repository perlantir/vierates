import { Role } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

import type { Actor } from "@/lib/authz";

type ClaimMap = Record<string, unknown>;

export async function getActorFromClerk(): Promise<Actor | null> {
  const session = await auth();

  if (!session.userId) {
    return null;
  }

  const claims = (session.sessionClaims ?? {}) as ClaimMap;
  const metadata =
    readClaimMap(claims.publicMetadata) ?? readClaimMap(claims.metadata);
  const role = parseRole(metadata?.role);

  if (!role) {
    return null;
  }

  return {
    userId: session.userId,
    role,
    lenderOrgId: readString(metadata?.lenderOrgId),
    orgRole: parseOrgRole(metadata?.orgRole),
  };
}

function readClaimMap(value: unknown): ClaimMap | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as ClaimMap;
  }

  return undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function parseRole(value: unknown): Role | undefined {
  const role = readString(value)?.toUpperCase();

  if (role === Role.BORROWER || role === Role.LENDER || role === Role.ADMIN) {
    return role;
  }

  return undefined;
}

function parseOrgRole(value: unknown): Actor["orgRole"] | undefined {
  return value === "ORG_ADMIN" || value === "LO" ? value : undefined;
}

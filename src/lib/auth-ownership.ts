export type ResourceType = "documents" | "conversations" | "roadmaps" | "profile";

export function userOwnsResource(currentUserId: string, resourceOwnerId: string | null | undefined) {
  return Boolean(currentUserId && resourceOwnerId && currentUserId === resourceOwnerId);
}

export function assertResourceOwnership({
  currentUserId,
  resourceOwnerId,
  resourceType,
}: {
  currentUserId: string;
  resourceOwnerId: string | null | undefined;
  resourceType: ResourceType;
}) {
  if (!userOwnsResource(currentUserId, resourceOwnerId)) {
    throw new Error(`This ${resourceType} resource does not belong to the current user.`);
  }

  return true;
}

import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

type JsonRecord = Record<string, Prisma.JsonValue | undefined>;

function isRecord(value: Prisma.JsonValue | null): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasDocumentId(metadata: Prisma.JsonValue | null) {
  return isRecord(metadata) && typeof metadata.documentId === "string" && metadata.documentId.length > 0;
}

function isAlreadyUnassigned(metadata: Prisma.JsonValue | null) {
  return isRecord(metadata) && metadata.legacyDocumentAssociation === "unassigned";
}

function citedDocumentIds(citations: Prisma.JsonValue | null) {
  if (!Array.isArray(citations)) return [];

  return [...new Set(
    citations.flatMap((citation) =>
      isRecord(citation) && typeof citation.documentId === "string" && citation.documentId.length > 0
        ? [citation.documentId]
        : [],
    ),
  )];
}

async function main() {
  const conversations = await prisma.conversation.findMany({
    select: {
      id: true,
      userId: true,
      metadata: true,
      messages: { select: { citations: true } },
    },
  });

  let updated = 0;
  let skipped = 0;
  let remainingUnassigned = 0;

  for (const conversation of conversations) {
    if (hasDocumentId(conversation.metadata)) {
      skipped += 1;
      continue;
    }

    if (isAlreadyUnassigned(conversation.metadata)) {
      skipped += 1;
      remainingUnassigned += 1;
      continue;
    }

    const citationIds = [...new Set(conversation.messages.flatMap((message) => citedDocumentIds(message.citations)))];
    const ownedDocuments = citationIds.length
      ? await prisma.document.findMany({
          where: { id: { in: citationIds }, userId: conversation.userId },
          select: { id: true },
        })
      : [];

    // A legacy document chat is safe to assign only when every stored citation
    // identifies the same document owned by this conversation's user.
    const documentId = citationIds.length === 1 && ownedDocuments.length === 1 && ownedDocuments[0].id === citationIds[0]
      ? citationIds[0]
      : null;
    const metadata = isRecord(conversation.metadata) ? conversation.metadata : {};

    if (documentId) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          scope: "document",
          metadata: {
            ...metadata,
            documentId,
            legacyDocumentAssociation: "citation-match",
          },
        },
      });
      updated += 1;
      continue;
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        scope: "unassigned",
        metadata: {
          ...metadata,
          legacyDocumentAssociation: "unassigned",
          legacyDocumentAssociationReason: citationIds.length === 0 ? "no-document-citation" : "ambiguous-or-unowned-citations",
        },
      },
    });
    remainingUnassigned += 1;
  }

  console.info("Legacy document conversation migration complete.");
  console.info(`Conversations updated: ${updated}`);
  console.info(`Conversations skipped: ${skipped}`);
  console.info(`Conversations remaining unassigned: ${remainingUnassigned}`);
}

main()
  .catch((error) => {
    console.error("Legacy document conversation migration failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

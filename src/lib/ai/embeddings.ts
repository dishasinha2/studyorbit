import crypto from "crypto";

export const LOCAL_EMBEDDING_PROVIDER = "local";
export const LOCAL_EMBEDDING_MODEL = "studyorbit-hash-embedding-v1";
export const LOCAL_EMBEDDING_DIMENSIONS = 1536;

function tokens(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function hashToIndex(token: string) {
  const digest = crypto.createHash("sha256").update(token).digest();
  return digest.readUInt32BE(0) % LOCAL_EMBEDDING_DIMENSIONS;
}

export function createLocalEmbedding(input: string) {
  const vector = new Array<number>(LOCAL_EMBEDDING_DIMENSIONS).fill(0);
  for (const token of tokens(input)) {
    vector[hashToIndex(token)] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(8)));
}

export function vectorSqlLiteral(vector: number[]) {
  return `[${vector.join(",")}]`;
}

export function vectorHash(vector: number[]) {
  return crypto.createHash("sha256").update(vector.join(",")).digest("hex");
}


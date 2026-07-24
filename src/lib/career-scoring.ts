type CareerProfileInput = {
  name?: string | null;
  age?: number | null;
  education?: string | null;
  college?: string | null;
  degree?: string | null;
  skills?: string[];
  interests?: string[];
  careerGoals?: string[];
  resumeFileId?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
};

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

export function parseStringList(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

export function stringifyStringList(value: string[] | undefined) {
  if (!value) return undefined;
  const clean = Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
  return JSON.stringify(clean.slice(0, 30));
}

export function calculateProfileCompletion(profile: CareerProfileInput) {
  const checks = [
    hasText(profile.name),
    typeof profile.age === "number" && profile.age > 0,
    hasText(profile.education),
    hasText(profile.college),
    hasText(profile.degree),
    Boolean(profile.skills?.length),
    Boolean(profile.interests?.length),
    Boolean(profile.careerGoals?.length),
    hasText(profile.resumeFileId),
    hasText(profile.linkedinUrl),
    hasText(profile.githubUrl),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function calculateCareerReadiness(profile: CareerProfileInput) {
  let score = 0;
  if (hasText(profile.degree) || hasText(profile.education)) score += 15;
  if ((profile.skills?.length ?? 0) >= 3) score += 20;
  else score += Math.min(15, (profile.skills?.length ?? 0) * 5);
  if ((profile.interests?.length ?? 0) >= 2) score += 10;
  if ((profile.careerGoals?.length ?? 0) >= 1) score += 15;
  if (hasText(profile.resumeFileId)) score += 20;
  if (hasText(profile.linkedinUrl)) score += 10;
  if (hasText(profile.githubUrl)) score += 10;

  return Math.min(100, score);
}


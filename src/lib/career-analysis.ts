import { parseStringList } from "@/lib/career-scoring";

const roleSkillMap: Record<string, string[]> = {
  "ai engineer": ["python", "machine learning", "deep learning", "sql", "vector databases", "llm", "rag", "pytorch"],
  "data scientist": ["python", "statistics", "sql", "machine learning", "data visualization", "experimentation", "pandas"],
  "frontend developer": ["html", "css", "javascript", "typescript", "react", "next.js", "accessibility", "testing"],
  "product manager": ["user research", "roadmapping", "analytics", "prioritization", "communication", "experimentation"],
};

export function normalizeSkill(value: string) {
  return value.trim().toLowerCase();
}

export function targetSkillsForRole(role: string) {
  const key = role.toLowerCase().trim();
  return roleSkillMap[key] ?? roleSkillMap["ai engineer"];
}

export function extractSkillsFromText(text: string) {
  const lower = text.toLowerCase();
  const known = Array.from(new Set(Object.values(roleSkillMap).flat()));
  return known.filter((skill) => lower.includes(skill));
}

export function analyzeResume(input: { resumeText: string; profileSkills: string[]; targetRole?: string }) {
  const targetRole = input.targetRole || "AI Engineer";
  const required = targetSkillsForRole(targetRole);
  const profileSkills = input.profileSkills.map(normalizeSkill);
  const resumeSkills = extractSkillsFromText(input.resumeText);
  const allSkills = Array.from(new Set([...profileSkills, ...resumeSkills]));
  const missingKeywords = required.filter((skill) => !allSkills.includes(skill));

  let score = 35;
  score += Math.min(25, resumeSkills.length * 4);
  score += Math.min(20, required.filter((skill) => allSkills.includes(skill)).length * 3);
  if (/project|built|developed|launched|improved|reduced|increased/i.test(input.resumeText)) score += 10;
  if (/\d+%|\d+\s*(users|projects|hours|months|students|clients)/i.test(input.resumeText)) score += 10;

  const suggestions = [
    missingKeywords.length ? `Add role keywords: ${missingKeywords.slice(0, 6).join(", ")}.` : "Role keywords are well covered.",
    "Add quantified impact bullets for projects, internships, or coursework.",
    "Keep sections clear: summary, skills, projects, education, experience, certifications.",
    "Mirror the target role title and core tools in your summary when truthful.",
  ];

  return {
    targetRole,
    atsScore: Math.min(100, score),
    extractedSkills: resumeSkills,
    missingKeywords,
    suggestions,
  };
}

export function analyzeSkillGap(input: { currentSkillsJson?: string | null; explicitSkills?: string[]; targetRole: string }) {
  const current = Array.from(
    new Set([...(input.explicitSkills ?? []), ...parseStringList(input.currentSkillsJson)].map(normalizeSkill)),
  );
  const required = targetSkillsForRole(input.targetRole);
  const missing = required.filter((skill) => !current.includes(skill));
  const matched = required.filter((skill) => current.includes(skill));

  return {
    targetRole: input.targetRole,
    currentSkills: current,
    matchedSkills: matched,
    missingSkills: missing,
    readiness: Math.round((matched.length / Math.max(required.length, 1)) * 100),
    recommendations: missing.slice(0, 6).map((skill) => `Build ${skill} through one focused project and one certification/module.`),
  };
}

export function buildRoadmap(input: { targetRole: string; missingSkills: string[] }) {
  const skills = input.missingSkills.length ? input.missingSkills : targetSkillsForRole(input.targetRole).slice(0, 5);
  return {
    title: `${input.targetRole} Roadmap`,
    summary: `A 12-week practical roadmap focused on ${skills.slice(0, 4).join(", ")}.`,
    weeks: skills.map((skill, index) => ({
      week: index + 1,
      title: `Build ${skill}`,
      goals: [`Study ${skill} fundamentals`, `Build a small ${skill} artifact`, `Document proof in portfolio`],
    })),
    monthly: [
      { month: 1, focus: "Core foundations and profile cleanup" },
      { month: 2, focus: "Projects, interview practice, and resume improvements" },
      { month: 3, focus: "Applications, mock interviews, and portfolio polish" },
    ],
  };
}


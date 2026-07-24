import { NextRequest, NextResponse } from "next/server";

export type MoodEntry = {
  id: string;
  mood: "great" | "good" | "okay" | "tired" | "burned_out";
  label: string;
  emoji: string;
  createdAt: string;
};

// In-memory fallback for local session storage or backend sync
let MOOD_LOGS: MoodEntry[] = [
  { id: "m1", mood: "good", label: "Good", emoji: "🙂", createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "m2", mood: "great", label: "Great", emoji: "😄", createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "m3", mood: "okay", label: "Okay", emoji: "😐", createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "m4", mood: "good", label: "Good", emoji: "🙂", createdAt: new Date().toISOString() },
];

export async function GET() {
  return NextResponse.json({ logs: MOOD_LOGS, success: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mood, label, emoji } = body;

    if (!mood) {
      return NextResponse.json({ error: "Mood is required" }, { status: 400 });
    }

    const newEntry: MoodEntry = {
      id: `mood-${Date.now()}`,
      mood,
      label: label || "Good",
      emoji: emoji || "🙂",
      createdAt: new Date().toISOString(),
    };

    MOOD_LOGS = [newEntry, ...MOOD_LOGS].slice(0, 14);

    return NextResponse.json({ entry: newEntry, logs: MOOD_LOGS, success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to record mood", details: String(err) }, { status: 500 });
  }
}

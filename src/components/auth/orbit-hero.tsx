import { memo } from "react";
import { Bell, FileText, Tag, Video } from "lucide-react";

const orbitItems = [
  { label: "PDFs", icon: FileText, position: "top-4 left-1/2 -translate-x-1/2", color: "text-[var(--nebula)]" },
  { label: "Reminders", icon: Bell, position: "right-1 top-1/2 -translate-y-1/2", color: "text-[var(--gold)]" },
  { label: "Tags", icon: Tag, position: "bottom-4 left-1/2 -translate-x-1/2", color: "text-[var(--mint)]" },
  { label: "Video links", icon: Video, position: "left-1 top-1/2 -translate-y-1/2", color: "text-[var(--coral)]" },
] as const;

export const OrbitHero = memo(function OrbitHero() {
  return (
    <div className="relative hidden min-h-[500px] items-center justify-center lg:flex">
      <div className="relative h-[440px] w-[440px]">
        <div className="orbit-ring orbit-ring-outer" />
        <div className="orbit-ring orbit-ring-inner" />
        {orbitItems.map(({ label, icon: Icon, position, color }) => (
          <div key={label} className={`orbit-chip ${position}`}>
            <Icon className={`h-3.5 w-3.5 ${color}`} />
            <span>{label}</span>
          </div>
        ))}
        <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,200,87,0.45)] bg-[radial-gradient(circle_at_32%_28%,#232958,var(--void-deep))] shadow-[0_0_32px_rgba(139,127,255,0.22)]">
          <span className="font-mono text-[10px] text-[var(--gold)]">FOCUS</span>
        </div>
      </div>
    </div>
  );
});

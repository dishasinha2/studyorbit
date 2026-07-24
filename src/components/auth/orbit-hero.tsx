"use client";

export function OrbitHero() {
  return (
    <div className="orbit-stage relative flex flex-col items-center justify-center overflow-hidden py-10 min-h-[500px]">
      <div className="orbit-system relative h-[360px] w-[360px] sm:h-[520px] sm:w-[520px]">
        {/* Core */}
        <div className="core absolute top-1/2 left-1/2 z-10 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_28%,#fff,var(--nebula)_45%,var(--nebula-soft)_100%)] shadow-[0_0_60px_12px_rgba(139,127,255,0.45),0_0_0_1px_rgba(255,255,255,0.15)_inset] sm:h-[88px] sm:w-[88px]">
          <span className="absolute top-[110%] left-1/2 -translate-x-1/2 font-['JetBrains_Mono'] text-[11px] tracking-[0.04em] text-[var(--ink-dim)] whitespace-nowrap">
            you, focused
          </span>
        </div>

        {/* Ring 1 */}
        <div className="ring ring-1 absolute top-1/2 left-1/2 h-[150px] w-[150px] sm:h-[200px] sm:w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--line)] animate-[spin_22s_linear_infinite]">
          <div className="moon absolute top-0 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 animate-[cspin_22s_linear_infinite] group cursor-pointer">
            <div className="moon-dot flex h-[34px] w-[34px] sm:h-[38px] sm:w-[38px] items-center justify-center rounded-full border border-[rgba(241,239,255,0.18)] bg-[linear-gradient(155deg,#1c2150,#10142f)] text-sm sm:text-base shadow-[0_0_20px_rgba(139,127,255,0.15)] transition-all duration-300 group-hover:scale-118 group-hover:border-[var(--gold)] group-hover:shadow-[0_0_26px_rgba(255,200,87,0.45)]">
              📄
            </div>
            <div className="moon-label font-['JetBrains_Mono'] text-[10.5px] text-[var(--ink-dim)] bg-[rgba(6,8,20,0.6)] px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 -translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
              pdfs
            </div>
          </div>
        </div>

        {/* Ring 2 */}
        <div className="ring ring-2 absolute top-1/2 left-1/2 h-[230px] w-[230px] sm:h-[320px] sm:w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--line)] animate-[spin_34s_linear_infinite_reverse]">
          <div className="moon absolute top-0 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 animate-[counter_34s_linear_infinite_reverse] group cursor-pointer">
            <div className="moon-dot flex h-[34px] w-[34px] sm:h-[38px] sm:w-[38px] items-center justify-center rounded-full border border-[rgba(241,239,255,0.18)] bg-[linear-gradient(155deg,#1c2150,#10142f)] text-sm sm:text-base shadow-[0_0_20px_rgba(139,127,255,0.15)] transition-all duration-300 group-hover:scale-118 group-hover:border-[var(--gold)] group-hover:shadow-[0_0_26px_rgba(255,200,87,0.45)]">
              ⏰
            </div>
            <div className="moon-label font-['JetBrains_Mono'] text-[10.5px] text-[var(--ink-dim)] bg-[rgba(6,8,20,0.6)] px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 -translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
              reminders
            </div>
          </div>
          <div className="moon absolute top-[100%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 animate-[counter_34s_linear_infinite_reverse] group cursor-pointer">
            <div className="moon-dot flex h-[34px] w-[34px] sm:h-[38px] sm:w-[38px] items-center justify-center rounded-full border border-[rgba(241,239,255,0.18)] bg-[linear-gradient(155deg,#1c2150,#10142f)] text-sm sm:text-base shadow-[0_0_20px_rgba(139,127,255,0.15)] transition-all duration-300 group-hover:scale-118 group-hover:border-[var(--gold)] group-hover:shadow-[0_0_26px_rgba(255,200,87,0.45)]">
              🏷️
            </div>
            <div className="moon-label font-['JetBrains_Mono'] text-[10.5px] text-[var(--ink-dim)] bg-[rgba(6,8,20,0.6)] px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 -translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
              tags
            </div>
          </div>
        </div>

        {/* Ring 3 */}
        <div className="ring ring-3 absolute top-1/2 left-1/2 h-[320px] w-[320px] sm:h-[460px] sm:w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--line)] animate-[spin_50s_linear_infinite]">
          <div className="moon absolute top-0 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 animate-[cspin_50s_linear_infinite] group cursor-pointer">
            <div className="moon-dot flex h-[34px] w-[34px] sm:h-[38px] sm:w-[38px] items-center justify-center rounded-full border border-[rgba(241,239,255,0.18)] bg-[linear-gradient(155deg,#1c2150,#10142f)] text-sm sm:text-base shadow-[0_0_20px_rgba(139,127,255,0.15)] transition-all duration-300 group-hover:scale-118 group-hover:border-[var(--gold)] group-hover:shadow-[0_0_26px_rgba(255,200,87,0.45)]">
              ▶️
            </div>
            <div className="moon-label font-['JetBrains_Mono'] text-[10.5px] text-[var(--ink-dim)] bg-[rgba(6,8,20,0.6)] px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 -translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
              video links
            </div>
          </div>
          <div className="moon absolute top-[100%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 animate-[cspin_50s_linear_infinite] group cursor-pointer">
            <div className="moon-dot flex h-[34px] w-[34px] sm:h-[38px] sm:w-[38px] items-center justify-center rounded-full border border-[rgba(241,239,255,0.18)] bg-[linear-gradient(155deg,#1c2150,#10142f)] text-sm sm:text-base shadow-[0_0_20px_rgba(139,127,255,0.15)] transition-all duration-300 group-hover:scale-118 group-hover:border-[var(--gold)] group-hover:shadow-[0_0_26px_rgba(255,200,87,0.45)]">
              💬
            </div>
            <div className="moon-label font-['JetBrains_Mono'] text-[10.5px] text-[var(--ink-dim)] bg-[rgba(6,8,20,0.6)] px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 -translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
              gpt links
            </div>
          </div>
        </div>
      </div>

      <div className="stage-copy mt-8 text-center max-w-[380px] z-10 px-4">
        <h1 className="font-['Space_Grotesk'] text-2xl font-semibold leading-tight text-[var(--ink)] sm:text-3xl">
          Every topic, <span className="text-[var(--gold)]">one orbit.</span>
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[var(--ink-dim)] sm:text-sm">
          PDFs, reminders, tags, and links — all circling the thing you&apos;re actually studying, instead of scattered across ten tabs.
        </p>
      </div>
    </div>
  );
}



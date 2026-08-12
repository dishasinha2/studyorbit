import { ExternalLink, Music2 } from "lucide-react";

const playlists = [
  { title: "Deep Focus", description: "Open Spotify’s focus playlist in the Spotify app or browser.", href: "https://open.spotify.com/playlist/37i9dQZF1DX8NTLI29BXZa" },
  { title: "Lofi Beats", description: "Open Spotify’s lofi playlist when you want a quieter background.", href: "https://open.spotify.com/playlist/37i9dQZF1DX8Ueb1ThI1S2" },
];

export function MusicPanel() {
  return <section className="panel space-y-4 p-5 sm:p-6"><div><p className="text-xs font-medium text-[var(--ink-dim)]">Audio</p><h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-[var(--ink)]">Background sound</h2></div><div className="grid gap-3 sm:grid-cols-2">{playlists.map((playlist) => <a key={playlist.title} href={playlist.href} target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 transition-all duration-200 hover:border-[var(--nebula)] hover:shadow-sm"><Music2 className="h-4 w-4 text-[var(--nebula)]" /><h3 className="mt-3 text-sm font-semibold text-[var(--ink)]">{playlist.title}</h3><p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">{playlist.description}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--nebula)]">Open Spotify <ExternalLink className="h-3.5 w-3.5" /></span></a>)}</div></section>;
}

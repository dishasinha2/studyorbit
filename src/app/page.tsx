import Link from "next/link";
import { ArrowRight, BrainCircuit, CalendarDays, Check, FileText, Focus, GraduationCap, Lock, Play, Sparkles, TrendingUp } from "lucide-react";
import { SplashScreen } from "@/components/splash-screen";

const features = [
  { icon: BrainCircuit, title: "AI Workspace", text: "A focused space that helps you turn material into progress." },
  { icon: FileText, title: "PDF Intelligence", text: "Ask, summarize, and revisit the documents that matter." },
  { icon: CalendarDays, title: "Smart Calendar", text: "Keep deadlines, milestones, and study plans in view." },
  { icon: Focus, title: "Focus Engine", text: "Build deep-work sessions that fit your day." },
  { icon: GraduationCap, title: "Career Assistant", text: "Connect your learning with your next opportunity." },
  { icon: TrendingUp, title: "Study Analytics", text: "See your momentum and make each week count." },
];
const orbitItems = ["PDFs", "Notes", "Calendar", "Focus", "AI", "Career", "Tasks", "Links", "Resources"];

export default function Home() {
  return <SplashScreen><main className="landing-premium">
    <nav className="landing-nav-premium">
      <Link href="/" className="landing-brand"><span><Sparkles size={16} /></span>StudyOrbit</Link>
      <div className="landing-nav-links"><a href="#features">Features</a><a href="#preview">Workspace</a><span>Pricing <small>Coming soon</small></span><a href="#about">About</a></div>
      <div className="landing-nav-actions"><Link href="/auth" className="landing-signin">Sign in</Link><Link href="/auth" className="landing-primary">Get started <ArrowRight size={15} /></Link></div>
    </nav>
    <section className="landing-hero-premium">
      <div>
        <p className="landing-kicker"><Sparkles size={14} /> Your AI study operating system</p>
        <h1>Study <em>Smarter.</em><br />Stay <em>Focused.</em><br />Achieve More.</h1>
        <p>Everything for your notes, deadlines, focus sessions, and future&mdash;working together in one intelligent space.</p>
        <div className="landing-actions"><Link href="/auth" className="landing-primary">Get Started <ArrowRight size={17} /></Link><a href="#preview" className="landing-secondary"><Play size={14} /> Watch Demo</a></div>
        <div className="landing-trust"><span><Check />Secure</span><span><Check />AI Powered</span><span><Check />Private</span></div>
      </div>
      <div className="landing-core" aria-hidden="true">
        <div className="core-glow" /><div className="core-ring r1" /><div className="core-ring r2" /><div className="core-ring r3" />
        <div className="core-stars"><i /><i /><i /></div>
        {orbitItems.map((item, index) => <span key={item} className={`core-item core-item-${index}`}><i />{item}</span>)}
        <div className="core-orb"><span>STUDY</span><strong>ORBIT</strong><small>AI LEARNING OS</small></div>
      </div>
    </section>
    <section id="features" className="landing-block"><div className="landing-block-head"><p>Built for momentum</p><h2>One intelligent workspace for every study day.</h2></div><div className="landing-feature-grid-premium">{features.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon size={21} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section id="preview" className="landing-preview"><div><p className="landing-kicker">Your workspace, in sync</p><h2>See the whole picture.<br /><em>Stay in the flow.</em></h2><p>Plan a deadline, read a PDF, start a focus session, and ask AI for help&mdash;without switching tools.</p></div><div className="landing-mockup" aria-label="StudyOrbit dashboard preview"><header><span>StudyOrbit</span><i /><i /></header><div className="mockup-grid"><article><small>Today&apos;s focus</small><strong>02:15</strong><p>Deep work remaining</p></article><article><small>Upcoming</small><b>Research paper</b><p>Due Friday &middot; 2 tasks</p></article><article><small>Study streak</small><strong>12 days</strong><p>Keep it going</p></article></div></div></section>
    <section id="about" className="landing-steps"><div className="landing-block-head"><p>How it works</p><h2>A calmer way to learn with AI.</h2></div><div>{[["01", "Create your account", "Set up a private workspace in seconds."], ["02", "Upload your PDFs", "Bring your materials, notes, and goals together."], ["03", "Study with AI", "Stay focused and move confidently forward."]].map(([number, title, description]) => <article key={number}><b>{number}</b><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="landing-final"><Lock size={20} /><p>Ready when you are</p><h2>Ready to build your study workspace?</h2><Link href="/auth" className="landing-primary">Get Started <ArrowRight size={16} /></Link></section>
    <footer className="landing-footer-premium"><Link href="/" className="landing-brand"><span><Sparkles size={14} /></span>StudyOrbit</Link><p>&copy; 2026 StudyOrbit. Private by design.</p><div><a href="#features">Features</a><a href="#about">About</a><a href="https://github.com" target="_blank">GitHub</a><a href="#">Privacy</a></div></footer>
  </main></SplashScreen>;
}

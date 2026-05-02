import { Heart, Bell, MessageCircle, ShieldAlert, ArrowRight, Check, Sparkles, Activity, Pill, CalendarCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-care.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/60">
        <nav className="container flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2 font-display text-xl font-semibold">
            <span className="w-8 h-8 rounded-full bg-gradient-sage grid place-items-center shadow-soft">
              <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
            </span>
            Hearthside
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#problem" className="hover:text-foreground transition-colors">The Problem</a>
            <a href="#agents" className="hover:text-foreground transition-colors">Our Agents</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#team" className="hover:text-foreground transition-colors">Team</a>
          </div>
          <Link to="/dashboard">
            <Button variant="default" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              Open app
            </Button>
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative bg-gradient-warm">
        <div className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(hsl(var(--primary)/0.08) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="container relative grid lg:grid-cols-2 gap-12 lg:gap-16 py-20 lg:py-28 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border text-sm text-muted-foreground shadow-soft">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Powered by IBM watsonx Orchestrate
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] mt-6 text-balance">
              Recovery that <em className="text-primary not-italic">stays with you</em> — long after discharge.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl text-balance">
              Hearthside is a gentle companion for patients managing chronic conditions. Three caring AI agents help with reminders, questions, and the moments that matter most — so no one recovers alone.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/dashboard">
                <Button size="lg" className="rounded-full h-12 px-7 bg-primary hover:bg-primary/90 shadow-warm">
                  Go to my medications <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <a href="#how">
                <Button size="lg" variant="ghost" className="rounded-full h-12 px-6 hover:bg-secondary">
                  See how it works
                </Button>
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {["bg-primary", "bg-accent", "bg-highlight"].map((c, i) => (
                  <span key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-background`} />
                ))}
              </div>
              <p>Designed with patients, nurses & caregivers in mind.</p>
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="relative rounded-[2rem] overflow-hidden shadow-glow border border-border bg-card">
              <img src={heroImage} alt="A calm, sunlit kitchen with a phone showing a gentle medication reminder" className="w-full h-auto object-cover" />
            </div>

            {/* Floating reminder card */}
            <div className="absolute -left-4 lg:-left-10 top-10 bg-card rounded-2xl shadow-warm border border-border p-4 w-64 animate-float-slow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center">
                  <Pill className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">9:00 AM · Today</p>
                  <p className="text-sm font-medium">Time for Metformin 💊</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">"Take with breakfast and a glass of water. Reply DONE when finished."</p>
            </div>

            {/* Floating chat card */}
            <div className="absolute -right-2 lg:-right-8 bottom-8 bg-card rounded-2xl shadow-warm border border-border p-4 w-64 animate-float-slow" style={{ animationDelay: "1.5s" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-primary-glow animate-pulse-soft" />
                <p className="text-xs font-medium text-muted-foreground">Care companion</p>
              </div>
              <p className="text-sm leading-snug">"It's normal to feel tired this week. Want me to schedule a check-in with Dr. Lee?"</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="py-24 lg:py-32">
        <div className="container grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">The problem</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold mt-4 leading-tight text-balance">
              The hardest part of healing happens after the hospital.
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-6 text-lg text-muted-foreground">
            <p>
              Patients with complex chronic conditions like Type 2 Diabetes and Heart Failure leave the hospital with stacks of instructions, new medications, and follow-up appointments — often while still feeling overwhelmed.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              {[
                { stat: "20%", label: "higher readmission rate vs. national average" },
                { stat: "50%", label: "of patients miss or mistime medications" },
                { stat: "1 in 4", label: "skip critical follow-up appointments" },
              ].map((s) => (
                <div key={s.stat} className="rounded-2xl bg-card border border-border p-6 shadow-soft">
                  <p className="font-display text-4xl font-semibold text-primary">{s.stat}</p>
                  <p className="text-sm mt-2 text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AGENTS */}
      <section id="agents" className="py-24 lg:py-32 bg-gradient-soft">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">Three agents, one companion</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold mt-4 leading-tight text-balance">
              A care team that never clocks out.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Built on IBM watsonx Orchestrate, our agents work quietly in the background — coordinating to keep recovery on track without overwhelming anyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-14">
            {[
              {
                icon: Bell,
                tag: "Agent 01",
                title: "The Gentle Reminder",
                desc: "Sends warm, personalized nudges for medications, hydration, and follow-ups — adapting to each patient's rhythm and routines.",
                color: "bg-primary/10 text-primary",
                accent: "bg-primary",
              },
              {
                icon: MessageCircle,
                tag: "Agent 02",
                title: "The Patient Companion",
                desc: "Answers questions in plain language. From 'Can I take this with food?' to 'Why do I feel dizzy?' — always available, never judging.",
                color: "bg-accent/10 text-accent",
                accent: "bg-accent",
              },
              {
                icon: ShieldAlert,
                tag: "Agent 03",
                title: "The Care Escalator",
                desc: "Notices when something feels off — missed doses, concerning symptoms — and quietly loops in caregivers or clinicians before it becomes a crisis.",
                color: "bg-highlight/20 text-foreground",
                accent: "bg-highlight",
              },
            ].map((a, i) => (
              <article key={i} className="group relative rounded-3xl bg-card border border-border p-8 shadow-soft hover:shadow-warm transition-all duration-500 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl ${a.color} grid place-items-center mb-6`}>
                  <a.icon className="w-7 h-7" />
                </div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{a.tag}</p>
                <h3 className="font-display text-2xl font-semibold mt-2">{a.title}</h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">{a.desc}</p>
                <span className={`absolute top-0 left-8 right-8 h-0.5 ${a.accent} rounded-full opacity-60 group-hover:opacity-100 transition-opacity`} />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 lg:py-32">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-12 items-end mb-16">
            <div className="lg:col-span-7">
              <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">How it works</p>
              <h2 className="font-display text-4xl md:text-5xl font-semibold mt-4 leading-tight text-balance">
                From discharge paperwork to a daily companion in minutes.
              </h2>
            </div>
            <p className="lg:col-span-5 text-muted-foreground text-lg">
              Hearthside takes complex care plans and translates them into a calm, daily experience patients actually follow.
            </p>
          </div>

          <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "01", icon: CalendarCheck, title: "Care plan in", desc: "Clinicians upload the discharge plan — meds, follow-ups, vitals to track." },
              { n: "02", icon: Sparkles, title: "Plan translated", desc: "AI reframes complex instructions into clear, friendly daily moments." },
              { n: "03", icon: Activity, title: "Patient supported", desc: "Reminders, chat, and check-ins meet patients where they are." },
              { n: "04", icon: Users, title: "Care loop closed", desc: "Anomalies escalate to caregivers and clinicians — early, gently." },
            ].map((s) => (
              <li key={s.n} className="relative rounded-2xl border border-border p-6 bg-card shadow-soft">
                <span className="font-display text-sm text-primary font-medium">{s.n}</span>
                <s.icon className="w-6 h-6 text-primary mt-3" />
                <h3 className="font-display text-xl font-semibold mt-4">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FOR WHOM */}
      <section className="py-24 lg:py-32 bg-gradient-sage text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="container relative grid lg:grid-cols-2 gap-16">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] opacity-70 font-medium">Built for everyone in the circle of care</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold mt-4 leading-tight text-balance">
              Designed with the people who live this every day.
            </h2>
          </div>
          <div className="space-y-5">
            {[
              { title: "Patients", desc: "Especially those managing diabetes, heart failure, or post-op recovery at home." },
              { title: "Caregivers & family", desc: "Stay quietly in the loop without hovering — receive alerts only when needed." },
              { title: "Nurses & clinicians", desc: "Free up time spent chasing adherence, focus on the care that matters." },
            ].map((g) => (
              <div key={g.title} className="flex gap-4 items-start border-b border-primary-foreground/15 pb-5">
                <Check className="w-5 h-5 mt-1 flex-shrink-0 opacity-80" />
                <div>
                  <h3 className="font-display text-2xl font-semibold">{g.title}</h3>
                  <p className="opacity-80 mt-1">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="py-24 lg:py-32">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">The Fantastic Five</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold mt-4 leading-tight text-balance">
              Built by students who believe care should follow you home.
            </h2>
            <p className="mt-5 text-muted-foreground text-lg">
              An IBM SkillsBuild AI Experiential Learning Lab project.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-14">
            {[
              { name: "Kayla Medina", role: "Team Lead" },
              { name: "Paolo Abueg", role: "Research Lead" },
              { name: "Kaleb Villalaz Diaz", role: "Solution Designer" },
              { name: "Andrew Madrigal", role: "Communication Lead" },
              { name: "Jason Wilaysono", role: "Technical Lead" },
            ].map((m, i) => (
              <div key={m.name} className="rounded-2xl bg-card border border-border p-6 text-center shadow-soft hover:shadow-warm transition-shadow">
                <div className={`mx-auto w-16 h-16 rounded-full grid place-items-center font-display text-xl font-semibold ${
                  ["bg-primary/10 text-primary","bg-accent/15 text-accent","bg-highlight/25 text-foreground","bg-primary/10 text-primary","bg-accent/15 text-accent"][i]
                }`}>
                  {m.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                </div>
                <h3 className="font-display text-lg font-semibold mt-4">{m.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 lg:pb-32">
        <div className="container">
          <div className="relative rounded-[2rem] bg-gradient-warm border border-border p-10 md:p-16 overflow-hidden shadow-warm">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative max-w-2xl">
              <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight text-balance">
                Help us bring patients home — and keep them well.
              </h2>
              <p className="mt-5 text-muted-foreground text-lg">
                Partner with us, share feedback, or just say hello. We'd love to hear from clinicians, caregivers, and anyone who's lived this journey.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/dashboard">
                  <Button size="lg" className="rounded-full h-12 px-7 bg-primary hover:bg-primary/90">
                    Open the app <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <a href="mailto:jdwilaysono@gmail.com">
                  <Button size="lg" variant="outline" className="rounded-full h-12 px-7 border-foreground/20 hover:bg-card">
                    Get in touch
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gradient-sage grid place-items-center">
              <Heart className="w-3 h-3 text-primary-foreground" fill="currentColor" />
            </span>
            <span className="font-display font-semibold text-foreground">Hearthside</span>
            <span>· © 2026 Fantastic Five</span>
          </div>
          <p>An IBM SkillsBuild AI Experiential Learning Lab project.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import React from 'react';
import { NavBar } from '../components/NavBar';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GitCommitHorizontal, Sparkles, Copy, CheckCircle, ArrowRight, Code2, FileText, Share2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const steps = [
    {
      icon: <GitCommitHorizontal size={28} color="var(--c-link)" />,
      step: '01',
      title: 'Connect your repo',
      description: 'Paste any public GitHub repo URL. AutoPost reads the README and codebase to understand your project in seconds.',
      detail: 'No OAuth needed. Just a URL.',
    },
    {
      icon: <Sparkles size={28} color="var(--c-link)" />,
      step: '02',
      title: 'We read your week',
      description: 'Every Saturday, AutoPost scans your commits for the week — what changed, what shipped, what you fixed — and turns it into a natural-sounding narrative.',
      detail: 'Runs automatically, every week.',
    },
    {
      icon: <Copy size={28} color="var(--c-link)" />,
      step: '03',
      title: 'Review, tweak, copy',
      description: 'Your draft lands in the dashboard. Edit it inline if you want, or copy it straight to LinkedIn, Twitter, or wherever you build in public.',
      detail: 'You control every word before it goes out.',
    },
  ];

  const features = [
    {
      icon: <Code2 size={20} color="var(--c-link)" />,
      title: 'Reads actual code changes',
      description: 'Not just commit messages — AutoPost understands diffs, file changes, and patterns to surface what actually matters this week.',
    },
    {
      icon: <FileText size={20} color="var(--c-link)" />,
      title: 'Weekly notes as context',
      description: 'Add raw notes during the week — blockers, insights, learnings. AutoPost weaves them into your draft so nothing gets left out.',
    },
    {
      icon: <CheckCircle size={20} color="var(--c-link)" />,
      title: 'Human review, always',
      description: 'Drafts are never published automatically. You always read, edit, and approve before anything goes anywhere.',
    },
    {
      icon: <Share2 size={20} color="var(--c-link)" />,
      title: 'Platform-agnostic output',
      description: 'Copy your draft and paste it wherever — LinkedIn, Twitter, Substack, Notion. AutoPost doesn\'t lock you into any platform.',
    },
  ];
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--c-canvas)' }}>
      <NavBar />

      {/* ─── Hero ─── */}
      <section style={{ padding: '80px var(--s-lg) 96px', backgroundColor: 'var(--c-canvas)', position: 'relative', overflow: 'hidden' }}>
        {/* Gradient orbs */}
        <div style={{ 
          position: 'absolute', top: '-120px', left: '10%',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(0,112,243,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none'
        }} />
        <div style={{ 
          position: 'absolute', top: '-80px', right: '5%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(121,40,202,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--s-xs)',
            backgroundColor: 'var(--c-canvas-soft-2)', border: '1px solid var(--c-hairline)',
            borderRadius: 'var(--r-full)', padding: '4px 14px',
            marginBottom: 'var(--s-lg)'
          }}>
            <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--c-success)', borderRadius: '50%', display: 'inline-block' }} />
            <span className="t-caption-mono" style={{ color: 'var(--c-mute)' }}>Build in public, without the blank page</span>
          </div>

          <h1 style={{ fontSize: '56px', fontWeight: 700, lineHeight: '1.1', letterSpacing: '-2.5px', color: 'var(--c-ink)', marginBottom: 'var(--s-lg)' }}>
            Your commits already<br />
            <span style={{ color: 'var(--c-link)' }}>tell the story.</span>
          </h1>

          <p className="t-body-lg" style={{ color: 'var(--c-body)', maxWidth: '560px', margin: '0 auto', lineHeight: '1.7', marginBottom: 'var(--s-2xl)' }}>
            AutoPost reads your weekly git history and drafts a LinkedIn-ready update — so you can stay consistent without ever staring at a blank page.
          </p>

          <div style={{ display: 'flex', gap: 'var(--s-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="button-primary" style={{ gap: 'var(--s-xs)', display: 'inline-flex', alignItems: 'center' }}>
              Get started for free <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works" className="button-secondary">See how it works</a>
          </div>

          <p className="t-caption" style={{ color: 'var(--c-mute)', marginTop: 'var(--s-md)' }}>
            No credit card required. Works with any public GitHub repo.
          </p>
        </div>
      </section>

      {/* ─── Live preview ─── */}
      <section style={{ backgroundColor: 'var(--c-canvas-soft)', padding: '80px var(--s-lg)', borderTop: '1px solid var(--c-hairline)', borderBottom: '1px solid var(--c-hairline)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="t-caption-mono" style={{ color: 'var(--c-mute)' }}>HOW A DRAFT IS MADE</span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--s-xl)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Commit input */}
            <div style={{ flex: '1 1 280px' }}>
              <div className="t-caption-mono" style={{ color: 'var(--c-mute)', marginBottom: 'var(--s-sm)', paddingLeft: '2px' }}>YOUR COMMITS THIS WEEK</div>
              <div style={{
                backgroundColor: '#0d1117',
                borderRadius: 'var(--r-md)',
                padding: 'var(--s-lg)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                lineHeight: '22px',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ color: '#f97316' }}>feat: add weekly synthesis engine</div>
                <div style={{ color: '#a3e635' }}>+ commitParser.ts (+148 lines)</div>
                <div style={{ color: '#a3e635' }}>+ draftGenerator.ts (+92 lines)</div>
                <div style={{ color: '#f97316', marginTop: '8px' }}>fix: auth session bug on refresh</div>
                <div style={{ color: '#60a5fa' }}>~ AuthContext.tsx (modified)</div>
                <div style={{ color: '#f97316', marginTop: '8px' }}>chore: upgrade dep versions</div>
                <div style={{ color: '#9ca3af' }}>package.json (modified)</div>
              </div>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', paddingTop: '60px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s-xs)' }}>
                <div style={{ width: '1px', height: '24px', background: 'linear-gradient(to bottom, transparent, var(--c-hairline-strong))' }} />
                <Sparkles size={22} color="var(--c-link)" />
                <div style={{ width: '1px', height: '24px', background: 'linear-gradient(to bottom, var(--c-hairline-strong), transparent)' }} />
              </div>
            </div>

            {/* Draft output */}
            <div style={{ flex: '1 1 280px' }}>
              <div className="t-caption-mono" style={{ color: 'var(--c-mute)', marginBottom: 'var(--s-sm)', paddingLeft: '2px' }}>YOUR DRAFT</div>
              <div className="card" style={{ padding: 'var(--s-lg)' }}>
                <p className="t-body-md" style={{ color: 'var(--c-ink)', lineHeight: '1.7', margin: 0 }}>
                  Big week for AutoPost. 🔨<br /><br />
                  Shipped the core draft generation engine — it now parses weekly commits and turns them into a coherent narrative automatically.<br /><br />
                  Also squashed a nasty auth bug that was dropping sessions on hard refresh.<br /><br />
                  <span style={{ color: 'var(--c-mute)' }}>#buildinpublic #shipping</span>
                </p>
                <div style={{ marginTop: 'var(--s-md)', display: 'flex', gap: 'var(--s-xs)' }}>
                  <span className="t-caption" style={{ backgroundColor: 'var(--c-canvas-soft-2)', borderRadius: 'var(--r-sm)', padding: '2px 8px', color: 'var(--c-mute)' }}>DRAFT</span>
                  <span className="t-caption" style={{ color: 'var(--c-mute)' }}>3 commits · this week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" style={{ padding: '96px var(--s-lg)', backgroundColor: 'var(--c-canvas)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="t-caption-mono" style={{ color: 'var(--c-mute)', display: 'block', marginBottom: 'var(--s-sm)' }}>HOW IT WORKS</span>
            <h2 className="t-display-lg" style={{ margin: 0 }}>Three steps. Zero friction.</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ 
                display: 'flex', gap: 'var(--s-2xl)', alignItems: 'flex-start',
                padding: '48px 0',
                borderBottom: i < steps.length - 1 ? '1px solid var(--c-hairline)' : 'none',
                flexWrap: 'wrap'
              }}>
                {/* Step number + icon */}
                <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--s-md)', minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-sm)' }}>
                    <div style={{
                      width: '44px', height: '44px',
                      backgroundColor: 'var(--c-canvas-soft-2)',
                      border: '1px solid var(--c-hairline)',
                      borderRadius: 'var(--r-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {step.icon}
                    </div>
                    <span className="t-caption-mono" style={{ color: 'var(--c-mute)' }}>{step.step}</span>
                  </div>
                  <h3 className="t-display-sm" style={{ margin: 0, color: 'var(--c-ink)' }}>{step.title}</h3>
                </div>

                {/* Step detail */}
                <div style={{ flex: '1 1 300px', paddingTop: '4px' }}>
                  <p className="t-body-lg" style={{ color: 'var(--c-body)', lineHeight: '1.7', margin: '0 0 var(--s-md) 0' }}>
                    {step.description}
                  </p>
                  <span className="t-caption-mono" style={{ 
                    color: 'var(--c-link)', 
                    backgroundColor: 'rgba(0,112,243,0.08)', 
                    borderRadius: 'var(--r-sm)', 
                    padding: '4px 10px',
                    display: 'inline-block'
                  }}>
                    {step.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features grid ─── */}
      <section style={{ padding: '96px var(--s-lg)', backgroundColor: 'var(--c-canvas-soft)', borderTop: '1px solid var(--c-hairline)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="t-caption-mono" style={{ color: 'var(--c-mute)', display: 'block', marginBottom: 'var(--s-sm)' }}>FEATURES</span>
            <h2 className="t-display-lg" style={{ margin: 0 }}>Built for developers who actually ship.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--s-lg)' }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ padding: 'var(--s-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--s-md)' }}>
                <div style={{
                  width: '40px', height: '40px',
                  backgroundColor: 'rgba(0,112,243,0.08)',
                  borderRadius: 'var(--r-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {f.icon}
                </div>
                <h3 className="t-body-sm-strong" style={{ margin: 0 }}>{f.title}</h3>
                <p className="t-body-sm" style={{ color: 'var(--c-body)', margin: 0, lineHeight: '1.6' }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why not just ChatGPT ─── */}
      <section style={{ padding: '96px var(--s-lg)', backgroundColor: 'var(--c-canvas)', borderTop: '1px solid var(--c-hairline)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="t-display-md" style={{ marginBottom: 'var(--s-lg)' }}>
            "Can't I just ask ChatGPT?"
          </h2>
          <p className="t-body-lg" style={{ color: 'var(--c-body)', lineHeight: '1.7', marginBottom: 'var(--s-xl)' }}>
            Sure — once you've figured out what to tell it. The hard part isn't the writing. It's sitting down every week and remembering what was actually meaningful. AutoPost reads what you <em>did</em>, so you skip that step entirely.
          </p>
          <div style={{ display: 'flex', gap: 'var(--s-lg)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'left' }}>
              <div className="t-body-sm-strong" style={{ marginBottom: '4px' }}>Without AutoPost</div>
              <div className="t-body-sm" style={{ color: 'var(--c-mute)' }}>
                🤔 Remember what you did<br />
                ✍️ Summarize it manually<br />
                💬 Prompt an AI<br />
                😬 Edit the AI's generic output<br />
                ⏩ Post it (if you haven't given up)
              </div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'var(--c-hairline)' }} />
            <div style={{ textAlign: 'left' }}>
              <div className="t-body-sm-strong" style={{ marginBottom: '4px', color: 'var(--c-link)' }}>With AutoPost</div>
              <div className="t-body-sm" style={{ color: 'var(--c-body)' }}>
                📂 Open dashboard<br />
                👀 Read the draft<br />
                ✅ Copy and post
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '96px var(--s-lg)', backgroundColor: 'var(--c-ink)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '400px',
          background: 'radial-gradient(circle, rgba(0,112,243,0.3) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '40px', fontWeight: 700, color: '#ffffff', letterSpacing: '-1.5px', marginBottom: 'var(--s-md)' }}>
            Start building in public.<br />Starting this Saturday.
          </h2>
          <p className="t-body-lg" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 'var(--s-2xl)' }}>
            Add your first repo in 30 seconds.
          </p>
          <Link to="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--s-xs)',
            backgroundColor: '#ffffff', color: '#0a0a0a',
            borderRadius: 'var(--r-pill)', padding: '0 var(--s-xl)', height: '52px',
            fontWeight: 600, fontSize: '15px', textDecoration: 'none'
          }}>
            Create free account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ padding: 'var(--s-xl) var(--s-lg)', backgroundColor: 'var(--c-canvas)', borderTop: '1px solid var(--c-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--s-md)' }}>
        <span className="t-body-sm-strong" style={{ color: 'var(--c-ink)' }}>AutoPost</span>
        <p className="t-caption-mono" style={{ color: 'var(--c-mute)', margin: 0 }}>Built for AccioBuild 2026</p>
        <div style={{ display: 'flex', gap: 'var(--s-md)' }}>
          <Link to="/signup" className="t-caption" style={{ color: 'var(--c-mute)' }}>Sign up</Link>
          <Link to="/login" className="t-caption" style={{ color: 'var(--c-mute)' }}>Log in</Link>
        </div>
      </footer>
    </div>
  );
};

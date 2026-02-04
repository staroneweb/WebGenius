/**
 * GeneratingLoader – Cool GIF (no box) + live code stream
 */
import React, { useState, useEffect } from 'react';

// Single cool cat-coding GIF (illustration style, no box) – Tenor
const COOL_GIF = 'https://media1.tenor.com/m/LSDeBe2JAfoAAAAd/cat-coding.gif';

// Fake "live" code lines
const CODE_LINES = [
  { text: 'const website = await ai.generate();', type: 'js' },
  { text: '<div className="your-site">...</div>', type: 'html' },
  { text: '.hero { background: var(--accent); }', type: 'css' },
  { text: '// Our AI (and this legend) are on it 🐱', type: 'comment' },
  { text: 'return { html, css, js };', type: 'js' },
  { text: 'npm run build... just kidding, we got you', type: 'comment' },
  { text: 'export default function App() { ... }', type: 'js' },
  { text: '// Compiling good vibes only ✨', type: 'comment' },
];

export function GeneratingLoader() {
  const [codeIndex, setCodeIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCodeIndex((i) => (i + 1) % CODE_LINES.length);
    }, 1200);
    return () => clearInterval(t);
  }, []);

  const currentCode = CODE_LINES[codeIndex];

  return (
    <div className="flex-1 flex items-center justify-center min-h-[380px] p-4">
      <div className="text-center space-y-6 max-w-lg mx-auto">
        <style>{`
          @keyframes gen-code-in {
            0% { opacity: 0; transform: translateY(4px); }
            20% { opacity: 1; transform: translateY(0); }
            80% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-4px); }
          }
          .gen-code-line { animation: gen-code-in 1.2s ease-out forwards; }
        `}</style>

        {/* GIF – no box; blend removes white/light background */}
        <div className="flex justify-center [isolation:isolate]">
          <img
            src={COOL_GIF}
            alt="Cat coding"
            className="w-[320px] h-auto max-h-[220px] object-contain drop-shadow-2xl mix-blend-multiply dark:brightness-110 dark:contrast-105"
          />
        </div>

        {/* "Live" code strip */}
        <div className="rounded-xl bg-[#0d1117] border border-border overflow-hidden text-left">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-[#161b22]">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="ml-2 text-[10px] text-muted-foreground font-mono">generating.tsx</span>
          </div>
          <div className="px-3 py-2.5 font-mono text-xs min-h-[44px] flex items-center">
            <span className="text-muted-foreground select-none">$ </span>
            <span key={codeIndex} className="gen-code-line inline-block ml-1">
              {currentCode.type === 'comment' ? (
                <span className="text-gray-500">{currentCode.text}</span>
              ) : currentCode.type === 'js' ? (
                <span className="text-green-400">{currentCode.text}</span>
              ) : currentCode.type === 'html' ? (
                <span className="text-orange-300">{currentCode.text}</span>
              ) : (
                <span className="text-pink-300">{currentCode.text}</span>
              )}
            </span>
            <span className="inline-block w-2 h-4 ml-0.5 bg-green-500 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Generating your website...</h3>
          <p className="text-sm text-muted-foreground">
            Our AI is crafting your site with care
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

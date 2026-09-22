"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicScene } from "@/lib/scenes";
import { LEVER_IDS, LEVER_LABELS, type Lever } from "@/lib/levers";

type Pulls = Partial<Record<Lever, number>>;
type Msg = {
  speaker: "npc" | "player";
  text: string;
  moodLabel?: string;
  closing?: boolean;
  pulls?: Pulls;
  lever?: Lever | null;
  guarded?: boolean;
  nonTurn?: "silence" | "unclear" | "free" | "unsure";
  guard?: "meta" | "contradiction" | null;
  /** Only with ?debug=1: what the server sent back for this attempt, kept so the whole game can be copied. */
  debug?: TurnDebug;
};
type TurnDebug = {
  meter?: number;
  delta?: number;
  repeat?: boolean;
  instantWin?: string | null;
  answers?: Record<string, { score?: number; noul?: number }>;
};
type Status = "playing" | "won" | "lost";

type TurnResponse = {
  npcLine: string;
  mood: string;
  moodLabel: string;
  attemptsLeft: number;
  bonus?: boolean;
  status: Status;
  closingLine: string | null;
  pulls: Pulls;
  lever: Lever | null;
  guarded: boolean;
  nonTurn?: "silence" | "unclear" | "free" | "unsure";
  guard?: "meta" | "contradiction" | null;
  stateToken: string;
  debug?: TurnDebug;
  error?: string;
};

const DOTS = ["", "●", "●●", "●●●"];

function strength(v: number | undefined): number {
  if (!v || v < 0.5) return 0;
  if (v < 1.5) return 1;
  if (v < 2.5) return 2;
  return 3;
}

export default function Game({
  scenes,
  startIndex,
  maxAttempts,
  maxChars,
  debugOn,
}: {
  scenes: PublicScene[];
  startIndex: number;
  maxAttempts: number;
  maxChars: number;
  debugOn: boolean;
}) {
  const [index, setIndex] = useState(startIndex);
  const scene = scenes[index % scenes.length];

  const [messages, setMessages] = useState<Msg[]>([{ speaker: "npc", text: scene.openingLine }]);
  const [token, setToken] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(maxAttempts);
  const [status, setStatus] = useState<Status>("playing");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<unknown>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [bonus, setBonus] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (messages.length > 1) formRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy, status]);

  const reset = useCallback(
    (nextIndex: number) => {
      const s = scenes[nextIndex % scenes.length];
      setIndex(nextIndex % scenes.length);
      setMessages([{ speaker: "npc", text: s.openingLine }]);
      setToken(null);
      setAttemptsLeft(maxAttempts);
      setStatus("playing");
      setBonus(false);
      setText("");
      setError(null);
      setDebug(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [scenes, maxAttempts],
  );

  async function submit() {
    const t = text.trim();
    if (!t || busy || status !== "playing") return;
    setBusy(true);
    setError(null);
    setMessages((m) => [...m, { speaker: "player", text: t }]);
    try {
      const res = await fetch(`/api/turn${debugOn ? "?debug=1" : ""}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sceneId: scene.id, stateToken: token, text: t }),
      });
      const data = (await res.json()) as TurnResponse;
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setToken(data.stateToken);
      setAttemptsLeft(data.attemptsLeft);
      setBonus(Boolean(data.bonus));
      setStatus(data.status);
      setDebug(data.debug ?? null);
      setMessages((m) => {
        const withPulls = m.map((msg, i) =>
          i === m.length - 1 && msg.speaker === "player"
            ? { ...msg, pulls: data.pulls, lever: data.lever, guarded: data.guarded, guard: data.guard, nonTurn: data.nonTurn, debug: data.debug }
            : msg,
        );
        const next: Msg[] = [...withPulls, { speaker: "npc", text: data.npcLine, moodLabel: data.moodLabel }];
        if (data.closingLine) next.push({ speaker: "npc", text: data.closingLine, closing: true });
        return next;
      });
      setText("");
    } catch (e) {
      setMessages((m) => (m[m.length - 1]?.speaker === "player" ? m.slice(0, -1) : m));
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  }

  const attemptNo = maxAttempts - attemptsLeft + 1;

  return (
    <main className="game-page">
      <div className="game-shell">
        <header className="game-header">
          <Link className="wordmark" href="/" aria-label="Talk Your Way Out home">
            talk your way out<span>.</span>
          </Link>
          <button type="button" className="ghost-button" onClick={() => reset(index + 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" />
            </svg>
            Next scene
          </button>
        </header>

        <div className="game-column">
          <section className="challenge" aria-labelledby="scene-title">
            <h1 id="scene-title">
              {scene.title}
              <span className="heading-period">.</span>
            </h1>
            <p className="instruction">{scene.situation}</p>
            <p className="target-goal">{scene.playerGoal}</p>
          </section>

          <section className="exchange" aria-live="polite">
            <ol>
              {messages.map((m, i) => (
                <Turn key={i} msg={m} npcRole={scene.npcRole} />
              ))}
              {busy && (
                <li className="turn-npc">
                  <div className="turn-meta"><span>{scene.npcRole}</span></div>
                  <span className="thinking" aria-label="They are replying"><i /><i /><i /></span>
                </li>
              )}
            </ol>
          </section>

          {status !== "playing" ? (
            <div className={`result-banner${status === "won" ? " won" : ""}`}>
              <h2>{status === "won" ? scene.winVerdict : scene.loseVerdict}</h2>
              <p>{status === "won" ? "You got what you wanted." : "Not this time."}</p>
              <div className="result-actions">
                <button type="button" className="guess-button" onClick={() => reset(index)}>Play again</button>
                <button type="button" className="secondary-button" onClick={() => reset(index + 1)}>Next scene</button>
              </div>
            </div>
          ) : (
            <form
              ref={formRef}
              className="guess-form"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <div className="label-row">
                <label htmlFor="attempt">{bonus ? "They're wavering" : "Your move"}</label>
                <span>
                  {bonus ? <span className="bonus">One last thing</span> : <>Attempt {attemptNo} of {maxAttempts}</>} &middot; <span className={`counter${text.length > maxChars ? " over" : ""}`}>{text.length}/{maxChars}</span>
                </span>
              </div>
              <textarea
                id="attempt"
                ref={inputRef}
                className="guess-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKey}
                disabled={busy}
                rows={2}
                maxLength={maxChars}
                autoFocus
                placeholder={bonus ? "Say the thing that tips it." : "What do you say?"}
              />
              {error && (
                <p className="error-message">
                  <span>{error}</span>
                  <button type="button" onClick={() => void submit()}>Retry</button>
                </p>
              )}
              <button type="submit" className="guess-button" disabled={busy || !text.trim()}>
                {busy ? "Saying it" : "Say it"}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </form>
          )}

          {debugOn && messages.length > 1 && <CopyTranscript title={scene.title} npcRole={scene.npcRole} messages={messages} />}

          {debugOn && debug != null && (
            <details className="debug">
              <summary>debug</summary>
              <pre>{JSON.stringify(debug, null, 2)}</pre>
            </details>
          )}

          <footer className="game-footer">
            <button type="button" className="help-button" onClick={() => setHelpOpen((v) => !v)}>How to play</button>
            <span className="footer-divider" aria-hidden="true" />
            <a href="https://typesafe.ai" target="_blank" rel="noreferrer">Powered by Jev</a>
          </footer>
          {helpOpen && (
            <div className="help-copy">
              <p>Someone stands between you and what you want. You have {maxAttempts} attempts to talk your way past them. Type what you would actually say. Thanks, a quick answer or a simple question is just talk and costs nothing, but they won&apos;t wait forever.</p>
              <p>Every attempt is read for the moves it makes: compassion, respect, honesty, self-interest, compromise, humour, pressure, bribe, guilt. Each person is open to some and allergic to others. Find what works on this one.</p>
              <p>They reply in character. That reply, and the mood under it, is all the feedback you get. A great move can win on the spot. A bad one can bury you.</p>
              <p>If your last attempt leaves them wavering, you get one more thing to say. Make it count.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Turn({ msg, npcRole }: { msg: Msg; npcRole: string }) {
  if (msg.speaker === "player") {
    const read = msg.pulls
      ? LEVER_IDS.filter((id) => strength(msg.pulls?.[id]) > 0).sort((a, b) => (msg.pulls?.[b] ?? 0) - (msg.pulls?.[a] ?? 0))
      : [];
    return (
      <li className="turn-you">
        <div className="turn-meta"><span>You</span></div>
        <p className="turn-text">{msg.text}</p>
        {msg.nonTurn === "silence" ? (
          <p className="read-as">Read as saying nothing. No attempt used.</p>
        ) : msg.nonTurn === "unclear" ? (
          <p className="read-as">Read as not words. No attempt used.</p>
        ) : msg.nonTurn === "free" ? (
          <p className="read-as">Read as small talk. No attempt used.</p>
        ) : msg.nonTurn === "unsure" ? (
          <p className="read-as">Not sure what you meant. No attempt used.</p>
        ) : msg.guarded ? (
          <p className="read-as">
            {msg.guard === "contradiction" ? "Read as contradicting what's already happened." : "Read as talking to the game, not to them."}
          </p>
        ) : read.length > 0 ? (
          <p className="read-as tags" aria-label="Read as">
            {read.map((id) => (
              <span key={id} className={`tag${id === msg.lever ? " lead" : ""}`}>
                {LEVER_LABELS[id]} <span className="dots">{DOTS[strength(msg.pulls?.[id])]}</span>
              </span>
            ))}
          </p>
        ) : msg.pulls ? (
          <p className="read-as">Read as nothing in particular.</p>
        ) : null}
      </li>
    );
  }
  if (msg.closing) {
    return (
      <li className="turn-closing">
        <p className="turn-text">{msg.text}</p>
      </li>
    );
  }
  return (
    <li className="turn-npc">
      <div className="turn-meta">
        <span>{npcRole}</span>
        {msg.moodLabel && <span className="mood">{msg.moodLabel}</span>}
      </div>
      <p className="turn-text">{msg.text}</p>
    </li>
  );
}

/** Playtest only (?debug=1): the whole game as plain text, to paste into a message. Nothing is stored or sent. */
function transcriptText(title: string, npcRole: string, messages: Msg[]): string {
  const n = (v: number | undefined) => (typeof v === "number" ? v.toFixed(2) : "-");
  const lines = [`Scene: ${title}`, ""];
  for (const m of messages) {
    if (m.speaker === "npc") {
      lines.push(m.closing ? `  (${m.text})` : `${npcRole}${m.moodLabel ? ` [${m.moodLabel}]` : ""}: ${m.text}`);
      continue;
    }
    lines.push(`YOU: ${m.text}`);
    const read =
      m.nonTurn === "silence" ? "silence (free)"
      : m.nonTurn === "unclear" ? "not words (free)"
      : m.nonTurn === "free" ? "small talk (free)"
      : m.nonTurn === "unsure" ? "unsure guard, puzzled (free)"
      : m.guarded ? `guard: ${m.guard}`
      : LEVER_IDS.filter((id) => (m.pulls?.[id] ?? 0) >= 0.5).map((id) => `${LEVER_LABELS[id]} ${m.pulls?.[id]}`).join(", ") || "nothing";
    const d = m.debug;
    const a = d?.answers ?? {};
    const meter = d ? ` | meter ${d.meter} (${(d.delta ?? 0) >= 0 ? "+" : ""}${d.delta})${d.repeat ? " repeat" : ""}${d.instantWin ? ` instant win: ${d.instantWin}` : ""}` : "";
    lines.push(`  read: ${read}${meter}`);
    if (d) {
      lines.push(`  believable ${n(a.plausibility?.score)} | small talk ${n(a.is_small_talk?.noul)} | stock ${n(a.is_stock_line?.noul)} | to the game ${n(a.is_meta_instruction?.noul)} | contradiction ${n(a.contradicts_situation?.noul)}`);
    }
  }
  return lines.join("\n");
}

function CopyTranscript({ title, npcRole, messages }: { title: string; npcRole: string; messages: Msg[] }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const text = transcriptText(title, npcRole, messages);
  return (
    <div className="debug">
      <button
        type="button"
        className="secondary-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setState("copied");
          } catch {
            setState("failed");
          }
        }}
      >
        {state === "copied" ? "Copied" : "Copy transcript for feedback"}
      </button>
      {state === "failed" && <pre>{text}</pre>}
    </div>
  );
}


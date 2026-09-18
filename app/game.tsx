"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicScene } from "@/lib/scenes";

type Msg = { speaker: "npc" | "player"; text: string; moodLabel?: string; closing?: boolean };
type Status = "playing" | "won" | "lost";

type TurnResponse = {
  npcLine: string;
  mood: string;
  moodLabel: string;
  attemptsLeft: number;
  status: Status;
  closingLine: string | null;
  stateToken: string;
  debug?: unknown;
  error?: string;
};

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy, status]);

  const reset = useCallback(
    (nextIndex: number) => {
      const s = scenes[nextIndex % scenes.length];
      setIndex(nextIndex % scenes.length);
      setMessages([{ speaker: "npc", text: s.openingLine }]);
      setToken(null);
      setAttemptsLeft(maxAttempts);
      setStatus("playing");
      setText("");
      setError(null);
      setDebug(null);
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
      setStatus(data.status);
      setDebug(data.debug ?? null);
      setMessages((m) => {
        const next: Msg[] = [...m, { speaker: "npc", text: data.npcLine, moodLabel: data.moodLabel }];
        if (data.closingLine) next.push({ speaker: "npc", text: data.closingLine, closing: true });
        return next;
      });
      setText("");
    } catch (e) {
      // Do not consume the attempt: remove the optimistic player message and keep the text.
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

  const used = maxAttempts - attemptsLeft;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h1 className="text-sm font-semibold uppercase tracking-widest text-muted">Talk Your Way Out</h1>
        <span className="text-sm text-muted">
          {index + 1} / {scenes.length}
        </span>
      </header>

      <section className="rounded-2xl border border-border bg-panel p-4 sm:p-5">
        <h2 className="text-2xl font-bold leading-tight">{scene.title}</h2>
        <p className="mt-2 text-fg/90">{scene.situation}</p>
        <p className="mt-3 font-semibold text-accent">{scene.playerGoal}</p>
        <p className="mt-3 text-sm text-muted">You get {maxAttempts} attempts.</p>
      </section>

      <section className="mt-4 flex flex-1 flex-col gap-3" aria-live="polite">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} npcRole={scene.npcRole} />
        ))}
        {busy && (
          <div className="self-start rounded-2xl rounded-bl-sm border border-border bg-panel px-4 py-3">
            <span className="typing" aria-label="They are replying">
              <i /><i /><i />
            </span>
          </div>
        )}
        {status !== "playing" && (
          <div className="mt-2 rounded-2xl border border-accent/40 bg-panel-2 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {status === "won" ? "You did it" : "Not this time"}
            </p>
            <p className="mt-1 text-xl font-bold">{status === "won" ? scene.winVerdict : scene.loseVerdict}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => reset(index)}
                className="flex-1 rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-fg active:scale-[0.98]"
              >
                Play again
              </button>
              <button
                type="button"
                onClick={() => reset(index + 1)}
                className="flex-1 rounded-xl border border-border bg-panel px-4 py-3 text-base font-semibold text-fg active:scale-[0.98]"
              >
                Next scene
              </button>
            </div>
          </div>
        )}
        {debugOn && debug != null && (
          <details className="mt-2 rounded-xl border border-border bg-panel p-3 text-xs text-muted">
            <summary className="cursor-pointer select-none">debug</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(debug, null, 2)}</pre>
          </details>
        )}
        <div ref={bottomRef} />
      </section>

      {status === "playing" && (
        <form
          className="sticky bottom-0 mt-4 border-t border-border bg-bg pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="mb-2 flex items-center justify-between text-sm text-muted">
            <span className="dots flex items-center gap-1.5" aria-label={`${attemptsLeft} attempts left`}>
              {Array.from({ length: maxAttempts }).map((_, i) => (
                <span
                  key={i}
                  className={`inline-block h-2.5 w-2.5 rounded-full ${i < used ? "bg-accent" : "bg-border"}`}
                />
              ))}
              <span className="ml-2">{attemptsLeft} left</span>
            </span>
            <span className={text.length > maxChars ? "text-danger" : ""}>
              {text.length} / {maxChars}
            </span>
          </div>
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            disabled={busy}
            rows={3}
            maxLength={maxChars}
            autoFocus
            placeholder="Say something..."
            className="w-full resize-none rounded-xl border border-border bg-panel px-4 py-3 text-base text-fg placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-60"
          />
          {error && (
            <div className="mt-2 flex items-center justify-between gap-3 text-sm text-danger">
              <span>{error}</span>
              <button type="button" onClick={() => void submit()} className="shrink-0 underline">
                Retry
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="mt-2 w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-fg disabled:opacity-40 active:scale-[0.98]"
          >
            {busy ? "..." : "Say it"}
          </button>
        </form>
      )}
    </main>
  );
}

function Bubble({ msg, npcRole }: { msg: Msg; npcRole: string }) {
  if (msg.speaker === "player") {
    return (
      <div className="max-w-[88%] self-end rounded-2xl rounded-br-sm bg-player px-4 py-3 text-fg">
        {msg.text}
      </div>
    );
  }
  if (msg.closing) {
    return <p className="mt-1 px-1 italic text-muted">{msg.text}</p>;
  }
  return (
    <div className="max-w-[92%] self-start">
      <div className="rounded-2xl rounded-bl-sm border border-border bg-panel px-4 py-3">
        <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wider text-muted">{npcRole}</span>
        {msg.text}
      </div>
      {msg.moodLabel && <p className="mt-1 px-1 text-sm text-muted">{msg.moodLabel}</p>}
    </div>
  );
}

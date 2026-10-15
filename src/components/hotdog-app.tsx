"use client";

import { useEffect, useRef, useState } from "react";
import { prepareImage } from "@/lib/prepare-image";

type State =
  | { status: "idle" }
  | { status: "evaluating"; preview: string }
  | { status: "done"; preview: string; hotdog: boolean }
  | { status: "error"; preview?: string; message: string };

export function HotdogApp() {
  const [state, setState] = useState<State>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = "preview" in state ? state.preview : undefined;

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    let url: string | undefined;
    try {
      const blob = await prepareImage(file);
      url = URL.createObjectURL(blob);
      setState({ status: "evaluating", preview: url });

      const body = new FormData();
      body.append("photo", blob, "photo.jpg");
      const res = await fetch("/api/classify", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setState({ status: "done", preview: url, hotdog: data.hotdog });
    } catch (err) {
      setState({
        status: "error",
        preview: url,
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const pick = () => inputRef.current?.click();

  return (
    <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-neutral-900 text-white">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL
        <img
          src={preview}
          alt="Your photo"
          className={`absolute inset-0 h-full w-full object-cover transition ${
            state.status === "evaluating" ? "scale-105 blur-sm brightness-75" : ""
          }`}
        />
      ) : (
        <Intro onStart={pick} />
      )}

      {state.status === "evaluating" && <Evaluating />}
      {state.status === "done" && <Verdict hotdog={state.hotdog} />}
      {state.status === "error" && (
        <div className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] rounded-2xl bg-black/80 p-4 text-center font-bold">
          {state.message}
        </div>
      )}

      {preview && state.status !== "evaluating" && (
        <button
          onClick={pick}
          className={`absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-white px-8 py-3 text-lg font-bold text-neutral-900 shadow-lg active:scale-95 ${
            state.status === "done" && !state.hotdog
              ? "top-[max(1.5rem,env(safe-area-inset-top))]"
              : "bottom-[max(1.5rem,env(safe-area-inset-bottom))]"
          }`}
        >
          New photo
        </button>
      )}
    </main>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="text-7xl" aria-hidden>
        🌭
      </div>
      <h1 className="text-5xl font-bold leading-tight [text-shadow:0_3px_0_#000]">
        Not Hotdog
      </h1>
      <p className="max-w-xs text-lg text-neutral-300">
        Take a photo of any food. We will tell you if it is a hotdog.
      </p>
      <button
        onClick={onStart}
        className="w-full max-w-xs rounded-full bg-[#e3262b] py-4 text-2xl font-bold shadow-lg active:scale-95"
      >
        Take photo
      </button>
    </div>
  );
}

function Evaluating() {
  const dots = 10;
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-10">
      <div className="relative h-28 w-28 animate-spin [animation-duration:1.2s]">
        {Array.from({ length: dots }, (_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full border-2 border-neutral-800 bg-[#e86b7a]"
            style={{
              width: 10 + i * 1.2,
              height: 10 + i * 1.2,
              opacity: 0.35 + (i / dots) * 0.65,
              transform: `translate(-50%, -50%) rotate(${(i * 360) / dots}deg) translateY(-48px)`,
            }}
          />
        ))}
      </div>
      <p className="text-4xl font-bold [text-shadow:0_3px_0_#000,0_0_8px_#000]">
        Evaluating...
      </p>
    </div>
  );
}

function Verdict({ hotdog }: { hotdog: boolean }) {
  const color = hotdog ? "#3dae2b" : "#c8181e";
  const badge = (
    <div
      className="flex h-24 w-24 items-center justify-center rounded-full"
      style={{ background: color }}
    >
      <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
        {hotdog ? <path d="M4 12.5l5 5L20 6.5" /> : <path d="M5 5l14 14M19 5L5 19" />}
      </svg>
    </div>
  );
  const label = (
    <p className="text-4xl font-bold [text-shadow:0_3px_0_rgba(0,0,0,.6)]">
      {hotdog ? "Hotdog" : "Not hotdog"}
    </p>
  );

  return hotdog ? (
    <div className="absolute inset-x-0 top-0 z-10 flex flex-col items-center" role="status">
      <div className="w-full pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-center" style={{ background: color }}>
        {label}
      </div>
      <div className="-mt-6">{badge}</div>
    </div>
  ) : (
    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center" role="status">
      <div className="-mb-6 relative z-10">{badge}</div>
      <div className="w-full pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center" style={{ background: color }}>
        {label}
      </div>
    </div>
  );
}

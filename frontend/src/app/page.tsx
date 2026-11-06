"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "reachable" | "unreachable";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Home() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/health`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { status?: string }) =>
        setStatus(body.status === "ok" ? "reachable" : "unreachable"),
      )
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("unreachable");
      });

    return () => controller.abort();
  }, []);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Wellness Robot</h1>
      <p>
        Backend: <strong data-testid="backend-status">{status}</strong>
      </p>
    </main>
  );
}

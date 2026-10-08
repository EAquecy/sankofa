"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function useMutate() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(fn: () => Promise<{ error: any } | any>, after?: () => void) {
    setBusy(true); setError(null);
    try {
      const r = await fn();
      if (r?.error) { setError(r.error.message ?? String(r.error)); return false; }
      after?.();
      router.refresh();
      return true;
    } catch (e: any) { setError(e.message); return false; }
    finally { setBusy(false); }
  }
  return { busy, error, run, setError };
}

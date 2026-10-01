import { useSyncExternalStore } from "react";

export type Choice = "granted" | "denied" | null;

export function readSavedChoice(): Choice {
  try {
    const saved = localStorage.getItem("ghstats-analytics-consent");
    return saved === "granted" || saved === "denied" ? saved : null;
  } catch {
    return null;
  }
}

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

/** Keep server/initial hydration hidden, then reveal the saved consent state. */
export function useConsentReady(): boolean {
  return useSyncExternalStore(subscribe, clientReady, serverReady);
}

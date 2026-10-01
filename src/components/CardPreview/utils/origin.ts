import { useSyncExternalStore } from "react";
import { SITE } from "@/lib/site";

const subscribe = () => () => {};
const getSnapshot = () => window.location.origin;
const getServerSnapshot = () => SITE.url;

/** Hydration-safe browser origin without a synchronous state-setting effect. */
export function usePreviewOrigin(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

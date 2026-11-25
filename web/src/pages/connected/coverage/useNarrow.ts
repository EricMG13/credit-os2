import { useEffect, useState } from "react";

const PHONE = "(max-width: 767px)";

/** Whether the screen is narrower than a tablet; false where the browser cannot say. */
export function useNarrow(): boolean {
  const query = () => typeof window.matchMedia === "function" && window.matchMedia(PHONE).matches;
  const [narrow, setNarrow] = useState(query);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(PHONE);
    const change = () => {
      setNarrow(media.matches);
    };
    media.addEventListener("change", change);
    return () => {
      media.removeEventListener("change", change);
    };
  }, []);
  return narrow;
}

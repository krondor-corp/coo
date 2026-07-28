import { type RefObject, useEffect } from "react";

/** Attaches a "copy" button to every <pre> inside the container, matching a common docs-site affordance. */
export function useCopyButtons(
  containerRef: RefObject<HTMLElement | null>,
  deps: unknown[],
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: caller-controlled deps re-run this on content changes; containerRef is a stable ref
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanups: Array<() => void> = [];

    for (const pre of container.querySelectorAll("pre")) {
      if (pre.querySelector(".copy-btn")) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-btn";
      button.textContent = "copy";

      const onClick = () => {
        const code = pre.querySelector("code") ?? pre;
        navigator.clipboard.writeText(code.textContent ?? "").then(() => {
          button.textContent = "copied";
          setTimeout(() => {
            button.textContent = "copy";
          }, 1500);
        });
      };

      button.addEventListener("click", onClick);
      pre.style.position = "relative";
      pre.appendChild(button);
      cleanups.push(() => button.removeEventListener("click", onClick));
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, deps);
}

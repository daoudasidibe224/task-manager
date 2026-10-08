let epoch = 0;
export const taskSessionEpoch = () => epoch;
export const advanceTaskSessionEpoch = () => ++epoch;
export function announceTaskSession(kind: "changed" | "ended") {
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("task-session-change", { detail: kind }),
    );
}

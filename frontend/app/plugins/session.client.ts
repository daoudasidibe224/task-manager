import { advanceTaskSessionEpoch, taskSessionEpoch } from "~/utils/session";
export default defineNuxtPlugin((app) => {
  const workspace = useWorkspace();
  const channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("mes-listes-de-taches-session")
      : null;
  let checking = false,
    checkAgain = false;
  function ended() {
    const hadUser = Boolean(workspace.user.value);
    advanceTaskSessionEpoch();
    workspace.user.value = null;
    workspace.lists.value = [];
    workspace.loaded.value = true;
    if (hadUser || app.$router.currentRoute.value.path.startsWith("/dashboard"))
      void app.$router.replace("/login");
  }
  async function check() {
    if (document.visibilityState === "hidden") return;
    if (checking) {
      checkAgain = true;
      return;
    }
    checking = true;
    const epoch = taskSessionEpoch();
    try {
      await workspace.load();
      if (epoch !== taskSessionEpoch()) return;
      if (
        !workspace.user.value &&
        app.$router.currentRoute.value.path.startsWith("/dashboard")
      )
        await app.$router.replace("/login");
      else if (
        workspace.user.value &&
        ["/login", "/register"].includes(app.$router.currentRoute.value.path)
      )
        await app.$router.replace("/dashboard");
    } catch {
      /* Les erreurs réseau restent disponibles dans workspace.error. */
    } finally {
      checking = false;
      if (checkAgain) {
        checkAgain = false;
        void check();
      }
    }
  }
  function local(event: Event) {
    if (
      !(event instanceof CustomEvent) ||
      !["ended", "changed"].includes(event.detail)
    )
      return;
    channel?.postMessage(event.detail);
    if (event.detail === "ended") ended();
  }
  function focused() {
    void check();
  }
  window.addEventListener("task-session-change", local);
  window.addEventListener("focus", focused);
  document.addEventListener("visibilitychange", focused);
  if (channel)
    channel.onmessage = (event) => {
      if (event.data === "ended") ended();
      else if (event.data === "changed") void check();
    };
  const timer = setInterval(focused, 30000);
  app.vueApp.onUnmount(() => {
    clearInterval(timer);
    window.removeEventListener("task-session-change", local);
    window.removeEventListener("focus", focused);
    document.removeEventListener("visibilitychange", focused);
    channel?.close();
  });
});

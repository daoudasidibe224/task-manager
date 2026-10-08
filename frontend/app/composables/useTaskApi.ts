import { taskSessionEpoch, announceTaskSession } from "~/utils/session";
import { z } from "zod";
import { FetchError } from "ofetch";
const envelope = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown().optional(),
  errors: z.array(z.string()).optional(),
});
export function messageFrom(error: unknown): string {
  if (error instanceof FetchError) {
    const response = envelope.safeParse(error.data);
    if (response.success)
      return response.data.errors?.join(" ") || response.data.message;
    return "Le serveur est injoignable. Votre saisie est conservée.";
  }
  if (error instanceof z.ZodError)
    return "La réponse du serveur est invalide. Réessayez.";
  return error instanceof Error ? error.message : "La demande a échoué.";
}
export function unauthorized(error: unknown) {
  return error instanceof FetchError && error.response?.status === 401;
}
class SessionChangedError extends Error {
  constructor() {
    super(
      "Votre session a changé. Cette demande n’a pas été réessayée. Reprenez-la depuis votre compte actuel.",
    );
  }
}
const renewals = new WeakMap<
  object,
  { epoch: number; promise: Promise<void> }
>();
export function useTaskApi() {
  const config = useRuntimeConfig();
  const instance = useNuxtApp();
  async function raw(
    path: string,
    method: "GET" | "POST" | "PATCH" | "DELETE",
    body?: unknown,
  ) {
    return $fetch<unknown>(path, {
      baseURL: config.public.apiBaseUrl,
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      credentials: "include",
      timeout: 15000,
      retry: 0,
    });
  }
  async function send<T>(
    path: string,
    schema: z.ZodType<T>,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: unknown,
  ): Promise<T> {
    const epoch = taskSessionEpoch();
    function ensureSession() {
      if (epoch !== taskSessionEpoch()) throw new SessionChangedError();
    }
    function ended(error: unknown) {
      if (unauthorized(error) && epoch === taskSessionEpoch())
        announceTaskSession("ended");
    }
    let payload: unknown;
    try {
      payload = await raw(path, method, body);
    } catch (error) {
      ensureSession();
      if (
        !unauthorized(error) ||
        ["auth/login", "auth/register", "auth/refresh"].includes(path)
      )
        throw error;
      let renewal = renewals.get(instance);
      if (!renewal || renewal.epoch !== epoch) {
        const refresh = async () => {
          ensureSession();
          try {
            await raw("auth/profile", "GET");
            ensureSession();
            return;
          } catch (profileError) {
            ensureSession();
            if (!unauthorized(profileError)) throw profileError;
          }
          ensureSession();
          await raw("auth/refresh", "POST");
          ensureSession();
        };
        const promise = (
          typeof navigator !== "undefined" && navigator.locks
            ? navigator.locks.request("mes-taches-session-renewal", refresh)
            : refresh()
        ).finally(() => {
          if (renewals.get(instance)?.promise === promise)
            renewals.delete(instance);
        });
        renewal = { epoch, promise };
        renewals.set(instance, renewal);
      }
      try {
        await renewal.promise;
        ensureSession();
      } catch (refreshError) {
        ensureSession();
        if (
          refreshError instanceof FetchError &&
          [400, 401].includes(refreshError.response?.status ?? 0)
        ) {
          ended(error);
          throw error;
        }
        throw refreshError;
      }
      ensureSession();
      try {
        payload = await raw(path, method, body);
      } catch (error) {
        ensureSession();
        ended(error);
        throw error;
      }
    }
    ensureSession();
    const response = envelope.parse(payload);
    if (!response.success) throw new Error(response.message);
    return schema.parse(response.data);
  }
  return { send };
}

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
const renewals = new WeakMap<object, Promise<void>>();
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
    let payload: unknown;
    try {
      payload = await raw(path, method, body);
    } catch (error) {
      if (
        !unauthorized(error) ||
        ["auth/login", "auth/register", "auth/refresh"].includes(path)
      )
        throw error;
      let renewal = renewals.get(instance);
      if (!renewal) {
        const refresh = async () => {
          try {
            await raw("auth/profile", "GET");
            return;
          } catch (profileError) {
            if (!unauthorized(profileError)) throw profileError;
          }
          await raw("auth/refresh", "POST");
        };
        renewal = (
          typeof navigator !== "undefined" && navigator.locks
            ? navigator.locks.request("mes-taches-session-renewal", refresh)
            : refresh()
        ).finally(() => {
          renewals.delete(instance);
        });
        renewals.set(instance, renewal);
      }
      try {
        await renewal;
      } catch (refreshError) {
        if (
          refreshError instanceof FetchError &&
          [400, 401].includes(refreshError.response?.status ?? 0)
        )
          throw error;
        throw refreshError;
      }
      payload = await raw(path, method, body);
    }
    const response = envelope.parse(payload);
    if (!response.success) throw new Error(response.message);
    return schema.parse(response.data);
  }
  return { send };
}

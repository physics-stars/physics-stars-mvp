/*
 * Petit embolcall de `fetch` per a les crides JSON dels panells de
 * gestió (crear aula, moure alumnat, reiniciar contrasenya...). Evita
 * repetir el mateix parseig de resposta i gestió d'errors a cada botó.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function requestJson<T>(
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { ok: false, error: data.error ?? "Hi ha hagut un error. Torna-ho a provar." };
    }

    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "No s'ha pogut contactar amb el servidor. Comprova la connexió." };
  }
}

export function postJson<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  return requestJson<T>("POST", url, body);
}

export function patchJson<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  return requestJson<T>("PATCH", url, body);
}

export function deleteJson<T>(url: string): Promise<ApiResult<T>> {
  return requestJson<T>("DELETE", url);
}

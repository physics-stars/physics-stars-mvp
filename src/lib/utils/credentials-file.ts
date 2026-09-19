/*
 * Generació i descàrrega del fitxer .txt amb les credencials d'un lot de
 * comptes acabats de crear. Tot passa al navegador, amb les dades que
 * l'API ha retornat UNA sola vegada: cap contrasenya es desa enlloc.
 */

export interface CredentialRow {
  displayName: string;
  username: string;
  password: string;
}

interface CredentialsFileOptions {
  title: string;
  rows: CredentialRow[];
  classroomName?: string | null;
}

function pad(value: string, width: number): string {
  return value.length >= width ? value + "  " : value.padEnd(width + 2, " ");
}

// Construeix el text del fitxer: capçalera i una taula alineada.
export function buildCredentialsText({ title, rows, classroomName }: CredentialsFileOptions): string {
  const nameWidth = Math.max("Nom".length, ...rows.map((row) => row.displayName.length));
  const userWidth = Math.max("Usuari".length, ...rows.map((row) => row.username.length));

  const lines = [
    "PHYSICS STARS — Credencials d'accés",
    title,
    `Generat el ${new Date().toLocaleString("ca-ES")}`,
  ];
  if (classroomName) lines.push(`Aula: ${classroomName}`);
  lines.push("", `${pad("Nom", nameWidth)}${pad("Usuari", userWidth)}Contrasenya`);
  lines.push("-".repeat(nameWidth + userWidth + 4 + 12));
  for (const row of rows) {
    lines.push(`${pad(row.displayName, nameWidth)}${pad(row.username, userWidth)}${row.password}`);
  }
  lines.push(
    "",
    "Aquest fitxer conté contrasenyes en text pla. Guarda'l en un lloc segur",
    "i esborra'l quan ja no el necessitis: no es poden tornar a consultar.",
  );
  return lines.join("\r\n");
}

// Descarrega un text com a fitxer .txt (BOM UTF-8 perquè els accents
// es vegin bé al Bloc de notes de Windows).
export function downloadTextFile(fileName: string, text: string): void {
  const blob = new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Nom de fitxer segur: "credencials-alumne-2026-09-19.txt".
export function credentialsFileName(label: string): string {
  const safe = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `credencials-${safe || "comptes"}-${date}.txt`;
}

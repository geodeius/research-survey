const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function createResearchId() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
  return `DOL-${code}`;
}

export function normalizeResearchId(value: string) {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^DOL/, "");
  return clean ? `DOL-${clean.slice(0, 8)}` : "";
}

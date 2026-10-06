const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\//, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad/, "iOS"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Mac OS X/, "macOS"],
  [/Linux/, "Linux"],
];

/** Resumo legível do user-agent (ex.: "Chrome · Windows"). */
export function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) return "—";
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
  return [browser, system].filter(Boolean).join(" · ") || "Desconhecido";
}

export function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export function bundleMission(engineJs: string, uiJs: string, data: unknown): string {
  if (/^\s*import\s/m.test(engineJs)) {
    throw new Error("El motor compilado todavía importa módulos.");
  }
  const engine = engineJs
    .replaceAll("\r\n", "\n")
    .replaceAll(/^\/\/# sourceMappingURL=.*$/gm, "")
    .replaceAll(/^export /gm, "")
    .trim();
  const ui = uiJs.replaceAll("\r\n", "\n").trim();
  return `"use strict";\n(() => {\nconst STUBX_LAB = ${jsonForScript(data)};\n${engine}\n${ui}\nbootLab();\n})();\n`;
}

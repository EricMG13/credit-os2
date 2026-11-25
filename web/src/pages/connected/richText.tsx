import type { ReactNode } from "react";
import { plainModuleNames } from "./publishedReport";

/** Draw marks and text in published handoffs; callers may supply a different name cleaner. */
export function richParts(value: string, clean = plainModuleNames): ReactNode {
  return value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={index}>{clean(part.slice(2, -2))}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={index}>{clean(part.slice(1, -1))}</code>;
    return clean(part.replaceAll("\\|", "|"));
  });
}

/** The text richParts draws, without its marks. */
export function plainText(value: string): string {
  return value
    .replace(
      /\*\*([^*]+)\*\*|`([^`]+)`/g,
      (_, bold: string | undefined, code: string | undefined) => bold ?? code ?? "",
    )
    .replaceAll("\\|", "|");
}

import { expect, it } from "vitest";
// Probe S21-1-5: `richParts` unescapes a Markdown table pipe ("\|" -> "|") in plain parts but not
// inside a bold or code part, so a reader sees a stray backslash there; `plainText` (the same
// text without marks) does unescape it. Answer key: a cell written `**Debt \| EBITDA** held` reads
// "Debt | EBITDA held" (the Markdown table escape is not part of the module's words).
import { createElement } from "react";
import { render } from "@testing-library/react";
import { plainText, richParts } from "./richText";

it("draws a bold part's escaped pipe as the plain text does", () => {
  const cell = "**Debt \\| EBITDA** held";
  const { container } = render(createElement("p", null, richParts(cell)));
  expect(plainText(cell)).toBe("Debt | EBITDA held");
  expect(container.textContent).toBe("Debt | EBITDA held");
});

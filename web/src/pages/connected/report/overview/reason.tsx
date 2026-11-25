import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { containsReference, readParagraph, readerText } from "../../publishedReport";

/** An inline source marker such as "[E3]" or "[E12, E14]": the trace carries it, the page does not. */
const MARKER = /\s*(?:\[E\d+[a-z]?(?:\s*,\s*E\d+[a-z]?)*\]|【[^】]*】)/g;

/** The module codes and aliases the methodology defines (src/deploy_vii/methodology.json). */
export const METHODOLOGY_CODES: ReadonlySet<string> = new Set([
  ...["CP-0", "CP-1", "CP-1A", "CP-1B", "CP-1C", "CP-1D", "CP-1E", "CP-2", "CP-2A", "CP-2B"],
  ...["CP-2C", "CP-2D", "CP-2E", "CP-2F", "CP-2G", "CP-2H", "CP-3", "CP-3A", "CP-3B", "CP-3C"],
  ...["CP-3D", "CP-4", "CP-4A", "CP-4B", "CP-4C", "CP-4D", "CP-5", "CP-5A", "CP-6", "CP-6A"],
  ...["CP-8", "CP-DR", "CP-L10", "CP-L20", "CP-L23", "CP-L30", "CP-L40", "CP-MEMO", "CP-MODEL"],
  ...["CP-OS", "CP-PARSE"],
]);

/** A register table or row id: "T4.18", "T2DS.6", "TL3.2"; never a money amount ("T1.5 billion"). */
const REGISTER_ID = String.raw`T[A-Z0-9]*\.\d+(?:\.\d+)*(?!\w|\.\d)(?!\s*(?:bn|billion|m|million)\b)`;
/**
 * A register id used as a reference: after "per", "see", "in", "from", "table", "register" or
 * "row(s) of", alone in brackets, or the whole text. A name such as "Tranche T1.1" or
 * "(T2.1 series)" is kept.
 */
const CITED_REGISTER_ID = new RegExp(
  String.raw`\b(?:[Pp]er|[Ss]ee|[Ii]n|[Ff]rom|[Tt]able|[Rr]egister|[Rr]ows? of)\s+${REGISTER_ID}|[[(]\s*${REGISTER_ID}\s*[\])]|^\s*${REGISTER_ID}\s*$`,
);
/** A module code standing on its own ("CP-1", not "US-CP-1"). */
const CODE = /(?<![\w\-\\/.])CP-[A-Z0-9]+/g;

/**
 * Whether text, after the reader rule named what it could, still carries an id the page cannot
 * name: a cited register id, or a methodology module code left unnamed. Other codes stay as written.
 */
export function carriesUnreadId(text: string) {
  if (CITED_REGISTER_ID.test(text)) return true;
  return [...text.matchAll(CODE)].some(([code]) => METHODOLOGY_CODES.has(code));
}

/**
 * A reason a module wrote, as a working page may draw it: its body without the Basis line or
 * citation marks or inline source markers, with module codes named. Null when it cites a source
 * by name, a file, a page, an id or a hash, or carries an id the page cannot name: sources and
 * machinery belong to Evidence and the trace.
 */
export function readerReason(text: string): string | null {
  const body = readParagraph(text)
    .body.replaceAll("**", "")
    .replaceAll("`", "")
    .replace(MARKER, "")
    .trim();
  if (!body || containsReference(body)) return null;
  const words = readerText(body);
  return carriesUnreadId(words) ? null : words;
}

const LINK = "min-h-8 max-[480px]:min-h-11";

/**
 * The one way every gap reason or note is drawn on the Overview: the module's words through
 * `readerReason`, or, where they cite a source, a link to read them in Evidence.
 */
export function Reason({
  text,
  href,
  className,
}: {
  text: string;
  href: string | undefined;
  className?: string;
}) {
  const words = readerReason(text);
  if (words !== null) return <span className={className}>{words}</span>;
  if (!href)
    return <span className={className}>The reason cites a source; read it in Evidence.</span>;
  return (
    <Button className={LINK} color="link-gray" size="sm" href={href} iconTrailing={ArrowRight}>
      Read the reason in Evidence
    </Button>
  );
}

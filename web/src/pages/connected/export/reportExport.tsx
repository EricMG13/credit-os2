import type { ReactElement } from "react";
import type { Mode } from "../api";
import {
  containsReference,
  publishedRunForFolder,
  runLabels,
  readerText,
  type PublishedRun,
  type Snapshot,
} from "../publishedReport";
import { buildReportView, type ReportView } from "../reportView";
import { plainText } from "../richText";
import {
  covenantRefinancing,
  distressedRestructuring,
  earningsUpdate,
  portfolioDecision,
  purposeDocument,
  relativeValue,
  specialistOverview,
} from "./purposeReport";

type PrintDocument = {
  issuer: string;
  ticker: string;
  date: string;
  period: string;
  pathway: string;
  scope: string;
  restrictions: string[];
  content: ReactElement;
};

type ExportTemplate = {
  name: string;
  pathways: readonly string[];
  missingFinding: string;
  compose: (
    view: ReportView,
    run: PublishedRun,
    privateIds: readonly string[],
  ) => PrintDocument | null;
};

const templates = {
  "earnings-update": {
    name: "Earnings Update",
    pathways: ["earnings_update"],
    missingFinding:
      "This report has no assessable comparative earnings finding for the Earnings Update.",
    compose: purpose(earningsUpdate),
  },
  "relative-value": {
    name: "Relative Value",
    pathways: ["relative_value"],
    missingFinding:
      "This report has no assessable market comparison with verified instrument, quote date and yield basis for the Relative Value PDF.",
    compose: purpose(relativeValue),
  },
  "covenant-refinancing": {
    name: "Covenant & Refinancing Brief",
    pathways: ["covenant_refinancing"],
    missingFinding:
      "This report has no assessable covenant or funding finding for the Covenant & Refinancing Brief.",
    compose: purpose(covenantRefinancing),
  },
  "distressed-restructuring": {
    name: "Distressed & Restructuring Brief",
    pathways: ["distressed_restructuring"],
    missingFinding:
      "This report has no assessable distress finding for the Distressed & Restructuring Brief.",
    compose: purpose(distressedRestructuring),
  },
  "portfolio-decision": {
    name: "Portfolio Decision",
    pathways: ["portfolio_decision"],
    missingFinding:
      "This report has no verified terminal portfolio decision for the Portfolio Decision PDF.",
    compose: purpose(portfolioDecision),
  },
} satisfies Record<string, ExportTemplate>;

export type ExportId = keyof typeof templates;
export type ReportExport =
  | { state: "unavailable"; reason: string }
  | {
      state: "ready";
      id: ExportId;
      name: string;
      document: PrintDocument;
      qualifiers: string[];
      previewNote: string;
      privateIds: readonly string[];
    };
type Availability = {
  options: { id: ExportId; name: string }[];
  reason: string;
  resolve: (id: ExportId) => ReportExport;
};

export const exportHref = (id: ExportId) => `#export/${id}`;

export function exportRoute(hash: string) {
  const [section, id, extra] = hash.slice(1).split("/");
  if (section !== "export") return undefined;
  return id && extra === undefined && Object.hasOwn(templates, id) ? (id as ExportId) : null;
}

export function containsRunIdentifier(value: string, identifiers: readonly string[]) {
  return identifiers.some((identifier) => {
    if (!identifier) return false;
    const token = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(
      `(?<![a-zA-Z0-9_-])(?<![a-zA-Z0-9]\\.)${token}(?![a-zA-Z0-9_-]|\\.[a-zA-Z0-9])`,
    ).test(value);
  });
}

function publicationText(value: string, privateIds: readonly string[]) {
  const text = plainText(value).trim();
  return containsReference(text) || containsRunIdentifier(text, privateIds) ? "" : text;
}

function previewQualification(
  value: string,
  privateIds: readonly string[],
  pathway: string | null,
) {
  const text = plainText(value).trim();
  return readerText(text, pathway) === text ? publicationText(text, privateIds) : "";
}

export function reportSpecialistOverview(view: ReportView, run: PublishedRun, routeKey: string) {
  return specialistOverview(view, run, (value) => publicationText(value, [run.folder, routeKey]));
}

function purpose(compose: Parameters<typeof purposeDocument>[0]): ExportTemplate["compose"] {
  return (view, run, privateIds) =>
    purposeDocument(compose, view, run, (value) => publicationText(value, privateIds));
}

function unavailable(reason: string): Availability {
  return { options: [], reason, resolve: () => ({ state: "unavailable", reason }) };
}

export function reportExports(
  snapshot: Snapshot | null | undefined,
  folder: string,
  mode: Mode,
): Availability {
  const found =
    snapshot?.reportFolder === folder && publishedRunForFolder(snapshot.workspace.runs, folder);
  if (!snapshot || !found || found[1].publicationVerified !== true) {
    return unavailable("A verified report for this run is required to export a PDF.");
  }
  const [key, run] = found;
  const privateIds = [folder, key];
  const previewNote = previewQualification(snapshot.preview?.reason ?? "", privateIds, run.pathway);
  if (snapshot.preview && !previewNote)
    return unavailable("The test preview qualification could not be included in the PDF.");
  const ids = (Object.keys(templates) as ExportId[]).filter((id) =>
    templates[id].pathways.includes(run.pathway ?? ""),
  );
  if (!ids.length) return unavailable("There is no released PDF format for this pathway.");
  const view = buildReportView(snapshot, key, run);
  const options = ids.map((id) => ({ id, name: templates[id].name }));
  const documents = new Map(ids.map((id) => [id, templates[id].compose(view, run, privateIds)]));
  const qualifiers = [
    ...runLabels(view.entries, run),
    ...(snapshot.preview ? ["Test preview"] : []),
    ...(mode === "synthetic" ? ["Synthetic test"] : []),
  ];
  const available = options.filter(({ id }) => documents.get(id));
  return {
    options: available,
    reason: options[0] ? templates[options[0].id].missingFinding : "",
    resolve(id: ExportId): ReportExport {
      if (!documents.has(id)) {
        return {
          state: "unavailable",
          reason: "There is no released PDF format for this pathway at that address.",
        };
      }
      const document = documents.get(id);
      return document
        ? {
            state: "ready",
            id,
            name: templates[id].name,
            document,
            qualifiers,
            previewNote,
            privateIds,
          }
        : { state: "unavailable", reason: templates[id].missingFinding };
    },
  };
}

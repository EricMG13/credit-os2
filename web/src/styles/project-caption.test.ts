import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
// D-30's project-authored caption floor. Imported Badge/Tooltip/file-upload/Table head defaults are excluded.
const authored = [
  "components/metric/MetricCard.tsx",
  "components/steps/ProgressSteps.tsx",
  "components/timeline/Timeline.tsx",
  "components/chart/TrendChart.tsx",
  "components/chart/SeriesLine.tsx",
  "components/chart/ColumnsChart.tsx",
  "components/chart/WaterfallChart.tsx",
  "components/chart/PathChart.tsx",
  "components/chart/ScatterPlot.tsx",
  "components/chart/LimitsChart.tsx",
  "pages/connected/start/ModuleOptionsFields.tsx",
  "pages/connected/start/RowEditor.tsx",
  "pages/connected/RunActivity.tsx",
  "pages/connected/report/ModuleTable.tsx",
  "pages/connected/report/IdentityBand.tsx",
  "pages/connected/report/Evidence.tsx",
  "pages/connected/report/Forecast.tsx",
  "pages/connected/visuals/EdgeMap.tsx",
  "pages/library/parts/Snippet.tsx",
  "pages/library/parts/TraceDrawer.tsx",
  "pages/library/parts/Limitations.tsx",
  "pages/library/parts/IssuerList.tsx",
  "pages/library/parts/JumpMenu.tsx",
  "pages/library/parts/ModuleNav.tsx",
  "pages/library/parts/RunFeed.tsx",
  "pages/library/parts/SourceFileRow.tsx",
  "pages/library/parts/FactsBlock.tsx",
  "pages/library/parts/RegisterTable.tsx",
  "pages/library/parts/Measure.tsx",
  "pages/library/parts/ChangeCard.tsx",
  "pages/library/parts/StatusBlock.tsx",
  "pages/run/start/Documents.tsx",
  "pages/run/start/Purpose.tsx",
  "pages/run/start/Stepper.tsx",
  "pages/run/activity/Summary.tsx",
  "pages/run/activity/Feed.tsx",
  "shell/Shell.tsx",
];
it.each(authored)("%s keeps authored captions at13px or larger", (file) => {
  const text = readFileSync(path.resolve(import.meta.dirname, "..", file), "utf8");
  expect(text).not.toMatch(
    /\btext-xs(?:\b|\/)|text-\[(?:9|10|11|12)px\]|fontSize\s*[:=]\s*\{?\s*(?:10|12)\b/,
  );
});

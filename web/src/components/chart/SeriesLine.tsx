import { Line, type DotItemDotProps } from "recharts";
import { Mark } from "./marks";
import type { SeriesStyle } from "./series";

const LABEL_FILL = "var(--color-text-primary)";
const NAME_FILL = "var(--color-text-secondary)";

interface SeriesLineProps {
  name: string;
  dataKey: string;
  style: SeriesStyle;
  labels?: (string | null)[];
  labelOffset?: number;
  /** Draw the series name beside the point at this index: the line is named where it ends. */
  nameAt?: number;
  /** Moves the name label down from its point, so labels of close lines do not overlap. */
  nameDy?: number;
  /** The series stands out from the others: a heavier line, marked with a class. */
  emphasised?: boolean;
}

export const EMPHASIS_CLASS = "series-emphasis";
const EMPHASIS_WIDTH = 3.5;
const LINE_WIDTH = 2;
const NAME_INSET = 10;
/** The value label at a named line end sits left of the point, above the line, clear of names. */
const LABEL_RISE = 8;

function point(
  { cx, cy, value, index }: DotItemDotProps,
  { name, style, labels, labelOffset, nameAt, nameDy = 0, emphasised }: SeriesLineProps,
) {
  if (typeof cx !== "number" || typeof cy !== "number" || typeof value !== "number") return null;
  const mark = <Mark marker={style.marker} color={style.color} x={cx} y={cy} series={name} />;
  const label = labels?.[index];
  const named = nameAt === index;
  if (!labels && !named) return mark;
  return (
    <g key={index}>
      {mark}
      {named ? (
        <text
          data-series-name={name}
          data-emphasised={emphasised ? "" : undefined}
          x={cx + NAME_INSET}
          y={cy + 4 + nameDy}
          fontSize={13}
          fontWeight={emphasised ? 600 : 400}
          fill={emphasised ? LABEL_FILL : NAME_FILL}
        >
          {name}
        </text>
      ) : null}
      {label == null || labelOffset === undefined ? null : (
        <text
          data-label=""
          data-series={name}
          x={named ? cx - NAME_INSET : cx}
          y={named ? cy - LABEL_RISE : cy + labelOffset}
          textAnchor={named ? "end" : "middle"}
          fontSize={13}
          fill={LABEL_FILL}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Shared line and marker styling for chart series. */
export function SeriesLine(props: SeriesLineProps) {
  const { name, dataKey, style } = props;
  return (
    <Line
      key={name}
      dataKey={dataKey}
      name={name}
      className={props.emphasised ? EMPHASIS_CLASS : undefined}
      stroke={style.color}
      strokeWidth={props.emphasised ? EMPHASIS_WIDTH : LINE_WIDTH}
      strokeDasharray={style.dash}
      connectNulls={false}
      isAnimationActive={false}
      activeDot={false}
      dot={(pointProps) => point(pointProps, props)}
    />
  );
}

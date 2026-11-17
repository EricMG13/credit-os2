import { Button as KitButton } from "@/components/base/buttons/button";
import { ArrowRight } from "@untitledui/icons";
import { ChevronDown, ChevronUp } from "@untitledui/icons";
import { Button, Disclosure, DisclosurePanel } from "react-aria-components";
import type { Limitations as LimitationsData } from "../slice";
import type { SECTION_HEADING, SUBSECTION_HEADING } from "./heading";
import { TRACE_HOST, TraceControl } from "./TraceControl";

/** One complete limitation; the surrounding card owns the only collapse control. */
function Limitation({ text, trace }: LimitationsData["items"][number]) {
  return (
    <li className={`${TRACE_HOST} flex max-w-[86ch] items-start gap-3`}>
      <span className="min-w-0 flex-1 wrap-anywhere">{text}</span>
      <TraceControl trace={trace} label="Show sources for this limitation" />
    </li>
  );
}

/**
 * What the run or module could not establish (P5): the only collapsible block of a library page.
 * Open by default and always open in print; the link goes to the Evidence gaps. `level` is the
 * heading's level.
 */
export function Limitations({
  limitations,
  gapsHref,
  level,
}: {
  limitations: LimitationsData;
  gapsHref: string;
  level: typeof SECTION_HEADING | typeof SUBSECTION_HEADING;
}) {
  const Heading = level;
  return (
    <section
      aria-label="Limitations"
      className="rounded-[14px] border border-border-hairline bg-surface-card p-6 shadow-sm"
    >
      <Disclosure defaultExpanded className="flex flex-col gap-4">
        {({ isExpanded }) => (
          <>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <Heading
                tabIndex={-1}
                className="flex items-center gap-2 rounded-ds-xs text-body font-semibold outline-hidden focus-visible:ring-2 focus-visible:ring-brand"
              >
                Limitations
                <span className="rounded-ds-full border border-border-hairline bg-surface-subtle px-2 py-0.5 text-caption font-medium text-text-secondary tabular-nums">
                  {limitations.count}
                </span>
              </Heading>
              <div className="flex min-w-0 items-center gap-4">
                <KitButton
                  href={gapsHref}
                  color="link-gray"
                  size="sm"
                  iconTrailing={ArrowRight}
                  className="whitespace-normal"
                >
                  {limitations.gapsLink.label}
                </KitButton>
                <Button
                  slot="trigger"
                  aria-label={isExpanded ? "Collapse limitations" : "Expand limitations"}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-tertiary outline-hidden hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {isExpanded ? (
                    <ChevronUp aria-hidden="true" className="size-4" />
                  ) : (
                    <ChevronDown aria-hidden="true" className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <DisclosurePanel className="print:block print:[content-visibility:visible]">
              <ul className="flex flex-col gap-3 text-small text-text-secondary">
                {limitations.items.map((item) => (
                  <Limitation key={item.text} {...item} />
                ))}
              </ul>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </section>
  );
}

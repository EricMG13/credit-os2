// Class lists the Signal screens share, each a rule of DESIGN.md written once.

/** The focus ring of a link or button written here: 2px, set off 2px from the control. */
export const FOCUS = "outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2";

/** A control is at least 32px tall, and 44px on a phone (a window narrower than 480px). */
export const TARGET = "min-h-8 max-[480px]:min-h-11";

/** A text link that is a control of its own (not a word in a sentence): a target, with the ring. */
export const LINK = `inline-flex items-center font-semibold text-text-link ${TARGET} ${FOCUS}`;

/**
 * On a phone every control inside is a 44px target. Set on the frame and on each panel and dialog
 * (they are drawn outside the frame): the kit's buttons, selects, inputs and tabs take no size of
 * their own here, and the kit's sizes are the same on every page.
 */
export const PHONE_TARGETS =
  "max-[480px]:[&_button]:min-h-11 max-[480px]:[&_button]:min-w-11 max-[480px]:[&_a[data-rac]]:min-h-11 max-[480px]:[&_[role=tab]]:min-h-11 max-[480px]:[&_[role=tab]]:min-w-11 max-[480px]:[&_input:not([type=checkbox])]:min-h-11";

/** The tile a list of stories, threads or issues sits on: one surface, hairlines between its rows. */
export const LIST_TILE =
  "divide-y divide-border-hairline rounded-ds-lg border border-border-subtle bg-surface-card px-5 py-2 sm:px-6";

/** A date or a clock time beside text: Geist Mono with tabular numerals. A time in words ("2 h ago") stays in the text face. */
export const FIGURE = "font-mono text-mono tabular-nums";

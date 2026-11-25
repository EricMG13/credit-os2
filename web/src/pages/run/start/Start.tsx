import { useEffect, useRef } from "react";
import { Heading } from "react-aria-components";
import { Lock01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { StatusShape } from "@/components/status/shapes";
import type { StartDraft } from "../slice";
import { DetailsList } from "./DetailsList";

type Step = Extract<StartDraft, { step: "start" }>;

/** The paid sentence with its amount in bold; text lacking the amount is drawn unchanged. */
function PaidText({ text, amount }: Step["paid"]) {
  const at = amount === "" ? -1 : text.indexOf(amount);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <strong className="font-semibold tabular-nums">{amount}</strong>
      {text.slice(at + amount.length)}
    </>
  );
}

/** The Start step: the recap and what Submit does. Submit itself is the step action. */
export function Start({ recap, paid }: Pick<Step, "recap" | "paid">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-h3 text-text-primary">Start</h2>
        <p className="reading-copy text-body text-text-secondary">
          Everything is ready. This is the only step that spends money.
        </p>
      </div>
      <DetailsList rows={recap} />
      <div className="flex flex-col gap-1 border-t border-border-hairline pt-4">
        <h3 className="text-md font-semibold text-text-primary">Submit starts a paid run</h3>
        <p className="reading-copy text-body text-text-secondary">
          <PaidText {...paid} />
        </p>
      </div>
    </div>
  );
}

/** The dialog's own line: this page shows a saved example, so confirming starts nothing. */
const SAVED_EXAMPLE_SUBMIT =
  "This page shows a saved example: confirming starts no run and spends nothing.";

/** Submit and its one confirmation. Confirming only moves to the started snapshot: nothing is
 *  sent, stored or spent, because this page shows saved examples. */
export function Submit({
  label,
  confirm,
  blocked,
}: {
  label: string;
  confirm: Step["confirm"];
  blocked?: { id: string };
}) {
  return (
    <SubmitConfirmation
      label={label}
      confirm={confirm}
      note={SAVED_EXAMPLE_SUBMIT}
      isDisabled={blocked !== undefined}
      describedBy={blocked?.id}
      onConfirm={() => {
        window.location.hash = `#/run/start/${confirm.started}`;
      }}
    />
  );
}

export function SubmitConfirmation({
  label,
  confirm,
  note,
  isDisabled,
  describedBy,
  className,
  noCost = false,
  facts,
  onConfirm,
}: {
  label: string;
  confirm: Pick<Step["confirm"], "title" | "text" | "action">;
  /** A line after the confirmation text, for a page whose Submit spends nothing. */
  note?: string;
  isDisabled: boolean;
  describedBy?: string;
  className?: string;
  /** A confirmation that spends nothing (a synthetic test): a calm mark, not a warning. */
  noCost?: boolean;
  /** What is being started, restated where it is confirmed: issuer, pathway and cap. */
  facts?: readonly (readonly [term: string, value: string])[];
  onConfirm: () => void;
}) {
  return (
    <DialogTrigger>
      <Button
        size="xl"
        iconLeading={Lock01}
        isDisabled={isDisabled}
        aria-describedby={describedBy}
        className={className}
      >
        {label}
      </Button>
      <ModalOverlay isDismissable>
        <Modal className="max-w-100">
          <Dialog>
            {({ close }) => (
              <div className="flex flex-col gap-8 p-6">
                <div className="flex flex-col gap-4">
                  <FeaturedIcon
                    color={noCost ? "brand" : "warning"}
                    size="md"
                    icon={
                      <span className="flex size-4 [&>svg]:size-full">
                        <StatusShape shape={noCost ? "ring" : "triangle"} />
                      </span>
                    }
                  />
                  <div className="flex flex-col gap-1">
                    <Heading slot="title" className="text-h4 text-balance text-text-primary">
                      {confirm.title}
                    </Heading>
                    <p className="reading-copy text-body text-text-secondary tabular-nums">
                      {confirm.text}
                    </p>
                    {note === undefined ? null : (
                      <p className="mt-2 text-sm font-medium text-text-secondary">{note}</p>
                    )}
                  </div>
                  {facts && facts.length > 0 && (
                    <dl className="grid gap-x-4 gap-y-1 rounded-ds-sm bg-surface-subtle p-3 text-small sm:grid-cols-[auto_minmax(0,1fr)]">
                      {facts.map(([term, value]) => (
                        <div key={term} className="contents">
                          <dt className="text-text-tertiary">{term}</dt>
                          <dd className="font-medium wrap-anywhere text-text-primary tabular-nums">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <CancelButton onPress={close} />
                  <Button
                    className="max-[480px]:min-h-11 sm:flex-1"
                    onPress={() => {
                      close();
                      onConfirm();
                    }}
                  >
                    {confirm.action}
                  </Button>
                </div>
              </div>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

/**
 * The dialog's Cancel, which takes the focus when the dialog opens: the default choice is the one
 * that spends nothing (the WAI-ARIA alert dialog pattern focuses the least destructive action).
 */
function CancelButton({ onPress }: { onPress: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <Button
      ref={ref}
      // Focused on opening, whatever opened the dialog: the ring shows for a mouse too.
      className="data-focused:outline-2 data-focused:outline-offset-2 max-[480px]:min-h-11 sm:flex-1"
      color="secondary"
      onPress={onPress}
    >
      Cancel
    </Button>
  );
}

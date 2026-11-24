// The channel list where the window is too narrow for it as a column (the approved narrow mock,
// signal-slice2-latest-375: a "Channels" button ahead of the page's title). The button says where the
// reader is and whether anything in the list is unread; it opens the list in the kit's slide-out
// menu, as the thread panel is. The trigger and the menu are the kit's own pair, so the button holds
// aria-expanded and names the panel it controls, Escape and a press outside close it, and focus
// goes back to the button.
import type { ReactNode, Ref } from "react";
import { Menu01 } from "@untitledui/icons";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";

export function ChannelPanel({
  place,
  unread,
  open,
  onOpenChange,
  buttonRef,
  children,
}: {
  /** The channel item the page is on, by its name in the list; null where the address names none. */
  place: string | null;
  /** Something in the list carries an unread mark. */
  unread: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buttonRef: Ref<HTMLButtonElement>;
  /** The channel list. */
  children: ReactNode;
}) {
  const label = ["Channels", place === null ? null : `: ${place}`, unread ? ". Unread" : null];
  return (
    // The strip stays at the top of the scrolling page (SignalFrame gives that region the matching
    // scroll-padding and SignalPage's refusal alert sits under it). It reaches out over the page's
    // padding so the page does not show round it (a sticky top is measured from inside that padding, hence
    // the negative tops); z-30 is above the page's tabs (z-10) and under the
    // panels (z-40) and dialogs (z-50).
    <div className="sticky -top-4 z-30 -mx-4 -mt-4 mb-4 border-b border-border-hairline bg-surface-canvas px-4 py-2 min-[768px]:-top-8 min-[768px]:-mx-8 min-[768px]:-mt-8 min-[768px]:px-8">
      <SlideoutMenu.Trigger isOpen={open} onOpenChange={onOpenChange}>
        <Button
          ref={buttonRef}
          color="secondary"
          size="lg"
          iconLeading={Menu01}
          aria-label={label.filter((part) => part !== null).join("")}
          className="max-w-full *:data-text:min-w-0"
        >
          <span className="flex min-w-0 items-center gap-2">
            Channels
            {place === null ? null : (
              <span className="truncate font-normal text-text-tertiary">{place}</span>
            )}
            {unread ? <Badge size="sm">Unread</Badge> : null}
          </span>
        </Button>
        {/* Above the page's own layers (a tab is z-10) and under a dialog opened from the list (z-50). */}
        <SlideoutMenu
          side="left"
          isDismissable
          aria-label="Channels"
          className="z-40"
          dialogClassName="gap-0"
        >
          <CloseButton label="Close channels" className="absolute top-3 right-3 z-1" />
          {children}
        </SlideoutMenu>
      </SlideoutMenu.Trigger>
    </div>
  );
}

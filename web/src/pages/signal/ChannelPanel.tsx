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
    <div className="mb-4">
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
        <SlideoutMenu isDismissable aria-label="Channels" dialogClassName="gap-0">
          <CloseButton label="Close channels" className="absolute top-3 right-3 z-1" />
          {children}
        </SlideoutMenu>
      </SlideoutMenu.Trigger>
    </div>
  );
}

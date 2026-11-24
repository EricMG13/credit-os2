// The layout every Signal page sits in: the channel list on the left, the page's content on the
// right, each scrolling on its own, filling the full-bleed page region after mock/signal.js (SgShell) and `.sub`, `.ni`, `.cnt`, `.dot`, `.me`.
// Where the window has no room for the list as a column (parts/useWide.ts) the page takes the whole
// region and the list opens from a button ahead of the page (ChannelPanel.tsx).
import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type FC,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Bookmark,
  Clock,
  File05,
  Hash02,
  Sliders04,
  Star01,
  Stars01,
  Users01,
} from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Button as AriaButton } from "react-aria-components";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import { AvatarLabelGroup } from "./parts/Avatar";
import { useWide } from "./parts/useWide";
import { useSignalActions } from "./actions";
import { ChannelPanel } from "./ChannelPanel";
import { NameDialog, initialsOf } from "./NameDialog";
import { SignalViewerContext } from "./viewer";
import type { SignalScene } from "./slice";
import { writes } from "./writes";

/** Which channel the page is on; the item with the same key is marked current. */
export type SignalCurrent =
  | { kind: "view"; id: "for-you" | "latest" | "saved" }
  | { kind: "topic" | "group" | "digest"; id: string }
  | { kind: "settings" }
  /** The address names no channel item (an unknown view or topic): nothing is marked current. */
  | { kind: "none" };

/** Follow state kept above the frame so the channel list and the page agree; in memory unless the page is drawn on a service. */
export type SignalFollow = {
  on: (topic: { id: string; followed: boolean }) => boolean;
  toggle: (topic: { id: string; followed: boolean }) => void;
};

export function sceneHref(scene: SignalScene, path: string): string {
  return `#/signal/${encodeURIComponent(scene.id)}/${path}`;
}

const VIEWS = [
  { id: "for-you", label: "For you", icon: Stars01 },
  { id: "latest", label: "Latest", icon: Clock },
  { id: "saved", label: "Saved", icon: Bookmark },
] as const;

function isCurrent(current: SignalCurrent, kind: SignalCurrent["kind"], id?: string): boolean {
  if (current.kind !== kind || current.kind === "none") return false;
  return current.kind === "settings" || current.id === id;
}

/** How the list is drawn: a column beside the page, or the content of the panel a narrow window opens. */
type ListForm = { panel: boolean; onGo: (() => void) | undefined };
const ListFormContext = createContext<ListForm>({ panel: false, onGo: undefined });

type RowProps = {
  href: string;
  icon: FC<{ className?: string }>;
  on: boolean;
  children: ReactNode;
};

function Row({
  href,
  icon: Icon,
  on,
  children,
  mark,
  after,
}: RowProps & { mark?: ReactNode; after?: ReactNode }) {
  const { panel, onGo } = useContext(ListFormContext);
  return (
    <li
      className={cx(
        "my-px flex items-center rounded-ds-xs px-2 text-sm font-semibold",
        on ? "bg-surface-selected text-text-link" : "text-text-secondary",
      )}
    >
      {/* The link is as tall as its row, so the whole row takes a press: 44px in the panel. */}
      <a
        href={href}
        aria-current={on ? "page" : undefined}
        onClick={onGo}
        className={cx(
          "flex min-w-0 flex-1 items-center gap-2 py-1.5 outline-focus-ring focus-visible:outline-2",
          panel ? "min-h-11" : "min-h-9",
        )}
      >
        <Icon className={cx("size-4 shrink-0", on ? "text-text-link" : "text-fg-quaternary")} />
        <span className="min-w-0 flex-1">{children}</span> {mark}
      </a>
      {after}
    </li>
  );
}

const Count = ({ children }: { children: ReactNode }) => (
  <Badge size="sm" className="ml-3">
    {children}
  </Badge>
);

function Heading({ children }: { children: string }) {
  return <h2 className="px-2 pt-4 pb-1 text-xs font-bold text-text-tertiary">{children}</h2>;
}

function ChannelList({
  scene,
  current,
  follow,
  chip,
}: {
  scene: SignalScene;
  current: SignalCurrent;
  follow: SignalFollow;
  chip: ReactNode;
}) {
  const { channels } = scene.snapshot;
  const headingId = useId();
  const { panel } = useContext(ListFormContext);
  const views = VIEWS.map((view) => ({
    ...view,
    count: view.id === "saved" ? channels.savedCount : null,
  }));
  return (
    <nav
      aria-labelledby={headingId}
      className={cx(
        "flex flex-col bg-surface-card px-4 pt-6 pb-5",
        // The panel scrolls, so the list in it takes the panel's width and at least its height.
        panel
          ? "min-h-full w-full"
          : "h-full w-64 shrink-0 overflow-y-auto border-r-[1.5px] border-border-hairline",
      )}
    >
      <h2 id={headingId} className="px-2 text-sm font-semibold text-text-link">
        Signal
      </h2>
      <ul className="pt-2">
        {views.map((view) => (
          <Row
            key={view.id}
            href={sceneHref(scene, `feed/${view.id}`)}
            icon={view.icon}
            on={isCurrent(current, "view", view.id)}
            mark={view.count === null ? undefined : <Count>{view.count}</Count>}
          >
            {view.label}
          </Row>
        ))}
      </ul>
      <Heading>Topics</Heading>
      {channels.topics.length === 0 ? (
        <p className="px-2 py-2 text-sm text-text-tertiary">No topics yet</p>
      ) : (
        <ul>
          {channels.topics.map((topic) => {
            const on = follow.on(topic);
            return (
              <Row
                key={topic.id}
                href={sceneHref(scene, `topic/${encodeURIComponent(topic.id)}`)}
                icon={Hash02}
                on={isCurrent(current, "topic", topic.id)}
                mark={<Count>{topic.count ?? "n.a."}</Count>}
                after={
                  <ButtonUtility
                    tooltip={`${on ? "Unfollow" : "Follow"} ${topic.name}`}
                    aria-pressed={on}
                    className={on ? "text-action hover:text-action-hover" : undefined}
                    icon={<Star01 data-icon className={on ? "fill-current" : undefined} />}
                    onPress={() => {
                      follow.toggle(topic);
                    }}
                  />
                }
              >
                {topic.name}
              </Row>
            );
          })}
        </ul>
      )}
      <Heading>Groups</Heading>
      {channels.groups.length === 0 ? (
        <p className="px-2 py-2 text-sm text-text-tertiary">No groups yet</p>
      ) : (
        <ul>
          {channels.groups.map((group) => (
            <Row
              key={group.id}
              href={sceneHref(scene, `group/${encodeURIComponent(group.id)}`)}
              icon={Users01}
              on={isCurrent(current, "group", group.id)}
              mark={group.unread === null ? undefined : <Count>{group.unread}</Count>}
            >
              {group.name}
            </Row>
          ))}
        </ul>
      )}
      <Heading>Digests</Heading>
      {channels.digests.length === 0 ? (
        <p className="px-2 py-2 text-sm text-text-tertiary">No digests yet</p>
      ) : (
        <ul>
          {channels.digests.map((digest) => (
            <Row
              key={digest.id}
              href={sceneHref(scene, `digest/${encodeURIComponent(digest.id)}`)}
              icon={File05}
              on={isCurrent(current, "digest", digest.id)}
              mark={<DigestMark paused={digest.paused} unread={digest.unread} />}
            >
              {digest.name}
            </Row>
          ))}
        </ul>
      )}
      <ul className="mt-2">
        <Row
          href={sceneHref(scene, "settings/topics")}
          icon={Sliders04}
          on={isCurrent(current, "settings")}
        >
          Settings
        </Row>
      </ul>
      {chip}
    </nav>
  );
}

function DigestMark({ paused, unread }: { paused: boolean; unread: boolean }) {
  if (paused) {
    return (
      <span className="ml-2 *:text-xs!">
        <StatusBadge set="Signal source states" state="Paused" />
      </span>
    );
  }
  if (!unread) return null;
  return (
    <span className="ml-3 size-2 shrink-0 rounded-full bg-action">
      <span className="sr-only">Unread</span>
    </span>
  );
}

/** Ruling 19: the viewer's name and role; the chip is a button that opens the name dialog either way. */
function NameChip({
  name,
  initials,
  roleLabel,
  chipRef,
  onPress,
}: {
  name: string | null;
  initials: string | null;
  roleLabel: string;
  chipRef: RefObject<HTMLButtonElement | null>;
  onPress: () => void;
}) {
  return (
    <div className="mt-auto pt-4">
      <Tooltip title="A display name, not a login. It only labels what you save and follow.">
        <AriaButton
          ref={chipRef}
          onPress={onPress}
          className="rounded-ds-xs text-left outline-focus-ring focus-visible:outline-2"
        >
          <AvatarLabelGroup
            size="sm"
            initials={initials ?? "?"}
            own={name !== null}
            title={name ?? <span className="text-text-link">Set your name</span>}
            subtitle={roleLabel}
          />
        </AriaButton>
      </Tooltip>
    </div>
  );
}

/** The name the channel list gives the item the page is on; null where the address names none. */
function placeOf(scene: SignalScene, current: SignalCurrent): string | null {
  const { channels } = scene.snapshot;
  switch (current.kind) {
    case "view":
      return VIEWS.find((view) => view.id === current.id)?.label ?? null;
    case "topic":
    case "group":
    case "digest":
      return channels[`${current.kind}s`].find((item) => item.id === current.id)?.name ?? null;
    case "settings":
      return "Settings";
    case "none":
      return null;
  }
}

/** Whether the list draws an unread mark: a group's unread badge, or an unread digest's dot. */
function anyUnread(scene: SignalScene): boolean {
  const { groups, digests } = scene.snapshot.channels;
  return (
    groups.some((group) => group.unread !== null && group.unread !== "0") ||
    digests.some((digest) => digest.unread && !digest.paused)
  );
}

/** The viewer's name as the frame shows it, and the dialog that sets it. */
function useViewerName(viewer: SignalScene["snapshot"]["viewer"]) {
  const actions = useSignalActions();
  // With no service a typed name is in memory only and lasts until the page is left. With one it
  // shows at once and is sent, and once answered the slice says who is reading: accepted, the
  // snapshot read again holds the name as the service keeps it; refused, the slice still holds the
  // name before, and the dialog opens again on the refused name with the service's sentence.
  const [typed, setTyped] = useState<string | null>(null);
  const [open, setOpen] = useState(viewer.name === null);
  const [refused, setRefused] = useState<{ name: string; reason: string } | null>(null);
  const send = (next: string) => {
    if (actions === null) return;
    void actions.write(writes.rename(next)).then(({ refusal: reason }) => {
      setTyped(null);
      if (reason === null) return;
      setRefused({ name: next, reason });
      setOpen(true);
    });
  };
  // What the live region says, with a counter: the region stays on the page and each name set puts a
  // fresh node inside it (as Share does), so the same sentence twice is announced twice.
  const [said, setSaid] = useState({ count: 0, text: "" });
  const name = typed ?? viewer.name;
  // A typed name with no letter or digit has no initials: the avatar draws "?" as it does with no name.
  const typedInitials = typed === null ? "" : initialsOf(typed);
  const initials =
    typed === null || typed === viewer.name
      ? viewer.initials
      : typedInitials === ""
        ? "?"
        : typedInitials;
  return {
    name,
    initials,
    said,
    dialog: { open, current: name, refused },
    ask: () => {
      setOpen(true);
    },
    submit: (next: string) => {
      setTyped(next);
      setSaid({ count: said.count + 1, text: `Signed in as ${next}` });
      setOpen(false);
      setRefused(null);
      send(next);
    },
    cancel: () => {
      setOpen(false);
      setRefused(null);
    },
  };
}

const SKIP =
  "sr-only outline-focus-ring focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:fixed focus:top-2 focus:left-2 focus:z-10 focus:rounded-ds-xs focus:bg-surface-card focus:p-2 focus:text-text-link";

export function SignalFrame({
  scene,
  current,
  follow,
  children,
}: {
  scene: SignalScene;
  current: SignalCurrent;
  follow: SignalFollow;
  children: ReactNode;
}) {
  const content = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const listButton = useRef<HTMLButtonElement>(null);
  const viewer = useViewerName(scene.snapshot.viewer);
  const wide = useWide();
  // The list's panel, in a narrow window only: choosing a destination closes it.
  const [listOpen, setListOpen] = useState(false);
  // A window made wide has the list beside the page; made narrow again, the panel starts closed.
  if (wide && listOpen) setListOpen(false);
  const { name, initials } = viewer;
  const list = (
    <ChannelList
      scene={scene}
      current={current}
      follow={follow}
      chip={
        <NameChip
          name={name}
          initials={initials}
          roleLabel={scene.snapshot.viewer.roleLabel}
          chipRef={chipRef}
          onPress={viewer.ask}
        />
      }
    />
  );
  return (
    <div className="flex h-full">
      <a
        href="#signal-content"
        className={SKIP}
        onClick={(event) => {
          event.preventDefault();
          content.current?.focus();
        }}
      >
        Skip to the feed
      </a>
      {wide ? list : null}
      <NameDialog
        {...viewer.dialog}
        onSubmit={viewer.submit}
        onCancel={viewer.cancel}
        // The chip is in the list: beside the page, or in the panel while that is open.
        onGone={() => (chipRef.current ?? listButton.current)?.focus()}
      />
      <div role="status" className="sr-only">
        {viewer.said.count > 0 ? <span key={viewer.said.count}>{viewer.said.text}</span> : null}
      </div>
      <div
        id="signal-content"
        ref={content}
        tabIndex={-1}
        className="min-w-0 flex-1 overflow-y-auto p-4 outline-none min-[768px]:p-8"
      >
        {wide ? null : (
          <ChannelPanel
            place={placeOf(scene, current)}
            unread={anyUnread(scene)}
            open={listOpen}
            onOpenChange={setListOpen}
            buttonRef={listButton}
          >
            <ListFormContext
              value={{
                panel: true,
                onGo: () => {
                  setListOpen(false);
                },
              }}
            >
              {list}
            </ListFormContext>
          </ChannelPanel>
        )}
        <SignalViewerContext value={{ name, initials }}>{children}</SignalViewerContext>
      </div>
    </div>
  );
}

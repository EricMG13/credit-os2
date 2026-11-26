// The layout every Signal page sits in, filling the full-bleed page region under the shell's top
// bar: the channel list as a tile on the left (as the report's module list is), the page's content
// on the right, each scrolling on its own. Where the window has no room for the list beside the
// page (parts/useWide.ts) the page takes the whole region and the list opens from a button ahead
// of the page (ChannelPanel.tsx).
import { createContext, useContext, useId, useRef, useState, type FC, type ReactNode } from "react";
import {
  Bookmark,
  Building07,
  Clock,
  File05,
  Hash02,
  Sliders04,
  Star01,
  Stars01,
  Users01,
} from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { StatusBadge } from "@/components/status/StatusBadge";
import { cx } from "@/utils/cx";
import { AvatarLabelGroup } from "./parts/Avatar";
import { PHONE_TARGETS } from "./parts/classes";
import { useWide } from "./parts/useWide";
import { ChannelPanel } from "./ChannelPanel";
import { SignalViewerContext } from "./viewer";
import type { SignalIssuerChannel, SignalScene } from "./slice";

/** Which channel the page is on; the item with the same key is marked current. */
export type SignalCurrent =
  | { kind: "view"; id: "for-you" | "latest" | "saved" }
  | { kind: "topic" | "issuer" | "group" | "digest"; id: string }
  | { kind: "settings" }
  /** The address names no channel item (an unknown view or topic): nothing is marked current. */
  | { kind: "none" };

/** Follow state (of topics, or of issuers) kept above the frame so the channel list and the page agree; in memory unless the page is drawn on a service. */
export type SignalFollow = {
  on: (topic: { id: string; followed: boolean }) => boolean;
  toggle: (topic: { id: string; followed: boolean }) => void;
};
/** The two things a reader follows; a topic and an issuer may share an id, so each has its own state. */
export type SignalFollows = { topics: SignalFollow; issuers: SignalFollow };

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
        "flex items-center rounded-ds-md border px-2 text-small font-medium",
        // The current item: the accent tint and the accent edge, as the report's module list marks its own.
        on
          ? "border-action bg-surface-selected text-text-link"
          : "border-transparent text-text-secondary hover:bg-surface-subtle",
      )}
    >
      {/* The link is as tall as its row, so the whole row takes a press: 44px in the panel. */}
      <a
        href={href}
        aria-current={on ? "page" : undefined}
        onClick={onGo}
        className={cx(
          "flex min-w-0 flex-1 items-center gap-2 rounded-ds-sm py-1.5 outline-focus-ring focus-visible:outline-2",
          panel ? "min-h-11" : "min-h-8",
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
  <span className="ml-3 font-mono text-caption font-normal text-text-tertiary tabular-nums">
    {children}
  </span>
);

function Heading({ children }: { children: string }) {
  return <h2 className="px-2 pt-4 pb-1 text-caption font-medium text-text-tertiary">{children}</h2>;
}

/** A topic's or an issuer's row: its page, its delivered count and the star that follows it. */
function FollowRow({
  href,
  icon,
  on,
  item,
  follow,
}: Omit<RowProps, "children"> & {
  item: { id: string; name: string; count: string | null; followed: boolean };
  follow: SignalFollow;
}) {
  const followed = follow.on(item);
  return (
    <Row
      href={href}
      icon={icon}
      on={on}
      mark={<Count>{item.count ?? "n.a."}</Count>}
      after={
        <ButtonUtility
          tooltip={`${followed ? "Unfollow" : "Follow"} ${item.name}`}
          aria-pressed={followed}
          className={cx("size-8", followed && "text-action hover:text-action-hover")}
          icon={<Star01 data-icon className={followed ? "fill-current" : undefined} />}
          onPress={() => {
            follow.toggle(item);
          }}
        />
      }
    >
      {item.name}
    </Row>
  );
}

/** The watchlist's issuers, between Topics and Groups; no heading where there is none to list. */
function IssuerRows({
  scene,
  issuers,
  current,
  follow,
}: {
  scene: SignalScene;
  issuers: SignalIssuerChannel[];
  current: SignalCurrent;
  follow: SignalFollow;
}) {
  if (issuers.length === 0) return null;
  return (
    <>
      <Heading>Issuers</Heading>
      <ul className="flex flex-col gap-px">
        {issuers.map((issuer) => (
          <FollowRow
            key={issuer.id}
            href={sceneHref(scene, `issuer/${encodeURIComponent(issuer.id)}`)}
            icon={Building07}
            on={isCurrent(current, "issuer", issuer.id)}
            item={issuer}
            follow={follow}
          />
        ))}
      </ul>
    </>
  );
}

function ChannelList({
  scene,
  current,
  follows,
  chip,
}: {
  scene: SignalScene;
  current: SignalCurrent;
  follows: SignalFollows;
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
        "flex flex-col bg-surface-card",
        // The panel scrolls, so the list in it takes the panel's width and at least its height.
        // Beside the page it is a tile inside the page gutter, as tall as the region allows.
        panel
          ? "min-h-full w-full px-4 pt-5 pb-5"
          : "my-8 ml-8 w-64 shrink-0 overflow-y-auto rounded-ds-lg border border-border-subtle p-3",
      )}
    >
      <h2
        id={headingId}
        className={cx(
          "flex items-center px-2 text-small font-medium text-text-primary",
          // In the panel it shares its row with the close button.
          panel ? "min-h-9" : "min-h-8",
        )}
      >
        Signal
      </h2>
      <ul className="flex flex-col gap-px pt-1">
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
        <p className="px-2 py-2 text-small text-text-tertiary">No topics yet</p>
      ) : (
        <ul className="flex flex-col gap-px">
          {channels.topics.map((topic) => (
            <FollowRow
              key={topic.id}
              href={sceneHref(scene, `topic/${encodeURIComponent(topic.id)}`)}
              icon={Hash02}
              on={isCurrent(current, "topic", topic.id)}
              item={topic}
              follow={follows.topics}
            />
          ))}
        </ul>
      )}
      <IssuerRows
        scene={scene}
        issuers={channels.issuers ?? []}
        current={current}
        follow={follows.issuers}
      />
      <Heading>Groups</Heading>
      {channels.groups.length === 0 ? (
        <p className="px-2 py-2 text-small text-text-tertiary">No groups yet</p>
      ) : (
        <ul className="flex flex-col gap-px">
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
        <p className="px-2 py-2 text-small text-text-tertiary">No digests yet</p>
      ) : (
        <ul className="flex flex-col gap-px">
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
      <span className="ml-2 *:text-caption!">
        <StatusBadge set="Signal source states" state="Paused" />
      </span>
    );
  }
  if (!unread) return null;
  return (
    <span className="ml-3 size-2 shrink-0 rounded-ds-full bg-action">
      <span className="sr-only">Unread</span>
    </span>
  );
}

/** The signed-in account's name and profile, as held by the actual Signal snapshot. */
function NameChip({
  name,
  initials,
  roleLabel,
}: {
  name: string | null;
  initials: string | null;
  roleLabel: string;
}) {
  return (
    <div className="mt-auto px-2 pt-4 pb-1">
      <AvatarLabelGroup
        size="sm"
        initials={initials ?? "?"}
        own={name !== null}
        title={name ?? "Account"}
        subtitle={roleLabel}
      />
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
    case "issuer":
      return channels.issuers?.find((item) => item.id === current.id)?.name ?? null;
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

const SKIP =
  "sr-only outline-focus-ring focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-ds-sm focus:bg-surface-card focus:px-3 focus:py-2 focus:text-text-primary";

export function SignalFrame({
  scene,
  current,
  follows,
  children,
}: {
  scene: SignalScene;
  current: SignalCurrent;
  follows: SignalFollows;
  children: ReactNode;
}) {
  const content = useRef<HTMLDivElement>(null);
  const listButton = useRef<HTMLButtonElement>(null);
  const wide = useWide();
  // The list's panel, in a narrow window only: choosing a destination closes it.
  const [listOpen, setListOpen] = useState(false);
  // A window made wide has the list beside the page; made narrow again, the panel starts closed.
  if (wide && listOpen) setListOpen(false);
  const { name, initials, profileType } = scene.snapshot.viewer;
  const list = (
    <ChannelList
      scene={scene}
      current={current}
      follows={follows}
      chip={
        <NameChip name={name} initials={initials} roleLabel={scene.snapshot.viewer.roleLabel} />
      }
    />
  );
  return (
    <div className={cx("flex h-full text-body", PHONE_TARGETS)}>
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
      <div
        id="signal-content"
        ref={content}
        tabIndex={-1}
        // The region is the scroller and holds the Channels strip's height as `--strip` (none where
        // the list is beside the page): the strip takes it, what focus or a link scrolls to stops
        // below it, and the page's alert sticks under it (SignalPage.tsx).
        className={cx(
          "min-w-0 flex-1 scroll-pt-(--strip) overflow-y-auto outline-none",
          wide ? "[--strip:0px]" : "[--strip:3.25rem] max-[480px]:[--strip:3.75rem]",
        )}
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
        {/* The shell's page padding; beside the list the left side is the 16px gap between tiles. */}
        <div className={cx("p-4 sm:p-8", wide && "sm:pl-4")}>
          <SignalViewerContext value={{ name, initials, profileType }}>
            {children}
          </SignalViewerContext>
        </div>
      </div>
    </div>
  );
}

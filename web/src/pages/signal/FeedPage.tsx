// A feed page: its view title row (title, freshness, Top or Latest), the kind tabs and search, the
// pill for new stories, then the entries on one card with hairlines between them, then Show older.
// An entry is a story or a digest card. Order, filter, search, the pill and Show older all act on
// in-memory state over the entries the slice supplied; nothing is fetched or stored. On a service
// the pill's Show is the one exception: the service's page folds the waiting stories into the list
// it supplies, so the next ones to arrive wait behind a pill of their own.
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Star01 } from "@untitledui/icons";
import { Alert } from "@/components/alert/Alert";
import { Button } from "@/components/base/buttons/button";
import { useSignalActions } from "./actions";
import { DigestCard } from "./DigestCard";
import { FeedControls, OrderToggle, type FeedKind, type FeedOrder } from "./FeedControls";
import { EmptyNote, FeedAlert, FeedEmpty, FeedSkeleton, type EmptyContext } from "./FeedStates";
import { FreshnessBadge } from "./parts/FreshnessBadge";
import { PageTitle } from "./parts/PageTitle";
import { Pill } from "./parts/Pill";
import { Tags } from "./parts/Tags";
import type { SignalDigestCard, SignalFreshness, SignalScene, SignalStory } from "./slice";
import { StoryCard, type SignalSave } from "./StoryCard";

export type FeedEntry =
  | { kind: "story"; story: SignalStory }
  | { kind: "digest"; digest: SignalDigestCard; href: string };

/** A view's entries as the slice orders them; `waiting` and `older` are the ones not yet drawn. */
export type FeedEntries = {
  top: FeedEntry[];
  latest: FeedEntry[];
  waiting: { label: string; entries: FeedEntry[] } | null;
  older: FeedEntry[];
};

/** A topic view's own header parts: the follow state and the keywords it follows. */
export type FeedTopic = { on: boolean; onToggle: () => void; keywords: string[] };

function FeedHeader({
  title,
  titleRef,
  freshness,
  order,
  onOrder,
  topic,
}: {
  title: string;
  titleRef: Ref<HTMLHeadingElement>;
  freshness: SignalFreshness;
  order: FeedOrder;
  /** Absent where the view has one order only (Latest and Saved draw no switch). */
  onOrder: ((order: FeedOrder) => void) | null;
  topic: FeedTopic | null;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <PageTitle titleRef={titleRef}>{title}</PageTitle>
        {topic === null ? null : (
          <Button
            color={topic.on ? "secondary" : "tertiary"}
            size="sm"
            iconLeading={<Star01 data-icon className={topic.on ? "fill-current" : undefined} />}
            aria-pressed={topic.on}
            onPress={topic.onToggle}
          >
            {topic.on ? "Following" : "Follow"}
          </Button>
        )}
        <FreshnessBadge freshness={freshness} />
        {onOrder === null ? null : (
          <div className="ml-auto">
            <OrderToggle order={order} onOrder={onOrder} />
          </div>
        )}
      </div>
      {topic === null || topic.keywords.length === 0 ? null : (
        <div className="mt-3">
          <Tags tags={topic.keywords} label="Topic keywords" />
        </div>
      )}
    </>
  );
}

/** Stories of the chosen kind whose headline, summary, source name or tag holds the query; a digest card is under All with no query only. */
function visible(entries: FeedEntry[], kind: FeedKind, query: string): FeedEntry[] {
  const needle = query.toLowerCase();
  return entries.filter((entry) => {
    if (entry.kind === "digest") return kind === "all" && needle === "";
    const { story } = entry;
    if (kind !== "all" && story.kind !== kind) return false;
    if (needle === "") return true;
    return [story.headline, story.summary ?? "", story.source.name, ...story.tags].some((text) =>
      text.toLowerCase().includes(needle),
    );
  });
}

/** The entries in the order given; none means nothing is drawn yet. */
function EntryList({
  entries,
  scene,
  writer,
  save,
  onShared,
  listRef,
}: {
  entries: FeedEntry[];
  scene: SignalScene;
  writer: boolean;
  save: SignalSave;
  onShared: () => void;
  listRef: Ref<HTMLDivElement>;
}) {
  if (entries.length === 0) return null;
  return (
    <div
      ref={listRef}
      className="mt-4 divide-y divide-border-hairline rounded-ds-lg border border-border-subtle bg-surface-card px-8 py-2 shadow-1"
    >
      {entries.map((entry) =>
        entry.kind === "story" ? (
          <StoryCard
            key={entry.story.id}
            story={entry.story}
            scene={scene}
            writer={writer}
            save={save}
            onShared={onShared}
          />
        ) : (
          <DigestCard key={entry.digest.id} digest={entry.digest} href={entry.href} />
        ),
      )}
    </div>
  );
}

/** The stories that pass the filter; when none does, the words for why: the search, the kind, or an empty view. */
function FeedResult({
  hasEntries,
  kind,
  needle,
  empty,
  loading,
  children,
}: {
  hasEntries: boolean;
  kind: FeedKind;
  needle: string;
  empty: EmptyContext;
  loading: boolean;
  children: ReactNode;
}) {
  if (loading) return <FeedSkeleton />;
  if (hasEntries) return children;
  if (needle !== "") {
    return (
      <EmptyNote
        title={`No story matches ${needle}`}
        hint="Check the spelling or clear the search."
      />
    );
  }
  if (kind !== "all") {
    return <EmptyNote title="No stories of this kind here" hint="Choose All to see every kind." />;
  }
  return <FeedEmpty context={empty} />;
}

function FeedNotices({
  waiting,
  waitingVisible,
  onReveal,
  error,
  shared,
}: {
  waiting: FeedEntries["waiting"];
  waitingVisible: boolean;
  onReveal: () => void;
  error: "unreachable" | "request" | "unreadable" | null;
  shared: number;
}) {
  return (
    <>
      {/* Always on the page, so a pill that arrives with a later read is announced. */}
      <div aria-live="polite">
        {waiting === null || waitingVisible ? null : (
          <div className="mt-4 flex justify-center">
            <Pill label={waiting.label} action="Show" onAction={onReveal} />
          </div>
        )}
      </div>
      {error === null ? null : <FeedAlert error={error} />}
      <div aria-live="polite">
        {shared === 0 ? null : (
          <div key={shared} className="mt-4">
            <Alert tone="success" title="Sample data: the story was not shared." />
          </div>
        )}
      </div>
    </>
  );
}

function OlderStories({
  loading,
  older,
  onShow,
}: {
  loading: boolean;
  older: FeedEntry[];
  onShow: () => void;
}) {
  if (loading || older.length === 0) return null;
  return (
    <div className="mt-4 flex justify-center">
      <Button color="secondary" size="sm" onPress={onShow}>
        Show older
      </Button>
    </div>
  );
}

function entriesOnScreen(
  entries: FeedEntries,
  order: FeedOrder,
  revealed: boolean,
  olderShown: boolean,
): FeedEntry[] {
  return [
    ...(revealed && entries.waiting !== null ? entries.waiting.entries : []),
    ...entries[order],
    ...(olderShown ? entries.older : []),
  ];
}

function focusIndex(
  entries: FeedEntry[],
  kind: FeedKind,
  needle: string,
  fallback: number | "title",
) {
  return visible(entries, kind, needle).length > 0 ? fallback : "title";
}

function restoreFeedFocus(
  focusAt: number | "title" | null,
  title: HTMLHeadingElement | null,
  list: HTMLDivElement | null,
): void {
  if (focusAt === null) return;
  if (focusAt === "title") title?.focus();
  else list?.querySelectorAll("article")[focusAt]?.querySelector("h2")?.focus();
}

function useFeedFocus(revealed: boolean, olderShown: boolean) {
  const list = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const lastFocused = useRef(0);
  const [focusRequest, setFocusRequest] = useState<{
    version: number;
    target: number | "title";
  } | null>(null);
  useEffect(() => {
    if (focusRequest === null || focusRequest.version === lastFocused.current) return;
    lastFocused.current = focusRequest.version;
    restoreFeedFocus(focusRequest.target, title.current, list.current);
  }, [focusRequest, revealed, olderShown]);
  const setFocusAt = (target: number | "title") => {
    setFocusRequest((request) => ({ version: (request?.version ?? 0) + 1, target }));
  };
  return { list, title, setFocusAt };
}

function useFeedView(entries: FeedEntries, startOn: FeedOrder) {
  const fold = useSignalActions()?.reveal;
  const [order, setOrder] = useState<FeedOrder>(startOn);
  const [kind, setKind] = useState<FeedKind>("all");
  const [query, setQuery] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [olderShown, setOlderShown] = useState(false);
  const { list, title, setFocusAt } = useFeedFocus(revealed, olderShown);
  const { waiting, older } = entries;
  const needle = query.trim();
  const drawn = entriesOnScreen(entries, order, revealed, olderShown);
  const shown = visible(drawn, kind, needle);

  const reveal = () => {
    setFocusAt(focusIndex(waiting?.entries ?? [], kind, needle, 0));
    if (fold === undefined) setRevealed(true);
    else fold();
  };
  const showOlder = () => {
    setFocusAt(focusIndex(older, kind, needle, shown.length));
    setOlderShown(true);
  };

  return {
    header: { order, setOrder },
    filter: { kind, setKind, query, setQuery, needle },
    listing: { waiting, shown, older, revealed, olderShown },
    actions: { reveal, showOlder },
    refs: { list, title },
  };
}

export function FeedPage({
  scene,
  title: heading,
  freshness,
  entries,
  startOn,
  switchable,
  writer,
  save,
  loading,
  error,
  empty,
  topic,
}: {
  scene: SignalScene;
  title: string;
  freshness: SignalFreshness;
  entries: FeedEntries;
  /** The order the view starts on; with `switchable` false it is the only order. */
  startOn: FeedOrder;
  switchable: boolean;
  writer: boolean;
  /** The saved choice by story id, kept above the list so a filter does not forget it. */
  save: SignalSave;
  /** The feed is still loading: the skeleton stands in for the list. */
  loading: boolean;
  error: "unreachable" | "request" | "unreadable" | null;
  empty: EmptyContext;
  /** Set on a topic's view only. */
  topic: FeedTopic | null;
}) {
  // Share to group writes nothing: this sentence is the in-memory stand-in for the service's reply.
  // It counts the shares: the live wrapper below stays on the page and each share puts a fresh
  // status node inside it, so each one is announced again.
  const [shared, setShared] = useState(0);
  const feed = useFeedView(entries, startOn);
  return (
    <>
      <FeedHeader
        title={heading}
        titleRef={feed.refs.title}
        topic={topic}
        freshness={freshness}
        order={feed.header.order}
        onOrder={switchable ? feed.header.setOrder : null}
      />
      <FeedControls
        kind={feed.filter.kind}
        onKind={feed.filter.setKind}
        query={feed.filter.query}
        onQuery={feed.filter.setQuery}
        above={
          <FeedNotices
            waiting={feed.listing.waiting}
            waitingVisible={loading || feed.listing.revealed}
            onReveal={feed.actions.reveal}
            error={error}
            shared={shared}
          />
        }
      >
        <FeedResult
          loading={loading}
          hasEntries={feed.listing.shown.length > 0}
          kind={feed.filter.kind}
          needle={feed.filter.needle}
          empty={empty}
        >
          <EntryList
            entries={feed.listing.shown}
            scene={scene}
            writer={writer}
            save={save}
            onShared={() => {
              setShared(shared + 1);
            }}
            listRef={feed.refs.list}
          />
        </FeedResult>
        {feed.listing.olderShown ? null : (
          <OlderStories
            loading={loading}
            older={feed.listing.older}
            onShow={feed.actions.showOlder}
          />
        )}
      </FeedControls>
    </>
  );
}

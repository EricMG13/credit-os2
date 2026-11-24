// One Signal address: picks the scene, then what the frame holds.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Alert } from "@/components/alert/Alert";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { useSource } from "../source";
import { useSignalActions } from "./actions";
import { SignalFrame, sceneHref, type SignalCurrent, type SignalFollow } from "./SignalFrame";
import { DigestPage } from "./DigestPage";
import { GroupPage } from "./GroupPage";
import { SettingsPage } from "./SettingsPage";
import { ThreadPanel } from "./ThreadPanel";
import { FeedPage, type FeedEntries, type FeedEntry } from "./FeedPage";
import type { EmptyContext } from "./FeedStates";
import type { SignalSave } from "./StoryCard";
import { PageTitle } from "./parts/PageTitle";
import { readSlice, type SignalFeedView, type SignalScene } from "./slice";

export type SignalPageKind = "feed" | "topic" | "group" | "thread" | "digest" | "settings";

const VIEWS = { "for-you": "For you", latest: "Latest", saved: "Saved" } as const;

/** An empty state; `page` makes its title the page's h1 (the kit's title stops at h2), else it is an h2 under one. */
function Empty({
  title,
  page = false,
  children,
}: {
  title: string;
  page?: boolean;
  children?: ReactNode;
}) {
  return (
    <EmptyState className="py-12">
      <EmptyState.Header>
        <EmptyState.FeaturedIcon />
      </EmptyState.Header>
      <EmptyState.Content>
        {page ? <PageTitle>{title}</PageTitle> : <EmptyState.Title>{title}</EmptyState.Title>}
      </EmptyState.Content>
      {children}
    </EmptyState>
  );
}

/** The entries a view lists, in its order; an id the feed lacks cannot reach here (the reader refuses it). */
function ordered(scene: SignalScene, ids: string[]): FeedEntry[] {
  const { stories, digests } = scene.snapshot.feed;
  const byId = new Map<string, FeedEntry>([
    ...stories.map((story): [string, FeedEntry] => [story.id, { kind: "story", story }]),
    ...digests.map((digest): [string, FeedEntry] => [
      digest.id,
      {
        kind: "digest",
        digest,
        href: sceneHref(scene, `digest/${encodeURIComponent(digest.digestId)}`),
      },
    ]),
  ]);
  return ids.map((id) => {
    const entry = byId.get(id);
    if (entry === undefined)
      throw new Error(`the slice reader let through an unknown entry "${id}"`);
    return entry;
  });
}

/** All the entries a view supplies: both orders, the waiting ones and the older ones. */
function entriesOf(scene: SignalScene, view: SignalFeedView): FeedEntries {
  return {
    top: ordered(scene, view.top),
    latest: ordered(scene, view.latest),
    waiting:
      view.waiting === null
        ? null
        : { label: view.waiting.label, entries: ordered(scene, view.waiting.ids) },
    older: ordered(scene, view.older),
  };
}

/** The reader gives every channel topic an order; a missing one is a wiring fault, so it is loud. */
function topicView(scene: SignalScene, id: string): SignalFeedView {
  const { topics } = scene.snapshot.feed;
  const order = Object.hasOwn(topics, id) ? topics[id] : undefined;
  if (order === undefined)
    throw new Error(`the slice reader let through topic "${id}" with no order`);
  return order;
}

/** The route pattern guarantees these segments; a missing one is a wiring fault, so it is loud. */
function param(params: Record<string, string>, name: string): string {
  const value = params[name];
  if (value === undefined) throw new Error(`the route gave no "${name}" segment`);
  return value;
}

/** What a feed view needs to say why it is empty, with the follow state it shares with the channel list. */
function emptyContext(
  scene: SignalScene,
  view: EmptyContext["view"],
  follow: SignalFollow,
  writer: boolean,
): EmptyContext {
  const { channels, feed } = scene.snapshot;
  return {
    view,
    approved: feed.sources.approved,
    propose: writer ? sceneHref(scene, "settings/sources") : null,
    noneFollowed: !channels.topics.some((t) => t.followed),
    topics: channels.topics.map((t) => ({ id: t.id, name: t.name, on: follow.on(t) })),
    onFollow: (id) => {
      const topic = channels.topics.find((t) => t.id === id);
      if (topic === undefined) throw new Error(`the empty state named an unknown topic "${id}"`);
      follow.toggle(topic);
    },
  };
}

type PageFor = {
  scene: SignalScene;
  kind: SignalPageKind;
  params: Record<string, string>;
  follow: SignalFollow;
  save: SignalSave;
  /** Drawn on the service: no control is drawn for what the service cannot yet store. */
  live: boolean;
};

type PageContent = { current: SignalCurrent; body: ReactNode };

function missing(title: string, back: ReactNode): PageContent {
  return {
    current: { kind: "none" },
    body: (
      <Empty page title={title}>
        {back}
      </Empty>
    ),
  };
}

function feedFor(
  scene: SignalScene,
  params: Record<string, string>,
  follow: SignalFollow,
  save: SignalSave,
  writer: boolean,
): PageContent {
  const view = Object.keys(VIEWS).find((id) => id === params["view"]);
  if (view === undefined) return missing("No such view", <BackToFeed scene={scene} />);
  const id = view as keyof typeof VIEWS;
  return {
    current: { kind: "view", id },
    body: (
      <FeedPage
        scene={scene}
        key={`${scene.id}/feed/${id}`}
        title={VIEWS[id]}
        freshness={scene.snapshot.feed.freshness}
        entries={entriesOf(scene, scene.snapshot.feed.views[id])}
        startOn={id === "for-you" ? "top" : "latest"}
        switchable={id === "for-you"}
        writer={writer}
        save={save}
        loading={scene.snapshot.feed.status === "loading"}
        error={scene.snapshot.feed.error}
        empty={emptyContext(scene, id, follow, writer)}
        topic={null}
      />
    ),
  };
}

function topicFor(
  scene: SignalScene,
  params: Record<string, string>,
  follow: SignalFollow,
  save: SignalSave,
  writer: boolean,
): PageContent {
  const topic = scene.snapshot.channels.topics.find((t) => t.id === params["topic"]);
  if (topic === undefined) return missing("No such topic", <BackToFeed scene={scene} />);
  return {
    current: { kind: "topic", id: topic.id },
    body: (
      <FeedPage
        scene={scene}
        key={`${scene.id}/topic/${topic.id}`}
        title={topic.name}
        freshness={scene.snapshot.feed.freshness}
        entries={entriesOf(scene, topicView(scene, topic.id))}
        startOn="top"
        switchable
        writer={writer}
        save={save}
        loading={scene.snapshot.feed.status === "loading"}
        error={scene.snapshot.feed.error}
        empty={emptyContext(scene, "topic", follow, writer)}
        topic={{
          on: follow.on(topic),
          onToggle: () => {
            follow.toggle(topic);
          },
          keywords: topic.keywords,
        }}
      />
    ),
  };
}

function BackToFeed({ scene }: { scene: SignalScene }) {
  return (
    <EmptyState.Footer>
      <a className="text-sm font-semibold text-text-link" href={sceneHref(scene, "feed/for-you")}>
        Back to For you
      </a>
    </EmptyState.Footer>
  );
}

function groupFor(
  scene: SignalScene,
  params: Record<string, string>,
  kind: SignalPageKind,
  save: SignalSave,
  writer: boolean,
): PageContent {
  const id = param(params, "group");
  const group = scene.snapshot.groups.find((item) => item.id === id);
  if (group === undefined)
    return missing(
      "This group does not exist or is not open to you.",
      <BackToFeed scene={scene} />,
    );
  const threadId = kind === "thread" ? param(params, "thread") : null;
  const thread =
    threadId === null
      ? undefined
      : (scene.snapshot.threads.find((item) => item.groupId === id && item.id === threadId) ??
        null);
  return {
    current: { kind: "group", id },
    body: (
      <>
        <GroupPage key={group.id} scene={scene} group={group} writer={writer} save={save} />
        {thread === undefined ? null : (
          <ThreadPanel scene={scene} group={group} thread={thread} writer={writer} />
        )}
      </>
    ),
  };
}

function digestFor(
  scene: SignalScene,
  params: Record<string, string>,
  writer: boolean,
  live: boolean,
): PageContent {
  const id = param(params, "digest");
  const digest = scene.snapshot.digests.find((item) => item.id === id);
  if (digest === undefined)
    return missing(
      live ? "No such digest" : "No such digest in this sample",
      <BackToFeed scene={scene} />,
    );
  return {
    current: { kind: "digest", id },
    body: (
      <DigestPage
        scene={scene}
        digest={digest}
        writer={writer}
        none={<Empty title="No digest yet" />}
      />
    ),
  };
}

function pageFor({ scene, kind, params, follow, save, live }: PageFor): PageContent {
  const writer = scene.snapshot.viewer.role === "writer";
  // The service stores no groups and takes no source proposals yet, so a live feed draws a writer
  // no Comment, Share to group or Propose a source: each would look saved and save nothing.
  const feedWriter = writer && !live;
  switch (kind) {
    case "feed":
      return feedFor(scene, params, follow, save, feedWriter);
    case "topic":
      return topicFor(scene, params, follow, save, feedWriter);
    case "group":
    case "thread":
      return groupFor(scene, params, kind, save, writer);
    case "digest":
      return digestFor(scene, params, writer, live);
    case "settings":
      return {
        current: { kind: "settings" },
        body: (
          <SettingsPage
            scene={scene}
            section={param(params, "section")}
            writer={writer}
            state={(title) => <Empty title={title} />}
          />
        ),
      };
  }
}

export function SignalPage({
  kind,
  params,
}: {
  kind: SignalPageKind;
  params: Record<string, string>;
}) {
  const slice = readSlice(useSource().signal);
  if (slice.kind !== "ok") {
    return (
      <div className="p-8">
        <Empty page title="No Signal data in this library" />
      </div>
    );
  }
  const scene = slice.data.scenes.find((s) => s.id === params["scene"]);
  if (scene === undefined) {
    return (
      <div className="p-8">
        <Empty page title="No such sample scene">
          <EmptyState.Footer>
            <a
              className="text-sm font-semibold text-text-link"
              href={sceneHref(slice.data.scenes[0], "feed/for-you")}
            >
              Back to the sample scenes
            </a>
          </EmptyState.Footer>
        </Empty>
      </div>
    );
  }
  return <SceneView key={scene.id} scene={scene} kind={kind} params={params} />;
}

type Write = (id: string, on: boolean) => Promise<string | null>;

/**
 * A yes or no per id, over the value the slice delivers. With no service (`write` null) a choice is
 * kept in memory only. With one, a choice shows at once and is sent; when its answer comes and no
 * later press on the same id is still out, the page goes back to the slice's value: the re-read one
 * after a write the service accepted, the earlier one after a write it refused (`onRefused` says why).
 */
function useChoices(write: Write | null, onRefused: (sentence: string) => void) {
  const [chosen, setChosen] = useState<ReadonlyMap<string, boolean>>(new Map());
  const out = useRef(new Map<string, number>());
  const count = (id: string, change: 1 | -1) => {
    const left = (out.current.get(id) ?? 0) + change;
    out.current.set(id, left);
    return left;
  };
  const forget = (id: string) => {
    setChosen((held) => new Map([...held].filter(([key]) => key !== id)));
  };
  return {
    on: (id: string, delivered: boolean) => chosen.get(id) ?? delivered,
    toggle: (id: string, delivered: boolean) => {
      const next = !(chosen.get(id) ?? delivered);
      setChosen((held) => new Map(held).set(id, next));
      if (write === null) return;
      count(id, 1);
      void write(id, next).then((refusal) => {
        if (refusal !== null) onRefused(refusal);
        if (count(id, -1) === 0) forget(id);
      });
    },
  };
}

/**
 * What the service last refused, for the alert above the page it was refused on. Counted, so each
 * refusal draws a fresh alert and the same sentence twice is announced twice. The next press, or
 * moving to another page, takes it away.
 */
function useRefusal(page: string) {
  const [refused, setRefused] = useState({ count: 0, text: "", page });
  const shown = useRef(page);
  useEffect(() => {
    shown.current = page;
  }, [page]);
  return {
    count: refused.count,
    text: refused.text !== "" && refused.page === page ? refused.text : null,
    say: (text: string) => {
      setRefused((last) => ({ count: last.count + 1, text, page: shown.current }));
    },
    clear: () => {
      setRefused((last) => ({ ...last, text: "" }));
    },
  };
}

/** One scene's page: the follow and save state live here, so the channel list and every page share them. */
function SceneView({
  scene,
  kind,
  params,
}: {
  scene: SignalScene;
  kind: SignalPageKind;
  params: Record<string, string>;
}) {
  const actions = useSignalActions();
  const refusal = useRefusal(`${kind} ${JSON.stringify(params)}`);
  const follows = useChoices(actions?.follow ?? null, refusal.say);
  const saves = useChoices(actions?.save ?? null, refusal.say);
  const { clear } = refusal;
  const follow: SignalFollow = {
    on: (topic) => follows.on(topic.id, topic.followed),
    toggle: (topic) => {
      clear();
      follows.toggle(topic.id, topic.followed);
    },
  };
  const save: SignalSave = {
    on: (story) => saves.on(story.id, story.saved),
    toggle: (story) => {
      clear();
      saves.toggle(story.id, story.saved);
    },
  };
  const { current, body } = pageFor({ scene, kind, params, follow, save, live: actions !== null });
  return (
    <SignalFrame scene={scene} current={current} follow={follow}>
      {refusal.text === null ? null : (
        <div key={refusal.count} className="mb-4">
          <Alert tone="error" title={refusal.text} />
        </div>
      )}
      {body}
    </SignalFrame>
  );
}

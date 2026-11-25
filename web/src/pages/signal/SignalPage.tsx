// One Signal address: picks the scene, then what the frame holds.
import { useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Alert } from "@/components/alert/Alert";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { useSource } from "../source";
import {
  SignalPageWriteContext,
  useSignalActions,
  type SignalPageWrite,
  type SignalWrite,
} from "./actions";
import { useChoices } from "./choices";
import { heldLogos, SignalLogosContext } from "./logos";
import {
  SignalFrame,
  sceneHref,
  type SignalCurrent,
  type SignalFollow,
  type SignalFollows,
} from "./SignalFrame";
import { DigestPage } from "./DigestPage";
import { GroupPage } from "./GroupPage";
import { SettingsPage } from "./SettingsPage";
import { ThreadPanel } from "./ThreadPanel";
import { FeedPage, type FeedEntries, type FeedEntry } from "./FeedPage";
import type { EmptyContext } from "./FeedStates";
import type { SignalSave } from "./StoryCard";
import { LINK } from "./parts/classes";
import { PageTitle } from "./parts/PageTitle";
import { readSlice, type SignalFeedView, type SignalScene } from "./slice";
import { writes } from "./writes";

export type SignalPageKind =
  "feed" | "topic" | "issuer" | "group" | "thread" | "digest" | "settings";

/**
 * Where "Open in Library" goes. The Library has no address for one issuer by its key, so the link
 * opens the Library itself: the connected app's at its root, the design-reference app's at its
 * own home. A library key is text a writer typed and is never put in an address.
 */
const LIBRARY = { live: "/", sample: "#/" } as const;

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
    shown: view.shown ?? null,
  };
}

/** The reader gives every channel topic and issuer an order; a missing one is a wiring fault, so it is loud. */
function orderOf(
  views: Record<string, SignalFeedView> | null,
  id: string,
  word: "topic" | "issuer",
): SignalFeedView {
  const order = views !== null && Object.hasOwn(views, id) ? views[id] : undefined;
  if (order === undefined)
    throw new Error(`the slice reader let through ${word} "${id}" with no order`);
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
    noneFollowed: ![...channels.topics, ...(channels.issuers ?? [])].some((one) => one.followed),
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
  follows: SignalFollows;
  save: SignalSave;
  /** Drawn on the service: no control is drawn for what the service cannot yet store. */
  live: boolean;
};

/** What the feed pages share: the scene, the follow state of the list they draw, the saves and the role. */
type FeedFor = {
  scene: SignalScene;
  params: Record<string, string>;
  follow: SignalFollow;
  save: SignalSave;
  writer: boolean;
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
        entries={entriesOf(scene, orderOf(scene.snapshot.feed.topics, topic.id, "topic"))}
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

/** An issuer's page: the feed page over the issuer's stories, with Follow and, where a writer gave the issuer a library key, the way to the Library. */
function issuerFor({ scene, params, follow, save, writer }: FeedFor, live: boolean): PageContent {
  const { channels, feed, settings } = scene.snapshot;
  const issuer = channels.issuers?.find((one) => one.id === params["issuer"]);
  if (issuer === undefined) return missing("No such issuer", <BackToFeed scene={scene} />);
  const held = settings.issuers?.find((one) => one.id === issuer.id);
  return {
    current: { kind: "issuer", id: issuer.id },
    body: (
      <FeedPage
        scene={scene}
        key={`${scene.id}/issuer/${issuer.id}`}
        title={issuer.name}
        freshness={feed.freshness}
        entries={entriesOf(scene, orderOf(feed.issuers, issuer.id, "issuer"))}
        startOn="top"
        switchable
        writer={writer}
        save={save}
        loading={feed.status === "loading"}
        error={feed.error}
        empty={emptyContext(scene, "issuer", follow, writer)}
        topic={{
          on: follow.on(issuer),
          onToggle: () => {
            follow.toggle(issuer);
          },
          keywords: [],
          library: held?.libraryKey == null ? null : LIBRARY[live ? "live" : "sample"],
        }}
      />
    ),
  };
}

function BackToFeed({ scene }: { scene: SignalScene }) {
  return (
    <EmptyState.Footer>
      <a className={`text-small ${LINK}`} href={sceneHref(scene, "feed/for-you")}>
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

function pageFor({ scene, kind, params, follows, save, live }: PageFor): PageContent {
  const writer = scene.snapshot.viewer.role === "writer";
  switch (kind) {
    case "feed":
      return feedFor(scene, params, follows.topics, save, writer);
    case "topic":
      return topicFor(scene, params, follows.topics, save, writer);
    case "issuer":
      return issuerFor({ scene, params, follow: follows.issuers, save, writer }, live);
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
      <div className="p-4 sm:p-8">
        <Empty page title="No Signal data in this library" />
      </div>
    );
  }
  const scene = slice.data.scenes.find((s) => s.id === params["scene"]);
  if (scene === undefined) {
    return (
      <div className="p-4 sm:p-8">
        <Empty page title="No such sample scene">
          <EmptyState.Footer>
            <a
              className={`text-small ${LINK}`}
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

/**
 * What the service last said, for the alert above the page it was said on: a refusal, or a sentence
 * of its own about a write it accepted. Counted, so each draws a fresh alert and the same sentence
 * twice is announced twice. The next write, or moving to another page, takes it away.
 */
function useNotice(page: string) {
  const [said, setSaid] = useState({ count: 0, text: "", refusal: true, page });
  const shown = useRef(page);
  useEffect(() => {
    shown.current = page;
  }, [page]);
  const say = (text: string, refusal: boolean) => {
    setSaid((last) => ({ count: last.count + 1, text, refusal, page: shown.current }));
  };
  return {
    said: said.text !== "" && said.page === page ? said : null,
    refuse: (text: string) => {
      say(text, true);
    },
    note: (text: string) => {
      say(text, false);
    },
    clear: () => {
      setSaid((last) => ({ ...last, text: "" }));
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
  const notice = useNotice(`${kind} ${JSON.stringify(params)}`);
  // On a service every write from inside the frame goes through here: a new one takes the last
  // sentence away, and a refusal is said above the page.
  const page: SignalPageWrite | null =
    actions === null
      ? null
      : {
          send: (request) => {
            notice.clear();
            return actions.write(request).then((answer) => {
              if (answer.refusal !== null) notice.refuse(answer.refusal);
              return answer;
            });
          },
          note: notice.note,
        };
  const sent = (request: (id: string, on: boolean) => SignalWrite) =>
    actions === null
      ? null
      : (id: string, on: boolean) =>
          actions.write(request(id, on)).then((answer) => answer.refusal);
  const topics = useChoices(sent(writes.follow), notice.refuse);
  const issuers = useChoices(sent(writes.followIssuer), notice.refuse);
  const saves = useChoices(sent(writes.save), notice.refuse);
  const followOf = (choices: typeof topics): SignalFollow => ({
    on: (one) => choices.on(one.id, one.followed),
    toggle: (one) => {
      notice.clear();
      choices.toggle(one.id, one.followed);
    },
  });
  const follows: SignalFollows = { topics: followOf(topics), issuers: followOf(issuers) };
  const save: SignalSave = {
    on: (story) => saves.on(story.id, story.saved),
    toggle: (story) => {
      notice.clear();
      saves.toggle(story.id, story.saved);
    },
  };
  const { current, body } = pageFor({ scene, kind, params, follows, save, live: actions !== null });
  // On a service the logos are the live page's own, asked of the service. With none, a scene may
  // carry sample logos of its own, and nothing is asked of anyone.
  const asked = useContext(SignalLogosContext);
  const held = scene.snapshot.logos;
  const sample = useMemo(() => (held === null ? null : heldLogos(held)), [held]);
  return (
    <SignalLogosContext value={actions === null ? sample : asked}>
      <SignalPageWriteContext value={page}>
        <SignalFrame scene={scene} current={current} follows={follows}>
          {notice.said === null ? null : (
            // It stays in view, 8px under the Channels strip where there is one (the frame's
            // `--strip`): the control pressed may be far down the page.
            <div
              key={notice.said.count}
              className="sticky top-[calc(var(--strip,0px)+0.5rem)] z-10 mb-4"
            >
              <Alert tone={notice.said.refusal ? "error" : "info"} title={notice.said.text} />
            </div>
          )}
          {body}
        </SignalFrame>
      </SignalPageWriteContext>
    </SignalLogosContext>
  );
}

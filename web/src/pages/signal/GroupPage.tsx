// The group view (mock frames "Group view, writer" and "Group view, reader"): the group and its
// members, then what was shared on one card with hairlines. A story is drawn with the story card
// and a note with its sharer's avatar and line; each has an "Open thread" link. The thread route draws
// this view under the thread panel. In the sample nothing here writes: New thread and Attach story
// are present for a writer and disabled with their reason in view. On a service each opens a form
// that starts the thread.
import { useState } from "react";
import { Link01, Users01, MessageSquare01, Plus } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { useSignalActions } from "./actions";
import { sceneHref } from "./SignalFrame";
import { StoryCard, type SignalSave } from "./StoryCard";
import { useOpener } from "./parts/focus";
import { FormDialog, type FormField } from "./parts/FormDialog";
import { writes } from "./writes";
import { ArchivedBadge } from "./parts/ArchivedBadge";
import { Avatar } from "./parts/Avatar";
import { LINK, LIST_TILE } from "./parts/classes";
import { KindKey } from "./parts/KindDot";
import { AvatarGroup } from "./parts/AvatarGroup";
import { PageTitle } from "./parts/PageTitle";
import type { SignalGroup, SignalScene, SignalStory, SignalThreadSummary } from "./slice";

const REASON_ID = "signal-group-write-reason";

/** A new thread in the group: a story from the feed with an optional note, or a note alone. */
function ThreadForm({
  group,
  stories,
  kind,
  onClose,
  onGone,
}: {
  group: SignalGroup;
  stories: SignalStory[];
  kind: "story" | "note" | null;
  onClose: () => void;
  onGone: () => void;
}) {
  const actions = useSignalActions();
  if (actions === null) return null;
  const story: FormField = {
    key: "story",
    kind: "choice",
    label: "Story",
    options: stories.map((one) => ({ id: one.id, label: one.headline })),
    value: stories[0]?.id ?? "",
  };
  const note: FormField =
    kind === "story"
      ? { key: "note", kind: "area", label: "Note (optional)", maxLength: 4000 }
      : {
          key: "note",
          kind: "area",
          label: "Note",
          maxLength: 4000,
          missing: "Write a note to start the thread.",
        };
  return (
    <FormDialog
      open={kind !== null}
      title={kind === "story" ? "Attach a story" : "New thread"}
      intro={`It starts a thread in ${group.name}, or joins the thread the story already has there.`}
      fields={kind === "story" ? [story, note] : [note]}
      action={kind === "story" ? "Attach story" : "Start thread"}
      onSend={({ text }) => {
        const chosen = stories.find((one) => one.id === text["story"]);
        const storyId = kind === "story" ? (chosen?.id ?? null) : null;
        return actions
          .write(writes.thread(group.id, storyId, (text["note"] ?? "").trim()))
          .then((answer) => answer.refusal);
      }}
      onClose={onClose}
      onGone={onGone}
    />
  );
}

function Header({
  group,
  writer,
  stories,
}: {
  group: SignalGroup;
  writer: boolean;
  /** The stories a writer can attach: the feed's. */
  stories: SignalStory[];
}) {
  const live = useSignalActions() !== null;
  const opener = useOpener();
  const [form, setForm] = useState<"story" | "note" | null>(null);
  const open = (kind: "story" | "note") => {
    opener.remember();
    setForm(kind);
  };
  // In the sample they would write and there is no service, so they are disabled with the reason beside them.
  const off = { isDisabled: !live, "aria-describedby": live ? undefined : REASON_ID };
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex items-center gap-3">
        <Avatar size="md" initials={null} icon={Users01} />
        <div>
          <PageTitle>{group.name}</PageTitle>
          <p className="text-small text-text-tertiary">
            <span>{group.memberSummary}</span>
            {" · "}
            <span>{group.visibility}</span>
          </p>
        </div>
      </div>
      {group.members.length === 0 ? null : (
        <>
          <AvatarGroup monograms={group.members.map((m) => m.initials)} more={group.moreMembers} />
          <ul aria-label="Members" className="sr-only">
            {group.members.map((m) => (
              <li key={m.name}>{m.name}</li>
            ))}
          </ul>
        </>
      )}
      {writer ? (
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          <Button
            color="secondary"
            iconLeading={Link01}
            {...off}
            onPress={() => {
              open("story");
            }}
          >
            Attach story
          </Button>
          <Button
            color="primary"
            iconLeading={Plus}
            {...off}
            onPress={() => {
              open("note");
            }}
          >
            New thread
          </Button>
          {live ? null : (
            <span id={REASON_ID} className="basis-full text-right text-small text-text-tertiary">
              Sample data: threads cannot be started here.
            </span>
          )}
          <ThreadForm
            group={group}
            stories={stories}
            kind={form}
            onClose={() => {
              setForm(null);
            }}
            onGone={opener.restore}
          />
        </div>
      ) : null}
    </div>
  );
}

/** A note: the sharer's avatar and line, then the text. Human text, so it may sit in a bubble. */
function Note({ thread }: { thread: SignalThreadSummary }) {
  if (thread.note === null) throw new Error("a note item holds no note");
  return (
    <article className="flex items-start gap-3 py-6">
      <Avatar size="sm" initials={thread.sharedBy.initials} />
      <div className="min-w-0 flex-1">
        <h2 className="text-small font-semibold text-text-primary">{thread.sharedBy.label}</h2>
        <p className="mt-2 max-w-[72ch] rounded-ds-sm border border-border-hairline bg-surface-subtle px-3 py-2 text-text-primary">
          {thread.note}
        </p>
      </div>
    </article>
  );
}

function Item({
  scene,
  group,
  thread,
  story,
  writer,
  save,
}: {
  scene: SignalScene;
  group: SignalGroup;
  thread: SignalThreadSummary;
  story: SignalStory | null;
  writer: boolean;
  save: SignalSave;
}) {
  return (
    <li>
      {story === null ? (
        <Note thread={thread} />
      ) : (
        // The thread's own sharer line and count replace the feed's; its count sits in the footer.
        <StoryCard
          story={{ ...story, sharedBy: thread.sharedBy, commentCount: null }}
          scene={scene}
          writer={writer}
          save={save}
          inGroup
        />
      )}
      <div className="-mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 pb-4 pl-15 text-small text-text-tertiary md:pl-24">
        {story !== null && thread.note !== null ? (
          <p className="basis-full text-text-secondary">{thread.note}</p>
        ) : null}
        {thread.unread ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-ds-full bg-action" />
            <span className="sr-only">Unread</span>
          </span>
        ) : null}
        {thread.archived ? <ArchivedBadge /> : null}
        {thread.commentCount === null ? null : (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <MessageSquare01 aria-hidden="true" className="size-4" />
            {thread.commentCount}
          </span>
        )}
        {thread.lastActivity === null ? null : (
          <time className="tabular-nums">{thread.lastActivity}</time>
        )}
        <a
          href={sceneHref(
            scene,
            `group/${encodeURIComponent(group.id)}/thread/${encodeURIComponent(thread.id)}`,
          )}
          data-thread-link={thread.id}
          aria-label={`Open thread: ${story === null ? thread.sharedBy.label : story.headline}`}
          className={LINK}
        >
          Open thread
        </a>
      </div>
    </li>
  );
}

export function GroupPage({
  scene,
  group,
  writer,
  save,
}: {
  scene: SignalScene;
  group: SignalGroup;
  writer: boolean;
  save: SignalSave;
}) {
  const stories = new Map(scene.snapshot.feed.stories.map((s) => [s.id, s]));
  return (
    <>
      <Header group={group} writer={writer} stories={scene.snapshot.feed.stories} />
      {group.threads.length === 0 ? (
        <EmptyState className="py-12">
          <EmptyState.Header>
            <EmptyState.FeaturedIcon />
          </EmptyState.Header>
          <EmptyState.Content>
            <EmptyState.Title>No threads in this group yet</EmptyState.Title>
            <EmptyState.Description>
              {writer
                ? "Share a story from the feed or start a note."
                : "Threads appear here when a writer shares a story or starts a note."}
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <>
          <KindKey stories={group.threads.flatMap((t) => stories.get(t.storyId ?? "") ?? [])} />
          <ul aria-label="Shared in this group" className={`mt-4 ${LIST_TILE}`}>
            {group.threads.map((thread) => {
              const story = thread.storyId === null ? null : (stories.get(thread.storyId) ?? null);
              if (thread.storyId !== null && story === null) {
                throw new Error(
                  `the slice reader let through an unknown story "${thread.storyId}"`,
                );
              }
              return (
                <Item
                  key={thread.id}
                  scene={scene}
                  group={group}
                  thread={thread}
                  story={story}
                  writer={writer}
                  save={save}
                />
              );
            })}
          </ul>
        </>
      )}
      {group.more === null ? null : (
        <p className="mt-3 text-small text-text-tertiary">{group.more}</p>
      )}
    </>
  );
}

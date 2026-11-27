// The thread panel (mock frames "Thread panel" and "Thread archived"; behaviour list 2.9): the kit's
// slide-out menu, open on the thread route, over the group view. It shows the quoted story or the
// note, the comments, and for a writer on an open thread the composer. Closing goes back to the group
// route and moves focus to that thread's "Open thread" link. Everything here is in memory: posting
// adds the comment to this page's list and a reaction toggle flips its pressed state; no count is
// recomputed (the delivered string stays) and nothing is written.
import { useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Alert } from "@/components/alert/Alert";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Badge } from "@/components/base/badges/badges";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Button } from "@/components/base/buttons/button";
import { STALE_SENTENCE, useSignalActions, useSignalAsOf } from "./actions";
import { useChoices } from "./choices";
import { FeedAlert } from "./FeedStates";
import { sceneHref } from "./SignalFrame";
import { BYLINE, HEADLINE, HEADLINE_LINK, isWebLink } from "./StoryCard";
import { ArchivedBadge } from "./parts/ArchivedBadge";
import { PHONE_TARGETS } from "./parts/classes";
import { MediaObject } from "./parts/MediaObject";
import { useOnGone, useOpener, focusAgainIfLost } from "./parts/focus";
import { FormDialog } from "./parts/FormDialog";
import { OpenSourceButton } from "./parts/OpenSourceButton";
import { Composer, MessageList } from "./parts/Messages";
import type { OwnComments, ReactionWord } from "./parts/Messages";
import type { SignalComment, SignalGroup, SignalScene, SignalStory, SignalThread } from "./slice";
import { SignalViewerContext, useSignalViewer } from "./viewer";
import { writes } from "./writes";

const TITLE_ID = "signal-thread-title";

/** The thread's own "Open thread" link in the group view; the page container when there is none. */
function openLinkTarget(threadId: string | null): HTMLElement | null {
  const links = document.querySelectorAll<HTMLElement>("a[data-thread-link]");
  const own = [...links].find((a) => a.dataset["threadLink"] === threadId);
  return own ?? document.getElementById("signal-content");
}

function Quoted({ story }: { story: SignalStory }) {
  const link = story.url !== null && isWebLink(story.url) ? story.url : null;
  return (
    <article>
      <MediaObject tile={story.source.monogram} source={story.source}>
        <div className={BYLINE}>
          <Badge size="sm">{story.kindLabel}</Badge>
          <span>{story.source.name}</span>
          {story.time === null ? null : <span className="tabular-nums">{story.time}</span>}
        </div>
        <h3 className={HEADLINE}>
          {link === null ? (
            story.headline
          ) : (
            <a href={link} target="_blank" rel="noopener noreferrer" className={HEADLINE_LINK}>
              {story.headline}
            </a>
          )}
        </h3>
        {link === null ? null : (
          <OpenSourceButton url={link} headline={story.headline} className="mt-1" />
        )}
      </MediaObject>
    </article>
  );
}

type Added = { parentId: string | null; comment: SignalComment };

/** The thread's comments with what the viewer posted in this visit: a reply under its parent, the rest last. */
function withAdded(comments: SignalComment[], added: Added[]): SignalComment[] {
  const top = [...comments, ...added.filter((a) => a.parentId === null).map((a) => a.comment)];
  return top.map((c) => ({
    ...c,
    replies: [...c.replies, ...added.filter((a) => a.parentId === c.id).map((a) => a.comment)],
  }));
}

/** An id no comment of the thread holds yet, for a comment posted in memory. */
function freshId(thread: SignalThread, added: Added[]): string {
  const held = new Set([
    ...thread.comments.flatMap((c) => [c.id, ...c.replies.map((r) => r.id)]),
    ...added.map((a) => a.comment.id),
  ]);
  let n = added.length + 1;
  while (held.has(`posted-${String(n)}`)) n += 1;
  return `posted-${String(n)}`;
}

const NOTE = "text-small text-text-tertiary";
const pressKey = (comment: SignalComment, word: ReactionWord) => JSON.stringify([comment.id, word]);

function ConversationFooter({
  thread,
  writer,
  viewer,
  replyTo,
  box,
  onSend,
  onCancelReply,
}: {
  thread: SignalThread;
  writer: boolean;
  viewer: ReturnType<typeof useSignalViewer>;
  replyTo: SignalComment | null;
  box: RefObject<HTMLTextAreaElement | null>;
  onSend: (text: string) => void;
  onCancelReply: () => void;
}) {
  let footer;
  if (thread.archived) {
    footer = <p className={NOTE}>This thread is archived. It can be read but not added to.</p>;
  } else if (!writer) {
    footer = <p className={NOTE}>Readers see this thread but not the reply box.</p>;
  } else if (viewer.name === null || viewer.initials === null) {
    footer = <p className={NOTE}>Your account details are unavailable.</p>;
  } else {
    footer = (
      <Composer
        name={viewer.name}
        initials={viewer.initials}
        replyingTo={replyTo === null ? null : replyTo.author.name}
        onCancelReply={onCancelReply}
        onSend={onSend}
        boxRef={box}
      />
    );
  }
  return <SlideoutMenu.Footer>{footer}</SlideoutMenu.Footer>;
}

function ConversationContent({
  thread,
  story,
  comments,
  canWrite,
  named,
  isPressed,
  setReplyTo,
  box,
  said,
  refused,
  onToggle,
  own,
  onModerate,
  waiting,
}: {
  thread: SignalThread;
  story: SignalStory | null;
  /** The group says the thread has comments the snapshot has not delivered: null when it has, else the read's failure (or none yet). */
  waiting: { error: SignalScene["snapshot"]["feed"]["error"] } | null;
  comments: SignalComment[];
  canWrite: boolean;
  named: boolean;
  isPressed: (comment: SignalComment, word: ReactionWord) => boolean;
  setReplyTo: (comment: SignalComment) => void;
  box: RefObject<HTMLTextAreaElement | null>;
  said: { count: number; text: string };
  /** What the service last refused here, counted so each refusal draws a fresh alert. */
  refused: { count: number; text: string };
  onToggle: ((comment: SignalComment, word: ReactionWord) => void) | null;
  own: OwnComments | null;
  onModerate: ((comment: SignalComment) => void) | null;
}) {
  return (
    <SlideoutMenu.Content>
      {thread.archivedLine === null ? null : (
        <div className="self-start">
          <ArchivedBadge>{thread.archivedLine}</ArchivedBadge>
        </div>
      )}
      {story === null ? null : <Quoted story={story} />}
      {thread.note === null ? null : (
        <p className="rounded-ds-sm border border-border-hairline bg-surface-subtle px-3 py-2 whitespace-pre-wrap break-words text-text-primary">
          {thread.note}
        </p>
      )}
      {waiting !== null ? (
        waiting.error === null ? (
          <p className={NOTE}>Loading the comments</p>
        ) : (
          <FeedAlert error={waiting.error} />
        )
      ) : comments.length === 0 ? (
        <p className={NOTE}>No comments yet</p>
      ) : (
        <MessageList
          comments={comments}
          onReply={
            canWrite && named
              ? (comment) => {
                  setReplyTo(comment);
                  box.current?.focus();
                }
              : null
          }
          isPressed={isPressed}
          onToggle={onToggle}
          own={own}
          onModerate={onModerate}
        />
      )}
      {refused.text === "" ? null : (
        // It is brought into view: the control that was refused may be far up the thread.
        <div
          key={refused.count}
          ref={(node) => {
            node?.scrollIntoView({ block: "nearest" });
          }}
        >
          <Alert tone="error" title={refused.text} />
        </div>
      )}
      <div role="status" className="sr-only">
        {said.count > 0 ? <span key={said.count}>{said.text}</span> : null}
      </div>
    </SlideoutMenu.Content>
  );
}

/** On a service, opening a thread with something unread in it tells the service it was read. */
function useThreadRead(threadId: string, unread: boolean) {
  const actions = useSignalActions();
  const asOf = useSignalAsOf();
  useEffect(() => {
    // A refusal changes nothing the reader did, so nothing is said about it.
    if (actions !== null && unread) void actions.write(writes.readThread(threadId, asOf));
  }, [actions, threadId, unread, asOf]);
}

/**
 * On a service, the viewer's own comments: which one is in the edit box, which removal is being
 * asked about, and the two writes. The service decides (the time for an edit may run out between
 * the read and the press): a removal refused is said inside its question, an edit refused in the
 * panel's alert with its box and what was typed kept.
 */
function useOwnComments(
  refuse: (text: string) => void,
  say: (text: string) => void,
  box: RefObject<HTMLTextAreaElement | null>,
): { own: OwnComments | null; confirm: ReactNode } {
  const actions = useSignalActions();
  const [editing, setEditing] = useState<OwnComments["editing"]>(null);
  const [removing, setRemoving] = useState<SignalComment | null>(null);
  // A removed comment has no Remove to go back to: the reply box takes focus, or the panel.
  const panel = () => document.getElementById(TITLE_ID)?.closest<HTMLElement>("[role='dialog']");
  const opener = useOpener(() => box.current ?? panel(), panel);
  if (actions === null) return { own: null, confirm: null };
  const own: OwnComments = {
    editing,
    onEdit: (comment) => {
      setEditing({ id: comment.id, busy: false });
    },
    onCancel: () => {
      setEditing(null);
    },
    onSave: (comment, text) => {
      setEditing({ id: comment.id, busy: true });
      refuse("");
      void actions.write(writes.editComment(comment.id, text)).then(({ refusal, stale }) => {
        if (refusal === null) {
          setEditing(null);
          say("Comment changed");
          if (stale === true) refuse(STALE_SENTENCE);
        } else {
          setEditing({ id: comment.id, busy: false });
          refuse(refusal);
        }
      });
    },
    onRemove: (comment) => {
      opener.remember();
      setRemoving(comment);
    },
  };
  const remove = (comment: SignalComment) => {
    refuse("");
    return actions.write(writes.dropComment(comment.id)).then(({ refusal }) => {
      if (refusal === null) {
        // The comment's Remove goes with it: when the question closes, focus stays in the thread.
        opener.forget();
        say("Comment removed");
      }
      // A refusal stays in the question, as a group's delete does: the dialog says it, Cancel closes.
      return refusal;
    });
  };
  const confirm = (
    <FormDialog
      open={removing !== null}
      title="Remove this comment?"
      intro="Its replies stay."
      fields={[]}
      action="Remove"
      destructive
      onSend={() => (removing === null ? Promise.resolve(null) : remove(removing))}
      onClose={() => {
        setRemoving(null);
      }}
      onGone={opener.restore}
    />
  );
  return { own, confirm };
}

/** The thread's top, comments and footer; its state (what was posted, which reactions flipped) lives here. */
function Conversation({
  thread,
  story,
  writer,
  unread,
  waiting,
}: {
  thread: SignalThread;
  story: SignalStory | null;
  writer: boolean;
  /** See `ConversationContent`: set while the thread's comments are not in hand. */
  waiting: { error: SignalScene["snapshot"]["feed"]["error"] } | null;
  /** The group lists this thread as unread. */
  unread: boolean;
}) {
  const viewer = useSignalViewer();
  const actions = useSignalActions();
  const viewerContext = useContext(SignalViewerContext);
  const box = useRef<HTMLTextAreaElement>(null);
  const [moderating, setModerating] = useState<SignalComment | null>(null);
  // A comment shows at once. On a service it is sent, and once answered the thread read again
  // holds it (or the service refused it), so the page's own copy goes.
  const [added, setAdded] = useState<Added[]>([]);
  const [replyTo, setReplyTo] = useState<SignalComment | null>(null);
  const [refused, setRefused] = useState({ count: 0, text: "" });
  const refuse = (text: string) => {
    setRefused((last) => ({ count: last.count + 1, text }));
  };
  const reactions = useChoices(
    actions === null
      ? null
      : (key, on) => {
          const [commentId, word] = JSON.parse(key) as [string, string];
          return actions.write(writes.react(commentId, word, on));
        },
    refuse,
  );
  const mine = (comment: SignalComment, word: ReactionWord) =>
    comment.reactions.find((r) => r.word === word)?.mine ?? false;
  // The read mark waits for the comments: they are what the reader has then seen.
  useThreadRead(thread.id, unread && waiting === null);
  // The live region stays and each post puts a fresh node in it (as Share does), so the same sentence twice is announced twice.
  const [said, setSaid] = useState({ count: 0, text: "" });
  const say = (text: string) => {
    setSaid((last) => ({ count: last.count + 1, text }));
  };
  const { own, confirm } = useOwnComments(refuse, say, box);
  const comments = withAdded(thread.comments, added);
  const named = viewer.name !== null && viewer.initials !== null;
  const canWrite = writer && !thread.archived;
  const send = (text: string) => {
    if (viewer.name === null || viewer.initials === null) {
      throw new Error("the composer was drawn with no viewer name");
    }
    const comment: SignalComment = {
      id: freshId(thread, added),
      author: { initials: viewer.initials, name: viewer.name },
      own: true,
      time: null,
      text,
      edited: false,
      removed: false,
      reactions: [],
      replies: [],
    };
    const entry: Added = { parentId: replyTo?.id ?? null, comment };
    setAdded((held) => [...held, entry]);
    setReplyTo(null);
    setRefused((last) => ({ ...last, text: "" }));
    if (actions !== null) {
      const request =
        replyTo === null ? writes.comment(thread.id, text) : writes.reply(replyTo.id, text);
      void actions.write(request).then(({ refusal, stale }) => {
        setAdded((held) => held.filter((one) => one !== entry));
        if (refusal !== null) refuse(refusal);
        else if (stale === true) refuse(STALE_SENTENCE);
      });
    }
    say(replyTo === null ? "Comment posted" : `Reply to ${replyTo.author.name} posted`);
  };
  const onToggle = (comment: SignalComment, word: ReactionWord) => {
    reactions.toggle(pressKey(comment, word), mine(comment, word));
  };
  return (
    <>
      <ConversationContent
        thread={thread}
        story={story}
        waiting={waiting}
        comments={comments}
        canWrite={canWrite}
        named={named}
        isPressed={(comment, word) => reactions.on(pressKey(comment, word), mine(comment, word))}
        setReplyTo={setReplyTo}
        box={box}
        said={said}
        refused={refused}
        // On a service a reader may not react (the service refuses it), so no button is offered.
        onToggle={actions !== null && !writer ? null : onToggle}
        own={own}
        onModerate={
          actions !== null && viewerContext?.profileType === "admin" ? setModerating : null
        }
      />
      {confirm}
      {actions !== null && viewerContext?.profileType === "admin" ? (
        <FormDialog
          open={moderating !== null}
          title="Remove this comment?"
          intro="Replies stay, but this comment is removed for everyone."
          fields={[]}
          action="Remove comment"
          destructive
          onSend={async () => {
            if (moderating === null) return null;
            const answer = await actions.write(writes.moderateComment(moderating.id));
            if (answer.refusal !== null) actions.refresh();
            return answer.refusal;
          }}
          onClose={() => {
            setModerating(null);
          }}
          onGone={() => {
            focusAgainIfLost(() =>
              document.getElementById(TITLE_ID)?.closest<HTMLElement>("[role='dialog']"),
            );
          }}
        />
      ) : null}
      <ConversationFooter
        thread={thread}
        writer={writer}
        viewer={viewer}
        replyTo={replyTo}
        box={box}
        onSend={send}
        onCancelReply={() => {
          setReplyTo(null);
        }}
      />
    </>
  );
}

export function ThreadPanel({
  scene,
  group,
  thread,
  writer,
}: {
  scene: SignalScene;
  group: SignalGroup;
  /** Null when the address names no thread of this group. */
  thread: SignalThread | null;
  writer: boolean;
}) {
  const actions = useSignalActions();
  const viewer = useContext(SignalViewerContext);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const adminOpener = useOpener(() => openLinkTarget(thread === null ? null : thread.id));
  useOnGone(() => {
    // When the address was loaded directly the dialog library has no opener to restore and, in a
    // browser, its own frame-late restore leaves focus on the body; a click-opened panel is restored
    // to its link by the library itself.
    focusAgainIfLost(() => openLinkTarget(thread === null ? null : thread.id));
  });
  const close = () => {
    window.location.hash = sceneHref(scene, `group/${encodeURIComponent(group.id)}`);
  };
  const story =
    thread === null || thread.storyId === null
      ? null
      : (scene.snapshot.feed.stories.find((s) => s.id === thread.storyId) ?? null);
  if (thread !== null && thread.storyId !== null && story === null) {
    throw new Error(`the slice reader let through an unknown story "${thread.storyId}"`);
  }
  return (
    <SlideoutMenu
      isOpen
      isDismissable
      aria-labelledby={TITLE_ID}
      // Ruling 20: the feed stays readable, so the kit's overlay token is drawn lighter. z-40, as
      // the channel panel: above the Channels strip (z-30) and under a dialog opened from here (z-50).
      className="z-40 bg-overlay/30"
      dialogClassName={`text-body ${PHONE_TARGETS}`}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <header className="relative w-full px-6 pt-6">
        <h2 id={TITLE_ID} className="pr-10 font-display text-h3 text-text-primary">
          {thread === null ? "Thread not found" : thread.title}
        </h2>
        <p className="text-small text-text-tertiary">
          {thread === null ? "This thread does not exist or is not open to you." : thread.subline}
        </p>
        {thread !== null && actions !== null && viewer?.profileType === "admin" ? (
          <Button
            color="link-destructive"
            className="mt-3"
            onPress={() => {
              adminOpener.remember();
              setConfirmRemove(true);
            }}
          >
            Remove this thread
          </Button>
        ) : null}
        <CloseButton label="Close thread" className="absolute top-3 right-3" />
      </header>
      {thread === null ? null : (
        <Conversation
          key={JSON.stringify([thread.groupId, thread.id])}
          thread={thread}
          story={story}
          writer={writer}
          unread={group.threads.some((one) => one.id === thread.id && one.unread)}
          // A summary thread (the group lists comments, the thread carries none) is not yet read in full.
          waiting={
            thread.comments.length === 0 &&
            group.threads.some((one) => one.id === thread.id && one.commentCount !== null)
              ? { error: scene.snapshot.feed.error }
              : null
          }
        />
      )}
      {thread !== null && actions !== null && viewer?.profileType === "admin" ? (
        <FormDialog
          open={confirmRemove}
          title="Remove this thread?"
          intro="The thread and all of its comments, reactions and read marks are removed. This cannot be undone."
          fields={[]}
          action="Remove thread"
          destructive
          onSend={async () => {
            const answer = await actions.write(writes.moderateThread(thread.id));
            if (answer.refusal !== null) actions.refresh();
            return answer.refusal;
          }}
          onClose={() => {
            setConfirmRemove(false);
          }}
          onGone={adminOpener.restore}
        />
      ) : null}
    </SlideoutMenu>
  );
}

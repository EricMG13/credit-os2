// The conversation (I7, structure from sources/live-pages.md, look from mock/signal.css `.m`, `.bub`,
// `.rx`, `.cmp`): an ordered list of comments with one level of replies, and the composer. Comment
// text is plain text (never HTML, no link detection). Nothing here keeps state of its own except the
// composer's text and an edit's text: the page owns what was posted, which reactions were toggled
// and which comment is being edited. On a service a comment its author may still change (the
// delivered `canEdit`, `canRemove`) has Edit, which puts the text in a box in place, and Remove.
import { useEffect, useRef, useState, type RefObject, type SyntheticEvent } from "react";
import { Button } from "@/components/base/buttons/button";
import type { SignalComment } from "../slice";
import { cx } from "@/utils/cx";
import { Avatar } from "./Avatar";
import { FOCUS, TARGET } from "./classes";
import { focusAgainIfLost, useOnGone } from "./focus";
import { TextArea } from "./TextArea";

/** Ruling 19 fixes the set; each is drawn on every comment that is not removed. */
const REACTION_WORDS = ["Agree", "Disagree", "Seen"] as const;
export type ReactionWord = (typeof REACTION_WORDS)[number];

/** A text action under a comment: a 32px target. */
const ACTION = cx(
  "cursor-pointer rounded-ds-xs text-small font-semibold text-text-link",
  TARGET,
  FOCUS,
);
const TIME = "font-mono text-caption font-normal text-text-tertiary tabular-nums";
const EMPTY = "Write something first.";

/** What the viewer may do to their own comments on a service; the page owns each step. */
export type OwnComments = {
  /** The comment whose text is in the edit box, and whether its save is still being answered. */
  editing: { id: string; busy: boolean } | null;
  onEdit: (comment: SignalComment) => void;
  /** Gets the new text with its ends trimmed; never empty. */
  onSave: (comment: SignalComment, text: string) => void;
  onCancel: () => void;
  /** The page asks before it removes. */
  onRemove: (comment: SignalComment) => void;
};
const CHIP =
  "inline-flex min-h-8 items-center rounded-ds-xs px-2 text-caption whitespace-nowrap tabular-nums ring-1 ring-border-hairline ring-inset";
/** The chips keep their words on one line each and wrap as a row where the panel is narrow. */
const CHIPS = "ml-auto flex flex-wrap justify-end gap-1";

type ListProps = {
  comments: SignalComment[];
  /** A writer on an open thread can reply; otherwise null and no Reply is drawn. */
  onReply: ((comment: SignalComment) => void) | null;
  isPressed: (comment: SignalComment, word: ReactionWord) => boolean;
  /** Null where the viewer may not react (a reader on a service): the delivered counts are drawn, with no button. */
  onToggle: ((comment: SignalComment, word: ReactionWord) => void) | null;
  /** Absent or null with no service (the sample): no Edit and no Remove is drawn, whatever a comment says. */
  own?: OwnComments | null;
};

/** Own comments are labelled "You" whatever name they carry. */
const authorOf = (comment: SignalComment) => (comment.own ? "You" : comment.author.name);

function Reactions({
  comment,
  isPressed,
  onToggle,
}: { comment: SignalComment } & Pick<ListProps, "isPressed" | "onToggle">) {
  const author = authorOf(comment);
  if (onToggle === null) {
    return comment.reactions.length === 0 ? null : (
      <ul aria-label={`Reactions to the comment by ${author}`} className={CHIPS}>
        {comment.reactions.map((held) => (
          <li key={held.word} className={cx(CHIP, "bg-surface-subtle text-text-secondary")}>
            {`${held.word} ${held.count}`}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul aria-label={`Reactions to the comment by ${author}`} className={CHIPS}>
      {REACTION_WORDS.map((word) => {
        // A word the slice does not hold has no count; one it holds shows the delivered string.
        const count = comment.reactions.find((r) => r.word === word)?.count ?? null;
        const on = isPressed(comment, word);
        return (
          <li key={word}>
            <button
              type="button"
              aria-pressed={on}
              aria-label={`${word}${count === null ? "" : `, ${count}`}: comment by ${author}`}
              onClick={() => {
                onToggle(comment, word);
              }}
              className={cx(
                CHIP,
                FOCUS,
                "cursor-pointer",
                on
                  ? "bg-surface-selected text-text-link"
                  : "bg-surface-subtle text-text-secondary hover:bg-surface-card",
              )}
            >
              {count === null ? word : `${word} ${count}`}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function MessageText({ comment, quote }: { comment: SignalComment; quote: string | null }) {
  if (comment.removed) {
    return (
      <p className="rounded-ds-sm border border-border-hairline bg-surface-card px-3 py-2 text-text-tertiary">
        This comment was removed by its author.
      </p>
    );
  }
  return (
    <div
      className={cx(
        "rounded-ds-sm border border-border-hairline px-3 py-2 whitespace-pre-wrap break-words text-text-primary",
        comment.own ? "bg-surface-card" : "bg-surface-subtle",
      )}
    >
      {quote === null ? null : (
        <blockquote className="mb-1.5 rounded-ds-sm border border-border-hairline border-l-[3px] border-l-action bg-surface-card px-3 py-2 text-small text-text-tertiary">
          {quote}
        </blockquote>
      )}
      {comment.text}
    </div>
  );
}

/** The Edit button of a comment, which takes focus back when its edit box goes. */
function editButtonOf(commentId: string): HTMLElement | null {
  const buttons = document.querySelectorAll<HTMLElement>("button[data-edit-comment]");
  return [...buttons].find((b) => b.dataset["editComment"] === commentId) ?? null;
}

/**
 * The comment's text in a box, in place of the comment: Save and Cancel, the compose box's rule
 * (something must be written) and Escape for Cancel. Focus starts in the box and goes back to Edit.
 */
function EditBox({ comment, own }: { comment: SignalComment; own: OwnComments }) {
  const original = comment.text ?? "";
  const [text, setText] = useState(original);
  const [empty, setEmpty] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const panel = useRef<HTMLElement | null>(null);
  useEffect(() => {
    box.current?.focus();
    // Save and Cancel sit under the box: the whole form is brought into view, not the box alone.
    box.current?.closest("form")?.scrollIntoView({ block: "nearest" });
    panel.current = box.current?.closest<HTMLElement>("[role='dialog']") ?? null;
  }, []);
  // Where Edit is no longer offered once the box has gone (the service's time for it ran out), the panel takes focus.
  useOnGone(() => {
    focusAgainIfLost(() => editButtonOf(comment.id) ?? panel.current);
  });
  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    const next = text.trim();
    if (next === "") {
      setEmpty(true);
      box.current?.focus();
    } else if (next === original) {
      own.onCancel();
    } else {
      own.onSave(comment, next);
    }
  };
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2">
      <TextArea
        aria-label="Edit your comment"
        rows={3}
        value={text}
        onChange={(next) => {
          setText(next);
          setEmpty(false);
        }}
        // Escape leaves the edit, not the thread; every other key goes on as it would.
        onKeyDown={(event) => {
          if (event.key === "Escape") own.onCancel();
          else event.continuePropagation();
        }}
        textAreaRef={box}
        isInvalid={empty}
        hint={empty ? EMPTY : undefined}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" color="secondary" onPress={own.onCancel}>
          Cancel
        </Button>
        <Button size="sm" color="primary" type="submit" isDisabled={own.editing?.busy === true}>
          Save
        </Button>
      </div>
    </form>
  );
}

/** Reply, and on a service Edit and Remove where the comment says its author still may. */
function OwnActions({
  comment,
  author,
  isReply,
  onReply,
  own,
}: {
  comment: SignalComment;
  author: string;
  isReply: boolean;
} & Pick<ListProps, "onReply" | "own">) {
  const mine = own ?? null;
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {onReply === null || isReply ? null : (
        <button
          type="button"
          aria-label={`Reply to ${author}`}
          onClick={() => {
            onReply(comment);
          }}
          className={ACTION}
        >
          Reply
        </button>
      )}
      {mine === null || comment.canEdit !== true ? null : (
        <button
          type="button"
          data-edit-comment={comment.id}
          aria-label="Edit your comment"
          onClick={() => {
            mine.onEdit(comment);
          }}
          className={ACTION}
        >
          Edit
        </button>
      )}
      {mine === null || comment.canRemove !== true ? null : (
        <button
          type="button"
          aria-label="Remove your comment"
          onClick={() => {
            mine.onRemove(comment);
          }}
          className={ACTION}
        >
          Remove
        </button>
      )}
    </span>
  );
}

function MessageActions({
  comment,
  author,
  isReply,
  onReply,
  isPressed,
  onToggle,
  own,
}: {
  comment: SignalComment;
  author: string;
  isReply: boolean;
} & Pick<ListProps, "onReply" | "isPressed" | "onToggle" | "own">) {
  if (comment.removed) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <OwnActions comment={comment} author={author} isReply={isReply} onReply={onReply} own={own} />
      <Reactions comment={comment} isPressed={isPressed} onToggle={onToggle} />
    </div>
  );
}

function Replies({ comment, ...rest }: { comment: SignalComment } & Omit<ListProps, "comments">) {
  if (comment.replies.length === 0) return null;
  return (
    <ol aria-label={`Replies to ${authorOf(comment)}`} className="mt-2 flex flex-col gap-4">
      {comment.replies.map((reply) => (
        <Message key={reply.id} comment={reply} quote={comment.text} isReply {...rest} />
      ))}
    </ol>
  );
}

function Message({
  comment,
  quote,
  isReply,
  onReply,
  isPressed,
  onToggle,
  own,
}: {
  comment: SignalComment;
  /** What a reply quotes: its parent's text (none when the parent was removed). */
  quote: string | null;
  isReply: boolean;
} & Omit<ListProps, "comments">) {
  const author = authorOf(comment);
  const when = [comment.time, comment.edited ? "edited" : null]
    .filter((s) => s !== null)
    .join(", ");
  return (
    <li
      className={cx(
        "flex items-start gap-3",
        isReply ? null : comment.own ? "self-end pl-10" : "pr-10",
      )}
    >
      {comment.own ? null : <Avatar size="sm" initials={comment.author.initials} />}
      <article className="flex min-w-0 flex-1 flex-col gap-1.5">
        <header className="flex items-center gap-2">
          <cite className="flex-1 text-small font-medium text-text-secondary not-italic">
            {author}
          </cite>
          {when === "" ? null : <span className={TIME}>{when}</span>}
        </header>
        {own != null && own.editing?.id === comment.id && !comment.removed ? (
          <EditBox comment={comment} own={own} />
        ) : (
          <>
            <MessageText comment={comment} quote={quote} />
            <MessageActions
              comment={comment}
              author={author}
              isReply={isReply}
              onReply={onReply}
              isPressed={isPressed}
              onToggle={onToggle}
              own={own}
            />
          </>
        )}
        <Replies
          comment={comment}
          onReply={onReply}
          isPressed={isPressed}
          onToggle={onToggle}
          own={own}
        />
      </article>
    </li>
  );
}

export function MessageList({ comments, ...rest }: ListProps) {
  return (
    <ol aria-label="Comments" className="flex flex-col gap-4">
      {comments.map((comment) => (
        <Message key={comment.id} comment={comment} quote={null} isReply={false} {...rest} />
      ))}
    </ol>
  );
}

type ComposerProps = {
  /** The viewer's name and initials, as the frame shows them under the box. */
  name: string;
  initials: string | null;
  /** The comment being replied to, or null for a new top-level comment. */
  replyingTo: string | null;
  onCancelReply: () => void;
  /** Gets the text with its ends trimmed; the composer clears itself after. */
  onSend: (text: string) => void;
  boxRef: RefObject<HTMLTextAreaElement | null>;
};

export function Composer({
  name,
  initials,
  replyingTo,
  onCancelReply,
  onSend,
  boxRef,
}: ComposerProps) {
  const [text, setText] = useState("");
  const [empty, setEmpty] = useState(false);
  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    const sent = text.trim();
    if (sent === "") {
      setEmpty(true);
    } else {
      setEmpty(false);
      setText("");
      onSend(sent);
    }
    // Focus stays in the box after a send and after an empty one.
    boxRef.current?.focus();
  };
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2">
      {replyingTo === null ? null : (
        <p className="flex items-center justify-between gap-2 text-small text-text-secondary">
          <span>Replying to {replyingTo}</span>
          <Button
            size="sm"
            color="link-color"
            className="min-h-8"
            onPress={() => {
              onCancelReply();
              boxRef.current?.focus();
            }}
          >
            Cancel
          </Button>
        </p>
      )}
      <div className="rounded-ds-md border border-border-hairline bg-surface-subtle p-1">
        <TextArea
          aria-label="Write a comment"
          placeholder="Write a comment"
          rows={3}
          value={text}
          onChange={(next) => {
            setText(next);
            setEmpty(false);
          }}
          textAreaRef={boxRef}
          isInvalid={empty}
          hint={empty ? EMPTY : undefined}
        />
        <div className="flex items-center justify-between gap-3 px-2 pt-1 text-caption text-text-tertiary">
          <span className="flex items-center gap-1.5">
            <Avatar size="xs" initials={initials} own />
            {name}
          </span>
          <Button size="sm" color="link-color" className="min-h-8" type="submit">
            Send
          </Button>
        </div>
      </div>
    </form>
  );
}

// The digest page (mock digests frames 1, 3 and 4). A digest that is running and has an issue: a meta
// line (Digest, AI where a model wrote it, the digest's name, the date), the newest issue's title as the
// page's h1, its delivered summary and its numbered points (each with the stories behind it, linked to
// their sources where the address is a web one; no article text). An issue with nothing material is
// the kit's empty state instead of the list. "Earlier digests" is a card of rows, one per earlier
// issue (not links: no page holds one issue). A paused digest says so in an info alert, takes its own
// name as the h1 and draws every issue as a row. The column is the mock's 820px.
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { Alert } from "@/components/alert/Alert";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { StatusBadge } from "@/components/status/StatusBadge";
import { useSignalActions } from "./actions";
import { FIGURE, FOCUS, LINK, LIST_TILE } from "./parts/classes";
import { MediaObject } from "./parts/MediaObject";
import { NumberedPanel } from "./parts/NumberedPanel";
import { PageTitle } from "./parts/PageTitle";
import { sceneHref } from "./SignalFrame";
import type { SignalDigest, SignalDigestIssue, SignalScene } from "./slice";
import { BYLINE, HEADLINE, isWebLink } from "./StoryCard";
import { writes } from "./writes";


type Point = SignalDigestIssue["points"][number];

function Stories({ point }: { point: Point }) {
  return (
    <>
      {point.storiesLine === null ? null : (
        <p className="mt-2.5 text-small text-text-tertiary">{point.storiesLine}</p>
      )}
      {point.stories.length === 0 ? null : (
        <ul
          aria-label={`Stories behind: ${point.lead}`}
          className="flex flex-col text-small text-text-tertiary"
        >
          {point.stories.map((story, index) => {
            const link = story.url !== null && isWebLink(story.url) ? story.url : null;
            const rest = `, ${story.source}${story.time === null ? "" : `, ${story.time}`}`;
            return (
              // Each line is a 32px row (44px on a phone) and its link's own box is as tall.
              <li key={index} className="py-[5px] max-[480px]:py-[11px]">
                {link === null ? (
                  `${story.headline}${rest} (no link)`
                ) : (
                  <>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open source: ${story.headline} (opens in a new tab)`}
                      className={`rounded-ds-xs py-[7px] font-medium text-text-link hover:underline max-[480px]:py-[13px] ${FOCUS}`}
                    >
                      {story.headline}
                    </a>
                    {rest}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** The newest issue's body: its points, or the empty state when nothing was material. */
function Body({
  issue,
  hasEarlier,
  onEarlier,
}: {
  issue: SignalDigestIssue;
  hasEarlier: boolean;
  onEarlier: () => void;
}) {
  if (issue.nothing !== null) {
    return (
      <EmptyState className="py-12">
        <EmptyState.Header>
          <EmptyState.FeaturedIcon />
        </EmptyState.Header>
        <EmptyState.Content>
          <EmptyState.Title>Nothing material to report</EmptyState.Title>
          <EmptyState.Description>{issue.nothing}</EmptyState.Description>
        </EmptyState.Content>
        {hasEarlier ? (
          <EmptyState.Footer>
            <Button color="secondary" onPress={onEarlier}>
              See earlier digests
            </Button>
          </EmptyState.Footer>
        ) : null}
      </EmptyState>
    );
  }
  if (issue.points.length === 0) return null;
  return (
    <div className="mt-5">
      <NumberedPanel
        leadAs="h2"
        items={issue.points.map((point) => ({
          number: point.number,
          lead: point.lead,
          body: point.body,
          children: <Stories point={point} />,
        }))}
      />
    </div>
  );
}

/** An earlier issue as a row (frame 4): tile, labels, date, title as an h3 carrying the issue's id, and its delivered line. */
function Row({ digest, issue }: { digest: SignalDigest; issue: SignalDigestIssue }) {
  return (
    <li className="py-6">
      <MediaObject tile={digest.monogram}>
        <div className={BYLINE}>
          <Badge size="sm">Digest</Badge>
          {issue.ai ? <Badge size="sm">AI</Badge> : null}
          {issue.date === null ? null : <span className={FIGURE}>{issue.date}</span>}
        </div>
        <h3 data-issue={issue.id} className={HEADLINE}>
          {issue.title}
        </h3>
        {/* Keyed by slot, not by text: the summary and the nothing line may be the same sentence. */}
        {(
          [
            ["summary", issue.summary],
            ["nothing", issue.nothing],
          ] as const
        ).map(([slot, line]) =>
          line === null ? null : (
            <p key={slot} className="mt-0.5 max-w-[72ch] text-small text-text-secondary">
              {line}
            </p>
          ),
        )}
      </MediaObject>
    </li>
  );
}

function DigestHeading({
  digest,
  current,
}: {
  digest: SignalDigest;
  current: SignalDigestIssue | undefined;
}) {
  if (current === undefined) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <PageTitle>{digest.name}</PageTitle>
        {digest.paused === null ? null : <StatusBadge set="Signal source states" state="Paused" />}
      </div>
    );
  }
  return (
    <>
      <div className={BYLINE}>
        <Badge size="sm">Digest</Badge>
        {current.ai ? <Badge size="sm">AI</Badge> : null}
        <span>{digest.name}</span>
        {current.date === null ? null : <span className={FIGURE}>{current.date}</span>}
      </div>
      <PageTitle>{current.title}</PageTitle>
      {current.summary === null ? null : (
        <p className="mt-2 max-w-[72ch] text-text-secondary">{current.summary}</p>
      )}
    </>
  );
}

function PausedNotice({
  scene,
  digest,
  writer,
}: {
  scene: SignalScene;
  digest: SignalDigest;
  writer: boolean;
}) {
  if (digest.paused === null) return null;
  return (
    <div className="mt-4">
      <Alert
        tone="info"
        title={digest.paused}
        action={
          writer ? (
            <a
              href={sceneHref(scene, "settings/ai")}
              className={`text-small ${LINK}`}
            >
              Open AI and cost
            </a>
          ) : undefined
        }
      />
    </div>
  );
}

function EarlierDigests({
  digest,
  issues,
  titleRef,
}: {
  digest: SignalDigest;
  issues: SignalDigestIssue[];
  titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  if (issues.length === 0) return null;
  return (
    <section className="mt-8">
      <h2
        ref={titleRef}
        tabIndex={-1}
        className={`mb-3 font-display text-h3 text-text-primary ${FOCUS}`}
      >
        Earlier digests
      </h2>
      <ul className={LIST_TILE}>
        {issues.map((issue) => (
          <Row key={issue.id} digest={digest} issue={issue} />
        ))}
      </ul>
    </section>
  );
}

/** `none` is the empty state a digest with no issue draws (the page that owns the empty states passes it). */
/** On a service, opening a digest with an unread issue tells the service it was read. */
function useDigestRead(scene: SignalScene, digestId: string) {
  const actions = useSignalActions();
  const { channels, feed } = scene.snapshot;
  const unread =
    channels.digests.some((one) => one.id === digestId && one.unread) ||
    feed.digests.some((card) => card.digestId === digestId && card.unread);
  useEffect(() => {
    // Only its owner may; a refusal changes nothing the reader did, so nothing is said about it.
    if (actions !== null && unread) void actions.write(writes.readDigest(digestId));
  }, [actions, digestId, unread]);
}

export function DigestPage({
  scene,
  digest,
  writer,
  none,
}: {
  scene: SignalScene;
  /** A reader's Settings has no AI and cost section, so only a writer is sent there. */
  writer: boolean;
  digest: SignalDigest;
  none: ReactNode;
}) {
  useDigestRead(scene, digest.id);
  const earlierTitle = useRef<HTMLHeadingElement>(null);
  const [first, ...rest] = digest.issues;
  // A paused digest writes no new issue: every issue is an earlier one.
  const current = digest.paused === null ? first : undefined;
  const earlier = current === undefined ? digest.issues : rest;
  return (
    <div className="max-w-[820px]">
      <DigestHeading digest={digest} current={current} />
      <PausedNotice scene={scene} digest={digest} writer={writer} />
      {digest.issues.length === 0 ? none : null}
      {current === undefined ? null : (
        <Body
          issue={current}
          hasEarlier={earlier.length > 0}
          onEarlier={() => {
            earlierTitle.current?.focus();
          }}
        />
      )}
      <EarlierDigests digest={digest} issues={earlier} titleRef={earlierTitle} />
    </div>
  );
}

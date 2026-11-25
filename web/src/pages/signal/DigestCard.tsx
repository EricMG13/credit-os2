// A digest in the feed (mock `.st` with the digest meta row): "Digest" label, "AI" label when a model
// wrote it, the name, the date and an unread mark; the title, the numbered points, the delivered
// summary and a link to the digest. A nothing-to-report card is one sentence: no points, no AI label,
// no link, since no model made it.
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { FIGURE } from "./parts/classes";
import { MediaObject } from "./parts/MediaObject";
import { NumberedPanel } from "./parts/NumberedPanel";
import type { SignalDigestCard } from "./slice";
import { BYLINE, HEADLINE, HEADLINE_LINK } from "./StoryCard";

export function DigestCard({ digest, href }: { digest: SignalDigestCard; href: string }) {
  const { title } = digest;
  return (
    <article className="py-6">
      <MediaObject tile={digest.monogram}>
        <div className={BYLINE}>
          <Badge size="sm">Digest</Badge>
          {digest.ai ? <Badge size="sm">AI</Badge> : null}
          <span>{digest.digestName}</span>
          {digest.date === null ? null : <span className={FIGURE}>{digest.date}</span>}
          {digest.unread ? (
            <>
              <span aria-hidden="true" className="size-2 rounded-ds-full bg-action" />
              <span>Unread</span>
            </>
          ) : null}
        </div>
        {digest.nothing === null ? (
          <>
            <h2 tabIndex={-1} className={HEADLINE}>
              <a href={href} className={HEADLINE_LINK}>
                {title}
              </a>
            </h2>
            <div className="mt-3">
              <NumberedPanel items={digest.points} />
            </div>
            {digest.summary === null ? null : (
              <p className="mt-3 text-small text-text-tertiary">{digest.summary}</p>
            )}
            <div className="mt-3">
              <Button
                size="sm"
                color="link-color"
                className="min-h-8"
                iconTrailing={ArrowRight}
                href={href}
                aria-label={`Read the digest: ${title}`}
              >
                Read the digest
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 tabIndex={-1} className={HEADLINE}>
              {title}
            </h2>
            <p className="max-w-[72ch] text-text-secondary">{digest.nothing}</p>
          </>
        )}
      </MediaObject>
    </article>
  );
}

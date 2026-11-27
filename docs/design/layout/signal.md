# Signal

## Purpose and source contract

Show outside stories and shared context for the reader's followed topics. Signal is not an issuer analysis or a run finding. Read `SignalSlice.scenes[].snapshot.feed` (`SignalFeed`: status, error, source approval/freshness, stories and ordered `SignalFeedView`), plus `channels` for the channel rail. A story is `SignalStory` (kind, source, time, headline, summary, tags and typed market/rating/stage fields, with an optional AI line). The reviewed source scope had no feed records; the wireframe shows that empty state and a separate failed state without invented stories.

## Layout and components

- Use the shared Credit OS top bar and a page heading. Keep the channel list in a left tile beside the feed on desktop; provide an explicit Channels control if it moves out of the main layout.
- When records exist, the feed uses dense story rows with kind, source, time, headline and summary. Keep market data in a plain table; no better/worse tint or arrow. Use words and marks for any typed state/strength. Empty or failed source states replace the list in place.
- **Reuse:** app shell, `PageHeader`, `Tabs`, `StatusBadge`, `SignalFrame` (`web/src/pages/signal/SignalFrame.tsx`), `ChannelPanel` (`web/src/pages/signal/ChannelPanel.tsx`), `StoryCard` (`web/src/pages/signal/StoryCard.tsx`), and `FeedSkeleton`, `FeedAlert`, `EmptyNote` and `FeedEmpty` from `web/src/pages/signal/FeedStates.tsx`, plus dialog primitives. The channels/feed arrangement and empty/failed panels are new composition.
- **New composition:** channel tile plus feed layout and Signal-specific empty/failure panels. Do not create new story content or analytical summaries to fill the empty source.

At 1280, keep channels beside the feed. At 1024, put channels behind a named control above the feed and preserve its selected state. If a market table needs local horizontal scrolling, label the scroll region and keep row headings associated with their values; never allow page-level overflow.

## Data, trace and states

Map story kind, source label, time, headline, summary, channel and source-health state from the Signal contract. Show AI-written text only when the real record exists, with its required label. Keep market values, their own dates and changes exactly as the feed provides them. Do not infer a move or create a headline, sentiment, rating action, recommendation or better/worse direction.

The empty state says no stories are available in the current feed and offers only a real action, such as adjusting the filter or source configuration. The failed state gives the service error and retry action; it is not the empty state. Add loading, no match, saved-empty and channel-empty states without fake content. Source IDs/addresses remain in Signal settings or its trace detail, not story prose.

## Offline placeholder wireframe

[Open the standalone signal wireframe](wireframes/signal.html). This generic layout follows its screen map and contains no source values.

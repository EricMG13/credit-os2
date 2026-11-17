# Teams run cards

Four Adaptive Cards (schema 1.5, Teams) that the service posts to one Teams channel. The sender
is `src/deploy_workflow/inbox/teams.py`; the design is `../mockups/teams-cards.html`. The JSON
files here are the sender's own output for synthetic sample runs, kept to paste into a channel
or the Adaptive Card Designer.

| File | Posted when |
| :--- | :--- |
| `run-started.json` | A submitted run starts |
| `report-ready.json` | The report is published (status finished) |
| `run-stopped.json` | A run ends without a report (capped, failed, interrupted) |
| `run-summary.json` | 09:00, 13:00, 17:00 and 21:00 UK time, Monday to Friday. Skipped when no run is queued or running and none has ended today since the last summary. Lists at most five stopped, five running, three queued and the five most recent finished runs, then counts the rest. A run that ends after 21:00 is in no summary |

## Switching it on

Set both variables in the environment the service is started from; with neither, nothing is
posted. With one, or an unusable value, the service refuses to start.

| Variable | Value |
| :--- | :--- |
| `CREDIT_OS_TEAMS_WEBHOOK` | The `https://` address of a Teams Workflows webhook ("Post to a channel when a webhook request is received"). Anyone who holds it can post to the channel: keep it out of files |
| `CREDIT_OS_TEAMS_LINK` | The address readers open the service at, for example `http://10.0.0.5:8765`. Card buttons open pages under it |

What is sent to Microsoft: the issuer's name, the pathway, the analyst's name, times, counts, the
cap and, for a finished run, the report's lead bottom line as its module wrote it, with the
figures that sentence holds. No document or source reference is sent. A synthetic service (`react_frontend` with a test launcher)
never posts.

Each run's last posted card is recorded in `<root>/_engine/teams.json`. The first poll after
switching on records the runs already there and posts none of them. A failed post is retried
each minute: a run's card for two hours, the summary until half past its hour; then it is dropped
with a line in the service log. A run started by the service does not inherit the webhook.

## How the design is carried

Teams draws a card's text, buttons and named colours itself, in its own font, and offers no
brand colours, tints, pills or shadows. What the design needs beyond that travels inside the
card as small PNGs:

- Fixed images, written by `tools/teams_brand_images.mjs` into `teams_brand.py`: the header
  band and lockup, a pill and a shape for each run state (the app's "Run states" set), and the
  meta icons (the app's icon set). Rerun the tool after a design change.
- Images made per card by the sender: the 3px stripe in the state's colour, the progress bars,
  the callout tint with its left rule and the tinted Stopped tile. Tints are mostly transparent,
  so Teams' own text stays readable on them in the light and the dark theme.

The issuer, the bottom line, names and figures stay live text. A summary adds rows, stopped
first, only while the posted card stays under 23 KB, and counts the rest.
`rendered-light-dark-2x.png` shows the four sample cards drawn by Microsoft's reference renderer
with the Teams light and dark host configurations from Microsoft's card designer.

## Limits

- Text is Teams' font and the primary button Teams' accent colour; a card cannot change either.
- The pills, shapes and icons are pictures: they do not follow Teams' dark theme (the pills keep
  their light fill), and a screen reader reads their alternative text.
- The reference renderer does not draw `roundedCorners`, `showBorder` or the `icon:Library`
  button icon, and drew the stripe inset from the card's edges; Teams draws those itself.
- Not checked: nothing has been posted to a real Teams channel.
- A link works only for a reader who can reach `CREDIT_OS_TEAMS_LINK`.
- A run that ends while the service is being restarted gets its card without the bottom line.
- The report-ready card does not count stated limits: the library does not hold that count.

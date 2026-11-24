// Settings, Notifications (mock settings frame 6): a grid, one row per event with a switch under
// "In Signal" and one under "On the desktop". Each switch is named "<event>, <channel>". In memory only.
// On a service no choice can be changed from the page yet, so each switch shows its state and is disabled.
import type { SignalNotificationEvent } from "../slice";
import { Toggle } from "../parts/Toggle";
import { Section } from "./Section";
import { useNotWritable, WriteReason } from "./WriteReason";

const REASON_ID = "signal-notifications-write-reason";

const CHANNELS = [
  { key: "inSignal", name: "In Signal" },
  { key: "onDesktop", name: "On the desktop" },
] as const;

export type NotificationChannel = (typeof CHANNELS)[number]["key"];

type Props = {
  events: SignalNotificationEvent[];
  on: (event: SignalNotificationEvent, channel: NotificationChannel) => boolean;
  onChange: (event: SignalNotificationEvent, channel: NotificationChannel, value: boolean) => void;
};

export function NotificationsSection({ events, on, onChange }: Props) {
  return (
    <Section title="Notifications" hint="Choose where each event reaches you.">
      {events.length === 0 ? (
        <p className="text-sm text-text-tertiary">No notification events yet.</p>
      ) : (
        <NotificationsTable events={events} on={on} onChange={onChange} />
      )}
    </Section>
  );
}

function NotificationsTable({ events, on, onChange }: Props) {
  // On a service the switches show their state and cannot be changed.
  const fixed = useNotWritable();
  return (
    <>
      <WriteReason
        id={REASON_ID}
        live="Notification choices cannot be changed from this page yet."
      />
      <table className="w-full max-w-[640px] border-collapse">
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              Event
            </th>
            {CHANNELS.map((channel) => (
              <th
                key={channel.key}
                scope="col"
                className="w-[110px] pb-2 text-left text-sm font-medium text-text-secondary"
              >
                {channel.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-t border-border-hairline">
              <th scope="row" className="py-4 pr-4 text-left text-md font-medium text-text-primary">
                {event.label}
              </th>
              {CHANNELS.map((channel) => (
                <td key={channel.key} className="py-4">
                  <Toggle
                    aria-label={`${event.label}, ${channel.name}`}
                    isSelected={on(event, channel.key)}
                    isDisabled={fixed}
                    aria-describedby={fixed ? REASON_ID : undefined}
                    onChange={(value) => {
                      onChange(event, channel.key, value);
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

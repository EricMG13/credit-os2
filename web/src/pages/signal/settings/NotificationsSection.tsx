// Settings, Notifications (mock settings frame 6): a grid, one row per event with a switch under
// "In Signal" and one under "On the desktop". Each switch is named "<event>, <channel>". In memory only.
// On a service there is no desktop notification, so only the "In Signal" column is drawn.
import type { SignalNotificationEvent } from "../slice";
import { Toggle } from "../parts/Toggle";
import { Section } from "./Section";

const CHANNELS = [
  { key: "inSignal", name: "In Signal" },
  { key: "onDesktop", name: "On the desktop" },
] as const;

export type NotificationChannel = (typeof CHANNELS)[number]["key"];

export function NotificationsSection({
  events,
  on,
  onChange,
  desktop,
}: {
  events: SignalNotificationEvent[];
  on: (event: SignalNotificationEvent, channel: NotificationChannel) => boolean;
  onChange: (event: SignalNotificationEvent, channel: NotificationChannel, value: boolean) => void;
  /** Whether the "On the desktop" column is drawn: the design-reference app only. */
  desktop: boolean;
}) {
  const channels = desktop ? CHANNELS : CHANNELS.filter((channel) => channel.key === "inSignal");
  return (
    <Section
      title="Notifications"
      hint={
        desktop
          ? "Choose where each event reaches you."
          : "Choose which events reach you in Signal."
      }
    >
      {events.length === 0 ? (
        <p className="text-sm text-text-tertiary">No notification events yet.</p>
      ) : (
        <table className="w-full max-w-[640px] border-collapse">
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Event
              </th>
              {channels.map((channel) => (
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
                <th
                  scope="row"
                  className="py-4 pr-4 text-left text-md font-medium text-text-primary"
                >
                  {event.label}
                </th>
                {channels.map((channel) => (
                  <td key={channel.key} className="py-4">
                    <Toggle
                      aria-label={`${event.label}, ${channel.name}`}
                      isSelected={on(event, channel.key)}
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
      )}
    </Section>
  );
}

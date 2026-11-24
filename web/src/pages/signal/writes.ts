// Every write the Signal service takes from the screens, as the request to make. Paths are the
// service's own under its API; the live page puts them under /signal/api, which the local server
// forwards. A path segment holds lowercase letters and digits only (the forwarder passes no other),
// which the service's decimal ids and the three reaction words are.
import type { SignalWrite } from "./actions";

const part = encodeURIComponent;
const post = (path: string, body?: Record<string, unknown>): SignalWrite =>
  body === undefined ? { method: "POST", path } : { method: "POST", path, body };
const remove = (path: string): SignalWrite => ({ method: "DELETE", path });
/** A state the service holds as present or absent: POST sets it, DELETE takes it away. */
const held = (on: boolean, path: string): SignalWrite => (on ? post(path) : remove(path));

/** A topic's rule: the kinds are the service's keys, not the labels the page draws. */
export type TopicRule = { name: string; keywords: string[]; kinds: string[] };

/** The kinds of story and source: the label the page draws and the key the service takes. */
export const KINDS = [
  { key: "news", label: "News" },
  { key: "regulator", label: "Regulatory cases" },
  { key: "ratings", label: "Rating actions" },
  { key: "research", label: "Research" },
] as const;

/** Who can see a group: the delivered label and the word the service takes. */
export const VISIBILITY = [
  { key: "everyone", label: "Visible to everyone" },
  { key: "invited", label: "Members only" },
] as const;

export const writes = {
  save: (story: string, on: boolean) => held(on, `/stories/${part(story)}/save`),
  follow: (topic: string, on: boolean) => held(on, `/topics/${part(topic)}/follow`),
  rename: (name: string): SignalWrite => ({ ...post("/me", { name }), fresh: true }),
  /** A story shared to a group, a note thread, or both: the note becomes the first comment. */
  thread: (group: string, story: string | null, note: string) =>
    post(`/groups/${part(group)}/threads`, {
      ...(story === null ? {} : { story }),
      ...(note === "" ? {} : { note }),
    }),
  comment: (thread: string, text: string) => post(`/threads/${part(thread)}/comments`, { text }),
  reply: (comment: string, text: string) => post(`/comments/${part(comment)}/replies`, { text }),
  react: (comment: string, word: string, on: boolean) =>
    held(on, `/comments/${part(comment)}/reactions/${part(word.toLowerCase())}`),
  readThread: (thread: string) => post(`/threads/${part(thread)}/read`),
  group: (name: string, visibility: string) => post("/groups", { name, visibility }),
  visibility: (group: string, visibility: string) =>
    post(`/groups/${part(group)}/visibility`, { visibility }),
  member: (group: string, name: string, on: boolean) =>
    post(`/groups/${part(group)}/members${on ? "" : "/remove"}`, { name }),
  rule: (rule: string, on: boolean) => post("/rules", { rule, on }),
  notification: (event: string, channel: string, on: boolean) =>
    post("/notifications", { event, channel, on }),
  /** `id` null adds a topic; otherwise the topic is changed. */
  topic: (id: string | null, rule: TopicRule) =>
    post(id === null ? "/topics" : `/topics/${part(id)}/edit`, rule),
  dropTopic: (id: string) => remove(`/topics/${part(id)}`),
  source: (name: string, kind: string, url: string) => post("/sources", { name, kind, url }),
  /** `id` null adds a digest; `form` holds the strings the service delivered, as chosen. */
  digest: (id: string | null, form: Record<string, unknown>) =>
    post(id === null ? "/digests" : `/digests/${part(id)}/edit`, form),
  dropDigest: (id: string) => remove(`/digests/${part(id)}`),
  runDigest: (id: string) => post(`/digests/${part(id)}/run`),
  readDigest: (id: string) => post(`/digests/${part(id)}/read`),
};

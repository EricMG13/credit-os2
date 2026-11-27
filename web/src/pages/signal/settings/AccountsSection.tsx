import { useEffect, useState } from "react";
import { RequestError, postJson, request } from "@/pages/connected/api";
import { Table } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { Section } from "./Section";

type ProfileType = "reader" | "analyst" | "admin";
type Account = {
  id: number;
  display_name: string;
  profile_type: ProfileType;
  disabled: boolean;
  signed_in_at: string | null;
};
type Directory = { accounts: Account[] };
type SignedIn = { account: { id: number } | null };

class UnreadableAccounts extends Error {}

const navigateTo = (path: string) => {
  window.location.assign(path);
};
const reloadPage = () => {
  window.location.reload();
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readAccount(value: unknown): Account {
  if (!isRecord(value)) throw new UnreadableAccounts();
  const { id, display_name, profile_type, disabled, signed_in_at } = value;
  if (
    typeof id !== "number" ||
    !Number.isSafeInteger(id) ||
    id < 1 ||
    typeof display_name !== "string" ||
    typeof profile_type !== "string" ||
    !["reader", "analyst", "admin"].includes(profile_type) ||
    typeof disabled !== "boolean" ||
    !(typeof signed_in_at === "string" || signed_in_at === null)
  ) {
    throw new UnreadableAccounts();
  }
  return {
    id,
    display_name,
    profile_type: profile_type as ProfileType,
    disabled,
    signed_in_at,
  };
}

function readDirectory(value: unknown): Directory {
  if (!isRecord(value) || !Array.isArray(value.accounts)) throw new UnreadableAccounts();
  const accounts = value.accounts.map(readAccount);
  if (new Set(accounts.map((account) => account.id)).size !== accounts.length) {
    throw new UnreadableAccounts();
  }
  return { accounts };
}

function readSignedIn(value: unknown): SignedIn {
  if (!isRecord(value) || !Object.hasOwn(value, "account")) throw new UnreadableAccounts();
  if (value.account === null) return { account: null };
  if (!isRecord(value.account) || typeof value.account.id !== "number") {
    throw new UnreadableAccounts();
  }
  return { account: { id: value.account.id } };
}

async function readAccounts(signal: AbortSignal): Promise<{ accounts: Account[]; self: number }> {
  const [directoryReply, selfReply] = await Promise.all([
    request<unknown>("/auth/accounts", { signal }),
    request<unknown>("/auth/me", { signal }),
  ]);
  const directory = readDirectory(directoryReply);
  const signedIn = readSignedIn(selfReply);
  if (signedIn.account === null) throw new RequestError("sign in first", 401);
  if (!directory.accounts.some((account) => account.id === signedIn.account?.id)) {
    throw new UnreadableAccounts();
  }
  return { accounts: directory.accounts, self: signedIn.account.id };
}

function requestFailure(error: unknown): { status: number | null; message: string } {
  if (error instanceof RequestError) {
    if (error.status === 401) return { status: 401, message: "Your sign-in has ended." };
    if (error.status === 403) return { status: 403, message: "Your account permissions changed." };
    if (error.status === 404)
      return { status: 404, message: "That account is no longer available." };
    if (error.status === 409) return { status: 409, message: "Keep at least one enabled Admin." };
    return { status: error.status, message: "The account change could not be saved." };
  }
  if (error instanceof UnreadableAccounts) {
    return { status: null, message: "The account service returned unreadable account data." };
  }
  if (error instanceof TypeError) {
    return { status: null, message: "The account service could not be reached." };
  }
  throw error;
}

export function AccountsSection({
  profileType,
  onPermissionsChanged,
  navigate = navigateTo,
  reload = reloadPage,
}: {
  profileType: ProfileType;
  onPermissionsChanged?: () => void;
  navigate?: (path: string) => void;
  reload?: () => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [directory, setDirectory] = useState<{
    key: number;
    accounts: Account[];
    self: number;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void readAccounts(controller.signal)
      .then((next) => {
        setDirectory({ key: refreshKey, ...next });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const failure = requestFailure(error);
        setMessage(failure.message);
        if (failure.status === 401) navigate("/sign-in");
      });
    return () => {
      controller.abort();
    };
  }, [navigate, refreshKey]);

  const mutate = async (account: Account, path: string, body?: { profile_type: ProfileType }) => {
    setBusy(account.id);
    setMessage(null);
    try {
      const result = await request<unknown>(
        path,
        body === undefined ? { method: "POST" } : postJson(body),
      );
      if (!isRecord(result) || !Object.hasOwn(result, "account")) throw new UnreadableAccounts();
      const updated = readAccount(result.account);
      if (updated.id !== account.id) throw new UnreadableAccounts();
      if (account.id === directory?.self) {
        if (updated.disabled) {
          navigate("/sign-in");
        } else {
          reload();
        }
        return;
      }
      setRefreshKey((key) => key + 1);
    } catch (error) {
      const failure = requestFailure(error);
      setMessage(failure.message);
      if (failure.status === 401) navigate("/sign-in");
      if (failure.status === 403) {
        onPermissionsChanged?.();
        setRefreshKey((key) => key + 1);
      }
    } finally {
      setBusy(null);
    }
  };

  const admin = profileType === "admin";
  const currentDirectory = directory?.key === refreshKey ? directory : null;
  return (
    <Section title="Accounts" hint="Account access and profile are controlled by an Admin.">
      {message === null ? null : (
        <p role="alert" className="mb-3 text-small text-text-secondary">
          {message}
        </p>
      )}
      {currentDirectory === null ? (
        message === null ? (
          <p role="status">Loading accounts…</p>
        ) : null
      ) : currentDirectory.accounts.length === 0 ? (
        <p className="text-small text-text-tertiary">No accounts are registered.</p>
      ) : (
        <div
          role="region"
          aria-label="Accounts table"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="max-w-full overflow-x-auto rounded-ds-lg bg-surface-card outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 [&>div]:overflow-x-visible"
        >
          <Table aria-label="Accounts" size="sm" className="min-w-190">
            <Table.Header>
              <Table.Head id="account" isRowHeader label="Account" />
              <Table.Head id="profile" label="Profile" />
              <Table.Head id="status" label="Access" />
              <Table.Head id="signed-in" label="Last recorded sign-in" />
              {admin ? <Table.Head id="actions" label="Admin actions" /> : null}
            </Table.Header>
            <Table.Body items={currentDirectory.accounts} dependencies={[admin, busy]}>
              {(account) => (
                <Table.Row id={String(account.id)}>
                  <Table.Cell>
                    <span className="font-medium text-text-primary">{account.display_name}</span>
                    {account.id === currentDirectory.self ? (
                      <span className="ml-2 text-caption text-text-tertiary">You</span>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell className="capitalize">{account.profile_type}</Table.Cell>
                  <Table.Cell>{account.disabled ? "Disabled" : "Enabled"}</Table.Cell>
                  <Table.Cell>
                    {account.signed_in_at === null ? (
                      <span className="text-text-tertiary">No recorded sign-in</span>
                    ) : (
                      <time dateTime={account.signed_in_at}>{account.signed_in_at}</time>
                    )}
                  </Table.Cell>
                  {admin ? (
                    <Table.Cell>
                      <div className="flex min-w-48 flex-wrap items-center gap-2">
                        <Select
                          aria-label={`Profile: ${account.display_name}`}
                          className="w-36"
                          isDisabled={busy !== null}
                          items={[
                            { id: "reader", label: "Reader" },
                            { id: "analyst", label: "Analyst" },
                            { id: "admin", label: "Admin" },
                          ]}
                          value={account.profile_type}
                          onChange={(key) => {
                            const profile = String(key);
                            if (
                              profile === "reader" ||
                              profile === "analyst" ||
                              profile === "admin"
                            ) {
                              void mutate(
                                account,
                                `/auth/accounts/${String(account.id)}/profile-type`,
                                {
                                  profile_type: profile,
                                },
                              );
                            }
                          }}
                        >
                          {(item) => <Select.Item id={item.id} label={item.label} />}
                        </Select>
                        <Button
                          color="secondary"
                          size="sm"
                          isDisabled={account.disabled || busy !== null}
                          onPress={() => {
                            void mutate(account, `/auth/accounts/${String(account.id)}/disable`);
                          }}
                        >
                          Disable
                        </Button>
                      </div>
                    </Table.Cell>
                  ) : null}
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      )}
    </Section>
  );
}

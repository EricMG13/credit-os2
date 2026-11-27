import { useEffect, useState } from "react";
import { Button } from "@/components/base/buttons/button";

type ProfileType = "reader" | "analyst" | "admin";
type Account = { id: number; display_name: string; profile_type: ProfileType };

function accountFrom(value: unknown): Account | null {
  if (typeof value !== "object" || value === null || !("account" in value)) return null;
  const account = value.account;
  if (typeof account !== "object" || account === null) return null;
  if (
    !("id" in account) ||
    typeof account.id !== "number" ||
    !Number.isSafeInteger(account.id) ||
    account.id < 1 ||
    !("display_name" in account) ||
    typeof account.display_name !== "string" ||
    !("profile_type" in account) ||
    (account.profile_type !== "reader" &&
      account.profile_type !== "analyst" &&
      account.profile_type !== "admin")
  )
    return null;
  return {
    id: account.id,
    display_name: account.display_name,
    profile_type: account.profile_type,
  };
}

function profileName(profile: ProfileType) {
  if (profile === "reader") return "Reader";
  if (profile === "analyst") return "Analyst";
  return "Admin";
}

function passcodeFailure(status: number) {
  if (status === 401) return "Sign in first to use a passcode.";
  if (status === 403) return "That passcode was not accepted.";
  if (status === 429) return "Too many attempts. Try again later.";
  if (status === 400) return "Enter a valid passcode.";
  return "The passcode could not be checked. Try again.";
}

function signOutFailure(status: number) {
  if (status === 401) return "Your session has ended. Sign in again.";
  return "You could not be signed out. Try again.";
}

async function readAccount(): Promise<Account | null> {
  const response = await fetch("/auth/me", { cache: "no-store" });
  if (!response.ok) return null;
  return accountFrom(await response.json());
}

function redirectToSignIn() {
  window.location.assign("/sign-in");
}

export function AccountControl({
  enabled = true,
  navigate = redirectToSignIn,
  onProfileUpdated,
}: {
  enabled?: boolean;
  navigate?: (path: string) => void;
  onProfileUpdated?: () => void;
}) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!enabled) return;
    let current = true;
    readAccount()
      .then((result) => {
        if (!current) return;
        setAccount(result);
        setLoaded(true);
        if (!result) setMessage("Your account could not be loaded. Refresh to try again.");
      })
      .catch(() => {
        if (!current) return;
        setLoaded(true);
        setMessage("Your account could not be loaded. Refresh to try again.");
      });
    return () => {
      current = false;
    };
  }, [enabled]);

  if (!enabled) return null;

  const submitPasscode = async () => {
    if (busy) return;
    const submitted = passcode;
    setPasscode("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/auth/passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: submitted }),
      });
      if (!response.ok) {
        setMessage(passcodeFailure(response.status));
        return;
      }
      const updated = await readAccount();
      if (!updated) {
        setMessage("Your profile could not be refreshed. Refresh to try again.");
        return;
      }
      setAccount(updated);
      setMessage("Profile updated.");
      onProfileUpdated?.();
    } catch {
      setMessage("The passcode could not be checked. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (busy) return;
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/auth/sign-out", { method: "POST" });
      if (!response.ok) {
        setMessage(signOutFailure(response.status));
        return;
      }
      navigate("/sign-in");
    } catch {
      setMessage("You could not be signed out. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const label =
    loaded && account
      ? `${account.display_name} · ${profileName(account.profile_type)}`
      : "Account";

  return (
    <div className="relative flex min-h-14 shrink-0 items-center">
      <Button
        className="outline-focus-ring"
        size="sm"
        color="secondary"
        aria-expanded={open}
        aria-controls="account-controls"
        onPress={() => {
          setOpen((value) => !value);
        }}
      >
        {label}
      </Button>
      <section
        id="account-controls"
        aria-label="Account controls"
        hidden={!open}
        className="absolute top-full right-0 z-20 mt-2 w-80 rounded-ds-md border border-border-subtle bg-surface-card p-4 shadow-2"
      >
        {loaded && account ? (
          <>
            <p className="text-small font-semibold text-text-primary">{account.display_name}</p>
            <p className="mt-1 text-small text-text-secondary">
              {profileName(account.profile_type)} profile
            </p>
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void submitPasscode();
              }}
            >
              <label className="grid gap-1.5 text-small font-medium text-text-primary">
                Admin passcode
                <input
                  autoComplete="off"
                  className="min-h-9 rounded-ds-sm border border-border-control bg-surface-card px-3 text-body text-text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                  type="password"
                  value={passcode}
                  onChange={(event) => {
                    setPasscode(event.currentTarget.value);
                  }}
                  disabled={busy}
                />
              </label>
              <Button
                type="submit"
                size="sm"
                isLoading={busy}
                isDisabled={busy || passcode.length === 0}
              >
                Use passcode
              </Button>
            </form>
            <Button
              className="mt-2"
              color="tertiary"
              size="sm"
              onPress={() => {
                void signOut();
              }}
              isDisabled={busy}
            >
              Sign out
            </Button>
          </>
        ) : (
          <p role="status" className="text-small text-text-secondary">
            {loaded
              ? "Your account could not be loaded. Refresh to try again."
              : "Loading account…"}
          </p>
        )}
        {message && (
          <p role="alert" className="mt-3 text-small text-text-secondary">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  hasPermissions,
  requestPermissions,
  watchPermissions,
} from '@/utils/permissions';
import { welcomeConfig, type PermissionStep, type WelcomeConfig } from './config';

type StepStatus = 'idle' | 'pending' | 'granted' | 'denied' | 'error';

function App() {
  const { name } = browser.runtime.getManifest();
  const { valueProp, activationSurfaces, demoMedia, steps, links } =
    welcomeConfig;

  const [statuses, setStatuses] = useState<Record<string, StepStatus>>(() =>
    Object.fromEntries(steps.map((s) => [s.id, 'idle' as StepStatus])),
  );

  const refreshGranted = useCallback(async () => {
    const results = await Promise.all(
      steps.map((s) => hasPermissions(s.permissions)),
    );
    setStatuses((prev) => {
      let changed = false;
      const next = { ...prev };
      steps.forEach((s, i) => {
        // Don't clobber 'pending' (an in-flight click). Otherwise, mirror reality.
        if (next[s.id] === 'pending') return;
        const status: StepStatus = results[i] ? 'granted' : 'idle';
        if (next[s.id] !== status) {
          next[s.id] = status;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [steps]);

  useEffect(() => {
    refreshGranted();
    return watchPermissions(refreshGranted);
  }, [refreshGranted]);

  const allGranted = useMemo(
    () => steps.length > 0 && steps.every((s) => statuses[s.id] === 'granted'),
    [statuses, steps],
  );

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-xl px-6 py-16">
        <header className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Welcome to {name}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {valueProp}
          </p>
        </header>

        {demoMedia && <DemoMedia media={demoMedia} />}

        {activationSurfaces.length > 0 && (
          <ActivationSurfaces surfaces={activationSurfaces} />
        )}

        {steps.length > 0 && (
          <ol className="space-y-3 mb-8" aria-label="Setup steps">
            {steps.map((step) => (
              <Step
                key={step.id}
                step={step}
                status={statuses[step.id]}
                onClick={() => {
                  // Synchronous user-gesture chain: no awaits before request.
                  setStatuses((prev) => ({ ...prev, [step.id]: 'pending' }));
                  requestPermissions(step.permissions).then(
                    (granted) =>
                      setStatuses((prev) => ({
                        ...prev,
                        [step.id]: granted ? 'granted' : 'denied',
                      })),
                    () =>
                      setStatuses((prev) => ({
                        ...prev,
                        [step.id]: 'error',
                      })),
                  );
                }}
              />
            ))}
          </ol>
        )}

        {allGranted && <AllSetState />}

        <TrustFooter links={links} />
      </div>
    </div>
  );
}

function DemoMedia({
  media,
}: {
  media: NonNullable<WelcomeConfig['demoMedia']>;
}) {
  if (media.type === 'video') {
    return (
      <video
        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 mb-8"
        src={media.src}
        aria-label={media.alt}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }
  return (
    <img
      className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 mb-8"
      src={media.src}
      alt={media.alt}
    />
  );
}

function ActivationSurfaces({ surfaces }: { surfaces: string[] }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
        Where this activates
      </h2>
      <ul className="text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
        {surfaces.map((s) => (
          <li key={s} className="flex items-start gap-2">
            <span
              className="mt-1.5 inline-block h-1 w-1 rounded-full bg-neutral-400 dark:bg-neutral-500"
              aria-hidden
            />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Step({
  step,
  status,
  onClick,
}: {
  step: PermissionStep;
  status: StepStatus;
  onClick: () => void;
}) {
  const granted = status === 'granted';
  const pending = status === 'pending';

  return (
    <li className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-start gap-3">
        <StatusIcon status={status} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{step.label}</div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
            {step.justification}
          </p>

          {!granted && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={onClick}
                disabled={pending}
                className="rounded-md bg-neutral-900 dark:bg-neutral-100 px-3 py-1.5 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {pending ? 'Waiting…' : (step.cta ?? 'Allow')}
              </button>
              {step.privacyNote && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {step.privacyNote}
                </span>
              )}
            </div>
          )}

          {status === 'denied' && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Not granted. Click the button to try again — features needing
              this access will stay disabled.
            </p>
          )}

          {status === 'error' && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Something went wrong. Reload this tab and try again.
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'granted') {
    return (
      <svg
        viewBox="0 0 16 16"
        className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-label="Granted"
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.5-4.5z"
        />
      </svg>
    );
  }
  if (status === 'pending') {
    return (
      <svg
        viewBox="0 0 16 16"
        className="h-5 w-5 shrink-0 animate-spin text-neutral-400 dark:text-neutral-500"
        aria-label="Waiting"
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.25"
        />
        <path
          d="M14 8a6 6 0 00-6-6"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-5 w-5 shrink-0 text-neutral-400 dark:text-neutral-500"
      aria-label="Not yet granted"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function AllSetState() {
  return (
    <section
      className="mb-8 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
        You&rsquo;re all set.
      </p>
      <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-200/80 flex items-start gap-2">
        <PuzzleIcon />
        <span>
          Tip: click the puzzle-piece icon in your toolbar and pin this
          extension so you can reach it in one click.
        </span>
      </p>
    </section>
  );
}

function PuzzleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-300"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M20.5 11h-1.7V8.6a1.6 1.6 0 0 0-1.6-1.6h-2.4V5.3a2.3 2.3 0 1 0-4.6 0V7H7.6A1.6 1.6 0 0 0 6 8.6V11H4.5a2.5 2.5 0 1 0 0 5H6v2.4A1.6 1.6 0 0 0 7.6 20H10v-1.7a2.3 2.3 0 0 1 4.6 0V20h2.6a1.6 1.6 0 0 0 1.6-1.6V16h1.7a2.5 2.5 0 1 0 0-5z"
      />
    </svg>
  );
}

function TrustFooter({ links }: { links: WelcomeConfig['links'] }) {
  const { version } = browser.runtime.getManifest();
  return (
    <footer className="mt-12 border-t border-neutral-200 dark:border-neutral-800 pt-4 text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap gap-x-4 gap-y-1">
      <span>v{version}</span>
      <a className="hover:underline" href={links.repo}>
        Source
      </a>
      <a className="hover:underline" href={links.issues}>
        Report an issue
      </a>
      <a className="hover:underline" href={links.privacy}>
        Privacy
      </a>
      <span className="ml-auto">
        Revoke access anytime in <code>chrome://extensions</code>.
      </span>
    </footer>
  );
}

export default App;

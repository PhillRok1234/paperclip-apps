import { useMemo, useState } from 'react';
import cronstrue from 'cronstrue';
import cronParser from 'cron-parser';
import { nlToCron } from './nl-to-cron';

const EXAMPLES: { nl: string; cron: string }[] = [
  { nl: 'every weekday at 9am', cron: '0 9 * * 1,2,3,4,5' },
  { nl: 'every 15 minutes', cron: '*/15 * * * *' },
  { nl: 'every monday at 14:30', cron: '30 14 * * 1' },
  { nl: 'every mon, wed, fri at 9am', cron: '0 9 * * 1,3,5' },
  { nl: 'every weekend at 10am', cron: '0 10 * * 0,6' },
  { nl: 'every 3 hours', cron: '0 */3 * * *' },
  { nl: 'at midnight', cron: '0 0 * * *' },
  { nl: 'every hour', cron: '0 * * * *' },
  { nl: 'every 3 days', cron: '0 0 */3 * *' },
  { nl: 'monthly', cron: '0 0 1 * *' },
];

const tzLabel = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'local';
  }
})();

function fmt(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function nextRuns(cron: string, count = 5): { runs: Date[]; error: string | null } {
  try {
    const it = cronParser.parseExpression(cron);
    const runs: Date[] = [];
    for (let i = 0; i < count; i++) {
      runs.push(it.next().toDate());
    }
    return { runs, error: null };
  } catch (err) {
    return { runs: [], error: err instanceof Error ? err.message : String(err) };
  }
}

function describe(cron: string): string | null {
  try {
    return cronstrue.toString(cron, { verbose: false });
  } catch {
    return null;
  }
}

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* no-op */
        }
      }}
      aria-label={`Copy ${value}`}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

export function App() {
  const [nlText, setNlText] = useState('every weekday at 9am');
  const [cronText, setCronText] = useState('0 9 * * 1,2,3,4,5');

  const nlResult = useMemo(() => nlToCron(nlText), [nlText]);
  const cronEnglish = useMemo(() => describe(cronText), [cronText]);
  const upcoming = useMemo(() => nextRuns(cronText), [cronText]);

  function useExample(ex: { nl: string; cron: string }) {
    setNlText(ex.nl);
    setCronText(ex.cron);
  }

  return (
    <main>
      <header>
        <h1>Cron Whisperer</h1>
        <p className="tagline">
          Plain English to cron expressions, and back. See the next 5 runs. No login, no upload —
          runs in your browser.
        </p>
      </header>

      <section className="card" aria-labelledby="nl-heading">
        <h2 id="nl-heading">English → cron</h2>
        <label htmlFor="nl-input" className="label">
          Describe a schedule in plain English
        </label>
        <input
          id="nl-input"
          className="text-input"
          type="text"
          value={nlText}
          onChange={(e) => setNlText(e.target.value)}
          placeholder="e.g. every weekday at 9am"
          spellCheck={false}
          autoComplete="off"
        />
        {nlResult.ok ? (
          <div className="result success">
            <div className="result-row">
              <code className="cron-out" data-testid="cron-out">
                {nlResult.cron}
              </code>
              <CopyButton value={nlResult.cron} />
              <button
                type="button"
                className="copy-btn secondary"
                onClick={() => setCronText(nlResult.cron)}
              >
                Use ↓
              </button>
            </div>
            <p className="muted">Matched: {nlResult.usedRule}</p>
          </div>
        ) : (
          <div className="result error" role="alert">
            {nlResult.error}
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="cron-heading">
        <h2 id="cron-heading">Cron → English</h2>
        <label htmlFor="cron-input" className="label">
          Paste or edit a cron expression
        </label>
        <input
          id="cron-input"
          className="text-input mono"
          type="text"
          value={cronText}
          onChange={(e) => setCronText(e.target.value)}
          placeholder="*/15 * * * *"
          spellCheck={false}
          autoComplete="off"
        />
        {cronEnglish ? (
          <div className="result success">
            <div className="result-row">
              <span className="english-out">{cronEnglish}</span>
              <CopyButton value={cronEnglish} label="Copy text" />
            </div>
          </div>
        ) : (
          <div className="result error" role="alert">
            Not a valid 5-field cron expression.
          </div>
        )}

        <div className="next-runs">
          <h3>
            Next 5 runs <span className="muted">({tzLabel})</span>
          </h3>
          {upcoming.error ? (
            <p className="muted">—</p>
          ) : (
            <ol>
              {upcoming.runs.map((d) => (
                <li key={d.toISOString()}>{fmt(d)}</li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="card" aria-labelledby="examples-heading">
        <h2 id="examples-heading">Examples</h2>
        <p className="muted">Click an example to load it.</p>
        <ul className="examples">
          {EXAMPLES.map((ex) => (
            <li key={ex.cron}>
              <button type="button" className="example-btn" onClick={() => useExample(ex)}>
                <span className="example-nl">{ex.nl}</span>
                <code className="example-cron">{ex.cron}</code>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <footer>
        <p className="muted">
          Cron syntax: <code>minute hour day month day-of-week</code>. Day-of-week is{' '}
          <code>0–6</code> (Sun=0). Source:{' '}
          <a href="https://github.com/PhillRok1234/paperclip-apps">PhillRok1234/paperclip-apps</a> ·{' '}
          <code>apps/cron-whisperer</code>
        </p>
      </footer>
    </main>
  );
}

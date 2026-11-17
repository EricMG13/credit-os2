# Run Credit OS 2

Credit OS 2 is based on RBOT-HTML `be953752`. It keeps that revision's Python pin,
`pyproject.toml`, `uv.lock`, scheduler, calculations, provider configuration and library
publication. The browser uses the Credit OS design system and React 19.3.0. Run intake,
activity, library and report navigation live at one local address.
The rail's Run item opens Run activity (`/runs`): the runs that are running and waiting, each
linked to its own page (`/run/<id>`). Start a run is a button there and on Library.

## Set up

Install Node.js 24, uv 0.12.5, Google Chrome and Microsoft Edge. Extract the
`credit-os2-react.zip` release to a short local path, or use the repository checkout.
Open a terminal in the extracted project directory.

```sh
uv sync --locked
npm --prefix web ci
npm --prefix web run build
```

A release ZIP includes the compiled React assets. A source checkout needs the build
command before launch. uv takes Python and all Python package versions from
RBOT-HTML's existing pins.

## Run the browser proof

On the Windows work PC, install Node.js 24, uv 0.12.5, Google Chrome and
Microsoft Edge. Save `credit-os2-react.zip` and `credit-os2-react.zip.sha256`
together in Downloads. Paste the following into PowerShell.

```powershell
$downloads = Join-Path $env:USERPROFILE 'Downloads'
$zip = Join-Path $downloads 'credit-os2-react.zip'
$expected = ((Get-Content -LiteralPath "$zip.sha256" -Raw -ErrorAction Stop).Trim() -split '\s+')[0]
$actual = (Get-FileHash -LiteralPath $zip -Algorithm SHA256 -ErrorAction Stop).Hash.ToLowerInvariant()
if ($actual -ne $expected) { throw 'Candidate ZIP checksum mismatch.' }

$id = [guid]::NewGuid().ToString('N').Substring(0, 8)
$folder = Join-Path $env:TEMP "cos2-$id"
Expand-Archive -LiteralPath $zip -DestinationPath $folder -ErrorAction Stop
$log = Join-Path $folder 'proof-console.txt'
$exitFile = Join-Path $folder 'proof-exit-code.txt'

Push-Location -LiteralPath $folder -ErrorAction Stop
try {
    $env:CREDIT_OS_PROOF_ZIP_SHA256 = $actual
    & $env:ComSpec /d /c 'Run-React-Proof.cmd 2>&1' | Tee-Object -FilePath $log
    $exitCode = $LASTEXITCODE
} finally {
    Remove-Item Env:CREDIT_OS_PROOF_ZIP_SHA256 -ErrorAction SilentlyContinue
    Pop-Location
}

"Browser proof exit code: $exitCode" | Tee-Object -FilePath $exitFile
$files = @($log, $exitFile)
$proofFolder = Join-Path $folder 'proof-artifacts'
if (Test-Path -LiteralPath $proofFolder) { $files += $proofFolder }

$reply = Join-Path $downloads "credit-os2-windows-proof-$id.zip"
Compress-Archive -LiteralPath $files -DestinationPath $reply -ErrorAction Stop
Write-Host "Send back: $reply"
```

Send back the printed `credit-os2-windows-proof-*.zip` even if the test fails.
It contains `proof-console.txt`, `proof-exit-code.txt` and the generated
`proof-artifacts/` directory if the runner reached the browser checks. A
successful `proof.json` identifies the Windows platform, both branded browsers,
the ZIP hash, the source commit and the screenshots for each synthetic run. The
release requires both browser records and exit code 0 on the work PC.

On macOS or after setup, run the following command.

```sh
npm --prefix web run proof:connected
```

Playwright launches the installed branded browsers. Set `CHROME_PATH` or `EDGE_PATH`
to the corresponding executable if it is installed in a nonstandard location.
Success is two passing tests and exit code 0. Each browser uses a separate temporary
workspace and uploads the same synthetic Northbridge filing, portfolio workbook and
credit agreement.
It checks the four-step Run page, drop zone and Readiness panel, inspects the three
uploaded documents, selects the workbook and the executed agreement in the form,
cancels the paid confirmation with submission blocked, and completes the synthetic
confirmation. It checks recorded spend, elapsed time, modules and the delivery event on
Run activity, the finished report and all five redesigned views, the issuer calendar and
its source row, keyboard focus after closing figure and row traces, the exact original
handoff download, a published CP-1 chart, downside cases and break points with
source links and a 390 px layout, rate and currency shocks, dated instrument
quotes and recovery qualifications, the workbook-matched portfolio limits chart
and source table, and the model forecast that RBOT-HTML calculates. Run charts in
Forecast are checked against the owning module and the same Evidence link.
Results and screenshots are saved under
`proof-artifacts/`. The proof substitutes canned model responses and makes no
paid calls.

To prepare a local release candidate from committed sources, run:

```sh
uv run --locked python tools/package_react_windows.py --revision HEAD
```

The builder installs the locked frontend dependencies in a temporary source
directory and writes `delivery/credit-os2-react.zip` and its checksum. Candidate
archives contain the synthetic filing and canned handoffs in `proof/handoffs/`.
The bundled proof runs independently of development fixtures and local issuer data.

## Open the interface

Run the service against a short, local workflow workspace. Use a new, empty folder for
the manual synthetic proof. On the Documents step enter `Northbridge Synthetic Group` as
the issuer name, `2025-03-31` as the as-of date and your name under Your name (the run
cannot start without it). Upload `proof/northbridge-filing.txt`,
`proof/northbridge-portfolio.xlsx` and `proof/northbridge-credit-agreement.txt`, then
select Continue to purpose, choose Full credit assessment (RBOT's Credit Snapshot
pathway) and select Continue to context. In More context, select
`northbridge-portfolio.xlsx` under Portfolio workbook, set Legal documents to Executed
agreement and select `northbridge-credit-agreement.txt` under The agreement. Select
Review run. On the review sheet, tick each item under Limits to decide, tick the checkbox
that begins "Approve: I have read this summary" and select Submit run. In the
confirmation dialog, choose Start synthetic run. Open the report from Run activity when
it finishes.

The synthetic proof also runs without the agreement. Skip that upload and leave Legal
documents at No agreement: the review sheet lists a Will refuse limit on Legal &
covenants ("No executed governing document"). Accept it with the other limits and the run
still finishes, with Legal & covenants delivered as Not assessable. The other modules
answer with fixed synthetic text, so the modules the sheet lists under Also affects show
no sign of the limit. The synthetic launcher takes the first run of an issuer only, so
start the service on a new empty folder for each run.

```sh
PYTHONPATH=src uv run --locked python -m proof.serve --root /path/to/empty-proof-folder
```

Keep that root path at most 80 characters. After stopping the synthetic service, choose another
new empty root for the next proof session; `proof.serve` deliberately refuses a nonempty root.
Do not empty an existing workspace to work around that check. Refreshes and navigation within
the running session retain its runs, but restarting `proof.serve` is not a way to reopen them.

A retained publication can instead be inspected with the separate read-only preview, when its
qualified snapshot JSON and engine folder are available:

```sh
PYTHONPATH=src uv run --locked python -m react_frontend.preview --engine /path/to/engine --snapshot /path/to/qualified-snapshot.json --run RUN_FOLDER --web web/dist
```

This preview copies the selected retained files into a temporary folder and refuses write
endpoints; it starts no scheduler or provider. Its snapshot must already carry an explicit
preview qualification and contain the selected run. It is an inspection of retained results,
not a resumed synthetic session or a new execution.

For the regular RBOT-HTML workflow:

```sh
PYTHONPATH=src uv run --locked python -m react_frontend --root /path/to/workflow-folder
```

In PowerShell, set `$env:PYTHONPATH = (Join-Path (Get-Location) 'src')` first, then run
either command beginning with `uv`. Open the printed loopback address. Regular mode
uses RBOT-HTML's existing provider-key checks, reviewed submission and run cap.

The repository's `docs/design/react-module-coverage.md` maps the report modules
to the React components and published data.

Full credit assessment and Portfolio Decision accept the pinned [workbook
template](templates/portfolio.template.xlsx) or the fund's own exports. For the
exports, upload the mandate, constraints and exposure report CSVs and the
holdings workbook. Select the holdings workbook in the Portfolio workbook field.
RBOT-HTML lists the validation findings in the run summary. The limits chart shows
current exposure against maximum limits when the published values match the
run's frozen portfolio inputs on the same date and `% NAV` basis. For an export,
the holdings must corroborate the exposure and the NAV. Proposals stay in the
published table. A table containing a minimum limit or an unverified row stays
in table view.

## Live runs and report verification

RBOT-HTML maps the Claude Fast preset to `opus-medium` (Claude Opus 5.5 at medium
effort). Set `ANTHROPIC_API_KEY` in the launching environment for this preset and
`OPENAI_API_KEY` for the service startup check. The regular reviewed submission
uses RBOT-HTML's pathway cap: Lite USD 15, Full USD 25, Deep USD 40, or USD 20
for a purpose pathway. Use one issuer's financial statements for the required
periods, cash and debt schedules, executed financing and covenant documents, and
dated market, peer and ratings evidence where relevant.

The redesigned reader was checked separately against the retained Caesars
Entertainment report as of 2 October 2026. The live test produced 12 accepted
handoffs from 18 source files. The final continuation reused eight responses and
completed four modules through the live provider. Across its three segments the
test settled USD 32.16235440 under a one-time USD 50 authorization. The native
library withheld listing during its retained-method check. The read-only preview
preserved that status and the missing portfolio and legal evidence. The browser
proof in this ZIP uses the synthetic Northbridge case and canned responses.

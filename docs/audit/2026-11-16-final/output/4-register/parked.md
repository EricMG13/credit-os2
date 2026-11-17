# Parked findings (stage 4)

Hostile or unusual inputs no roadmap line names (ruling R3). Registered, not repaired.

| Id | Sev | Section | Finding | Merged |
| :--- | :--- | :--- | :--- | :--- |
| J2-011 | Medium | J2 | Two runs of the same issuer, date and pathway started together are both accepted and finish, and the library then lists two identical history rows, each called the first run, with nothing to tell them apart. |  |
| S3-009 | Medium | S3 | One malformed record makes every library page unreadable and prints the reader's internal data path in the page body. | S4-014 |
| C1-010 | Low | C1 | One malformed catalogue entry takes down the whole Library page: the user sees only 'This page could not be loaded' and a Reload button that fails the same way. |  |
| C1-011 | Low | C1 | A run status, module state or event kind the client does not know crashes the whole Run activity or run page into the load-failure screen. |  |
| C1-012 | Low | C1 | getLibraryIndex and getSnapshot hand the browser's JSON parse error to the reader ('Unexpected token '<', "<html>oops</html>" is not valid JSON'). |  |
| C2-021 | Low | C2 | An unknown or malformed from= run shows the service's raw words 'unknown run' or 'not found' in a quiet status line. |  |
| C2-024 | Low | C2 | A Submit answered 200 without a run id navigates to /run/undefined. |  |
| C3-009 | Low | C3 | One unbroken 336-character token in the lead Bottom line runs past the navy band and makes the main region scroll sideways. |  |
| C5-020 | Low | C5 | An address naming a module that is not in the run filters the page to nothing while the Module select still reads "All modules". |  |
| C5-021 | Low | C5 | ArtifactDownloads draws any href the listing returns, including a foreign https address. |  |
| C5-027 | Low | C5 | A calculation id defined twice, or nested deeper than 8, silently disappears from a drawer's derivation. |  |
| S1-012 | Low | S1 | The no-data, unreadable-data and no-such-page states are one bare grey sentence; different causes read alike and the reader's internal reason is drawn raw. |  |
| S1-013 | Low | S1 | Any schema other than credit-os-data/1 is reported as "written by a newer version", and the schema text is kept but never shown. |  |
| S1-016 | Low | S1 | The top-level `issuers` list is read only by an unreachable branch of App.tsx, yet one malformed entry turns every page into "Library data is missing". |  |
| S1-020 | Low | S1 | The skip link's href is "#main", so followed outside its click handler it opens the "Page not found" page. |  |
| S2-028 | Low | S2 | The reader accepts a card href, a history report and a Changes link that name a run the issuer does not hold, so a card opens 'No such run'. |  |
| S2-029 | Low | S2 | A single unbroken token of about 200 characters in an issuer name, a finding or a measure label widens <main> and scrolls the page sideways. |  |
| S3-016 | Low | S3 | A long unbroken word overflows its row: an indicator threshold runs under the neighbouring column, a fact value and a key-finding lead run past the card. |  |
| S5-021 | Low | S5 | A very long unbroken word in the issuer name makes the breadcrumb 735 px wide and the page scroll sideways at 390 px. |  |
| S6-019 | Low | S6 | One invalid string makes every run page a bare message that prints the validator's path text, and no run page can be read. |  |
| C4-018 | Info | C4 | Two columns with the same case name, or more than six cases, silently lose the cash proxy chart or the case cards. |  |
| J5-006 | Info | J5 | At 390 px a 184-character issuer name fills 504 of the 844 px of the first screen on every report page, and the browser title is 207 characters; the name wraps everywhere without clipping. |  |
| R1-002 | Info | C2 | A hand-built module list holding CP-8 passes the server's module check at Submit and is refused by the launcher at launch. |  |
| R1-005 | Info | C1 | A data.js with no final ';' makes the service answer 500. |  |
| R1-006 | Info | C1 | A data.js with two 'catalogue' keys, the first holding 'workspace', is served as read. |  |
| R1-010 | Info | C1 | A hand-edited event log can make the Teams card count a left-out module. |  |
| R1-011 | Info | C2 | A crafted Submit body can put CP-MODEL on a pathway that publishes no forecast; Submit accepts any known module on any pathway. |  |
| R1-014 | Info | C1 | Filing an earlier-format delivery against a hand-edited issuer registry stores 'could not be filed: <absolute path>/_engine/state/issuers.json is not a map'. |  |
| X1-008 | Info | X1 | Five components throw on out-of-contract props, and only the connected app has an error boundary around them. | S4-022 |
| X1-010 | Info | X1 | Timeline keys each item by date and title, so two items with the same date and title collide. |  |
| X1-022 | Info | X1 | Only four of eleven chart kinds check that the table's figures equal the chart's figures. |  |

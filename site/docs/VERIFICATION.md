# Verification — 8 October 2026, updated 8 November 2026

This is a private work-version release of the patcher. The translation itself
is still under editorial review; this report does not invent FINAL approval.

- Original source text banks: byte-exact round trip, 829 banks, zero mismatches.
- Fourteen complete retail inputs: exact SHA-256 identification and native JS
  normalization to the same-edition USA source; every stage and output hash checked.
- Eight independent naming combinations per edition, sixteen complete outputs.
- Native bank encoding/decode, real-font fixed-window fit and dialogue pagination.
- Fourteen non-default outputs: complete allowlisted ROM diff, every unrelated
  resource byte-for-byte preserved, original trainer/personal/move/evolution/
  encounter data verified; Easy Chat ARM9 regenerated from the actual chosen words
  and compared with its exact retail-derived image. No gameplay changes.
- Production script transport matches compressed patch bytes exactly.
- Full browser flows: desktop 1440px, touch iPhone 13 emulation at 390px and
  offline file:// at 768px. Real HG/SS ROM inputs, verified download bytes,
  all-three English choices on the touch flow, original-ROM re-use, invalid input
  rejection, no UI freeze, no upload requests and no browser script errors.
- Responsive layout: 320, 360, 390, 768, 1024 and 1440px, no horizontal overflow;
  switches/actions at least 44px tall. No screenshots or source ROM copies created.
- Engine fixtures cover corruption rejection, source immutability for copy maps,
  proven trimming restoration and native banner palette decoding. Naming fixtures
  cover explicit story references, generic-language ambiguity, controls and boundaries.

Phone testing used Chromium device emulation, not real iOS Safari hardware.
Public online hosting needs HTTPS. The private local preview is http://127.0.0.1:8793/.
Generated patch data is a separate private artifact; ROMs and extracted assets
are neither committed nor included in the offline ZIP. See RIGHTS.md for the
separate distribution-permission question.

## Release identity (2026.10.08 data)

Saved translation snapshot SHA-256: `7772fb9d04387d06dea4bc1346a40c8e41dbb806c33979638f09fa8893e00aee`.

- HeartGold Dutch default: `feab80facca431b3d54ce493def1ab617b5cb4a46c9b91c9c2d2b410d84cdc04`.
- SoulSilver Dutch default: `b4bc5fe8861e2afb67a689ddb3bd196d25fba5f4a4967a7fb5fcc4bcc6b843f3`.

## Private LAN access fix

The server can bind to an explicit private LAN IP with `--host`; loopback remains
the default. Tested `http://192.168.2.10:8794/` with an actually insecure browser
context (SubtleCrypto unavailable), 390px touch emulation and the complete
SoulSilver patch/download flow with all English name switches enabled. Exact
output SHA-256 matched the already verified release, with no ROM uploads.
Software SHA-256 was independently compared with Node's native implementation:
empty/abc/million-a vectors, padding boundaries, nonzero view offsets, and a real
128 MiB ROM. Physical iPhone Safari and the phone's network access cannot be
confirmed from desktop emulation; the phone needs the same home network.

## Game-menu redesign

Removed the marketing hero, scenery, travel ticket and personal name references.
The interface uses compact grid-backed menus, blue headings, language choices
and orange focus borders; translation/source/help text is collapsed by default.
Actual game menu tiles/palette are read from the verified user ROM's a/0/3/8
archive and rendered locally. The distributed package contains the decoder, not
extracted graphics. Independent Python-vs-JavaScript checks matched all 24x24 RGBA
pixels for fourteen retail inputs. Full desktop, touch-phone and offline flows
passed with native menu frames active and no personal name in rendered text.

## Three-step menu flow

The patcher now shows one screen at a time: choose game, choose names, save.
Explicit Continue/Back actions keep the chosen file and language selections.
Incoming panels animate briefly; reduced-motion settings disable animation.
Progress and errors stay outside the panels so file recognition is visible in
step one. Navigation is disabled during file checks and patching.

Desktop, 390px touch emulation and offline file:// flows passed using original
HG/SS inputs and exact expected output hashes. Checks include invalid input,
back navigation, retained selections, repeat settings, download, responsive
processing and absence of uploads. Initial layouts pass from 320px to 1440px.

## ROM identification speed and progress

FileReader reports bytes loaded in the worker. The private HTTP SHA-256 fallback
reports processed bytes every MiB; the UI displays numeric percentages while
checking. Native WebCrypto reports start/end because its API has no intermediate
digest progress. A scalar round-state initialization replaces a per-block
iterator; one 128 MiB SoulSilver measurement dropped from 1769 ms to 593 ms
on this desktop, with 129 digest progress notifications. Phone speed may differ.

Trimmed files skip impossible full-size identities and identical restored
size/padding sequences are hashed once. Exact final SHA-256 remains mandatory.
Fixtures verify shared-padding identity selection and one digest, corruption
rejection, boundaries and real 128 MiB fallback hashes. Fourteen original inputs
and sixteen output configurations match their verified full hashes. The private
LAN mobile flow passes with multiple real displayed hash-progress values.

The translation explanation now states that the Dutch anime leads tone,
atmosphere and naming, including retained city names; no in-game voice claim.

## Independent ability-name option and reference categories

Four independent switches (items, places, moves, abilities) now produce sixteen
configurations per edition, thirty-two in total. Dutch remains the default.
The English ability option restores canonical bank 720 and Easy Chat bank 721
names and source-supported references such as Insomnia in Worry Seed's Dutch
description. Descriptions and dialogue retain Dutch sentences. Easy Chat's
word indexes are rebuilt from the actual final name tables.

An independent native check found that the older English-move combinations
changed Dutch Cute Charm's label from Warme charme to Warme Charm. Ability
tables are now excluded from general term replacement and owned by their
ability switch. The eight affected HG/SS combinations were regenerated.
Synthetic fixtures cover this cross-category case and ordinary Static/Pressure
phrasing, which must remain Dutch.

All fourteen original inputs and thirty-two output hashes pass the production
JavaScript engine. All thirty non-default outputs pass complete allowlisted
ROM diffs, native archive/message decode, exact Easy Chat checks, original
gameplay comparisons and independent ability-table selection checks. Desktop,
390px touch emulation and offline browser flows pass, including all-four
English switches and a second ability-only output using the retained file.
Four rows fit 320/360/768px; initial layouts fit 320 through 1440px.

The name-selection prompt now says “Kies per categorie de taal van de namen.”
Six reference categories show moves, items, capture balls, locations, abilities
and recognizable game terms (Level/HP). Exact episode/time examples use the
recorded Swift, Future Sight, Moon Stone and Silver Wing references; project
translation examples are labeled separately. No external links or screenshots.

## Fast local ROM recognition with cryptographic fallback

Native browser SHA-256 remains the preferred secure-context backend. The
private HTTP path recognizes known complete retail files with an original
WebAssembly SHA-1 implementation and recorded SHA-1 identities for all fourteen
inputs. An unavailable module or unmatched SHA-1 falls back to full SHA-256.
Trimmed copies use the same proven padding restoration and full-file identities.
No filename, header-only or partial fingerprint accepts a ROM.

The fast recognition step does not authorize patching: every patch stage still
requires its exact source SHA-256, compressed-payload SHA-256 and target SHA-256.
Native SHA-256 falls back to local WebAssembly SHA-256 and then the existing
JavaScript implementation. The original module uses a fixed 1 MiB working
buffer; it is embedded in a local script so offline file:// also works.
Source and reproducible clang/wasm-ld builder are in native/. No external
hashing service, ROM data or third-party game code is included.

Independent Node-crypto comparisons cover both algorithms, empty/abc/million-a
vectors, padding boundaries, subarray offsets, MiB boundaries and a real 128 MiB
ROM. Known SHA-1 recognition avoids a second SHA-256 pass during identification;
changed files invoke SHA-256 and are rejected. Module/native failure falls back
correctly. Local SHA-1 measurements were about 270 ms versus the prior 593 ms
JavaScript SHA-256 measurement; this is not an iPhone hardware benchmark.

Fourteen SHA-1/SHA-256 input identities and all thirty-two unchanged output
hashes pass the production engine. Desktop, touch emulation, offline and private
LAN browser flows pass. The LAN negative flow recognizes a known input but
refuses a deliberately wrong patch-source SHA-256 and offers no output.

## Anime example locators

The four Dutch examples retain the user-confirmed timestamps: Swift S03E22
18:35, Future Sight S03E40 07:44, Moon Stone S03E27 09:05 and Silver Wing
S05E05 04:28. Additional English episode locators were checked against the
project's `data/anime_term_hits.tsv` speech rows from official Pokémon TV
captions: Fast Ball S03E27 06:45 (Going Apricorn!), Goldenrod City S03E29
20:57 and Ilex Forest S03E29 01:21 (A Farfetch'd Tale!), Static S10E15
12:48 (Shapes Of Things To Come!). The Static cue explicitly identifies
Elekid's Ability. These timestamps are English caption locators and do not
constitute Dutch naming attestations. Their language is not displayed in the UI. Ilex Woud and Statisch remain project
translation choices, and Level/HP are game terminology rather than anime
examples. No caption text or source video is bundled.

Battle Frontier is shown as Strijd der Grenzen, following the user's current
glossary decision. Its episode locator is the inspected speech cue at S08E39
09:37 (The Scheme Team) in `data/anime_term_hits.tsv`. This is an English
caption locator, not an independently confirmed Dutch naming attestation.

## November 2026 text refresh (release 2026.11.08)

The manifest release string moved to `2026.11.08`. The packager runs against
the translation snapshot with SHA-256
`34d40b521f4244e5ae7d24690ba8d9d64bf8bdfdfbfac99493bcf67d67d04872`
(`data/edits.json` of translation main `dd6eade8`; the release-identity hashes
above belong to the 2026.10.08 snapshot `7772fb9d04387d06dea4bc1346a40c8e41dbb806c33979638f09fa8893e00aee`).

Text changes carried by this snapshot: dialogue lines keep the strict two-tile
(200px) right margin as the line-break rule, with the 99-line page-window
descriptions keeping their own 216px fit; the pocket layout (bank 10) is
column-aligned with authored breaks; sanctioned compound spellings (spell_ok
pocket names); "POKé BALLS" capitalisation; Mountain Road signposts keep the
English place name; the sign-card value row uses the double thin space exactly
as the English bytes; "X ontvangt N Ervaringspunten!"; a 14-row dialogue
sweep (banks 204, 378, 379, 684, 728) of tone and phrasing fixes; the
Pokéathlon advertisement and the seven-part Maximo radio-drama rows (banks
412-413) with authored line breaks; and a Trainer-call rewrite (728/684).

## Release identity (2026.11.08 data)

Saved translation snapshot SHA-256: `34d40b521f4244e5ae7d24690ba8d9d64bf8bdfdfbfac99493bcf67d67d04872`.

- HeartGold Dutch default: `8affe9e95e5a239b7f14d11b9c04b7df95cf2ad256612e4bdf46f58603a5608b`.
- SoulSilver Dutch default: `8410edeb27fcb248e409ec7db45e35a3680680b45534ab7b9bfaea11b67a8c33`.

The 32-configuration packaging run (`package.py`) for this snapshot completed
with VERDICT PASS: fourteen retail inputs, thirty-two output configurations,
base-patch targets equal to the two default outputs above. Verified on 8-9
November 2026: the complete allowlisted native check passed all thirty
non-default variants (full diff, Easy Chat, original gameplay, every unrelated
resource preserved); the footer-aware allocator reproduces both maximum-option
outputs; fourteen retail inputs decode identical native menu pixels;
independent patch engine, fast SHA-1 recognition with SHA-256 fallback,
software SHA-256 vectors and the naming fixtures all PASS. Full browser flows
were not re-run for this snapshot (no Playwright on the build machine); the
2026.10.08 browser suite above covers the unchanged production UI.

## Current release: 2026.11.10

Saved translation snapshot SHA-256:
`f1932f4c6242c0064d50b716b9b0d45ee558d353cb70de446aa1a2f3b1351532`
(translation commit `c126ef3c`, fixed for both complete builds).

- HeartGold Dutch default: `9b36e56e7b7ea35db7e299a3ff51081268401c656782ce7f72ba5ecfcc613338`.
- SoulSilver Dutch default: `30325ce9df9b9c3235db086fe81af82d5b31cae2d23171cb71e6845243385f8e`.

This snapshot supersedes the 2026.11.08 data above. Radio uses the native
224px scrolling printer with sentence-aware wrapping, authored pause/heading
anchors, real producer bounds and native 50-code line/1350-code script limits.
All 135 saved scripts use the shared editor/compiler formatter. Thirty-two
Kimono Ladies replies use informal je/jij/jou with matching verbs. All 31
Rocket Grunts store the safe plain name Lid; the native class/name join gives
Team Rocket-Lid, including every naming-option configuration. The ARM9 packer
retains exact retail size through checked BLZ prefix/footer extension when
footer padding alone cannot fit.

Both full builds pass native text/graphics/code checks and original trainer
records/parties verification. Packaging reconstructs all fourteen exact retail
inputs and all thirty-two naming configurations. Independent production-JS
patch/hash checks and native complete-diff/decode checks are required before
publication; native checks also execute the written Rocket join and measure
all radio scripts using actual option-specific producer tables. The production
UI is unchanged; browser/device flows are not newly claimed for this data release.

Current-release results: production JavaScript verification PASS for all14
retail inputs and32 configurations; native complete ROM diff/decode PASS for
all30 non-default variants, including the written Rocket join and135 radio
scripts per variant with actual option-specific buffer contents. Source-aware
naming fixtures and synthetic protocol/identity/corruption tests PASS. Full
translation static validation PASS. No emulator boot test was used.

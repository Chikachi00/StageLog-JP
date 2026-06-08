# Venue Thumbnail Accuracy Audit

This audit separates project-internal facts from real-world venue-structure assumptions. It is intended as a planning document for improving schematic venue thumbnails. It does not claim that generated thumbnails are official seat maps.

这份 audit 用于区分“项目内部事实”和“现实场馆结构推测”。它是缩略图校准计划，不是官方座位图资料库。生成缩略图应被视为 schematic / illustrative，不应声称为 official seat map。

## 1. Overview

This document audits the current StageLog JP built-in venue thumbnail system.

Goals:

- Inventory all built-in venues from `src/data/venues.ts`.
- Check existing files under `public/venue-thumbnails/`.
- Summarize the current thumbnail generator behavior in `scripts/generateVenueThumbnails.mjs`.
- Prepare a conservative plan for future per-venue schematic layouts.
- Avoid redrawing thumbnails during this audit.
- Avoid copying official images or official seat maps.
- Avoid claiming official-level accuracy.

Terminology:

- `thumbnail`: an illustrative schematic used as a compact visual cue in the app.
- `seat map`: a detailed seating / block / section layout intended for seat navigation.
- This audit is not an official venue structure database.

Current project-internal counts:

- Built-in venues in `src/data/venues.ts`: 38.
- Existing SVG thumbnails in `public/venue-thumbnails/`: 38.
- Venues currently matched by `src/data/venueThumbnailLayouts.ts`: 11.
- Venues still using generator fallback: 27.

Venue Thumbnail Layout V1 status:

- Priority 1 venues now have dedicated per-venue schematic layout configs.
- The generator reports 11 dedicated layouts and 27 fallback layouts.
- All Priority 1 layouts remain `schematic`; none are marked `verified`.
- Generated SVGs remain illustrative project-owned schematics, not official seat maps.
- Some Priority 1 SVG files may not show a text diff if their previous schematic output already matched the generated result, but they are still routed through the dedicated layout path.

Processed Priority 1 layouts:

| venueId | name | layoutShape | accuracy | notes |
|---|---|---|---|---|
| k-arena-yokohama | K-Arena Yokohama | arena-fan | schematic | Simplified fan-shaped arena schematic; needs manual reference before any verified status. |
| pia-arena-mm | Pia Arena MM | arena-rectangle | schematic | Simplified rectangular arena schematic; needs manual reference before any verified status. |
| yokohama-arena | Yokohama Arena | arena-rectangle | schematic | Simplified rectangular arena schematic with outer ring hint; needs manual reference before any verified status. |
| ariake-arena | Ariake Arena | arena-rectangle | schematic | Simplified rectangular arena schematic; needs manual reference before any verified status. |
| tokyo-dome | Tokyo Dome | dome-oval | schematic | Simplified oval dome schematic; needs manual reference before any verified status. |
| belluna-dome | Belluna Dome | dome-oval | schematic | Simplified oval dome schematic; needs manual reference before any verified status. |
| makuhari-messe | Makuhari Messe | exhibition-hall | schematic | Simplified exhibition hall schematic; exact hall/event setup needs manual reference. |
| zepp-haneda | Zepp Haneda TOKYO | livehouse | schematic | Simplified livehouse schematic with standing area; second-floor detail needs manual reference. |
| zepp-divercity-tokyo | Zepp DiverCity TOKYO | livehouse | schematic | Simplified livehouse schematic with standing area; second-floor detail needs manual reference. |
| zepp-shinjuku-tokyo | Zepp Shinjuku TOKYO | livehouse | schematic | Simplified livehouse schematic with standing area; second-floor detail needs manual reference. |
| kt-zepp-yokohama | KT Zepp Yokohama | livehouse | schematic | Simplified livehouse schematic with standing area; second-floor detail needs manual reference. |

Venue Thumbnail V2 refined schematic status:

- V2 is limited to 8 manually refined high-priority venues.
- V2 focuses on stronger outlines, clearer stage placement, more distinct tier/ring geometry, and less internal explanatory text.
- V2 thumbnails are still illustrative schematics. They are not official seat maps and are not marked `verified`.
- The remaining dedicated layouts and all fallback thumbnails are intentionally unchanged by V2.

Processed V2 refined set:

| venueId | name | V2 focus | accuracy |
|---|---|---|---|
| k-arena-yokohama | K-Arena Yokohama | Stronger fan-shaped bowl, end stage, nested tier arcs, inset floor. | schematic |
| tokyo-dome | Tokyo Dome | Wider oval dome, thicker ring structure, large central floor, end stage. | schematic |
| belluna-dome | Belluna Dome | Distinct oval dome proportions and alternate ring/floor balance from Tokyo Dome. | schematic |
| pia-arena-mm | Pia Arena MM | Clean modern rectangular arena with end stage, three-tier feel, and stable floor block. | schematic |
| yokohama-arena | Yokohama Arena | More compact bowl-like arena with rounded outer ring and central floor. | schematic |
| ariake-arena | Ariake Arena | Balanced rectangular arena with clearer left/right stands and central floor. | schematic |
| makuhari-messe | Makuhari Messe | Flat exhibition hall box, end stage, straight floor lanes, no arena bowl. | schematic |
| zepp-haneda | Zepp Haneda TOKYO | Compact livehouse, front stage, standing floor, and rear balcony hint. | schematic |

## 2. What This Audit Can and Cannot Verify

### A. Project-internal facts this audit can verify

This audit can verify facts that are present in the repository:

- The number of built-in venues.
- Each venue's `venueId`, `name`, `city`, and `category`.
- Whether a matching `${venueId}.svg` thumbnail exists under `public/venue-thumbnails/`.
- How the current generator reads venue data and writes thumbnail files.
- Which venues currently have a dedicated schematic layout config.
- Which venues appear to rely on category fallback generation.

### B. Real-world assumptions this audit cannot fully verify

This audit cannot fully verify real-world venue structure:

- The exact physical venue shape.
- Common stage position for different event types.
- Number of tiers / levels.
- Whether each Zepp venue has a second-floor balcony in the specific layout being represented.
- Which Makuhari Messe hall or event setup a given performance uses.
- Typical concert-mode layouts for Tokyo Dome / Belluna Dome.
- Detailed layouts for halls, theaters, arenas, and convention spaces.

These require manual reference checks. The `recommendedShape` values below are planning suggestions, not verified facts.

## 3. Current Generator Summary

Based on `scripts/generateVenueThumbnails.mjs`:

- Input venue data comes from `src/data/venues.ts`.
- Optional per-venue layout data comes from `src/data/venueThumbnailLayouts.ts`.
- Output files are written to `public/venue-thumbnails/`.
- Output format is SVG.
- Output filename rule is `${venue.id}.svg`.
- The generator first checks whether a venue id has a dedicated layout.
- If a dedicated layout exists, it uses `layout.shape` and related fields to render a shape-specific schematic.
- If no dedicated layout exists, it falls back to category templates such as `dome`, `arena`, `hall`, `livehouse`, `convention`, `stadium`, `theater`, or `other`.
- The script uses project-owned SVG templates; it does not fetch or copy external images.

Current limitations:

- Venue parsing is script-specific and based on the current TypeScript data file structure.
- Category fallback is intentionally generic.
- Dedicated layouts are schematic, not verified official layouts.
- The generator does not currently prove real-world venue accuracy.
- The generator does not embed source references per venue.
- The generator does not produce detailed seat maps.

## 4. Venue Thumbnail Inventory

Field meanings:

- `currentSource`: `dedicated-layout` means the venue id is present in `venueThumbnailLayouts`; `generated-fallback` means the existing thumbnail is generated from category fallback; `unknown` means the file/source could not be determined from the repository.
- `recommendedShape`: planning suggestion only, not a verified fact.
- `accuracyStatus`: `schematic` means the project has a per-venue schematic layout; `generic` means fallback is acceptable for now; `needs-schematic` means it is a good candidate for a future dedicated schematic; `needs-reference` means the project should avoid guessing until references are checked.
- `verified` is intentionally not used in this audit.

| venueId | name | city | category | thumbnailExists | currentSource | recommendedShape | accuracyStatus | confidence | sourceNeeded | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| tokyo-dome | Tokyo Dome | Tokyo | dome | yes | dedicated-layout | dome-oval | schematic | medium | manual check | Has project schematic layout; still illustrative, not verified official seat map. |
| belluna-dome | Belluna Dome | Tokorozawa | dome | yes | dedicated-layout | dome-oval | schematic | medium | manual check | Has project schematic layout; still illustrative, not verified official seat map. |
| k-arena-yokohama | K-Arena Yokohama | Yokohama | arena | yes | dedicated-layout | arena-fan | schematic | medium | manual check | Has project schematic layout; still illustrative, not verified official seat map. |
| pia-arena-mm | Pia Arena MM | Yokohama | arena | yes | dedicated-layout | arena-rectangle | schematic | medium | manual check | Has project schematic layout; still illustrative, not verified official seat map. |
| yokohama-arena | Yokohama Arena | Yokohama | arena | yes | dedicated-layout | arena-rectangle | schematic | medium | manual check | Has project schematic layout; still illustrative, not verified official seat map. |
| zepp-haneda | Zepp Haneda TOKYO | Ota | livehouse | yes | dedicated-layout | livehouse | schematic | medium | manual check | Has project schematic layout; still illustrative, not verified official seat map. |
| numazu-civic-cultural-center | Numazu Civic Cultural Center | Numazu | hall | yes | generated-fallback | hall | generic | medium | none | Hall/theater category supports generic seated schematic unless higher accuracy is needed. |
| keio-arena-tokyo | Keio Arena TOKYO | Chofu | arena | yes | generated-fallback | unknown | needs-reference | low | manual check | Arena/stadium structure is not confirmed from project data; avoid guessing detailed layout. |
| ariake-arena | Ariake Arena | Koto | arena | yes | dedicated-layout | arena-rectangle | schematic | medium | manual check | Has project schematic layout; still illustrative, not verified official seat map. |
| tokyo-garden-theater | Tokyo Garden Theater | Koto | theater | yes | generated-fallback | theater | generic | medium | none | Hall/theater category supports generic seated schematic unless higher accuracy is needed. |
| makuhari-messe | Makuhari Messe | Chiba | convention | yes | dedicated-layout | exhibition-hall | schematic | medium | manual check | Has project schematic layout; still illustrative, not verified official seat map. |
| lala-arena-tokyo-bay | LaLa arena TOKYO-BAY | Funabashi | arena | yes | generated-fallback | unknown | needs-reference | low | manual check | Arena/stadium structure is not confirmed from project data; avoid guessing detailed layout. |
| saitama-super-arena | Saitama Super Arena | Saitama | arena | yes | generated-fallback | arena-rectangle | needs-schematic | medium | venue floor guide | Built-in map exists; thumbnail shape should be manually checked against project map and venue references. |
| yoyogi-national-gymnasium | Yoyogi National Gymnasium | Shibuya | arena | yes | generated-fallback | unknown | needs-schematic | low | official site | High-impact arena, but exact schematic direction needs reference before drawing. |
| tokyo-big-sight | Tokyo Big Sight | Koto | convention | yes | generated-fallback | convention | needs-schematic | medium | official site | Convention/exhibition venue may vary by hall/event setup; needs reference before detailed schematic. |
| tokyo-international-forum | Tokyo International Forum | Chiyoda | hall | yes | generated-fallback | hall | generic | medium | none | Hall/theater category supports generic seated schematic unless higher accuracy is needed. |
| nippon-budokan | Nippon Budokan | Chiyoda | arena | yes | generated-fallback | unknown | needs-schematic | low | official site | High-impact arena, but exact schematic direction needs reference before drawing. |
| zepp-divercity-tokyo | Zepp DiverCity TOKYO | Koto | livehouse | yes | dedicated-layout | livehouse | schematic | medium | manual check | Has project schematic layout; still illustrative, not verified official seat map. |
| zepp-shinjuku-tokyo | Zepp Shinjuku TOKYO | Shinjuku | livehouse | yes | dedicated-layout | livehouse | schematic | medium | manual check | Has project schematic layout; still illustrative, not verified official seat map. |
| toyosu-pit | Toyosu PIT | Koto | livehouse | yes | generated-fallback | livehouse | generic | medium | none | Livehouse category suggests compact stage/standing layout; balcony details need manual check if upgraded. |
| line-cube-shibuya | LINE CUBE SHIBUYA | Shibuya | hall | yes | generated-fallback | hall | generic | medium | none | Hall/theater category supports generic seated schematic unless higher accuracy is needed. |
| ex-theater-roppongi | EX Theater Roppongi | Minato | theater | yes | generated-fallback | theater | generic | medium | none | Hall/theater category supports generic seated schematic unless higher accuracy is needed. |
| tachikawa-stage-garden | Tachikawa Stage Garden | Tachikawa | hall | yes | generated-fallback | hall | generic | medium | none | Hall/theater category supports generic seated schematic unless higher accuracy is needed. |
| pacifico-yokohama-national-convention-hall | PACIFICO Yokohama National Convention Hall | Yokohama | hall | yes | generated-fallback | hall | generic | medium | none | Hall/theater category supports generic seated schematic unless higher accuracy is needed. |
| kt-zepp-yokohama | KT Zepp Yokohama | Yokohama | livehouse | yes | dedicated-layout | livehouse | schematic | medium | manual check | Has project schematic layout; still illustrative, not verified official seat map. |
| yokohama-buntai | Yokohama BUNTAI | Yokohama | arena | yes | generated-fallback | unknown | needs-reference | low | manual check | Arena/stadium structure is not confirmed from project data; avoid guessing detailed layout. |
| culttz-kawasaki | Culttz Kawasaki | Kawasaki | hall | yes | generated-fallback | hall | generic | medium | none | Hall/theater category supports generic seated schematic unless higher accuracy is needed. |
| chiba-port-arena | Chiba Port Arena | Chiba | arena | yes | generated-fallback | unknown | needs-reference | low | manual check | Arena/stadium structure is not confirmed from project data; avoid guessing detailed layout. |
| zozo-marine-stadium | ZOZO Marine Stadium | Chiba | stadium | yes | generated-fallback | stadium | needs-reference | low | manual check | Stadium concert layout is not confirmed from project data; avoid guessing detailed layout. |
| kyocera-dome-osaka | Kyocera Dome Osaka | Osaka | dome | yes | generated-fallback | dome-oval | needs-schematic | medium | official site | Dome category suggests oval schematic, but concert staging pattern needs reference. |
| osaka-jo-hall | Osaka-jo Hall | Osaka | arena | yes | generated-fallback | unknown | needs-schematic | low | official site | High-impact arena, but exact schematic direction needs reference before drawing. |
| kobe-world-memorial-hall | Kobe World Memorial Hall | Kobe | arena | yes | generated-fallback | unknown | needs-reference | low | manual check | Arena/stadium structure is not confirmed from project data; avoid guessing detailed layout. |
| nippon-gaishi-hall | Nippon Gaishi Hall | Nagoya | arena | yes | generated-fallback | unknown | needs-reference | low | manual check | Arena/stadium structure is not confirmed from project data; avoid guessing detailed layout. |
| port-messe-nagoya | Port Messe Nagoya | Nagoya | convention | yes | generated-fallback | convention | needs-schematic | medium | official site | Convention/exhibition venue may vary by hall/event setup; needs reference before detailed schematic. |
| aichi-sky-expo | Aichi Sky Expo | Tokoname | convention | yes | generated-fallback | convention | needs-schematic | medium | official site | Convention/exhibition venue may vary by hall/event setup; needs reference before detailed schematic. |
| marine-messe-fukuoka | Marine Messe Fukuoka | Fukuoka | arena | yes | generated-fallback | unknown | needs-schematic | low | official site | High-impact arena, but exact schematic direction needs reference before drawing. |
| fukuoka-paypay-dome | Fukuoka PayPay Dome | Fukuoka | dome | yes | generated-fallback | dome-oval | needs-schematic | medium | official site | Dome category suggests oval schematic, but concert staging pattern needs reference. |
| makomanai-sekisui-heim-ice-arena | Makomanai Sekisui Heim Ice Arena | Sapporo | arena | yes | generated-fallback | unknown | needs-reference | low | manual check | Arena/stadium structure is not confirmed from project data; avoid guessing detailed layout. |

Inventory summary:

- `schematic`: 11.
- `generic`: 9.
- `needs-schematic`: 10.
- `needs-reference`: 8.
- `verified`: 0.

## 5. Priority List

### Priority 1: High-impact venues

These are high-impact or visually distinctive venues. Some already have schematic layouts, but still need manual reference review before any `verified` status.

- `k-arena-yokohama` - K-Arena Yokohama.
- `pia-arena-mm` - Pia Arena MM.
- `yokohama-arena` - Yokohama Arena.
- `ariake-arena` - Ariake Arena.
- `tokyo-dome` - Tokyo Dome.
- `belluna-dome` - Belluna Dome.
- `makuhari-messe` - Makuhari Messe.
- `zepp-haneda` - Zepp Haneda TOKYO.
- `zepp-divercity-tokyo` - Zepp DiverCity TOKYO.
- `zepp-shinjuku-tokyo` - Zepp Shinjuku TOKYO.
- `kt-zepp-yokohama` - KT Zepp Yokohama.

### Priority 2: Common arenas / halls

These are common or larger venues that may benefit from future schematic layouts, but should be checked against references before drawing.

- `saitama-super-arena` - Saitama Super Arena.
- `yoyogi-national-gymnasium` - Yoyogi National Gymnasium.
- `nippon-budokan` - Nippon Budokan.
- `tokyo-big-sight` - Tokyo Big Sight.
- `kyocera-dome-osaka` - Kyocera Dome Osaka.
- `osaka-jo-hall` - Osaka-jo Hall.
- `marine-messe-fukuoka` - Marine Messe Fukuoka.
- `fukuoka-paypay-dome` - Fukuoka PayPay Dome.
- `port-messe-nagoya` - Port Messe Nagoya.
- `aichi-sky-expo` - Aichi Sky Expo.

### Priority 3: Generic fallback acceptable for now

These can remain fallback thumbnails until there is a specific user need or reference material.

- Smaller halls and theaters already represented by generic hall/theater templates.
- Arena/stadium venues with `needs-reference` status should not be redrawn by guessing.
- Low-priority livehouse venues can keep generic livehouse thumbnails unless a specific floor structure matters.

## 6. Recommended Redrawing Strategy

Recommended process:

1. Do not redraw every venue by guessing.
2. Maintain layout status for every built-in venue.
3. Prioritize Priority 1 venues for manual review.
4. Give each future layout an `accuracy` field:
   - `generic`
   - `schematic`
   - `verified`
5. Treat `schematic` as project-owned simplified illustration, not an official image.
6. Use `verified` only after manual comparison against official pages, venue floor guides, user-owned observations, or other acceptable references.
7. Keep fallback generation for venues without dedicated layout.
8. Make the generator report fallback venue count so silent downgrade is easier to detect.

## 7. Suggested Layout Model

The current `venueThumbnailLayouts` model already covers the core of this idea. Future refinements could add `referenceStatus`.

Suggested fields:

- `venueId`
- `accuracy`
- `shape`
- `stagePosition`
- `tiers`
- `hasArenaFloor`
- `hasSecondFloor`
- `hasOuterRing`
- `notes`
- `referenceStatus`

Suggested `referenceStatus` values:

- `none`
- `needs-reference`
- `checked-official`
- `checked-photos`
- `checked-user`

This is a future suggestion only. This audit does not modify the code model.

## 8. Copyright and Source Policy

Policy for future work:

- Do not copy official seat maps into the repository.
- Do not download official venue images into `public/`.
- Do not hotlink official images as `img src`.
- Do not trace official diagrams directly.
- It is acceptable to review official webpages, venue floor guides, public venue photos, or user-owned observations, then redraw a simplified project-owned schematic.
- Generated images should be labeled or documented as `schematic` / `illustrative`.
- If more accurate references are needed, prefer saving source links in documentation or notes rather than copying image files.

## 9. Next Steps

Step 1: Manually review Priority 1 venues.

Step 2: For each reviewed venue, decide:

- recommended shape
- stage position
- tiers
- notes
- accuracy level

Step 3: Implement or refine per-venue layout config.

Step 4: Update `scripts/generateVenueThumbnails.mjs` to prefer per-venue layout and fallback otherwise.

Step 5: Regenerate thumbnails and visually inspect them.

Step 6: Only mark `verified` after manual confirmation.

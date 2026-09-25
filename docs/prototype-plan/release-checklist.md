# Hour 6 release checklist

For every check, write Pass, Fail, or Not tested. Add a short note with the real environment. Never leave a failed gate hidden.

## Clean local start
- [ ] Fresh setup instructions work from the project README.
- [ ] API and client start without a secret or paid external service.
- [ ] Database reset restores the labelled fixture.
- [ ] Existing MIT license is unchanged.

## Data and privacy
- [ ] Every fixture is visibly labelled DEMO DATA in UI and CSV.
- [ ] No raw/unblurred image or video upload route exists.
- [ ] If blur QA is not testable, media upload stays disabled.
- [ ] Permission status is not “authorised” unless recorded proof exists.
- [ ] Reviewer decisions retain confirm, reject, or uncertain state.
- [ ] Only confirmed findings can affect screening.
- [ ] Missing evidence is “Not assessed”, not a pass.

## Route and repair outputs
- [ ] Walking-stick and wheelchair profiles are selectable.
- [ ] Marathi/Hindi text is visible; touch, captions, and replay are available where implemented.
- [ ] Route still has a text fallback with speech unavailable.
- [ ] No safety guarantee, fabricated distance, or fictitious real street is shown.
- [ ] Queue exports retain demo/source/rule/uncertainty caveats.
- [ ] Costs remain blank where no source-backed quantity and rate exist.
- [ ] Repeat without intervention is not labelled a verified repair.

## Presentation integrity
- [ ] The team uses the approved demo script.
- [ ] Every displayed count, quote, cost, or result has a source or is removed.
- [ ] Primary metric states the actual participant denominator.
- [ ] Unrun tests are marked Not tested.
- [ ] Known limitations and missing features are spoken clearly.

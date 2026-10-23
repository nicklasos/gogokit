# Mutation testing

Coverage shows which lines ran; mutation testing shows whether a test would notice if they were wrong.
[Stryker](https://stryker-mutator.io) changes the code one small step at a time (`<` to `<=`, `&&` to `||`,
`'text'` to `""`, a block emptied) and reruns the unit tests:

- **Killed**: a test failed, so the change was caught. Good.
- **Survived**: every test still passed. A behaviour is not asserted; add or tighten a test.
- **Timeout**: the change made the tests hang (usually an endless loop). Counts as caught.

```bash
make test-mutation        # or npm run test:mutation
open reports/mutation/mutation.html
```

The HTML report shows each file with the surviving mutants inline: the original line, the change, and
its position. Fix one survivor at a time by writing the assertion that would have failed, then run again.
Some survivors are equivalent (the change cannot alter behaviour, such as a default that is always
overwritten); leave those. `reports/mutation/mutation.json` has the same data for scripts.

## What is mutated

`stryker.config.json` lists the modules that have unit tests: policies, role and route matching, the URL,
format and server-error helpers, the markdown helpers. Components, hooks and API calls are covered by
Playwright, which is far too slow to run once per mutant. When you add a unit test for a module,
add the module to `mutate`.

## How it runs

The unit tests use plain `node:test`, which has no Stryker plugin, so Stryker uses its command runner:
for every mutant it runs `npm run test:unit` (about two seconds). It cannot tell which test covers which
line, so a file without tests shows every mutant as survived; that is why `mutate` lists files rather than
folders.

Stryker reads the code and copies the project to `.stryker-tmp/` in the first seconds, then works on that
copy: you can keep editing while it runs. Results are cached in `reports/stryker-incremental.json`, so the
next run only retests mutants in code or tests that changed. After removing a file from `mutate`, delete
`reports/stryker-incremental.json`: the cache keeps reporting files that are no longer listed.

The run reports and does not fail. Set `thresholds.break` in `stryker.config.json` (for example `70`) to
make it fail below that score.

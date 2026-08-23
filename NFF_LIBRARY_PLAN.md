# NFF Core Library Plan

## Current boundary

The deterministic NFF engine currently lives under `client/src/core`. It has no dependency on React components and exposes the header, model, parser, and generators through `client/src/core/index.ts`.

## Planned package boundary

A future package named `@nabd/nff-core` may move the following modules into a standalone distribution:

- `header.ts`: fixed v1.0 header creation and mechanical inspection.
- `model.ts`: document, tag, and node types.
- `parser.ts`: UTF-8 decoding, frontmatter, tags, and content-node parsing.
- `generators.ts`: HM/AIM generation and source hashing.

The package must remain browser- and Node-compatible, expose no UI code, require no network service, and keep the existing public functions stable during migration.

## Migration sequence

1. Add package-level tests that run against the current source and future package build.
2. Move the core modules without changing byte constants or parser semantics.
3. Replace the application's relative import with the package import.
4. Compare generated headers and Arabic round-trips before and after migration.
5. Publish only after the byte-for-byte and browser acceptance gates pass.

This is a deferred architecture improvement, not a prerequisite for the current single-application delivery.

# Agent Reliability and Release Evidence Policy

This policy governs automated and human-assisted changes in this repository. It is intentionally evidence-first: repository state, CI output, runtime observations, and provider responses are authoritative; assumptions and summaries are not.

## Required status vocabulary

Every requirement in a release report must use exactly one status:

- `VERIFIED` — the required behavior passed the test appropriate to that behavior, with a recorded evidence reference.
- `IMPLEMENTED` — code or configuration changed, but appropriate verification is still incomplete.
- `PENDING` — an operation is still running or awaiting provider confirmation.
- `FAILED` — a required verification failed.
- `BLOCKED` — a specific external dependency prevents the required operation; record the observed response and exhausted recovery path.
- `NOT APPLICABLE` — the requirement is demonstrably outside this project's scope.

Do not infer a status from the amount of work performed.

## Evidence contract

For every material defect or release requirement, record:

1. Repository, branch, and commit SHA.
2. Requirement or defect identifier.
3. Reproduction steps or exact observation.
4. Root-cause hypothesis and supporting evidence.
5. Changed files or Cloudflare resource configuration.
6. Test command or external verification method.
7. Actual result, including failures and provider request/deployment identifiers.
8. Remaining limitation and final status.

A build passing does not prove that the deployed application works. A deployment API returning an identifier does not prove that the deployment completed. A homepage response does not prove that authentication, payments, authorization, or data isolation work.

## Engineering controls

- Preserve existing application behavior and data. Prefer narrow changes over rewrites.
- Reproduce a failure before changing code where practical; preserve the original failing output.
- Never delete tests, disable security checks, weaken assertions, suppress errors, or replace real integrations with mocks merely to obtain a green check.
- Do not fabricate credentials, test data, metrics, reviews, certifications, customers, or integration state.
- Never place secrets in source control, frontend bundles, build logs, issue comments, or artifacts. Reference secret names only.
- Validate authorization for both allowed and denied paths, including ownership/tenant boundaries and side effects.
- Stripe must remain in test mode unless a separate explicit authorization approves live mode.
- Treat AI-generated content and third-party responses as untrusted input; validate schemas and enforce server-side authorization.
- Do not claim control of a user's GPU, RAM, CPU, or remote hardware without direct telemetry from that machine.

## Release gates

A production release requires all of the following:

1. CI completed successfully for the exact commit being released.
2. Build, lint, and TypeScript checks passed.
3. Relevant unit/integration/regression tests passed; absent test coverage is recorded, not silently counted as a pass.
4. Deployment reached a terminal successful state.
5. The actual deployment URL was tested for the critical user journeys relevant to this release.
6. Security-sensitive behavior has negative tests (unauthorized, wrong owner, malformed input, invalid signature, duplicate event, and failure handling where relevant).
7. No unresolved P0 or P1 defect remains.
8. Rollback target and release commit are identifiable.

If any gate is not observable, report the release as incomplete or blocked rather than production-ready.

## Failure handling

- Preserve exact failing logs and classify their source: source defect, dependency/lockfile mismatch, build configuration, permission, provider queue, or runtime failure.
- Apply one root-cause correction at a time, then rerun the narrowest affected test and the full required gate.
- Do not retry an unchanged operation repeatedly. A retry requires a corrected cause or new evidence.
- Keep failed checks visible. Do not mark a defect closed until the affected behavior passes its regression test.

## Independent review

Code review findings must identify the provider, review ID or PR, commit SHA, severity, file, and proposed correction. Never label a manual review as CodeRabbit or another automated reviewer. Reviewer output is advisory; security and correctness gates remain mandatory.

## Progress and completion reporting

Progress reports describe observed outcomes, not effort, elapsed time, estimated completion, or tool-call count. Use immutable repository/commit/deployment references wherever possible. Stop only when required release gates are verified or the exact external blocker and remaining independent work are documented.

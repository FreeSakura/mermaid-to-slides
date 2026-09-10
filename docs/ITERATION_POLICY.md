# Evidence-driven iterations

Each meaningful iteration must leave a public trail in this repository:

1. Read current repository issues, release failures, CI and deployment status. Check related primary sources when needed. Separate user requests, competitor features and maintainer hypotheses.
2. Write a dated research/decision note in `docs/research/` and create a focused issue with acceptance criteria. Do not contact or promote the project in other people's repositories without explicit authorization.
3. Implement on a `codex/` branch. Preserve editable native output, local processing, and existing supported input. Avoid unrelated changes.
4. Test the behavior being changed and run `npm run check`. For OOXML/geometry changes, open representative files in PowerPoint and inspect renders. Never claim a check that was not run.
5. Update `CHANGELOG.md`, relevant documentation and version. Open a PR linking the issue, including actual validation and limitations. Merge only when required checks pass and conflicts are resolved.
6. Verify the deployed build and create a GitHub release. Close the issue with links to the PR/release. Record remaining known limitations rather than silently narrowing the acceptance criteria.

Do not force daily feature releases or empty commits. If no justified change is available, retain the research finding in a substantive GitHub issue or research note when it adds information; otherwise stay quiet. Never invent feedback, star-growth claims or test results. Do not buy stars, spam discussions, introduce paid services, or upload private user diagrams.

Only one iteration should modify this checkout at a time. Reconcile existing branches, PRs and pending runs before starting a new one. Recurring checks should continue unfinished work rather than creating duplicate issues or releases.

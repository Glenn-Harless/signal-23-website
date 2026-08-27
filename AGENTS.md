# AGENTS.md

## Living Documentation Rules

These rules define how agents must behave when reading, generating, or modifying code in this repository.

### 1. Markdown Is the Source of Product Truth

- All requirements, architectural reasoning, and behavioral expectations must live in Markdown files inside the repository.
- Code and documentation evolve atomically with each commit.
- Markdown must describe the current state of the system.
- Temporary plans, task lists, backlogs, and implementation handoffs do not belong in product documentation.
- Create a new `feature-dev-{X}` folder only for a new conceptual feature, subsystem, or capability. Changes to an existing feature belong in its existing folder.

### 2. Requirements Must Stay Current

When code behavior changes, update the feature's `requirements.md` immediately. Include:

- high-level summary
- inputs and outputs
- constraints
- edge cases
- user flows
- implementation-agnostic behavior

Remove or replace deprecated behavior so requirements never describe a superseded state.

### 3. Decisions Must Be Logged

Update `decisions.md` for any architectural tradeoff, design change, or intentionally selected approach.

- Keep the log append-only.
- Include a timestamp and agent name.
- Explain why the approach was selected, not merely what files changed.

### 4. Tests Must Describe Behavior

Update `tests.md` whenever behavior, constraints, or flows evolve. Define:

- acceptance criteria
- unit test expectations
- integration paths
- relevant edge cases

Tests describe observable behavior, not implementation details or future work queues.

## Directory Convention

Feature-level documentation lives under:

```text
feature-dev-docs/
    feature-dev-{X}/
        requirements.md
        decisions.md
        tests.md
        feature-spec.md
```

- `feature-dev-{X}` is a unique namespace for a feature, subsystem, or capability.
- `feature-spec.md` is optional and may contain owner-authored product direction that complements the living requirements.
- Subfolders may be added for deep features when they follow existing repository patterns.

## Agent Behavior Model

### Read Before Acting

Before generating or modifying code:

- Read the closest `requirements.md`, `decisions.md`, and `tests.md` in full.
- Consider parent directories and cascading context.
- Treat these files as authoritative descriptions of current behavior.

### Update After Acting

After a meaningful code change:

- Update `requirements.md` when behavior changed.
- Append to `decisions.md` when architecture or an intentional design choice changed.
- Update `tests.md` so expected coverage matches the resulting behavior.
- Commit documentation with the corresponding code change.

### Keep Documentation Focused

- Do not leave outdated expectations, flows, or assumptions.
- Do not copy source trees or generated code dumps into Markdown.
- Do not use product documentation as a task tracker.
- Keep documentation concise enough to read in full.

## Hierarchy and Context

- Structure Markdown in a hierarchy that mirrors the feature tree.
- Resolve documentation context from closest to broadest: feature, parent directory, then repository-wide guidance.
- When documents disagree, update the stale document rather than preserving contradictory descriptions.

## Philosophy

- Code and documentation are inseparable.
- Requirements are living descriptions of the product.
- Architectural decisions retain their historical rationale through append-only logs.
- Tests state observable promises.
- The repository should contain current product truth, not stale planning artifacts.

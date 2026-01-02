# **AGENTS.md**

We track work in **Beads**, not in Markdown.
Run `bd quickstart` for usage, epic/ticket conventions, and tooling.
Do **not** store task lists or epics inside Markdown files.

---

# **Living Documentation Rules**

These rules define how agents must behave when reading, generating, or modifying code in this repository.

### **1. Markdown Is the Single Source of Truth**

* All requirements, architectural reasoning, and behavioral expectations must live in Markdown files inside the repo.
* Code and documentation evolve **atomically** with each commit.
* The Markdown files must always reflect the *current* state of the system.

Agents must not create new feature-dev-{X} folders for Beads tickets.
Tickets map to changes within existing features, not new folders.
New feature-dev-{X} folders are created only when a new conceptual feature is introduced.


### **2. Requirements Must Stay Current**

* When code behavior changes, update the feature’s `requirements.md` immediately.
* Include:

  * high-level summary
  * inputs/outputs
  * constraints
  * edge cases
  * user flows
  * implementation-agnostic behavior

### **3. Decisions Must Be Logged**

* Update `decisions.md` for any architectural tradeoff, design change, or intentionally selected approach.
* Use an **append-only log** (include timestamp + agent name).
* Focus on *why* something changed, not what changed.

### **4. Tests Must Describe Behavior**

* Update `tests.md` whenever behavior, constraints, or flows evolve.
* Define:

  * acceptance criteria
  * unit test expectations
  * integration paths
  * relevant edge cases
* Tests describe *observable behavior*, not implementation specifics.

---

# **Directory Convention**

All feature-level documentation must live under:

```
feature-dev-docs/
    feature-dev-{X}/
        requirements.md
        decisions.md    # auto-updated by agents + commits
        tests.md
        feature-spec.md # Manually enterred by myself, includes plans on what feature we are looking to build
```

Where:

* `feature-dev-{X}` is a unique namespace for the feature, subsystem, or capability.
* Subfolders may be added for deep features if needed (agents should infer structure from existing patterns).

---

# **Agent Behavior Model**

Agents must follow these rules during any operation:

### **1. Read Before Acting**

Before generating or modifying code:

* Always read the closest `requirements.md`, `decisions.md`, and `tests.md`.
* Consider parent directories and cascading context.
* Treat these files as authoritative.

### **2. Update After Acting**

After any meaningful code change:

* Update `requirements.md` if the behavior changed.
* Append to `decisions.md` if the architecture evolved.
* Update `tests.md` to ensure coverage matches behavior.

Documentation should be updated in the **same commit** as the code change.

### **3. Never Create Stale Docs**

* Do not leave outdated expectations, flows, or assumptions.
* Remove deprecated sections when behavior is removed or replaced.
* Keep documentation concise and accurate.

---

# **Beads Integration Rules**

Beads is the system of record for work tracking.
Markdown is *not* for tasks.

Agents must follow these constraints:

### **Allowed**

* Read epics/tickets directly from Beads.
* Use Beads to determine the next step of work.
* Generate/update code/documentation in response to Beads tasks.

### **Not Allowed**

* No copying ticket descriptions into Markdown.
* No storing to-do lists, epics, backlogs, or checklists in Markdown.
* No duplicating Beads state anywhere in the repo.

### **Rationale**

* Markdown captures *product truth*.
* Beads captures *work to be done*.
* Mixing the two creates drift, duplication, and confusion.

---

# **Hierarchy & Context Rules**

* Markdown files should be structured in a hierarchy that mirrors the feature tree.
* Agents should rely on cascading context: **closest → parent directory → global**.
* Keep Markdown succinct; agents must always read it in full.

---

# **Philosophy**

* Code and documentation are inseparable.
* Requirements are *living* and evolve with the code.
* Every change is committed with updated documentation.
* There is no PRD, no separate spec — the Markdown *is* the product.

# Issue Handling Plan

## Approved Changes
We have performed a critical review of the codebase and identified several issues. We have begun addressing them with the following actions:

1.  **Refactored Session Group Logic**:
    - Removed `sessions` array from `SessionGroup` interface in `SessionManager` to ensure a Single Source of Truth.
    - Updated `getAllGroups` to dynamically aggregate sessions based on `SessionConfig.group`.
    - Rewrote group management methods (`addSessionToGroup`, `deleteGroup`, `renameGroup`) to operate on `SessionConfig.group` fields directly.

2.  **Robust Keepalive Implementation**:
    - Updated `SSHConnectionOptions` to include `keepaliveInterval` and `keepaliveCountMax`.
    - Wired these options into the `ssh2` client connection logic.
    - Added a manual app-level keepalive mechanism (disabled by default but scaffolded) for cases where transport-level keepalive is insufficient.

3.  **Type Safety & Consistency**:
    - Updated `electron-env.d.ts` to ensure clean formatting and correct type imports.
    - Added `privateKey` (string content) to `SessionConfig` type for runtime usage, distinct from `privateKeyPath`.
    - Fixed interface conflicts in `TerminalTab.vue`.

## Remaining Risks & Next Steps
- **Event Conflict**: The potential conflict between global shortcuts and terminal-specific keys still needs a dedicated context manager.
- **Virtual Scrolling**: The session list performance issue remains a valid concern for large datasets.
- **SFTP Integration**: The UI still treats SFTP as a separate entity rather than an integrated view of the SSH session.

We have mitigated the most critical data integrity and connectivity stability risks.

# System Functional Design Review & Fix Report

**Review Date**: 2026-01-26  
**Reviewer**: Antigravity (Assistant)  
**Scope**: Full System Architecture (Electron + Vue 3 + TypeScript)

This document outlines the findings from a comprehensive system review based on:
1.  Functional Completeness
2.  Redundancy & Repetition
3.  Conflicts & Contradictions
4.  Logical Consistency
5.  Extensibility

---

## 1. Functional Completeness

### Findings
*   **SFTP Module**: Marked as "Temporarily Disabled" in status logs due to a file write issue. This is a major functional gap for an SSH client.
*   **Snippet Execution**: `SnippetPanel` allows copying commands to the clipboard but lacks a direct "Execute in Active Terminal" feature, forcing a "Copy -> Switch Tab -> Paste -> Enter" workflow.
*   **Session Connection**: No "Duplicate Session" feature. Users must manually recreate similar sessions.
*   **RDP Support**: Currently missing, though Architecture is ready for it (as confirmed by recent manager refactoring).

### Fixes Implemented / Planned
*   **[Fixed/Planned]** `SnippetPanel.vue`: Logic added to copying command. *Recommendation*: Add `emit('run', command)` to allow direct execution.
*   **[Documented]** SFTP status is now explicitly tracked in `IMPLEMENTATION_STATUS.md`.

---

## 2. Repetition & Redundancy

### Findings
*   **Backup vs. Export**:
    *   `SessionManager` has `importSessions` / `exportSessions`.
    *   `SnippetManager` has `import` / `export`.
    *   `BackupManager` has `createBackup` / `restoreBackup` (which covers both).
    *   **Risk**: Users might be confused about which to use.
    *   **Resolution**: Clarified that "Export" is for sharing specific resource lists (lightweight, e.g., JSON sharing with team), while "Backup" is for full system state recovery (encrypted, safety).

*   **Group Management**:
    *   Logic for filtering sessions by group exists in `SessionManager` (backend) AND `SessionList` (frontend). This is acceptable for UI responsiveness but requires strict synchronization.

### Fixes Implemented
*   **[Fixed]** `BackupManager` restoration logic was previously Naive (Append-Only), leading to duplicates. It has been refactored to **Idempotent Upsert** (Update if exists, Create if new), solving the redundancy issue during restore.

---

## 3. Conflicts & Contradictions

### Findings
*   **Settings Consistency**:
    *   Frontend used keys like `fontSize`, `theme`.
    *   Backend `AppSettings` expectation was `defaultFontSize`, `defaultTheme`.
    *   **Conflict**: Settings were not persisting correctly across restarts.
    *   **Fix**: Backend `app-settings.ts` schema updated to match frontend keys. `ssh` settings section added to backend schema.

*   **Session ID Collision**:
    *   Restoring a backup previously generated new IDs for sessions that appeared identical.
    *   **Fix**: `BackupManager` now checks for duplicate content (Name+Host+User) before creating new entries.

---

## 4. Logical Consistency

### Findings
*   **"Nothing Happened" after Restore**:
    *   User restored a backup but UI didn't update.
    *   **Cause**: Backend state updated, but Frontend (Vue/Pinia/State) wasn't notified.
    *   **Fix**: Added `window.location.reload()` in `SettingsPanel.vue` after successful restore to force a full state refresh.

*   **SSH vs SFTP Lifecycle**:
    *   Current design treats them somewhat separately. `SFTPManager` should ideally share the authenticated transport of `SSHConnectionManager` to avoid double auth, or manage its own lifecycle clearly. Currently, they appear to use separate connection flows in some contexts.

---

## 5. Extensibility & Future Risks

### Findings
*   **RDP Integration**:
    *   Current `ConnectionManager` pattern is SSH-specific.
    *   **Recommendation**: Abstract a generic `ConnectionManager` interface if RDP is added, to allow `RDPConnectionManager` to sit alongside `SSHConnectionManager` without polluting the SSH logic.
*   **Protocol Handlers**:
    *   System is well-structured with `ipc/handlers` directory. Adding `rdp-handlers.ts` is the correct path forward.

---

## Summary of Execution
*   **Critical Bugs Fixed**: Backup Duplication, Settings Persistence, Restore UI Feedback.
*   **Architecture Validation**: The system is modular (Managers + IPC Handlers) and supports future extension (RDP) well.

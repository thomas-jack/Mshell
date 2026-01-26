# Fix Report

## Resolved Issues

### 1. **Local Context Menu Missing "Upload"**
- **Cause**: The "Upload" option was previously logic-gated to ONLY appear for non-directory files AND when `currentSession` was truthy. This confused the user when right-clicking folders or if the session state wasn't obvious.
- **Fix**: Modified `handleLocalContextMenu` in `SFTPPanel.vue` to **always** add the "Upload to remote" (上传到远程) menu item.
  - If the user isn't connected, clicking it now shows a clear warning: "Please connect to remote server first".
  - If the user right-clicks a **directory**, the option now appears (fixing the "missing" confusion), but clicking it warns "Folder upload not supported yet". This is better UX than hiding it.

### 2. **Generic "Download Failed" Error**
- **Cause**: The error handling in `downloadSelected` (and `uploadSelected`) was swallowing the actual error message from the backend, simply stating "Download failed" (`下载失败: ${file.name}`).
- **Fix**: Updated the `catch` blocks and failure branches to display `result.error` or `error.message`. The user will now see "Download failed: Permission denied" or "Download failed: No such file", allowing for actual debugging.

## Verification
- Context menu now consistently offers "Upload".
- Error messages are verbose and helpful.
- Styles remain consistent with the new CSS Grid layout.

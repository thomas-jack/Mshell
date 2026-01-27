# MShell - Windows SSH Client

MShell is a modern, feature-rich SSH client for Windows built with Electron, Vue 3, and TypeScript.

## Features

### Core SSH Functionality
- ✅ SSH connection management with password and private key authentication
- ✅ Support for RSA, ED25519, and ECDSA key types
- ✅ Connection keepalive and heartbeat mechanism
- ✅ Multiple concurrent connections
- ✅ Connection status monitoring and error handling

### Terminal
- ✅ Full-featured terminal using xterm.js
- ✅ WebGL rendering with automatic fallback to Canvas/DOM
- ✅ 8 built-in themes (Dark, Light, Solarized, Monokai, Dracula, Nord, OneDark)
- ✅ Customizable font, size, cursor style
- ✅ Copy/paste support with keyboard shortcuts (Ctrl+Shift+C/V)
- ✅ Right-click context menu for copy/paste
- ✅ Select all (Ctrl+Shift+A)
- ✅ Auto-resize and scrollback buffer
- ✅ ANSI color code support
- ✅ Search functionality with regex support

### Session Management
- ✅ Save and organize SSH sessions
- ✅ Session groups for organization
- ✅ Quick connect for temporary connections
- ✅ Import/export session configurations
- ✅ Encrypted credential storage using Windows DPAPI

### SFTP File Transfer
- ✅ Browse remote file systems
- ✅ Upload and download files with progress tracking
- ✅ File operations (create, delete, rename, chmod)
- ✅ Streaming transfer for large files
- ✅ Transfer queue management

### Port Forwarding
- ✅ Local port forwarding
- ✅ Remote port forwarding
- ✅ Dynamic port forwarding (SOCKS5 proxy)

### Command Snippets
- ✅ Save frequently used commands
- ✅ Variable substitution in snippets
- ✅ Organize by category and tags
- ✅ Import/export snippet libraries

### UI/UX
- ✅ Modern dark theme interface
- ✅ Multi-tab terminal management
- ✅ Sidebar navigation
- ✅ Status bar with connection info
- ✅ Responsive layout
- ✅ Keyboard shortcuts for common operations
- ✅ Right-click context menus

### Data Management
- ✅ **Backup & Restore**: Securely backup sessions, snippets, and settings to a local encrypted file.
- ✅ **Crash Recovery**: Automatically restore session state after unexpected exits.

## Keyboard Shortcuts

MShell supports comprehensive keyboard shortcuts for efficient workflow. See [SHORTCUTS.md](SHORTCUTS.md) for the complete list.

**Quick Reference:**
- `Ctrl+N` - New connection
- `Ctrl+K` - Quick connect
- `Ctrl+Shift+C/V` - Copy/Paste in terminal
- `Ctrl+F` - Search in terminal
- `Ctrl+W` - Close tab
- `Ctrl+Tab` - Next tab

## Technology Stack

- **Frontend**: Vue 3 + TypeScript + Element Plus
- **Backend**: Electron + Node.js
- **SSH**: ssh2 library
- **Terminal**: xterm.js with addons
- **Testing**: Vitest + fast-check (property-based testing)
- **Build**: Vite + electron-builder

## Project Structure

```
mshell/
├── electron/                    # Electron main process
│   ├── main.ts                 # Main entry point
│   ├── preload.ts              # Preload script
│   ├── managers/               # Core managers
│   │   ├── CredentialManager.ts
│   │   ├── SessionManager.ts
│   │   ├── SSHConnectionManager.ts
│   │   ├── SFTPManager.ts
│   │   ├── PortForwardManager.ts
│   │   └── SnippetManager.ts
│   └── ipc/                    # IPC handlers
│       ├── ssh-handlers.ts
│       ├── sftp-handlers.ts
│       └── session-handlers.ts
├── src/                        # Vue application
│   ├── App.vue                 # Root component
│   ├── components/             # Vue components
│   │   ├── Terminal/
│   │   ├── Session/
│   │   └── Common/
│   ├── stores/                 # Pinia stores
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utilities
└── .kiro/specs/                # Specification documents
    └── windows-ssh-client/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
npm test
```

## Implementation Status

### Completed Tasks
- ✅ Project initialization and infrastructure
- ✅ Credential manager with encryption
- ✅ Session manager with CRUD operations
- ✅ SSH connection manager with full lifecycle management
- ✅ Terminal component with xterm.js integration
- ✅ Terminal settings and themes
- ✅ UI framework (Sidebar, Toolbar, StatusBar)
- ✅ Session list and management UI
- ✅ Multi-tab terminal management
- ✅ SFTP manager with file operations
- ✅ Port forwarding manager
- ✅ Command snippet manager
- ✅ Logging system
- ✅ Security features (known_hosts verification)
- ✅ Search functionality (Terminal Regex Search)
- ✅ Application settings management
- ✅ Auto-update mechanism
- ✅ Error handling and user feedback systems
- ✅ Keyboard shortcuts system
- ✅ Crash recovery and state persistence
- ✅ Build and packaging (Windows NSIS Installer)

### Remaining / Planned Tasks
- ⏳ Performance optimization
- ⏳ Final testing and acceptance
- ⏳ RDP Support (Design Phase)
- ⏳ Cloud Sync (OneDrive/Google Drive - Design Phase)

## Testing Strategy

The project uses comprehensive property-based testing with fast-check library:

- **Property 1**: Valid connection parameters establish connection
- **Property 3**: Invalid connection parameters return error
- **Property 4**: Connection keepalive and heartbeat
- **Property 5**: Connection disconnect detection
- **Property 16**: Sensitive information encryption
- **Property 17**: Concurrent connection support

Each test runs 100+ iterations with randomly generated inputs to ensure robustness.

## Security

- Credentials encrypted using Electron safeStorage (Windows DPAPI)
- No plaintext passwords in memory or logs
- Host key verification (planned)
- Secure IPC communication between processes

## License

MIT

## Author

MShell Team

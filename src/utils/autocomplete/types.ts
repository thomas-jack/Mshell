
export interface CompletionContext {
    cwd?: string; // Current remote directory
    input: string; // Full input line
    args: string[]; // Split arguments (including command)
    currentArgIndex: number; // Index of the argument cursor is currently on
    currentArg: string; // The text of the current argument
    sessionId?: string; // For remote calls
    electronAPI?: any; // Interaction with backend
    userId?: string; // Future proofing
}

export type CompletionType =
    | 'command'
    | 'subcommand'
    | 'option'
    | 'path'
    | 'history'
    | 'snippet'
    | 'shortcut'
    | 'hint';

export interface CompletionItem {
    text: string;           // The actual text to insert
    displayText?: string;   // Label to show in UI (defaults to text)
    description?: string;   // Detail text (e.g., "List directory contents")
    type: CompletionType;
    icon?: string;          // Optional custom icon override
    priority?: number;      // Sorting priority (higher is better)
    matchPart?: string;     // Part of text that matched (for highlighting)
    restPart?: string;      // Remaining part (for highlighting)
    usageCount?: number;    // For frequency sorting
    usage?: string;         // Usage example
}

export interface CommandDefinition {
    name: string;
    description: string;

    /**
     * Static options/flags that are always available for this command
     * e.g. ["--help", "--version", "-rf"]
     */
    options?: CompletionItem[];

    /**
     * Subcommands mapping
     * e.g. git -> { commit: ..., push: ... }
     */
    subcommands?: Record<string, CommandDefinition>;

    /**
     * Dynamic generator for arguments
     * Returns a list of suggestions based on current context
     */
    generate?: (context: CompletionContext) => Promise<CompletionItem[]>;
}

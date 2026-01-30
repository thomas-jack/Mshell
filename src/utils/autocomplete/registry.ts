
import type { CommandDefinition } from './types';

// Registry to hold loaded command definitions
class CommandRegistry {
    private commands: Map<string, CommandDefinition> = new Map();

    constructor() {
        this.loadDefinitions();
    }

    private loadDefinitions() {
        // Auto-load all command definitions from ./definitions directory
        const modules = import.meta.glob('./definitions/*.ts', { eager: true });

        for (const path in modules) {
            const mod = modules[path] as { default: CommandDefinition };
            if (mod.default && mod.default.name) {
                this.commands.set(mod.default.name, mod.default);
            }
        }
    }

    /**
     * Get a specific command definition
     */
    getCommand(name: string): CommandDefinition | undefined {
        return this.commands.get(name);
    }

    /**
     * Get all registered command names
     */
    getAllCommandNames(): string[] {
        return Array.from(this.commands.keys());
    }

    /**
     * Check if a command exists in registry
     */
    hasCommand(name: string): boolean {
        return this.commands.has(name);
    }
}

// Singleton instance
export const registry = new CommandRegistry();

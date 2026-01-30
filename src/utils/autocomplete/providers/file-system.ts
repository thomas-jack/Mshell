
import type { CompletionItem } from '../types';

/**
 * 执行远程命令并返回结果
 */
async function executeRemote(sessionId: string, command: string, electronAPI: any, timeout = 3000): Promise<string | null> {
    try {
        const result = await electronAPI.ssh?.executeCommand?.(sessionId, command, timeout);
        if (result?.success && result.data) {
            return result.data.trim();
        }
    } catch (e) {
        console.warn('Remote command failed:', command, e);
    }
    return null;
}

/**
 * 获取远程目录列表
 */
export async function getRemoteDirectories(
    sessionId: string,
    inputPath: string,
    electronAPI: any
): Promise<CompletionItem[]> {
    if (!sessionId || !electronAPI) return [];

    let dirPath = './';
    let prefix = inputPath;

    if (inputPath.includes('/')) {
        const lastSlash = inputPath.lastIndexOf('/');
        dirPath = inputPath.substring(0, lastSlash + 1) || './';
        prefix = inputPath.substring(lastSlash + 1);
    }

    const output = await executeRemote(sessionId, `ls -1ap "${dirPath}" 2>/dev/null`, electronAPI);
    if (!output) return [];

    const items = output.split('\n')
        .map(line => line.trim())
        .filter(line => line && line !== '.' && line !== './' && line.endsWith('/'))
        .filter(line => !prefix || line.startsWith(prefix));

    return items.slice(0, 30).map(name => {
        const fullPath = dirPath === './' ? name : dirPath + name;
        return {
            text: fullPath,
            displayText: name,
            type: 'path',
            description: '目录',
            priority: 80,
            matchPart: prefix,
            restPart: name.substring(prefix.length)
        };
    });
}

/**
 * 获取远程文件和目录列表
 */
export async function getRemoteFiles(
    sessionId: string,
    inputPath: string,
    electronAPI: any
): Promise<CompletionItem[]> {
    if (!sessionId || !electronAPI) return [];

    let dirPath = './';
    let prefix = inputPath;

    if (inputPath.includes('/')) {
        const lastSlash = inputPath.lastIndexOf('/');
        dirPath = inputPath.substring(0, lastSlash + 1) || './';
        prefix = inputPath.substring(lastSlash + 1);
    }

    const output = await executeRemote(sessionId, `ls -1ap "${dirPath}" 2>/dev/null`, electronAPI);
    if (!output) return [];

    const items = output.split('\n')
        .map(line => line.trim())
        .filter(line => line && line !== '.' && line !== './')
        .filter(line => !prefix || line.startsWith(prefix));

    return items.slice(0, 30).map(name => {
        const isDir = name.endsWith('/');
        const fullPath = dirPath === './' ? name : dirPath + name;
        return {
            text: fullPath,
            displayText: name,
            type: 'path',
            description: isDir ? '目录' : '文件',
            priority: isDir ? 80 : 70,
            matchPart: prefix,
            restPart: name.substring(prefix.length)
        };
    });
}

/**
 * 获取运行中的 Docker 容器
 */
export async function getDockerContainers(
    sessionId: string,
    electronAPI: any,
    all = false
): Promise<CompletionItem[]> {
    if (!sessionId || !electronAPI) return [];

    const cmd = all
        ? `docker ps -a --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}" 2>/dev/null`
        : `docker ps --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}" 2>/dev/null`;

    const output = await executeRemote(sessionId, cmd, electronAPI, 5000);
    if (!output) return [];

    return output.split('\n')
        .filter(line => line.trim())
        .map(line => {
            const [id, name, status, image] = line.split('|');
            return {
                text: name || id,
                displayText: name || id,
                type: 'hint' as const,
                description: `${status} (${image})`,
                priority: 90,
                matchPart: '',
                restPart: name || id
            };
        });
}

/**
 * 获取 Docker 镜像列表
 */
export async function getDockerImages(
    sessionId: string,
    electronAPI: any
): Promise<CompletionItem[]> {
    if (!sessionId || !electronAPI) return [];

    const cmd = `docker images --format "{{.Repository}}:{{.Tag}}|{{.Size}}" 2>/dev/null`;
    const output = await executeRemote(sessionId, cmd, electronAPI, 5000);
    if (!output) return [];

    return output.split('\n')
        .filter(line => line.trim() && !line.includes('<none>'))
        .map(line => {
            const [name, size] = line.split('|');
            return {
                text: name,
                displayText: name,
                type: 'hint' as const,
                description: size,
                priority: 85,
                matchPart: '',
                restPart: name
            };
        });
}

/**
 * 获取 PM2 进程列表
 */
export async function getPM2Processes(
    sessionId: string,
    electronAPI: any
): Promise<CompletionItem[]> {
    if (!sessionId || !electronAPI) return [];

    const cmd = `pm2 jlist 2>/dev/null`;
    const output = await executeRemote(sessionId, cmd, electronAPI, 5000);
    if (!output) return [];

    try {
        const processes = JSON.parse(output);
        return processes.map((proc: any) => ({
            text: proc.name,
            displayText: proc.name,
            type: 'hint' as const,
            description: `${proc.pm2_env?.status || 'unknown'} (pid: ${proc.pid})`,
            priority: 90,
            matchPart: '',
            restPart: proc.name
        }));
    } catch {
        return [];
    }
}

/**
 * 获取 Git 分支列表
 */
export async function getGitBranches(
    sessionId: string,
    electronAPI: any
): Promise<CompletionItem[]> {
    if (!sessionId || !electronAPI) return [];

    const cmd = `git branch -a --format="%(refname:short)|%(objectname:short)" 2>/dev/null`;
    const output = await executeRemote(sessionId, cmd, electronAPI, 3000);
    if (!output) return [];

    return output.split('\n')
        .filter(line => line.trim())
        .map(line => {
            const [name, commit] = line.split('|');
            const isRemote = name.startsWith('origin/');
            return {
                text: name,
                displayText: name,
                type: 'hint' as const,
                description: isRemote ? `远程分支 (${commit})` : `本地分支 (${commit})`,
                priority: isRemote ? 70 : 90,
                matchPart: '',
                restPart: name
            };
        });
}

/**
 * 获取 Git 远程仓库列表
 */
export async function getGitRemotes(
    sessionId: string,
    electronAPI: any
): Promise<CompletionItem[]> {
    if (!sessionId || !electronAPI) return [];

    const cmd = `git remote -v 2>/dev/null | grep '(push)' | awk '{print $1}'`;
    const output = await executeRemote(sessionId, cmd, electronAPI, 3000);
    if (!output) return [];

    const remotes = [...new Set(output.split('\n').filter(r => r.trim()))];
    return remotes.map(name => ({
        text: name,
        displayText: name,
        type: 'hint' as const,
        description: '远程仓库',
        priority: 90,
        matchPart: '',
        restPart: name
    }));
}

// Re-export the old function for compatibility
export { getRemoteDirectories as getRemotePathSuggestions };

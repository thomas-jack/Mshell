
import type { CommandDefinition } from '../types';

/**
 * curl 命令 - HTTP 请求工具
 */
const curlCommand: CommandDefinition = {
    name: 'curl',
    description: 'HTTP 请求工具',
    options: [
        { text: '-X', type: 'option', description: '请求方法', priority: 100, usage: '-X POST' },
        { text: '-H', type: 'option', description: '请求头', priority: 95, usage: '-H "Content-Type: application/json"' },
        { text: '-d', type: 'option', description: '请求体数据', priority: 90, usage: '-d \'{"key":"value"}\'' },
        { text: '-o', type: 'option', description: '输出到文件', priority: 85, usage: '-o output.html' },
        { text: '-O', type: 'option', description: '保存为远程文件名', priority: 80 },
        { text: '-L', type: 'option', description: '跟随重定向', priority: 75 },
        { text: '-I', type: 'option', description: '只显示响应头', priority: 70 },
        { text: '-s', type: 'option', description: '静默模式', priority: 65 },
        { text: '-v', type: 'option', description: '详细输出', priority: 60 },
        { text: '-k', type: 'option', description: '忽略 SSL 证书', priority: 55 },
        { text: '-u', type: 'option', description: '用户认证', priority: 50, usage: '-u user:pass' },
        { text: '--data-raw', type: 'option', description: '原始数据', priority: 45 },
        { text: '-F', type: 'option', description: '表单上传', priority: 40, usage: '-F "file=@path"' }
    ],
    subcommands: {
        '-X': {
            name: '-X',
            description: 'HTTP 方法',
            options: [
                { text: 'GET', type: 'hint', description: '获取资源', priority: 100 },
                { text: 'POST', type: 'hint', description: '提交数据', priority: 95 },
                { text: 'PUT', type: 'hint', description: '更新资源', priority: 90 },
                { text: 'DELETE', type: 'hint', description: '删除资源', priority: 85 },
                { text: 'PATCH', type: 'hint', description: '部分更新', priority: 80 },
                { text: 'HEAD', type: 'hint', description: '获取头部', priority: 75 },
                { text: 'OPTIONS', type: 'hint', description: '查询选项', priority: 70 }
            ]
        }
    }
};

export default curlCommand;

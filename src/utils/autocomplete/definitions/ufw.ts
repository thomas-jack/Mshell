
import type { CommandDefinition } from '../types';

/**
 * ufw 命令 - Ubuntu 防火墙 (Uncomplicated Firewall)
 */
const ufwCommand: CommandDefinition = {
    name: 'ufw',
    description: 'Ubuntu 防火墙管理',
    options: [
        { text: 'enable', type: 'subcommand', description: '启用防火墙', priority: 100, usage: 'ufw enable' },
        { text: 'disable', type: 'subcommand', description: '禁用防火墙', priority: 95, usage: 'ufw disable' },
        { text: 'status', type: 'subcommand', description: '查看状态', priority: 90, usage: 'ufw status' },
        { text: 'allow', type: 'subcommand', description: '允许端口/服务', priority: 85, usage: 'ufw allow 22' },
        { text: 'deny', type: 'subcommand', description: '拒绝端口/服务', priority: 80, usage: 'ufw deny 3306' },
        { text: 'delete', type: 'subcommand', description: '删除规则', priority: 75, usage: 'ufw delete allow 22' },
        { text: 'reset', type: 'subcommand', description: '重置防火墙', priority: 70 },
        { text: 'reload', type: 'subcommand', description: '重载规则', priority: 65 },
        { text: 'logging', type: 'subcommand', description: '设置日志级别', priority: 60, usage: 'ufw logging on' },
        { text: 'default', type: 'subcommand', description: '设置默认策略', priority: 55, usage: 'ufw default deny incoming' }
    ],
    subcommands: {
        'status': {
            name: 'status',
            description: '查看状态',
            options: [
                { text: 'verbose', type: 'option', description: '详细输出', priority: 90 },
                { text: 'numbered', type: 'option', description: '显示规则编号', priority: 85 }
            ]
        },
        'allow': {
            name: 'allow',
            description: '允许端口',
            options: [
                { text: '22', type: 'hint', description: 'SSH', priority: 100 },
                { text: '80', type: 'hint', description: 'HTTP', priority: 95 },
                { text: '443', type: 'hint', description: 'HTTPS', priority: 90 },
                { text: '3306', type: 'hint', description: 'MySQL', priority: 85 },
                { text: '5432', type: 'hint', description: 'PostgreSQL', priority: 80 },
                { text: '6379', type: 'hint', description: 'Redis', priority: 75 },
                { text: '27017', type: 'hint', description: 'MongoDB', priority: 70 },
                { text: '8080', type: 'hint', description: 'HTTP 备用', priority: 65 },
                { text: 'from', type: 'option', description: '指定来源IP', priority: 60, usage: 'allow from 192.168.1.0/24' },
                { text: 'to', type: 'option', description: '指定目标', priority: 55 },
                { text: 'proto', type: 'option', description: '指定协议', priority: 50, usage: 'allow proto tcp' }
            ]
        },
        'deny': {
            name: 'deny',
            description: '拒绝端口',
            options: [
                { text: '22', type: 'hint', description: 'SSH', priority: 100 },
                { text: '80', type: 'hint', description: 'HTTP', priority: 95 },
                { text: '443', type: 'hint', description: 'HTTPS', priority: 90 },
                { text: '3306', type: 'hint', description: 'MySQL', priority: 85 },
                { text: 'from', type: 'option', description: '指定来源IP', priority: 60 }
            ]
        },
        'default': {
            name: 'default',
            description: '默认策略',
            options: [
                { text: 'allow', type: 'hint', description: '允许', priority: 100 },
                { text: 'deny', type: 'hint', description: '拒绝', priority: 95 },
                { text: 'reject', type: 'hint', description: '拒绝并通知', priority: 90 }
            ]
        },
        'logging': {
            name: 'logging',
            description: '日志设置',
            options: [
                { text: 'on', type: 'hint', description: '开启', priority: 100 },
                { text: 'off', type: 'hint', description: '关闭', priority: 95 },
                { text: 'low', type: 'hint', description: '低级别', priority: 90 },
                { text: 'medium', type: 'hint', description: '中级别', priority: 85 },
                { text: 'high', type: 'hint', description: '高级别', priority: 80 },
                { text: 'full', type: 'hint', description: '完整', priority: 75 }
            ]
        }
    }
};

export default ufwCommand;

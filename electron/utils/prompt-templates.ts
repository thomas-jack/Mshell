/**
 * AI Prompt Templates
 * 定义不同 AI 操作的提示词模板
 */

import type { AIAction } from '../../src/types/ai'

export interface PromptTemplate {
  action: AIAction
  template: string
}

/**
 * 提示词模板映射
 */
export const PROMPT_TEMPLATES: Record<AIAction, PromptTemplate> = {
  write: {
    action: 'write',
    template: `Write code based on this description: {content}

Language: {language}

Return only the code without explanations or markdown code blocks.`
  },

  explain: {
    action: 'explain',
    template: `Explain this code in detail:

\`\`\`{language}
{content}
\`\`\`

Provide a clear and concise explanation in Chinese.`
  },

  optimize: {
    action: 'optimize',
    template: `Optimize this code:

\`\`\`{language}
{content}
\`\`\`

Return only the optimized code without explanations or markdown code blocks.`
  },

  chat: {
    action: 'chat',
    template: `{content}`
  }
}

/**
 * 构建提示词
 * @param action AI 操作类型
 * @param content 用户内容
 * @param language 代码语言（可选）
 * @returns 构建好的提示词
 */
export function buildPrompt(action: AIAction, content: string, language?: string): string {
  const template = PROMPT_TEMPLATES[action]
  if (!template) {
    throw new Error(`Unknown action: ${action}`)
  }

  let prompt = template.template

  // 替换变量
  prompt = prompt.replace('{content}', content)
  prompt = prompt.replace(/{language}/g, language || 'unknown')

  return prompt
}

/**
 * 移除代码块标记
 * @param code 可能包含代码块标记的代码
 * @returns 清理后的代码
 */
export function removeCodeBlockMarkers(code: string): string {
  // 移除开头的代码块标记（```language 或 ```）
  let cleaned = code.replace(/^```[\w]*\n?/gm, '')

  // 移除结尾的代码块标记
  cleaned = cleaned.replace(/\n?```$/gm, '')

  return cleaned.trim()
}

/**
 * 语言检测工具
 * 基于代码特征（Shebang、关键字、语法）检测编程语言
 */

import type { LanguageDetectionResult } from '../../src/types/ai'

/**
 * 语言关键字映射
 */
const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  python: ['def ', 'class ', 'import ', 'from ', 'print(', '__init__', 'self.', 'elif ', 'lambda '],
  javascript: ['function ', 'const ', 'let ', 'var ', 'console.', '=>', 'async ', 'await ', 'require('],
  typescript: ['interface ', 'type ', 'enum ', 'namespace ', 'declare ', ': string', ': number', ': boolean'],
  java: ['public class', 'private ', 'protected ', 'void ', 'static ', 'extends ', 'implements ', 'package '],
  cpp: ['#include', 'std::', 'cout', 'cin', 'namespace ', 'template<', 'nullptr'],
  c: ['#include', 'printf(', 'scanf(', 'malloc(', 'free(', 'struct ', 'typedef '],
  go: ['package ', 'func ', 'import ', 'defer ', 'go ', 'chan ', 'interface{}', ':='],
  rust: ['fn ', 'let mut', 'impl ', 'trait ', 'pub ', 'use ', 'match ', '&str'],
  ruby: ['def ', 'end', 'puts ', 'require ', 'class ', 'module ', 'attr_', 'do |'],
  php: ['<?php', 'function ', '$_', 'echo ', 'namespace ', 'use ', '->'],
  shell: ['#!/bin/bash', '#!/bin/sh', 'echo ', 'if [', 'then', 'fi', 'done', 'esac', '$1', '${'],
  bash: ['#!/bin/bash', 'echo ', 'if [', 'then', 'fi', 'done', 'esac', '$1', '${'],
  powershell: ['$_', 'Get-', 'Set-', 'New-', 'Remove-', 'Write-Host', 'param(', '[Parameter'],
  sql: ['SELECT ', 'FROM ', 'WHERE ', 'INSERT INTO', 'UPDATE ', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE'],
  yaml: ['---', 'apiVersion:', 'kind:', 'metadata:', 'spec:', 'name:', 'namespace:'],
  json: ['":', '": ', '{}', '[]', 'null', 'true', 'false'],
  html: ['<!DOCTYPE', '<html', '<head', '<body', '<div', '<span', '<script', '<style'],
  css: ['{', '}', ':', ';', 'px', 'em', 'rem', '@media', 'display:', 'color:'],
  markdown: ['# ', '## ', '### ', '- ', '* ', '```', '[', '](', '**', '__']
}

/**
 * Shebang 映射
 */
const SHEBANG_MAP: Record<string, string> = {
  '/bin/bash': 'bash',
  '/bin/sh': 'shell',
  '/bin/zsh': 'shell',
  '/usr/bin/env bash': 'bash',
  '/usr/bin/env sh': 'shell',
  '/usr/bin/env zsh': 'shell',
  '/usr/bin/env python': 'python',
  '/usr/bin/env python3': 'python',
  '/usr/bin/env node': 'javascript',
  '/usr/bin/env ruby': 'ruby',
  '/usr/bin/env perl': 'perl',
  '/usr/bin/env php': 'php'
}

/**
 * 语言检测器类
 */
export class LanguageDetector {
  /**
   * 检测代码语言
   * @param code 代码内容
   * @returns 检测结果
   */
  detect(code: string): LanguageDetectionResult {
    if (!code || code.trim().length === 0) {
      return { language: 'unknown', confidence: 0 }
    }

    // 1. 优先检测 Shebang
    const shebangResult = this.detectByShebang(code)
    if (shebangResult) {
      return { language: shebangResult, confidence: 0.95 }
    }

    // 2. 检测关键字
    const keywordResult = this.detectByKeywords(code)
    if (keywordResult.language !== 'unknown') {
      return keywordResult
    }

    // 3. 检测语法特征
    const syntaxResult = this.detectBySyntax(code)
    if (syntaxResult.language !== 'unknown') {
      return syntaxResult
    }

    // 4. 默认返回 shell（SSH 终端中最常见）
    return { language: 'shell', confidence: 0.3 }
  }

  /**
   * 通过 Shebang 检测语言
   * @param code 代码内容
   * @returns 语言名称或 undefined
   */
  private detectByShebang(code: string): string | undefined {
    const firstLine = code.split('\n')[0].trim()
    
    if (!firstLine.startsWith('#!')) {
      return undefined
    }

    const shebang = firstLine.substring(2).trim()
    
    // 精确匹配
    if (SHEBANG_MAP[shebang]) {
      return SHEBANG_MAP[shebang]
    }

    // 模糊匹配
    for (const [key, value] of Object.entries(SHEBANG_MAP)) {
      if (shebang.includes(key)) {
        return value
      }
    }

    return undefined
  }

  /**
   * 通过关键字检测语言
   * @param code 代码内容
   * @returns 检测结果
   */
  private detectByKeywords(code: string): LanguageDetectionResult {
    const scores: Record<string, number> = {}

    // 计算每种语言的匹配分数
    for (const [language, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
      let score = 0
      for (const keyword of keywords) {
        // 使用正则表达式进行更精确的匹配
        const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        const matches = code.match(regex)
        if (matches) {
          score += matches.length
        }
      }
      scores[language] = score
    }

    // 找到得分最高的语言
    let maxScore = 0
    let detectedLanguage = 'unknown'

    for (const [language, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        detectedLanguage = language
      }
    }

    // 如果得分太低，认为检测失败
    if (maxScore < 2) {
      return { language: 'unknown', confidence: 0 }
    }

    // 计算置信度（基于得分）
    const confidence = Math.min(maxScore / 10, 0.9)

    return { language: detectedLanguage, confidence }
  }

  /**
   * 通过语法特征检测语言
   * @param code 代码内容
   * @returns 检测结果
   */
  private detectBySyntax(code: string): LanguageDetectionResult {
    // Shell 脚本特征：以 $ 开头的变量，管道符，重定向
    if (/\$[A-Z_][A-Z0-9_]*|\||>>|<<|&&|\|\|/.test(code)) {
      return { language: 'shell', confidence: 0.6 }
    }

    // Python 特征：缩进风格，冒号结尾
    if (/^\s{4}|\t/.test(code) && /:$/.test(code.split('\n')[0])) {
      return { language: 'python', confidence: 0.5 }
    }

    // JavaScript/TypeScript 特征：分号结尾，花括号
    if (/;$/.test(code.split('\n')[0]) && /\{|\}/.test(code)) {
      return { language: 'javascript', confidence: 0.5 }
    }

    // C/C++ 特征：分号结尾，花括号，指针
    if (/;$/.test(code.split('\n')[0]) && /\*|->/.test(code)) {
      return { language: 'cpp', confidence: 0.5 }
    }

    return { language: 'unknown', confidence: 0 }
  }
}

// 导出单例
export const languageDetector = new LanguageDetector()

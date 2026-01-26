import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { v4 as uuidv4 } from 'uuid'

/**
 * 命令片段接口 - 只包含可序列化的基本类型
 */
export interface Snippet {
  id: string
  name: string
  command: string
  description: string
  category: string
  tags: string[]
  variables: string[]  // 只存储变量名数组
  usageCount: number
  createdAt: string    // ISO 字符串
  updatedAt: string    // ISO 字符串
}

/**
 * SnippetManager - 管理命令片段
 */
export class SnippetManager {
  private snippetsPath: string
  private snippets: Snippet[] = []

  constructor() {
    this.snippetsPath = join(app.getPath('userData'), 'snippets.json')
  }

  /**
   * 初始化并加载片段
   */
  async initialize(): Promise<void> {
    try {
      const data = await fs.readFile(this.snippetsPath, 'utf-8')
      this.snippets = JSON.parse(data)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // 文件不存在，创建空数组
        this.snippets = []
        await this.save()
      } else {
        console.error('Failed to load snippets:', error)
        this.snippets = []
      }
    }
  }

  /**
   * 保存片段到文件
   */
  private async save(): Promise<void> {
    try {
      const dir = join(this.snippetsPath, '..')
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(this.snippetsPath, JSON.stringify(this.snippets, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to save snippets:', error)
      throw new Error('保存失败')
    }
  }

  /**
   * 获取所有片段
   */
  getAll(): Snippet[] {
    return [...this.snippets]
  }

  /**
   * 获取单个片段
   */
  get(id: string): Snippet | undefined {
    return this.snippets.find(s => s.id === id)
  }

  /**
   * 创建片段
   */
  async create(data: {
    name: string
    command: string
    description?: string
    category?: string
    tags?: string[]
    variables?: string[]
  }): Promise<Snippet> {
    const now = new Date().toISOString()
    
    const snippet: Snippet = {
      id: uuidv4(),
      name: data.name,
      command: data.command,
      description: data.description || '',
      category: data.category || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      variables: Array.isArray(data.variables) ? data.variables : [],
      usageCount: 0,
      createdAt: now,
      updatedAt: now
    }

    this.snippets.push(snippet)
    await this.save()
    
    return snippet
  }

  /**
   * 更新片段
   */
  async update(id: string, data: Partial<Snippet>): Promise<void> {
    const index = this.snippets.findIndex(s => s.id === id)
    if (index === -1) {
      throw new Error('片段不存在')
    }

    this.snippets[index] = {
      ...this.snippets[index],
      ...data,
      id: this.snippets[index].id,  // 保持ID不变
      createdAt: this.snippets[index].createdAt,  // 保持创建时间不变
      updatedAt: new Date().toISOString()
    }

    await this.save()
  }

  /**
   * 删除片段
   */
  async delete(id: string): Promise<void> {
    const index = this.snippets.findIndex(s => s.id === id)
    if (index === -1) {
      throw new Error('片段不存在')
    }

    this.snippets.splice(index, 1)
    await this.save()
  }

  /**
   * 增加使用次数
   */
  async incrementUsage(id: string): Promise<void> {
    const snippet = this.snippets.find(s => s.id === id)
    if (snippet) {
      snippet.usageCount++
      snippet.updatedAt = new Date().toISOString()
      await this.save()
    }
  }

  /**
   * 按分类获取
   */
  getByCategory(category: string): Snippet[] {
    return this.snippets.filter(s => s.category === category)
  }

  /**
   * 按标签获取
   */
  getByTag(tag: string): Snippet[] {
    return this.snippets.filter(s => s.tags.includes(tag))
  }

  /**
   * 搜索片段
   */
  search(query: string): Snippet[] {
    const lowerQuery = query.toLowerCase()
    return this.snippets.filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.command.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery)
    )
  }
}

// 导出单例
export const snippetManager = new SnippetManager()

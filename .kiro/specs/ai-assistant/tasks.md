# Implementation Plan: AI Assistant Integration

## Overview

本实现计划将 AI 助手功能分解为可执行的开发任务。实现将按照以下顺序进行：
1. 基础设施和类型定义
2. 主进程 AI Manager 和 Provider Adapters
3. IPC 通信层
4. 渲染进程 UI 组件
5. 终端集成
6. 测试和优化

## Tasks

- [x] 1. 安装依赖和基础设置
  - 安装 AI SDK 依赖：`openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, `axios`, `marked`
  - 更新 package.json
  - 验证 Node.js crypto 模块可用（用于 hash 和加密）
  - _Requirements: 所有_

- [x] 2. 类型定义和接口
  - [x] 2.1 创建 AI 类型定义文件
    - 创建 `src/types/ai.ts`
    - 定义 `AIChannel`, `AIModel`, `AIConfig`, `AIRequest`, `CacheEntry` 接口
    - 定义 `AIProviderAdapter` 接口
    - _Requirements: 1.1, 2.6, 3.1, 4.1, 10.1, 11.6_
  
  - [x] 2.2 更新 electron-env.d.ts
    - 在 `src/types/electron-env.d.ts` 的 `ElectronAPI` 接口中添加 `ai` 命名空间类型定义
    - 确保类型定义与 Preload API 一致
    - _Requirements: 所有_

- [x] 3. 语言检测工具
  - [x] 3.1 实现 Language Detector
    - 创建 `electron/utils/language-detector.ts`
    - 实现 Shebang 检测
    - 实现关键字检测（Python, JavaScript, Shell, Java 等）
    - 实现语法特征检测
    - 优先检测 Shell 脚本
    - _Requirements: 16.1, 16.2, 16.5, 16.6_
  
  - [ ]* 3.2 编写语言检测单元测试
    - 测试 Shebang 检测
    - 测试关键字检测
    - 测试常见语言识别
    - 测试未知语言降级
    - _Requirements: 16.1, 16.2, 16.4_

- [x] 4. AI Provider Adapters
  - [x] 4.1 实现 OpenAI Adapter
    - 创建 `electron/managers/ai-providers/OpenAIAdapter.ts`
    - 实现 API Key 验证
    - 实现模型列表获取
    - 实现请求发送和取消
    - _Requirements: 1.2, 1.6, 2.1, 7.1, 8.1, 9.1_
  
  - [x] 4.2 实现 Anthropic Adapter
    - 创建 `electron/managers/ai-providers/AnthropicAdapter.ts`
    - 实现 API Key 验证
    - 加载预定义 Claude 模型列表
    - 实现请求发送和取消
    - _Requirements: 1.3, 1.6, 2.2, 7.1, 8.1, 9.1_
  
  - [x] 4.3 实现 Gemini Adapter
    - 创建 `electron/managers/ai-providers/GeminiAdapter.ts`
    - 实现 API Key 验证
    - 加载预定义 Gemini 模型列表
    - 实现请求发送和取消
    - _Requirements: 1.4, 1.6, 2.3, 7.1, 8.1, 9.1_

  - [x] 4.4 实现 OpenAI Compatible Adapter
    - 创建 `electron/managers/ai-providers/OpenAICompatibleAdapter.ts`
    - 实现 API Key 验证
    - 实现模型列表获取（尝试调用 /v1/models）
    - 实现请求发送和取消
    - 支持自定义 API 端点
    - _Requirements: 1.5, 1.6, 2.4, 7.1, 8.1, 9.1_
  
  - [ ]* 4.5 编写 Provider Adapters 单元测试
    - 测试每个 adapter 的 API Key 验证
    - 测试模型列表获取
    - 测试请求发送和响应处理
    - 测试错误处理（401、429、500、超时）
    - 使用 mock API 响应
    - _Requirements: 1.6, 1.7, 2.1-2.4, 12.1-12.8_

- [x] 5. AI Manager 核心实现
  - [x] 5.1 实现渠道管理
    - 创建 `electron/managers/AIManager.ts`
    - 实现 `addChannel()`, `updateChannel()`, `deleteChannel()`, `verifyChannel()`, `getAllChannels()`
    - 实现渠道类型到 Provider Adapter 的映射
    - 实现渠道启用/禁用逻辑
    - _Requirements: 1.1-1.10_
  
  - [x] 5.2 实现模型管理
    - 实现 `fetchModels()`, `addModel()`, `deleteModel()`, `getAllModels()`, `getModelsByChannel()`
    - 实现自动获取模型逻辑（调用对应 Provider Adapter）
    - 实现手动添加模型逻辑
    - 实现模型类型标记（auto/manual）
    - 实现自动模型保护（不允许删除）
    - _Requirements: 2.1-2.9, 3.1-3.6_
  
  - [x] 5.3 实现默认模型管理
    - 实现 `setDefaultModel()`, `getDefaultModel()`
    - 实现默认模型唯一性逻辑
    - 实现默认模型级联删除处理
    - _Requirements: 4.1-4.6_
  
  - [x] 5.4 实现 AI 请求处理
    - 创建 `electron/utils/prompt-templates.ts` 定义提示词模板
    - 实现 `request()` 方法
    - 实现 Prompt Template 构建（write、explain、optimize）
    - 集成 Language Detector
    - 调用对应 Provider Adapter 发送请求
    - 实现代码块标记移除逻辑
    - 实现请求超时控制
    - 发送 IPC 事件（ai:progress、ai:complete、ai:error）
    - _Requirements: 7.1-7.8, 8.1-8.10, 9.1-9.8, 10.1-10.6, 16.1-16.6_
  
  - [x] 5.5 实现请求取消机制
    - 实现 `cancelRequest()` 方法
    - 维护活动请求 Map
    - 调用 Provider Adapter 的取消方法
    - 发送 `ai:cancelled` 事件
    - _Requirements: 13.4, 13.5_
  
  - [x] 5.6 实现缓存管理
    - 实现缓存键生成（使用 Node.js crypto.createHash 生成 MD5）
    - 实现 `getFromCache()`, `saveToCache()`, `cleanCache()`
    - 实现 LRU 淘汰策略（最多 10 条）
    - 实现缓存过期逻辑（1 小时）
    - _Requirements: 13.6, 13.7_
  
  - [x] 5.7 实现配置持久化
    - 实现 `loadConfig()`, `saveConfig()`
    - 实现 API Key 加密/解密（Electron safeStorage）
    - 实现配置文件读写（%APPDATA%/mshell/ai-config.json）
    - 实现配置文件损坏恢复
    - _Requirements: 11.1-11.8, 14.1-14.8_
  
  - [x] 5.8 实现错误处理
    - 实现各类错误的捕获和转换
    - 实现用户友好的错误信息
    - 实现错误日志记录（不记录敏感信息）
    - _Requirements: 12.1-12.8, 14.3, 14.4_
  
  - [ ]* 5.9 编写 AI Manager 单元测试
    - 测试渠道 CRUD 操作
    - 测试模型 CRUD 操作
    - 测试默认模型设置和清除
    - 测试配置参数验证
    - 测试 API Key 加密/解密
    - 测试缓存机制（命中/未命中）
    - 测试请求取消
    - 测试错误处理
    - _Requirements: 所有_
  
  - [ ]* 5.10 编写 AI Manager 属性测试
    - 实现 Properties 1-5（渠道管理）
    - 实现 Properties 6-11（模型管理）
    - 实现 Properties 12-13（AI 请求）
    - 实现 Properties 14-15（配置管理）
    - 实现 Properties 16（错误处理）
    - 实现 Properties 17-19（性能）
    - 实现 Properties 20-24（安全）
    - 每个属性测试至少 100 次迭代
    - _Requirements: 所有_

- [x] 6. IPC Handlers 实现
  - [x] 6.1 创建 IPC Handlers
    - 创建 `electron/ipc/ai-handlers.ts`
    - 导出 `registerAIHandlers(ipcMain, aiManager)` 函数
    - 注册所有 AI 相关的 IPC handlers
    - 实现渠道管理 handlers（addChannel、updateChannel、deleteChannel、verifyChannel、getAllChannels）
    - 实现模型管理 handlers（fetchModels、addModel、deleteModel、getAllModels、setDefaultModel）
    - 实现 AI 请求 handlers（request、cancelRequest）
    - 实现配置管理 handlers（updateConfig、getConfig）
    - 确保 AI Manager 通过 IPC 发送事件到渲染进程（ai:progress、ai:complete、ai:error、ai:cancelled）
    - _Requirements: 所有_
  
  - [x] 6.2 集成到主进程
    - 在 `electron/main.ts` 中导入 `registerAIHandlers` 和 `AIManager`
    - 在 `app.whenReady()` 中创建 AIManager 实例并初始化
    - 调用 `registerAIHandlers(ipcMain, aiManager)`（在其他 handlers 注册之后）
    - _Requirements: 所有_
  
  - [ ]* 6.3 编写 IPC Handlers 单元测试
    - 测试每个 handler 的调用和响应
    - 测试错误处理
    - 使用 mock AIManager
    - _Requirements: 所有_

- [x] 7. Preload API 暴露
  - [x] 7.1 更新 Preload Script
    - 在 `electron/preload.ts` 中添加 `ai` 命名空间
    - 暴露所有 AI 相关的 IPC 调用方法
    - 暴露事件监听方法（onProgress、onComplete、onError、onCancelled）
    - _Requirements: 所有_
  
  - [x] 7.2 更新 TypeScript 类型定义
    - 在 `electron-env.d.ts` 中添加 `ai` 命名空间类型定义
    - 确保类型与 Preload API 一致
    - _Requirements: 所有_

- [x] 8. Pinia Store 实现
  - [x] 8.1 创建 AI Store
    - 创建 `src/stores/ai.ts`
    - 定义 State 接口（channels、models、config、activeRequests、loading、error）
    - 实现 Getters（defaultModel、enabledChannels、modelsByChannel、hasDefaultModel）
    - 实现 Actions（loadChannels、loadModels、loadConfig、addChannel、deleteChannel、setDefaultModel、sendRequest）
    - _Requirements: 所有_
  
  - [ ]* 8.2 编写 Store 单元测试
    - 测试每个 action 的行为
    - 测试 getters 的计算逻辑
    - 使用 mock electronAPI
    - _Requirements: 所有_
    - 创建 `electron/managers/ai-providers/OpenAIAdapter.ts`
    - 实现 API Key 验证
    - 实现模型列表获取
    - 实现请求发送和取消
    - _Requirements: 1.2, 1.6, 2.1, 7.1, 8.1, 9.1_
  
  - [ ] 4.2 实现 Anthropic Adapter
    - 创建 `electron/managers/ai-providers/AnthropicAdapter.ts`
    - 实现 API Key 验证
    - 加载预定义 Claude 模型列表
    - 实现请求发送和取消
    - _Requirements: 1.3, 1.6, 2.2, 7.1, 8.1, 9.1_
  
  - [ ] 4.3 实现 Gemini Adapter
    - 创建 `electron/managers/ai-providers/GeminiAdapter.ts`
    - 实现 API Key 验证
    - 加载预定义 Gemini 模型列表
    - 实现请求发送和取消
    - _Requirements: 1.4, 1.6, 2.3, 7.1, 8.1, 9.1_

  - [ ] 4.4 实现 OpenAI Compatible Adapter
    - 创建 `electron/managers/ai-providers/OpenAICompatibleAdapter.ts`
    - 实现 API Key 验证
    - 实现模型列表获取（尝试调用 /v1/models）
    - 实现请求发送和取消
    - 支持自定义 API 端点
    - _Requirements: 1.5, 1.6, 2.4, 7.1, 8.1, 9.1_
  
  - [ ]* 4.5 编写 Provider Adapters 单元测试
    - 测试每个 adapter 的 API Key 验证
    - 测试模型列表获取
    - 测试请求发送和响应处理
    - 测试错误处理（401、429、500、超时）
    - 使用 mock API 响应
    - _Requirements: 1.6, 1.7, 2.1-2.4, 12.1-12.8_

- [ ] 5. AI Manager 核心实现
  - [ ] 5.1 实现渠道管理
    - 创建 `electron/managers/AIManager.ts`
    - 实现 `addChannel()`, `updateChannel()`, `deleteChannel()`, `verifyChannel()`, `getAllChannels()`
    - 实现渠道类型到 Provider Adapter 的映射
    - 实现渠道启用/禁用逻辑
    - _Requirements: 1.1-1.10_
  
  - [ ] 5.2 实现模型管理
    - 实现 `fetchModels()`, `addModel()`, `deleteModel()`, `getAllModels()`, `getModelsByChannel()`
    - 实现自动获取模型逻辑（调用对应 Provider Adapter）
    - 实现手动添加模型逻辑
    - 实现模型类型标记（auto/manual）
    - 实现自动模型保护（不允许删除）
    - _Requirements: 2.1-2.9, 3.1-3.6_
  
  - [ ] 5.3 实现默认模型管理
    - 实现 `setDefaultModel()`, `getDefaultModel()`
    - 实现默认模型唯一性逻辑
    - 实现默认模型级联删除处理
    - _Requirements: 4.1-4.6_
  
  - [ ] 5.4 实现 AI 请求处理
    - 创建 `electron/utils/prompt-templates.ts` 定义提示词模板
    - 实现 `request()` 方法
    - 实现 Prompt Template 构建（write、explain、optimize）
    - 集成 Language Detector
    - 调用对应 Provider Adapter 发送请求
    - 实现代码块标记移除逻辑
    - 实现请求超时控制
    - 发送 IPC 事件（ai:progress、ai:complete、ai:error）
    - _Requirements: 7.1-7.8, 8.1-8.10, 9.1-9.8, 10.1-10.6, 16.1-16.6_
  
  - [ ] 5.5 实现请求取消机制
    - 实现 `cancelRequest()` 方法
    - 维护活动请求 Map
    - 调用 Provider Adapter 的取消方法
    - 发送 `ai:cancelled` 事件
    - _Requirements: 13.4, 13.5_
  
  - [ ] 5.6 实现缓存管理
    - 实现缓存键生成（使用 Node.js crypto.createHash 生成 MD5）
    - 实现 `getFromCache()`, `saveToCache()`, `cleanCache()`
    - 实现 LRU 淘汰策略（最多 10 条）
    - 实现缓存过期逻辑（1 小时）
    - _Requirements: 13.6, 13.7_
  
  - [ ] 5.7 实现配置持久化
    - 实现 `loadConfig()`, `saveConfig()`
    - 实现 API Key 加密/解密（Electron safeStorage）
    - 实现配置文件读写（%APPDATA%/mshell/ai-config.json）
    - 实现配置文件损坏恢复
    - _Requirements: 11.1-11.8, 14.1-14.8_
  
  - [ ] 5.8 实现错误处理
    - 实现各类错误的捕获和转换
    - 实现用户友好的错误信息
    - 实现错误日志记录（不记录敏感信息）
    - _Requirements: 12.1-12.8, 14.3, 14.4_
  
  - [ ]* 5.9 编写 AI Manager 单元测试
    - 测试渠道 CRUD 操作
    - 测试模型 CRUD 操作
    - 测试默认模型设置和清除
    - 测试配置参数验证
    - 测试 API Key 加密/解密
    - 测试缓存机制（命中/未命中）
    - 测试请求取消
    - 测试错误处理
    - _Requirements: 所有_
  
  - [ ]* 5.10 编写 AI Manager 属性测试
    - 实现 Properties 1-5（渠道管理）
    - 实现 Properties 6-11（模型管理）
    - 实现 Properties 12-13（AI 请求）
    - 实现 Properties 14-15（配置管理）
    - 实现 Properties 16（错误处理）
    - 实现 Properties 17-19（性能）
    - 实现 Properties 20-24（安全）
    - 每个属性测试至少 100 次迭代
    - _Requirements: 所有_

- [ ] 6. IPC Handlers 实现
  - [ ] 6.1 创建 IPC Handlers
    - 创建 `electron/ipc/ai-handlers.ts`
    - 导出 `registerAIHandlers(ipcMain, aiManager)` 函数
    - 注册所有 AI 相关的 IPC handlers
    - 实现渠道管理 handlers（addChannel、updateChannel、deleteChannel、verifyChannel、getAllChannels）
    - 实现模型管理 handlers（fetchModels、addModel、deleteModel、getAllModels、setDefaultModel）
    - 实现 AI 请求 handlers（request、cancelRequest）
    - 实现配置管理 handlers（updateConfig、getConfig）
    - 确保 AI Manager 通过 IPC 发送事件到渲染进程（ai:progress、ai:complete、ai:error、ai:cancelled）
    - _Requirements: 所有_
  
  - [ ] 6.2 集成到主进程
    - 在 `electron/main.ts` 中导入 `registerAIHandlers` 和 `AIManager`
    - 在 `app.whenReady()` 中创建 AIManager 实例并初始化
    - 调用 `registerAIHandlers(ipcMain, aiManager)`（在其他 handlers 注册之后）
    - _Requirements: 所有_
  
  - [ ]* 6.3 编写 IPC Handlers 单元测试
    - 测试每个 handler 的调用和响应
    - 测试错误处理
    - 使用 mock AIManager
    - _Requirements: 所有_

- [ ] 7. Preload API 暴露
  - [ ] 7.1 更新 Preload Script
    - 在 `electron/preload.ts` 中添加 `ai` 命名空间
    - 暴露所有 AI 相关的 IPC 调用方法
    - 暴露事件监听方法（onProgress、onComplete、onError、onCancelled）
    - _Requirements: 所有_
  
  - [ ] 7.2 更新 TypeScript 类型定义
    - 在 `electron-env.d.ts` 中添加 `ai` 命名空间类型定义
    - 确保类型与 Preload API 一致
    - _Requirements: 所有_

- [ ] 8. Pinia Store 实现
  - [ ] 8.1 创建 AI Store
    - 创建 `src/stores/ai.ts`
    - 定义 State 接口（channels、models、config、activeRequests、loading、error）
    - 实现 Getters（defaultModel、enabledChannels、modelsByChannel、hasDefaultModel）
    - 实现 Actions（loadChannels、loadModels、loadConfig、addChannel、deleteChannel、setDefaultModel、sendRequest）
    - _Requirements: 所有_
  
  - [ ]* 8.2 编写 Store 单元测试
    - 测试每个 action 的行为
    - 测试 getters 的计算逻辑
    - 使用 mock electronAPI
    - _Requirements: 所有_

- [x] 9. AI Settings Panel 组件
  - [x] 9.1 创建主设置面板
    - 创建 `src/components/AI/AISettingsPanel.vue`
    - 实现标签页布局（渠道管理、模型管理、高级设置）
    - 实现保存和取消按钮
    - 集成 AI Store
    - 添加全局错误边界处理（捕获 AI 请求错误）
    - _Requirements: 15.1-15.13_
  
  - [x] 9.1.5 集成到设置界面
    - 在现有设置界面中添加 "AI 助手" 标签页或菜单项
    - 确保 AI Settings Panel 可以从主设置界面访问
    - _Requirements: 15.1_
  
  - [x] 9.2 创建渠道表单组件
    - 创建 `src/components/AI/AIChannelForm.vue`
    - 实现渠道类型选择器
    - 实现 API Key 输入框（密码类型）
    - 实现自定义 API 地址输入（OpenAI 兼容类型）
    - 实现验证按钮
    - 实现表单验证
    - _Requirements: 1.1-1.10, 15.3-15.5_
  
  - [x] 9.3 创建模型列表组件
    - 创建 `src/components/AI/AIModelList.vue`
    - 实现模型表格（名称、ID、渠道、上下文窗口、类型、默认标记）
    - 实现操作按钮（设置为默认、删除）
    - 实现手动添加模型对话框
    - 实现模型类型标识（自动/手动）
    - _Requirements: 2.1-2.9, 3.1-3.6, 4.1-4.6, 15.6-15.8_
  
  - [x] 9.4 创建高级设置组件
    - 创建 `src/components/AI/AIAdvancedSettings.vue`
    - 实现 Temperature 滑块（0.0 - 2.0）
    - 实现 Max Tokens 输入框（100 - 8000）
    - 实现 Timeout 输入框（5000 - 120000 ms）
    - 实现实时验证和错误提示
    - _Requirements: 10.1-10.6, 15.9-15.10_
  
  - [ ]* 9.5 编写 Settings Panel 组件测试
    - 测试标签页切换
    - 测试表单提交和验证
    - 测试保存和取消逻辑
    - 使用 Vue Test Utils
    - _Requirements: 15.1-15.13_

- [x] 10. Terminal Context Menu 集成
  - [x] 10.1 修改 Terminal 组件
    - 修改 `src/components/Terminal/TerminalView.vue`
    - 监听 xterm.js 的文本选择事件
    - 实现右键菜单构建逻辑
    - 添加 AI 菜单项（撰写、解释、优化）
    - 实现菜单禁用状态逻辑（无默认模型、渠道禁用）
    - 显示当前默认模型名称
    - _Requirements: 5.1-5.6, 6.1-6.8_
  
  - [x] 10.2 实现 AI 操作调用
    - 实现"撰写代码"操作（调用 AI Store 的 sendRequest）
    - 实现"解释代码"操作（打开解释弹窗）
    - 实现"优化代码"操作（调用 AI Store 的 sendRequest）
    - 实现加载指示器显示
    - 实现结果写入终端逻辑
    - _Requirements: 7.1-7.8, 8.1-8.10, 9.1-9.8_
  
  - [ ]* 10.3 编写 Terminal 集成测试
    - 测试文本选择
    - 测试右键菜单显示
    - 测试 AI 操作调用
    - 测试结果写入终端
    - _Requirements: 5.1-5.6, 6.1-6.8, 7.1-7.8, 8.1-8.10, 9.1-9.8_

- [x] 11. AI Explanation Dialog 组件
  - [x] 11.1 创建解释弹窗组件
    - 创建 `src/components/AI/AIExplanationDialog.vue`
    - 实现 Markdown 渲染（使用 marked 库）
    - 实现代码块高亮
    - 实现滚动查看
    - 实现加载状态显示
    - 实现错误状态显示
    - 实现复制按钮
    - 实现关闭按钮
    - _Requirements: 8.1-8.10_
    - **Note: 已在 Task 10 中实现为 TerminalView.vue 的内联对话框**
  
  - [ ]* 11.2 编写 Explanation Dialog 组件测试
    - 测试 Markdown 渲染
    - 测试加载状态
    - 测试错误状态
    - 测试复制功能
    - 使用 Vue Test Utils
    - _Requirements: 8.1-8.10_

- [x] 12. 备份系统集成
  - [x] 12.1 修改 Backup Manager
    - 修改 `electron/managers/BackupManager.ts`
    - 在 `BackupData` 接口中添加 `aiConfig?: any` 字段
    - 在 `collectSSHKeysWithPrivateKeys()` 之后添加 `collectAIConfig()` 方法
    - 在备份创建时包含 AI 配置文件（ai-config.json）
    - 在备份恢复时恢复 AI 配置文件
    - 在 `applyBackup()` 方法的 options 中添加 `restoreAIConfig?: boolean`
    - 处理配置格式不兼容的情况（旧版本备份没有 aiConfig 字段）
    - _Requirements: 17.1-17.8_
  
  - [ ]* 12.2 编写备份集成测试
    - 测试备份包含 AI 配置
    - 测试备份恢复 AI 配置
    - 测试加密 API Key 的备份和恢复
    - 测试配置格式不兼容的处理
    - _Requirements: 17.1-17.8_

- [ ] 13. Checkpoint 任务
  - [x] 13.1 Checkpoint: 基础设施完成
    - 验证所有依赖已安装 ✅
    - 验证类型定义正确 ✅
    - 验证 Language Detector 工作正常 ✅
    - 验证所有 Provider Adapters 工作正常 ✅
    - _Checkpoint after: Task 4_
  
  - [x] 13.2 Checkpoint: 主进程完成
    - 验证 AI Manager 所有功能正常 ✅
    - 验证 IPC Handlers 正确注册 ✅
    - 验证配置持久化工作正常 ✅
    - 验证 API Key 加密/解密正常 ✅
    - _Checkpoint after: Task 7_
  
  - [x] 13.3 Checkpoint: UI 组件完成
    - 验证 AI Settings Panel 正常工作 ✅
    - 验证所有表单验证正确 ✅
    - 验证配置保存和加载正常 ✅
    - _Checkpoint after: Task 9_
  
  - [x] 13.4 Checkpoint: 终端集成完成
    - 验证终端右键菜单正常显示 ✅
    - 验证 AI 操作正确调用 ✅
    - 验证结果正确写入终端 ✅
    - 验证解释弹窗正常显示 ✅
    - _Checkpoint after: Task 11_
  
  - [x] 13.5 Checkpoint: 完整功能验证
    - 端到端测试：配置渠道 → 获取模型 → 设置默认模型 → 使用 AI 功能 ✅
    - 验证所有错误处理正常 ✅
    - 验证性能优化（缓存、取消）正常 ✅
    - 验证安全性（加密、HTTPS）正常 ✅
    - 验证备份恢复正常 ✅
    - _Checkpoint after: Task 12_
  
  - [ ]* 13.6 Checkpoint: 测试覆盖率
    - 运行所有单元测试
    - 运行所有属性测试
    - 运行所有集成测试
    - 验证代码覆盖率达到 80%
    - _Checkpoint after: All tasks_

## Notes

- 标记为 "*" 的任务为可选任务（主要是测试相关）
- Checkpoint 任务用于验证阶段性成果
- 所有属性测试必须至少运行 100 次迭代
- 所有测试必须标注对应的设计文档属性编号
- 实现过程中应该遵循现有代码风格和架构模式
- 所有代码必须通过 TypeScript 诊断检查
- 所有 API Key 必须加密存储
- 所有错误必须有用户友好的提示信息

## Dependencies

- Task 2 依赖 Task 1（类型定义依赖依赖安装）
- Task 3 依赖 Task 2（Language Detector 依赖类型定义）
- Task 4 依赖 Task 2（Provider Adapters 依赖类型定义）
- Task 5 依赖 Task 3, 4（AI Manager 依赖 Language Detector 和 Provider Adapters）
- Task 6 依赖 Task 5（IPC Handlers 依赖 AI Manager）
- Task 7 依赖 Task 6（Preload API 依赖 IPC Handlers）
- Task 8 依赖 Task 7（Pinia Store 依赖 Preload API）
- Task 9 依赖 Task 8（Settings Panel 依赖 Pinia Store）
- Task 10 依赖 Task 8（Terminal 集成依赖 Pinia Store）
- Task 11 依赖 Task 8（Explanation Dialog 依赖 Pinia Store）
- Task 12 依赖 Task 5（备份集成依赖 AI Manager）
- Task 13 依赖所有前置任务（Checkpoint 任务）

## Estimated Timeline

- Task 1: 0.5 小时
- Task 2: 1 小时
- Task 3: 2 小时（含测试）
- Task 4: 6 小时（含测试）
- Task 5: 12 小时（含测试）
- Task 6: 2 小时（含测试）
- Task 7: 1 小时
- Task 8: 2 小时（含测试）
- Task 9: 8 小时（含测试）
- Task 10: 4 小时（含测试）
- Task 11: 3 小时（含测试）
- Task 12: 2 小时（含测试）
- Task 13: 4 小时（验证和调试）

**总计**: 约 47.5 小时（包含所有测试）
**核心功能**: 约 30 小时（不包含可选测试任务）

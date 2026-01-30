# Requirements Document: AI Assistant Integration

## Introduction

本文档定义了 MShell AI 助手功能的需求。AI 助手将集成到 SSH 终端中，为用户提供代码撰写、解释和优化功能。系统支持多个 AI 提供商（OpenAI、Anthropic、Google Gemini 及 OpenAI 兼容 API），允许用户配置多个渠道并管理模型，通过右键菜单在终端中直接调用 AI 功能。

## Glossary

- **AI_Manager**: AI 管理器，负责管理 AI 提供商、模型和请求处理
- **AI_Provider**: AI 服务提供商，如 OpenAI、Anthropic、Gemini
- **AI_Model**: AI 模型，如 GPT-4、Claude-3、Gemini-Pro
- **AI_Channel**: AI 渠道，用户配置的具体 AI 服务实例
- **Default_Model**: 默认模型，系统所有 AI 功能使用的模型
- **Code_Action**: 代码操作类型，包括撰写(write)、解释(explain)、优化(optimize)
- **Context_Menu**: 上下文菜单，终端中的右键菜单
- **Terminal_Selection**: 终端选中文本

## Requirements

### Requirement 1: AI 渠道管理

**User Story:** 作为用户，我希望能够添加和管理多个 AI 服务渠道，以便使用不同的 AI 提供商。

#### Acceptance Criteria

1. WHEN 用户添加新的 AI 渠道 THEN THE AI_Manager SHALL 保存渠道配置（名称、类型、API Key、API 地址）
2. WHEN 用户选择 OpenAI 类型 THEN THE AI_Manager SHALL 使用 OpenAI 官方 API 端点
3. WHEN 用户选择 Anthropic 类型 THEN THE AI_Manager SHALL 使用 Anthropic Claude API 端点
4. WHEN 用户选择 Gemini 类型 THEN THE AI_Manager SHALL 使用 Google Gemini API 端点
5. WHEN 用户选择 OpenAI 兼容类型 THEN THE AI_Manager SHALL 允许用户指定自定义 API 地址
6. WHEN 用户添加渠道后 THEN THE AI_Manager SHALL 验证 API Key 的有效性
7. WHEN API Key 无效 THEN THE AI_Manager SHALL 返回明确的错误信息
8. WHEN 用户更新渠道配置 THEN THE AI_Manager SHALL 保存更新并重新验证
9. WHEN 用户删除渠道 THEN THE AI_Manager SHALL 移除渠道及其关联的所有模型
10. WHEN 用户启用或禁用渠道 THEN THE AI_Manager SHALL 更新渠道状态

### Requirement 2: 模型自动获取

**User Story:** 作为用户，我希望系统能够自动获取 AI 渠道支持的模型列表，以便快速选择可用模型。

#### Acceptance Criteria

1. WHEN 用户添加 OpenAI 渠道成功后 THEN THE AI_Manager SHALL 自动调用 API 获取可用模型列表
2. WHEN 用户添加 Anthropic 渠道成功后 THEN THE AI_Manager SHALL 加载预定义的 Claude 模型列表
3. WHEN 用户添加 Gemini 渠道成功后 THEN THE AI_Manager SHALL 加载预定义的 Gemini 模型列表
4. WHEN 用户添加 OpenAI 兼容渠道成功后 THEN THE AI_Manager SHALL 尝试调用 /v1/models 端点获取模型列表
5. WHEN 用户手动点击"获取模型"按钮 THEN THE AI_Manager SHALL 重新获取该渠道的模型列表
6. WHEN 模型获取成功 THEN THE AI_Manager SHALL 保存模型信息（模型 ID、显示名称、上下文窗口大小）
7. WHEN 模型获取失败 THEN THE AI_Manager SHALL 显示错误信息但保留渠道配置
8. THE AI_Manager SHALL 为每个模型标记其来源渠道
9. THE AI_Manager SHALL 为自动获取的模型标记为"自动"类型

### Requirement 3: 模型手动管理

**User Story:** 作为用户，我希望能够手动添加和删除模型，以便使用自动获取未包含的模型。

#### Acceptance Criteria

1. WHEN 用户手动添加模型 THEN THE AI_Manager SHALL 要求用户提供模型 ID、显示名称、所属渠道和上下文窗口大小
2. WHEN 用户提供完整的模型信息 THEN THE AI_Manager SHALL 保存模型并标记为"手动"类型
3. WHEN 用户删除手动添加的模型 THEN THE AI_Manager SHALL 移除该模型
4. WHEN 用户删除自动获取的模型 THEN THE AI_Manager SHALL 移除该模型（允许删除不需要的自动模型）
5. THE AI_Manager SHALL 允许用户编辑手动添加模型的显示名称和上下文窗口大小
6. THE AI_Manager SHALL 不允许编辑自动获取模型的核心信息

### Requirement 4: 默认模型设置

**User Story:** 作为用户，我希望能够设置一个默认模型，以便所有 AI 功能使用该模型。

#### Acceptance Criteria

1. WHEN 用户选择一个模型并设置为默认 THEN THE AI_Manager SHALL 保存默认模型配置
2. WHEN 用户设置新的默认模型 THEN THE AI_Manager SHALL 清除之前的默认模型标记
3. WHEN 系统中只有一个模型 THEN THE AI_Manager SHALL 自动将其设置为默认模型
4. WHEN 用户删除默认模型所属的渠道 THEN THE AI_Manager SHALL 清除默认模型设置
5. WHEN 没有设置默认模型 THEN THE AI_Manager SHALL 在用户尝试使用 AI 功能时提示"请先配置默认模型"
6. THE AI_Manager SHALL 在模型列表中明确标识默认模型

### Requirement 5: 终端代码选择

**User Story:** 作为用户，我希望能够在终端中选择代码文本，以便对其执行 AI 操作。

#### Acceptance Criteria

1. WHEN 用户在终端中拖动鼠标 THEN THE Terminal_Component SHALL 选中文本
2. WHEN 用户双击终端中的单词 THEN THE Terminal_Component SHALL 选中该单词
3. WHEN 用户三击终端中的行 THEN THE Terminal_Component SHALL 选中整行
4. WHEN 用户选中文本后 THEN THE Terminal_Component SHALL 高亮显示选中的文本
5. THE Terminal_Component SHALL 保存当前选中的文本内容
6. WHEN 用户点击终端其他位置 THEN THE Terminal_Component SHALL 清除选中状态

### Requirement 6: AI 上下文菜单

**User Story:** 作为用户，我希望在选中代码后右键显示 AI 功能菜单，以便快速调用 AI 功能。

#### Acceptance Criteria

1. WHEN 用户在终端中选中文本后右键点击 THEN THE Context_Menu SHALL 显示包含 AI 选项的菜单
2. THE Context_Menu SHALL 包含"AI 撰写代码"选项
3. THE Context_Menu SHALL 包含"AI 解释代码"选项
4. THE Context_Menu SHALL 包含"AI 优化代码"选项
5. WHEN 用户未选中文本时右键点击 THEN THE Context_Menu SHALL 不显示 AI 选项
6. WHEN 没有配置默认模型时 THEN THE Context_Menu SHALL 显示 AI 选项但标记为禁用状态
7. WHEN 默认模型所属渠道被禁用时 THEN THE Context_Menu SHALL 显示 AI 选项但标记为禁用状态
8. THE Context_Menu SHALL 在 AI 选项旁显示当前默认模型的名称

### Requirement 7: AI 代码撰写

**User Story:** 作为用户，我希望能够通过 AI 根据描述生成代码，以便快速编写代码片段。

#### Acceptance Criteria

1. WHEN 用户选中代码描述文本并选择"AI 撰写代码" THEN THE AI_Manager SHALL 将文本作为提示词发送给默认模型
2. WHEN AI 返回生成的代码 THEN THE AI_Manager SHALL 将代码直接写入终端当前光标位置
3. WHEN AI 请求进行中 THEN THE Terminal_Component SHALL 显示加载指示器
4. WHEN AI 请求失败 THEN THE AI_Manager SHALL 显示错误提示但不写入任何内容
5. THE AI_Manager SHALL 构建提示词："Write code based on this description: [用户选中的文本]"
6. THE AI_Manager SHALL 指示 AI 只返回代码，不包含解释
7. WHEN 生成的代码包含代码块标记（```）THEN THE AI_Manager SHALL 自动移除标记只保留代码内容
8. THE AI_Manager SHALL 在代码写入前自动在终端中换行

### Requirement 8: AI 代码解释

**User Story:** 作为用户，我希望能够通过 AI 解释选中的代码，以便理解代码的功能和逻辑。

#### Acceptance Criteria

1. WHEN 用户选中代码并选择"AI 解释代码" THEN THE AI_Manager SHALL 将代码发送给默认模型请求解释
2. WHEN AI 返回解释内容 THEN THE AI_Manager SHALL 在弹窗中显示解释文本
3. THE AI_Manager SHALL 构建提示词："Explain this code in detail: [用户选中的代码]"
4. THE AI_Manager SHALL 指示 AI 提供清晰、简洁的解释
5. WHEN 解释内容较长 THEN THE 弹窗 SHALL 支持滚动查看
6. THE 弹窗 SHALL 提供"复制"按钮允许用户复制解释内容
7. THE 弹窗 SHALL 提供"关闭"按钮关闭弹窗
8. WHEN AI 请求进行中 THEN THE 弹窗 SHALL 显示加载状态
9. WHEN AI 请求失败 THEN THE 弹窗 SHALL 显示错误信息
10. THE 弹窗 SHALL 支持 Markdown 格式渲染（如代码块、列表）

### Requirement 9: AI 代码优化

**User Story:** 作为用户，我希望能够通过 AI 优化选中的代码，以便改进代码质量和性能。

#### Acceptance Criteria

1. WHEN 用户选中代码并选择"AI 优化代码" THEN THE AI_Manager SHALL 将代码发送给默认模型请求优化
2. WHEN AI 返回优化后的代码 THEN THE AI_Manager SHALL 将优化后的代码直接写入终端当前光标位置
3. THE AI_Manager SHALL 构建提示词："Optimize this code: [用户选中的代码]"
4. THE AI_Manager SHALL 指示 AI 只返回优化后的代码，不包含解释
5. WHEN 优化后的代码包含代码块标记（```）THEN THE AI_Manager SHALL 自动移除标记只保留代码内容
6. THE AI_Manager SHALL 在代码写入前自动在终端中换行
7. WHEN AI 请求进行中 THEN THE Terminal_Component SHALL 显示加载指示器
8. WHEN AI 请求失败 THEN THE AI_Manager SHALL 显示错误提示但不写入任何内容

### Requirement 10: AI 请求配置

**User Story:** 作为用户，我希望能够配置 AI 请求的参数，以便控制 AI 的行为。

#### Acceptance Criteria

1. THE AI_Manager SHALL 支持配置 Temperature 参数（0.0 - 2.0）
2. THE AI_Manager SHALL 支持配置 Max Tokens 参数（100 - 8000）
3. THE AI_Manager SHALL 支持配置请求超时时间（5000ms - 120000ms）
4. WHEN 用户修改配置 THEN THE AI_Manager SHALL 保存配置并应用到后续请求
5. THE AI_Manager SHALL 为每个参数提供合理的默认值（Temperature: 0.7, Max Tokens: 2000, Timeout: 30000ms）
6. WHEN 用户输入无效的参数值 THEN THE AI_Manager SHALL 拒绝保存并提示有效范围

### Requirement 11: AI 配置持久化

**User Story:** 作为用户，我希望系统能够保存我的 AI 配置，以便下次使用时无需重新配置。

#### Acceptance Criteria

1. WHEN 用户添加或修改 AI 渠道 THEN THE AI_Manager SHALL 将配置保存到本地存储
2. WHEN 用户添加或修改模型 THEN THE AI_Manager SHALL 将模型信息保存到本地存储
3. WHEN 用户设置默认模型 THEN THE AI_Manager SHALL 保存默认模型 ID
4. WHEN 用户修改 AI 请求参数 THEN THE AI_Manager SHALL 保存参数配置
5. WHEN 应用启动 THEN THE AI_Manager SHALL 加载所有已保存的配置
6. THE AI_Manager SHALL 使用 JSON 格式存储配置文件
7. THE AI_Manager SHALL 将配置文件保存在用户数据目录（%APPDATA%/mshell/ai-config.json）
8. THE AI_Manager SHALL 加密存储 API Key（使用 Electron safeStorage）

### Requirement 12: 错误处理和用户反馈

**User Story:** 作为用户，我希望在 AI 功能出错时能够获得清晰的错误提示，以便了解问题并采取行动。

#### Acceptance Criteria

1. WHEN API Key 无效 THEN THE AI_Manager SHALL 显示"API Key 无效，请检查配置"
2. WHEN 网络请求超时 THEN THE AI_Manager SHALL 显示"请求超时，请检查网络连接"
3. WHEN API 返回错误 THEN THE AI_Manager SHALL 显示 API 返回的错误信息
4. WHEN 达到 API 速率限制 THEN THE AI_Manager SHALL 显示"请求过于频繁，请稍后再试"
5. WHEN 模型不存在或不可用 THEN THE AI_Manager SHALL 显示"模型不可用，请选择其他模型"
6. WHEN 请求内容超过模型上下文窗口 THEN THE AI_Manager SHALL 显示"内容过长，请减少选中的文本"
7. WHEN 渠道被禁用 THEN THE AI_Manager SHALL 显示"AI 渠道已禁用，请在设置中启用"
8. WHEN 发生未知错误 THEN THE AI_Manager SHALL 显示通用错误信息并记录详细日志

### Requirement 13: 性能和用户体验

**User Story:** 作为用户，我希望 AI 功能响应迅速且不影响终端的正常使用，以便获得流畅的体验。

#### Acceptance Criteria

1. WHEN AI 请求进行中 THEN THE Terminal_Component SHALL 保持响应，用户可以继续输入
2. WHEN AI 请求进行中 THEN THE AI_Manager SHALL 显示加载指示器（旋转图标或进度条）
3. WHEN AI 请求超过 5 秒未响应 THEN THE AI_Manager SHALL 显示"请求处理中，请稍候"提示
4. THE AI_Manager SHALL 支持取消正在进行的 AI 请求
5. WHEN 用户取消请求 THEN THE AI_Manager SHALL 中止请求并清除加载状态
6. THE AI_Manager SHALL 缓存最近的 AI 响应（最多 10 条）
7. WHEN 用户对相同内容重复请求 THEN THE AI_Manager SHALL 优先使用缓存结果
8. THE AI_Manager SHALL 限制单次请求的最大文本长度（默认 10000 字符）

### Requirement 14: 安全性和隐私

**User Story:** 作为用户，我希望我的 API Key 和代码内容得到安全保护，以便保护隐私和安全。

#### Acceptance Criteria

1. WHEN 用户输入 API Key THEN THE AI_Manager SHALL 使用密码输入框隐藏字符
2. WHEN 保存 API Key THEN THE AI_Manager SHALL 使用 Electron safeStorage 加密存储
3. THE AI_Manager SHALL 不在日志中记录 API Key 的明文
4. THE AI_Manager SHALL 不在日志中记录用户选中的代码内容（除非用户明确启用调试日志）
5. WHEN 用户删除渠道 THEN THE AI_Manager SHALL 同时删除存储的 API Key
6. THE AI_Manager SHALL 使用 HTTPS 协议与 AI 服务通信
7. THE AI_Manager SHALL 验证 API 响应的完整性
8. WHEN 检测到异常的 API 响应 THEN THE AI_Manager SHALL 拒绝处理并记录安全日志

### Requirement 15: 设置界面

**User Story:** 作为用户，我希望有一个直观的设置界面来管理 AI 配置，以便轻松配置和管理 AI 功能。

#### Acceptance Criteria

1. THE AI_Manager SHALL 在应用设置中提供"AI 助手"配置页面
2. THE 配置页面 SHALL 使用标签页组织：渠道管理、模型管理、高级设置
3. WHEN 用户打开渠道管理标签 THEN THE 配置页面 SHALL 显示所有已配置的渠道列表
4. THE 渠道列表 SHALL 显示渠道名称、类型、API 地址、启用状态
5. THE 渠道列表 SHALL 提供"添加渠道"、"编辑"、"删除"、"获取模型"按钮
6. WHEN 用户打开模型管理标签 THEN THE 配置页面 SHALL 显示所有可用模型列表
7. THE 模型列表 SHALL 显示模型名称、模型 ID、所属渠道、上下文窗口、默认标记、类型（自动/手动）
8. THE 模型列表 SHALL 提供"手动添加模型"、"设置为默认"、"删除"按钮
9. WHEN 用户打开高级设置标签 THEN THE 配置页面 SHALL 显示 Temperature、Max Tokens、Timeout 配置项
10. THE 配置页面 SHALL 实时验证用户输入并显示错误提示
11. THE 配置页面 SHALL 提供"保存"和"取消"按钮
12. WHEN 用户点击"保存" THEN THE AI_Manager SHALL 验证并保存所有配置
13. WHEN 用户点击"取消" THEN THE 配置页面 SHALL 恢复到上次保存的状态

### Requirement 16: 语言检测

**User Story:** 作为用户，我希望系统能够自动检测代码语言，以便 AI 提供更准确的解释和优化。

#### Acceptance Criteria

1. WHEN 用户选中代码并请求解释或优化 THEN THE AI_Manager SHALL 尝试检测代码语言
2. THE AI_Manager SHALL 支持检测常见编程语言（Python、JavaScript、TypeScript、Java、C++、Go、Rust、Shell 等）
3. WHEN 检测到代码语言 THEN THE AI_Manager SHALL 在提示词中包含语言信息
4. WHEN 无法检测语言 THEN THE AI_Manager SHALL 使用通用提示词
5. THE AI_Manager SHALL 基于代码特征（关键字、语法）进行语言检测
6. THE AI_Manager SHALL 优先检测 Shell 脚本语言（因为在 SSH 终端中最常见）

### Requirement 17: 备份和恢复

**User Story:** 作为用户，我希望 AI 配置能够包含在系统备份中，以便在恢复时保留 AI 设置。

#### Acceptance Criteria

1. WHEN 用户创建系统备份 THEN THE Backup_Manager SHALL 包含 AI 配置文件
2. THE 备份 SHALL 包含所有渠道配置（包括加密的 API Key）
3. THE 备份 SHALL 包含所有模型配置
4. THE 备份 SHALL 包含默认模型设置
5. THE 备份 SHALL 包含 AI 请求参数配置
6. WHEN 用户恢复备份 THEN THE AI_Manager SHALL 恢复所有 AI 配置
7. WHEN 恢复的配置包含加密的 API Key THEN THE AI_Manager SHALL 正确解密并使用
8. WHEN 恢复的配置格式不兼容 THEN THE AI_Manager SHALL 使用默认配置并提示用户

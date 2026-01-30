<template>
  <div class="ai-settings-panel">
    <el-tabs v-model="activeTab" class="ai-tabs">
      <!-- 渠道管理 -->
      <el-tab-pane label="渠道管理" name="channels">
        <div class="settings-section">
          <div class="section-header">
            <h3>AI 渠道</h3>
            <el-button type="primary" :icon="Plus" @click="showAddChannelDialog = true">
              添加渠道
            </el-button>
          </div>

          <el-table :data="channels" style="width: 100%">
            <el-table-column prop="name" label="名称" min-width="150" />
            <el-table-column label="类型" width="150">
              <template #default="{ row }">
                <el-tag :type="getChannelTypeTag(row.type)">
                  {{ getChannelTypeName(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="apiEndpoint" label="API 地址" min-width="200">
              <template #default="{ row }">
                {{ row.apiEndpoint || getDefaultEndpoint(row.type) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-switch 
                  v-model="row.enabled" 
                  @change="handleChannelToggle(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="250" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  link 
                  size="small"
                  @click="verifyChannel(row)"
                  :loading="verifyingChannelId === row.id"
                >
                  验证
                </el-button>
                <el-button 
                  type="success" 
                  link 
                  size="small"
                  @click="fetchChannelModels(row)"
                  :loading="fetchingChannelId === row.id"
                >
                  获取模型
                </el-button>
                <el-button 
                  type="warning" 
                  link 
                  size="small"
                  @click="editChannel(row)"
                >
                  编辑
                </el-button>
                <el-button 
                  type="danger" 
                  link 
                  size="small"
                  @click="deleteChannel(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="channels.length === 0" description="暂无 AI 渠道，请添加" />
        </div>
      </el-tab-pane>

      <!-- 模型管理 -->
      <el-tab-pane label="模型管理" name="models">
        <div class="settings-section">
          <div class="section-header">
            <div style="display: flex; align-items: center; gap: 16px;">
              <h3>AI 模型</h3>
              <el-select 
                v-model="filterChannelId" 
                placeholder="筛选渠道" 
                clearable
                size="default"
                style="width: 200px"
              >
                <el-option
                  v-for="channel in channels"
                  :key="channel.id"
                  :label="channel.name"
                  :value="channel.id"
                />
              </el-select>
            </div>
            <el-button type="primary" :icon="Plus" @click="showAddModelDialog = true">
              手动添加模型
            </el-button>
          </div>

          <el-table :data="filteredModels" style="width: 100%">
            <el-table-column prop="displayName" label="模型名称" min-width="150" />
            <el-table-column prop="modelId" label="模型 ID" min-width="150" />
            <el-table-column label="所属渠道" width="150">
              <template #default="{ row }">
                {{ getChannelName(row.channelId) }}
              </template>
            </el-table-column>
            <el-table-column label="上下文窗口" width="120">
              <template #default="{ row }">
                {{ formatContextWindow(row.contextWindow) }}
              </template>
            </el-table-column>
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'auto' ? 'success' : 'info'" size="small">
                  {{ row.type === 'auto' ? '自动' : '手动' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="默认" width="80">
              <template #default="{ row }">
                <el-icon v-if="isDefaultModel(row.id)" color="#67C23A" :size="20">
                  <Check />
                </el-icon>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button 
                  v-if="!isDefaultModel(row.id)"
                  type="primary" 
                  link 
                  size="small"
                  @click="setAsDefault(row)"
                >
                  设为默认
                </el-button>
                <el-button 
                  type="danger" 
                  link 
                  size="small"
                  @click="deleteModel(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="models.length === 0" description="暂无模型，请先添加渠道并获取模型" />
        </div>
      </el-tab-pane>

      <!-- 高级设置 -->
      <el-tab-pane label="高级设置" name="advanced">
        <div class="settings-section">
          <h3>AI 请求参数</h3>
          <el-form label-position="left" label-width="150px">
            <el-form-item label="Temperature">
              <div class="slider-container">
                <el-slider 
                  v-model="config.temperature" 
                  :min="0" 
                  :max="2"
                  :step="0.1"
                  show-input
                  :input-size="'small'"
                  style="width: 300px"
                />
                <span class="form-hint">控制输出的随机性 (0.0 - 2.0)</span>
              </div>
            </el-form-item>
            <el-form-item label="Max Tokens">
              <div class="slider-container">
                <el-input-number 
                  v-model="config.maxTokens" 
                  :min="100" 
                  :max="100000"
                  :step="100"
                  style="width: 200px"
                />
                <span class="form-hint">最大生成令牌数 (100 - 100000)</span>
              </div>
            </el-form-item>
            <el-form-item label="请求超时">
              <div class="slider-container">
                <el-input-number 
                  v-model="config.timeout" 
                  :min="5000" 
                  :max="120000"
                  :step="5000"
                  style="width: 200px"
                />
                <span class="form-hint">毫秒 (5000 - 120000)</span>
              </div>
            </el-form-item>
          </el-form>

          <el-alert 
            type="info" 
            :closable="false"
            show-icon
            style="margin-top: 20px"
          >
            <template #title>
              <div>
                <p><strong>参数说明：</strong></p>
                <ul style="margin: 8px 0; padding-left: 20px;">
                  <li><strong>Temperature</strong>: 值越高，输出越随机；值越低，输出越确定</li>
                  <li><strong>Max Tokens</strong>: 限制 AI 生成的最大长度</li>
                  <li><strong>请求超时</strong>: AI 请求的最大等待时间</li>
                </ul>
              </div>
            </template>
          </el-alert>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑渠道对话框 -->
    <AIChannelForm
      v-model:visible="showAddChannelDialog"
      :channel="editingChannel"
      @saved="handleChannelSaved"
    />

    <!-- 添加模型对话框 -->
    <AIModelForm
      v-model:visible="showAddModelDialog"
      :channels="channels"
      @saved="handleModelSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Check } from '@element-plus/icons-vue'
import { useAIStore } from '@/stores/ai'
import AIChannelForm from './AIChannelForm.vue'
import AIModelForm from './AIModelForm.vue'
import type { AIChannel, AIModel } from '@/types/ai'

const aiStore = useAIStore()

const activeTab = ref('channels')
const showAddChannelDialog = ref(false)
const showAddModelDialog = ref(false)
const editingChannel = ref<AIChannel | null>(null)
const verifyingChannelId = ref<string | null>(null)
const fetchingChannelId = ref<string | null>(null)
const filterChannelId = ref('')

// 从 store 获取数据
const channels = computed(() => aiStore.channels)
const models = computed(() => aiStore.models)
const filteredModels = computed(() => {
  if (!filterChannelId.value) {
    return models.value
  }
  return models.value.filter(m => m.channelId === filterChannelId.value)
})

const config = computed({
  get: () => aiStore.config,
  set: (value) => {
    aiStore.config = value
  }
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    await Promise.all([
      aiStore.loadChannels(),
      aiStore.loadModels(),
      aiStore.loadConfig()
    ])
  } catch (error: any) {
    ElMessage.error(`加载数据失败: ${error.message}`)
  }
}

// 渠道类型相关
const getChannelTypeName = (type: string) => {
  const names: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'gemini': 'Google Gemini',
    'openai-compatible': 'OpenAI 兼容'
  }
  return names[type] || type
}

const getChannelTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    'openai': 'primary',
    'anthropic': 'success',
    'gemini': 'warning',
    'openai-compatible': 'info'
  }
  return tags[type] || ''
}

const getDefaultEndpoint = (type: string) => {
  const endpoints: Record<string, string> = {
    'openai': 'https://api.openai.com/v1',
    'anthropic': 'https://api.anthropic.com/v1',
    'gemini': 'https://generativelanguage.googleapis.com/v1',
    'openai-compatible': '自定义'
  }
  return endpoints[type] || ''
}

// 渠道操作
const handleChannelToggle = async (channel: AIChannel) => {
  try {
    await aiStore.updateChannel(channel.id, { enabled: channel.enabled })
    ElMessage.success(channel.enabled ? '渠道已启用' : '渠道已禁用')
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`)
    // 恢复状态
    channel.enabled = !channel.enabled
  }
}

const verifyChannel = async (channel: AIChannel) => {
  verifyingChannelId.value = channel.id
  try {
    const result = await window.electronAPI.ai?.verifyChannel(channel.id)
    if (result?.success) {
      ElMessage.success('渠道验证成功')
    } else {
      ElMessage.error(`验证失败: ${result?.error || '未知错误'}`)
    }
  } catch (error: any) {
    ElMessage.error(`验证失败: ${error.message}`)
  } finally {
    verifyingChannelId.value = null
  }
}

const fetchChannelModels = async (channel: AIChannel) => {
  fetchingChannelId.value = channel.id
  try {
    await aiStore.fetchModels(channel.id)
    ElMessage.success('模型获取成功')
  } catch (error: any) {
    ElMessage.error(`获取模型失败: ${error.message}`)
  } finally {
    fetchingChannelId.value = null
  }
}

const editChannel = (channel: AIChannel) => {
  editingChannel.value = { ...channel }
  showAddChannelDialog.value = true
}

const deleteChannel = async (channel: AIChannel) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除渠道 "${channel.name}" 吗？删除后，该渠道的所有模型也将被删除。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )

    await aiStore.deleteChannel(channel.id)
    ElMessage.success('渠道已删除')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`删除失败: ${error.message}`)
    }
  }
}

const handleChannelSaved = () => {
  showAddChannelDialog.value = false
  editingChannel.value = null
  loadData()
}

// 模型操作
const getChannelName = (channelId: string) => {
  const channel = channels.value.find(c => c.id === channelId)
  return channel?.name || '未知渠道'
}

const formatContextWindow = (size: number) => {
  if (size >= 1000000) {
    return `${(size / 1000000).toFixed(1)}M`
  } else if (size >= 1000) {
    return `${(size / 1000).toFixed(0)}K`
  }
  return size.toString()
}

const isDefaultModel = (modelId: string) => {
  return aiStore.config.defaultModelId === modelId
}

const setAsDefault = async (model: AIModel) => {
  try {
    await aiStore.setDefaultModel(model.id)
    ElMessage.success(`已将 "${model.displayName}" 设为默认模型`)
  } catch (error: any) {
    ElMessage.error(`设置失败: ${error.message}`)
  }
}

const deleteModel = async (model: AIModel) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模型 "${model.displayName}" 吗？`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )

    await aiStore.deleteModel(model.id)
    ElMessage.success('模型已删除')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`删除失败: ${error.message}`)
    }
  }
}

const handleModelSaved = () => {
  showAddModelDialog.value = false
  loadData()
}


</script>

<style scoped>
.ai-settings-panel {
  width: 100%;
  height: 100%;
}

.ai-tabs {
  height: 100%;
}

.ai-tabs :deep(.el-tabs__content) {
  height: calc(100% - 55px);
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.settings-section {
  margin-bottom: var(--spacing-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.settings-section h3 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.form-hint {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.text-hint {
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

.el-empty {
  padding: var(--spacing-2xl) 0;
}
</style>

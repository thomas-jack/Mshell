<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEditing ? '编辑渠道' : '添加渠道'"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="渠道名称" prop="name">
        <el-input 
          v-model="formData.name" 
          placeholder="例如：OpenAI 官方"
        />
      </el-form-item>

      <el-form-item label="渠道类型" prop="type">
        <el-select 
          v-model="formData.type" 
          placeholder="请选择渠道类型"
          style="width: 100%"
          @change="handleTypeChange"
        >
          <el-option label="OpenAI" value="openai" />
          <el-option label="Anthropic Claude" value="anthropic" />
          <el-option label="Google Gemini" value="gemini" />
          <el-option label="OpenAI 兼容 API" value="openai-compatible" />
        </el-select>
      </el-form-item>

      <el-form-item label="API Key" prop="apiKey">
        <el-input 
          v-model="formData.apiKey" 
          type="password"
          show-password
          placeholder="请输入 API Key"
        />
      </el-form-item>

      <el-form-item 
        v-if="formData.type === 'openai-compatible'" 
        label="API 地址" 
        prop="apiEndpoint"
      >
        <el-input 
          v-model="formData.apiEndpoint" 
          placeholder="例如：https://api.example.com/v1"
        />
        <span class="form-hint">请输入完整的 API 端点地址</span>
      </el-form-item>

      <el-form-item label="启用渠道">
        <el-switch v-model="formData.enabled" />
      </el-form-item>

      <el-alert 
        v-if="formData.type"
        type="info" 
        :closable="false"
        show-icon
        style="margin-top: 12px"
      >
        <template #title>
          <div v-if="formData.type === 'openai'">
            <p><strong>OpenAI 官方 API</strong></p>
            <p>API 地址：https://api.openai.com/v1</p>
            <p>支持模型：GPT-4, GPT-3.5-Turbo 等</p>
          </div>
          <div v-else-if="formData.type === 'anthropic'">
            <p><strong>Anthropic Claude API</strong></p>
            <p>API 地址：https://api.anthropic.com/v1</p>
            <p>支持模型：Claude 3 Opus, Sonnet, Haiku 等</p>
          </div>
          <div v-else-if="formData.type === 'gemini'">
            <p><strong>Google Gemini API</strong></p>
            <p>API 地址：https://generativelanguage.googleapis.com/v1</p>
            <p>支持模型：Gemini Pro, Gemini Pro Vision 等</p>
          </div>
          <div v-else-if="formData.type === 'openai-compatible'">
            <p><strong>OpenAI 兼容 API</strong></p>
            <p>支持任何兼容 OpenAI API 格式的服务</p>
            <p>例如：本地部署的 LLM、第三方代理服务等</p>
          </div>
        </template>
      </el-alert>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button 
        type="primary" 
        @click="handleSubmit"
        :loading="saving"
      >
        {{ isEditing ? '保存' : '添加' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { AIChannel } from '@/types/ai'

interface Props {
  visible: boolean
  channel?: AIChannel | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const saving = ref(false)

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isEditing = computed(() => !!props.channel)

const formData = ref({
  name: '',
  type: '' as 'openai' | 'anthropic' | 'gemini' | 'openai-compatible' | '',
  apiKey: '',
  apiEndpoint: '',
  enabled: true
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入渠道名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择渠道类型', trigger: 'change' }
  ],
  apiKey: [
    { required: true, message: '请输入 API Key', trigger: 'blur' },
    { min: 20, message: 'API Key 长度至少 20 个字符', trigger: 'blur' }
  ],
  apiEndpoint: [
    { 
      required: true, 
      message: '请输入 API 地址', 
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (formData.value.type === 'openai-compatible' && !value) {
          callback(new Error('OpenAI 兼容类型需要提供 API 地址'))
        } else {
          callback()
        }
      }
    },
    {
      pattern: /^https?:\/\/.+/,
      message: 'API 地址必须以 http:// 或 https:// 开头',
      trigger: 'blur'
    }
  ]
}

// 重置表单函数（需要在 watch 之前定义）
const resetForm = () => {
  formData.value = {
    name: '',
    type: '',
    apiKey: '',
    apiEndpoint: '',
    enabled: true
  }
  formRef.value?.clearValidate()
}

// 监听 channel prop 变化，填充表单
watch(() => props.channel, (channel) => {
  if (channel) {
    formData.value = {
      name: channel.name,
      type: channel.type,
      apiKey: channel.apiKey,
      apiEndpoint: channel.apiEndpoint || '',
      enabled: channel.enabled
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const handleTypeChange = () => {
  // 切换类型时清空 API 地址
  if (formData.value.type !== 'openai-compatible') {
    formData.value.apiEndpoint = ''
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    saving.value = true

    const data = {
      name: formData.value.name,
      type: formData.value.type,
      apiKey: formData.value.apiKey,
      apiEndpoint: formData.value.type === 'openai-compatible' ? formData.value.apiEndpoint : undefined,
      enabled: formData.value.enabled
    }

    if (isEditing.value && props.channel) {
      // 编辑模式
      await window.electronAPI.ai.updateChannel(props.channel.id, data)
      ElMessage.success('渠道已更新')
    } else {
      // 添加模式
      await window.electronAPI.ai.addChannel(data)
      ElMessage.success('渠道已添加')
    }

    emit('saved')
    handleClose()
  } catch (error: any) {
    if (error !== false) { // 表单验证失败会返回 false
      ElMessage.error(`操作失败: ${error.message || error}`)
    }
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  resetForm()
  emit('update:visible', false)
}
</script>

<style scoped>
.form-hint {
  display: block;
  margin-top: 4px;
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

.el-alert :deep(.el-alert__content) {
  line-height: 1.6;
}

.el-alert p {
  margin: 4px 0;
}
</style>

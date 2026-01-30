<template>
  <el-dialog
    v-model="dialogVisible"
    title="手动添加模型"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="所属渠道" prop="channelId">
        <el-select 
          v-model="formData.channelId" 
          placeholder="请选择渠道"
          style="width: 100%"
        >
          <el-option
            v-for="channel in channels"
            :key="channel.id"
            :label="channel.name"
            :value="channel.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="模型 ID" prop="modelId">
        <el-input 
          v-model="formData.modelId" 
          placeholder="例如：gpt-4, claude-3-opus-20240229"
        />
        <span class="form-hint">API 中使用的模型标识符</span>
      </el-form-item>

      <el-form-item label="显示名称" prop="displayName">
        <el-input 
          v-model="formData.displayName" 
          placeholder="例如：GPT-4, Claude 3 Opus"
        />
        <span class="form-hint">在界面中显示的名称</span>
      </el-form-item>

      <el-form-item label="上下文窗口" prop="contextWindow">
        <el-input-number 
          v-model="formData.contextWindow" 
          :min="1000" 
          :max="1000000"
          :step="1000"
          style="width: 200px"
        />
        <span class="form-hint">tokens (1000 - 1000000)</span>
      </el-form-item>

      <el-alert 
        type="info" 
        :closable="false"
        show-icon
        style="margin-top: 12px"
      >
        <template #title>
          <div>
            <p><strong>提示：</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>模型 ID 必须与 API 文档中的标识符完全一致</li>
              <li>上下文窗口大小决定了模型能处理的最大文本长度</li>
              <li>手动添加的模型可以随时删除</li>
            </ul>
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
        添加
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { AIChannel } from '@/types/ai'

interface Props {
  visible: boolean
  channels: AIChannel[]
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

const formData = ref({
  channelId: '',
  modelId: '',
  displayName: '',
  contextWindow: 4096
})

const rules: FormRules = {
  channelId: [
    { required: true, message: '请选择所属渠道', trigger: 'change' }
  ],
  modelId: [
    { required: true, message: '请输入模型 ID', trigger: 'blur' },
    { min: 1, max: 100, message: '模型 ID 长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { min: 1, max: 100, message: '显示名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  contextWindow: [
    { required: true, message: '请输入上下文窗口大小', trigger: 'blur' },
    { 
      type: 'number', 
      min: 1000, 
      max: 1000000, 
      message: '上下文窗口大小必须在 1000 到 1000000 之间', 
      trigger: 'blur' 
    }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    saving.value = true

    const data = {
      channelId: formData.value.channelId,
      modelId: formData.value.modelId,
      displayName: formData.value.displayName,
      contextWindow: formData.value.contextWindow,
      type: 'manual' as const
    }

    await window.electronAPI.ai.addModel(data)
    ElMessage.success('模型已添加')

    emit('saved')
    handleClose()
  } catch (error: any) {
    if (error !== false) { // 表单验证失败会返回 false
      ElMessage.error(`添加失败: ${error.message || error}`)
    }
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  resetForm()
  emit('update:visible', false)
}

const resetForm = () => {
  formData.value = {
    channelId: '',
    modelId: '',
    displayName: '',
    contextWindow: 4096
  }
  formRef.value?.clearValidate()
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

.el-alert ul {
  margin: 8px 0;
}

.el-alert li {
  margin: 4px 0;
}
</style>

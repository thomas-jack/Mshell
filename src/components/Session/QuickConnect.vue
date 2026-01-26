<template>
  <el-dialog v-model="visible" title="Quick Connect" width="500px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
      <el-form-item label="Host" prop="host">
        <el-input
          v-model="form.host"
          placeholder="user@host:port"
          @keyup.enter="handleConnect"
        />
        <template #extra>
          <span style="font-size: 12px; color: #999">
            Format: username@hostname:port (port is optional, default 22)
          </span>
        </template>
      </el-form-item>

      <el-form-item label="Password" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="Enter password"
          show-password
          @keyup.enter="handleConnect"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">Cancel</el-button>
      <el-button type="primary" @click="handleConnect">Connect</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  connect: [config: { host: string; port: number; username: string; password: string }]
}>()

const visible = ref(props.modelValue)
const formRef = ref<FormInstance>()

const form = reactive({
  host: '',
  password: ''
})

const rules: FormRules = {
  host: [{ required: true, message: 'Please enter host', trigger: 'blur' }],
  password: [{ required: true, message: 'Please enter password', trigger: 'blur' }]
}

watch(
  () => props.modelValue,
  (newValue) => {
    visible.value = newValue
    if (newValue) {
      form.host = ''
      form.password = ''
    }
  }
)

watch(visible, (newValue) => {
  emit('update:modelValue', newValue)
})

const parseHostString = (hostStr: string) => {
  // Parse format: user@host:port or user@host
  const match = hostStr.match(/^([^@]+)@([^:]+)(?::(\d+))?$/)
  
  if (!match) {
    throw new Error('Invalid format. Use: username@hostname:port')
  }

  return {
    username: match[1],
    host: match[2],
    port: match[3] ? parseInt(match[3]) : 22
  }
}

const handleConnect = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      try {
        const parsed = parseHostString(form.host)
        emit('connect', {
          ...parsed,
          password: form.password
        })
        visible.value = false
      } catch (error: any) {
        ElMessage.error(error.message)
      }
    }
  })
}
</script>

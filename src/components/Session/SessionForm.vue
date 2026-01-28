<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑会话' : '新建会话'"
    width="600px"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="我的服务器" />
      </el-form-item>

      <el-form-item label="主机" prop="host">
        <el-input v-model="form.host" placeholder="192.168.1.100 或 example.com" />
      </el-form-item>

      <el-form-item label="端口" prop="port">
        <el-input-number v-model="form.port" :min="1" :max="65535" />
      </el-form-item>

      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="root" />
      </el-form-item>

      <el-form-item label="认证方式" prop="authType">
        <el-radio-group v-model="form.authType">
          <el-radio label="password">密码</el-radio>
          <el-radio label="privateKey">私钥</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.authType === 'password'" label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="输入密码"
          show-password
        />
      </el-form-item>

      <el-form-item
        v-if="form.authType === 'privateKey'"
        label="私钥文件"
        prop="privateKeyPath"
      >
        <el-input v-model="form.privateKeyPath" placeholder="私钥文件路径">
          <template #append>
            <el-button @click="handleSelectKeyFile">浏览</el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item
        v-if="form.authType === 'privateKey'"
        label="密钥密码"
        prop="passphrase"
      >
        <el-input
          v-model="form.passphrase"
          type="password"
          placeholder="密钥密码（可选）"
          show-password
        />
      </el-form-item>

      <el-form-item label="分组" prop="groupId">
        <el-select v-model="form.groupId" placeholder="选择分组" clearable>
          <el-option
            v-for="group in groups"
            :key="group.id"
            :label="group.name"
            :value="group.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="可选描述"
        />
      </el-form-item>

      <!-- 服务器管理信息（可折叠） -->
      <el-divider content-position="left">
        <span style="font-size: 14px; color: var(--text-secondary)">服务器管理信息（可选）</span>
      </el-divider>

      <el-form-item label="提供商">
        <el-input v-model="form.provider" placeholder="如：阿里云、腾讯云、AWS" />
      </el-form-item>

      <el-form-item label="所属地区">
        <el-select 
          v-model="form.region" 
          placeholder="请选择国家/地区" 
          filterable 
          allow-create 
          default-first-option
          style="width: 100%"
        >
          <el-option
            v-for="item in countryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <span style="float: left">{{ item.label }}</span>
            <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
              {{ item.value }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="到期时间">
        <el-date-picker
          v-model="form.expiryDate"
          type="datetime"
          placeholder="选择到期时间"
          style="width: 100%"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>

      <el-form-item label="计费周期">
        <el-select v-model="form.billingCycle" placeholder="选择计费周期" clearable>
          <el-option label="月付" value="monthly" />
          <el-option label="季付" value="quarterly" />
          <el-option label="半年付" value="semi-annually" />
          <el-option label="年付" value="annually" />
          <el-option label="两年付" value="biennially" />
          <el-option label="三年付" value="triennially" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </el-form-item>

      <el-form-item label="计费费用">
        <el-input v-model.number="form.billingAmount" placeholder="费用金额" type="number">
          <template #append>
            <el-select v-model="form.billingCurrency" style="width: 80px">
              <el-option label="CNY" value="CNY" />
              <el-option label="USD" value="USD" />
              <el-option label="EUR" value="EUR" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="2"
          placeholder="其他备注信息"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { SessionConfig, SessionGroup } from '@/types/session'

interface Props {
  modelValue: boolean
  session?: SessionConfig | null
  groups: SessionGroup[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [session: Partial<SessionConfig>]
}>()

const visible = ref(props.modelValue)
const formRef = ref<FormInstance>()
const isEdit = ref(false)

const countryOptions = [
  // 亚洲
  { label: '中国 (China)', value: 'CN' },
  { label: '中国香港 (Hong Kong)', value: 'HK' },
  { label: '中国澳门 (Macau)', value: 'MO' },
  { label: '中国台湾 (Taiwan)', value: 'TW' },
  { label: '日本 (Japan)', value: 'JP' },
  { label: '韩国 (Korea)', value: 'KR' },
  { label: '新加坡 (Singapore)', value: 'SG' },
  { label: '马来西亚 (Malaysia)', value: 'MY' },
  { label: '泰国 (Thailand)', value: 'TH' },
  { label: '越南 (Vietnam)', value: 'VN' },
  { label: '印度尼西亚 (Indonesia)', value: 'ID' },
  { label: '菲律宾 (Philippines)', value: 'PH' },
  { label: '印度 (India)', value: 'IN' },
  { label: '巴基斯坦 (Pakistan)', value: 'PK' },
  { label: '孟加拉国 (Bangladesh)', value: 'BD' },
  { label: '以色列 (Israel)', value: 'IL' },
  { label: '土耳其 (Turkey)', value: 'TR' },
  { label: '阿联酋 (UAE)', value: 'AE' },
  { label: '沙特阿拉伯 (Saudi Arabia)', value: 'SA' },

  // 欧洲
  { label: '英国 (UK)', value: 'GB' },
  { label: '德国 (Germany)', value: 'DE' },
  { label: '法国 (France)', value: 'FR' },
  { label: '荷兰 (Netherlands)', value: 'NL' },
  { label: '瑞士 (Switzerland)', value: 'CH' },
  { label: '瑞典 (Sweden)', value: 'SE' },
  { label: '挪威 (Norway)', value: 'NO' },
  { label: '芬兰 (Finland)', value: 'FI' },
  { label: '丹麦 (Denmark)', value: 'DK' },
  { label: '意大利 (Italy)', value: 'IT' },
  { label: '西班牙 (Spain)', value: 'ES' },
  { label: '葡萄牙 (Portugal)', value: 'PT' },
  { label: '波兰 (Poland)', value: 'PL' },
  { label: '俄罗斯 (Russia)', value: 'RU' },
  { label: '乌克兰 (Ukraine)', value: 'UA' },
  { label: '爱尔兰 (Ireland)', value: 'IE' },
  { label: '比利时 (Belgium)', value: 'BE' },
  { label: '奥地利 (Austria)', value: 'AT' },

  // 北美洲
  { label: '美国 (USA)', value: 'US' },
  { label: '加拿大 (Canada)', value: 'CA' },
  { label: '墨西哥 (Mexico)', value: 'MX' },

  // 南美洲
  { label: '巴西 (Brazil)', value: 'BR' },
  { label: '阿根廷 (Argentina)', value: 'AR' },
  { label: '智利 (Chile)', value: 'CL' },
  { label: '哥伦比亚 (Colombia)', value: 'CO' },

  // 大洋洲
  { label: '澳大利亚 (Australia)', value: 'AU' },
  { label: '新西兰 (New Zealand)', value: 'NZ' },

  // 非洲
  { label: '南非 (South Africa)', value: 'ZA' },
  { label: '埃及 (Egypt)', value: 'EG' },
  { label: '尼日利亚 (Nigeria)', value: 'NG' }
]

const defaultForm = {
  name: '',
  host: '',
  port: 22,
  username: '',
  authType: 'password' as 'password' | 'privateKey',
  password: '',
  privateKeyPath: '',
  passphrase: '',
  groupId: '',
  description: '',
  // 服务器管理字段
  provider: '',
  region: '',
  expiryDate: null as string | null,
  billingCycle: '' as '' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'biennially' | 'triennially' | 'custom',
  billingAmount: undefined as number | undefined,
  billingCurrency: 'CNY',
  notes: ''
}

const form = reactive({ ...defaultForm })

const rules: FormRules = {
  name: [{ required: true, message: '请输入会话名称', trigger: 'blur' }],
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  port: [
    { required: true, message: '请输入端口', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口必须在 1-65535 之间', trigger: 'blur' }
  ],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (form.authType === 'password' && !value) {
          callback(new Error('请输入密码'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  privateKeyPath: [
    {
      validator: (_rule, value, callback) => {
        if (form.authType === 'privateKey' && !value) {
          callback(new Error('请选择私钥文件'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

watch(
  () => props.modelValue,
  (newValue) => {
    visible.value = newValue
    if (newValue) {
      if (props.session) {
        isEdit.value = true
        // 手动赋值以正确处理日期格式
        form.name = props.session.name || ''
        form.host = props.session.host || ''
        form.port = props.session.port || 22
        form.username = props.session.username || ''
        form.authType = props.session.authType || 'password'
        form.password = props.session.password || ''
        form.privateKeyPath = props.session.privateKeyPath || ''
        form.passphrase = props.session.passphrase || ''
        form.groupId = props.session.group || ''
        form.description = (props.session as any).description || ''
        // 服务器管理字段
        form.provider = props.session.provider || ''
        form.region = props.session.region || ''
        // 将 Date 对象转换为字符串格式
        form.expiryDate = props.session.expiryDate 
          ? (props.session.expiryDate instanceof Date 
            ? props.session.expiryDate.toISOString().slice(0, 19).replace('T', ' ')
            : props.session.expiryDate)
          : null
        form.billingCycle = props.session.billingCycle || ''
        form.billingAmount = props.session.billingAmount
        form.billingCurrency = props.session.billingCurrency || 'CNY'
        form.notes = props.session.notes || ''
      } else {
        isEdit.value = false
        Object.assign(form, defaultForm)
      }
    }
  }
)

watch(visible, (newValue) => {
  emit('update:modelValue', newValue)
  // 对话框关闭时重置表单
  if (!newValue) {
    // 延迟重置，等待动画完成
    setTimeout(() => {
      Object.assign(form, defaultForm)
      formRef.value?.clearValidate()
      isEdit.value = false
    }, 300)
  }
})

const handleSelectKeyFile = async () => {
  try {
    const filePath = await window.electronAPI.dialog.openFile({
      title: '选择私钥文件',
      filters: [
        { name: 'SSH 密钥', extensions: ['pem', 'key', 'ppk', 'pub'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    
    if (filePath) {
      form.privateKeyPath = filePath
    }
  } catch (error) {
    console.error('Failed to select key file:', error)
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      const sessionData: Partial<SessionConfig> = {
        name: form.name,
        host: form.host,
        port: form.port,
        username: form.username,
        authType: form.authType,
        group: form.groupId || undefined,
        description: form.description,
        // 服务器管理字段
        provider: form.provider || undefined,
        region: form.region || undefined,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : undefined,
        billingCycle: form.billingCycle || undefined,
        billingAmount: form.billingAmount,
        billingCurrency: form.billingCurrency || 'CNY',
        notes: form.notes || undefined
      }

      if (form.authType === 'password') {
        sessionData.password = form.password
      } else {
        sessionData.privateKeyPath = form.privateKeyPath
        sessionData.passphrase = form.passphrase || undefined
      }

      if (isEdit.value && props.session) {
        sessionData.id = props.session.id
      }

      emit('save', sessionData)
      visible.value = false
    }
  })
}

const handleCancel = () => {
  visible.value = false
}
</script>

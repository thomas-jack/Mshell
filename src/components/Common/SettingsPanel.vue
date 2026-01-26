<template>
  <div class="settings-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <h2>设置</h2>
      <div class="header-actions">
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 通用设置 -->
        <el-tab-pane label="通用" name="general">
          <div class="settings-section">
            <h3>应用设置</h3>
            <el-form label-position="left">
              <el-form-item label="启动时打开">
                <el-switch v-model="settings.general.openOnStartup" />
              </el-form-item>
              <el-form-item label="最小化到托盘">
                <el-switch v-model="settings.general.minimizeToTray" />
              </el-form-item>
              <el-form-item label="关闭时最小化">
                <el-switch v-model="settings.general.closeToTray" />
              </el-form-item>
              <el-form-item label="语言">
                <el-select v-model="settings.general.language" style="width: 200px">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 终端设置 -->
        <el-tab-pane label="终端" name="terminal">
          <div class="settings-section">
            <h3>终端外观</h3>
            <el-form label-position="left">
              <el-form-item label="字体大小">
                <el-slider 
                  v-model="settings.terminal.fontSize" 
                  :min="10" 
                  :max="24"
                  :step="1"
                  show-input
                  style="width: 300px"
                />
              </el-form-item>
              <el-form-item label="字体">
                <el-select v-model="settings.terminal.fontFamily" style="width: 300px">
                  <el-option label="JetBrains Mono" value="JetBrains Mono" />
                  <el-option label="Fira Code" value="Fira Code" />
                  <el-option label="Consolas" value="Consolas" />
                  <el-option label="Monaco" value="Monaco" />
                </el-select>
              </el-form-item>
              <el-form-item label="光标样式">
                <el-radio-group v-model="settings.terminal.cursorStyle">
                  <el-radio label="block">方块</el-radio>
                  <el-radio label="underline">下划线</el-radio>
                  <el-radio label="bar">竖线</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="光标闪烁">
                <el-switch v-model="settings.terminal.cursorBlink" />
              </el-form-item>
              <el-form-item label="滚动行数">
                <el-input-number 
                  v-model="settings.terminal.scrollback" 
                  :min="1000" 
                  :max="50000"
                  :step="1000"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- SSH设置 -->
        <el-tab-pane label="SSH" name="ssh">
          <div class="settings-section">
            <h3>连接设置</h3>
            <el-form label-position="left">
              <el-form-item label="连接超时">
                <el-input-number 
                  v-model="settings.ssh.timeout" 
                  :min="5" 
                  :max="120"
                  :step="5"
                />
                <span class="form-hint">秒</span>
              </el-form-item>
              <el-form-item label="保持连接">
                <el-switch v-model="settings.ssh.keepalive" />
              </el-form-item>
              <el-form-item label="保持间隔">
                <el-input-number 
                  v-model="settings.ssh.keepaliveInterval" 
                  :min="10" 
                  :max="300"
                  :step="10"
                  :disabled="!settings.ssh.keepalive"
                />
                <span class="form-hint">秒</span>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 关于 -->
        <el-tab-pane label="关于" name="about">
          <div class="settings-section about-section">
            <div class="app-info">
              <div class="app-logo">M</div>
              <h2>MShell</h2>
              <p class="version">版本 0.1.0</p>
              <p class="description">专业的SSH客户端</p>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <label>开发者</label>
                <span>MShell Team</span>
              </div>
              <div class="info-item">
                <label>许可证</label>
                <span>MIT License</span>
              </div>
              <div class="info-item">
                <label>官网</label>
                <a href="#">https://mshell.app</a>
              </div>
              <div class="info-item">
                <label>反馈</label>
                <a href="#">GitHub Issues</a>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('general')

const settings = ref({
  general: {
    openOnStartup: false,
    minimizeToTray: true,
    closeToTray: false,
    language: 'zh-CN'
  },
  terminal: {
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
    cursorStyle: 'block',
    cursorBlink: true,
    scrollback: 10000
  },
  ssh: {
    timeout: 30,
    keepalive: true,
    keepaliveInterval: 60
  }
})

onMounted(() => {
  loadSettings()
})

const loadSettings = async () => {
  try {
    const saved = await window.electronAPI.settings.get()
    if (saved) {
      settings.value = { ...settings.value, ...saved }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

const saveSettings = async () => {
  try {
    await window.electronAPI.settings.set(settings.value)
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error('保存设置失败')
  }
}
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-main);
}

/* 头部 */
.panel-header {
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* 内容区域 */
.settings-content {
  flex: 1;
  overflow: hidden;
}

.settings-tabs {
  height: 100%;
}

.settings-tabs :deep(.el-tabs__content) {
  height: calc(100% - 55px);
  overflow-y: auto;
  padding: var(--spacing-xl);
}

.settings-tabs :deep(.el-tab-pane) {
  width: 100%;
}

/* 设置区块 */
.settings-section {
  width: 100%;
  margin-bottom: var(--spacing-xl);
}

.settings-section :deep(.el-form) {
  width: 100%;
}

.settings-section :deep(.el-form-item) {
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
}

.settings-section :deep(.el-form-item__label) {
  width: 120px;
  flex-shrink: 0;
  text-align: left;
  padding-right: var(--spacing-md);
}

.settings-section :deep(.el-form-item__content) {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.settings-section h3 {
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.form-hint {
  margin-left: var(--spacing-sm);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

/* 关于页面 */
.about-section {
  max-width: 600px;
  text-align: center;
}

.app-info {
  padding: var(--spacing-2xl) 0;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: var(--spacing-xl);
}

.app-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 800;
  color: white;
  box-shadow: var(--shadow-lg);
}

.app-info h2 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
}

.version {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.description {
  margin: 0;
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  text-align: left;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-item label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span,
.info-item a {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.info-item a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.info-item a:hover {
  color: var(--primary-light);
}
</style>

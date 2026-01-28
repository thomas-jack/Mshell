<template>
  <div id="app">
    <div class="app-layout">
      <Sidebar @menu-select="handleMenuSelect" />
      
      <div class="app-main">
        <div class="app-header">
           <div class="app-title-drag"></div>
           <div class="header-actions">
              <el-button type="primary" size="small" :icon="Plus" @click="appStore.showSessionForm = true" circle />
              <el-button size="small" :icon="Lightning" @click="appStore.showQuickConnect = true" circle />
           </div>
        </div>
        
        <div class="app-content">
          <div v-show="appStore.activeView === 'sessions'" class="content-panel">
            <div class="sessions-panel glass-panel">
              <SessionList
                @connect="handleConnect"
                @edit="handleEditSession"
              />
            </div>
            <div class="terminal-panel">
              <el-tabs
                v-model="appStore.activeTab"
                type="card"
                closable
                class="premium-tabs"
                @tab-remove="appStore.removeTab"
              >
                <el-tab-pane
                  v-for="tab in appStore.tabs"
                  :key="tab.id"
                  :label="tab.name"
                  :name="tab.id"
                >
                  <TerminalTab
                    :connection-id="tab.id"
                    :session="tab.session"
                    :terminal-options="appStore.terminalOptions"
                  />
                </el-tab-pane>
                
                <template v-if="appStore.tabs.length === 0">
                  <div class="empty-state">
                    <div class="empty-state-content">
                      <div class="empty-icon-wrapper">
                         <el-icon :size="48"><Connection /></el-icon>
                      </div>
                      <h3>Ready to Connect</h3>
                      <p>Select a session from the list or create a new one to get started.</p>
                      <div class="empty-actions">
                        <el-button type="primary" @click="appStore.showSessionForm = true" size="large">
                          Create New Session
                        </el-button>
                        <el-button @click="appStore.showQuickConnect = true" size="large">
                          Quick Connect
                        </el-button>
                      </div>
                    </div>
                  </div>
                </template>
              </el-tabs>
            </div>
          </div>
          
          <div v-show="appStore.activeView === 'sftp'" class="content-panel">
            <SFTPPanel />
          </div>
          
          <div v-show="appStore.activeView === 'port-forward'" class="content-panel">
            <PortForwardPanel v-if="appStore.activeTab" :connection-id="appStore.activeTab" />
            <div v-else class="empty-state">
               <div class="empty-state-content">
                  <el-icon :size="64"><Connection /></el-icon>
                  <p>Please establish an SSH connection first.</p>
               </div>
            </div>
          </div>
          
          <div v-show="appStore.activeView === 'snippets'" class="content-panel">
            <SnippetPanel />
          </div>

          <div v-show="appStore.activeView === 'statistics'" class="content-panel">
            <StatisticsPanel />
          </div>
          
          <div v-show="appStore.activeView === 'logs'" class="content-panel">
            <LogViewer />
          </div>
          
          <div v-show="appStore.activeView === 'settings'" class="content-panel">
            <SettingsPanel />
          </div>
        </div>
        
        <StatusBar
          :active-connections="appStore.tabs.length"
          :current-session="appStore.currentSession"
          :transfer-count="0"
          class="app-statusbar"
        />
      </div>
    </div>
    
    <!-- Dialogs -->
    <SessionForm
      v-model="appStore.showSessionForm"
      :session="appStore.editingSession"
      @save="handleSaveSession"
    />
    
    <QuickConnect 
      v-model="appStore.showQuickConnect" 
      @connect="handleQuickConnectSubmit" 
    />
    
    <TerminalSettings
      v-model="appStore.showTerminalSettings"
      :current-settings="appStore.terminalOptions"
      @save="handleSaveTerminalSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, Plus, Lightning } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { v4 as uuidv4 } from 'uuid'

// 组件导入
import Sidebar from './components/Common/Sidebar.vue'
import StatusBar from './components/Common/StatusBar.vue'
import SessionList from './components/Session/SessionList.vue'
import SessionForm from './components/Session/SessionForm.vue'
import QuickConnect from './components/Session/QuickConnect.vue'
import TerminalTab from './components/Terminal/TerminalTab.vue'
import TerminalSettings from './components/Terminal/TerminalSettings.vue'
import SettingsPanel from './components/Common/SettingsPanel.vue'
import LogViewer from './components/Common/LogViewer.vue'
import SFTPPanel from './components/SFTP/SFTPPanel.vue'
import PortForwardPanel from './components/PortForward/PortForwardPanel.vue'
import SnippetPanel from './components/Snippet/SnippetPanel.vue'
import StatisticsPanel from './components/Statistics/StatisticsPanel.vue'

import type { SessionConfig } from './types/session'

// 使用 store - 集中管理所有状态
const appStore = useAppStore()

onMounted(async () => {
  // 初始化应用状态
  await appStore.initialize()
  
  // 监听设置变化
  window.electronAPI.settings.onChange((newSettings) => {
    appStore.applySettings(newSettings)
  })

  // 注册快捷键
  // @ts-ignore
  window.electronAPI.onShortcut('new-connection', () => {
    appStore.showSessionForm = true
  })

  // @ts-ignore
  window.electronAPI.onShortcut('quick-connect', () => {
    appStore.showQuickConnect = true
  })

  // @ts-ignore
  window.electronAPI.onShortcut('settings', () => {
    appStore.activeView = 'settings'
  })

  // @ts-ignore
  window.electronAPI.onShortcut('close-tab', () => {
    if (appStore.activeTab) {
      appStore.removeTab(appStore.activeTab)
    }
  })

  // @ts-ignore
  window.electronAPI.onShortcut('next-tab', () => {
    appStore.nextTab()
  })

  // @ts-ignore
  window.electronAPI.onShortcut('prev-tab', () => {
    appStore.prevTab()
  })
})

const handleMenuSelect = (index: string) => {
  appStore.activeView = index as any
}

const handleConnect = async (session: SessionConfig) => {
  const tabId = uuidv4()
  const tab = {
    id: tabId,
    name: session.name || `${session.username}@${session.host}`,
    session
  }
  
  appStore.addTab(tab)

  // 更新使用统计
  try {
    const usageCount = (session.usageCount || 0) + 1
    const lastConnected = new Date()
    await appStore.updateSession(session.id, { usageCount, lastConnected })
  } catch (error) {
    console.error('Failed to update session usage stats:', error)
  }
}

const handleQuickConnectSubmit = (config: {
  host: string
  port: number
  username: string
  password: string
}) => {
  const session: SessionConfig = {
    id: uuidv4(),
    name: `${config.username}@${config.host}`,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    authType: 'password',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  handleConnect(session)
}

const handleEditSession = (session: SessionConfig) => {
  appStore.openSessionForm(session)
}

const handleSaveSession = async (sessionData: Partial<SessionConfig>) => {
  try {
    if (sessionData.id) {
      await appStore.updateSession(sessionData.id, sessionData)
      ElMessage.success('会话已更新')
    } else {
      await appStore.createSession(sessionData)
      ElMessage.success('会话已创建')
    }
    appStore.closeSessionForm()
  } catch (error: any) {
    ElMessage.error(`保存会话失败: ${error.message}`)
  }
}

const handleSaveTerminalSettings = (settings: any) => {
  appStore.updateTerminalOptions(settings)
  ElMessage.success('Terminal settings saved')
}
</script>

<style>
/* Reset & Global */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-main);
  color: var(--text-primary);
}
</style>

<style scoped>
/* 主布局 */
.app-layout {
  display: flex;
  height: 100%;
  background: var(--bg-main);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1;
  min-width: 0;
}

/* 顶部工具栏 */
.app-header {
  height: 56px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 var(--spacing-lg);
  -webkit-app-region: drag;
  box-shadow: var(--shadow-sm);
  z-index: 5;
}

.app-title-drag {
  flex: 1;
  height: 100%;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
  -webkit-app-region: no-drag;
}

.header-actions .el-button {
  box-shadow: var(--shadow-sm);
}

.header-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 内容区域 */
.app-content {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.content-panel {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
}

/* 会话面板 */
.sessions-panel {
  width: 320px;
  border-right: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-md);
  z-index: 5;
}

/* 终端面板 */
.terminal-panel {
  flex: 1;
  overflow: hidden;
  background: var(--bg-main);
  display: flex;
  flex-direction: column;
}

/* 专业标签页样式 */
.premium-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
  --el-tabs-header-height: 44px;
}

.premium-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 var(--spacing-sm);
}

.premium-tabs :deep(.el-tabs__nav) {
  border: none !important;
}

.premium-tabs :deep(.el-tabs__item) {
  height: 44px;
  line-height: 44px;
  padding: 0 var(--spacing-lg);
  border: none !important;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: color var(--transition-fast), background-color var(--transition-fast);
  background: transparent;
  position: relative;
  margin-right: 4px;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.premium-tabs :deep(.el-tabs__item::before) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-color);
  transform: scaleX(0);
  transition: transform var(--transition-normal);
}

.premium-tabs :deep(.el-tabs__item.is-active) {
  background: var(--bg-main);
  color: var(--primary-color);
  font-weight: 600;
}

.premium-tabs :deep(.el-tabs__item.is-active::before) {
  transform: scaleX(1);
}

.premium-tabs :deep(.el-tabs__item:hover) {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.premium-tabs :deep(.el-tabs__item .el-icon-close) {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: all var(--transition-fast);
}

.premium-tabs :deep(.el-tabs__item .el-icon-close:hover) {
  background: var(--error-color);
  color: white;
}

.premium-tabs :deep(.el-tabs__content) {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.premium-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.premium-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

/* 空状态优化 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: radial-gradient(
    ellipse at center,
    var(--bg-secondary) 0%,
    var(--bg-main) 70%
  );
  position: relative;
  overflow: hidden;
}

.empty-state::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(
    circle,
    rgba(14, 165, 233, 0.05) 0%,
    transparent 70%
  );
  border-radius: 50%;
  animation: pulse 4s ease-in-out infinite;
}

.empty-state-content {
  text-align: center;
  max-width: 480px;
  padding: var(--spacing-2xl);
  position: relative;
  z-index: 1;
  animation: fadeIn 0.6s ease-out;
}

.empty-icon-wrapper {
  width: 120px;
  height: 120px;
  background: linear-gradient(
    135deg,
    rgba(14, 165, 233, 0.15),
    rgba(99, 102, 241, 0.15)
  );
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-xl);
  color: var(--primary-color);
  box-shadow: 0 0 60px rgba(14, 165, 233, 0.2);
  position: relative;
}

.empty-icon-wrapper::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--primary-color),
    var(--accent-color)
  );
  opacity: 0.2;
  filter: blur(20px);
  z-index: -1;
}

.empty-state h3 {
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: 700;
  letter-spacing: -0.5px;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
  font-size: var(--text-base);
}

.empty-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.empty-actions .el-button {
  min-width: 140px;
}

/* 状态栏 */
.app-statusbar {
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  height: 32px;
  line-height: 32px;
  font-size: var(--text-xs);
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
}

/* 响应式 */
@media (max-width: 1024px) {
  .sessions-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .sessions-panel {
    width: 240px;
  }
  
  .app-header {
    height: 48px;
    padding: 0 var(--spacing-md);
  }
  
  .empty-icon-wrapper {
    width: 96px;
    height: 96px;
  }
  
  .empty-state h3 {
    font-size: var(--text-xl);
  }
}

/* 动画 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

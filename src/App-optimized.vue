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
          <!-- 会话视图 -->
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
          
          <!-- 其他视图 -->
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
    
    <!-- 对话框 -->
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

// 使用 store - 这是关键！
const appStore = useAppStore()

onMounted(async () => {
  // 初始化应用状态
  await appStore.initialize()
  
  // 监听设置变化
  window.electronAPI.settings.onChange((newSettings) => {
    appStore.applySettings(newSettings)
  })

  // 注册快捷键
  window.electronAPI.onShortcut('new-connection', () => {
    appStore.showSessionForm = true
  })

  window.electronAPI.onShortcut('quick-connect', () => {
    appStore.showQuickConnect = true
  })

  window.electronAPI.onShortcut('settings', () => {
    appStore.activeView = 'settings'
  })

  window.electronAPI.onShortcut('close-tab', () => {
    if (appStore.activeTab) {
      appStore.removeTab(appStore.activeTab)
    }
  })

  window.electronAPI.onShortcut('next-tab', () => {
    appStore.nextTab()
  })

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
/* 样式保持不变 */
</style>

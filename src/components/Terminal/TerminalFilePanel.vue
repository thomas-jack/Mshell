<template>
  <div class="terminal-file-panel">
    <div class="panel-header">
      <h3>文件管理</h3>
      <el-button :icon="Close" link @click="$emit('close')" />
    </div>
    
    <!-- 路径导航 -->
    <div class="path-nav">
      <el-button :icon="Back" size="small" @click="goBack" :disabled="!canGoBack" />
      <el-button :icon="HomeFilled" size="small" @click="goHome" />
      <el-input
        v-model="pathInput"
        size="small"
        placeholder="输入路径"
        @keyup.enter="navigateToPath"
        class="path-input"
      >
        <template #prefix>
          <el-icon><FolderOpened /></el-icon>
        </template>
      </el-input>
      <el-tooltip content="同步终端目录" placement="bottom">
        <el-button :icon="Position" size="small" @click="syncToTerminalDir" />
      </el-tooltip>
      <el-button :icon="Refresh" size="small" @click="refreshDirectory" />
    </div>
    
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-dropdown @command="handleCreateCommand" trigger="click" size="small">
        <el-button size="small" :icon="Plus">
          新建
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="folder">
              <el-icon><FolderAdd /></el-icon>
              新建文件夹
            </el-dropdown-item>
            <el-dropdown-item command="file">
              <el-icon><Document /></el-icon>
              新建文件
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button size="small" :icon="Upload" @click="handleUpload">上传</el-button>
      <el-tooltip :content="showHiddenFiles ? '隐藏隐藏文件' : '显示隐藏文件'" placement="bottom">
        <el-button 
          size="small" 
          :icon="View"
          :type="showHiddenFiles ? 'primary' : 'default'"
          @click="toggleHiddenFiles"
        />
      </el-tooltip>
    </div>
    
    <!-- 文件列表 -->
    <div class="file-list" v-loading="loading">
      <div v-if="displayFiles.length === 0 && !loading" class="empty-state">
        <el-icon :size="48"><FolderOpened /></el-icon>
        <p>文件夹为空</p>
      </div>
      
      <div
        v-for="file in displayFiles"
        :key="file.path"
        class="file-item"
        :class="{ selected: selectedFile?.path === file.path }"
        @click="selectFile(file)"
        @dblclick="handleDoubleClick(file)"
        @contextmenu.prevent="showContextMenu($event, file)"
      >
        <el-icon :size="20" class="file-icon">
          <Folder v-if="file.type === 'directory'" />
          <Document v-else-if="file.type === 'file'" />
          <Link v-else />
        </el-icon>
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">
            <span v-if="file.type === 'file'">{{ formatSize(file.size) }}</span>
            <span v-else>文件夹</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ top: contextMenuY + 'px', left: contextMenuX + 'px' }"
      @click.stop
    >
      <div v-if="contextMenuFile?.type === 'file'" class="menu-item" @click="handlePreview">
        <el-icon><ZoomIn /></el-icon>
        <span>预览</span>
      </div>
      <div v-if="contextMenuFile?.type === 'file'" class="menu-item" @click="handleEdit">
        <el-icon><EditPen /></el-icon>
        <span>编辑</span>
      </div>
      <div class="menu-item" @click="handleDownload">
        <el-icon><Download /></el-icon>
        <span>下载</span>
      </div>
      <div class="menu-item" @click="handleRename">
        <el-icon><Edit /></el-icon>
        <span>重命名</span>
      </div>
      <div class="menu-item" @click="handlePermissions">
        <el-icon><Lock /></el-icon>
        <span>权限</span>
      </div>
      <div class="menu-item danger" @click="handleDelete">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </div>
    
    <!-- 预览对话框 -->
    <el-dialog v-model="showPreviewDialog" title="文件预览" width="700px" append-to-body>
      <div class="preview-content">
        <div v-if="previewLoading" class="preview-loading">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        <pre v-else class="preview-text">{{ previewContent }}</pre>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 编辑对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑文件" width="800px" append-to-body>
      <div class="edit-content">
        <div v-if="editLoading" class="preview-loading">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        <el-input
          v-else
          v-model="editContent"
          type="textarea"
          :rows="20"
          class="edit-textarea"
        />
      </div>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEditedFile" :loading="editSaving">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 新建文件夹对话框 -->
    <el-dialog v-model="showCreateFolderDialog" title="新建文件夹" width="350px" append-to-body>
      <el-input v-model="newFolderName" placeholder="输入文件夹名称" @keyup.enter="createFolder" />
      <template #footer>
        <el-button @click="showCreateFolderDialog = false">取消</el-button>
        <el-button type="primary" @click="createFolder">创建</el-button>
      </template>
    </el-dialog>
    
    <!-- 新建文件对话框 -->
    <el-dialog v-model="showCreateFileDialog" title="新建文件" width="350px" append-to-body>
      <el-input v-model="newFileName" placeholder="输入文件名称" @keyup.enter="createFile" />
      <template #footer>
        <el-button @click="showCreateFileDialog = false">取消</el-button>
        <el-button type="primary" @click="createFile">创建</el-button>
      </template>
    </el-dialog>
    
    <!-- 重命名对话框 -->
    <el-dialog v-model="showRenameDialog" title="重命名" width="350px" append-to-body>
      <el-input v-model="renameValue" placeholder="输入新名称" @keyup.enter="confirmRename" />
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmRename">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 权限编辑对话框 -->
    <el-dialog v-model="showPermissionsDialog" title="修改权限" width="400px" append-to-body>
      <div class="permissions-editor">
        <div class="permission-group">
          <h4>所有者 (Owner)</h4>
          <div class="permission-checkboxes">
            <el-checkbox v-model="permissionBits.ownerRead">读取 (r)</el-checkbox>
            <el-checkbox v-model="permissionBits.ownerWrite">写入 (w)</el-checkbox>
            <el-checkbox v-model="permissionBits.ownerExecute">执行 (x)</el-checkbox>
          </div>
        </div>
        <div class="permission-group">
          <h4>组 (Group)</h4>
          <div class="permission-checkboxes">
            <el-checkbox v-model="permissionBits.groupRead">读取 (r)</el-checkbox>
            <el-checkbox v-model="permissionBits.groupWrite">写入 (w)</el-checkbox>
            <el-checkbox v-model="permissionBits.groupExecute">执行 (x)</el-checkbox>
          </div>
        </div>
        <div class="permission-group">
          <h4>其他 (Others)</h4>
          <div class="permission-checkboxes">
            <el-checkbox v-model="permissionBits.otherRead">读取 (r)</el-checkbox>
            <el-checkbox v-model="permissionBits.otherWrite">写入 (w)</el-checkbox>
            <el-checkbox v-model="permissionBits.otherExecute">执行 (x)</el-checkbox>
          </div>
        </div>
        <div class="permission-octal">
          <strong>八进制：</strong>
          <span class="octal-value">{{ computedOctalPermission }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPermissionsDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmPermissions">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Close, Back, HomeFilled, FolderOpened, Refresh, Plus, FolderAdd,
  Document, Upload, Download, Folder, Link, Edit, Delete, Lock, View,
  ZoomIn, EditPen, Loading, Position
} from '@element-plus/icons-vue'

interface FileInfo {
  name: string
  path: string
  type: 'file' | 'directory' | 'symlink'
  size: number
  modifyTime: Date
  permissions?: number
}

const props = defineProps<{
  connectionId: string
  sessionName?: string
  currentDir?: string
}>()

const emit = defineEmits<{
  close: []
  'request-current-dir': []
}>()

const loading = ref(false)
const currentPath = ref('/')
const pathInput = ref('/')
const files = ref<FileInfo[]>([])
const selectedFile = ref<FileInfo | null>(null)
const pathHistory = ref<string[]>([])
const showHiddenFiles = ref(false)

// 过滤后的文件列表（根据是否显示隐藏文件）
const displayFiles = computed(() => {
  if (showHiddenFiles.value) {
    return files.value
  }
  return files.value.filter(f => !f.name.startsWith('.'))
})

// 切换显示隐藏文件
const toggleHiddenFiles = () => {
  showHiddenFiles.value = !showHiddenFiles.value
}

// 右键菜单
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuFile = ref<FileInfo | null>(null)

// 对话框
const showCreateFolderDialog = ref(false)
const showCreateFileDialog = ref(false)
const showRenameDialog = ref(false)
const showPermissionsDialog = ref(false)
const showPreviewDialog = ref(false)
const showEditDialog = ref(false)
const newFolderName = ref('')
const newFileName = ref('')
const renameValue = ref('')

// 预览和编辑
const previewContent = ref('')
const previewLoading = ref(false)
const editContent = ref('')
const editLoading = ref(false)
const editSaving = ref(false)
const editingFilePath = ref('')

// 权限编辑
const permissionBits = ref({
  ownerRead: false, ownerWrite: false, ownerExecute: false,
  groupRead: false, groupWrite: false, groupExecute: false,
  otherRead: false, otherWrite: false, otherExecute: false
})

const canGoBack = computed(() => pathHistory.value.length > 0)

const computedOctalPermission = computed(() => {
  const owner = (permissionBits.value.ownerRead ? 4 : 0) +
                (permissionBits.value.ownerWrite ? 2 : 0) +
                (permissionBits.value.ownerExecute ? 1 : 0)
  const group = (permissionBits.value.groupRead ? 4 : 0) +
                (permissionBits.value.groupWrite ? 2 : 0) +
                (permissionBits.value.groupExecute ? 1 : 0)
  const other = (permissionBits.value.otherRead ? 4 : 0) +
                (permissionBits.value.otherWrite ? 2 : 0) +
                (permissionBits.value.otherExecute ? 1 : 0)
  return `${owner}${group}${other}`
})

// 格式化文件大小
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 加载目录
const loadDirectory = async (path: string) => {
  loading.value = true
  try {
    const result = await window.electronAPI.sftp.listDirectory(props.connectionId, path)
    if (result.success && result.files) {
      files.value = result.files
        .filter((f: FileInfo) => f.name !== '.' && f.name !== '..')
        .map((f: FileInfo) => ({
          ...f,
          // 确保 path 是完整路径
          path: f.path || (path === '/' ? '/' + f.name : path + '/' + f.name)
        }))
        .sort((a: FileInfo, b: FileInfo) => {
          // 文件夹优先
          if (a.type === 'directory' && b.type !== 'directory') return -1
          if (a.type !== 'directory' && b.type === 'directory') return 1
          return a.name.localeCompare(b.name)
        })
      currentPath.value = path
      pathInput.value = path
      console.log('[TerminalFilePanel] Loaded directory:', path, 'files:', files.value.length)
    } else {
      ElMessage.error(result.error || '加载目录失败')
    }
  } catch (error: any) {
    ElMessage.error('加载目录失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 导航到路径
const navigateToPath = () => {
  if (pathInput.value && pathInput.value !== currentPath.value) {
    pathHistory.value.push(currentPath.value)
    loadDirectory(pathInput.value)
  }
}

// 返回上级
const goBack = () => {
  if (pathHistory.value.length > 0) {
    const prevPath = pathHistory.value.pop()!
    loadDirectory(prevPath)
  }
}

// 返回主目录
const goHome = () => {
  pathHistory.value.push(currentPath.value)
  loadDirectory('/')
}

// 刷新目录
const refreshDirectory = () => {
  loadDirectory(currentPath.value)
}

// 同步到终端当前目录
const syncToTerminalDir = async () => {
  // 设置待同步标志
  pendingSync.value = true
  // 请求父组件更新 currentDir
  emit('request-current-dir')
  
  // 等待一小段时间让父组件更新 currentDir
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 如果 pendingSync 仍然为 true，说明 watch 没有触发（可能 currentDir 没变化）
  // 这时候直接使用 props.currentDir 刷新
  if (pendingSync.value) {
    pendingSync.value = false
    const targetPath = getInitialPath()
    console.log('[TerminalFilePanel] Direct sync to:', targetPath, 'currentDir:', props.currentDir)
    if (targetPath && targetPath !== currentPath.value) {
      pathHistory.value.push(currentPath.value)
      loadDirectory(targetPath)
      ElMessage.success(`已同步到: ${targetPath}`)
    } else if (!targetPath || targetPath === '/root') {
      ElMessage.info('未检测到终端目录，使用默认目录 /root')
    } else {
      ElMessage.info('已在当前目录')
    }
  }
}

// 选择文件
const selectFile = (file: FileInfo) => {
  selectedFile.value = file
  contextMenuVisible.value = false
}

// 双击处理
const handleDoubleClick = (file: FileInfo) => {
  console.log('[TerminalFilePanel] Double click:', file.name, file.type, file.path)
  if (file.type === 'directory') {
    pathHistory.value.push(currentPath.value)
    loadDirectory(file.path)
  } else {
    // 双击文件打开预览
    contextMenuFile.value = file
    handlePreview()
  }
}

// 显示右键菜单
const showContextMenu = (event: MouseEvent, file: FileInfo) => {
  selectedFile.value = file
  contextMenuFile.value = file
  contextMenuX.value = Math.min(event.clientX, window.innerWidth - 150)
  contextMenuY.value = Math.min(event.clientY, window.innerHeight - 200)
  contextMenuVisible.value = true
}

// 隐藏右键菜单
const hideContextMenu = () => {
  contextMenuVisible.value = false
}

// 新建命令处理
const handleCreateCommand = (command: string) => {
  if (command === 'folder') {
    newFolderName.value = ''
    showCreateFolderDialog.value = true
  } else if (command === 'file') {
    newFileName.value = ''
    showCreateFileDialog.value = true
  }
}

// 创建文件夹
const createFolder = async () => {
  if (!newFolderName.value.trim()) {
    ElMessage.warning('请输入文件夹名称')
    return
  }
  
  try {
    const newPath = currentPath.value === '/' 
      ? '/' + newFolderName.value 
      : currentPath.value + '/' + newFolderName.value
    
    const result = await window.electronAPI.sftp.createDirectory(props.connectionId, newPath)
    if (result.success) {
      ElMessage.success('文件夹创建成功')
      showCreateFolderDialog.value = false
      refreshDirectory()
    } else {
      ElMessage.error(result.error || '创建失败')
    }
  } catch (error: any) {
    ElMessage.error('创建文件夹失败: ' + error.message)
  }
}

// 创建文件
const createFile = async () => {
  if (!newFileName.value.trim()) {
    ElMessage.warning('请输入文件名称')
    return
  }
  
  try {
    const newPath = currentPath.value === '/' 
      ? '/' + newFileName.value 
      : currentPath.value + '/' + newFileName.value
    
    const result = await window.electronAPI.sftp.createFile(props.connectionId, newPath)
    if (result.success) {
      ElMessage.success('文件创建成功')
      showCreateFileDialog.value = false
      refreshDirectory()
    } else {
      ElMessage.error(result.error || '创建失败')
    }
  } catch (error: any) {
    ElMessage.error('创建文件失败: ' + error.message)
  }
}

// 上传文件
const handleUpload = async () => {
  try {
    const result = await window.electronAPI.dialog.openFile({
      properties: ['openFile', 'multiSelections']
    })
    
    if (result && result.length > 0) {
      for (const localPath of result) {
        const fileName = localPath.split(/[/\\]/).pop()
        const remotePath = currentPath.value === '/' 
          ? '/' + fileName 
          : currentPath.value + '/' + fileName
        
        ElMessage.info(`正在上传 ${fileName}...`)
        
        const uploadResult = await window.electronAPI.sftp.uploadFile(props.connectionId, localPath, remotePath)
        if (uploadResult.success) {
          ElMessage.success(`${fileName} 上传成功`)
        } else {
          ElMessage.error(`${fileName} 上传失败: ${uploadResult.error}`)
        }
      }
      refreshDirectory()
    }
  } catch (error: any) {
    ElMessage.error('上传失败: ' + error.message)
  }
}

// 下载文件
const handleDownload = async () => {
  if (!contextMenuFile.value) return
  hideContextMenu()
  
  try {
    // 选择保存目录
    const saveDir = await window.electronAPI.dialog.openDirectory({
      properties: ['openDirectory', 'createDirectory']
    })
    
    if (!saveDir) return
    
    const file = contextMenuFile.value
    const localPath = `${saveDir}/${file.name}`
    
    ElMessage.info(`正在下载 ${file.name}...`)
    
    const result = await window.electronAPI.sftp.downloadFile(props.connectionId, file.path, localPath)
    if (result.success) {
      ElMessage.success(`${file.name} 下载成功`)
    } else {
      ElMessage.error(`下载失败: ${result.error}`)
    }
  } catch (error: any) {
    ElMessage.error('下载失败: ' + error.message)
  }
}

// 重命名
const handleRename = () => {
  if (!contextMenuFile.value) return
  hideContextMenu()
  renameValue.value = contextMenuFile.value.name
  showRenameDialog.value = true
}

const confirmRename = async () => {
  if (!contextMenuFile.value || !renameValue.value.trim()) return
  
  try {
    const oldPath = contextMenuFile.value.path
    const newPath = currentPath.value === '/'
      ? '/' + renameValue.value
      : currentPath.value + '/' + renameValue.value
    
    const result = await window.electronAPI.sftp.renameFile(props.connectionId, oldPath, newPath)
    if (result.success) {
      ElMessage.success('重命名成功')
      showRenameDialog.value = false
      refreshDirectory()
    } else {
      ElMessage.error(result.error || '重命名失败')
    }
  } catch (error: any) {
    ElMessage.error('重命名失败: ' + error.message)
  }
}

// 权限编辑
const handlePermissions = () => {
  if (!contextMenuFile.value) return
  hideContextMenu()
  
  const perms = contextMenuFile.value.permissions || 0o644
  permissionBits.value = {
    ownerRead: !!(perms & 0o400),
    ownerWrite: !!(perms & 0o200),
    ownerExecute: !!(perms & 0o100),
    groupRead: !!(perms & 0o040),
    groupWrite: !!(perms & 0o020),
    groupExecute: !!(perms & 0o010),
    otherRead: !!(perms & 0o004),
    otherWrite: !!(perms & 0o002),
    otherExecute: !!(perms & 0o001)
  }
  showPermissionsDialog.value = true
}

const confirmPermissions = async () => {
  if (!contextMenuFile.value) return
  
  try {
    const mode = parseInt(computedOctalPermission.value, 8)
    const result = await window.electronAPI.sftp.chmod(props.connectionId, contextMenuFile.value.path, mode)
    if (result.success) {
      ElMessage.success('权限修改成功')
      showPermissionsDialog.value = false
      refreshDirectory()
    } else {
      ElMessage.error(result.error || '权限修改失败')
    }
  } catch (error: any) {
    ElMessage.error('权限修改失败: ' + error.message)
  }
}

// 删除
const handleDelete = async () => {
  if (!contextMenuFile.value) return
  hideContextMenu()
  
  const file = contextMenuFile.value
  
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${file.name}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    let result
    if (file.type === 'directory') {
      result = await window.electronAPI.sftp.deleteDirectories(props.connectionId, [file.path])
    } else {
      result = await window.electronAPI.sftp.deleteFile(props.connectionId, file.path)
    }
    
    if (result.success) {
      ElMessage.success('删除成功')
      refreshDirectory()
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

// 预览文件
const handlePreview = async () => {
  if (!contextMenuFile.value || contextMenuFile.value.type !== 'file') return
  hideContextMenu()
  
  const file = contextMenuFile.value
  previewLoading.value = true
  previewContent.value = ''
  showPreviewDialog.value = true
  
  try {
    const result = await window.electronAPI.sftp.readFile(props.connectionId, file.path)
    if (result.success) {
      previewContent.value = result.data || ''
    } else {
      previewContent.value = `读取失败: ${result.error}`
    }
  } catch (error: any) {
    previewContent.value = `读取失败: ${error.message}`
  } finally {
    previewLoading.value = false
  }
}

// 编辑文件
const handleEdit = async () => {
  if (!contextMenuFile.value || contextMenuFile.value.type !== 'file') return
  hideContextMenu()
  
  const file = contextMenuFile.value
  editLoading.value = true
  editContent.value = ''
  editingFilePath.value = file.path
  showEditDialog.value = true
  
  try {
    const result = await window.electronAPI.sftp.readFile(props.connectionId, file.path)
    if (result.success) {
      editContent.value = result.data || ''
    } else {
      ElMessage.error(`读取失败: ${result.error}`)
      showEditDialog.value = false
    }
  } catch (error: any) {
    ElMessage.error(`读取失败: ${error.message}`)
    showEditDialog.value = false
  } finally {
    editLoading.value = false
  }
}

// 保存编辑的文件
const saveEditedFile = async () => {
  if (!editingFilePath.value) return
  
  editSaving.value = true
  try {
    const result = await window.electronAPI.sftp.writeFile(
      props.connectionId,
      editingFilePath.value,
      editContent.value
    )
    
    if (result.success) {
      ElMessage.success('保存成功')
      showEditDialog.value = false
      refreshDirectory()
    } else {
      ElMessage.error(result.error || '保存失败')
    }
  } catch (error: any) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    editSaving.value = false
  }
}

// SFTP 初始化状态
const sftpInitialized = ref(false)

// 获取初始目录（优先使用终端当前目录）
const getInitialPath = () => {
  if (props.currentDir && props.currentDir.trim()) {
    // 处理 ~ 开头的路径
    if (props.currentDir.startsWith('~')) {
      return props.currentDir.replace('~', '/root')
    }
    return props.currentDir
  }
  return '/root'
}

// 初始化 SFTP 连接
const initSFTP = async () => {
  if (sftpInitialized.value) return true
  
  loading.value = true
  try {
    await window.electronAPI.sftp.init(props.connectionId)
    sftpInitialized.value = true
    return true
  } catch (error: any) {
    ElMessage.error('SFTP 初始化失败: ' + error.message)
    return false
  } finally {
    loading.value = false
  }
}

// 点击外部关闭右键菜单
onMounted(async () => {
  document.addEventListener('click', hideContextMenu)
  // 先初始化 SFTP，然后加载目录（优先使用终端当前目录）
  const initialized = await initSFTP()
  if (initialized) {
    const initialPath = getInitialPath()
    loadDirectory(initialPath)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
})

// 是否需要同步到终端目录
const pendingSync = ref(false)

// 监听 connectionId 变化，重新初始化和加载
watch(() => props.connectionId, async () => {
  sftpInitialized.value = false
  pathHistory.value = []
  const initialized = await initSFTP()
  if (initialized) {
    const initialPath = getInitialPath()
    loadDirectory(initialPath)
  }
})

// 监听 currentDir 变化，如果有待同步请求则执行同步
watch(() => props.currentDir, (newDir) => {
  if (pendingSync.value && newDir) {
    pendingSync.value = false
    const targetPath = getInitialPath()
    console.log('[TerminalFilePanel] Syncing to:', targetPath)
    if (targetPath !== currentPath.value) {
      pathHistory.value.push(currentPath.value)
      loadDirectory(targetPath)
      ElMessage.success(`已同步到: ${targetPath}`)
    }
  }
})
</script>

<style scoped>
.terminal-file-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.path-nav {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}

.path-input {
  flex: 1;
}

.toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary);
}

.empty-state p {
  margin-top: 12px;
  font-size: 13px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.file-item:hover {
  background: var(--bg-hover);
}

.file-item.selected {
  background: var(--primary-color-light);
}

.file-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.file-item:has(.file-icon > .el-icon:first-child[class*="Folder"]) .file-icon {
  color: #f0a020;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  z-index: 9999;
  min-width: 140px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.menu-item:hover {
  background: var(--bg-hover);
}

.menu-item.danger {
  color: var(--danger-color);
}

.menu-item.danger:hover {
  background: rgba(245, 108, 108, 0.1);
}

/* 权限编辑器 */
.permissions-editor {
  padding: 8px 0;
}

.permission-group {
  margin-bottom: 16px;
}

.permission-group h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
}

.permission-checkboxes {
  display: flex;
  gap: 16px;
}

.permission-octal {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.octal-value {
  font-family: monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
  margin-left: 8px;
}

/* 预览和编辑 */
.preview-content {
  max-height: 500px;
  overflow: auto;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
  color: var(--text-secondary);
}

.preview-text {
  margin: 0;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 450px;
  overflow: auto;
}

.edit-content {
  min-height: 400px;
}

.edit-textarea :deep(.el-textarea__inner) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
}
</style>

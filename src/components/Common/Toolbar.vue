<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <el-button type="primary" :icon="Plus" @click="handleNewConnection">
        新建会话
      </el-button>
      <el-button :icon="Upload" @click="handleBatchImport">
        批量导入
      </el-button>
      <el-button :icon="Lightning" @click="handleQuickConnect">
        快速连接
      </el-button>
    </div>
    
    <div class="toolbar-right">
      <el-input
        v-model="searchQuery"
        placeholder="搜索会话..."
        :prefix-icon="Search"
        clearable
        style="width: 250px"
        @input="handleSearch"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Lightning, Search, Upload } from '@element-plus/icons-vue'

const searchQuery = ref('')

const emit = defineEmits<{
  newConnection: []
  quickConnect: []
  batchImport: []
  search: [query: string]
}>()

const handleNewConnection = () => {
  emit('newConnection')
}

const handleQuickConnect = () => {
  emit('quickConnect')
}

const handleBatchImport = () => {
  emit('batchImport')
}

const handleSearch = (query: string) => {
  emit('search', query)
}
</script>

<style scoped>
.toolbar {
  height: 48px;
  background: #2d2d2d;
  border-bottom: 1px solid #3e3e3e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

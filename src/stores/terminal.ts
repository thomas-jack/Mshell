import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SSHConnection } from '@/types/ssh'

export const useTerminalStore = defineStore('terminal', () => {
  const connections = ref<Map<string, SSHConnection>>(new Map())
  const activeConnectionId = ref<string | null>(null)

  function addConnection(connection: SSHConnection) {
    connections.value.set(connection.id, connection)
  }

  function removeConnection(id: string) {
    connections.value.delete(id)
    if (activeConnectionId.value === id) {
      activeConnectionId.value = null
    }
  }

  function updateConnectionStatus(
    id: string,
    status: SSHConnection['status'],
    error?: string
  ) {
    const connection = connections.value.get(id)
    if (connection) {
      connection.status = status
      connection.error = error
      connection.lastActivity = new Date()
    }
  }

  function setActiveConnection(id: string | null) {
    activeConnectionId.value = id
  }

  function getConnection(id: string): SSHConnection | undefined {
    return connections.value.get(id)
  }

  return {
    connections,
    activeConnectionId,
    addConnection,
    removeConnection,
    updateConnectionStatus,
    setActiveConnection,
    getConnection
  }
})

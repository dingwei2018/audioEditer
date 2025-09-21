import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const isLoading = ref(false)
  const isDarkMode = ref(false)
  const sidebarCollapsed = ref(false)
  const currentPage = ref('')

  // 计算属性
  const loadingText = computed(() => {
    return isLoading.value ? '加载中...' : ''
  })

  // 操作
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
    // 保存到本地存储
    localStorage.setItem('darkMode', isDarkMode.value.toString())
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setCurrentPage = (page: string) => {
    currentPage.value = page
  }

  // 初始化
  const init = () => {
    // 从本地存储恢复暗色模式设置
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode) {
      isDarkMode.value = savedDarkMode === 'true'
    }
  }

  return {
    // 状态
    isLoading,
    isDarkMode,
    sidebarCollapsed,
    currentPage,
    // 计算属性
    loadingText,
    // 操作
    setLoading,
    toggleDarkMode,
    toggleSidebar,
    setCurrentPage,
    init
  }
})

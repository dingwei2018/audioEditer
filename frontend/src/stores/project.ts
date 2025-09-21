import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, ProjectSettings } from '@/models/Project'
import { createProject } from '@/models/Project'

export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref<Project[]>([])
  const currentProjectId = ref<string>('')
  const isSaving = ref(false)

  // 本地存储键名
  const STORAGE_KEY = 'audio-editor-projects'

  // 计算属性
  const currentProject = computed(() => {
    return projects.value.find(project => project.id === currentProjectId.value)
  })

  const hasProjects = computed(() => {
    return projects.value.length > 0
  })

  // 本地存储操作
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.value))
    } catch (error) {
      console.error('保存项目到本地存储失败:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedProjects = JSON.parse(stored)
        // 转换日期字符串为 Date 对象
        projects.value = parsedProjects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        }))
      }
    } catch (error) {
      console.error('从本地存储加载项目失败:', error)
      projects.value = []
    }
  }

  // 操作
  const createNewProject = (name: string, description = '') => {
    const newProject = createProject(name, description)
    projects.value.push(newProject)
    currentProjectId.value = newProject.id
    saveToLocalStorage()
    return newProject.id
  }

  const loadProject = (id: string) => {
    const project = projects.value.find(p => p.id === id)
    if (project) {
      currentProjectId.value = id
      return project
    }
    return null
  }

  const saveProject = async (project: Project) => {
    isSaving.value = true
    try {
      const index = projects.value.findIndex(p => p.id === project.id)
      if (index > -1) {
        project.updatedAt = new Date()
        projects.value[index] = project
        saveToLocalStorage()
      }
      // 这里可以添加保存到后端的逻辑
      await new Promise(resolve => setTimeout(resolve, 500)) // 模拟保存延迟
    } finally {
      isSaving.value = false
    }
  }

  const deleteProject = (id: string) => {
    const index = projects.value.findIndex(p => p.id === id)
    if (index > -1) {
      projects.value.splice(index, 1)
      if (currentProjectId.value === id) {
        currentProjectId.value = projects.value[0]?.id || ''
      }
      saveToLocalStorage()
    }
  }

  const updateProjectSettings = (id: string, settings: Partial<ProjectSettings>) => {
    const project = projects.value.find(p => p.id === id)
    if (project) {
      project.settings = { ...project.settings, ...settings }
      project.updatedAt = new Date()
      saveToLocalStorage()
    }
  }

  const addTrackToProject = (projectId: string, trackId: string) => {
    const project = projects.value.find(p => p.id === projectId)
    if (project && !project.tracks.includes(trackId)) {
      project.tracks.push(trackId)
      project.updatedAt = new Date()
      saveToLocalStorage()
    }
  }

  const removeTrackFromProject = (projectId: string, trackId: string) => {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      const index = project.tracks.indexOf(trackId)
      if (index > -1) {
        project.tracks.splice(index, 1)
        project.updatedAt = new Date()
        saveToLocalStorage()
      }
    }
  }

  const exportProject = async (projectId: string) => {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) {
      throw new Error('项目不存在')
    }
    
    // 这里可以添加导出逻辑
    return {
      project,
      timestamp: new Date().toISOString()
    }
  }

  // 初始化
  const init = () => {
    loadFromLocalStorage()
  }

  // 清除所有数据
  const clearAllProjects = () => {
    projects.value = []
    currentProjectId.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    // 状态
    projects,
    currentProjectId,
    isSaving,
    // 计算属性
    currentProject,
    hasProjects,
    // 操作
    createNewProject,
    loadProject,
    saveProject,
    deleteProject,
    updateProjectSettings,
    addTrackToProject,
    removeTrackFromProject,
    exportProject,
    // 工具方法
    init,
    clearAllProjects,
    saveToLocalStorage,
    loadFromLocalStorage
  }
})

import { mockProjectApi } from '@/mock/api'

export interface ProjectData {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  tracks: any[]
  settings: any
}

export const projectApi = {
  // 获取所有项目
  async getProjects(): Promise<ProjectData[]> {
    const response = await mockProjectApi.getProjects()
    if (!response.success) {
      throw new Error(response.error || '获取项目列表失败')
    }
    return response.data!
  },

  // 获取项目详情
  async getProject(id: string): Promise<ProjectData> {
    const response = await mockProjectApi.getProject(id)
    if (!response.success) {
      throw new Error(response.error || '获取项目详情失败')
    }
    return response.data!
  },

  // 创建项目
  async createProject(data: { name: string; description?: string }): Promise<ProjectData> {
    const response = await mockProjectApi.createProject(data)
    if (!response.success) {
      throw new Error(response.error || '创建项目失败')
    }
    return response.data!
  },

  // 更新项目
  async updateProject(id: string, data: Partial<ProjectData>): Promise<ProjectData> {
    const response = await mockProjectApi.updateProject(id, data)
    if (!response.success) {
      throw new Error(response.error || '更新项目失败')
    }
    return response.data!
  },

  // 删除项目
  async deleteProject(id: string): Promise<void> {
    const response = await mockProjectApi.deleteProject(id)
    if (!response.success) {
      throw new Error(response.error || '删除项目失败')
    }
  },

  // 导出项目
  async exportProject(id: string): Promise<any> {
    const response = await mockProjectApi.exportProject(id)
    if (!response.success) {
      throw new Error(response.error || '导出项目失败')
    }
    return response.data!
  }
}
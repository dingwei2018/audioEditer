import api from './index'

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
    const response = await api.get('/projects')
    return response.data
  },

  // 获取项目详情
  async getProject(id: string): Promise<ProjectData> {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },

  // 创建项目
  async createProject(data: Partial<ProjectData>): Promise<ProjectData> {
    const response = await api.post('/projects', data)
    return response.data
  },

  // 更新项目
  async updateProject(id: string, data: Partial<ProjectData>): Promise<ProjectData> {
    const response = await api.put(`/projects/${id}`, data)
    return response.data
  },

  // 删除项目
  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`)
  },

  // 导出项目
  async exportProject(id: string): Promise<Blob> {
    const response = await api.get(`/projects/${id}/export`, {
      responseType: 'blob'
    })
    return response.data
  }
}

import voicesData from '../data/voices.json'
import projectsData from '../data/projects.json'

// 模拟网络延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟API响应结构
interface MockResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

const createMockResponse = <T>(data: T, message?: string): MockResponse<T> => ({
  success: true,
  data,
  message
})

const createErrorResponse = (error: string): MockResponse<any> => ({
  success: false,
  error
})

// TTS模拟API
export const mockTtsApi = {
  // 获取音色列表
  async getVoices(): Promise<MockResponse<typeof voicesData.voices>> {
    await delay(300)
    return createMockResponse(voicesData.voices, '获取音色列表成功')
  },

  // 获取音色分类
  async getVoiceCategories(): Promise<MockResponse<typeof voicesData.voiceCategories>> {
    await delay(200)
    return createMockResponse(voicesData.voiceCategories, '获取音色分类成功')
  },

  // 语音合成
  async synthesizeText(request: {
    text: string
    voice?: string
    speed?: number
    pitch?: number
    volume?: number
  }): Promise<MockResponse<{
    audioUrl: string
    duration: number
    size: number
    format: string
    taskId: string
  }>> {
    await delay(1500) // 模拟合成时间

    const { text } = request

    // 简单估算音频时长（按中文字符数计算，大约1.5字符/秒）
    const estimatedDuration = Math.max(1, text.length / 1.5)

    const result = {
      audioUrl: `/mock/audio/generated_${Date.now()}.mp3`,
      duration: parseFloat(estimatedDuration.toFixed(2)),
      size: Math.floor(estimatedDuration * 32000), // 估算文件大小
      format: 'mp3',
      taskId: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    return createMockResponse(result, '语音合成成功')
  },

  // 批量语音合成
  async batchSynthesize(requests: Array<{
    text: string
    voice?: string
    speed?: number
    pitch?: number
    volume?: number
  }>): Promise<MockResponse<Array<{
    audioUrl: string
    duration: number
    size: number
    format: string
    taskId: string
  }>>> {
    await delay(2000 * requests.length) // 批量合成需要更长时间

    const results = requests.map((request, index) => {
      const { text } = request
      const estimatedDuration = Math.max(1, text.length / 1.5)

      return {
        audioUrl: `/mock/audio/batch_generated_${Date.now()}_${index}.mp3`,
        duration: parseFloat(estimatedDuration.toFixed(2)),
        size: Math.floor(estimatedDuration * 32000),
        format: 'mp3',
        taskId: `batch_task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
      }
    })

    return createMockResponse(results, '批量语音合成成功')
  },

  // 预览音色
  async previewVoice(voiceId: string, _text?: string): Promise<MockResponse<{
    audioUrl: string
  }>> {
    await delay(500)

    const voice = voicesData.voices.find(v => v.id === voiceId)
    if (!voice) {
      return createErrorResponse(`音色 ${voiceId} 不存在`)
    }

    return createMockResponse({
      audioUrl: voice.previewUrl
    }, '音色预览生成成功')
  },

  // 获取合成任务状态
  async getTaskStatus(taskId: string): Promise<MockResponse<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    result?: any
  }>> {
    await delay(100)

    // 模拟任务状态变化
    const progress = Math.random() * 100
    const status = progress < 10 ? 'pending' :
                  progress < 90 ? 'processing' : 'completed'

    return createMockResponse({
      status,
      progress: Math.floor(progress),
      result: status === 'completed' ? {
        audioUrl: `/mock/audio/completed_${taskId}.mp3`,
        duration: 5.2,
        size: 166400,
        format: 'mp3'
      } : undefined
    })
  }
}

// 项目管理模拟API
export const mockProjectApi = {
  // 获取项目列表
  async getProjects(): Promise<MockResponse<typeof projectsData.projects>> {
    await delay(500)
    return createMockResponse(projectsData.projects, '获取项目列表成功')
  },

  // 获取项目详情
  async getProject(id: string): Promise<MockResponse<any>> {
    await delay(300)

    const project = projectsData.projects.find(p => p.id === id)
    if (!project) {
      return createErrorResponse(`项目 ${id} 不存在`)
    }

    // 关联轨道数据
    const projectTracks = projectsData.tracks.filter(track =>
      project.tracks.includes(track.id)
    )

    return createMockResponse({
      ...project,
      tracksData: projectTracks
    }, '获取项目详情成功')
  },

  // 创建项目
  async createProject(data: {
    name: string
    description?: string
  }): Promise<MockResponse<any>> {
    await delay(600)

    const newProject = {
      id: `project_${Date.now()}`,
      name: data.name,
      description: data.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tracks: [],
      settings: {
        outputFormat: 'mp3',
        sampleRate: 44100,
        bitRate: 128,
        channels: 2
      }
    }

    return createMockResponse(newProject, '项目创建成功')
  },

  // 更新项目
  async updateProject(id: string, data: any): Promise<MockResponse<any>> {
    await delay(400)

    const project = projectsData.projects.find(p => p.id === id)
    if (!project) {
      return createErrorResponse(`项目 ${id} 不存在`)
    }

    const updatedProject = {
      ...project,
      ...data,
      updatedAt: new Date().toISOString()
    }

    return createMockResponse(updatedProject, '项目更新成功')
  },

  // 删除项目
  async deleteProject(id: string): Promise<MockResponse<null>> {
    await delay(300)

    const project = projectsData.projects.find(p => p.id === id)
    if (!project) {
      return createErrorResponse(`项目 ${id} 不存在`)
    }

    return createMockResponse(null, '项目删除成功')
  },

  // 导出项目
  async exportProject(id: string): Promise<MockResponse<any>> {
    await delay(800)

    const project = projectsData.projects.find(p => p.id === id)
    if (!project) {
      return createErrorResponse(`项目 ${id} 不存在`)
    }

    const projectTracks = projectsData.tracks.filter(track =>
      project.tracks.includes(track.id)
    )

    const exportData = {
      project,
      tracks: projectTracks,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }

    return createMockResponse(exportData, '项目导出成功')
  }
}

// 音频轨道模拟API
export const mockAudioApi = {
  // 获取音频信息
  async getAudioInfo(_audioUrl: string): Promise<MockResponse<{
    duration: number
    format: string
    sampleRate: number
    channels: number
    size: number
  }>> {
    await delay(200)

    // 模拟音频信息
    const mockInfo = {
      duration: 5.2 + Math.random() * 10,
      format: 'mp3',
      sampleRate: 44100,
      channels: 2,
      size: Math.floor(Math.random() * 500000 + 100000)
    }

    return createMockResponse(mockInfo, '获取音频信息成功')
  }
}
export interface Project {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  tracks: string[]
  settings: ProjectSettings
}

export interface ProjectSettings {
  outputFormat: 'mp3' | 'wav' | 'aac'
  sampleRate: number
  bitRate: number
  channels: number
}

export const createProject = (name: string, description = ''): Project => {
  return {
    id: Date.now().toString(),
    name,
    description,
    createdAt: new Date(),
    updatedAt: new Date(),
    tracks: [],
    settings: {
      outputFormat: 'mp3',
      sampleRate: 44100,
      bitRate: 128,
      channels: 2
    }
  }
}

export const createDefaultProjectSettings = (): ProjectSettings => {
  return {
    outputFormat: 'mp3',
    sampleRate: 44100,
    bitRate: 128,
    channels: 2
  }
}
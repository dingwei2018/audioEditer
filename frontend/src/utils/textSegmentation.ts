/**
 * 文本分句工具类
 * 支持按标点符号、段落和AI智能分段
 */

export interface TextSegment {
  id: string
  text: string
  startIndex: number
  endIndex: number
  type: 'sentence' | 'paragraph' | 'ai'
}

export interface SegmentationOptions {
  method: 'punctuation' | 'paragraph' | 'ai'
  minLength?: number
  maxLength?: number
  preserveWhitespace?: boolean
}

export class TextSegmentation {
  /**
   * 按标点符号分句
   */
  static segmentByPunctuation(text: string, options: SegmentationOptions = { method: 'punctuation' }): TextSegment[] {
    const segments: TextSegment[] = []
    const { minLength = 1, maxLength = 200, preserveWhitespace = true } = options
    
    // 扩展的分句标点符号（句号、问号、感叹号、逗号、分号、顿号等）
    const sentenceEndings = /[。！？.!?，,；;、]/g
    
    let currentIndex = 0
    let segmentIndex = 0
    
    // 找到所有分句标点符号位置（包括逗号、分号等）
    const punctuationMatches = Array.from(text.matchAll(sentenceEndings))
    
    for (const match of punctuationMatches) {
      const endIndex = match.index! + 1
      const segmentText = text.slice(currentIndex, endIndex).trim()
      
      if (segmentText.length >= minLength && segmentText.length <= maxLength) {
        segments.push({
          id: `segment_${segmentIndex++}`,
          text: preserveWhitespace ? segmentText : segmentText.replace(/\s+/g, ' ').trim(),
          startIndex: currentIndex,
          endIndex: endIndex,
          type: 'sentence'
        })
      }
      
      currentIndex = endIndex
    }
    
    // 处理最后一段（如果没有标点符号结尾）
    if (currentIndex < text.length) {
      const lastSegment = text.slice(currentIndex).trim()
      if (lastSegment.length >= minLength && lastSegment.length <= maxLength) {
        segments.push({
          id: `segment_${segmentIndex++}`,
          text: preserveWhitespace ? lastSegment : lastSegment.replace(/\s+/g, ' ').trim(),
          startIndex: currentIndex,
          endIndex: text.length,
          type: 'sentence'
        })
      }
    }
    
    return segments
  }
  
  /**
   * 按段落分句
   */
  static segmentByParagraph(text: string, options: SegmentationOptions = { method: 'paragraph' }): TextSegment[] {
    const segments: TextSegment[] = []
    const { minLength = 1, maxLength = 1000, preserveWhitespace = true } = options
    
    // 按换行符分割段落
    const paragraphs = text.split(/\n\s*\n/)
    let currentIndex = 0
    let segmentIndex = 0
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim()
      
      if (trimmedParagraph.length >= minLength && trimmedParagraph.length <= maxLength) {
        const endIndex = currentIndex + paragraph.length
        
        segments.push({
          id: `segment_${segmentIndex++}`,
          text: preserveWhitespace ? trimmedParagraph : trimmedParagraph.replace(/\s+/g, ' ').trim(),
          startIndex: currentIndex,
          endIndex: endIndex,
          type: 'paragraph'
        })
      }
      
      currentIndex += paragraph.length + 2 // +2 for the double newline
    }
    
    return segments
  }
  
  /**
   * AI智能分段（基于语义和长度）
   */
  static segmentByAI(text: string, options: SegmentationOptions = { method: 'ai' }): TextSegment[] {
    const segments: TextSegment[] = []
    const { minLength = 10, maxLength = 150, preserveWhitespace = true } = options
    
    // 首先按标点符号分句
    const sentences = this.segmentByPunctuation(text, { 
      method: 'punctuation', 
      minLength: 1, 
      maxLength: 500,
      preserveWhitespace 
    })
    
    let currentSegment = ''
    let currentStartIndex = 0
    let segmentIndex = 0
    
    for (const sentence of sentences) {
      const testSegment = currentSegment + (currentSegment ? ' ' : '') + sentence.text
      
      // 如果添加当前句子后超过最大长度，则创建新段落
      if (testSegment.length > maxLength && currentSegment.length >= minLength) {
        segments.push({
          id: `segment_${segmentIndex++}`,
          text: preserveWhitespace ? currentSegment : currentSegment.replace(/\s+/g, ' ').trim(),
          startIndex: currentStartIndex,
          endIndex: currentStartIndex + currentSegment.length,
          type: 'ai'
        })
        
        currentSegment = sentence.text
        currentStartIndex = sentence.startIndex
      } else {
        currentSegment = testSegment
        if (currentSegment === sentence.text) {
          currentStartIndex = sentence.startIndex
        }
      }
    }
    
    // 添加最后一个段落
    if (currentSegment.length >= minLength) {
      segments.push({
        id: `segment_${segmentIndex++}`,
        text: preserveWhitespace ? currentSegment : currentSegment.replace(/\s+/g, ' ').trim(),
        startIndex: currentStartIndex,
        endIndex: currentStartIndex + currentSegment.length,
        type: 'ai'
      })
    }
    
    return segments
  }
  
  /**
   * 主要分句方法
   */
  static segment(text: string, options: SegmentationOptions): TextSegment[] {
    if (!text || !text.trim()) {
      return []
    }
    
    switch (options.method) {
      case 'punctuation':
        return this.segmentByPunctuation(text, options)
      case 'paragraph':
        return this.segmentByParagraph(text, options)
      case 'ai':
        return this.segmentByAI(text, options)
      default:
        return this.segmentByPunctuation(text, options)
    }
  }
  
  /**
   * 合并相邻的短句
   */
  static mergeShortSegments(segments: TextSegment[], minLength: number = 20): TextSegment[] {
    if (segments.length <= 1) return segments
    
    const merged: TextSegment[] = []
    let currentSegment = { ...segments[0] }
    
    for (let i = 1; i < segments.length; i++) {
      const nextSegment = segments[i]
      
      // 如果当前段落太短，尝试与下一个段落合并
      if (currentSegment.text.length < minLength) {
        const mergedText = currentSegment.text + ' ' + nextSegment.text
        currentSegment = {
          ...currentSegment,
          text: mergedText,
          endIndex: nextSegment.endIndex
        }
      } else {
        merged.push(currentSegment)
        currentSegment = { ...nextSegment }
      }
    }
    
    merged.push(currentSegment)
    return merged
  }
  
  /**
   * 验证分句结果
   */
  static validateSegments(segments: TextSegment[], originalText: string): boolean {
    if (segments.length === 0) return true
    
    // 检查是否覆盖了所有文本
    const firstSegment = segments[0]
    const lastSegment = segments[segments.length - 1]
    
    if (firstSegment.startIndex !== 0 || lastSegment.endIndex !== originalText.length) {
      return false
    }
    
    // 检查是否有重叠或间隙
    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i]
      const next = segments[i + 1]
      
      if (current.endIndex !== next.startIndex) {
        return false
      }
    }
    
    return true
  }
}

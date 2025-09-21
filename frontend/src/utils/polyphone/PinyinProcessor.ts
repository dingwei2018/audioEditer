import pinyin from 'pinyin'

interface PolyphoneOption {
  pinyin: string
  tone: string
  meaning: string
  example?: string
}

interface PolyphoneAnalysis {
  char: string
  index: number
  context: string
  options: PolyphoneOption[]
}

interface TextAnalysisResult {
  totalCharacters: number
  polyphoneCount: number
  hasPolyphones: boolean
  polyphones: PolyphoneAnalysis[]
}

interface StatisticsResult {
  polyphoneRatio: number
  totalOptions: number
  mostCommonPolyphones: Array<{ char: string; count: number }>
}

class PinyinPolyphoneProcessor {
  /**
   * 分析文本中的多音字
   * @param text 要分析的文本
   * @returns 分析结果
   */
  static analyzePolyphones(text: string): TextAnalysisResult {
    const result: TextAnalysisResult = {
      totalCharacters: text.length,
      polyphoneCount: 0,
      hasPolyphones: false,
      polyphones: []
    }

    if (!text || text.trim() === '') {
      return result
    }

    const chars = text.split('')

    chars.forEach((char, index) => {
      // 只处理中文字符
      if (this.isChineseCharacter(char)) {
        const polyphoneOptions = this.getPolyphoneOptions(char)

        if (polyphoneOptions.length > 1) {
          result.polyphoneCount++
          result.hasPolyphones = true

          // 获取上下文（前后各3个字符）
          const contextStart = Math.max(0, index - 3)
          const contextEnd = Math.min(text.length, index + 4)
          const context = text.substring(contextStart, contextEnd)

          result.polyphones.push({
            char,
            index,
            context,
            options: polyphoneOptions
          })
        }
      }
    })

    return result
  }

  /**
   * 获取字符的所有可能读音
   * @param char 中文字符
   * @returns 读音选项数组
   */
  static getPolyphoneOptions(char: string): PolyphoneOption[] {
    if (!this.isChineseCharacter(char)) {
      return []
    }

    try {
      // 使用 pinyin 库获取所有可能的读音
      const pinyinResults = pinyin(char, {
        heteronym: true, // 启用多音字模式
        segment: false // 不分词
      })

      if (!pinyinResults || !pinyinResults[0]) {
        return []
      }

      const pronunciations = pinyinResults[0]

      // 如果没有读音数据或不是数组，返回空
      if (!pronunciations || !Array.isArray(pronunciations) || pronunciations.length <= 1) {
        return []
      }

      // 转换为我们的格式
      return pronunciations.map((pronunciation: string) => ({
        pinyin: this.normalizePinyin(pronunciation),
        tone: this.getToneNumber(pronunciation),
        meaning: this.getMeaningByPronunciation(pronunciation),
        example: char
      }))
    } catch (error) {
      console.error('Error getting polyphone options for char:', char, error)
      return []
    }
  }

  /**
   * 推荐发音（基于上下文）
   * @param char 字符
   * @param context 上下文
   * @returns 推荐的读音选项
   */
  static recommendPronunciation(char: string, context: string): PolyphoneOption[] {
    const options = this.getPolyphoneOptions(char)

    if (options.length === 0) {
      return []
    }

    // 简单的上下文匹配逻辑
    // 这里可以根据需要扩展更复杂的推荐算法
    const contextBasedRecommendation = this.getContextBasedRecommendation(char, context, options)

    if (contextBasedRecommendation) {
      return [contextBasedRecommendation]
    }

    // 如果没有特定的上下文匹配，返回最常用的读音（第一个）
    return [options[0]]
  }

  /**
   * 获取统计信息
   * @param analysis 分析结果
   * @returns 统计信息
   */
  static getStatistics(analysis: TextAnalysisResult): StatisticsResult {
    const polyphoneRatio = analysis.totalCharacters > 0
      ? analysis.polyphoneCount / analysis.totalCharacters
      : 0

    const totalOptions = analysis.polyphones.reduce((total, polyphone) => {
      return total + polyphone.options.length
    }, 0)

    // 统计最常见的多音字
    const charCounts: Record<string, number> = {}
    analysis.polyphones.forEach(polyphone => {
      charCounts[polyphone.char] = (charCounts[polyphone.char] || 0) + 1
    })

    const mostCommonPolyphones = Object.entries(charCounts)
      .map(([char, count]) => ({ char, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // 取前5个最常见的

    return {
      polyphoneRatio,
      totalOptions,
      mostCommonPolyphones
    }
  }

  /**
   * 判断是否为中文字符
   * @param char 字符
   * @returns 是否为中文字符
   */
  private static isChineseCharacter(char: string): boolean {
    const code = char.charCodeAt(0)
    return code >= 0x4e00 && code <= 0x9fff
  }

  /**
   * 标准化拼音格式
   * @param pinyinStr 拼音字符串
   * @returns 标准化后的拼音
   */
  private static normalizePinyin(pinyinStr: string): string {
    // 移除声调符号，保持纯拼音
    return pinyinStr.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùüǘǚǜ]/g, (match) => {
      const toneMap: Record<string, string> = {
        'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
        'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
        'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
        'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
        'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
        'ü': 'ü', 'ǘ': 'ü', 'ǚ': 'ü', 'ǜ': 'ü'
      }
      return toneMap[match] || match
    })
  }

  /**
   * 获取声调数字
   * @param pinyinStr 拼音字符串
   * @returns 声调数字字符串
   */
  private static getToneNumber(pinyinStr: string): string {
    const tonePattern = /[āáǎàēéěèīíǐìōóǒòūúǔùüǘǚǜ]/
    const match = pinyinStr.match(tonePattern)

    if (!match) return '0'

    const toneMap: Record<string, string> = {
      'ā': '1', 'á': '1', 'ǎ': '3', 'à': '4',
      'ē': '1', 'é': '2', 'ě': '3', 'è': '4',
      'ī': '1', 'í': '2', 'ǐ': '3', 'ì': '4',
      'ō': '1', 'ó': '2', 'ǒ': '3', 'ò': '4',
      'ū': '1', 'ú': '2', 'ǔ': '3', 'ù': '4',
      'ü': '1', 'ǘ': '2', 'ǚ': '3', 'ǜ': '4'
    }

    const firstToneChar = match[0]
    return toneMap[firstToneChar] || '0'
  }

  /**
   * 根据发音获取含义（简化实现）
   * @param char 字符
   * @param pronunciation 发音
   * @returns 含义描述
   */
  private static getMeaningByPronunciation(pronunciation: string): string {
    // 这里可以实现更复杂的含义匹配逻辑
    // 目前返回一个基本的描述
    const tone = this.getToneNumber(pronunciation)
    const basePinyin = this.normalizePinyin(pronunciation)
    return `${basePinyin} (${tone}声)`
  }

  /**
   * 基于上下文的推荐算法
   * @param char 字符
   * @param context 上下文
   * @param options 可选读音
   * @returns 推荐的读音
   */
  private static getContextBasedRecommendation(
    char: string,
    context: string,
    options: PolyphoneOption[]
  ): PolyphoneOption | null {
    // 这里可以实现基于上下文的智能推荐
    // 例如基于词频、语言模型等

    // 简单的规则匹配示例
    const contextRules: Record<string, Record<string, string>> = {
      '的': {
        '目的': 'dì',
        '的确': 'dí',
        // 默认助词读音是轻声
        'default': 'de'
      },
      '了': {
        '了解': 'liǎo',
        '明了': 'liǎo',
        // 默认完成时读音是轻声
        'default': 'le'
      },
      '着': {
        '着急': 'zháo',
        '着火': 'zháo',
        '着手': 'zhuó',
        // 默认进行时读音是轻声
        'default': 'zhe'
      }
    }

    const rules = contextRules[char]
    if (!rules) {
      return null
    }

    // 检查上下文中是否包含特定词组
    for (const [phrase, expectedPinyin] of Object.entries(rules)) {
      if (phrase !== 'default' && context.includes(phrase)) {
        const matchingOption = options.find(opt =>
          opt.pinyin.toLowerCase() === expectedPinyin.toLowerCase()
        )
        if (matchingOption) {
          return matchingOption
        }
      }
    }

    // 如果没有匹配到特定规则，使用默认规则
    if (rules.default) {
      const matchingOption = options.find(opt =>
        opt.pinyin.toLowerCase() === rules.default.toLowerCase()
      )
      if (matchingOption) {
        return matchingOption
      }
    }

    return null
  }
}

export default PinyinPolyphoneProcessor
export type { PolyphoneOption, PolyphoneAnalysis, TextAnalysisResult, StatisticsResult }
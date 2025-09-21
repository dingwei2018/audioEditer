import polyphoneData from './polyphone-data.json'

/**
 * 多音字选项接口
 */
export interface PolyphoneOption {
  pinyin: string
  tone: string
  meaning: string
  example: string
}

/**
 * 多音字位置信息
 */
export interface PolyphonePosition {
  char: string
  index: number
  options: PolyphoneOption[]
  context: string // 上下文，用于智能推荐
}

/**
 * 多音字分析结果
 */
export interface PolyphoneAnalysis {
  originalText: string
  polyphones: PolyphonePosition[]
  hasPolyphones: boolean
  totalCharacters: number
  polyphoneCount: number
}

/**
 * 多音字工具类
 */
export class PolyphoneProcessor {
  private static polyphoneMap: Map<string, PolyphoneOption[]> = new Map()

  /**
   * 初始化多音字数据
   */
  static initialize() {
    if (this.polyphoneMap.size === 0) {
      Object.entries(polyphoneData.多音字).forEach(([char, options]) => {
        this.polyphoneMap.set(char, options as PolyphoneOption[])
      })
    }
  }

  /**
   * 检测文本中的所有多音字
   * @param text 输入文本
   * @param contextLength 上下文长度，默认为3个字符
   * @returns 多音字分析结果
   */
  static analyzePolyphones(text: string, contextLength: number = 3): PolyphoneAnalysis {
    this.initialize()

    const polyphones: PolyphonePosition[] = []
    const textArray = Array.from(text)

    textArray.forEach((char, index) => {
      if (this.polyphoneMap.has(char)) {
        const options = this.polyphoneMap.get(char)!

        // 获取上下文
        const startIndex = Math.max(0, index - contextLength)
        const endIndex = Math.min(textArray.length, index + contextLength + 1)
        const context = textArray.slice(startIndex, endIndex).join('')

        polyphones.push({
          char,
          index,
          options,
          context
        })
      }
    })

    return {
      originalText: text,
      polyphones,
      hasPolyphones: polyphones.length > 0,
      totalCharacters: textArray.length,
      polyphoneCount: polyphones.length
    }
  }

  /**
   * 根据上下文智能推荐多音字读音
   * @param char 多音字
   * @param context 上下文
   * @returns 推荐的读音选项，如果无法确定则返回所有选项
   */
  static recommendPronunciation(char: string, context: string): PolyphoneOption[] {
    this.initialize()

    const options = this.polyphoneMap.get(char)
    if (!options) {
      return []
    }

    // 基于上下文的简单推荐规则
    const recommendations = this.getContextBasedRecommendations(char, context, options)

    if (recommendations.length > 0) {
      return recommendations
    }

    // 如果没有特定推荐，返回第一个（通常是最常用的）
    return [options[0]]
  }

  /**
   * 基于上下文的推荐规则
   */
  private static getContextBasedRecommendations(
    char: string,
    context: string,
    options: PolyphoneOption[]
  ): PolyphoneOption[] {
    const rules: { [key: string]: { patterns: string[], pinyin: string }[] } = {
      '便': [
        { patterns: ['便宜', '便利店'], pinyin: 'pián' },
        { patterns: ['方便', '便于', '便民'], pinyin: 'biàn' }
      ],
      '处': [
        { patterns: ['处理', '处置', '处罚'], pinyin: 'chǔ' },
        { patterns: ['住处', '去处', '处所'], pinyin: 'chù' }
      ],
      '传': [
        { patterns: ['传说', '传递', '传播'], pinyin: 'chuán' },
        { patterns: ['传记', '自传', '传奇'], pinyin: 'zhuàn' }
      ],
      '当': [
        { patterns: ['当时', '当年', '当日'], pinyin: 'dāng' },
        { patterns: ['当作', '当成', '当做'], pinyin: 'dàng' }
      ],
      '都': [
        { patterns: ['都是', '都有', '都会'], pinyin: 'dōu' },
        { patterns: ['首都', '古都', '京都'], pinyin: 'dū' }
      ],
      '发': [
        { patterns: ['发现', '发生', '发出'], pinyin: 'fā' },
        { patterns: ['头发', '毛发'], pinyin: 'fà' }
      ],
      '好': [
        { patterns: ['好的', '很好', '好吃'], pinyin: 'hǎo' },
        { patterns: ['爱好', '好奇', '好学'], pinyin: 'hào' }
      ],
      '还': [
        { patterns: ['还有', '还是', '还会'], pinyin: 'hái' },
        { patterns: ['还债', '还款', '归还'], pinyin: 'huán' }
      ],
      '乐': [
        { patterns: ['快乐', '高兴', '乐观'], pinyin: 'lè' },
        { patterns: ['音乐', '乐器', '乐曲'], pinyin: 'yuè' }
      ],
      '重': [
        { patterns: ['重要', '严重', '重点'], pinyin: 'zhòng' },
        { patterns: ['重复', '重来', '重新'], pinyin: 'chóng' }
      ]
    }

    const charRules = rules[char]
    if (!charRules) {
      return []
    }

    for (const rule of charRules) {
      if (rule.patterns.some(pattern => context.includes(pattern))) {
        const matchingOption = options.find(option => option.pinyin === rule.pinyin)
        if (matchingOption) {
          return [matchingOption]
        }
      }
    }

    return []
  }

  /**
   * 获取单个字符的多音字选项
   * @param char 汉字字符
   * @returns 多音字选项数组，如果不是多音字返回空数组
   */
  static getPolyphoneOptions(char: string): PolyphoneOption[] {
    this.initialize()
    return this.polyphoneMap.get(char) || []
  }

  /**
   * 检查字符是否为多音字
   * @param char 汉字字符
   * @returns 是否为多音字
   */
  static isPolyphone(char: string): boolean {
    this.initialize()
    return this.polyphoneMap.has(char)
  }

  /**
   * 获取所有多音字列表
   * @returns 所有多音字的数组
   */
  static getAllPolyphones(): string[] {
    this.initialize()
    return Array.from(this.polyphoneMap.keys())
  }

  /**
   * 按拼音搜索多音字
   * @param pinyin 拼音（可以是不完整的）
   * @returns 包含该拼音的多音字信息
   */
  static searchByPinyin(pinyin: string): Array<{
    char: string
    matchedOptions: PolyphoneOption[]
  }> {
    this.initialize()
    const results: Array<{ char: string; matchedOptions: PolyphoneOption[] }> = []

    this.polyphoneMap.forEach((options, char) => {
      const matchedOptions = options.filter(option =>
        option.pinyin.toLowerCase().includes(pinyin.toLowerCase())
      )

      if (matchedOptions.length > 0) {
        results.push({ char, matchedOptions })
      }
    })

    return results
  }

  /**
   * 生成多音字标注文本（用于TTS）
   * @param text 原始文本
   * @param pronunciationChoices 用户选择的读音 { index: pinyinChoice }
   * @returns 标注后的文本
   */
  static generateAnnotatedText(
    text: string,
    pronunciationChoices: { [index: number]: string }
  ): string {
    const analysis = this.analyzePolyphones(text)
    let annotatedText = text

    // 从后往前替换，避免索引位置变化
    analysis.polyphones
      .sort((a, b) => b.index - a.index)
      .forEach(polyphone => {
        const chosenPinyin = pronunciationChoices[polyphone.index]
        if (chosenPinyin) {
          // 使用SSML标记或自定义格式标注读音
          const annotation = `<phoneme alphabet="py" ph="${chosenPinyin}">${polyphone.char}</phoneme>`
          annotatedText =
            annotatedText.substring(0, polyphone.index) +
            annotation +
            annotatedText.substring(polyphone.index + 1)
        }
      })

    return annotatedText
  }

  /**
   * 批量分析多个文本的多音字
   * @param texts 文本数组
   * @returns 批量分析结果
   */
  static batchAnalyze(texts: string[]): PolyphoneAnalysis[] {
    return texts.map(text => this.analyzePolyphones(text))
  }

  /**
   * 导出多音字统计信息
   * @param analysis 分析结果
   * @returns 统计信息
   */
  static getStatistics(analysis: PolyphoneAnalysis): {
    polyphoneRatio: number
    mostCommonPolyphones: Array<{ char: string; count: number }>
    totalOptions: number
  } {
    const charCount: { [char: string]: number } = {}

    analysis.polyphones.forEach(p => {
      charCount[p.char] = (charCount[p.char] || 0) + 1
    })

    const mostCommon = Object.entries(charCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([char, count]) => ({ char, count }))

    const totalOptions = analysis.polyphones.reduce(
      (sum, p) => sum + p.options.length,
      0
    )

    return {
      polyphoneRatio: analysis.totalCharacters > 0
        ? analysis.polyphoneCount / analysis.totalCharacters
        : 0,
      mostCommonPolyphones: mostCommon,
      totalOptions
    }
  }
}

// 导出便捷函数
export const analyzePolyphones = (text: string) => PolyphoneProcessor.analyzePolyphones(text)
export const isPolyphone = (char: string) => PolyphoneProcessor.isPolyphone(char)
export const getPolyphoneOptions = (char: string) => PolyphoneProcessor.getPolyphoneOptions(char)
export const recommendPronunciation = (char: string, context: string) =>
  PolyphoneProcessor.recommendPronunciation(char, context)

// 默认导出
export default PolyphoneProcessor
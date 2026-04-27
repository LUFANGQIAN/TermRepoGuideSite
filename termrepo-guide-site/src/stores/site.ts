import { computed } from 'vue'
import { defineStore } from 'pinia'

type NavItem = {
  label: string
  to: string
}

type Metric = {
  value: string
  label: string
}

type Feature = {
  status: string
  title: string
  description: string
  points: string[]
}

type Step = {
  index: string
  title: string
  description: string
  tips: string[]
  snippet?: string
}

type FaqItem = {
  question: string
  answer: string
}

type ChangeEntry = {
  date: string
  label: string
  title: string
  summary: string
  items: string[]
}

type WorkflowStage = {
  label: string
  title: string
  description: string
  tone: 'develop' | 'preview' | 'ship'
}

const navItems: NavItem[] = [
  { label: '首页', to: '/' },
  { label: '功能介绍', to: '/features' },
  { label: '使用指南', to: '/guide' },
  { label: '常见问题', to: '/faq' },
  { label: '更新日志', to: '/changelog' },
  { label: '创意实验', to: '/playground/splat' },
]

const heroMetrics: Metric[] = [
  { value: '本地优先', label: '插件核心体验以本地可用为前提' },
  { value: '5 条主线', label: '首版指南站围绕五个关键页面组织内容' },
  { value: '已形成闭环', label: '收藏术语到再次复用的本地流程已跑通' },
  { value: 'AI / 同步可选', label: '未来增强能力不会破坏当前轻量原则' },
]

const principles = [
  {
    title: '不是查词器，而是术语工作流',
    description:
      'TermRepo 关注的是开发者在阅读代码、命名和理解业务时遇到的术语积累问题，而不是做一个普通词典入口。',
  },
  {
    title: '本地优先，不把基础能力交给云端',
    description:
      '收藏、拆词、备注、搜索替换、导入导出这些基础能力必须独立可用，云能力只应是增强层。',
  },
  {
    title: '工具感明确，避免重 SaaS 体验',
    description:
      '插件不应该一打开就是登录，也不应该把运营面板和套餐心智塞进高频开发场景里。',
  },
]

const usageScenes = [
  {
    title: '阅读代码时沉淀术语',
    description: '看到值得记住的标识符，直接从编辑器里收藏，并补充备注与拆词理解。',
  },
  {
    title: '写命名时复用表达',
    description: '需要写 router、policy、guard 等表达时，可以把过去积累过的词条快速取回来。',
  },
  {
    title: '长期管理个人词库',
    description: '通过侧边栏视图持续清洗、编辑、扩展自己的术语资产，而不是依赖零散记录。',
  },
]

const workflowStages: WorkflowStage[] = [
  {
    label: '第一步',
    title: '收藏',
    description: '在阅读代码时直接收藏标识符与术语，不离开当前上下文。',
    tone: 'develop',
  },
  {
    label: '第二步',
    title: '理解',
    description: '自动拆词、补充备注、整理含义，让术语从“见过”变成“理解过”。',
    tone: 'preview',
  },
  {
    label: '第三步',
    title: '复用',
    description: '在命名和写代码时，通过词库搜索把过去积累的表达重新取回来。',
    tone: 'ship',
  },
]

const features: Feature[] = [
  {
    status: '当前已支持',
    title: '收藏单词与标识符',
    description:
      '支持从编辑器选区直接收藏单词，也支持无选区时手动输入，减少切换上下文的成本。',
    points: ['选区直接收藏', '无选区手动输入', '自动记录来源文件路径'],
  },
  {
    status: '当前已支持',
    title: '拆词与备注',
    description:
      '自动拆分 camelCase 与 snake_case，并允许为整体单词和拆词片段分别填写备注。',
    points: ['camelCase / snake_case 自动拆分', '整体备注', '拆词片段备注'],
  },
  {
    status: '当前已支持',
    title: '本地词库管理',
    description:
      '侧边栏 Webview 已提供搜索、新增、编辑、删除、复制词条和详情编辑能力。',
    points: ['搜索与筛选', '新增编辑删除', '词条复制与详情页'],
  },
  {
    status: '当前已支持',
    title: '编辑器内搜索替换',
    description:
      '通过固定触发符搜索词库并替换当前输入片段，把术语积累直接转成写代码时的复用效率。',
    points: ['固定触发符调用词库', '快速检索已有表达', '减少重复命名成本'],
  },
  {
    status: '当前已支持',
    title: '导入与导出',
    description:
      '本地词库支持 JSON 导入导出，便于迁移、备份和清理已有术语资产。',
    points: ['导出为 JSON', '从 JSON 导入', '导入时跳过重复项'],
  },
  {
    status: '规划中',
    title: 'AI 建议与云同步',
    description:
      '未来会优先考虑 AI 默认备注建议，其次再逐步接入同步与多端扩展，但它们都是增强项。',
    points: ['AI 默认备注建议', '可选云同步', '网页端与移动端延展'],
  },
]

const guideSteps: Step[] = [
  {
    index: '01',
    title: '安装插件',
    description:
      '当前指南站更适合作为说明入口。实际安装时，建议按项目当前分发方式获取 VSIX 后，在 VS Code 中安装扩展。',
    tips: ['在 VS Code 中打开扩展视图', '选择“从 VSIX 安装”', '安装后重载窗口以启用插件'],
  },
  {
    index: '02',
    title: '收藏第一个术语',
    description:
      '在代码中选中一个标识符，或者在无选区时手动输入单词，交给插件创建词条。',
    tips: ['可直接收藏如 indexRouter、retryPolicy、authGuard', '插件会自动拆词', '可补充整体备注与片段备注'],
  },
  {
    index: '03',
    title: '在侧边栏管理词库',
    description:
      '通过 Webview 词库界面搜索、编辑和整理词条，让个人命名体系逐步沉淀下来。',
    tips: ['搜索已有词条', '新增、编辑、删除', '查看并清洗拆词信息'],
  },
  {
    index: '04',
    title: '在编辑器里再次复用',
    description:
      '当你再次写到相关语义时，可以通过固定触发符检索词库并替换当前输入片段。',
    tips: ['适合高频命名场景', '减少来回查找旧表达', '把积累直接变成复用'],
    snippet: '%router',
  },
  {
    index: '05',
    title: '导入与导出词库',
    description:
      '当你需要备份、迁移或整理数据时，可以使用 JSON 导入导出能力。',
    tips: ['导出本地词库用于备份', '从已有 JSON 导入历史术语', '重复词条会被安全跳过'],
  },
]

const faqs: FaqItem[] = [
  {
    question: 'TermRepo 当前的数据是本地保存吗？',
    answer:
      '是的。当前插件最核心的前提就是本地优先，本地词库需要在无登录、无联网的情况下独立可用。',
  },
  {
    question: '当前使用插件需要联网吗？',
    answer:
      '基础能力不应依赖联网。未来如果接入 AI 建议或云同步，那也应被设计成可选增强项，而不是基础门槛。',
  },
  {
    question: '它是不是一个重 SaaS 产品？',
    answer:
      '不是。项目当前明确避免把插件做成强登录、强运营、强套餐心智的重 SaaS 体验，核心仍然是开发工具。',
  },
  {
    question: '未来会支持 AI 和同步吗？',
    answer:
      '会考虑，但优先级是先保持本地闭环稳定，再逐步增加 AI 默认备注建议、云同步和多端扩展能力。',
  },
  {
    question: '现在就有完整的网页端管理能力吗？',
    answer:
      '还没有。当前网页端更适合承担说明、指南和后续延展入口的角色，重管理能力并不是这个阶段的重点。',
  },
  {
    question: '当前是否开源、是否收费？',
    answer:
      '现有文档强调的是产品方向与能力边界，没有把开源策略或正式收费方案定为当前指南站需要强行承诺的内容。若后续有明确方案，应以项目正式说明为准。',
  },
]

const changelog: ChangeEntry[] = [
  {
    date: '2026-04-24',
    label: '指南站',
    title: '首版指南站前端骨架上线',
    summary:
      '完成 Vue 指南站的基础页面结构，围绕首页、功能介绍、使用指南、FAQ 与更新日志建立首版对外说明站。',
    items: ['替换默认 Vue 脚手架页面', '建立统一深色视觉语言', '补齐项目定位与内容边界说明'],
  },
  {
    date: '当前阶段',
    label: '插件',
    title: '插件本地闭环已形成',
    summary:
      '插件当前已经跑通收藏术语、理解术语、管理词库、再次复用的本地工作流。',
    items: ['收藏单词与标识符', '拆词、备注、搜索替换', '本地词库 JSON 导入导出'],
  },
  {
    date: '下一步',
    label: '路线图',
    title: '增强层将优先考虑 AI 备注建议',
    summary:
      '在不破坏本地优先原则的前提下，后续会逐步补充 AI 默认备注建议、云同步和多端扩展能力。',
    items: ['AI 默认备注建议', '可选云同步', '网页端与移动端复习能力'],
  },
]

export const useSiteStore = defineStore('site', () => {
  const latestEntry = computed(() => changelog[0])

  return {
    brandName: 'TermRepo',
    siteLabel: '指南站',
    navItems,
    heroMetrics,
    principles,
    usageScenes,
    workflowStages,
    features,
    guideSteps,
    faqs,
    changelog,
    latestEntry,
  }
})

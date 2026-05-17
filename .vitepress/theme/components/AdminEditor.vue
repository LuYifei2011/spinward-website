<script setup lang="ts">
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FilePlus2,
  FileText,
  Folder,
  FolderPlus,
  GitCommitHorizontal,
  GripVertical,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from '@lucide/vue'
import Sortable from 'sortablejs'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import localSidebar from '../../sidebar.json'
import TreeNodeView from './TreeNodeView.vue'

type TreeItem = {
  path: string
  type: 'file' | 'dir'
  sha?: string
}

type TreeNode = TreeItem & {
  name: string
  children: TreeNode[]
}

type SidebarItem = {
  text: string
  link?: string
  items?: SidebarItem[]
}

type PendingChange = {
  path: string
  content: string | null
}

const STORAGE_KEY = 'spinward-admin-editor-drafts-v2'
const PREFS_KEY = 'spinward-admin-editor-prefs-v1'

const activeTab = ref<'content' | 'sidebar'>('content')
const treeItems = ref<TreeItem[]>([])
const selectedPath = ref('')
const selectedType = ref<'file' | 'dir'>('file')
const currentContent = ref('')
const originalContent = ref('')
const sidebar = ref<SidebarItem[]>([])
const originalSidebarJson = ref('')
const pendingChanges = ref<Map<string, PendingChange>>(new Map())
const baseCommitSha = ref('')
const expandedDirs = ref<Set<string>>(new Set(['admin']))
const loading = ref(false)
const committing = ref(false)
const status = ref('')
const statusIsError = ref(false)
const commitMessage = ref('')
const authorName = ref('')
const authorEmail = ref('')
const showCommitDialog = ref(false)
const draggedPath = ref('')
const draggedType = ref<'file' | 'dir'>('file')
const sidebarListRef = ref<HTMLElement | null>(null)
let sidebarSortable: Sortable | null = null

const localMarkdownModules = import.meta.glob(
  ['../../../**/*.md', '!../../../node_modules/**', '!../../../.vitepress/cache/**', '!../../../.vitepress/dist/**'],
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
) as Record<string, string>

const treeRoots = computed(() => buildTree(treeItems.value))
const pendingList = computed(() => [...pendingChanges.value.values()].sort((a, b) => a.path.localeCompare(b.path)))
const hasPendingChanges = computed(() => pendingList.value.length > 0)
const cleanedSidebar = computed(() => cleanSidebar(sidebar.value))
const hasSidebarChanges = computed(() => JSON.stringify(cleanedSidebar.value) !== originalSidebarJson.value)
const selectedLabel = computed(() => selectedPath.value || '先从左侧选择一个 Markdown 文件')

function setStatus(message: string, isError = false) {
  status.value = message
  statusIsError.value = isError
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...init,
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const fallback = localApiFallback<T>(path, init)
    if (fallback) return fallback
    throw new Error('Cloudflare Functions API 未连接；本地预览只能读取内容，提交需部署到 Cloudflare Pages 后使用')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `请求失败：${response.status}`)
  }
  return data
}

function localApiFallback<T>(path: string, init?: RequestInit): T | null {
  if (init?.method && init.method !== 'GET') return null
  const url = new URL(path, window.location.origin)
  const files = Object.entries(localMarkdownModules)
    .map(([modulePath, content]) => ({ path: modulePath.replace(/^\.\.\/\.\.\/\.\.\//, ''), content }))
    .filter((item) => !item.path.startsWith('node_modules/') && !item.path.startsWith('.vitepress/cache/') && !item.path.startsWith('.vitepress/dist/'))

  if (url.pathname === '/api/editor/tree') {
    const dirs = new Map<string, TreeItem>()
    const fileItems = files.map((item) => {
      const parts = item.path.split('/')
      for (let index = 1; index < parts.length; index += 1) {
        const dir = parts.slice(0, index).join('/')
        dirs.set(dir, { path: dir, type: 'dir' })
      }
      return { path: item.path, type: 'file' as const, sha: 'local' }
    })
    return { ok: true, branch: 'local', baseCommitSha: 'local', items: [...dirs.values(), ...fileItems] } as T
  }

  if (url.pathname === '/api/editor/file') {
    const target = url.searchParams.get('path') || ''
    const file = files.find((item) => item.path === target)
    if (file) return { ok: true, path: target, sha: 'local', content: file.content } as T
  }

  if (url.pathname === '/api/editor/sidebar') {
    return { ok: true, path: '.vitepress/sidebar.json', sidebar: localSidebar } as T
  }

  return null
}

function buildTree(items: TreeItem[]) {
  const nodes = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const item of items) {
    nodes.set(item.path, {
      ...item,
      name: item.path.split('/').pop() || item.path,
      children: [],
    })
  }

  for (const node of nodes.values()) {
    const parentPath = node.path.includes('/') ? node.path.split('/').slice(0, -1).join('/') : ''
    const parent = parentPath ? nodes.get(parentPath) : null
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  const sortNodes = (list: TreeNode[]) => {
    list.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    list.forEach((node) => sortNodes(node.children))
  }
  sortNodes(roots)
  return roots
}

function normalizeInputPath(value: string, isFile = true) {
  const normalized = value.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/')
  if (!normalized || normalized.includes('..')) throw new Error('路径不能为空，且不能包含 ..')
  if (isFile && !normalized.endsWith('.md')) throw new Error('只能操作 .md 文件')
  return normalized
}

function getPendingContent(path: string) {
  const change = pendingChanges.value.get(path)
  return change && change.content !== null ? change.content : null
}

function updatePending(path: string, content: string | null) {
  const next = new Map(pendingChanges.value)
  next.set(path, { path, content })
  pendingChanges.value = next
}

function removePending(path: string) {
  const next = new Map(pendingChanges.value)
  next.delete(path)
  pendingChanges.value = next
}

function hasRemoteFile(path: string) {
  return treeItems.value.some((item) => item.type === 'file' && item.path === path && item.sha && item.sha !== 'local-new')
}

function ensureDirectory(path: string) {
  const parts = path.split('/')
  const dirs: TreeItem[] = []
  for (let i = 1; i < parts.length; i += 1) {
    dirs.push({ path: parts.slice(0, i).join('/'), type: 'dir' })
  }
  const known = new Set(treeItems.value.map((item) => `${item.type}:${item.path}`))
  treeItems.value = [...treeItems.value, ...dirs.filter((item) => !known.has(`${item.type}:${item.path}`))]
}

function upsertFile(path: string, sha = 'local-new') {
  ensureDirectory(path)
  if (!treeItems.value.some((item) => item.path === path && item.type === 'file')) {
    treeItems.value = [...treeItems.value, { path, type: 'file', sha }]
  }
}

function removeFileFromTree(path: string) {
  treeItems.value = treeItems.value.filter((item) => !(item.type === 'file' && item.path === path))
}

function applyPendingToTree() {
  for (const change of pendingChanges.value.values()) {
    if (change.content === null) removeFileFromTree(change.path)
    else upsertFile(change.path)
  }
}

function saveDrafts() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingList.value))
}

function loadDrafts() {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const changes = raw ? JSON.parse(raw) : []
    if (Array.isArray(changes)) {
      pendingChanges.value = new Map(changes.filter((item) => item?.path).map((item) => [item.path, item]))
    }
  } catch {
    pendingChanges.value = new Map()
  }
}

function savePrefs() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(PREFS_KEY, JSON.stringify({ authorName: authorName.value, authorEmail: authorEmail.value }))
}

function loadPrefs() {
  if (typeof localStorage === 'undefined') return
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
    authorName.value = prefs.authorName || ''
    authorEmail.value = prefs.authorEmail || ''
  } catch {}
}

async function loadTree() {
  loading.value = true
  try {
    const data = await api<{ items: TreeItem[]; baseCommitSha: string }>('/api/editor/tree')
    treeItems.value = data.items
    baseCommitSha.value = data.baseCommitSha
    applyPendingToTree()
    setStatus(`已加载 ${treeItems.value.filter((item) => item.type === 'file').length} 个 Markdown 文件；修改会自动保存到此浏览器`)
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '加载文件树失败', true)
  } finally {
    loading.value = false
  }
}

async function loadSidebar() {
  try {
    const data = await api<{ sidebar: SidebarItem[] }>('/api/editor/sidebar')
    sidebar.value = normalizeSidebar(data.sidebar)
    originalSidebarJson.value = JSON.stringify(cleanSidebar(sidebar.value))
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '加载侧边栏失败', true)
  }
}

async function selectItem(item: TreeItem) {
  selectedPath.value = item.path
  selectedType.value = item.type
  if (item.type === 'dir') {
    toggleDir(item.path)
    return
  }
  await loadFile(item.path)
}

function toggleDir(path: string) {
  const next = new Set(expandedDirs.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  expandedDirs.value = next
}

async function loadFile(path: string) {
  activeTab.value = 'content'
  const pending = getPendingContent(path)
  if (pending !== null) {
    currentContent.value = pending
    originalContent.value = pending
    setStatus(`已打开浏览器草稿：${path}`)
    return
  }
  try {
    const data = await api<{ content: string }>(`/api/editor/file?path=${encodeURIComponent(path)}`)
    currentContent.value = data.content
    originalContent.value = data.content
    setStatus(`已打开：${path}`)
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '读取文件失败', true)
  }
}

function createFile() {
  const value = window.prompt('输入新文件路径，例如 docs/new-page.md')
  if (!value) return
  try {
    const path = normalizeInputPath(value)
    if (treeItems.value.some((item) => item.path === path && item.type === 'file')) throw new Error('文件已存在')
    upsertFile(path)
    updatePending(path, `# ${path.split('/').pop()?.replace(/\.md$/, '') || '新页面'}\n`)
    selectedPath.value = path
    selectedType.value = 'file'
    loadFile(path)
    setStatus('新文件已创建为浏览器草稿，提交前不会写入 GitHub')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '新建失败', true)
  }
}

function createFolder() {
  const value = window.prompt('输入新文件夹路径，例如 docs/news')
  if (!value) return
  try {
    const path = normalizeInputPath(value, false).replace(/\/$/, '')
    if (!treeItems.value.some((item) => item.path === path && item.type === 'dir')) {
      treeItems.value = [...treeItems.value, { path, type: 'dir' }]
    }
    expandedDirs.value = new Set([...expandedDirs.value, path])
    setStatus(`已创建虚拟文件夹：${path}。Git 只会保存其中的 Markdown 文件。`)
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '新建文件夹失败', true)
  }
}

function selectedMarkdownFiles() {
  if (!selectedPath.value) return []
  if (selectedType.value === 'file') return [selectedPath.value]
  const prefix = `${selectedPath.value.replace(/\/$/, '')}/`
  return treeItems.value.filter((item) => item.type === 'file' && item.path.startsWith(prefix)).map((item) => item.path)
}

async function moveSelectionTo(targetDir: string, copy = false) {
  const paths = selectedMarkdownFiles()
  if (!paths.length) {
    setStatus('请选择文件，或把文件拖到左侧目录上', true)
    return
  }
  if (selectedPath.value === targetDir || targetDir.startsWith(`${selectedPath.value}/`)) {
    setStatus('不能移动到自身或子目录中', true)
    return
  }

  try {
    const sourceRoot = selectedPath.value.replace(/\/$/, '')
    const operations = paths.map((path) => {
      const filename = selectedType.value === 'file' ? path.split('/').pop() || path : path.slice(sourceRoot.length + 1)
      const nextPath = normalizeInputPath(`${targetDir.replace(/\/$/, '')}/${filename}`)
      return { from: path, to: nextPath }
    })

    for (const operation of operations) {
      const pending = getPendingContent(operation.from)
      const content = pending ?? (await api<{ content: string }>(`/api/editor/file?path=${encodeURIComponent(operation.from)}`)).content
      upsertFile(operation.to)
      updatePending(operation.to, content)
      if (!copy) {
        if (hasRemoteFile(operation.from)) updatePending(operation.from, null)
        else removePending(operation.from)
        removeFileFromTree(operation.from)
      }
    }

    selectedPath.value = operations[0].to
    selectedType.value = 'file'
    await loadFile(operations[0].to)
    setStatus(copy ? '已复制为浏览器草稿' : '已移动为浏览器草稿')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '移动失败', true)
  }
}

async function renameSelected() {
  if (!selectedPath.value) {
    setStatus('请先选择文件或文件夹', true)
    return
  }
  const value = window.prompt('输入新路径', selectedPath.value)
  if (!value) return
  try {
    const target = normalizeInputPath(value, selectedType.value === 'file').replace(/\/$/, '')
    const targetParent = target.includes('/') ? target.split('/').slice(0, -1).join('/') : ''
    if (!targetParent && selectedType.value === 'file') {
      await moveSelectionByExactTarget(target)
      return
    }
    await moveSelectionByExactTarget(target)
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '重命名失败', true)
  }
}

async function moveSelectionByExactTarget(target: string) {
  const paths = selectedMarkdownFiles()
  const sourceRoot = selectedPath.value.replace(/\/$/, '')
  const operations = paths.map((path) => {
    const nextPath = selectedType.value === 'file' ? target : `${target}/${path.slice(sourceRoot.length + 1)}`
    normalizeInputPath(nextPath)
    return { from: path, to: nextPath }
  })

  for (const operation of operations) {
    const pending = getPendingContent(operation.from)
    const content = pending ?? (await api<{ content: string }>(`/api/editor/file?path=${encodeURIComponent(operation.from)}`)).content
    upsertFile(operation.to)
    updatePending(operation.to, content)
    if (hasRemoteFile(operation.from)) updatePending(operation.from, null)
    else removePending(operation.from)
    removeFileFromTree(operation.from)
  }
  selectedPath.value = operations[0].to
  selectedType.value = 'file'
  await loadFile(operations[0].to)
  setStatus('已重命名为浏览器草稿')
}

async function copySelected() {
  const value = window.prompt('复制到文件夹路径，例如 docs/archive')
  if (!value) return
  await moveSelectionTo(normalizeInputPath(value, false), true)
}

function deleteSelected() {
  const paths = selectedMarkdownFiles()
  if (!paths.length) {
    setStatus('请选择文件或包含 Markdown 文件的文件夹', true)
    return
  }
  if (!window.confirm(`确认删除 ${paths.length} 个 Markdown 文件？删除也会先进入浏览器草稿。`)) return
  for (const path of paths) {
    if (hasRemoteFile(path)) updatePending(path, null)
    else removePending(path)
    removeFileFromTree(path)
  }
  selectedPath.value = ''
  currentContent.value = ''
  setStatus('删除已暂存在浏览器中')
}

function onDragStart(item: TreeItem) {
  draggedPath.value = item.path
  draggedType.value = item.type
}

async function onDropToDir(target: TreeItem) {
  if (!draggedPath.value || target.type !== 'dir') return
  selectedPath.value = draggedPath.value
  selectedType.value = draggedType.value
  await moveSelectionTo(target.path)
  draggedPath.value = ''
}

function normalizeSidebar(items: SidebarItem[]) {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    text: item.text || '',
    link: item.link || '',
    items: Array.isArray(item.items) ? item.items.map((child) => ({ text: child.text || '', link: child.link || '' })) : [],
  }))
}

function addSidebarItem() {
  sidebar.value = [...sidebar.value, { text: '新条目', link: '/' }]
}

function addSidebarChild(index: number) {
  const next = normalizeSidebar(sidebar.value)
  next[index].items = [...(next[index].items || []), { text: '子条目', link: '/' }]
  next[index].link = ''
  sidebar.value = next
}

function removeSidebarItem(index: number) {
  sidebar.value = sidebar.value.filter((_, itemIndex) => itemIndex !== index)
}

function removeSidebarChild(index: number, childIndex: number) {
  const next = normalizeSidebar(sidebar.value)
  next[index].items = next[index].items?.filter((_, itemIndex) => itemIndex !== childIndex)
  sidebar.value = next
}

function cleanSidebar(items: SidebarItem[]) {
  return items
    .map((item) => {
      const children = (item.items || []).filter((child) => child.text.trim()).map((child) => ({ text: child.text.trim(), link: child.link?.trim() || '/' }))
      if (children.length) return { text: item.text.trim(), items: children }
      return { text: item.text.trim(), link: item.link?.trim() || '/' }
    })
    .filter((item) => item.text)
}

function setupSidebarSortable() {
  sidebarSortable?.destroy()
  if (!sidebarListRef.value) return
  sidebarSortable = Sortable.create(sidebarListRef.value, {
    handle: '.sidebar-editor-drag',
    animation: 120,
    onEnd(event) {
      if (event.oldIndex === undefined || event.newIndex === undefined || event.oldIndex === event.newIndex) return
      const next = normalizeSidebar(sidebar.value)
      const [item] = next.splice(event.oldIndex, 1)
      next.splice(event.newIndex, 0, item)
      sidebar.value = next
    },
  })
}

function openCommitDialog() {
  if (!hasPendingChanges.value && !hasSidebarChanges.value) {
    setStatus('还没有可提交的改动。编辑文件会自动保存到浏览器，侧边栏改动也会一起提交。', true)
    return
  }
  showCommitDialog.value = true
}

async function commitAll() {
  if (!commitMessage.value.trim()) {
    setStatus('请填写提交消息', true)
    return
  }
  if (!authorName.value.trim() || !authorEmail.value.trim()) {
    setStatus('请填写作者名称和邮箱', true)
    return
  }
  committing.value = true
  try {
    const payload = {
      baseCommitSha: baseCommitSha.value,
      message: commitMessage.value,
      author: { name: authorName.value, email: authorEmail.value },
      changes: pendingList.value,
      sidebar: cleanedSidebar.value,
    }
    const data = await api<{ commitSha: string; branch: string }>('/api/editor/commit', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    pendingChanges.value = new Map()
    localStorage.removeItem(STORAGE_KEY)
    baseCommitSha.value = data.commitSha
    showCommitDialog.value = false
    originalSidebarJson.value = JSON.stringify(cleanedSidebar.value)
    await loadTree()
    setStatus(`已提交到 ${data.branch}：${data.commitSha.slice(0, 7)}`)
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '提交失败', true)
  } finally {
    committing.value = false
  }
}

async function discardAllChanges() {
  if (!hasPendingChanges.value && !hasSidebarChanges.value) {
    setStatus('没有需要丢弃的更改')
    return
  }
  if (!window.confirm('确认丢弃所有浏览器草稿和未提交的侧边栏改动？此操作不会影响 GitHub。')) return

  pendingChanges.value = new Map()
  if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  showCommitDialog.value = false
  currentContent.value = ''
  originalContent.value = ''
  selectedPath.value = ''
  selectedType.value = 'file'
  await Promise.all([loadTree(), loadSidebar()])
  setStatus('已丢弃所有未提交更改')
}

watch(currentContent, (value) => {
  if (!selectedPath.value || selectedType.value !== 'file') return
  if (value !== originalContent.value) {
    updatePending(selectedPath.value, value)
    setStatus(`已自动保存浏览器草稿：${selectedPath.value}`)
  }
})

watch(pendingChanges, saveDrafts, { deep: true })
watch([authorName, authorEmail], savePrefs)
watch(activeTab, async (tab) => {
  if (tab === 'sidebar') await nextTick().then(setupSidebarSortable)
})

onMounted(async () => {
  document.documentElement.classList.add('admin-editor-shell')
  document.body.classList.add('admin-editor-shell')
  window.scrollTo({ top: 0 })
  loadDrafts()
  loadPrefs()
  await Promise.all([loadTree(), loadSidebar()])
  await nextTick()
  setupSidebarSortable()
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('admin-editor-shell')
  document.body.classList.remove('admin-editor-shell')
  sidebarSortable?.destroy()
})
</script>

<template>
  <div class="admin-editor-page">
    <aside class="admin-editor-panel">
      <div class="admin-editor-toolbar">
        <button class="admin-editor-button icon-text" type="button" @click="loadTree" :disabled="loading" title="刷新远端文件列表">
          <RefreshCw :size="16" />刷新
        </button>
        <button class="admin-editor-button icon-text" type="button" @click="createFile" title="新建 Markdown 文件">
          <FilePlus2 :size="16" />新文件
        </button>
        <button class="admin-editor-button icon-text" type="button" @click="createFolder" title="新建文件夹">
          <FolderPlus :size="16" />新文件夹
        </button>
      </div>

      <div class="admin-editor-help">
        拖动文件到文件夹即可移动。所有修改会先保存到浏览器，点提交后再写入 GitHub。
      </div>

      <div class="admin-editor-tree" role="tree">
        <template v-for="node in treeRoots" :key="node.path">
          <TreeNodeView
            :node="node"
            :level="0"
            :expanded-dirs="expandedDirs"
            :selected-path="selectedPath"
            :selected-type="selectedType"
            :pending-paths="new Set(pendingList.map((item) => item.path))"
            @select="selectItem"
            @toggle="toggleDir"
            @drag-start="onDragStart"
            @drop-to-dir="onDropToDir"
          />
        </template>
        <div v-if="!treeRoots.length" class="admin-editor-empty">暂无 Markdown 文件</div>
      </div>
    </aside>

    <main class="admin-editor-main">
      <header class="admin-editor-header">
        <div>
          <strong>{{ selectedLabel }}</strong>
          <span>{{ pendingList.length }} 个文件草稿{{ hasSidebarChanges ? '，侧边栏有改动' : '' }}</span>
        </div>
        <div class="admin-editor-tabs">
          <button class="admin-editor-tab" :class="{ active: activeTab === 'content' }" type="button" @click="activeTab = 'content'">内容</button>
          <button class="admin-editor-tab" :class="{ active: activeTab === 'sidebar' }" type="button" @click="activeTab = 'sidebar'">侧边栏</button>
        </div>
      </header>

      <div class="admin-editor-status" :class="{ error: statusIsError }">{{ status }}</div>

      <section v-show="activeTab === 'content'" class="admin-editor-content">
        <v-md-editor v-model="currentContent" height="100%" left-toolbar="undo redo clear | h bold italic strikethrough quote | ul ol table hr | link image code" right-toolbar="preview sync-scroll fullscreen" />
        <div class="admin-editor-actions">
          <button class="admin-editor-button icon-text" type="button" @click="renameSelected">
            <Pencil :size="16" />重命名
          </button>
          <button class="admin-editor-button icon-text" type="button" @click="copySelected">
            <Copy :size="16" />复制到
          </button>
          <button class="admin-editor-danger icon-text" type="button" @click="deleteSelected">
            <Trash2 :size="16" />删除
          </button>
        </div>
      </section>

      <section v-show="activeTab === 'sidebar'" class="sidebar-editor">
        <div class="sidebar-editor-toolbar">
          <button class="admin-editor-button icon-text" type="button" @click="addSidebarItem">
            <FilePlus2 :size="16" />新增侧边栏条目
          </button>
          <button class="admin-editor-button icon-text" type="button" @click="loadSidebar">
            <RefreshCw :size="16" />重新读取
          </button>
        </div>
        <div ref="sidebarListRef" class="sidebar-editor-list">
          <div v-for="(item, index) in sidebar" :key="index" class="sidebar-editor-row">
            <button class="sidebar-editor-drag" type="button" title="拖拽排序">
              <GripVertical :size="16" />
            </button>
            <input v-model="item.text" class="admin-editor-input" placeholder="标题" />
            <input v-model="item.link" class="admin-editor-input" placeholder="链接，如 /about；有子条目时留空" />
            <div class="sidebar-editor-row-actions">
              <button class="admin-editor-button" type="button" @click="addSidebarChild(index)">子项</button>
              <button class="admin-editor-danger" type="button" @click="removeSidebarItem(index)">删除</button>
            </div>
            <div v-if="item.items?.length" class="sidebar-editor-children">
              <div v-for="(child, childIndex) in item.items" :key="childIndex" class="sidebar-editor-child">
                <input v-model="child.text" class="admin-editor-input" placeholder="子项标题" />
                <input v-model="child.link" class="admin-editor-input" placeholder="链接，如 /members" />
                <button class="admin-editor-danger" type="button" @click="removeSidebarChild(index, childIndex)">删除</button>
              </div>
            </div>
          </div>
          <div v-if="!sidebar.length" class="admin-editor-empty">暂无侧边栏条目</div>
        </div>
      </section>

      <footer class="admin-editor-footer">
        <span>文件草稿保存在本机浏览器。换设备或清除浏览器数据后不会保留。</span>
        <div class="admin-editor-footer-actions">
          <button class="admin-editor-danger icon-text" type="button" @click="discardAllChanges">
            <RotateCcw :size="16" />丢弃所有更改
          </button>
          <button class="admin-editor-button primary icon-text" type="button" @click="openCommitDialog">
            <GitCommitHorizontal :size="16" />提交到 GitHub
          </button>
        </div>
      </footer>
    </main>

    <div v-if="showCommitDialog" class="admin-editor-modal" role="dialog" aria-modal="true">
      <form class="admin-editor-dialog" @submit.prevent="commitAll">
        <header>
          <h2>提交到 GitHub</h2>
          <button class="admin-editor-icon-button" type="button" @click="showCommitDialog = false" title="关闭">
            <X :size="18" />
          </button>
        </header>
        <p>将提交 {{ pendingList.length }} 个文件草稿{{ hasSidebarChanges ? '，并同步侧边栏改动' : '' }}。</p>
        <label>
          提交消息
          <textarea v-model="commitMessage" class="admin-editor-textarea" placeholder="例如：更新成员介绍页面"></textarea>
        </label>
        <label>
          作者名称
          <input v-model="authorName" class="admin-editor-input" placeholder="你的名字" />
        </label>
        <label>
          作者邮箱
          <input v-model="authorEmail" class="admin-editor-input" placeholder="name@example.com" />
        </label>
        <div class="admin-editor-dialog-actions">
          <button class="admin-editor-button" type="button" @click="showCommitDialog = false">取消</button>
          <button class="admin-editor-button primary" type="submit" :disabled="committing">{{ committing ? '提交中' : '确认提交' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

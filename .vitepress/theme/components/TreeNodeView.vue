<script setup lang="ts">
import { ChevronDown, ChevronRight, FileText, Folder } from '@lucide/vue'

type TreeNode = {
  path: string
  type: 'file' | 'dir'
  name: string
  children: TreeNode[]
}

defineProps<{
  node: TreeNode
  level: number
  expandedDirs: Set<string>
  selectedPath: string
  selectedType: 'file' | 'dir'
  pendingPaths: Set<string>
}>()

defineEmits<{
  select: [node: TreeNode]
  toggle: [path: string]
  dragStart: [node: TreeNode]
  dropToDir: [node: TreeNode]
}>()
</script>

<template>
  <div>
    <button
      class="admin-editor-tree-item"
      :class="{ active: selectedPath === node.path && selectedType === node.type, dropTarget: node.type === 'dir' }"
      :style="{ paddingLeft: `${8 + level * 16}px` }"
      type="button"
      draggable="true"
      @click="$emit('select', node)"
      @dragstart="$emit('dragStart', node)"
      @dragover.prevent
      @drop.prevent="$emit('dropToDir', node)"
    >
      <ChevronDown v-if="node.type === 'dir' && expandedDirs.has(node.path)" :size="15" />
      <ChevronRight v-else-if="node.type === 'dir'" :size="15" />
      <FileText v-else :size="15" />
      <Folder v-if="node.type === 'dir'" :size="16" />
      <span v-else></span>
      <span class="admin-editor-tree-path">{{ node.name }}</span>
      <span v-if="pendingPaths.has(node.path)" class="admin-editor-draft-dot">草稿</span>
    </button>

    <div v-if="node.type === 'dir' && expandedDirs.has(node.path)">
      <TreeNodeView
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :level="level + 1"
        :expanded-dirs="expandedDirs"
        :selected-path="selectedPath"
        :selected-type="selectedType"
        :pending-paths="pendingPaths"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @drag-start="$emit('dragStart', $event)"
        @drop-to-dir="$emit('dropToDir', $event)"
      />
    </div>
  </div>
</template>

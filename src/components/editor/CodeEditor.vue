<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const container = ref<HTMLElement | null>(null)

let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!container.value) {
    return
  }

  editor = monaco.editor.create(container.value, {
    value: props.modelValue,

    language: 'plaintext',

    theme: 'vs-dark',

    automaticLayout: true,

    minimap: {
      enabled: false,
    },

    fontSize: 14,

    padding: {
      top: 16,
      bottom: 16,
    },

    lineNumbers: 'on',

    scrollBeyondLastLine: false,

    wordWrap: 'on',
  })

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor?.getValue() ?? '')
  })
})

watch(
  () => props.modelValue,
  (value) => {
    if (!editor) {
      return
    }

    if (editor.getValue() !== value) {
      editor.setValue(value)
    }
  },
)

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<template>
  <div
    ref="container"
    class="code-editor"
  />
</template>

<style scoped>
.code-editor {
  width: 100%;
  height: 100%;
}
</style>
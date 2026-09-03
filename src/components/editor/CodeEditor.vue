<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  watch,
} from 'vue'

import * as monaco from 'monaco-editor'

import {
  DEV_CANVAS_LANGUAGE,
  registerDevCanvasLanguage,
} from './devcanvasLanguage'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [
    value: string,
  ]
}>()

let editor:
  | monaco.editor.IStandaloneCodeEditor
  | null = null

onMounted(() => {
  const root =
    document.querySelector(
      '.code-editor',
    )

  if (!root) {
    return
  }

  registerDevCanvasLanguage()

  editor =
    monaco.editor.create(
      root as HTMLElement,
      {
        value: props.modelValue,

        language:
          DEV_CANVAS_LANGUAGE,

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

        tabSize: 2,

        renderWhitespace: 'selection',
      },
    )

  editor.onDidChangeModelContent(
    () => {
      emit(
        'update:modelValue',
        editor?.getValue() ?? '',
      )
    },
  )
})

watch(
  () => props.modelValue,
  (value) => {
    if (!editor) {
      return
    }

    if (
      editor.getValue() !== value
    ) {
      editor.setValue(value)
    }
  },
)

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<template>
  <div class="code-editor" />
</template>

<style scoped>
.code-editor {
  width: 100%;
  height: 100%;
}
</style>
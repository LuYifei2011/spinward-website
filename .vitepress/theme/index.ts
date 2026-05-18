import DefaultTheme from 'vitepress/theme'
import VMdEditor from '@kangc/v-md-editor/lib/codemirror-editor'
import '@kangc/v-md-editor/lib/style/codemirror-editor.css'
import vuepressTheme from '@kangc/v-md-editor/lib/theme/vuepress.js'
import '@kangc/v-md-editor/lib/theme/style/vuepress.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/scroll/simplescrollbars.css'
import Prism from 'prismjs'
import footnote from 'markdown-it-footnote'
import AdminEditor from './components/AdminEditor.vue'
import './style.css'

VMdEditor.use(vuepressTheme, {
  Prism,
  extend(md) {
    md.use(footnote)
    md.options.breaks = false
    // TODO: 和 VitePress 的 markdown-it 配置保持一致
  },
})

async function setupCodeMirror() {
  if (import.meta.env.SSR || VMdEditor.Codemirror) return
  const [{ default: CodeMirror }] = await Promise.all([
    import('codemirror'),
    import('codemirror/mode/markdown/markdown'),
    import('codemirror/addon/edit/continuelist'),
    import('codemirror/addon/edit/closebrackets'),
    import('codemirror/addon/edit/closetag'),
    import('codemirror/addon/edit/matchbrackets'),
    import('codemirror/addon/selection/active-line'),
    import('codemirror/addon/scroll/simplescrollbars'),
  ])
  VMdEditor.Codemirror = CodeMirror
}

export default {
  extends: DefaultTheme,
  async enhanceApp({ app }) {
    await setupCodeMirror()
    app.use(VMdEditor)
    app.component('AdminEditor', AdminEditor)
  },
}

import DefaultTheme from 'vitepress/theme'
import HomeLogo from './HomeLogo.vue'
import { h } from 'vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(HomeLogo),
    })
  },
}

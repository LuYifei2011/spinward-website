import { defineConfig } from 'vitepress'
import { withI18n } from 'vitepress-i18n'

// https://vitepress.dev/reference/site-config
const vitePressOptions = {
  title: "启旋游戏工作室",
  description: "创造无限可能的游戏世界",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/' },
      { text: '关于我们', link: '/about' },
      { text: '联系我们', link: '/contact' },
    ],

    sidebar: [
      {
        text: '关于我们',
        link: '/about'
      },
      {
        text: '组织章程',
        link: '/constitution'
      },
      {
        text: '团队成员',
        link: '/members'
      },
      {
        text: '联系我们',
        link: '/contact'
      },
    ],

    // socialLinks: [
    //   { icon: 'bilibili', link: 'https://space.bilibili.com/3546373351803036' },
    // ],

    footer: {
      copyright: '© 2026 启旋游戏工作室. 保留所有权利。',
    },
  }
}

const vitePressI18nOptions = {
  locales: ['zhHans'],
}

export default defineConfig(withI18n(vitePressOptions, vitePressI18nOptions))

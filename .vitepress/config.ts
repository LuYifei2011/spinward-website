import { defineConfig, type HeadConfig, type UserConfig } from 'vitepress'
import { withI18n } from 'vitepress-i18n'
import footnote from 'markdown-it-footnote'

// https://vitepress.dev/reference/site-config
const vitePressOptions: UserConfig = {
  title: "启旋游戏工作室",
  description: "创造无限可能的游戏世界",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      light: '/images/logo-light.svg',
      dark: '/images/logo-dark.svg',
    },

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
        text: '公约',
        link: '/convention'
      },
      {
        text: '成员管理办法',
        link: '/member-info-management'
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

    editLink: {
      pattern: 'https://github.com/LuYifei2011/spinward-website/edit/main/:path',
    },

    outline: {
      level: 'deep',
    },
  },
  sitemap: {
    hostname: 'https://spinward.pages.dev',
  },
  srcExclude: ['README.md'],
  lastUpdated: true,
  head: [['link', { rel: 'icon', href: '/favicon.ico' }] as HeadConfig],
  markdown: {
    config: (md) => {
      md.use(footnote)
    }
  },
}

const vitePressI18nOptions = {
  locales: ['zhHans'],
}

export default defineConfig(withI18n(vitePressOptions, vitePressI18nOptions))

---
layout: home

title: 启旋游戏工作室

hero:
  name: "启旋游戏工作室"
  text: "创造无限可能的游戏世界"
  tagline: 启旋游戏工作室致力于打造令人难忘的游戏体验，将创意与技术完美融合，为玩家带来前所未有的冒险旅程。
  image:
    src: /images/logo.svg
    alt: 启旋游戏工作室
  actions:
    - theme: brand
      text: 关于我们
      link: /about
    - theme: default
      text: 联系我们
      link: /contact

features:
  - title: American Soviet Cold War
    details: 还原了美国与苏联的冷战时期
    link: https://www.ccw.site/detail/6430b5f2d8146b06e0c3300a
    linkText: 了解更多
    icon:
      src: /images/projects/american-soviet-cold-war.webp
      alt: American Soviet Cold War
  - title: 星空深处
    details: 在星空的深处，究竟藏着什么秘密？
    link: https://www.ccw.site/detail/6784a63fe77d7c09f357513f
    linkText: 了解更多
    icon:
        src: /images/projects/星空深处.webp
        alt: 星空深处

  - title: 迷宫
    details: 你是一个鼠标，某一天，你意外地穿越到了2000年，你在这个陌生的电脑中游荡，发现这台电脑有些不对劲，你深入探索，到了一个奇怪的区域，一个红色的鼠标从角落蹿了出来，他好像有敌意，你碰到了他，你被他格式化了......
    link: https://www.ccw.site/detail/63c3ef78defdd851bb3d29b2
    linkText: 了解更多
    icon:
        src: /images/projects/迷宫.webp
        alt: 迷宫
---

<script setup>
import { VPTeamMembers } from 'vitepress/theme'
import { homeMembers } from './scripts/menbers'
import { onMounted, onUnmounted } from 'vue'

let _cleanup = null

onMounted(() => {
  const heroEl = document.querySelector('.VPHomeHero')
  const nameEl = heroEl?.querySelector('.name')
  if (!heroEl || !nameEl) return

  const extras = [...heroEl.querySelectorAll('.text, .tagline, .actions, .image')]

  // 全屏毛玻璃遮罩
  const overlay = document.createElement('div')
  overlay.className = 'scroll-glass-overlay'
  document.body.appendChild(overlay)

  // 在 hero 前插入滚动缓冲区，使 hero 初始在视口下方
  const DIST = window.innerHeight
  const spacer = document.createElement('div')
  spacer.style.height = DIST + 'px'
  heroEl.before(spacer)

  // 原标题与其余 hero 内容初始全部隐藏，由 JS 统一控制
  nameEl.style.opacity = '0'
  extras.forEach(el => { el.style.opacity = '0' })

  // 固定克隆：唯一显示的标题，负责从左下角飞到 hero 目标位置
  const nameClone = nameEl.cloneNode(true)
  nameClone.style.cssText = 'position:fixed;margin:0;z-index:20;pointer-events:none;'
  document.body.appendChild(nameClone)

  requestAnimationFrame(() => {
    const cloneH = nameClone.offsetHeight

    // 起始位置：左下角
    const startLeft = 32
    const startTop = window.innerHeight - 48 - cloneH

    // 目标位置：scrollY=0 时 nameEl 在文档中的位置，
    // 当 scrollY=DIST 时视口位置恰好是 getBoundingClientRect().top - DIST
    const nameRect = nameEl.getBoundingClientRect()
    const targetLeft = nameRect.left
    const targetTop = nameRect.top - DIST

    // 设置初始位置
    nameClone.style.left = startLeft + 'px'
    nameClone.style.top = startTop + 'px'

    const update = () => {
      const p = Math.min(window.scrollY / DIST, 1)

      // 毛玻璃遮罩淡入
      overlay.style.opacity = String(p)

      // 克隆从左下角平滑移动到 hero 目标位置
      nameClone.style.left = (startLeft + (targetLeft - startLeft) * p) + 'px'
      nameClone.style.top  = (startTop  + (targetTop  - startTop)  * p) + 'px'

      // 接近完成时：无缝切换为原始元素（位置完全重合时替换）
      if (p >= 0.98) {
        nameClone.style.opacity = '0'
        nameEl.style.opacity = '1'
      } else {
        nameClone.style.opacity = '1'
        nameEl.style.opacity = '0'
      }

      // 其余 hero 元素淡入
      extras.forEach(el => { el.style.opacity = String(p) })
    }

    window.addEventListener('scroll', update, { passive: true })
    update()

    _cleanup = () => {
      window.removeEventListener('scroll', update)
      overlay.remove()
      spacer.remove()
      nameClone.remove()
      nameEl.style.opacity = ''
      extras.forEach(el => { el.style.opacity = '' })
    }
  })
})

onUnmounted(() => {
  _cleanup?.()
  _cleanup = null
})
</script>

<style>
body .is-home {
  background-image: url('/images/backgrounds/light.webp');
  background-size: cover;
  background-attachment: fixed;
  background-position: center;
}
.dark body .is-home {
  background-image: url('/images/backgrounds/dark.webp');
}
@media (max-width: 768px) {
  body .is-home {
    background-image: url('/images/backgrounds/light-mobile.webp');
  }
  .dark body .is-home {
    background-image: url('/images/backgrounds/dark-mobile.webp');
  }
}

/* hero 其余元素由 JS 控制淡入，CSS 设初始状态防 SSR 闪烁 */
.is-home .VPHomeHero .text,
.is-home .VPHomeHero .tagline,
.is-home .VPHomeHero .actions,
.is-home .VPHomeHero .image {
  opacity: 0;
  will-change: opacity;
}

/* 全屏毛玻璃遮罩（背景层之上，内容层之下）*/
.scroll-glass-overlay {
  position: fixed;
  inset: 0;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  pointer-events: none;
  z-index: 5;
  will-change: opacity;
}
.dark .scroll-glass-overlay {
  background: rgba(20, 20, 20, 0.6);
}

/* 确保页面内容在毛玻璃遮罩之上渲染 */
.is-home .VPHome {
  position: relative;
  z-index: 10;
}

.is-home .VPHomeFeatures .VPImage {
  width: 100%;
  height: 200px;
  border-radius: 0.5rem;
  object-fit: cover;
}
</style>

<br />

# 核心团队

<VPTeamMembers size="small" :members="homeMembers" />

[查看更多成员](/members)

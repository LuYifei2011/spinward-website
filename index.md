---
layout: home

title: 启旋游戏工作室

hero:
  name: "启旋游戏工作室"
  text: "创造无限可能的游戏世界"
  tagline: 启旋游戏工作室致力于打造令人难忘的游戏体验，将创意与技术完美融合，为玩家带来前所未有的冒险旅程。
  image:
    src: /images/logo-light.svg
    alt: 启旋游戏工作室 Logo
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

  // 底部下拉提示
  const scrollHint = document.createElement('button')
  scrollHint.type = 'button'
  scrollHint.className = 'scroll-down-hint'
  scrollHint.setAttribute('aria-label', '向下滚动')
  scrollHint.innerHTML = '<span>向下滚动</span><i aria-hidden="true">↓</i>'
  scrollHint.addEventListener('click', () => {
    window.scrollTo({ top: DIST, behavior: 'smooth' })
  })
  document.body.appendChild(scrollHint)

  requestAnimationFrame(() => {
    const update = () => {
      const p = Math.min(window.scrollY / DIST, 1)

      // 毛玻璃遮罩淡入
      overlay.style.opacity = String(p)

      // hero 标题与其余元素同步淡入
      nameEl.style.opacity = String(p)

      // 其余 hero 元素淡入
      extras.forEach(el => { el.style.opacity = String(p) })

      // 下拉提示随滚动淡出
      scrollHint.style.opacity = String(1 - p)
      scrollHint.style.transform = `translateX(-50%) translateY(${p * 10}px)`
    }

    const onResize = () => {
      update()
    }

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    update()

    _cleanup = () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', onResize)
      overlay.remove()
      spacer.remove()
      scrollHint.remove()
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
.dark .VPHomeHero .VPImage {
  content: url('/images/logo-dark.svg');
}

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

.scroll-down-hint {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 12;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  background: rgba(10, 20, 48, 0.35);
  color: #fff;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  backdrop-filter: blur(6px);
  cursor: pointer;
  transition: opacity 180ms ease, transform 180ms ease, background-color 180ms ease;
}

.scroll-down-hint i {
  display: inline-block;
  font-style: normal;
  animation: scroll-hint-bounce 1.1s ease-in-out infinite;
}

.scroll-down-hint:hover {
  background: rgba(10, 20, 48, 0.5);
}

.dark .scroll-down-hint {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.35);
}

@keyframes scroll-hint-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(4px);
  }
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

html:not(.dark) {
  --vp-home-hero-name-color: #012180;
}
</style>

<br />

# 核心团队

<VPTeamMembers size="small" :members="homeMembers" />

[查看更多成员](/members)

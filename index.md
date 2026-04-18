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

  // 背景粒子层
  const particleLayer = document.createElement('div')
  particleLayer.className = 'background-particles'
  const particleCount = window.innerWidth < 768 ? 14 : 24
  const particles = []
  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement('span')
    particle.className = 'background-particle'
    const size = Math.random() * 6 + 3
    const x = Math.random() * window.innerWidth
    const y = Math.random() * window.innerHeight
    const vx = (Math.random() - 0.5) * 18
    const vy = (Math.random() - 0.5) * 12
    const phase = Math.random() * Math.PI * 2
    const alpha = Math.random() * 0.35 + 0.25
    particle.style.setProperty('--size', `${size}px`)
    particle.style.setProperty('--alpha', `${alpha}`)
    particleLayer.appendChild(particle)
    particles.push({ particle, x, y, vx, vy, size, phase, alpha })
  }
  document.body.appendChild(particleLayer)

  let animationFrame = 0
  let lastTimestamp = 0
  const animateParticles = timestamp => {
    if (!lastTimestamp) lastTimestamp = timestamp
    const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.05)
    lastTimestamp = timestamp

    const width = window.innerWidth
    const height = window.innerHeight
    const scrollFactor = Math.min(window.scrollY / Math.max(height, 1), 1)

    particles.forEach((entry, index) => {
      entry.x += entry.vx * delta * (1 + scrollFactor * 0.7)
      entry.y += entry.vy * delta * (1 + scrollFactor * 0.35)

      if (entry.x < -40) entry.x = width + 40
      if (entry.x > width + 40) entry.x = -40
      if (entry.y < -40) entry.y = height + 40
      if (entry.y > height + 40) entry.y = -40

      const pulse = 0.78 + Math.sin(timestamp / 900 + entry.phase) * 0.22
      const wobbleX = Math.sin(timestamp / 1800 + entry.phase + index) * 10
      const wobbleY = Math.cos(timestamp / 2100 + entry.phase + index) * 8
      const scale = 0.85 + Math.sin(timestamp / 1600 + entry.phase) * 0.25

      entry.particle.style.transform = `translate3d(${entry.x + wobbleX}px, ${entry.y + wobbleY}px, 0) scale(${scale})`
      entry.particle.style.opacity = String(entry.alpha * pulse)
    })

    animationFrame = window.requestAnimationFrame(animateParticles)
  }
  animationFrame = window.requestAnimationFrame(animateParticles)

  // 昼夜特效层（白天光晕气泡 / 夜晚流星）
  const fxLayer = document.createElement('div')
  fxLayer.className = 'theme-fx-layer'
  
  // 黑夜：流星
  for(let i = 0; i < 6; i++) {
    const meteor = document.createElement('div')
    meteor.className = 'fx-meteor'
    meteor.style.setProperty('--delay', `${Math.random() * 8}s`)
    meteor.style.setProperty('--top', `${Math.random() * 40}%`)
    meteor.style.setProperty('--left', `${Math.random() * 100}%`)
    fxLayer.appendChild(meteor)
  }

  // 白天：光晕气泡
  for(let i = 0; i < 10; i++) {
    const orb = document.createElement('div')
    orb.className = 'fx-day-orb'
    orb.style.setProperty('--delay', `${Math.random() * 6}s`)
    orb.style.setProperty('--left', `${Math.random() * 100}%`)
    orb.style.setProperty('--size', `${Math.random() * 80 + 40}px`)
    fxLayer.appendChild(orb)
  }
  document.body.appendChild(fxLayer)

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
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', onResize)
      particleLayer.remove()
      fxLayer.remove()
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

/* 背景粒子层 */
.background-particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 6;
  opacity: 0.9;
}

.background-particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  border-radius: 999px;
  background: radial-gradient(circle, rgba(24, 58, 156, 0.95) 0%, rgba(24, 58, 156, 0.28) 45%, transparent 72%);
  box-shadow: 0 0 18px rgba(24, 58, 156, 0.18);
  opacity: var(--alpha);
  transform: translate3d(0, 0, 0);
  will-change: transform, opacity;
}

.dark .background-particle {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(190, 210, 255, 0.28) 45%, transparent 72%);
  box-shadow: 0 0 20px rgba(120, 160, 255, 0.14);
}

/* 昼夜特效层 */
.theme-fx-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 5;
}

/* 白天：光晕气泡，由下往上漂浮 */
.fx-day-orb {
  position: absolute;
  bottom: -20vh;
  left: var(--left);
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 225, 100, 0.35) 0%, rgba(255, 225, 100, 0) 65%);
  opacity: 0;
}
html:not(.dark) .fx-day-orb {
  animation: orb-float 8s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes orb-float {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.4; }
  80% { opacity: 0.4; }
  100% { transform: translateY(-70vh) scale(1.6); opacity: 0; }
}

/* 夜晚：流星划过，斜向快速下落 */
.fx-meteor {
  display: none;
  position: absolute;
  width: 180px;
  height: 2px;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%);
  transform: rotate(45deg) translateX(-200%);
  opacity: 0;
}
.dark .fx-meteor {
  display: block;
  top: var(--top);
  left: var(--left);
  animation: meteor-fall 8s linear infinite;
  animation-delay: var(--delay);
}

@keyframes meteor-fall {
  0% { opacity: 0; transform: rotate(45deg) translateX(-20vw); }
  15% { opacity: 1; }
  35% { opacity: 0; transform: rotate(45deg) translateX(100vw); }
  100% { opacity: 0; }
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

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
  - title: 星空深处
    details: 在星空的深处，究竟藏着什么秘密？
    link: https://www.ccw.site/detail/6784a63fe77d7c09f357513f
    linkText: 了解更多

  - title: 迷宫
    details: 你是一个鼠标，某一天，你意外地穿越到了2000年，你在这个陌生的电脑中游荡，发现这台电脑有些不对劲，你深入探索，到了一个奇怪的区域，一个红色的鼠标从角落蹿了出来，他好像有敌意，你碰到了他，你被他格式化了......
    link: https://www.ccw.site/detail/63c3ef78defdd851bb3d29b2
    linkText: 了解更多
---

<script setup>
import { VPTeamMembers } from 'vitepress/theme'
import { homeMembers } from './scripts/menbers'
</script>

<style>
body .is-home {
  background-image: url('/images/background-light.webp');
  background-size: cover;
  background-attachment: fixed;
  background-position: center;
}
.dark body .is-home {
  background-image: url('/images/background-dark.webp');
}

.is-home .VPHomeHero .container {
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.7);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  padding: 2rem;
}
.dark .is-home .VPHomeHero .container {
  background: rgba(50, 50, 50, 0.7);
}
</style>

<br />

# 核心团队

<VPTeamMembers size="small" :members="homeMembers" />

[查看更多成员](/members)

---
layout: page
---

<script setup>
import {
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamMembers
} from 'vitepress/theme'
import { allMembers } from './scripts/menbers'
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>
      我们的团队
    </template>
    <template #lead>
      启旋游戏工作室由一群热爱游戏开发的学生组成，我们致力于创造有趣、创新的游戏体验。我们的团队成员来自不同的背景，拥有多样的技能和兴趣，但我们都怀揣着对游戏的热情和对创作的执着。
    </template>
  </VPTeamPageTitle>
  <VPTeamMembers :members="allMembers" />
</VPTeamPage>

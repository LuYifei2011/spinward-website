<template>
  <div class="image-src logo-container" v-html="logoSvg" />
</template>

<script setup lang="ts">
import logoSvg from '../../public/images/logo.svg?raw'
</script>

<style>
.logo-container {
  color: #012180;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark .logo-container {
  color: #A8B1FF;
}

.logo-container svg,
.logo-container {
  width: 100%;
  height: 100%;
}
</style>

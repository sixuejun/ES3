<template>
  <div class="page-header">
    <button class="bubble-btn bubble-btn-sm" @click="$emit('back')">
      <IconBack />
      返回
    </button>
    <h2>
      <slot></slot>
      {{ title }}
    </h2>
    <div class="spacer"></div>
  </div>
</template>

<script setup lang="ts">
import IconBack from '../icons/IconBack.vue';

defineProps<{
  title: string;
}>();

defineEmits<{
  back: [];
}>();
</script>

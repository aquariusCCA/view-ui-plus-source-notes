<template>
    <!-- <i class="my-icon my-icon-check-circle" style="font-size: 24px; color: #19be6b;"></i> -->
     <i :class="classes" :style="styles"></i>
</template>

<script setup>
import { computed, watchEffect } from 'vue'

const props = defineProps({
    type: {
        type: String,
        default: ''
    },
    size: {
        type: [Number, String],
        default: ''
    },
    color: {
        type: String,
        default: ''
    },
    custom: {
        type: String,
        default: ''
    }
})

watchEffect(() => {
    if (props.type && props.custom) {
        console.warn('[MyIcon] type 和 custom 不能同時使用，custom 會優先。')
    }
})

const classes = computed(() => {
    // 第三方自定義 icon
    if (props.custom) {
        return props.custom
    }

    // myui 內建 icon
    return [
        'my-icon',
        props.type ? `my-icon-${props.type}` : ''
    ].filter(Boolean)
})

const styles = computed(() => {
    const style = {}

    if (props.size) {
        style.fontSize = typeof props.size === 'number'
            ? `${props.size}px`
            : props.size
    }

    if (props.color) {
        style.color = props.color
    }

    return style
})
</script>
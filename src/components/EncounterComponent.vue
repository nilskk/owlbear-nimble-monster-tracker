<script setup>
import { computed } from 'vue'
import { parseText } from '../parseFunctions';

const props = defineProps({
    monster: Object
})

const hasMildEncounter = computed(() => {
    return props.monster?.data?.attributes?.mild_encounter !== undefined && props.monster.data.attributes.mild_encounter !== ''
})

const hasSpicyEncounter = computed(() => {
    return props.monster?.data?.attributes?.spicy_encounter !== undefined && props.monster.data.attributes.spicy_encounter !== ''
})

const hasAnyEncounter = computed(() => hasMildEncounter.value || hasSpicyEncounter.value)
</script>

<template>
    <div v-if="hasAnyEncounter" class="divider divider-accent font-bold mb-0">Encounter Tips</div>
    <div v-if="hasAnyEncounter" class="px-2 pt-2 space-y-4">
        <div v-if="hasMildEncounter" class="flex items-start gap-1">
            <span class="text-xl">🕊</span>
            <span v-html="parseText(props.monster.data.attributes.mild_encounter)" class="whitespace-pre-wrap"></span>
        </div>
        <div v-if="hasSpicyEncounter" class="flex items-start gap-1">
            <span class="text-xl">💀</span>
            <span v-html="parseText(props.monster.data.attributes.spicy_encounter)" class="whitespace-pre-wrap"></span>
        </div>
    </div>
</template>

<style scoped></style>
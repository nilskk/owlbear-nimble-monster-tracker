<script setup>
import { ref, toRefs, onMounted, onUpdated, nextTick, computed } from 'vue'
import { parseText } from '../parseFunctions';
import { useRollButtonListeners } from '../composables/useRollButtonListeners.js';


const props = defineProps({
    monster: Object
})

const emit = defineEmits(['rollDiceDescription'])

const attachListeners = async () => {
    await useRollButtonListeners(emit, 'rollDiceDescription');
};
onMounted(attachListeners);
onUpdated(attachListeners);

</script>

<template>
    <div v-if="props.monster.data.attributes.description && props.monster.data.attributes.description.length > 0" class="divider divider-accent font-bold mb-0">Description</div>
    <div v-if="props.monster.data.attributes.description && props.monster.data.attributes.description.length > 0" class="px-2 pt-2 space-y-2">
        <!-- Description -->
        <div v-if="props.monster.data.attributes.description" class="space-y-1">
            <p class="w-full break-words">
                <span v-html="parseText(props.monster.data.attributes.description)" class="ml-2"></span>
            </p>
        </div>
    </div>
</template>

<style scoped></style>
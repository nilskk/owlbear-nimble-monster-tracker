<script setup>
import { ref, toRefs, onMounted, onUpdated, nextTick, computed } from 'vue'
import { parseText } from '../parseFunctions';
import { useRollButtonListeners } from '../composables/useRollButtonListeners.js';


const props = defineProps({
    monster: Object
})

const emit = defineEmits(['rollDiceAction'])

const attachListeners = async () => {
    await useRollButtonListeners(emit, 'rollDiceAction');
};
onMounted(attachListeners);
onUpdated(attachListeners);

</script>

<template>
    <div v-if="props.monster.actions || props.monster.action" class="divider divider-accent font-bold mb-0">Actions</div>
    <div v-if="props.monster.actions || props.monster.action" class="px-2 pt-2 space-y-2">
        <!-- New JSON format actions -->
        <div v-if="props.monster.actions" v-for="actionGroup in props.monster.actions" :key="actionGroup.name" class="w-full break-words space-y-2">
            <div v-if="actionGroup.type === 'multi'" class="space-y-2">
                <p v-if="actionGroup.desc" class="font-semibold" v-html="parseText(actionGroup.desc)"></p>
                <div v-for="action in actionGroup.actions" :key="action.name" class="pl-4 space-y-1">
                    <p class="w-full break-words">
                        <span v-html="parseText(action.name)" class="font-bold"></span>
                        <span v-html="parseText(action.desc)" class="ml-2"></span>
                    </p>
                </div>
            </div>
            <div v-else-if="actionGroup.type === 'single'" class="space-y-1">
                <p class="w-full break-words">
                    <span v-html="parseText(actionGroup.name)" class="font-bold"></span>
                    <span v-html="parseText(actionGroup.desc)" class="ml-2"></span>
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
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
    <div v-if="(props.monster.actions && props.monster.actions.length > 0) || props.monster.action" class="divider divider-accent font-bold mb-0">Actions</div>
    <div v-if="(props.monster.actions && props.monster.actions.length > 0) || props.monster.action" class="px-2 pt-2 space-y-2">
        <!-- New JSON format actions -->
        <div v-if="props.monster.actions" v-for="actionGroup in props.monster.actions" :key="actionGroup.name" class="w-full break-words space-y-2">
            <div v-if="actionGroup.type === 'multi'" class="space-y-2">
                <p class="w-full break-words">
                    <span v-if="actionGroup.name" class="font-bold" v-html="parseText(actionGroup.name)"></span>
                    <span v-if="actionGroup.desc" class="ml-2" v-html="parseText(actionGroup.desc)"></span>
                </p>
                <div v-for="action in actionGroup.actions" :key="action.name" class="pl-4 space-y-1">
                    <div v-if="action.status" class="alert alert-info alert-soft">
                        <div class="w-full">
                            <p class="font-bold" v-html="parseText(action.name)"></p>
                            <p class="text-sm mt-1" v-html="parseText(action.desc)"></p>
                        </div>
                    </div>
                    <p v-else class="w-full break-words">
                        <span v-html="parseText(action.name)" class="font-bold"></span>
                        <span v-html="parseText(action.desc)" class="ml-2"></span>
                    </p>
                </div>
            </div>
            <div v-else-if="actionGroup.type === 'single'" class="space-y-1">
                <div v-if="actionGroup.status" class="alert alert-info alert-soft">
                    <div class="w-full">
                        <p class="font-bold" v-html="parseText(actionGroup.name)"></p>
                        <p class="text-sm mt-1" v-html="parseText(actionGroup.desc)"></p>
                    </div>
                </div>
                <p v-else class="w-full break-words">
                    <span v-html="parseText(actionGroup.name)" class="font-bold"></span>
                    <span v-html="parseText(actionGroup.desc)" class="ml-2"></span>
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
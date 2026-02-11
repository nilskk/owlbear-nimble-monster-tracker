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
    <div v-if="props.monster.data.attributes.actions && props.monster.data.attributes.actions.length > 0" class="divider divider-accent font-bold mb-0">Actions</div>
    <div v-if="props.monster.data.attributes.actions && props.monster.data.attributes.actions.length > 0" class="px-2 pt-2 space-y-2">
        <!-- Actions Instructions -->
        <p v-if="props.monster.data.attributes.actionsInstructions" class="text-sm italic mb-2" v-html="parseText(props.monster.data.attributes.actionsInstructions)"></p>
        
        <!-- Actions -->
        <div v-for="action in props.monster.data.attributes.actions" :key="action.name" class="w-full break-words">
            <p class="w-full break-words">
                <span v-if="action.name" class="font-bold" v-html="parseText(action.name)"></span>
                <span v-if="action.description" class="ml-2" v-html="parseText(action.description)"></span>
            </p>
        </div>
    </div>
</template>

<style scoped></style>
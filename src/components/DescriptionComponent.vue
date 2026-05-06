<script setup>
import { ref, onMounted, onUpdated, nextTick } from 'vue'
import { parseText } from '../parseFunctions';
import { useRollButtonListeners } from '../composables/useRollButtonListeners.js';

const props = defineProps({
    monster: Object
})

const emit = defineEmits(['rollDiceDescription', 'descriptionChanged'])

const isEditing = ref(false)
const editValue = ref('')
const textareaRef = ref(null)

const attachListeners = async () => {
    await useRollButtonListeners(emit, 'rollDiceDescription');
};
onMounted(attachListeners);
onUpdated(attachListeners);

const startEditing = () => {
    editValue.value = props.monster.data.attributes.description || ''
    isEditing.value = true
    nextTick(() => {
        textareaRef.value?.focus()
    })
}

const saveDescription = () => {
    const newValue = editValue.value.trim()
    props.monster.data.attributes.description = newValue
    emit('descriptionChanged', newValue)
    isEditing.value = false
}
</script>

<template>
    <div class="divider divider-accent font-bold mb-0">Description & Notes</div>
    <div class="px-2 pt-2 space-y-2">
        <div class="flex items-start gap-2">
            <div class="flex-1 min-w-0">
                <textarea 
                    v-if="isEditing"
                    ref="textareaRef"
                    v-model="editValue"
                    @blur="saveDescription"
                    class="textarea textarea-bordered w-full text-sm"
                    rows="3"
                ></textarea>
                <template v-else>
                    <p v-if="props.monster.data.attributes.description && props.monster.data.attributes.description.length > 0" 
                       class="w-full break-words cursor-text hover:bg-base-300 rounded px-1 -ml-1"
                       @click="startEditing">
                        <span v-html="parseText(props.monster.data.attributes.description)" class="ml-2 whitespace-pre-wrap"></span>
                    </p>
                    <p v-else 
                       class="w-full break-words text-base-content/50 italic cursor-text hover:bg-base-300 rounded px-1 -ml-1"
                       @click="startEditing">
                        <span class="ml-2">Click to add description.</span>
                    </p>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped></style>

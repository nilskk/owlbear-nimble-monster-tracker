<script setup>
import { ref, toRefs, onMounted, onUpdated, nextTick, computed } from 'vue'
import { parseText } from '../parseFunctions';
import { useRollButtonListeners } from '../composables/useRollButtonListeners';


const props = defineProps({
    monster: Object
})

const emit = defineEmits(['rollDiceLegendary'])

const attachListeners = async () => {
    await useRollButtonListeners(emit, 'rollDiceLegendary');
};
onMounted(attachListeners);
onUpdated(attachListeners);

</script>

<template>
    <div v-if="props.monster.data.attributes.legendary && (props.monster.data.attributes.bloodied || props.monster.data.attributes.lastStand)" class="divider divider-accent font-bold mb-0">Legendary</div>
    <div v-if="props.monster.data.attributes.legendary && (props.monster.data.attributes.bloodied || props.monster.data.attributes.lastStand)" class="px-2 pt-2 space-y-2">
        <!-- Bloodied -->
        <div v-if="props.monster.data.attributes.bloodied && props.monster.data.attributes.bloodied.description" class="space-y-1">
            <p class="w-full break-words">
                <span class="font-bold text-warning">Bloodied:</span>
                <span v-html="parseText(props.monster.data.attributes.bloodied.description)" class="ml-2"></span>
            </p>
        </div>

        <!-- Last Stand -->
        <div v-if="props.monster.data.attributes.lastStand && props.monster.data.attributes.lastStand.description" class="space-y-1">
            <p class="w-full break-words">
                <span class="font-bold text-error">Last Stand:</span>
                <span v-html="parseText(props.monster.data.attributes.lastStand.description)" class="ml-2"></span>
            </p>
        </div>
    </div>
</template>

<style scoped></style>

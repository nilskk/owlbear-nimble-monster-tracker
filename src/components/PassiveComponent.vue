<script setup>
import { ref, toRefs, onMounted, onUpdated, nextTick, computed } from 'vue'
import { parseText } from '../parseFunctions';
import { useRollButtonListeners } from '../composables/useRollButtonListeners';


const props = defineProps({
    monster: Object
})

const emit = defineEmits(['rollDicePassive'])

const attachListeners = async () => {
    await useRollButtonListeners(emit, 'rollDicePassive');
};
onMounted(attachListeners);
onUpdated(attachListeners);

</script>

<template>
    <div v-if="props.monster.passives" class="divider divider-accent font-bold mb-0">Passives</div>
    <div v-if="props.monster.passives" class="px-2 pt-2 space-y-2">
        <!-- Passives -->
        <div v-for="passiveGroup in props.monster.passives" :key="passiveGroup.name" class="w-full break-words space-y-2">
            <div v-if="passiveGroup.type === 'multi'" class="space-y-2">
                <p v-if="passiveGroup.name" class="font-bold" v-html="parseText(passiveGroup.name)"></p>
                <p v-if="passiveGroup.desc" class="font-semibold" v-html="parseText(passiveGroup.desc)"></p>
                <div v-for="passive in passiveGroup.actions" :key="passive.name" class="pl-4 space-y-1">
                    <p class="w-full break-words">
                        <span v-html="parseText(passive.name)" class="font-bold"></span>
                        <span v-html="parseText(passive.desc)" class="ml-2"></span>
                    </p>
                </div>
            </div>
            <div v-else-if="passiveGroup.type === 'single'" class="space-y-1">
                <p class="w-full break-words">
                    <span v-html="parseText(passiveGroup.name)" class="font-bold"></span>
                    <span v-html="parseText(passiveGroup.desc)" class="ml-2"></span>
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped></style>

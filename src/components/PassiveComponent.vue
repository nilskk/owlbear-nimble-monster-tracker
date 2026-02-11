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
    <div v-if="props.monster.data.attributes.abilities && props.monster.data.attributes.abilities.length > 0" class="divider divider-accent font-bold mb-0">Abilities</div>
    <div v-if="props.monster.data.attributes.abilities && props.monster.data.attributes.abilities.length > 0" class="px-2 pt-2 space-y-2">
        <!-- Abilities -->
        <div v-for="ability in props.monster.data.attributes.abilities" :key="ability.name" class="w-full break-words">
            <p class="w-full break-words">
                <span v-if="ability.name" class="font-bold" v-html="parseText(ability.name)"></span>
                <span v-if="ability.description" class="ml-2" v-html="parseText(ability.description)"></span>
            </p>
        </div>
    </div>
</template>

<style scoped></style>

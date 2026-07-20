<script setup>
import { ref, toRefs, onMounted, onUpdated, nextTick, computed } from 'vue'
import { parseText } from '../parseFunctions';
import { useRollButtonListeners } from '../composables/useRollButtonListeners';


const props = defineProps({
    monster: Object
})

const familyIncluded = computed(() => props.monster?.included?.find((item) => item?.type === 'families'))

const emit = defineEmits(['rollDiceFamilies'])

const attachListeners = async () => {
    await useRollButtonListeners(emit, 'rollDiceFamilies');
};
onMounted(attachListeners);
onUpdated(attachListeners);

</script>

<template>
    <div v-if="familyIncluded && familyIncluded.attributes.abilities && familyIncluded.attributes.abilities.length > 0" class="divider divider-accent font-bold mb-0">Family Abilities</div>
    <div v-if="familyIncluded && familyIncluded.attributes.abilities && familyIncluded.attributes.abilities.length > 0" class="px-2 pt-2 space-y-2">
        <!-- Abilities -->
        <div v-for="ability in familyIncluded.attributes.abilities" :key="ability.name" class="w-full break-words">
            <p class="w-full break-words">
                <span v-if="ability.name" class="font-bold" v-html="parseText(familyIncluded.attributes.name)"></span>
                <span v-if="ability.name" class="font-bold">: </span>
                <span v-if="ability.name" class="font-bold" v-html="parseText(ability.name)"></span>
                <span v-if="ability.description" class="ml-2" v-html="parseText(ability.description)"></span>
            </p>
        </div>
    </div>
</template>

<style scoped></style>

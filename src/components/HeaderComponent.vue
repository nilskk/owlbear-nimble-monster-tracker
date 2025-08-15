<script setup>
import { onMounted } from 'vue';
import { parseText, parseSaves } from '../parseFunctions';
import { useRollButtonListeners } from '../composables/useRollButtonListeners.js';
import { useGlobalContextMenu } from '../composables/useGlobalContextMenu.js';

const props = defineProps({
    monster: Object
})

const emit = defineEmits(['rollDiceHeader'])

const { show } = useGlobalContextMenu();

onMounted(async () => {
    await useRollButtonListeners(emit, 'rollDiceHeader');
});

const rollD20 = () => {
    emit('rollDiceHeader', '1d20', 'normal', 1, false); // Save rolls without crit
};

const rollD20RightClick = (event) => {
    event.preventDefault();
    show(event, '1d20', emit, 'rollDiceHeader', false); // Save rolls default to no crit
};

</script>

<template>
    <div class="bg-base-200 rounded-lg p-4 m-2 shadow-lg">
        <!-- Monster Name and Challenge Rating -->
        <div class="flex justify-between items-center mb-3">
            <h2 class="text-xl font-bold">{{ props.monster.name }}</h2>
            <span class="badge badge-primary badge-soft font-bold">{{ props.monster.CR }}</span>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-1">
            <!-- Armor -->
            <div class="flex items-center space-x-2">
                <span class="text-lg">🛡️</span>
                <span class="text-lg font-bold">{{ props.monster.armor || '-' }}</span>
            </div>
            
            <!-- Hit Points -->
            <div class="flex items-center space-x-2">
                <span class="text-lg">❤️</span>
                <span class="text-lg font-bold text-error">{{ props.monster.hp }}</span>
            </div>
            
            <!-- Speed -->
            <div class="flex items-center space-x-2">
                <span class="text-lg">🏃</span>
                <span class="text-lg font-bold">{{ props.monster.speed || '6' }}</span>
            </div>
            
            <!-- Saves -->
            <div class="flex items-center space-x-2">
                <button @click="rollD20" @contextmenu="rollD20RightClick" class="btn btn-ghost btn-sm p-1 text-lg hover:bg-base-300">🎲</button>
                <span class="text-lg font-bold" v-html="props.monster.saves ? parseSaves(props.monster.saves) : '-'"></span>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
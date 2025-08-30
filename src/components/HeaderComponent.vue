<script setup>
import { onMounted, ref, watch } from 'vue';
import { parseText, parseSaves } from '../parseFunctions';
import { useRollButtonListeners } from '../composables/useRollButtonListeners.js';
import { useGlobalContextMenu } from '../composables/useGlobalContextMenu.js';

const props = defineProps({
    monster: Object,
    playerSelection: Object
})

const emit = defineEmits(['rollDiceHeader', 'hpChanged'])

const { show } = useGlobalContextMenu();

// Smart HP input handling
const isEditing = ref(false);

// Watch for monster changes and initialize
onMounted(async () => {
    await useRollButtonListeners(emit, 'rollDiceHeader');
});

const handleHpFocus = (event) => {
    isEditing.value = true;
    // Set the input value to current HP and select all text
    event.target.value = props.monster.current_hp.toString();
    event.target.select();
};

const handleHpBlur = (event) => {
    isEditing.value = false;
    // Revert back to current HP value
    event.target.value = props.monster.current_hp.toString();
};

const handleHpKeydown = (event) => {
    if (event.key === 'Enter') {
        handleHpInput(event);
    }
};

const handleHpInput = (event) => {
    const input = event.target.value.trim();

    if (!input) {
        event.target.value = props.monster.current_hp.toString();
        return;
    }
    
    // Ensure current_hp is a number
    const currentHp = parseInt(props.monster.current_hp);
    
    // Check if input starts with + or -
    if (input.startsWith('+') || input.startsWith('-')) {
        const change = parseInt(input);
        if (!isNaN(change) && !isNaN(currentHp)) {
            const newValue = Math.max(0, Math.min(props.monster.hp, currentHp + change));
            props.monster.current_hp = newValue;
        }
    } else {
        // Direct replacement
        const newValue = parseInt(input);
        if (!isNaN(newValue)) {
            props.monster.current_hp = Math.max(0, Math.min(props.monster.hp, newValue));
        }
    }
    
    // Update the input field to show the new value
    event.target.value = props.monster.current_hp.toString();
    
    // Emit HP change event to parent
    emit('hpChanged', props.monster.current_hp);
    
    event.target.blur();
};

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
            <div class="flex items-center space-x-2 min-h-[2rem]">
                <span class="text-lg">❤️</span>
                <!-- Show input field only when token is selected AND the token itself has monster data with current_hp -->
                <template v-if="
                    props.playerSelection && 
                    props.playerSelection.metadata && 
                    props.playerSelection.metadata['com.nilskk.owlbear-nimble-token-tracker/monstersheet'] && 
                    props.playerSelection.metadata['com.nilskk.owlbear-nimble-token-tracker/monstersheet'].current_hp !== undefined
                ">
                    <input type="text" 
                           :value="props.monster.current_hp"
                           @focus="handleHpFocus"
                           @blur="handleHpBlur"
                           @keydown="handleHpKeydown"
                           class="input input-sm w-16 h-8 text-center text-lg font-bold" 
                           placeholder="HP">
                    <span class="text-lg font-bold text-base-content">/</span>
                    <span class="text-lg font-bold text-error">{{ props.monster.hp }}</span>
                </template>
                <!-- Show only max HP for all other cases -->
                <template v-else>
                    <span class="text-lg font-bold text-error">{{ props.monster.hp }}</span>
                </template>
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
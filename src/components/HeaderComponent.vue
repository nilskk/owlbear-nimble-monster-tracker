<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { parseText, parseSaves } from '../parseFunctions';
import { useRollButtonListeners } from '../composables/useRollButtonListeners.js';
import { useGlobalContextMenu } from '../composables/useGlobalContextMenu.js';

const props = defineProps({
    monster: Object,
    playerSelection: Object
})

const emit = defineEmits(['rollDiceHeader', 'hpChanged', 'tempHpChanged']);

const { show } = useGlobalContextMenu();

// Smart HP input handling
const isEditing = ref(false);
const isEditingTemp = ref(false);

// Check if Monster is in Last Stand State (0 or negative HP)
const isLastStand = computed(() => {
    return props.monster.current_hp <= 0;
});

// Check if Monster is Bloodied (current HP at or below half of max HP, but above 0)
const isBloodied = computed(() => {
    const bloodiedThreshold = Math.floor(props.monster.data.attributes.hp / 2);
    return props.monster.current_hp > 0 && props.monster.current_hp <= bloodiedThreshold;
});

const hasLastStand = computed(() => {
    return props.monster.data.attributes.lastStand !== undefined;
});

const hasBloodied = computed(() => {
    return props.monster.data.attributes.bloodied !== undefined;
});

// Format movement array
const formattedMovement = computed(() => {
    if (!props.monster.data.attributes.movement || props.monster.data.attributes.movement.length === 0) {
        return '6';
    }
    
    const otherModes = props.monster.data.attributes.movement
        .filter(m => m.speed)
        .map(m => m.mode ? `${m.mode} ${m.speed}` : `${m.speed}`)
        .join(', ');
    
    return `${otherModes}`
});

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
    const maxHp = parseInt(props.monster.data.attributes.hp);
    const currentTempHp = parseInt(props.monster.temp_hp) || 0;
    
    // Check if input starts with + or -
    if (input.startsWith('+') || input.startsWith('-')) {
        const change = parseInt(input);
        if (!isNaN(change) && !isNaN(currentHp)) {
            let newValue;
            if (change < 0) {
                // Damage: deduct from temp HP first, then from current HP
                let remainingDamage = Math.abs(change);
                
                // Deduct from temp HP first
                if (currentTempHp > 0) {
                    const tempHpDeduction = Math.min(currentTempHp, remainingDamage);
                    props.monster.temp_hp = currentTempHp - tempHpDeduction;
                    remainingDamage -= tempHpDeduction;
                }
                
                // Deduct remaining damage from current HP
                if (currentHp > 0) {
                    newValue = Math.max(0, currentHp - remainingDamage);
                } else {
                    // If HP is already 0 or negative, allow going more negative
                    newValue = currentHp - remainingDamage;
                }
            } else {
                // Healing or positive change: cap at max HP
                newValue = Math.min(maxHp, currentHp + change);
            }
            props.monster.current_hp = newValue;
        }
    } else {
        // Direct replacement - cap at max HP
        const newValue = parseInt(input);
        if (!isNaN(newValue)) {
            props.monster.current_hp = Math.min(maxHp, newValue);
        }
    }
    
    // Update the input field to show the new value
    event.target.value = props.monster.current_hp.toString();
    
    // Emit HP change event to parent
    emit('hpChanged', props.monster.current_hp, props.monster.temp_hp);
    
    event.target.blur();
};

// Temp HP handlers
const handleTempHpFocus = (event) => {
    isEditingTemp.value = true;
    event.target.value = (props.monster.temp_hp || 0).toString();
    event.target.select();
};

const handleTempHpBlur = (event) => {
    isEditingTemp.value = false;
    event.target.value = (props.monster.temp_hp || 0).toString();
};

const handleTempHpKeydown = (event) => {
    if (event.key === 'Enter') {
        handleTempHpInput(event);
    }
};

const handleTempHpInput = (event) => {
    const input = event.target.value.trim();

    if (!input) {
        event.target.value = (props.monster.temp_hp || 0).toString();
        return;
    }
    
    // Check if input starts with + or -
    if (input.startsWith('+') || input.startsWith('-')) {
        const change = parseInt(input);
        if (!isNaN(change)) {
            const currentTempHp = props.monster.temp_hp || 0;
            props.monster.temp_hp = Math.max(0, currentTempHp + change);
        }
    } else {
        const newValue = parseInt(input);
        if (!isNaN(newValue)) {
            props.monster.temp_hp = Math.max(0, newValue);
        }
    }
    
    event.target.value = (props.monster.temp_hp || 0).toString();
    
    // Emit HP change event to parent so it can persist the temp HP
    emit('hpChanged', props.monster.current_hp, props.monster.temp_hp);
    
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
            <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold">{{ props.monster.data.attributes.name }}</h2>
                <span v-if="isLastStand && hasLastStand" class="text-xl font-bold text-error">Last Stand</span>
                <span v-if="isBloodied && hasBloodied" class="text-xl font-bold text-warning">Bloodied</span>
            </div>
            <span class="badge badge-primary badge-soft font-bold">{{ props.monster.data.attributes.level || '-' }}</span>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-1">
            <!-- Armor -->
            <div class="flex items-center space-x-2">
                <span class="text-lg">🛡️</span>
                <span class="text-lg font-bold">{{ props.monster.data.attributes.armor || '-' }}</span>
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
                    <span class="text-lg font-bold text-error">{{ props.monster.data.attributes.hp }}</span>
                    <input type="text" 
                           :value="props.monster.temp_hp || 0"
                           @focus="handleTempHpFocus"
                           @blur="handleTempHpBlur"
                           @keydown="handleTempHpKeydown"
                           class="input input-sm w-16 h-8 text-center text-lg font-bold text-info ml-1" 
                           placeholder="Temp">
                </template>
                <!-- Show only max HP for all other cases -->
                <template v-else>
                    <span class="text-lg font-bold text-error">{{ props.monster.data.attributes.hp }}</span>
                </template>
            </div>
            
            <!-- Speed -->
            <div class="flex items-center space-x-2">
                <span class="text-lg">🏃</span>
                <span class="text-lg font-bold">{{ formattedMovement }}</span>
            </div>
            
            <!-- Saves -->
            <div class="flex items-center space-x-2">
                <button @click="rollD20" @contextmenu="rollD20RightClick" class="btn btn-ghost btn-sm p-1 text-lg hover:bg-base-300">🎲</button>
                <span class="text-lg font-bold" v-html="props.monster.data.attributes.saves ? parseSaves(props.monster.data.attributes.saves) : '-'"></span>
            </div>
        </div>
    </div>
</template>

<style scoped></style>

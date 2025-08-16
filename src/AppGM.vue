<script setup>
import HeaderComponent from './components/HeaderComponent.vue';
import ActionsComponent from './components/ActionsComponent.vue';
import PassiveComponent from './components/PassiveComponent.vue';
import LegendaryComponent from './components/LegendaryComponent.vue';
import GlobalRollContextMenu from './components/GlobalRollContextMenu.vue';
import SettingsModal from './components/SettingsModal.vue';
import GameTermTooltip from './components/GameTermTooltip.vue';
import NavbarComponent from './components/NavbarComponent.vue';
import { ref, computed, onMounted } from 'vue'
import { db } from './db'
import { rollDiceWithDiceRoller } from './diceFunctions';
import OBR from '@owlbear-rodeo/sdk';


const ID = 'com.nilskk.owlbear-nimble-token-tracker';

const myModal = ref(null);
const settingsModalRef = ref(null);
const playerSelection = ref(null)
const selectedMonster = ref(null);
const groupedBestiary = ref({});
const diceRollResult = ref(null);
const lastDiceRolls = ref([]); // Array to store last 3 rolls with monster info
const diceRollsVisible = ref(false); // Simple visibility state for dice rolls
const expandedRolls = ref(new Set()); // Track which rolls are expanded
let rollVisibilityTimer = null; // Timer for auto-hiding rolls


onMounted(async () => {
    await refreshBestiary();
});


const showDiceRollsFor5Seconds = () => {
    // Clear any existing timer
    if (rollVisibilityTimer) {
        clearTimeout(rollVisibilityTimer);
    }
    
    // Show dice rolls
    diceRollsVisible.value = true;
    
    // Hide after 5 seconds
    rollVisibilityTimer = setTimeout(() => {
        diceRollsVisible.value = false;
    }, 5000);
};


const addRollToHistory = (rollResult, monster) => {
    const rollWithMonster = {
        ...rollResult,
        monster: { name: monster.name, id: monster.name } // Store monster info
    };
    
    // Add to beginning of array and keep only last 3
    lastDiceRolls.value.unshift(rollWithMonster);
    if (lastDiceRolls.value.length > 3) {
        lastDiceRolls.value = lastDiceRolls.value.slice(0, 3);
    }
};

const toggleRollExpansion = (rollIndex) => {
    const rollId = `roll-${rollIndex}`;
    if (expandedRolls.value.has(rollId)) {
        expandedRolls.value.delete(rollId);
    } else {
        expandedRolls.value.add(rollId);
    }
    // Force reactivity
    expandedRolls.value = new Set(expandedRolls.value);
};

const isRollExpanded = (rollIndex) => {
    return expandedRolls.value.has(`roll-${rollIndex}`);
};

const toggleDiceRolls = () => {
    if (diceRollsVisible.value) {
        // Currently showing rolls, so hide them
        diceRollsVisible.value = false;
        // Clear any auto-hide timer
        if (rollVisibilityTimer) {
            clearTimeout(rollVisibilityTimer);
        }
    } else if (lastDiceRolls.value.length > 0) {
        // Show rolls manually (no timer for manual toggle)
        diceRollsVisible.value = true;
        // Clear any existing timer
        if (rollVisibilityTimer) {
            clearTimeout(rollVisibilityTimer);
        }
    }
};

const rollDice = (value, rollMode, count = 1, crit = true) => {
    // Clear any existing dice result when starting a new roll
    diceRollResult.value = null;
    
    diceRollResult.value = rollDiceWithDiceRoller(value, rollMode, count, crit);
    // Add roll to history with current monster info
    if (selectedMonster.value) {
        addRollToHistory(diceRollResult.value, selectedMonster.value);
    }
    // Show dice rolls for 5 seconds
    showDiceRollsFor5Seconds();
};


const selectMonster = (monster) => {
    selectedMonster.value = monster;
    // Auto-close dice rolls when switching monsters
    diceRollsVisible.value = false;
    if (rollVisibilityTimer) {
        clearTimeout(rollVisibilityTimer);
    }
    diceRollResult.value = null;
    // Keep roll history across monsters (now stores monster info with each roll)
    // Keep lastGameTerm across monsters (conditions are general game mechanics)
};


const refreshBestiary = async () => {
    const bestiary = await db.bestiary.toArray();
    groupedBestiary.value = bestiary.reduce((acc, monster) => {
        if (!acc[monster.source]) {
            acc[monster.source] = [];
        }
        acc[monster.source].push(monster);
        return acc;
    }, {});
    if (bestiary.length > 0 && !selectedMonster.value) {
        selectedMonster.value = bestiary[0];
    }
};


let lastCreature = null;


function handlePlayerChange(player) {
    if(!player.selection) {
        playerSelection.value = null;
        return;
    } 
    OBR.scene.items.getItems(Array.isArray(player.selection) && player.selection.length > 0 ? [player.selection[0]] : []).then((items) => {
        if (items.length > 0) {
            // console.log(items);
            showMonsterSheet(items[0]);
            if (items[0].layer == 'CHARACTER') {
                playerSelection.value = items[0]; 
            }
        }
    }); 
}


function showMonsterSheet(item) {
    if (!item || !item.metadata[`${ID}/monstersheet`]) return;
  
    const dndbeyond = item.metadata[`${ID}/monstersheet`];
    if (dndbeyond === lastCreature) return;
  
    lastCreature = dndbeyond;
    selectedMonster.value = dndbeyond;
    
}


OBR.player.onChange(handlePlayerChange);


const updateTokens = () => {
    myModal.value.showModal();
};

const openSettings = () => {
    settingsModalRef.value?.showModal();
};


const confirmTokenUpdate = () => {
    OBR.player.getSelection().then((itemIds) => {
        console.log(itemIds);
        if (itemIds.length > 0) {
            OBR.scene.items.getItems(itemIds).then((items) => {
                console.log(items);
                OBR.scene.items.updateItems(items, (items2) => {
                    for (let item of items2) {
                        item.metadata[`${ID}/monstersheet`] = JSON.parse(JSON.stringify(selectedMonster.value))
                    }
                });
            });
        }
    });
    myModal.value.close();
};


const formatRollNotation = (roll) => {
    let notation = roll.originalNotation;
    if (roll.rollMode !== 'normal') {
        notation += ` (${roll.rollMode === 'advantage' ? 'ADV' : 'DIS'} ${roll.count})`;
    }
    return notation;
};
</script>


<template>
    <dialog v-if="playerSelection" id="my_modal_2" class="modal" ref="myModal">
        <div class="modal-box">
            <div class="flex flex-col justify-center space-y-3">
                <h1 v-if="playerSelection.metadata[`${ID}/monstersheet`]" class="text-xl font-bold">Current: {{ playerSelection.metadata[`${ID}/monstersheet`].name }}</h1>
                <h1 class="text-xl font-bold">New: {{ selectedMonster.name }}</h1>
                <button @click="confirmTokenUpdate" class="btn btn-primary">Confirm</button>
            </div>
            
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>
    
    <div class="flex flex-col h-screen">
        <NavbarComponent 
            :selected-monster="selectedMonster" 
            :player-selection="playerSelection" 
            :grouped-bestiary="groupedBestiary" 
            :ID="ID"
            @select-monster="selectMonster"
            @update-tokens="updateTokens"
            @open-settings="openSettings" />

        <div v-if="selectedMonster" class="overflow-y-auto overflow-x-hidden flex-1">
            <HeaderComponent :monster="selectedMonster" @rollDiceHeader="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
            <PassiveComponent :monster="selectedMonster" @rollDicePassive="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
            <ActionsComponent :monster="selectedMonster" @rollDiceAction="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
            <LegendaryComponent :monster="selectedMonster" @rollDiceLegendary="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
        </div>
        
        <!-- Round D20 Toggle Button -->
        <div class="absolute bottom-8 right-8 z-20">
            <button @click="toggleDiceRolls" 
                    class="btn btn-circle btn-lg btn-primary shadow-lg hover:shadow-xl transition-all"
                    :class="{ 'btn-active': diceRollsVisible }">
                <!-- D20 Icosahedron SVG from dice CSS -->
                <svg width="28" height="31" viewBox="0 0 28 31" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
                    <path d="M14 0L0 7.5V22.7L14 30.2L27 23.2L28 22.6V7.5L14 0ZM12 8.3L6.1 17.1L2.4 9.1L12 8.3ZM8 18L14 8.9L20 18H8ZM21.8 17.1L16 8.3L25.5 9L21.8 17.1ZM15 2.8L22.4 6.8L15 6.2V2.8ZM13 2.8V6.2L5.6 6.8L13 2.8ZM2 12.8L4.7 18.8L2 20.4V12.8ZM3 22.1L5.7 20.5L10.1 26L3 22.1ZM8 20H19L14 27.5L8 20ZM17.9 25.9L22.3 20.4L25 22L17.9 25.9ZM23.5 18.9L23.3 18.8L26 12.8V20.4L23.5 18.9Z" />
                </svg>
            </button>
        </div>
        
        <!-- Dice Roll Result (Floating Window) -->
        <div class="absolute bottom-24 right-8 z-10" v-if="diceRollsVisible">
            <!-- Roll History Stack -->
            <div class="space-y-2 flex flex-col items-end">
                <!-- Previous Rolls - Compact Display (Oldest to Newest) -->
                <div v-for="(roll, index) in lastDiceRolls.slice(1).reverse()" 
                     :key="`compact-${index}`"
                     class="bg-base-300 shadow-lg rounded-lg cursor-pointer transition-all"
                     :class="{ 'max-w-80': isRollExpanded(lastDiceRolls.length - 1 - index), 'w-auto': !isRollExpanded(lastDiceRolls.length - 1 - index) }"
                     @click="toggleRollExpansion(lastDiceRolls.length - 1 - index)">
                    
                    <!-- Compact View -->
                    <div v-if="!isRollExpanded(lastDiceRolls.length - 1 - index)" class="px-4 py-2 flex items-center justify-between">
                        <div class="text-xl font-bold text-primary">{{ roll.total }}</div>
                    </div>
                    
                    <!-- Expanded View -->
                    <div v-else class="p-4">
                        <div class="text-xs opacity-70 mb-1">{{ roll.monster?.name || 'Unknown' }}</div>
                        <div class="flex items-center justify-start gap-3">
                            <span class="text-primary text-3xl font-bold">{{ roll.total }}</span>
                            <span class="opacity-50 border-2 px-1 rounded">{{ formatRollNotation(roll) }}</span>
                        </div>
                        <!-- Divider line between total and breakdown -->
                        <div class="divider my-2 h-px bg-base-content opacity-20"></div>
                        <div class="text-base">
                            <div class="flex flex-wrap gap-1 items-center">
                                <template v-for="(die, dieIndex) in roll.dice" :key="dieIndex">
                                    <span 
                                        :class="{
                                            'line-through opacity-50': die.isDropped,
                                            'text-red-400': die.isPrimary && die.isMinValue && !die.isDropped,
                                            'text-green-400': (die.isPrimary && die.isMaxValue && !die.isDropped) || (die.isExploding && die.isMaxValue),
                                        }"
                                        class="inline-block transition-all"
                                    >
                                        <span 
                                            :class="{
                                                'text-lg border-2 border-current px-1 rounded': die.isPrimary
                                            }"
                                        >{{ die.value }}</span><span v-if="die.isExploding && die.isMaxValue">💥</span>
                                    </span><span v-if="dieIndex < roll.dice.length - 1" class="text-base-content">,</span>
                                </template>
                                <span v-if="roll.modifier" class="ml-1 text-base-content">{{ roll.modifier }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Latest Roll - Full Display (At Bottom) -->
                <div v-if="lastDiceRolls.length > 0" class="bg-base-300 shadow-lg rounded-lg max-w-80">
                    <div class="p-4">
                        <div class="text-xs opacity-70 mb-1">{{ lastDiceRolls[0].monster?.name || 'Unknown' }}</div>
                        <div class="flex items-center justify-start gap-3">
                            <span class="text-primary text-3xl font-bold">{{ lastDiceRolls[0].total }}</span>
                            <span class="opacity-50 border-2 px-1 rounded">{{ formatRollNotation(lastDiceRolls[0]) }}</span>
                        </div>
                        <!-- Divider line between total and breakdown -->
                        <div class="divider my-2 h-px bg-base-content opacity-20"></div>
                        <div class="text-base">
                            <div class="flex flex-wrap gap-1 items-center">
                                <template v-for="(die, dieIndex) in lastDiceRolls[0].dice" :key="dieIndex">
                                    <span 
                                        :class="{
                                            'line-through opacity-50': die.isDropped,
                                            'text-red-400': die.isPrimary && die.isMinValue && !die.isDropped,
                                            'text-green-400': (die.isPrimary && die.isMaxValue && !die.isDropped) || (die.isExploding && die.isMaxValue),
                                        }"
                                        class="inline-block transition-all"
                                    >
                                        <span 
                                            :class="{
                                                'text-lg border-2 border-current px-1 rounded': die.isPrimary
                                            }"
                                        >{{ die.value }}</span><span v-if="die.isExploding && die.isMaxValue">💥</span>
                                    </span><span v-if="dieIndex < lastDiceRolls[0].dice.length - 1" class="text-base-content">,</span>
                                </template>
                                <span v-if="lastDiceRolls[0].modifier" class="ml-1 text-base-content">{{ lastDiceRolls[0].modifier }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Game Term Tooltip Component -->
    <GameTermTooltip />
    
    <!-- Settings Modal Component -->
    <SettingsModal 
        ref="settingsModalRef"
        :grouped-bestiary="groupedBestiary"
        @refresh-bestiary="refreshBestiary" />
    
    <!-- Global Context Menu -->
    <GlobalRollContextMenu />
</template>


<style scoped>
</style>


<script setup>
import HeaderComponent from './components/HeaderComponent.vue';
import ActionsComponent from './components/ActionsComponent.vue';
import PassiveComponent from './components/PassiveComponent.vue';
import LegendaryComponent from './components/LegendaryComponent.vue';
import GlobalRollContextMenu from './components/GlobalRollContextMenu.vue';
import UploadModal from './components/UploadModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import GameTermTooltip from './components/GameTermTooltip.vue';
import NavbarComponent from './components/NavbarComponent.vue';
import DiceRollDisplay from './components/DiceRollDisplay.vue';
import { ref, computed, onMounted, watch } from 'vue'
import { db } from './db'
import { rollDiceWithDiceRoller } from './diceFunctions';
import { loadSettings, saveSettings } from './settingsFunctions';
import OBR from '@owlbear-rodeo/sdk';


const ID = 'com.nilskk.owlbear-nimble-token-tracker';

const myModal = ref(null);
const uploadModalRef = ref(null);
const settingsModalRef = ref(null);
const playerSelection = ref(null)
const selectedMonster = ref(null);
const groupedBestiary = ref({});
const diceRollResult = ref(null);
const lastDiceRolls = ref([]); // Array to store last 3 rolls with monster info
const diceRollsVisible = ref(false); // Simple visibility state for dice rolls

// Initialize settings with default values first
const showRollsToPlayers = ref(false); // Will be updated after OBR is ready

onMounted(async () => {
    console.log('AppGM mounted, waiting for OBR...');
    OBR.onReady(async () => {
        console.log('OBR ready in GM view');
        console.log('OBR.room available:', typeof OBR.room !== 'undefined');
        
        // Load settings from OBR room
        try {
            console.log('Loading settings...');
            const settings = await loadSettings(OBR);
            console.log('Settings loaded:', settings);
            showRollsToPlayers.value = settings.showRollsToPlayers;
            console.log('showRollsToPlayers set to:', showRollsToPlayers.value);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    });  
    await refreshBestiary();
});

// Watch for settings changes and save to OBR room
watch(showRollsToPlayers, async (newValue) => {
    console.log('Settings changed, saving to OBR room:', newValue);
    // Save settings to OBR room
    try {
        await saveSettings(OBR, { showRollsToPlayers: newValue });
        console.log('Settings saved successfully');
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
    
    // Broadcast to players via OBR
    OBR.broadcast.sendMessage(`${ID}/settings`, {
        showRollsToPlayers: newValue
    });
    console.log('Settings broadcast sent:', { showRollsToPlayers: newValue });
});


const showDiceRolls = () => {
    // Show dice rolls
    diceRollsVisible.value = true;
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

const toggleDiceRolls = () => {
    if (diceRollsVisible.value) {
        // Currently showing rolls, so hide them
        diceRollsVisible.value = false;
    } else if (lastDiceRolls.value.length > 0) {
        // Show rolls manually (no timer for manual toggle)
        diceRollsVisible.value = true;
    }
};

const rollDice = (value, rollMode, count = 1, crit = true) => {
    // Clear any existing dice result when starting a new roll
    diceRollResult.value = null;
    
    diceRollResult.value = rollDiceWithDiceRoller(value, rollMode, count, crit);
    console.log('Dice roll result:', diceRollResult.value);
    console.log('DiceList:', diceRollResult.value.diceList);
    console.log('ExplodingDiceList:', diceRollResult.value.explodingDiceList);
    console.log('Dice (from function):', diceRollResult.value.dice);
    
    // Add roll to history with current monster info
    if (selectedMonster.value) {
        addRollToHistory(diceRollResult.value, selectedMonster.value);
        
        // Broadcast dice roll to players if setting is enabled
        if (showRollsToPlayers.value) {
            const serializableRoll = {
                total: diceRollResult.value.total,
                notation: diceRollResult.value.notation,
                originalNotation: diceRollResult.value.originalNotation || diceRollResult.value.notation,
                explodingNotation: diceRollResult.value.explodingNotation,
                rollMode: rollMode,
                count: count,
                dice: diceRollResult.value.dice ? diceRollResult.value.dice.map(die => ({
                    value: die.value,
                    isDropped: die.isDropped || false,
                    isPrimary: die.isPrimary || false,
                    isMaxValue: die.isMaxValue || false,
                    isMinValue: die.isMinValue || false,
                    isExploding: die.isExploding || false
                })) : [],
                modifier: diceRollResult.value.modifier || '',
                monster: { name: selectedMonster.value.name, id: selectedMonster.value.name }
            };
            OBR.broadcast.sendMessage(`${ID}/dice-roll`, {
                showToPlayers: true,
                roll: serializableRoll
            });
            console.log('Dice roll broadcast sent to players');
        }
    }
    // Show dice rolls
    showDiceRolls();
};


const selectMonster = (monster) => {
    selectedMonster.value = monster;
    // Auto-close dice rolls when switching monsters
    diceRollsVisible.value = false;
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

const openUpload = () => {
    uploadModalRef.value?.showModal();
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
                        const monsterData = JSON.parse(JSON.stringify(selectedMonster.value));
                        // Initialize current_hp to max hp if not already set
                        if (!monsterData.current_hp) {
                            monsterData.current_hp = monsterData.hp;
                        }
                        item.metadata[`${ID}/monstersheet`] = monsterData;
                    }
                }).then(() => {
                    // Refresh the playerSelection to include the new metadata
                    OBR.scene.items.getItems(itemIds).then((updatedItems) => {
                        if (updatedItems.length > 0 && updatedItems[0].layer == 'CHARACTER') {
                            playerSelection.value = updatedItems[0];
                            showMonsterSheet(updatedItems[0]);
                        }
                    });
                });
            });
        }
    });
    myModal.value.close();
};

// Save HP changes back to token metadata
const saveHpToToken = (newHp) => {
    if (!playerSelection.value || !playerSelection.value.metadata[`${ID}/monstersheet`]) {
        return;
    }
    
    // Update the token's metadata with the new HP
    OBR.scene.items.updateItems([playerSelection.value.id], (items) => {
        for (let item of items) {
            if (item.metadata[`${ID}/monstersheet`]) {
                item.metadata[`${ID}/monstersheet`].current_hp = newHp;
            }
        }
    });
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
            @open-upload="openUpload"
            @open-settings="openSettings" />

        <div v-if="selectedMonster" class="overflow-y-auto overflow-x-hidden flex-1">
            <HeaderComponent :monster="selectedMonster" 
                           :player-selection="playerSelection"
                           @rollDiceHeader="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)"
                           @hpChanged="saveHpToToken" />
            <PassiveComponent :monster="selectedMonster" @rollDicePassive="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
            <ActionsComponent :monster="selectedMonster" @rollDiceAction="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
            <LegendaryComponent :monster="selectedMonster" @rollDiceLegendary="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
        </div>
        
        <!-- Round D20 Toggle Button -->
        <div class="absolute bottom-8 right-8 z-20">
            <button @click="toggleDiceRolls" 
                    class="btn btn-circle btn-lg btn-primary shadow-lg hover:shadow-xl transition-all"
                    :class="{ 
                        'btn-active': diceRollsVisible,
                        'btn-disabled opacity-50': lastDiceRolls.length === 0
                    }"
                    :disabled="lastDiceRolls.length === 0">
                <!-- D20 Icosahedron SVG from dice CSS -->
                <svg width="28" height="31" viewBox="0 0 28 31" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
                    <path d="M14 0L0 7.5V22.7L14 30.2L27 23.2L28 22.6V7.5L14 0ZM12 8.3L6.1 17.1L2.4 9.1L12 8.3ZM8 18L14 8.9L20 18H8ZM21.8 17.1L16 8.3L25.5 9L21.8 17.1ZM15 2.8L22.4 6.8L15 6.2V2.8ZM13 2.8V6.2L5.6 6.8L13 2.8ZM2 12.8L4.7 18.8L2 20.4V12.8ZM3 22.1L5.7 20.5L10.1 26L3 22.1ZM8 20H19L14 27.5L8 20ZM17.9 25.9L22.3 20.4L25 22L17.9 25.9ZM23.5 18.9L23.3 18.8L26 12.8V20.4L23.5 18.9Z" />
                </svg>
            </button>
        </div>
        
        <!-- Dice Roll Display Component -->
        <DiceRollDisplay 
            :dice-rolls-visible="diceRollsVisible"
            :last-dice-rolls="lastDiceRolls"
            :show-rolls-to-players="showRollsToPlayers" />
    </div>
    
    <!-- Game Term Tooltip Component -->
    <GameTermTooltip />
    
    <!-- Upload Modal Component -->
    <UploadModal 
        ref="uploadModalRef"
        :grouped-bestiary="groupedBestiary"
        @refresh-bestiary="refreshBestiary" />

    <SettingsModal 
        ref="settingsModalRef" 
        :show-rolls-to-players="showRollsToPlayers"
        @update:showRollsToPlayers="showRollsToPlayers = $event" />

    <!-- Global Context Menu -->
    <GlobalRollContextMenu />
</template>


<style scoped>
</style>


<script setup>
import { ref, onMounted } from 'vue'
import DiceRollDisplay from './components/DiceRollDisplay.vue'
import { loadSettings } from './settingsFunctions'
import OBR from '@owlbear-rodeo/sdk'

const ID = 'com.nilskk.owlbear-nimble-token-tracker'

// State
const diceRollsVisible = ref(false)
const lastDiceRolls = ref([])
const showRollsToPlayers = ref(false)

onMounted(async () => {
    OBR.onReady(async () => {
        console.log('OBR ready in Player view');
        
        // Load initial settings from OBR room metadata
        try {
            const settings = await loadSettings(OBR);
            showRollsToPlayers.value = settings.showRollsToPlayers;
            console.log('Player initial settings loaded:', settings);
        } catch (error) {
            console.error('Failed to load initial settings in player view:', error);
        }
        
        // Listen for dice roll broadcasts from GM
        OBR.broadcast.onMessage(`${ID}/dice-roll`, (event) => {
            console.log('Received dice roll broadcast:', event.data);
            console.log('Roll data:', event.data.roll);
            console.log('Dice array:', event.data.roll.dice);
            console.log('Dice length:', event.data.roll.dice ? event.data.roll.dice.length : 'undefined');
            if (event.data.showToPlayers) {
                // Add the new roll to the beginning of the array
                lastDiceRolls.value.unshift(event.data.roll)
                
                // Keep only the last 3 rolls
                if (lastDiceRolls.value.length > 3) {
                    lastDiceRolls.value = lastDiceRolls.value.slice(0, 3)
                }
                
                // Show the dice rolls
                diceRollsVisible.value = true
                console.log('Dice rolls shown to player');
            }
        })
        
        // Listen for settings changes from GM
        OBR.broadcast.onMessage(`${ID}/settings`, (event) => {
            console.log('Received settings broadcast:', event.data);
            showRollsToPlayers.value = event.data.showRollsToPlayers
            
            // If setting is disabled, hide any visible rolls
            if (!showRollsToPlayers.value) {
                diceRollsVisible.value = false
                console.log('Dice rolls disabled by GM');
            } else {
                console.log('Dice rolls enabled by GM');
            }
        })
    });
})
</script>

<template>
    <div class="flex flex-col h-screen bg-base-100">
        <!-- Header -->
        <div class="navbar bg-base-300 flex-shrink-0">
            <div class="flex-1">
                <span class="text-xl font-bold">Player View</span>
            </div>
            <div class="flex-none">
                <div class="badge badge-primary" v-if="showRollsToPlayers">GM Rolls Visible</div>
                <div class="badge badge-ghost" v-else>GM Rolls Hidden</div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
                <h1 class="text-4xl font-bold text-primary mb-4">Player View</h1>
                <p class="text-lg opacity-70" v-if="!showRollsToPlayers">
                    Waiting for GM to enable dice roll visibility...
                </p>
                <p class="text-lg opacity-70" v-else>
                    GM dice rolls will appear here when rolled.
                </p>
            </div>
        </div>
        
        <!-- Dice Roll Display Component -->
        <DiceRollDisplay 
            :dice-rolls-visible="diceRollsVisible"
            :last-dice-rolls="lastDiceRolls"
            :show-rolls-to-players="showRollsToPlayers" />
    </div>
</template>

<style scoped></style>

<template>
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
                    <div class="text-xs opacity-70 mb-1">
                        <span v-if="roll.minionAttack && roll.minionCount > 1" class="text-orange-400 font-semibold">
                            Minion Attack: {{ roll.minionCount }}x 
                        </span>{{ roll.monster?.name || 'Unknown' }}
                    </div>
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
                    <div class="text-xs opacity-70 mb-1">
                        <span v-if="lastDiceRolls[0].minionAttack && lastDiceRolls[0].minionCount > 1" class="text-orange-400 font-semibold">
                            Minion Attack: {{ lastDiceRolls[0].minionCount }}x 
                        </span>{{ lastDiceRolls[0].monster?.name || 'Unknown' }}
                    </div>
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
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
    diceRollsVisible: {
        type: Boolean,
        required: true
    },
    lastDiceRolls: {
        type: Array,
        required: true
    },
    showRollsToPlayers: {
        type: Boolean,
        default: false
    }
})

// Local state for expanded rolls
const expandedRolls = ref(new Set())

// Functions
const toggleRollExpansion = (rollIndex) => {
    const rollId = `roll-${rollIndex}`
    if (expandedRolls.value.has(rollId)) {
        expandedRolls.value.delete(rollId)
    } else {
        expandedRolls.value.add(rollId)
    }
    // Force reactivity
    expandedRolls.value = new Set(expandedRolls.value)
}

const isRollExpanded = (rollIndex) => {
    return expandedRolls.value.has(`roll-${rollIndex}`)
}

const formatRollNotation = (roll) => {
    // Use the modified notation (includes minion multiplication) instead of original
    let notation = roll.notation || roll.originalNotation
    if (roll.rollMode !== 'normal') {
        notation += ` (${roll.rollMode === 'advantage' ? 'ADV' : 'DIS'} ${roll.count})`
    }
    return notation
}
</script>

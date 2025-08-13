<script setup>
import { parseText } from '../parseFunctions';

const props = defineProps({
    monster: Object
})

</script>

<template>
    <div class="bg-base-200 rounded-lg p-4 m-2 shadow-lg">
        <!-- Monster Name and Challenge Rating -->
        <div class="flex justify-between items-center mb-3">
            <h2 class="text-xl font-bold">{{ props.monster.name }}</h2>
            <span class="badge badge-primary font-bold">{{ props.monster.CR }}</span>
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
            <div class="flex items-center space-x-2" v-if="props.monster.saves">
                <span class="text-lg">🎲</span>
                <span class="text-lg font-bold">{{ props.monster.saves }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
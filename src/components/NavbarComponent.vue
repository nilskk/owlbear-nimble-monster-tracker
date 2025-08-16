<template>
    <div class="navbar bg-base-300 flex-shrink-0">
        <div class="flex-1 justify-start">
            <div v-if="selectedMonster" class="dropdown dropdown-begin z-50" v-on-click-outside="clearInput">
                <input tabindex="0" type="search" class="input m-1" :placeholder="selectedMonster.name"
                    v-model="searchInput" @focus="$event.target.select()">
                <ul tabindex="0"
                    class="dropdown-content menu menu-vertical p-2 shadow-2xl bg-base-100 rounded-box">
                    <div className="overflow-y-auto max-h-96 w-64">
                        <li v-for="(monsters, source) in filteredGroupedBestiary" :key="source">
                            <details open>
                                <summary>{{ source }}</summary>
                                <ul>
                                    <li v-for="monster in monsters" :key="monster.name">
                                        <a @click="selectMonster(monster)">{{ monster.name }}</a>
                                    </li>
                                </ul>
                            </details>
                        </li>
                    </div>
                </ul>
            </div>
        </div>
        <div class="flex-none">
            <button @click="updateTokens" v-if="playerSelection" class="btn btn-primary">
                <a v-if="playerSelection && playerSelection.metadata && playerSelection.metadata[`${ID}/monstersheet`]">Update Token</a>
                <a v-else>Link Token</a>
            </button>
            <button @click="openSettings" class="btn btn-square btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    class="inline-block w-5 h-5 stroke-current">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { vOnClickOutside } from '@vueuse/components'

// Props
const props = defineProps({
    selectedMonster: {
        type: Object,
        default: null
    },
    playerSelection: {
        type: Object,
        default: null
    },
    groupedBestiary: {
        type: Object,
        required: true
    },
    ID: {
        type: String,
        required: true
    }
})

// Emits
const emit = defineEmits(['selectMonster', 'updateTokens', 'openSettings'])

// Local state
const searchInput = ref('')

// Computed
const filteredGroupedBestiary = computed(() => {
    if (!searchInput.value) {
        return props.groupedBestiary
    }
    const filtered = {}
    for (const source in props.groupedBestiary) {
        filtered[source] = props.groupedBestiary[source].filter(monster =>
            monster.name.toLowerCase().includes(searchInput.value.toLowerCase())
        )
    }
    return filtered
})

// Methods
const clearInput = () => {
    searchInput.value = ''
}

const selectMonster = (monster) => {
    emit('selectMonster', monster)
    clearInput()
}

const updateTokens = () => {
    emit('updateTokens')
}

const openSettings = () => {
    emit('openSettings')
}
</script>

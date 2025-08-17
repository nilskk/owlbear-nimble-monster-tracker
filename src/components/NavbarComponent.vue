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
            <button @click="openUpload" class="btn btn-square btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
                    <path d="M450-313v-371L330-564l-43-43 193-193 193 193-43 43-120-120v371h-60ZM220-160q-24 0-42-18t-18-42v-143h60v143h520v-143h60v143q0 24-18 42t-42 18H220Z"/>
                </svg>
            </button>
            <button @click="openSettings" class="btn btn-square btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
                    <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
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
const emit = defineEmits(['selectMonster', 'updateTokens', 'openUpload', 'openSettings'])

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

const openUpload = () => {
    emit('openUpload')
}

const openSettings = () => {
    emit('openSettings')
}
</script>

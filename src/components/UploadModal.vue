<template>
    <!-- Upload Modal -->
    <dialog ref="uploadModal" class="modal">
        <div class="modal-box w-96 max-w-md">
            <h3 class="font-bold text-lg mb-4">Upload Monsters</h3>
            <div class="space-y-4">
                <div>
                    <p class="font-bold">Choose New or Existing Bestiary</p>
                    <input type="text" placeholder="Enter bestiary name (Uses 'Default' bestiary if empty)" v-model="bestiaryName" class="input input-bordered input-sm w-full mt-2" />
                    <select v-model="selectedSource" class="select select-bordered select-sm w-full mt-2">
                        <option value="">Select existing source</option>
                        <option v-for="source in availableSources" :key="source" :value="source">{{ source }}</option>
                    </select>
                </div>
                <div>
                    <p class="font-bold">Load from Nimble.Nexus URL</p>
                    <input type="url" placeholder="https://nimble.nexus/monsters/..." v-model="jsonUrl" class="input input-bordered input-sm w-full mt-2" />
                    <button @click="saveJson" :disabled="isLoading" class="btn btn-primary w-full mt-2">
                        <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
                        {{ isLoading ? 'Loading...' : 'Load Monsters' }}
                    </button>
                </div>
                <div class="pt-4 border-t">
                    <p class="font-bold mb-2">Delete Specific Source</p>
                    <select v-model="sourceToDelete" class="select select-bordered select-sm w-full mb-2">
                        <option value="">Select source to delete</option>
                        <option v-for="source in availableSources" :key="source" :value="source">{{ source }}</option>
                    </select>
                    <button @click="deleteSource" :disabled="!sourceToDelete" class="btn btn-warning w-full">Delete Selected Source</button>
                </div>
                <div class="pt-4 border-t">
                    <button @click="deleteData" class="btn btn-error w-full">Delete all data</button>
                </div>
            </div>
            <div class="modal-action">
                <form method="dialog">
                    <button class="btn">Close</button>
                </form>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { writeBulkToTable, clearTable, deleteBySource } from '../dbFunctions'
import {prepare_url, get_data} from '../api'

// Props
const props = defineProps({
    groupedBestiary: {
        type: Object,
        required: true
    }
})

// Emits
const emit = defineEmits(['refreshBestiary'])

// Refs
const uploadModal = ref(null)
const bestiaryName = ref('')
const selectedSource = ref('')
const sourceToDelete = ref('')
const jsonUrl = ref('')
const isLoading = ref(false)

// Computed
const availableSources = computed(() => {
    return Object.keys(props.groupedBestiary)
})

// Methods
const showModal = () => {
    uploadModal.value?.showModal()
}

const saveJson = async () => {
    if (isLoading.value) return // Prevent multiple simultaneous requests
    
    // Check if URL is provided
    if (!jsonUrl.value.trim()) {
        alert('Please provide a URL.')
        return
    }
    
    const allMonsters = []
    isLoading.value = true
    
    try {
        let url = prepare_url(jsonUrl) 
        let data = await get_data(url)
        console.log('Fetched data:', data)
        
        let monsters = []
        let collectionName = null
        
        // Check if this is a collection response
        if (data.data && data.data.type === 'collections') {
            // Get the collection name as the source
            collectionName = data.data.attributes?.name || 'Unknown Collection'

            for (const element of data.data.relationships.monsters.data) {
                let id = element.id
                url = "https://nimble.nexus/api/monsters/" + id + "?include=families"
                let data = await get_data(url)
                monsters.push({
                    name: data.data.attributes?.name || 'Unknown Monster',
                    ...data
                })
            }
        } else if (data.data && data.data.type === 'monsters') {
            // Handle single monster with API format
            monsters = [{
                name: data.data.attributes?.name || 'Unknown Monster',
                ...data
            }]
        } else {
            throw new Error('Unexpected JSON structure')
        }
        
        for (const monster of monsters) {
            // Add the source: bestiaryName > selectedSource > collectionName > 'Default'
            const sourceToUse = bestiaryName.value || selectedSource.value || collectionName || 'Default'
            monster.source = sourceToUse
            
            allMonsters.push(monster)
        }
        
        if (allMonsters.length > 0) {
            console.log('Writing monsters to database:', allMonsters.length, 'monsters')
            await writeBulkToTable(allMonsters)
            // Clear the URL input after successful processing
            jsonUrl.value = ''
            // Refresh the bestiary data
            emit('refreshBestiary')
            console.log('Successfully loaded monsters from URL')
        } else {
            console.warn('No monsters found in the data')
            alert('No valid monster data found at the provided URL.')
        }
    } catch (error) {
        console.log(error)
    } finally {
        isLoading.value = false
    }
}

const deleteData = async () => {
    await clearTable()
    emit('refreshBestiary')
}

const deleteSource = async () => {
    if (!sourceToDelete.value) return
    
    try {
        const deletedCount = await deleteBySource(sourceToDelete.value)
        console.log(`Deleted ${deletedCount} monsters from source: ${sourceToDelete.value}`)
        
        // Clear the selection and refresh the bestiary
        sourceToDelete.value = ''
        emit('refreshBestiary')
        
        alert(`Successfully deleted ${deletedCount} monsters from source: ${sourceToDelete.value}`)
    } catch (error) {
        console.error('Error deleting source:', error)
        alert(`Error deleting source: ${error.message}`)
    }
}

// Expose methods to parent
defineExpose({
    showModal
})
</script>

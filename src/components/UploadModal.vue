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
                    <p class="font-bold mb-2">Import / Export IndexedDB</p>
                    <div class="space-y-2">
                        <button type="button" @click="exportBestiary" :disabled="isExporting || isImporting" class="btn btn-secondary w-full">
                            <span v-if="isExporting" class="loading loading-spinner loading-sm"></span>
                            {{ isExporting ? 'Exporting...' : 'Export Bestiary Backup' }}
                        </button>
                        <button type="button" @click="openImportPicker" :disabled="isImporting || isExporting" class="btn btn-outline w-full">
                            <span v-if="isImporting" class="loading loading-spinner loading-sm"></span>
                            {{ isImporting ? 'Importing...' : 'Import Bestiary Backup' }}
                        </button>
                        <input ref="importFileInput" type="file" accept="application/json,.json" class="hidden" @change="handleImportFile" />
                    </div>
                    <p class="text-xs opacity-70 mt-2">Export downloads a JSON backup. Import replaces the current bestiary with the backup contents.</p>
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
import { writeBulkToTable, clearTable, deleteBySource, exportBestiaryData, replaceTable } from '../dbFunctions'
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
const isExporting = ref(false)
const isImporting = ref(false)
const importFileInput = ref(null)

// Computed
const availableSources = computed(() => {
    return Object.keys(props.groupedBestiary)
})

// Methods
const showModal = () => {
    uploadModal.value?.showModal()
}

const openImportPicker = () => {
    importFileInput.value?.click()
}

const exportBestiary = async () => {
    if (isExporting.value || isImporting.value) return

    isExporting.value = true

    try {
        const backup = await exportBestiaryData()
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
        const downloadUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const dateStamp = new Date().toISOString().slice(0, 10)

        link.href = downloadUrl
        link.download = `owlbear-nimble-monster-tracker-bestiary-${dateStamp}.json`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(downloadUrl)
    } catch (error) {
        console.error('Error exporting bestiary:', error)
        alert(`Error exporting bestiary: ${error.message}`)
    } finally {
        isExporting.value = false
    }
}

const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || isImporting.value || isExporting.value) return

    if (!window.confirm('Importing will replace all existing bestiary data. Continue?')) {
        return
    }

    isImporting.value = true

    try {
        const fileContents = await file.text()
        const parsedData = JSON.parse(fileContents)
        const records = Array.isArray(parsedData) ? parsedData : parsedData?.bestiary

        if (!Array.isArray(records)) {
            throw new Error('The selected file does not contain a valid bestiary backup.')
        }

        const importedCount = await replaceTable(records)
        emit('refreshBestiary')
        alert(`Successfully imported ${importedCount} monsters.`)
    } catch (error) {
        console.error('Error importing bestiary:', error)
        alert(`Error importing bestiary: ${error.message}`)
    } finally {
        isImporting.value = false
    }
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
    if (!window.confirm('This will permanently delete all bestiary data. Continue?')) {
        return
    }

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

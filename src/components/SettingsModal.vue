<template>
    <!-- Settings Modal -->
    <dialog ref="settingsModal" class="modal">
        <div class="modal-box w-96 max-w-md">
            <h3 class="font-bold text-lg mb-4">Settings</h3>
            <div class="space-y-4">
                <div>
                    <p class="font-bold">Choose New or Existing Bestiary</p>
                    <input type="text" placeholder="Enter bestiary name" v-model="bestiaryName" class="input input-bordered input-sm w-full mt-2" />
                    <select v-model="selectedSource" class="select select-bordered select-sm w-full mt-2">
                        <option value="">Select existing source</option>
                        <option v-for="source in availableSources" :key="source" :value="source">{{ source }}</option>
                    </select>
                </div>
                <div>
                    <p class="font-bold">Load from Nimble.Monster URL</p>
                    <input type="url" placeholder="https://nimble.monster/m/..." v-model="jsonUrl" class="input input-bordered input-sm w-full mt-2" />
                </div>
                <div>
                    <p class="font-bold">Or Upload Nimbrew JSON Monster file</p>
                    <input type="file" multiple ref="fileInput" class="file-input file-input-bordered file-input-sm w-full mt-2" />
                    <button @click="saveJson" :disabled="isLoading" class="btn btn-primary w-full mt-2">
                        <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
                        {{ isLoading ? 'Loading...' : 'Load Monsters' }}
                    </button>
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
import { writeBulkToTable, clearTable } from '../dbFunctions'
import { db } from '../db'

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
const settingsModal = ref(null)
const fileInput = ref(null)
const bestiaryName = ref('')
const selectedSource = ref('')
const jsonUrl = ref('')
const isLoading = ref(false)

// Computed
const availableSources = computed(() => {
    return Object.keys(props.groupedBestiary)
})

// Methods
const showModal = () => {
    settingsModal.value?.showModal()
}

const saveJson = async () => {
    if (isLoading.value) return // Prevent multiple simultaneous requests
    
    // Check if neither URL nor files are provided at the very beginning
    const files = fileInput.value?.files
    if (!jsonUrl.value.trim() && (!files || files.length === 0)) {
        alert('Please provide either a URL or select JSON files to upload.')
        return
    }
    
    const allMonsters = []
    isLoading.value = true
    
    try {
        // Handle URL input if provided
        if (jsonUrl.value.trim()) {
            try {
                let url = jsonUrl.value.trim()
                
                // Add /nimbrew.json if the URL doesn't already have it
                if (!url.includes('/nimbrew.json') && !url.endsWith('.json')) {
                    // Remove trailing slash if present, then add /nimbrew.json
                    url = url.replace(/\/$/, '') + '/nimbrew.json'
                }
                
                console.log('Fetching from URL:', url)
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    mode: 'cors', // Handle CORS
                })
                
                console.log('Response status:', response.status)
                console.log('Response headers:', Object.fromEntries(response.headers.entries()))
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
                }
                
                const contentType = response.headers.get('content-type')
                if (!contentType || !contentType.includes('application/json')) {
                    console.warn('Response is not JSON, attempting to parse anyway. Content-Type:', contentType)
                }
                
                const data = await response.json()
                console.log('Fetched data:', data)
                
                // Handle both single monster objects and arrays of monsters
                const monsters = Array.isArray(data) ? data : [data]
                
                for (const monster of monsters) {
                    // Ensure the monster has a name property
                    if (!monster.name) {
                        console.warn('Monster missing name property, setting default')
                        monster.name = 'Unknown Monster'
                    }
                    
                    // Add the bestiary name as source if provided, otherwise use selected source, or default
                    const sourceToUse = bestiaryName.value || selectedSource.value || 'Default'
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
                console.error('Error fetching JSON from URL:', error)
                
                // Provide more specific error messages
                let errorMessage = 'Error fetching JSON from URL: '
                
                if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                    errorMessage += 'Unable to connect to the URL. This might be due to:\n' +
                                   '• CORS policy restrictions\n' +
                                   '• Invalid URL\n' +
                                   '• Network connectivity issues\n' +
                                   '• The server is not responding'
                } else if (error.name === 'SyntaxError') {
                    errorMessage += 'The response is not valid JSON format.'
                } else {
                    errorMessage += error.message
                }
                
                alert(errorMessage)
                return
            }
        }
        
        // Handle file uploads if files are selected
        const files = fileInput.value?.files
        if (files && files.length > 0) {
            let filesProcessed = 0
            const fileMonsters = []
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const reader = new FileReader()
                reader.onload = async (e) => {
                    try {
                        const monster = JSON.parse(e.target.result)
                        
                        // Ensure the monster has a name property
                        if (!monster.name) {
                            console.warn(`Monster in file ${file.name} missing name property, setting default`)
                            monster.name = `Monster from ${file.name}`
                        }
                        
                        // Add the bestiary name as source if provided, otherwise use selected source, or default
                        const sourceToUse = bestiaryName.value || selectedSource.value || file.name
                        monster.source = sourceToUse
                        
                        fileMonsters.push(monster)
                        filesProcessed++
                        
                        // Once all files are processed, write the bulk data
                        if (filesProcessed === files.length) {
                            await writeBulkToTable(fileMonsters)
                            // Clear the file input
                            if (fileInput.value) {
                                fileInput.value.value = ''
                            }
                            // Refresh the bestiary data
                            emit('refreshBestiary')
                            isLoading.value = false
                        }
                    } catch (error) {
                        console.error('Error parsing JSON file:', error)
                        alert(`Error parsing JSON file ${file.name}: ${error.message}`)
                        isLoading.value = false
                    }
                }
                reader.readAsText(file)
            }
            return // Exit here for file processing
        }
    } finally {
        // Only set loading to false if we're not processing files
        const files = fileInput.value?.files
        if (!files || files.length === 0) {
            isLoading.value = false
        }
    }
}

const deleteData = async () => {
    await clearTable()
    emit('refreshBestiary')
}

// Expose methods to parent
defineExpose({
    showModal
})
</script>

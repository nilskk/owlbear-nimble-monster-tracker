<script setup>
import HeaderComponent from './components/HeaderComponent.vue';
import ActionsComponent from './components/ActionsComponent.vue';
import PassiveComponent from './components/PassiveComponent.vue';
import LegendaryComponent from './components/LegendaryComponent.vue';
import GlobalRollContextMenu from './components/GlobalRollContextMenu.vue';
import { ref, computed, onMounted } from 'vue'
import { vOnClickOutside } from '@vueuse/components'
import { db } from './db'
import { writeBulkToTable, clearTable } from './dbFunctions'
import { rollDiceWithDiceRoller } from './diceFunctions';
import OBR from '@owlbear-rodeo/sdk';


const ID = 'com.nilskk.owlbear-nimble-token-tracker';

const searchInput = ref('');
const fileInput = ref(null);
const myModal = ref(null);
const playerSelection = ref(null)
const selectedMonster = ref(null);
const groupedBestiary = ref({});
const diceRollResult = ref(null);
const bestiaryName = ref('');
const selectedSource = ref('');
const jsonUrl = ref('');
const isLoading = ref(false);
const gameTermSummary = ref(null);
let gameTermTimeoutId = null;


onMounted(async () => {
    await refreshBestiary();
    
    // Set up game term click listeners
    setupGameTermListeners();
});


const setupGameTermListeners = () => {
    // Use event delegation to handle clicks on dynamically added game terms
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('game-term')) {
            const term = event.target.getAttribute('data-term');
            const description = event.target.getAttribute('data-description');
            showGameTermSummary(term, description);
        }
    });
};


const showGameTermSummary = (term, description) => {
    gameTermSummary.value = { term, description };
    
    // Auto-hide after 8 seconds
    if (gameTermTimeoutId) {
        clearTimeout(gameTermTimeoutId);
    }
    gameTermTimeoutId = setTimeout(() => {
        gameTermSummary.value = null;
        gameTermTimeoutId = null;
    }, 8000);
};


const hideGameTermSummary = () => {
    gameTermSummary.value = null;
    if (gameTermTimeoutId) {
        clearTimeout(gameTermTimeoutId);
        gameTermTimeoutId = null;
    }
};


const closeDiceResult = () => {
    diceRollResult.value = null;
};

const rollDice = (value, rollMode, count = 1, crit = true) => {
    // Close any existing dice result when starting a new roll
    diceRollResult.value = null;
    
    diceRollResult.value = rollDiceWithDiceRoller(value, rollMode, count, crit);
};


const selectMonster = (monster) => {
    selectedMonster.value = monster;
};


const filteredGroupedBestiary = computed(() => {
    if (!searchInput.value) {
        return groupedBestiary.value;
    }
    const filtered = {};
    for (const source in groupedBestiary.value) {
        filtered[source] = groupedBestiary.value[source].filter(monster =>
            monster.name.toLowerCase().includes(searchInput.value.toLowerCase())
        );
    }
    return filtered;
});


const availableSources = computed(() => {
    return Object.keys(groupedBestiary.value);
});


const clearInput = () => {
    searchInput.value = '';
};


const saveJson = async () => {
  if (isLoading.value) return; // Prevent multiple simultaneous requests
  
  // Check if neither URL nor files are provided at the very beginning
  const files = fileInput.value?.files;
  if (!jsonUrl.value.trim() && (!files || files.length === 0)) {
    alert('Please provide either a URL or select JSON files to upload.');
    return;
  }
  
  const allMonsters = [];
  isLoading.value = true;
  
  try {
    // Handle URL input if provided
    if (jsonUrl.value.trim()) {
      try {
        let url = jsonUrl.value.trim();
        
        // Add /nimbrew.json if the URL doesn't already have it
        if (!url.includes('/nimbrew.json') && !url.endsWith('.json')) {
          // Remove trailing slash if present, then add /nimbrew.json
          url = url.replace(/\/$/, '') + '/nimbrew.json';
        }
        
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors', // Handle CORS
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Response is not JSON, attempting to parse anyway. Content-Type:', contentType);
        }
        
        const data = await response.json();
        console.log('Fetched data:', data);
        
        // Handle both single monster objects and arrays of monsters
        const monsters = Array.isArray(data) ? data : [data];
        
        for (const monster of monsters) {
          // Ensure the monster has a name property
          if (!monster.name) {
            console.warn('Monster missing name property, setting default');
            monster.name = 'Unknown Monster';
          }
          
          // Add the bestiary name as source if provided, otherwise use selected source, or default
          const sourceToUse = bestiaryName.value || selectedSource.value || 'Default';
          monster.source = sourceToUse;
          
          allMonsters.push(monster);
        }
        
        if (allMonsters.length > 0) {
          console.log('Writing monsters to database:', allMonsters.length, 'monsters');
          await writeBulkToTable(allMonsters);
          // Clear the URL input after successful processing
          jsonUrl.value = '';
          // Refresh the bestiary data
          await refreshBestiary();
          console.log('Successfully loaded monsters from URL');
        } else {
          console.warn('No monsters found in the data');
          alert('No valid monster data found at the provided URL.');
        }
      } catch (error) {
        console.error('Error fetching JSON from URL:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Error fetching JSON from URL: ';
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          errorMessage += 'Unable to connect to the URL. This might be due to:\n' +
                         '• CORS policy restrictions\n' +
                         '• Invalid URL\n' +
                         '• Network connectivity issues\n' +
                         '• The server is not responding';
        } else if (error.name === 'SyntaxError') {
          errorMessage += 'The response is not valid JSON format.';
        } else {
          errorMessage += error.message;
        }
        
        alert(errorMessage);
        return;
      }
    }
    
    // Handle file uploads if files are selected
    const files = fileInput.value?.files;
    if (files && files.length > 0) {
      let filesProcessed = 0;
      const fileMonsters = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const monster = JSON.parse(e.target.result);
            
            // Ensure the monster has a name property
            if (!monster.name) {
              console.warn(`Monster in file ${file.name} missing name property, setting default`);
              monster.name = `Monster from ${file.name}`;
            }
            
            // Add the bestiary name as source if provided, otherwise use selected source, or default
            const sourceToUse = bestiaryName.value || selectedSource.value || file.name;
            monster.source = sourceToUse;
            
            fileMonsters.push(monster);
            filesProcessed++;
            
            // Once all files are processed, write the bulk data
            if (filesProcessed === files.length) {
              await writeBulkToTable(fileMonsters);
              // Clear the file input
              if (fileInput.value) {
                fileInput.value.value = '';
              }
              // Refresh the bestiary data
              await refreshBestiary();
              isLoading.value = false;
            }
          } catch (error) {
            console.error('Error parsing JSON file:', error);
            alert(`Error parsing JSON file ${file.name}: ${error.message}`);
            isLoading.value = false;
          }
        };
        reader.readAsText(file);
      }
      return; // Exit here for file processing
    }
  } finally {
    // Only set loading to false if we're not processing files
    const files = fileInput.value?.files;
    if (!files || files.length === 0) {
      isLoading.value = false;
    }
  }
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


const deleteData = async () => {
    await clearTable();
    await refreshBestiary();
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


const compositeString = computed(() => {
    if (!selectedMonster.value || !diceRollResult.value) return '';
    let rollText = `${selectedMonster.value.name} rolls ${diceRollResult.value.originalNotation}`;
    if (diceRollResult.value.rollMode !== 'normal') {
        rollText += ` (${diceRollResult.value.rollMode === 'advantage' ? 'ADV' : 'DIS'} ${diceRollResult.value.count})`;
    }
    return rollText;
});
</script>


<template>
    <div class="stats bg-neutral z-50 fixed bottom-1 right-1" v-if="diceRollResult !== null">
        <div class="stat relative">
            <button @click="closeDiceResult" 
                    class="btn btn-ghost btn-xs absolute top-1 right-1 w-6 h-6 min-h-6 p-0">
                ✕
            </button>
            <div class="stat-title">{{ compositeString }}</div>
            <div class="stat-value text-primary text-4xl">{{ diceRollResult.total }}</div>
            <!-- Divider line between total and breakdown -->
            <div class="divider my-2 h-px bg-base-content opacity-20"></div>
            <div class="stat-desc text-base">
                <div class="flex flex-wrap gap-1 items-center">
                    <template v-for="(die, index) in diceRollResult.dice" :key="index">
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
                        </span><span v-if="index < diceRollResult.dice.length - 1" class="text-base-content">,</span>
                    </template>
                    <span v-if="diceRollResult.modifier" class="ml-1 text-base-content">{{ diceRollResult.modifier }}</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Game Term Summary -->
    <div class="bg-accent text-accent-content z-40 fixed bottom-1 left-1 right-1 p-4 rounded-lg shadow-lg" v-if="gameTermSummary !== null">
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <h3 class="font-bold text-lg">{{ gameTermSummary.term }}</h3>
                <p class="text-sm mt-1">{{ gameTermSummary.description }}</p>
            </div>
            <button @click="hideGameTermSummary" class="btn btn-sm btn-ghost btn-square ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    </div>
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
    <div class="drawer drawer-end overflow-x-hidden">
        <input id="my-drawer-1" type="checkbox" class="drawer-toggle" /> 
        <div class="drawer-content flex flex-col overflow-x-hidden h-screen">
            <div class="navbar bg-base-300 flex-shrink-0">
                <div  class="flex-1 justify-start">
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
                        <a v-if="playerSelection.metadata[`${ID}/monstersheet`]">Update Token</a>
                        <a v-else>Link Token</a>
                    </button>
                    <label for="my-drawer-1" class="drawer-button btn btn-square btn-ghost">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            class="inline-block w-5 h-5 stroke-current">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16">
                            </path>
                        </svg>
                    </label>
                </div>
            </div>
            <div v-if="selectedMonster" class="overflow-y-auto overflow-x-hidden flex-1" :class="{ 'pb-32': diceRollResult !== null }">
                <HeaderComponent :monster="selectedMonster" @rollDiceHeader="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
                <PassiveComponent :monster="selectedMonster" @rollDicePassive="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
                <ActionsComponent :monster="selectedMonster" @rollDiceAction="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
                <LegendaryComponent :monster="selectedMonster" @rollDiceLegendary="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
            </div>
        </div>
        <div class="drawer-side">
            <label for="my-drawer-1" aria-label="close sidebar" class="drawer-overlay"></label>
            <div class="menu p-4 w-80 min-h-full bg-base-200 text-base-content flex flex-col">
                <!-- Sidebar content here -->
                <div class="flex-grow space-y-2">
                    <p class="font-bold">Choose New or Existing Bestiary</p>
                    <input type="text" placeholder="Enter bestiary name" v-model="bestiaryName" class="input input-bordered input-sm w-full max-w-xs" />
                    <select v-model="selectedSource" class="select select-bordered select-sm w-full max-w-xs">
                        <option value="">Select existing source</option>
                        <option v-for="source in availableSources" :key="source" :value="source">{{ source }}</option>
                    </select>
                    <p class="font-bold">Load from Nimble.Monster URL</p>
                    <input type="url" placeholder="https://nimble.monster/m/..." v-model="jsonUrl" class="input input-bordered input-sm w-full max-w-xs" />
                    <p class="font-bold">Or Upload Nimbrew JSON Monster file</p>
                    <input type="file" multiple ref="fileInput" class="file-input file-input-bordered file-input-sm w-full max-w-xs" />
                    <button @click="saveJson" :disabled="isLoading" class="btn btn-primary w-full">
                        <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
                        {{ isLoading ? 'Loading...' : 'Load Monsters' }}
                    </button>
                </div>
                <!-- Delete button at the bottom -->
                <div class="mt-4">
                    <button @click="deleteData" class="btn btn-error w-full">Delete all data</button>
                </div>
            </div> 
        </div>
    </div>
    
    <!-- Global Context Menu -->
    <GlobalRollContextMenu />
</template>


<style scoped>
</style>

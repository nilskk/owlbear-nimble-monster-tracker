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
const settingsModal = ref(null);
const playerSelection = ref(null)
const selectedMonster = ref(null);
const groupedBestiary = ref({});
const diceRollResult = ref(null);
const bestiaryName = ref('');
const selectedSource = ref('');
const jsonUrl = ref('');
const isLoading = ref(false);
const lastDiceRolls = ref([]); // Array to store last 3 rolls with monster info
const lastGameTerm = ref(null);
const activeTab = ref(null); // 'rolls' or 'condition' or null
const currentSlide = ref(1); // Track current slide (1-based to match slide IDs)
const expandedRolls = ref(new Set()); // Track which rolls are expanded
const hoverTooltip = ref({ visible: false, term: '', description: '', x: 0, y: 0 }); // Tooltip state


onMounted(async () => {
    await refreshBestiary();
    
    // Set up game term click listeners
    setupGameTermListeners();
});


const setupGameTermListeners = () => {
    // Use event delegation to handle hover events on dynamically added game terms
    document.addEventListener('mouseenter', (event) => {
        if (event.target.classList.contains('game-term')) {
            const term = event.target.getAttribute('data-term');
            const description = event.target.getAttribute('data-description');
            showGameTermTooltip(event, term, description);
        }
    }, true); // Use capture phase for better event handling
    
    document.addEventListener('mouseleave', (event) => {
        if (event.target.classList.contains('game-term')) {
            hideGameTermTooltip();
        }
    }, true);
};


const showGameTermSummary = (term, description) => {
    lastGameTerm.value = { term, description };
    // Automatically open the condition tab
    activeTab.value = 'condition';
};

const showGameTermTooltip = (event, term, description) => {
    const rect = event.target.getBoundingClientRect();
    const tooltipWidth = 300; // Estimated tooltip width
    const tooltipHeight = 100; // Estimated tooltip height
    const padding = 10; // Padding from viewport edges
    
    let x = rect.left + (rect.width / 2); // Center horizontally on the element
    let y = rect.bottom + 5; // Position below the element
    
    // Check right boundary
    if (x + tooltipWidth / 2 > window.innerWidth - padding) {
        x = window.innerWidth - tooltipWidth / 2 - padding;
    }
    
    // Check left boundary
    if (x - tooltipWidth / 2 < padding) {
        x = tooltipWidth / 2 + padding;
    }
    
    // Check bottom boundary - if tooltip would go off screen, show above the element
    if (y + tooltipHeight > window.innerHeight - padding) {
        y = rect.top - tooltipHeight - 5; // Position above the element
    }
    
    // Final check if still off top of screen
    if (y < padding) {
        y = padding;
    }
    
    hoverTooltip.value = {
        visible: true,
        term,
        description,
        x: x - tooltipWidth / 2, // Adjust for centering
        y
    };
};

const hideGameTermTooltip = () => {
    hoverTooltip.value.visible = false;
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
    // Reset to first slide when new roll is added
    currentSlide.value = 1;
};

const navigateToSlide = (slideNumber) => {
    currentSlide.value = slideNumber;
    // Navigate using the carousel's URL fragment method
    window.location.hash = `slide${slideNumber}`;
};

const moveRollToTop = (rollIndex) => {
    // Move the clicked roll to the top of the array
    const selectedRoll = lastDiceRolls.value.splice(rollIndex, 1)[0];
    lastDiceRolls.value.unshift(selectedRoll);
};

const toggleRollExpansion = (rollIndex) => {
    const rollId = `roll-${rollIndex}`;
    if (expandedRolls.value.has(rollId)) {
        expandedRolls.value.delete(rollId);
    } else {
        expandedRolls.value.add(rollId);
    }
    // Force reactivity
    expandedRolls.value = new Set(expandedRolls.value);
};

const isRollExpanded = (rollIndex) => {
    return expandedRolls.value.has(`roll-${rollIndex}`);
};

const toggleLastRoll = () => {
    if (activeTab.value === 'rolls') {
        // Currently showing rolls, so hide all
        activeTab.value = null;
    } else if (lastDiceRolls.value.length > 0) {
        // Show rolls tab
        activeTab.value = 'rolls';
    }
};

const toggleLastCondition = () => {
    if (activeTab.value === 'condition') {
        // Currently showing condition, so hide all
        activeTab.value = null;
    } else if (lastGameTerm.value) {
        // Show condition tab
        activeTab.value = 'condition';
    }
};

const rollDice = (value, rollMode, count = 1, crit = true) => {
    // Clear any existing dice result when starting a new roll
    diceRollResult.value = null;
    
    diceRollResult.value = rollDiceWithDiceRoller(value, rollMode, count, crit);
    // Add roll to history with current monster info
    if (selectedMonster.value) {
        addRollToHistory(diceRollResult.value, selectedMonster.value);
    }
    // Automatically open the rolls tab
    activeTab.value = 'rolls';
};


const selectMonster = (monster) => {
    selectedMonster.value = monster;
    // Auto-close all tabs when switching monsters
    activeTab.value = null;
    diceRollResult.value = null;
    // Keep roll history across monsters (now stores monster info with each roll)
    // Keep lastGameTerm across monsters (conditions are general game mechanics)
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


const rollTabText = computed(() => {
    return 'Rolls';
});

const conditionTabText = computed(() => {
    return 'Condition';
});

const formatRollNotation = (roll) => {
    let notation = roll.originalNotation;
    if (roll.rollMode !== 'normal') {
        notation += ` (${roll.rollMode === 'advantage' ? 'ADV' : 'DIS'} ${roll.count})`;
    }
    return notation;
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
    
    <div class="flex flex-col h-screen">
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
                        <a v-if="playerSelection.metadata[`${ID}/monstersheet`]">Update Token</a>
                        <a v-else>Link Token</a>
                    </button>
                    <button @click="settingsModal.showModal()" class="btn btn-square btn-ghost">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            class="inline-block w-5 h-5 stroke-current">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div v-if="selectedMonster" class="overflow-y-auto overflow-x-hidden flex-1">
                <HeaderComponent :monster="selectedMonster" @rollDiceHeader="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
                <PassiveComponent :monster="selectedMonster" @rollDicePassive="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
                <ActionsComponent :monster="selectedMonster" @rollDiceAction="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
                <LegendaryComponent :monster="selectedMonster" @rollDiceLegendary="(value, rollMode, count, crit) => rollDice(value, rollMode, count, crit)" />
            </div>
            
            <!-- Round D20 Toggle Button -->
            <div class="absolute bottom-8 right-8 z-20">
                <button @click="toggleLastRoll" 
                        class="btn btn-circle btn-lg btn-primary shadow-lg hover:shadow-xl transition-all"
                        :class="{ 'btn-active': activeTab === 'rolls' }">
                    <!-- D20 Icosahedron SVG from dice CSS -->
                    <svg width="28" height="31" viewBox="0 0 28 31" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
                        <path d="M14 0L0 7.5V22.7L14 30.2L27 23.2L28 22.6V7.5L14 0ZM12 8.3L6.1 17.1L2.4 9.1L12 8.3ZM8 18L14 8.9L20 18H8ZM21.8 17.1L16 8.3L25.5 9L21.8 17.1ZM15 2.8L22.4 6.8L15 6.2V2.8ZM13 2.8V6.2L5.6 6.8L13 2.8ZM2 12.8L4.7 18.8L2 20.4V12.8ZM3 22.1L5.7 20.5L10.1 26L3 22.1ZM8 20H19L14 27.5L8 20ZM17.9 25.9L22.3 20.4L25 22L17.9 25.9ZM23.5 18.9L23.3 18.8L26 12.8V20.4L23.5 18.9Z" />
                    </svg>
                </button>
            </div>
            
            <!-- Dice Roll Result (Floating Window) -->
            <div class="absolute bottom-24 right-8 z-10" v-if="activeTab === 'rolls'">
                <!-- Roll History Stack -->
                <div class="space-y-2">
                    <!-- Previous Rolls - Compact Display (Oldest to Newest) -->
                    <div v-for="(roll, index) in lastDiceRolls.slice(1).reverse()" 
                         :key="`compact-${index}`"
                         class="bg-base-300 shadow-lg rounded-lg w-90 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                         @click="toggleRollExpansion(lastDiceRolls.length - 1 - index)">
                        
                        <!-- Compact View -->
                        <div v-if="!isRollExpanded(lastDiceRolls.length - 1 - index)" class="px-4 py-2 flex items-center justify-between">
                            <div class="text-sm">
                                <div class="text-xs opacity-70">{{ roll.monster?.name?.toUpperCase() || 'UNKNOWN' }}: {{ formatRollNotation(roll).toUpperCase() }}</div>
                            </div>
                            <div class="text-xl font-bold text-primary">{{ roll.total }}</div>
                        </div>
                        
                        <!-- Expanded View -->
                        <div v-else class="p-4">
                            <div class="text-xs opacity-70 mb-1">{{ roll.monster?.name || 'Unknown' }}</div>
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
                    <div v-if="lastDiceRolls.length > 0" class="bg-base-300 shadow-lg rounded-lg w-90">
                        <div class="p-4">
                            <div class="text-xs opacity-70 mb-1">{{ lastDiceRolls[0].monster?.name || 'Unknown' }}</div>
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
        </div>
    
    <!-- Hover Tooltip for Game Terms -->
    <div v-if="hoverTooltip.visible" 
         class="fixed z-50 alert alert-info alert-soft shadow-lg p-3 max-w-xs pointer-events-none"
         :style="{ left: hoverTooltip.x + 'px', top: hoverTooltip.y + 'px' }">
        <p class="text-sm leading-relaxed">{{ hoverTooltip.description }}</p>
    </div>
    
    <!-- Global Context Menu -->
    <GlobalRollContextMenu />
</template>


<style scoped>
</style>


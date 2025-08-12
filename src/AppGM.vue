<script setup>
import HeaderComponent from './components/HeaderComponent.vue';
import ActionsComponent from './components/ActionsComponent.vue';
import PassiveComponent from './components/PassiveComponent.vue';
import LegendaryComponent from './components/LegendaryComponent.vue';
import RollComponent from './components/RollComponent.vue';
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
const gameTermSummary = ref(null);
let timeoutId = null;

onMounted(async () => {
    const bestiary = await db.bestiary.toArray();
    groupedBestiary.value = bestiary.reduce((acc, monster) => {
        if (!acc[monster.source]) {
            acc[monster.source] = [];
        }
        acc[monster.source].push(monster);
        return acc;
    }, {});
    if (bestiary.length > 0) {
        selectedMonster.value = bestiary[0];
    }
    
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
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
        gameTermSummary.value = null;
        timeoutId = null;
    }, 8000);
};

const hideGameTermSummary = () => {
    gameTermSummary.value = null;
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
};

const rollDice = (value, rollMode) => {
    diceRollResult.value = rollDiceWithDiceRoller(value, rollMode);
    if (timeoutId) {
        clearTimeout(timeoutId); // Clear the existing timeout
    }
    timeoutId = setTimeout(() => {
        diceRollResult.value = null;
        timeoutId = null; // Reset the timeout ID
    }, 5000); // Hide the result after 5 seconds
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

const saveJson = () => {
  const files = fileInput.value.files;
  const allMonsters = [];
  let filesProcessed = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = (e) => {
      const monster = JSON.parse(e.target.result);
      // Add the bestiary name as source if provided, otherwise use selected source
      const sourceToUse = bestiaryName.value || selectedSource.value;
      if (sourceToUse) {
        monster.source = sourceToUse;
      }
      allMonsters.push(monster);
      filesProcessed++;
      
      // Once all files are processed, write the bulk data
      if (filesProcessed === files.length) {
        writeBulkToTable(allMonsters);
      }
    };
    reader.readAsText(file);
  }
};

const deleteData = () => {
    clearTable();
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

const compositeString = computed(() => {
    if (!selectedMonster.value || !diceRollResult.value) return '';
    return `${selectedMonster.value.name} rolls ${diceRollResult.value[0]}`;
});

</script>

<template>
    <div class="stats bg-neutral z-50 fixed bottom-1 right-1" v-if="diceRollResult !== null">
        <div class="stat">
            <div class="stat-title">{{ compositeString }}</div>
            <div class="stat-value text-primary">{{ diceRollResult[2] }}</div>
            <div class="stat-desc">{{ diceRollResult[1] }}</div>
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
        <div class="drawer-content flex flex-col overflow-x-hidden">
            <div class="navbar bg-base-300">
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
            <div v-if="selectedMonster" class="overflow-x-hidden">
                <HeaderComponent :monster="selectedMonster" />
                <PassiveComponent :monster="selectedMonster" @rollDicePassive="(value, rollMode) => rollDice(value, rollMode)" />
                <ActionsComponent :monster="selectedMonster" @rollDiceAction="(value, rollMode) => rollDice(value, rollMode)" />
                <LegendaryComponent :monster="selectedMonster" @rollDiceLegendary="(value, rollMode) => rollDice(value, rollMode)" />
                <RollComponent :monster="selectedMonster" @rollDice="(value, rollMode) => rollDice(value, rollMode)" />
            </div>
        </div>
        <div class="drawer-side">
            <label for="my-drawer-1" aria-label="close sidebar" class="drawer-overlay"></label>
            <div class="menu p-4 w-80 min-h-full bg-base-200 text-base-content flex flex-col">
                <!-- Sidebar content here -->
                <div class="flex-grow space-y-2">
                    <p class="font-bold">Upload JSON Monster file</p>
                    <input type="text" placeholder="Enter bestiary name" v-model="bestiaryName" class="input input-bordered input-sm w-full max-w-xs" />
                    <select v-model="selectedSource" class="select select-bordered select-sm w-full max-w-xs">
                        <option value="">Select existing source</option>
                        <option v-for="source in availableSources" :key="source" :value="source">{{ source }}</option>
                    </select>
                    <input type="file" multiple ref="fileInput" class="file-input file-input-bordered file-input-sm w-full max-w-xs" />
                    <button @click="saveJson" class="btn btn-primary w-full">Save</button>
                    <button @click="deleteData" class="btn btn-error w-full">Delete all data</button>
                </div> 
            </div> 
        </div>
    </div>
</template>

<style scoped>

</style>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      ref="contextMenu"
      class="fixed z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg py-2 w-48"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      @click.stop
    >
      <!-- Crit/Minion/Vicious checkboxes (hidden for header saves) -->
      <div v-if="showExtraOptions" class="px-3 py-2 border-b border-base-300">
        <label v-if="props.monster?.data?.attributes?.subtype != 'minion'" class="flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            v-model="critEnabled" 
            class="checkbox checkbox-sm mr-2"
            @click.stop
          />
          <span class="text-sm font-medium">Roll with Crit?</span>
        </label>
        
        <!-- Minion Attack checkbox with number input -->
        <div v-if="props.monster?.data?.attributes?.subtype === 'minion'" class="flex items-center mt-2">
          <label class="flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="minionAttack"
              class="checkbox checkbox-sm mr-2"
              @click.stop
            />
            <span class="text-sm font-medium">Minion Attack?</span>
          </label>
          <input
            type="number"
            v-model="minionCount"
            min="1"
            max="99"
            class="input input-xs w-16 ml-2"
            @click.stop
            @focus.stop
            @blur.stop
          />
        </div>

        <!-- Vicious Attack (hidden for minions) -->
        <div v-if="props.monster?.data?.attributes?.subtype != 'minion'" class="flex items-center mt-2">
          <label class="flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="viciousAttack"
              class="checkbox checkbox-sm mr-2"
              @click.stop
            />
            <span class="text-sm font-medium">Vicious Attack</span>
          </label>
        </div>
      </div>
      
      <!-- Advantage/Disadvantage selector -->
      <div class="px-2 py-2 flex items-center justify-between">
        <button @click.stop="moveLeft" 
                class="btn btn-xs btn-ghost w-8 h-8 min-h-8 p-0 flex-shrink-0">
          ◀
        </button>
        <button @click="executeRoll"
                class="btn btn-xs btn-ghost flex-1 mx-1 text-sm font-medium">
          {{ currentModeText }}
        </button>
        <button @click.stop="moveRight" 
                class="btn btn-xs btn-ghost w-8 h-8 min-h-8 p-0 flex-shrink-0">
          ▶
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, watch, onMounted, onUnmounted, ref } from 'vue'
import { useGlobalContextMenu } from '../composables/useGlobalContextMenu.js'

const props = defineProps({
    monster: Object
})

const { 
  isVisible, 
  position, 
  currentModeIndex,
  critEnabled,
  minionAttack,
  minionCount,
  viciousAttack,
  showExtraOptions,
  close, 
  executeRoll 
} = useGlobalContextMenu()

const currentModeText = computed(() => {
  if (currentModeIndex.value === 0) {
    return 'Normal'
  } else if (currentModeIndex.value > 0) {
    return `ADV ${currentModeIndex.value}`
  } else {
    return `DIS ${Math.abs(currentModeIndex.value)}`
  }
})

const moveLeft = () => {
  currentModeIndex.value--
}

const moveRight = () => {
  currentModeIndex.value++
}

// Close menu when clicking outside
const handleDocumentClick = (event) => {
  if (isVisible.value) {
    const contextMenuElement = document.querySelector('.fixed.z-50.bg-base-100')
    if (contextMenuElement && !contextMenuElement.contains(event.target)) {
      close()
    }
  }
}

// Watch for visibility changes to manage document listeners
watch(isVisible, (newVal) => {
  if (newVal) {
    // Default minion attack to checked if monster is a minion
    if (props.monster?.data?.attributes?.subtype === 'minion') {
      minionAttack.value = true
    }
    // Remove any existing listener first
    document.removeEventListener('click', handleDocumentClick)
    // Add the listener with a slight delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('click', handleDocumentClick)
    }, 100)
  } else {
    document.removeEventListener('click', handleDocumentClick)
  }
})

// Cleanup on component unmount
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

import { ref, reactive } from 'vue'

// Global state for the context menu
const isVisible = ref(false)
const position = reactive({ x: 0, y: 0 })
const rollText = ref('')
const currentModeIndex = ref(0)
const currentEmitFunction = ref(null)
const currentEventName = ref('rollDice')

export const useGlobalContextMenu = () => {
  const show = (event, text, emitFn, eventName) => {
    // Close any existing menu first
    isVisible.value = false
    
    // Set new values
    rollText.value = text
    currentModeIndex.value = 0
    currentEmitFunction.value = emitFn
    currentEventName.value = eventName
    position.x = event.pageX
    position.y = event.pageY
    
    // Show with small delay to ensure clean state
    setTimeout(() => {
      isVisible.value = true
    }, 10)
  }

  const close = () => {
    isVisible.value = false
    currentEmitFunction.value = null
  }

  const executeRoll = () => {
    if (currentEmitFunction.value) {
      const count = Math.abs(currentModeIndex.value) || 1
      const mode = currentModeIndex.value === 0 ? 'normal' : 
                   currentModeIndex.value > 0 ? 'advantage' : 'disadvantage'
      
      // Pass the roll text, mode, and count to the emit function
      currentEmitFunction.value(currentEventName.value, rollText.value, mode, count)
    }
    close()
  }

  return {
    isVisible,
    position,
    rollText,
    currentModeIndex,
    show,
    close,
    executeRoll
  }
}

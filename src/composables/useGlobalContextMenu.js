import { ref, reactive } from 'vue'

// Global state for the context menu
const isVisible = ref(false)
const position = reactive({ x: 0, y: 0 })
const rollText = ref('')
const currentModeIndex = ref(0)
const currentEmitFunction = ref(null)
const currentEventName = ref('rollDice')
const critEnabled = ref(true) // Add crit state with default true

export const useGlobalContextMenu = () => {
  const show = (event, text, emitFn, eventName, defaultCrit = true, initialModeIndex = 0) => {
    // Close any existing menu first
    isVisible.value = false
    
    // Set new values
    rollText.value = text
    currentModeIndex.value = initialModeIndex // Use the provided initial mode index
    critEnabled.value = defaultCrit // Use the provided default crit value
    currentEmitFunction.value = emitFn
    currentEventName.value = eventName
    
    // Calculate position with boundary checking
    const menuWidth = 192 // w-48 = 192px
    const menuHeight = 120 // Approximate height for the menu
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let x = event.pageX
    let y = event.pageY
    
    // Check right boundary
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10 // 10px padding from edge
    }
    
    // Check bottom boundary
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10 // 10px padding from edge
    }
    
    // Ensure minimum distance from edges
    x = Math.max(10, x) // At least 10px from left edge
    y = Math.max(10, y) // At least 10px from top edge
    
    position.x = x
    position.y = y
    
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
      
      // Pass the roll text, mode, count, and crit flag to the emit function
      currentEmitFunction.value(currentEventName.value, rollText.value, mode, count, critEnabled.value)
    }
    close()
  }

  return {
    isVisible,
    position,
    rollText,
    currentModeIndex,
    critEnabled,
    show,
    close,
    executeRoll
  }
}

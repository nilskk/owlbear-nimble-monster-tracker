import { ref, reactive } from 'vue'

// Global state for the context menu
const isVisible = ref(false)
const position = reactive({ x: 0, y: 0 })
const rollText = ref('')
const currentModeIndex = ref(0)
const currentEmitFunction = ref(null)
const currentEventName = ref('rollDice')
const critEnabled = ref(true) // Add crit state with default true
const minionAttack = ref(false) // Add minion attack state
const minionCount = ref(1) // Add minion count state
const viciousAttack = ref(false) // Add vicious attack state
const showExtraOptions = ref(true) // Control visibility of crit/minion/vicious checkboxes

export const useGlobalContextMenu = () => {
  const show = (event, text, emitFn, eventName, defaultCrit = true, initialModeIndex = 0, showOpts = true) => {
    // Close any existing menu first
    isVisible.value = false
    
    // Set new values
    rollText.value = text
    currentModeIndex.value = initialModeIndex // Use the provided initial mode index
    critEnabled.value = defaultCrit // Use the provided default crit value
    viciousAttack.value = text.includes('v') // Auto-enable vicious if notation has v
    currentEmitFunction.value = emitFn
    currentEventName.value = eventName
    showExtraOptions.value = showOpts
    
    // Calculate position with boundary checking
    const menuWidth = 192 // w-48 = 192px
    const menuHeight = showOpts ? 120 : 50 // Smaller when extra options hidden
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
    // Reset settings to defaults when closing
    minionAttack.value = false
    minionCount.value = 1
    viciousAttack.value = false
    showExtraOptions.value = true
  }

  const executeRoll = () => {
    if (currentEmitFunction.value) {
      const count = Math.abs(currentModeIndex.value) || 1
      const mode = currentModeIndex.value === 0 ? 'normal' : 
                   currentModeIndex.value > 0 ? 'advantage' : 'disadvantage'
      
      // If minion attack is enabled, treat crit as false regardless of checkbox state
      const effectiveCrit = minionAttack.value ? false : critEnabled.value
      
      // Pass the roll text, mode, count, effective crit flag, minion attack, and minion count to the emit function
      currentEmitFunction.value(currentEventName.value, rollText.value, mode, count, effectiveCrit, minionAttack.value, minionCount.value, viciousAttack.value)
    }
    close()
  }

  return {
    isVisible,
    position,
    rollText,
    currentModeIndex,
    critEnabled,
    minionAttack,
    minionCount,
    viciousAttack,
    showExtraOptions,
    show,
    close,
    executeRoll
  }
}

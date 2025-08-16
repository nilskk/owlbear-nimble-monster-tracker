<template>
    <!-- Hover Tooltip for Game Terms -->
    <div v-if="tooltipState.visible" 
         class="fixed z-50 alert alert-info alert-soft shadow-lg p-3 max-w-xs pointer-events-none"
         :style="{ left: tooltipState.x + 'px', top: tooltipState.y + 'px' }">
        <p class="text-sm leading-relaxed">{{ tooltipState.description }}</p>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Tooltip state
const tooltipState = ref({ visible: false, term: '', description: '', x: 0, y: 0 })

// Tooltip functions
const showTooltip = (event, term, description) => {
    const rect = event.target.getBoundingClientRect()
    const tooltipWidth = 300 // Estimated tooltip width
    const tooltipHeight = 100 // Estimated tooltip height
    const padding = 10 // Padding from viewport edges
    
    let x = rect.left + (rect.width / 2) // Center horizontally on the element
    let y = rect.bottom + 5 // Position below the element
    
    // Check right boundary
    if (x + tooltipWidth / 2 > window.innerWidth - padding) {
        x = window.innerWidth - tooltipWidth / 2 - padding
    }
    
    // Check left boundary
    if (x - tooltipWidth / 2 < padding) {
        x = tooltipWidth / 2 + padding
    }
    
    // Check bottom boundary - if tooltip would go off screen, show above the element
    if (y + tooltipHeight > window.innerHeight - padding) {
        y = rect.top - tooltipHeight - 5 // Position above the element
    }
    
    // Final check if still off top of screen
    if (y < padding) {
        y = padding
    }
    
    tooltipState.value = {
        visible: true,
        term,
        description,
        x: x - tooltipWidth / 2, // Adjust for centering
        y
    }
}

const hideTooltip = () => {
    tooltipState.value.visible = false
}

// Event listener setup
const setupEventListeners = () => {
    // Use event delegation to handle hover events on dynamically added game terms
    document.addEventListener('mouseenter', (event) => {
        if (event.target.classList.contains('game-term')) {
            const term = event.target.getAttribute('data-term')
            const description = event.target.getAttribute('data-description')
            showTooltip(event, term, description)
        }
    }, true) // Use capture phase for better event handling
    
    document.addEventListener('mouseleave', (event) => {
        if (event.target.classList.contains('game-term')) {
            hideTooltip()
        }
    }, true)
}

const removeEventListeners = () => {
    document.removeEventListener('mouseenter', setupEventListeners)
    document.removeEventListener('mouseleave', setupEventListeners)
}

// Lifecycle hooks
onMounted(() => {
    setupEventListeners()
})

onUnmounted(() => {
    removeEventListeners()
})
</script>

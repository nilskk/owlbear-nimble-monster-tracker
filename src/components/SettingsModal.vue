<template>
    <!-- Settings Modal -->
    <dialog ref="settingsModal" class="modal">
        <div class="modal-box w-96 max-w-md">
            <h3 class="font-bold text-lg mb-4">Settings</h3>
            <div class="space-y-4">
                <div>
                    <input type="checkbox" v-model="showRollsToPlayers" class="checkbox checkbox-primary" />
                    <label class="ml-2">Enable Players to see GM Rolls</label>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <label for="numberOfHeroes">Number of Heroes</label>
                    <input
                        id="numberOfHeroes"
                        type="number"
                        min="1"
                        step="1"
                        v-model.number="numberOfHeroes"
                        class="input input-bordered input-sm w-24 text-right"
                    />
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
import { ref, watch } from 'vue'

// Props
const props = defineProps({
    showRollsToPlayers: {
        type: Boolean,
        default: false
    },
    numberOfHeroes: {
        type: Number,
        default: 4
    }
})

// Emits
const emit = defineEmits(['update:showRollsToPlayers', 'update:numberOfHeroes'])

const settingsModal = ref(null)
const showRollsToPlayers = ref(props.showRollsToPlayers)
const numberOfHeroes = ref(props.numberOfHeroes)

// Watch for prop changes and update local ref
watch(() => props.showRollsToPlayers, (newValue) => {
    showRollsToPlayers.value = newValue
})

watch(() => props.numberOfHeroes, (newValue) => {
    numberOfHeroes.value = newValue
})

// Watch for changes and emit to parent
watch(showRollsToPlayers, (newValue) => {
    emit('update:showRollsToPlayers', newValue)
})

watch(numberOfHeroes, (newValue) => {
    emit('update:numberOfHeroes', newValue)
})

// Methods
const showModal = () => {
    settingsModal.value?.showModal()
}

// Expose methods to parent
defineExpose({
    showModal
})
</script>

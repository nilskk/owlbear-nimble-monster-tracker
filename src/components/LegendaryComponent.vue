<script setup>
import { ref, toRefs, onMounted, onUpdated, nextTick, computed } from 'vue'
import { parseText } from '../parseFunctions';
import { useRollButtonListeners } from '../composables/useRollButtonListeners';


const props = defineProps({
    monster: Object
})

const emit = defineEmits(['rollDiceLegendary'])

const attachListeners = async () => {
    await nextTick();
    const handleButtonClick = (event) => {
        emit('rollDiceLegendary', event.target.innerText, "normal");
    };

    const handleButtonRightClick = (event) => {
        emit('rollDiceLegendary', event.target.innerText, "advantage");
    };

    const handleButtonMiddleClick = (event) => {
        emit('rollDiceLegendary', event.target.innerText, "disadvantage");
    };

    const buttons = document.getElementsByClassName('rollButton');
    Array.from(buttons).forEach(button => {
        button.addEventListener('click', handleButtonClick);
        button.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            handleButtonRightClick(event);
        });
        button.addEventListener('mousedown', (event) => {
            if (event.button === 1) {
                event.preventDefault();
                handleButtonMiddleClick(event);
            }
        });
    });
};
onMounted(attachListeners);
onUpdated(attachListeners);

</script>

<template>
    <div v-if="props.monster.bloodied || props.monster.laststand" class="divider divider-accent font-bold mb-0">Legendary</div>
    <div v-if="props.monster.bloodied || props.monster.laststand" class="px-2 pt-2 space-y-2">
        <!-- Bloodied -->
        <div v-if="props.monster.bloodied" class="space-y-1">
            <p class="w-full break-words">
                <span class="font-bold text-warning">Bloodied:</span>
                <span v-html="parseText(props.monster.bloodied)" class="ml-2"></span>
            </p>
        </div>

        <!-- Last Stand -->
        <div v-if="props.monster.laststand" class="space-y-1">
            <p class="w-full break-words">
                <span class="font-bold text-error">Last Stand:</span>
                <span v-html="parseText(props.monster.laststand)" class="ml-2"></span>
            </p>
        </div>
    </div>
</template>

<style scoped></style>

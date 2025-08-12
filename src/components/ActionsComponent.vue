<script setup>
import { ref, toRefs, onMounted, onUpdated, nextTick, computed } from 'vue'
import { parseText } from '../parseFunctions';
import { useRollButtonListeners } from '../composables/useRollButtonListeners';


const props = defineProps({
    monster: Object
})

const emit = defineEmits(['rollDiceAction'])

const attachListeners = async () => {
    await nextTick();
    const handleButtonClick = (event) => {
        emit('rollDiceAction', event.target.innerText, "normal");
    };

    const handleButtonRightClick = (event) => {
        emit('rollDiceAction', event.target.innerText, "advantage");
    };

    const handleButtonMiddleClick = (event) => {
        emit('rollDiceAction', event.target.innerText, "disadvantage");
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
    <div v-if="props.monster.actions || props.monster.action" class="divider divider-accent font-bold mb-0">Actions</div>
    <div v-if="props.monster.actions || props.monster.action" class="px-2 pt-2 space-y-2">
        <!-- New JSON format actions -->
        <div v-if="props.monster.actions" v-for="actionGroup in props.monster.actions" :key="actionGroup.name" class="w-full break-words space-y-2">
            <div v-if="actionGroup.type === 'multi'" class="space-y-2">
                <p v-if="actionGroup.desc" class="font-semibold" v-html="parseText(actionGroup.desc)"></p>
                <div v-for="action in actionGroup.actions" :key="action.name" class="pl-4 space-y-1">
                    <p class="w-full break-words">
                        <span v-html="parseText(action.name)" class="font-bold"></span>
                        <span v-html="parseText(action.desc)" class="ml-2"></span>
                    </p>
                </div>
            </div>
            <div v-else-if="actionGroup.type === 'single'" class="space-y-1">
                <p class="w-full break-words">
                    <span v-html="parseText(actionGroup.name)" class="font-bold"></span>
                    <span v-html="parseText(actionGroup.desc)" class="ml-2"></span>
                </p>
            </div>
        </div>

        <!-- Original format actions
        <p v-if="props.monster.action" v-for="item in props.monster.action" class="w-full break-words space-x-1">
            <span v-html="parseText(item.name)" class="font-bold"></span>
            <p v-for="subitem in item.entries" class="w-full break-words space-x-1">
                <p v-if="subitem.items" class="space-y-1 ps-6">
                    <p v-for="subsubitem in subitem.items" class="w-full break-words space-x-1">
                        <span v-html="parseText(subsubitem.name)" class="font-semibold"></span>
                        <span v-for="subsubsubitem in subsubitem.entries" v-html="parseText(subsubsubitem)"
                            class="w-full break-words space-x-1 "></span>
                        <span v-html="parseText(subsubitem.entry)" class=""></span>
                    </p>
                </p>
                <span v-else v-html="parseText(subitem)" class=""></span>
            </p>
        </p> -->
    </div>
</template>

<style scoped></style>
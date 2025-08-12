<script setup>
import { onMounted, ref, toRefs, onUpdated, nextTick } from 'vue'
import { useRollButtonListeners } from '../composables/useRollButtonListeners';

const props = defineProps({
    monster: Object
})

const attributeModifier = (attribute) => Math.floor((attribute - 10) / 2);

const emit = defineEmits(['rollDiceAttribute'])

const attachListeners = async () => {
    await nextTick();
    const handleButtonClick = (event) => {
        emit('rollDiceAttribute', event.target.innerText, "normal");
    };

    const handleButtonRightClick = (event) => {
        emit('rollDiceAttribute', event.target.innerText, "advantage");
    };

    const handleButtonMiddleClick = (event) => {
        emit('rollDiceAttribute', event.target.innerText, "disadvantage");
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
    <div class="join w-full justify-evenly">
        <table class="table table-xs table-zebra font-bold">
            <thead>
                <th></th>
                <th></th>
                <th>MOD</th>
                <th>SAVE</th>
            </thead>
            <tbody>
                <tr>
                    <td>STR</td>
                    <td>
                        <div class="text-primary ">{{ props.monster.str }}</div>
                    </td>
                    <td>
                        <button class="btn btn-xs btn-outline btn-secondary font-bold rollButton" >
                            {{attributeModifier(props.monster.str) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.str) }}
                        </button>
                    </td>
                    <td>
                        <p v-if=props.monster.save?.str>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{props.monster.save.str}}
                            </button>
                        </p>
                        <p v-else>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{attributeModifier(props.monster.str) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.str) }}
                            </button>
                        </p>
                    </td>
                </tr>
                <tr>
                    <td>INT</td>
                    <td>
                        <div class="text-primary">{{ props.monster.int }}</div>
                    </td>
                    <td>
                        <button class="btn btn-xs btn-outline btn-secondary font-bold rollButton" >
                            {{attributeModifier(props.monster.int) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.int) }}
                        </button>
                    </td>
                    <td>
                        <p v-if=props.monster.save?.int>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{props.monster.save.int}}
                            </button>
                        </p>
                        <p v-else>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{attributeModifier(props.monster.int) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.int) }}
                            </button>
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="divider divider-horizontal m-0"></div>
        <table class="table table-xs table-zebra font-bold">
            <thead>
                <th></th>
                <th></th>
                <th>MOD</th>
                <th>SAVE</th>
            </thead>
            <tbody>
                <tr>
                    <td>DEX</td>
                    <td>
                        <div class="text-primary ">{{ props.monster.dex }}</div>
                    </td>
                    <td>
                        <button class="btn btn-xs btn-outline btn-secondary font-bold rollButton" >
                            {{attributeModifier(props.monster.dex) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.dex) }}
                        </button>
                    </td>
                    <td>
                        <p v-if=props.monster.save?.dex>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{props.monster.save.dex}}
                            </button>
                        </p>
                        <p v-else>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{attributeModifier(props.monster.dex) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.dex) }}
                            </button>
                        </p>
                    </td>
                </tr>
                <tr>
                    <td>WIS</td>
                    <td>
                        <div class="text-primary">{{ props.monster.wis }}</div>
                    </td>
                    <td>
                        <button class="btn btn-xs btn-outline btn-secondary font-bold rollButton" >
                            {{attributeModifier(props.monster.wis) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.wis) }}
                        </button>
                    </td>
                    <td>
                        <p v-if=props.monster.save?.wis>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{props.monster.save.wis}}
                            </button>
                        </p>
                        <p v-else>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{attributeModifier(props.monster.wis) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.wis) }}
                            </button>
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="divider divider-horizontal m-0"></div>
        <table class="table table-xs table-zebra font-bold">
            <thead>
                <th></th>
                <th></th>
                <th>MOD</th>
                <th>SAVE</th>
            </thead>
            <tbody>
                <tr>
                    <td>CON</td>
                    <td>
                        <div class="text-primary ">{{ props.monster.con }}</div>
                    </td>
                    <td>
                        <button class="btn btn-xs btn-outline btn-secondary font-bold rollButton" >
                            {{attributeModifier(props.monster.con) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.con) }}
                        </button>
                    </td>
                    <td>
                        <p v-if=props.monster.save?.con>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{props.monster.save.con}}
                            </button>
                        </p>
                        <p v-else>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{attributeModifier(props.monster.con) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.con) }}
                            </button>
                        </p>
                    </td>
                </tr>
                <tr>
                    <td>CHA</td>
                    <td>
                        <div class="text-primary">{{ props.monster.cha }}</div>
                    </td>
                    <td>
                        <button class="btn btn-xs btn-outline btn-secondary font-bold rollButton" >
                            {{attributeModifier(props.monster.cha) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.cha) }}
                        </button>
                    </td>
                    <td>
                        <p v-if=props.monster.save?.cha>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{props.monster.save.cha}}
                            </button>
                        </p>
                        <p v-else>
                            <button class="btn btn-xs btn-outline btn-accent font-bold rollButton" >
                                {{attributeModifier(props.monster.cha) >= 0 ? '+' : '' }}{{attributeModifier(props.monster.cha) }}
                            </button>
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped></style>
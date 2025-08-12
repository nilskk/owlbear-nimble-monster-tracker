import { createApp } from 'vue'
import './style.css'
import AppGM from './AppGM.vue'
import AppPlayer from './AppPlayer.vue'
import OBR from '@owlbear-rodeo/sdk'

const ID = 'com.nilskk.owlbear-beyond';
const CLASH_LABEL_ID = '56d6b2c4-cd17-11ed-afa1-0242ac120002';



const state = {
    lastCreature: {},
};


OBR.onReady(async() => {
    const role = await OBR.player.getRole();
    if(role == 'GM') {
        createApp(AppGM).mount('#app')
    }
    else {
        createApp(AppPlayer).mount('#app')
    }

    

});



import { nextTick } from 'vue';
import { useGlobalContextMenu } from './useGlobalContextMenu.js';

export async function useRollButtonListeners(emit, eventName = 'rollDice') {
    await nextTick();
    
    const { show, close } = useGlobalContextMenu();

    const handleButtonClick = (event) => {
        close(); // Close any open context menu
        emit(eventName, event.target.innerText, "normal");
    };

    const handleButtonRightClick = (event) => {
        event.preventDefault();
        show(event, event.target.innerText, emit, eventName);
    };

    const buttons = document.getElementsByClassName('rollButton');
    Array.from(buttons).forEach(button => {
        // Remove existing listeners to prevent duplicates
        button.removeEventListener('click', handleButtonClick);
        button.removeEventListener('contextmenu', handleButtonRightClick);
        
        // Add new listeners
        button.addEventListener('click', handleButtonClick);
        button.addEventListener('contextmenu', handleButtonRightClick);
    });
}
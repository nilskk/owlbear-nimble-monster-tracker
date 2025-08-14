import { nextTick } from 'vue';
import { useGlobalContextMenu } from './useGlobalContextMenu.js';

// Store handlers globally to ensure proper cleanup
const buttonHandlers = new WeakMap();

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
        // Remove existing handlers if they exist
        const existingHandlers = buttonHandlers.get(button);
        if (existingHandlers) {
            button.removeEventListener('click', existingHandlers.click);
            button.removeEventListener('contextmenu', existingHandlers.contextmenu);
        }
        
        // Store new handlers
        const handlers = {
            click: handleButtonClick,
            contextmenu: handleButtonRightClick
        };
        buttonHandlers.set(button, handlers);
        
        // Add new listeners
        button.addEventListener('click', handleButtonClick);
        button.addEventListener('contextmenu', handleButtonRightClick);
    });
}
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

    const handleSaveButtonClick = (event) => {
        close(); // Close any open context menu
        const saveText = event.target.innerText;
        
        // Parse the save text to determine advantage/disadvantage
        // Examples: "STR+2", "WIL-1", "Stealth+3", "Athletics-"
        const match = saveText.match(/^(\w+)([+\-]+)(\d*)$/);
        if (match) {
            const [, statName, signs, modifier] = match;
            const plusCount = (signs.match(/\+/g) || []).length;
            const minusCount = (signs.match(/\-/g) || []).length;
            
            let rollMode = "normal";
            let count = 0;
            
            if (plusCount > minusCount) {
                rollMode = "advantage";
                count = plusCount - minusCount;
            } else if (minusCount > plusCount) {
                rollMode = "disadvantage";
                count = minusCount - plusCount;
            }
            
            // Always roll 1d20 for saves, with the parsed modifier
            const diceNotation = modifier ? `1d20+${modifier}` : "1d20";
            emit(eventName, diceNotation, rollMode, count);
        } else {
            // Fallback: just roll 1d20
            emit(eventName, "1d20", "normal");
        }
    };

    const handleSaveButtonRightClick = (event) => {
        event.preventDefault();
        const saveText = event.target.innerText;
        
        // Parse for context menu with 1d20 base
        const match = saveText.match(/^(\w+)([+\-]+)(\d*)$/);
        const diceNotation = match && match[3] ? `1d20+${match[3]}` : "1d20";
        
        show(event, diceNotation, emit, eventName);
    };

    // Handle regular roll buttons
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

    // Handle save buttons
    const saveButtons = document.getElementsByClassName('rollSavesButton');
    Array.from(saveButtons).forEach(button => {
        // Remove existing handlers if they exist
        const existingHandlers = buttonHandlers.get(button);
        if (existingHandlers) {
            button.removeEventListener('click', existingHandlers.click);
            button.removeEventListener('contextmenu', existingHandlers.contextmenu);
        }
        
        // Store new handlers
        const handlers = {
            click: handleSaveButtonClick,
            contextmenu: handleSaveButtonRightClick
        };
        buttonHandlers.set(button, handlers);
        
        // Add new listeners
        button.addEventListener('click', handleSaveButtonClick);
        button.addEventListener('contextmenu', handleSaveButtonRightClick);
    });
}
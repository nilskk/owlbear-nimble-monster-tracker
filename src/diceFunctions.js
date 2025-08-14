import { DiceRoll } from '@dice-roller/rpg-dice-roller';

function rollDiceWithDiceRoller(diceString, rollMode="normal", count=1) {
    const originalDiceString = diceString; // Store the original notation
    
    // Extract dice type and modifier from ORIGINAL string (before conversion)
    const originalDiceTypeMatch = originalDiceString.match(/(\d+)d(\d+)(.*)$/);
    const originalModifier = originalDiceTypeMatch ? originalDiceTypeMatch[3] : '';
    
    diceString = convertDiceString(diceString, rollMode, count);
    const roll = new DiceRoll(diceString);
    const rollResults = roll.rolls[0] ? roll.rolls[0].rolls : [];

    // Extract dice type from converted string for exploding dice logic
    const diceTypeMatch = diceString.match(/(\d+)d(\d+)(.*)$/);
    const diceType = diceTypeMatch ? parseInt(diceTypeMatch[2], 10) : 20;

    // Find the first non-dropped die
    const firstNonDroppedDie = rollResults.length > 0 ? rollResults.find(result => !result.modifierFlags.includes('d')) : null;

    // Create dice objects array
    let diceList = [];
    let explodingDiceList = [];

    if (rollResults.length > 0) {
        diceList = rollResults.map(result => {
            const isMaxValue = result.value === diceType;
            const isPrimary = firstNonDroppedDie && result === firstNonDroppedDie;
            const isExploding = isPrimary && isMaxValue; // Mark primary die as exploding if it's max value
            
            return {
                value: result.value,
                isDropped: result.modifierFlags.includes('d'),
                isPrimary: isPrimary,
                isMaxValue: isMaxValue,
                isMinValue: result.value === 1,
                isExploding: isExploding
            };
        });
    }

    // Check if we need to add exploding dice for the first non-dropped die
    if (firstNonDroppedDie && firstNonDroppedDie.calculationValue === diceType) {
        const explodingRoll = new DiceRoll(`1d${diceType}!`);
        const explodingResults = explodingRoll.rolls[0] ? explodingRoll.rolls[0].rolls : [];
        
        if (explodingResults.length > 0) {
            explodingDiceList = explodingResults.map(result => ({
                value: result.value,
                isDropped: false,
                isPrimary: false,
                isMaxValue: result.value === diceType,
                isMinValue: result.value === 1,
                isExploding: true // All additional exploding dice are marked as exploding
            }));

            // Combine totals
            const combinedTotal = roll.total + explodingRoll.total;
            
            // Insert exploding dice right after the primary die that exploded
            const primaryDieIndex = diceList.findIndex(die => die.isPrimary);
            const allDice = [...diceList];
            if (primaryDieIndex >= 0) {
                // Insert exploding dice after the primary die
                allDice.splice(primaryDieIndex + 1, 0, ...explodingDiceList);
            } else {
                // Fallback: add at the end if primary die not found
                allDice.push(...explodingDiceList);
            }
            
            return {
                total: combinedTotal,
                modifier: originalModifier,
                dice: allDice,
                breakdown: createBreakdownString(allDice, originalModifier),
                originalNotation: originalDiceString,
                rollMode: rollMode,
                count: count
            };
        }
    }

    return {
        total: roll.total,
        modifier: originalModifier,
        dice: diceList,
        breakdown: createBreakdownString(diceList, originalModifier),
        originalNotation: originalDiceString,
        rollMode: rollMode,
        count: count
    };
}

function createBreakdownString(diceList, modifier) {
    const diceValues = diceList.map(die => die.value).join(', ');
    return `[${diceValues}]${modifier}`;
}

function convertDiceString(value, rollMode, count = 1) {
    if (rollMode === 'normal') {
        return value;
    }
    
    // Parse dice notation pattern (e.g., "1d20+5", "2d6", "3d8-2")
    const diceRegex = /^(\d+)d(\d+)(.*)$/;
    const match = value.match(diceRegex);
    
    if (!match) {
        return value; // Return unchanged if no dice pattern found
    }
    
    const numDice = parseInt(match[1], 10);
    const diceType = match[2];
    const modifier = match[3] || '';
    const totalDice = numDice + count;
    
    if (rollMode === 'advantage') {
        return `${totalDice}d${diceType}dl${count}${modifier}`;
    }
    
    if (rollMode === 'disadvantage') {
        return `${totalDice}d${diceType}dh${count}${modifier}`;
    }
    
    return value;
}

export { rollDiceWithDiceRoller }
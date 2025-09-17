import { DiceRoll } from '@dice-roller/rpg-dice-roller';

function rollMinionAttack(diceString, rollMode="normal", count=1, minionCount=1, originalDiceString) {
    console.log('Rolling minion attack');
    
    // Apply minion attack multiplier
    if (minionCount > 1) {
        diceString = multiplyDiceForMinions(diceString, minionCount);
    }
    
    // Extract modifier from original string
    const originalDiceTypeMatch = originalDiceString.match(/(\d+)d(\d+)(.*)$/);
    const originalModifier = originalDiceTypeMatch ? originalDiceTypeMatch[3] : '';
    
    // Convert dice string for advantage/disadvantage
    diceString = convertDiceString(diceString, rollMode, count);
    const roll = new DiceRoll(diceString);
    const rollResults = roll.rolls[0] ? roll.rolls[0].rolls : [];
    
    // Extract dice type
    const diceTypeMatch = diceString.match(/(\d+)d(\d+)(.*)$/);
    const diceType = diceTypeMatch ? parseInt(diceTypeMatch[2], 10) : 20;
    
    // Create dice objects - no primary dice for minions, drop all 1s
    const diceList = rollResults.map(result => {
        const isMaxValue = result.value === diceType;
        let isDropped = result.modifierFlags.includes('d');
        
        // Drop all 1s for minion attacks
        if (result.value === 1 && !isDropped) {
            isDropped = true;
        }
        
        return {
            value: result.value,
            isDropped: isDropped,
            isPrimary: false, // No primary dice for minions
            isMaxValue: isMaxValue,
            isMinValue: result.value === 1,
            isExploding: false // No exploding dice for minions (no crits)
        };
    });
    
    // Calculate total excluding dropped dice
    const nonDroppedDiceTotal = diceList
        .filter(die => !die.isDropped)
        .reduce((sum, die) => sum + die.value, 0);
    
    // Extract numeric modifier
    const modifierValue = originalModifier ? 
        parseInt(originalModifier.replace(/[^-+\d]/g, '')) || 0 : 0;
    
    const finalTotal = nonDroppedDiceTotal + modifierValue;
    
    return {
        total: finalTotal,
        modifier: originalModifier,
        dice: diceList,
        breakdown: createBreakdownString(diceList, originalModifier),
        notation: diceString,
        originalNotation: originalDiceString,
        rollMode: rollMode,
        count: count,
        minionAttack: true,
        minionCount: minionCount
    };
}


function rollDiceWithDiceRoller(diceString, rollMode="normal", count=1, crit=true, minionAttack=false, minionCount=1) {
    console.log('rollDiceWithDiceRoller called with:', { diceString, rollMode, count, crit, minionAttack, minionCount });

    const originalDiceString = diceString; // Store the original notation
    
    // Handle minion attacks with separate function
    if (minionAttack) {
        return rollMinionAttack(diceString, rollMode, count, minionCount, originalDiceString);
    }
    
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
            const isExploding = isPrimary && isMaxValue && crit; // Mark primary die as exploding if it's max value and crit is enabled
            
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
    if (crit && firstNonDroppedDie && firstNonDroppedDie.calculationValue === diceType) {
        const explodingRoll = new DiceRoll(`1d${diceType}!`);
        const explodingResults = explodingRoll.rolls[0] ? explodingRoll.rolls[0].rolls : [];
        
        if (explodingResults.length > 0) {
            explodingDiceList = explodingResults.map(result => ({
                value: result.value,
                isDropped: false, // Exploding dice from crits don't get dropped, even for minions
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
                notation: diceString,
                originalNotation: originalDiceString,
                rollMode: rollMode,
                count: count,
                minionAttack: false, // This path is only for normal attacks
                minionCount: 1
            };
        }
    }

    return {
        total: roll.total,
        modifier: originalModifier,
        dice: diceList,
        breakdown: createBreakdownString(diceList, originalModifier),
        notation: diceString,
        originalNotation: originalDiceString,
        rollMode: rollMode,
        count: count,
        minionAttack: false, // This path is only for normal attacks
        minionCount: 1
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

function multiplyDiceForMinions(diceString, minionCount) {
    console.log('multiplyDiceForMinions called with:', { diceString, minionCount });
    
    // Parse dice notation pattern (e.g., "1d20+5", "2d6", "3d8-2")
    const diceRegex = /^(\d+)d(\d+)(.*)$/;
    const match = diceString.match(diceRegex);
    
    if (!match) {
        console.log('No dice pattern found, returning unchanged');
        return diceString; // Return unchanged if no dice pattern found
    }
    
    const numDice = parseInt(match[1], 10);
    const diceType = match[2];
    const modifier = match[3] || '';
    
    // Multiply the number of dice by the minion count
    const totalDice = numDice * minionCount;
    
    const result = `${totalDice}d${diceType}${modifier}`;
    console.log('Minion multiplication result:', { numDice, diceType, modifier, totalDice, result });
    
    return result;
}

export { rollDiceWithDiceRoller }
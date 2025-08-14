import { DiceRoll } from '@dice-roller/rpg-dice-roller';

function rollDiceWithDiceRoller(diceString, rollMode="normal", count=1) {
    diceString = convertDiceString(diceString, rollMode, count);
    const roll = new DiceRoll(diceString);
    const diceOutput = roll.output;
    
    return processDiceOutput(diceOutput);
}

function processDiceOutput(diceOutput) {
    const splitValues = diceOutput.split(/[:=]/).map(value => value.trim());
    return splitValues;
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
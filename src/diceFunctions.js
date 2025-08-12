import { DiceRoll } from '@dice-roller/rpg-dice-roller';

function rollDiceWithDiceRoller(diceString, rollMode="normal") {
    diceString = convertDiceString(diceString, rollMode);
    const roll = new DiceRoll(diceString);
    const diceOutput = roll.output;
    
    return processDiceOutput(diceOutput);
}

function processDiceOutput(diceOutput) {
    const splitValues = diceOutput.split(/[:=]/).map(value => value.trim());
    return splitValues;
}

function convertDamageToCritRoll(damageString) {
    const diceRegex = /^(\d+)d(\d+)(.*)$/;
    const match = damageString.match(diceRegex);

    if (match) {
        const numDice = parseInt(match[1], 10);
        const diceType = match[2];
        const modifier = match[3] || '';

        // Double the number of dice
        const doubledNumDice = numDice * 2;

        // Reconstruct the dice notation with the doubled number of dice
        const doubledDiceString = `${doubledNumDice}d${diceType}${modifier}`;

        return doubledDiceString;
    }

    return damageString;
}

function convertDiceString(value, rollMode) {
    if (rollMode === 'advantage') {
        return (value.startsWith('+') || value.startsWith('-')) ? `2d20dl1${value}` : convertDamageToCritRoll(value);
    }
    if (rollMode === 'disadvantage') {
        return (value.startsWith('+') || value.startsWith('-')) ? `2d20dh1${value}` : convertDamageToCritRoll(value);
    }
    if (rollMode === 'normal') {
        return (value.startsWith('+') || value.startsWith('-')) ? `1d20${value}` : value;
    }
}

export { rollDiceWithDiceRoller }
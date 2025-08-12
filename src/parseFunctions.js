
function capitalize(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

function removeMatchingElements(array, stringsToMatch) {
    return array.filter(element => !stringsToMatch.includes(element));
}

function handlePipe(value, mode="first") {
    if (value.includes('|')) {
        let parts = value.split('|');
        parts = removeMatchingElements(parts, ['XPHB']);
        if (mode === 'first') return parts[0];
        if (mode === 'last') return parts[parts.length - 1];
    }
    return value;
}

function parseSpecialHp(value) {
    if (typeof value === 'string') {
        const match = value.match(/\d+/);
        return match ? parseInt(match[0], 10) : value;
    }
    return value;
}

function parseSpecialAc(value) {
    if (typeof value === 'string') {
        const match = value.match(/\d+/);
        return match ? parseInt(match[0], 10) : value;
    }
    return value;
}

function parseText(value) {
    if (!value) return value;

    // Regex to match dice notation patterns like 2d12, 1d10+4, 3d6-2, etc.
    const dicePattern = /(\d+d\d+(?:\s*[+\-]\s*\d+)?)/gi;
    
    // Regex to match DC checks like DC 15 WIL, DC 20 STR, etc.
    const dcPattern = /(DC\s+\d+\s+(?:WIL|INT|STR|DEX))/gi;
    
    let result = value;
    
    // Parse markdown formatting first (before dice and DC to avoid conflicts)
    result = parseMarkdown(result);
    
    // Replace dice notation BEFORE game terms to avoid HTML conflicts
    result = result.replace(dicePattern, (match) => {
        return convertDice(match.trim());
    });
    
    // Then replace DC checks
    result = result.replace(dcPattern, (match) => {
        return convertDC(match.trim());
    });
    
    // Add tooltips for game terms LAST to avoid conflicts with HTML
    result = addTooltips(result);
    
    return result;
}

function addTooltips(value) {
    if (!value) return value;
    
    // Define game terms and their explanations
    const gameTerms = {
        'Dominated': 'TBD',
        'Grappled': 'The target\'s speed is reduced to 0 and cannot benefit from any bonus to speed. The condition ends if the grappler is incapacitated.',
        'Paralyzed': 'The target is incapacitated and cannot move or speak. Attack rolls against the target have advantage, and any attack that hits is a critical hit if the attacker is within 5 feet.',
        'Incapacitated': 'The target cannot take actions or reactions.',
        'Blinded': 'The target cannot see and automatically fails ability checks that require sight. Attack rolls against the target have advantage, and the target\'s attack rolls have disadvantage.',
        'Charmed': 'The target cannot attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on social interaction checks with the target.',
        'Frightened': 'The target has disadvantage on ability checks and attack rolls while the source of fear is within line of sight. The target cannot willingly move closer to the source of fear.',
        'Poisoned': 'The target has disadvantage on attack rolls and ability checks.',
        'Prone': 'The target\'s only movement option is to crawl. Attack rolls against the target have advantage if the attacker is within 5 feet, otherwise disadvantage.',
        'Restrained': 'The target\'s speed becomes 0. Attack rolls against the target have advantage, and the target\'s attack rolls have disadvantage.',
        'Stunned': 'The target is incapacitated, cannot move, and can speak only falteringly. Attack rolls against the target have advantage.',
        'Unconscious': 'The target is incapacitated, cannot move or speak, and is unaware of surroundings. Attack rolls against the target have advantage, and any attack that hits is a critical hit if within 5 feet.'
    };
    
    let result = value;
    
    // Replace each game term with a clickable version, but avoid replacing inside HTML tags
    Object.entries(gameTerms).forEach(([term, description]) => {
        // More precise regex that avoids matching inside HTML tags or attributes
        const regex = new RegExp(`(?<!<[^>]*?)\\b(${term})\\b(?![^<]*?>)`, 'gi');
        result = result.replace(regex, (match) => {
            // Escape quotes in description to prevent HTML attribute issues
            const escapedDescription = description.replace(/"/g, '&quot;');
            return `<span class="game-term cursor-pointer underline decoration-dotted decoration-accent font-semibold hover:decoration-solid" data-term="${term}" data-description="${escapedDescription}">${match}</span>`;
        });
    });
    
    return result;
}

function parseMarkdown(value) {
    if (!value) return value;
    
    let result = value;
    
    // Process in order from most specific to least specific to avoid conflicts
    
    // Bold Italic: ***text*** or ___text___ (must be first)
    result = result.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    result = result.replace(/_{3}(.*?)_{3}/g, '<strong><em>$1</em></strong>');
    
    // Bold: **text** or __text__
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/_{2}(.*?)_{2}/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
    result = result.replace(/_(.*?)_/g, '<em>$1</em>');
    
    return result;
}

function convertDice(value) {
    return `<button class="btn btn-xs btn-outline btn-secondary font-bold rollButton">${value}</button>`;
}

function convertDC(value) {
    return `<span class="font-bold text-primary">${value}</span>`;
}

export { parseText, parseMarkdown, addTooltips, capitalize, parseSpecialHp, parseSpecialAc };
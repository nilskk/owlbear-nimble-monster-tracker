
function capitalize(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

function removeMatchingElements(array, stringsToMatch) {
    return array.filter(element => !stringsToMatch.includes(element));
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

function parseSaves(value) {
    if (!value) return value;

    let result = value;

    const savesPattern = /((?:INT|WIL|DEX|STR)[+\-]+)/gi;

    // Replace ability score modifiers
    result = result.replace(savesPattern, (match) => {
        return convertSaves(match.trim());
    });

    return result;
}

function addTooltips(value) {
    if (!value) return value;
    
    // Define game terms and their explanations
    const gameTerms = {
        'Blinded': 'Can’t see. Attacks against you have advantage, and your attacks have disadvantage.',
        'Bloodied': 'At half HP or less.',
        'Charmed': 'Sees the charmer as an ally. Charmer has advantage on social interactions with you.',
        'Dazed': 'Heroes: lose 1 action; monsters: can perform one less action on their next turn.',
        'Dying': 'At 0 HP. Taking damage while dying causes 2 Wounds, a crit causes 3 instead.',
        'Frightened': 'Disadvantage on rolls when source of fear is nearby; speed halved when moving closer to it.',
        'Grappled': 'Cannot move. Attacks against you have advantage.',
        'Restrained': 'Cannot move. Attacks against you have advantage.',
        'Hampered': 'Any creature with their actions or movement reduced (e.g., Dazed, Grappled, Prone, Difficult Terrain).',
        'Incapacitated': 'Can’t do anything. Attacks against you have advantage, and melee attacks that hit, crit.',
        'Invisible': 'Cannot be seen. Your attacks have advantage, and attacks against you have disadvantage.',
        'Petrified': 'Incapacitated. You have all the benefits and drawbacks of being a rock! Immune to most damage',
        'Poisoned': 'Disadvantage on rolls.',
        'Prone': 'Movement costs twice as much, and disadvantage on attacks. Melee attacks against you have advantage; Ranged have disadvantage. Spend 3 spaces of your Speed to stand up.',
        'Riding': 'You move with the creature you are riding. Any attacks that miss you, strike them.',
        'Slowed': 'Speed halved during your next turn.',
        'Taunted': 'Disadvantage on attacks except against the most recent taunter.',
        'Wounded': 'Has any Wounds (typically 6 Wounds and a hero is dead).'
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

function convertSaves(value) {
    return `<button class="btn btn-xs btn-outline btn-secondary font-bold rollSavesButton">${value}</button>`;
}

export { parseText, parseSaves, parseMarkdown, addTooltips, capitalize };
// Settings persistence functions for Owlbear Nimble Monster Tracker

const OBR_SETTINGS_KEY = 'owlbear-nimble-monster-tracker-room-settings';

// Default settings structure
const DEFAULT_SETTINGS = {
    showRollsToPlayers: false
};

/**
 * Load settings from OBR room metadata
 * @param {Object} OBR - The OBR SDK instance
 * @returns {Promise<Object>} Settings object with default fallback
 */
export const loadSettings = async (OBR) => {
    console.log('loadSettings called');
    try {
        console.log('Checking OBR availability:', typeof OBR !== 'undefined');
        if (typeof OBR !== 'undefined' && OBR.room) {
            console.log('OBR.room available, getting metadata...');
            const roomSettings = await OBR.room.getMetadata();
            console.log('Room metadata:', roomSettings);
            
            if (roomSettings && roomSettings[OBR_SETTINGS_KEY]) {
                const settings = roomSettings[OBR_SETTINGS_KEY];
                console.log('Found settings in room:', settings);
                return { ...DEFAULT_SETTINGS, ...settings };
            } else {
                console.log('No settings found in room, using defaults');
            }
        } else {
            console.log('OBR.room not available');
        }
    } catch (error) {
        console.error('Failed to load settings from OBR room:', error);
    }
    console.log('Returning default settings:', DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
};

/**
 * Save settings to OBR room metadata
 * @param {Object} OBR - The OBR SDK instance
 * @param {Object} settings - Settings object to save
 */
export const saveSettings = async (OBR, settings) => {
    console.log('saveSettings called with:', settings);
    try {
        console.log('Checking OBR availability:', typeof OBR !== 'undefined');
        if (typeof OBR !== 'undefined' && OBR.room) {
            console.log('Setting room metadata...');
            await OBR.room.setMetadata({
                [OBR_SETTINGS_KEY]: settings
            });
            console.log('Settings saved to room metadata successfully');
        } else {
            console.log('OBR.room not available for saving');
        }
    } catch (error) {
        console.error('Failed to save settings to OBR room:', error);
    }
};

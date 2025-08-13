import Dexie from 'dexie';
import { db } from './db';

function writeBulkToTable(data) {
    // Ensure all monster objects have the required properties for the database key
    const validatedData = data.map((monster, index) => {
        // Ensure the monster has a name property
        if (!monster.name) {
            console.warn(`Monster at index ${index} is missing 'name' property. Setting default name.`);
            monster.name = `Unknown Monster ${index + 1}`;
        }
        
        // Ensure the monster has a source property
        if (!monster.source) {
            console.warn(`Monster at index ${index} is missing 'source' property. Setting default source.`);
            monster.source = 'Default';
        }
        
        return monster;
    });
    
    return db.bestiary.bulkPut(validatedData).then(function(lastKey) {
        console.log("Done putting monster in indexeddb");
        console.log("Last monsters name and source was: " + lastKey);
        return lastKey;
    }).catch(Dexie.BulkError, function (e) {
        // Explicitly catching the bulkAdd() operation makes those successful
        // additions commit despite that there were errors.
        console.error ("Some monster did not succeed. However, " +
        validatedData.length-e.failures.length + " monster were added successfully");
        console.error("Failed monsters:", e.failures);
        throw e;
    });
}

function clearTable() {
    return db.bestiary.clear().then(function() {
        console.log("Cleared the table");
    });
}

export { writeBulkToTable, clearTable }
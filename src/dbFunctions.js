import Dexie from 'dexie';
import { db } from './db';

function normalizeMonsterRecord(monster, index) {
    const validatedMonster = { ...monster };

    // Ensure the monster has a name property
    if (!validatedMonster.name) {
        console.warn(`Monster at index ${index} is missing 'name' property. Setting default name.`);
        validatedMonster.name = `Unknown Monster ${index + 1}`;
    }

    // Ensure the monster has a source property
    if (!validatedMonster.source) {
        console.warn(`Monster at index ${index} is missing 'source' property. Setting default source.`);
        validatedMonster.source = 'Default';
    }

    return validatedMonster;
}

function writeBulkToTable(data) {
    const validatedData = data.map(normalizeMonsterRecord);
    
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

function exportBestiaryData() {
    return db.bestiary.toArray().then(function(records) {
        return {
            app: 'owlbear-nimble-monster-tracker',
            version: 1,
            exportedAt: new Date().toISOString(),
            bestiary: records,
        };
    });
}

function replaceTable(data) {
    const validatedData = data.map(normalizeMonsterRecord);

    return db.transaction('rw', db.bestiary, async () => {
        await db.bestiary.clear();
        await db.bestiary.bulkPut(validatedData);
        console.log(`Imported ${validatedData.length} monsters into indexeddb`);
        return validatedData.length;
    });
}

function deleteBySource(source) {
    return db.bestiary.where('source').equals(source).delete().then(function(deleteCount) {
        console.log(`Deleted ${deleteCount} monsters from source: ${source}`);
        return deleteCount;
    }).catch(function(error) {
        console.error(`Error deleting monsters from source ${source}:`, error);
        throw error;
    });
}

function deleteByNameAndSource(name, source) {
    return db.bestiary.delete([name, source]).then(function() {
        console.log(`Deleted monster: ${name} from source: ${source}`);
        return true;
    }).catch(function(error) {
        console.error(`Error deleting monster ${name} from source ${source}:`, error);
        throw error;
    });
}

export { writeBulkToTable, clearTable, deleteBySource, deleteByNameAndSource, exportBestiaryData, replaceTable }
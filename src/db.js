import Dexie from 'dexie';

// Define the database schema
let dbname = '';
if (import.meta.env.DEV) {
    dbname = 'nimbleMonsterTrackerDB_DEV';
}
if (import.meta.env.PROD) {
    dbname = 'nimbleMonsterTrackerDB';
}
export const db = new Dexie(dbname);
db.version(1).stores({
    bestiary: '[name+source], [source+name], data', 
});

db.version(2).stores({
    bestiary: '[name+source], [source+name], data',
}).upgrade(tx => {
    // Clear the bestiary table on upgrade
    return tx.table('bestiary').clear();
});

db.version(3).stores({
    bestiary: '[name+source], [source+name], data',
}).upgrade(tx => {
    // Clear the bestiary table on upgrade
    return tx.table('bestiary').clear();
});

db.version(4).stores({
    bestiary: '[name+source], [source+name], data',
}).upgrade(tx => {
    // Clear the bestiary table on upgrade
    return tx.table('bestiary').clear();
});


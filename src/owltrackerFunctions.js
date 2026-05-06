
const OWLTRACKER_ID = 'com.owl-trackers';

function initialize_owltracker_for_token(item,current_hp, max_hp, temp_hp, armor_class) {
    const acMap = { none: 0, medium: 1, heavy: 2 };
    const acValue = acMap[armor_class] ?? armor_class;
    item.metadata[`${OWLTRACKER_ID}/hidden`] = true;
    item.metadata[`${OWLTRACKER_ID}/trackers`] = [];
    item.metadata[`${OWLTRACKER_ID}/trackers`][0] = {
        color: 2,
        id: crypto.randomUUID(),
        max: max_hp,
        name: 'HP',
        value: current_hp,
        variant: 'value-max'
    };
    item.metadata[`${OWLTRACKER_ID}/trackers`][1] = {
        color: 7,
        id: crypto.randomUUID(),
        max: max_hp,
        name: 'Temp HP',
        value: temp_hp,
        variant: 'value'
    };
    item.metadata[`${OWLTRACKER_ID}/trackers`][2] = {
        color: 4,
        id: crypto.randomUUID(),
        max: max_hp,
        name: 'Armor',
        value: acValue,
        variant: 'value'
    };
}

function update_owltracker_hp(item, current_hp, temp_hp) {
    if (!item.metadata[`${OWLTRACKER_ID}/trackers`]) return;

    const hpTracker = item.metadata[`${OWLTRACKER_ID}/trackers`][0];
    const tempHpTracker = item.metadata[`${OWLTRACKER_ID}/trackers`][1];

    if (hpTracker) {
        hpTracker.value = current_hp;
    }

    if (tempHpTracker) {
        tempHpTracker.value = temp_hp;
    }
}

export { OWLTRACKER_ID, initialize_owltracker_for_token, update_owltracker_hp };
## Adding System Support

LMRTFY operates by providing GMs a list of abilities, skills, and saves, and then associating each of these lists with a method on the system's `Actor` class which can be called to roll the correct ability check.

Note that this was originally designed with only dnd5e in mind and some of its core assumptions still show that.

### 1. Add your system to the module.json

`module.json` has a `systems` field which will need your system added to it before LMRTFY can be activated on a world with that system running.

### 2. Add system definitions to `LMRTFY#ready`

Fill out `lmrtfy.js`'s `LMRTFY#ready` method's switch statement with your new system definitions.

```js
case 'dnd5e':
    // which method on the Actor class can roll the appropriate check?
    LMRTFY.saveRollMethod = 'rollAbilitySave';
    LMRTFY.abilityRollMethod = 'rollAbilityTest';
    LMRTFY.skillRollMethod = 'rollSkill';

    // where are the abilities, skills, and saves defined?
    LMRTFY.abilities = CONFIG.DND5E.abilities;
    LMRTFY.skills = CONFIG.DND5E.skills;
    LMRTFY.saves = CONFIG.DND5E.abilities;

    // is there any special keybinding the system might expect for these kinds of rolls
    LMRTFY.normalRollEvent = { shiftKey: true, altKey: false, ctrlKey: false };
    LMRTFY.advantageRollEvent = { shiftKey: false, altKey: true, ctrlKey: false };
    LMRTFY.disadvantageRollEvent = { shiftKey: false, altKey: false, ctrlKey: true };

    // does your system support initiative rolls or deathsaves (as dnd5e understands them)?
    LMRTFY.specialRolls = { 'initiative': true, 'deathsave': true };
    break;
```

### 3. (Maybe Optional) Check `LMRTFYRoller#_makeRoll` signature

There is one other place that system specific code might be needed: `roller.js`'s `LMRTFYRoller#_makeRoll` might need tweaks if your system's methods expect a different call signature than the default.

```js
actor[rollMethod].call(actor, ...args, { event: fakeEvent });
```

> `fakeEvent` is one of `normalRollEvent`, `advantageRollEvent`, or `disadvantageRollEvent` as defined above


### 4. Open a PR

Once everything works how you expect it to, by all means open a PR and we'll get it merged in. Any bugs in this system support will probably be sent your way. Thanks for helping make LMRTFY better! :)
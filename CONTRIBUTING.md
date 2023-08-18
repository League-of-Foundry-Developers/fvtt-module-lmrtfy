## Adding System Support

LMRTFY operates by providing GMs a list of abilities, skills, and saves, and then associating each of these lists with a method on the system's `Actor` class which can be called to roll the correct ability check.

Note that this was originally designed with only dnd5e in mind and some of its core assumptions still show that.

Before you begin, you will need to grab the id of the system you wish to implement. You can always find this in the `system.json` which is located at the root source for every Foundry system.

### 1. Add your system to the module.json

`module.json` has a `systems` field which will need your system id added to it before LMRTFY can be activated on a world with that system running.

### 2. Create a new lmrtfy_RollProvider in the src folder
You will need to create a new `lmrtfy_RollProvider_???.js` in the `src` folder. Make sure it `extends lmrtfy_RollProvider`.

You must override `systemIdentifiers()` with the id name of your system. You can find this id in the `system.json` for your specific system.
Override any of the other methods that are in `lmrtfy_RollProvider` that are necessary to your system's implementation. At the very least you must implement one of the following:
 - `abilities`
 - `saves`
 - `skills`
You must also override the corresponding method names (`rollAbility` for `abilities`).

Most other methods are not needing an override unless its specific to your specific system.

### 3. Add your RollProvider to the LMRTFY#ready

Add your system as another roll provider under `var externalRollProviders`.

### 4. Open a PR

Once everything works how you expect it to, by all means open a PR and we'll get it merged in. Any bugs in this system support will probably be sent your way. Thanks for helping make LMRTFY better! :)
class LMRTFY {
    static async init() {
        game.settings.register('lmrtfy', 'enableParchmentTheme', {
            name: game.i18n.localize('LMRTFY.EnableParchmentTheme'),
            hint: game.i18n.localize('LMRTFY.EnableParchmentThemeHint'),
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => LMRTFY.onThemeChange(value)
        });
        game.settings.register('lmrtfy', 'deselectOnRequestorRender', {
            name: game.i18n.localize('LMRTFY.DeselectOnRequestorRender'),
            hint: game.i18n.localize('LMRTFY.DeselectOnRequestorRenderHint'),
            scope: 'world',
            config: true,
            type: Boolean,
            default: false,
            onChange: () => window.location.reload()
        });
        game.settings.register('lmrtfy', 'useTokenImageOnRequester', {
            name: game.i18n.localize('LMRTFY.UseTokenImageOnRequester'),
            hint: game.i18n.localize('LMRTFY.UseTokenImageOnRequesterHint'),
            scope: 'world',
            config: true,
            type: Boolean,
            default: false,
            onChange: () => window.location.reload()
        });

        var showFailButtonSetting = false;
        if (game.system.id === 'dnd5e') {
            showFailButtonSetting = true;
        }
        game.settings.register('lmrtfy', 'showFailButtons', {
            name: game.i18n.localize('LMRTFY.ShowFailButtons'),
            hint: game.i18n.localize('LMRTFY.ShowFailButtonsHint'),
            scope: 'world',
            config: showFailButtonSetting,
            type: Boolean,
            default: showFailButtonSetting, // if it's DnD 5e default to true
            onChange: () => window.location.reload()
        });

        Handlebars.registerHelper('lmrtfy-controlledToken', function (actor) {
            const actorsControlledToken = canvas.tokens?.controlled.find(t => t.actor.id === actor.id);
            if (actorsControlledToken) {
                return true;
            } else {
                return false;
            }
        });

        Handlebars.registerHelper('lmrtfy-showTokenImage', function (actor) {
            if (game.settings.get('lmrtfy', 'useTokenImageOnRequester')) {
                return true;
            } else {
                return false;
            }
        });

        Handlebars.registerHelper('lmrtfy-isdemonlord', function (actor) {
            if (game.system.id === 'demonlord') {
                return true;
            } else {
                return false;
            }
        });

    }

    static ready() {
        game.socket.on('module.lmrtfy', LMRTFY.onMessage);

        switch (game.system.id) {
            case 'dnd5eJP':
            case 'dnd5e':
            case 'sw5e':
                LMRTFY.saveRollMethod = 'rollAbilitySave';
                LMRTFY.abilityRollMethod = 'rollAbilityTest';
                LMRTFY.skillRollMethod = 'rollSkill';
                LMRTFY.abilities = LMRTFY.create5eAbilities();
                LMRTFY.skills = CONFIG.DND5E.skills;
                LMRTFY.saves = LMRTFY.create5eAbilities();
                LMRTFY.normalRollEvent = { shiftKey: true, altKey: false, ctrlKey: false };
                LMRTFY.advantageRollEvent = { shiftKey: false, altKey: true, ctrlKey: false };
                LMRTFY.disadvantageRollEvent = { shiftKey: false, altKey: false, ctrlKey: true };
                LMRTFY.specialRolls = { 'initiative': true, 'deathsave': true };
                LMRTFY.abilityAbbreviations = LMRTFY.create5eAbilities();
                LMRTFY.modIdentifier = 'mod';
                LMRTFY.abilityModifiers = LMRTFY.parseAbilityModifiers();
                LMRTFY.canFailChecks = game.settings.get('lmrtfy', 'showFailButtons');
                break;

            case 'pf1':
                LMRTFY.saveRollMethod = 'rollSavingThrow';
                LMRTFY.abilityRollMethod = 'rollAbility';
                LMRTFY.skillRollMethod = 'rollSkill';
                LMRTFY.abilities = CONFIG.PF1.abilities;
                LMRTFY.skills = CONFIG.PF1.skills;
                LMRTFY.saves = CONFIG.PF1.savingThrows;
                LMRTFY.normalRollEvent = { shiftKey: false, altKey: false, ctrlKey: false };
                LMRTFY.advantageRollEvent = { shiftKey: false, altKey: true, ctrlKey: false };
                LMRTFY.disadvantageRollEvent = { shiftKey: false, altKey: false, ctrlKey: true };
                LMRTFY.specialRolls = { 'initiative': true, 'deathsave': false, 'perception': false };
                LMRTFY.abilityAbbreviations = CONFIG.PF1.abilitiesShort;
                LMRTFY.modIdentifier = 'mod';
                LMRTFY.abilityModifiers = LMRTFY.parseAbilityModifiers();
                LMRTFY.canFailChecks = game.settings.get('lmrtfy', 'showFailButtons'); // defaulted to false due to system
                break;

            case 'pf2e':
                LMRTFY.saveRollMethod = 'rollSave';
                LMRTFY.abilityRollMethod = 'rollAbility';
                LMRTFY.skillRollMethod = 'rollSkill';
                LMRTFY.abilities = CONFIG.PF2E.abilities;
                LMRTFY.skills = CONFIG.PF2E.skills;
                LMRTFY.saves = CONFIG.PF2E.saves;
                LMRTFY.normalRollEvent = { shiftKey: false, altKey: false, ctrlKey: false };
                LMRTFY.advantageRollEvent = { shiftKey: false, altKey: true, ctrlKey: false };
                LMRTFY.disadvantageRollEvent = { shiftKey: false, altKey: false, ctrlKey: true };
                LMRTFY.specialRolls = { 'initiative': true, 'deathsave': true, 'perception': true };
                LMRTFY.abilityAbbreviations = CONFIG.PF2E.abilities;
                LMRTFY.modIdentifier = 'mod';
                LMRTFY.abilityModifiers = LMRTFY.parseAbilityModifiers();
                LMRTFY.canFailChecks = game.settings.get('lmrtfy', 'showFailButtons'); // defaulted to false due to system
                break;

            case 'D35E':
                LMRTFY.saveRollMethod = 'rollSave';
                LMRTFY.abilityRollMethod = 'rollAbility';
                LMRTFY.skillRollMethod = 'rollSkill';
                LMRTFY.abilities = CONFIG.D35E.abilities;
                LMRTFY.skills = CONFIG.D35E.skills;
                LMRTFY.saves = CONFIG.D35E.savingThrows;
                LMRTFY.normalRollEvent = { shiftKey: false, altKey: false, ctrlKey: false };
                LMRTFY.advantageRollEvent = { shiftKey: false, altKey: true, ctrlKey: false };
                LMRTFY.disadvantageRollEvent = { shiftKey: false, altKey: false, ctrlKey: true };
                LMRTFY.specialRolls = { 'initiative': true, 'deathsave': false, 'perception': true };
                LMRTFY.abilityAbbreviations = CONFIG.D35E.abilityAbbreviations;
                LMRTFY.modIdentifier = 'mod';
                LMRTFY.abilityModifiers = LMRTFY.parseAbilityModifiers();
                LMRTFY.canFailChecks = game.settings.get('lmrtfy', 'showFailButtons'); // defaulted to false due to system
                break;

            case 'cof':
                LMRTFY.saveRollMethod = 'rollStat';
                LMRTFY.abilityRollMethod = 'rollStat';
                LMRTFY.skillRollMethod = 'rollStat';
                LMRTFY.abilities = CONFIG.COF.stats;
                LMRTFY.skills = CONFIG.COF.skills;
                LMRTFY.normalRollEvent = { shiftKey: false, altKey: false, ctrlKey: false };
                LMRTFY.advantageRollEvent = { shiftKey: false, altKey: false, ctrlKey: false };
                LMRTFY.disadvantageRollEvent = { shiftKey: false, altKey: false, ctrlKey: false };
                LMRTFY.specialRolls = {};
                LMRTFY.abilityAbbreviations = CONFIG.COF.statAbbreviations;
                LMRTFY.modIdentifier = 'mod';
                LMRTFY.abilityModifiers = LMRTFY.parseAbilityModifiers();
                LMRTFY.canFailChecks = game.settings.get('lmrtfy', 'showFailButtons'); // defaulted to false due to system
                break;

            case 'coc':
                LMRTFY.saveRollMethod = 'rollStat';
                LMRTFY.abilityRollMethod = 'rollStat';
                LMRTFY.skillRollMethod = 'rollStat';
                LMRTFY.abilities = CONFIG.COC.stats;
                LMRTFY.skills = CONFIG.COC.skills;
                LMRTFY.normalRollEvent = { shiftKey: false, altKey: false, ctrlKey: false };
                LMRTFY.advantageRollEvent = { shiftKey: false, altKey: false, ctrlKey: false };
                LMRTFY.disadvantageRollEvent = { shiftKey: false, altKey: false, ctrlKey: false };
                LMRTFY.specialRolls = {};
                LMRTFY.abilityAbbreviations = CONFIG.COC.statAbbreviations;
                LMRTFY.modIdentifier = 'mod';
                LMRTFY.abilityModifiers = LMRTFY.parseAbilityModifiers();
                LMRTFY.canFailChecks = game.settings.get('lmrtfy', 'showFailButtons'); // defaulted to false due to system
            break;

            case 'demonlord':
                const abilities = duplicate(CONFIG.DL.attributes);
                delete abilities.defense;
                LMRTFY.saveRollMethod = 'rollChallenge';
                LMRTFY.abilityRollMethod = 'rollChallenge';
                LMRTFY.skillRollMethod = 'rollChallenge';
                LMRTFY.abilities = abilities;
                LMRTFY.skills = {};
                LMRTFY.saves = {};
                LMRTFY.normalRollEvent = {};
                LMRTFY.advantageRollEvent = {};
                LMRTFY.disadvantageRollEvent = {};
                LMRTFY.specialRolls = { 'initiative': true };
                LMRTFY.abilityAbbreviations = abilities;
                LMRTFY.modIdentifier = 'modifier';
                LMRTFY.abilityModifiers = {};
                LMRTFY.canFailChecks = game.settings.get('lmrtfy', 'showFailButtons'); // defaulted to false due to system
                break;

            case 'ose':
                LMRTFY.saveRollMethod = 'rollSave';
                LMRTFY.abilityRollMethod = 'rollCheck';
                LMRTFY.skillRollMethod = 'rollExploration';
                LMRTFY.abilities = CONFIG.OSE.scores;
                LMRTFY.abilityAbbreviations = CONFIG.OSE.scores_short;
                LMRTFY.skills = CONFIG.OSE.exploration_skills;
                LMRTFY.saves = CONFIG.OSE.saves_long;
                LMRTFY.normalRollEvent = {};
                LMRTFY.advantageRollEvent = {};
                LMRTFY.disadvantageRollEvent = {};
                LMRTFY.modIdentifier = 'mod';
                LMRTFY.abilityModifiers = LMRTFY.parseAbilityModifiers();
                LMRTFY.specialRolls = {};
                LMRTFY.modIdentifier = 'modifier';
                LMRTFY.abilityModifiers = {};
                LMRTFY.canFailChecks = game.settings.get('lmrtfy', 'showFailButtons'); // defaulted to false due to system
                break;
            
            case 'foundry-chromatic-dungeons':
                LMRTFY.saveRollMethod = 'saveRoll';
                LMRTFY.abilityRollMethod = 'attributeRoll';
                LMRTFY.skillRollMethod = null;
                LMRTFY.abilities = CONFIG.CHROMATIC.attributeLabels;
                LMRTFY.abilityAbbreviations = CONFIG.CHROMATIC.attributeAbbreviations;
                LMRTFY.skills = {};
                LMRTFY.saves = CONFIG.CHROMATIC.saves;
                LMRTFY.specialRolls = {};
                LMRTFY.canFailChecks = game.settings.get('lmrtfy', 'showFailButtons'); // defaulted to false due to system
                break;
                
            case 'degenesis':
                LMRTFY.skillRollMethod = 'rollSkill';

                let skills = game.actors.contents[0].skills;
                for (const [key, value] of Object.entries(skills)) {
                    skills[key]["label"] = key;
                    skills[key]["ability"] = value.attribute;
                }
                LMRTFY.skills = skills;

                LMRTFY.abilityModifiers = LMRTFY.parseAbilityModifiers();
                LMRTFY.canFailChecks = game.settings.get('lmrtfy', 'showFailButtons'); // defaulted to false due to system
                break;
                
            case 'ffd20':
                LMRTFY.saveRollMethod = 'rollSavingThrow';
                LMRTFY.abilityRollMethod = 'rollAbilityTest';
                LMRTFY.skillRollMethod = 'rollSkill';
                LMRTFY.abilities = CONFIG.FFD20.abilities;
                LMRTFY.skills = CONFIG.FFD20.skills;
                LMRTFY.saves = CONFIG.FFD20.savingThrows;
                LMRTFY.normalRollEvent = { shiftKey: false, altKey: false, ctrlKey: false };
                LMRTFY.specialRolls = { 'initiative': true, 'deathsave': false, 'perception': false };
                LMRTFY.abilityAbbreviations = CONFIG.abilitiesShort;
                LMRTFY.modIdentifier = 'mod';
                LMRTFY.abilityModifiers = LMRTFY.parseAbilityModifiers();
                LMRTFY.canFailChecks = game.settings.get('lmrtfy', 'showFailButtons'); // defaulted to false due to system
                break;

            default:
                console.error('LMRFTY | Unsupported system detected');

        }

        // overwrite for the dnd5e system, unsure if other 5e systems does this too
        if (game.system.id === "dnd5e") {
            LMRTFY.normalRollEvent = { fastForward: true };
            LMRTFY.advantageRollEvent = { advantage: true, fastForward: true };
            LMRTFY.disadvantageRollEvent = { disadvantage: true, fastForward: true };
        }

        LMRTFY.d20Svg = '<svg class="lmrtfy-dice-svg-normal" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"' +
            'viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">' +
            '<g transform="translate(-246.69456,-375.66745)">' +
                '<path d="M278.2,382.1c-0.1,0-0.2,0-0.3,0.1L264.8,398c-0.2,0.3-0.2,0.3,0.1,0.3l26.4-0.1c0.4,0,0.4,0,0.1-0.3l-13-15.8' +
                'C278.4,382.1,278.3,382.1,278.2,382.1L278.2,382.1z M280.7,383.5l11.9,14.5c0.2,0.2,0.2,0.2,0.5,0.1l6.3-2.9' +
                'c0.4-0.2,0.4-0.2,0.1-0.4L280.7,383.5z M275.2,384c0,0-0.1,0.1-0.3,0.2l-17.3,11.4l5.4,2.5c0.3,0.1,0.4,0.1,0.5-0.1l11.4-13.6' +
                'C275.1,384.1,275.2,384,275.2,384L275.2,384z M300.3,395.8c-0.1,0-0.1,0-0.3,0.1l-6.4,2.9c-0.2,0.1-0.2,0.2-0.1,0.4l7.5,19' +
                'l-0.5-22.1C300.4,395.9,300.4,395.8,300.3,395.8L300.3,395.8z M257.1,396.4l-0.7,21.5l6.3-18.6c0.1-0.3,0.1-0.3-0.1-0.4' +
                'L257.1,396.4L257.1,396.4z M291.6,399.2l-27,0.1c-0.4,0-0.4,0-0.2,0.3l13.7,23.1c0.2,0.4,0.2,0.3,0.4,0l13.2-23.2' +
                'C291.9,399.3,291.9,399.2,291.6,399.2L291.6,399.2z M292.7,399.8c0,0-0.1,0.1-0.1,0.2l-13.3,23.3c-0.1,0.2-0.2,0.3,0.2,0.3' +
                'l21.1-2.9c0.3-0.1,0.3-0.2,0.2-0.5l-7.9-20.2C292.7,399.9,292.7,399.8,292.7,399.8L292.7,399.8z M263.6,400c0,0,0,0.1-0.1,0.3' +
                'l-6.7,19.8c-0.1,0.4-0.1,0.6,0.3,0.7l20.1,2.9c0.4,0.1,0.3-0.1,0.2-0.3l-13.7-23.1C263.6,400,263.6,400,263.6,400L263.6,400z' +
                'M258.3,421.9l19.7,11.2c0.3,0.2,0.3,0.1,0.3-0.2l-0.4-7.9c0-0.3,0-0.4-0.3-0.4L258.3,421.9L258.3,421.9z M299.1,421.9l-20,2.8' +
                'c-0.3,0-0.2,0.2-0.2,0.4l0.4,8c0,0.2,0,0.3,0.3,0.2L299.1,421.9z"/>' +
            '</g>' +
        '</svg>';

        // for now we don't allow can fails until midi-qol has update patching.js
        if (game.modules.get("midi-qol")?.active && !isNewerVersion(game.modules.get("midi-qol")?.version, "10.0.26")) {
            LMRTFY.canFailChecks = false;
        }

        if (game.settings.get('lmrtfy', 'deselectOnRequestorRender')) {
            Hooks.on("renderLMRTFYRequestor", () => {
                canvas.tokens.releaseAll();
            })
        }
    }

    static parseAbilityModifiers() {
        let abilityMods = {};

        for (let key in LMRTFY.abilities) {
            if (LMRTFY.abilityAbbreviations?.hasOwnProperty(key)) {
                abilityMods[`abilities.${game.i18n.localize(LMRTFY.abilityAbbreviations[key])}.${LMRTFY.modIdentifier}`] = game.i18n.localize(LMRTFY.abilities[key]);
            }
        }

        if (
            game.system.id === 'dnd5eJP' ||
            game.system.id === 'dnd5e' ||
            game.system.id === 'sw5e'
        ) {
            abilityMods['attributes.prof'] = 'DND5E.Proficiency';
        }

        return abilityMods;
    }
    
    static create5eAbilities() {
        let abbr = {};
        
        for (let key in CONFIG.DND5E.abilities) { 
            let abb = game.i18n.localize(CONFIG.DND5E.abilities[key].abbreviation);
            let upperFirstLetter = abb.charAt(0).toUpperCase() + abb.slice(1);
            abbr[`${abb}`] = `DND5E.Ability${upperFirstLetter}`;
        }

        return abbr;
    }

    static onMessage(data) {
        //console.log("LMRTF got message: ", data)
        if (data.user === "character" &&
            (!game.user.character || !data.actors.includes(game.user.character.id))) {
            return;
        } else if (!["character", "tokens"].includes(data.user) && data.user !== game.user.id) {
            return;
        }
        
        let actors = [];
        if (data.user === "character") {
            actors = [game.user.character];
        } else if (data.user === "tokens") {
            actors = canvas.tokens.controlled.map(t => t.actor).filter(a => data.actors.includes(a.id));
        } else {
            actors = data.actors.map(aid => LMRTFY.fromUuid(aid));
        }
        actors = actors.filter(a => a);
        
        // remove player characters from GM's requests
        if (game.user.isGM) {
            actors = actors.filter(a => !a.hasPlayerOwner);
        }        
        if (actors.length === 0) return;
        new LMRTFYRoller(actors, data).render(true);
    }
    static requestRoll() {
        if (LMRTFY.requestor === undefined)
            LMRTFY.requestor = new LMRTFYRequestor();
        LMRTFY.requestor.render(true);
    }

    static onThemeChange(enabled) {
        $(".lmrtfy.lmrtfy-requestor,.lmrtfy.lmrtfy-roller").toggleClass("lmrtfy-parchment", enabled)
        if (!LMRTFY.requestor) return;
        if (enabled)
            LMRTFY.requestor.options.classes.push("lmrtfy-parchment")
        else
            LMRTFY.requestor.options.classes = LMRTFY.requestor.options.classes.filter(c => c !== "lmrtfy-parchment")
        // Resize to fit the new theme
        if (LMRTFY.requestor.element.length)
            LMRTFY.requestor.setPosition({ width: "auto", height: "auto" })
    }

    static getSceneControlButtons(buttons) {
        let tokenButton = buttons.find(b => b.name == "token")

        if (tokenButton) {
            tokenButton.tools.push({
                name: "request-roll",
                title: game.i18n.localize('LMRTFY.ControlTitle'),
                icon: "fas fa-dice-d20",
                visible: game.user.isGM,
                onClick: () => LMRTFY.requestRoll(),
                button: true
            });
        }
    }

    static buildAbilityModifier(actor, ability) {
        const modifiers = [];

        const mod = game.pf2e.AbilityModifier.fromScore(ability, actor.data.data.abilities[ability].value);
        modifiers.push(mod);

        [`${ability}-based`, 'ability-check', 'all'].forEach((key) => {
            (actor.synthetics.statisticsModifier[key] || []).forEach((m) => modifiers.push(m.clone()));
        });
        
        return new game.pf2e.StatisticModifier(`${game.i18n.localize('LMRTFY.AbilityCheck')} ${game.i18n.localize(mod.label)}`, modifiers);
    }

    static async hideBlind(app, html, msg) {
        if (msg.message.flags && msg.message.flags.lmrtfy) {
            if (msg.message.flags.lmrtfy.blind && !game.user.isGM) {
                msg.content = '<p>??</p>';

                let idx = html[0].innerHTML.indexOf('<div class="message-content">');
                html[0].innerHTML = html[0].innerHTML.substring(0, idx);
                html[0].innerHTML += `<div class="message-content">${msg.content}</div>`;
            }
        }
    }

    static fromUuid(uuid) {
        let parts = uuid.split(".");
        let doc;

        if (parts.length === 1) return game.actors.get(uuid);
        // Compendium Documents
        if (parts[0] === "Compendium") {
            return undefined;
        }

        // World Documents
        else {
            const [docName, docId] = parts.slice(0, 2);
            parts = parts.slice(2);
            const collection = CONFIG[docName].collection.instance;
            doc = collection.get(docId);
        }

        // Embedded Documents
        while (parts.length > 1) {
            const [embeddedName, embeddedId] = parts.slice(0, 2);
            doc = doc.getEmbeddedDocument(embeddedName, embeddedId);
            parts = parts.slice(2);
        }
        if (doc.actor) doc = doc.actor;
        return doc || undefined;
    }
}

globalThis.LMRTFYRequestRoll = LMRTFY.requestRoll;

Hooks.once('init', LMRTFY.init);
Hooks.on('ready', LMRTFY.ready);
Hooks.on('getSceneControlButtons', LMRTFY.getSceneControlButtons);
Hooks.on('renderChatMessage', LMRTFY.hideBlind);

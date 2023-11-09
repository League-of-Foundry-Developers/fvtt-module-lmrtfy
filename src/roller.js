class LMRTFYRoller extends Application {

    constructor(actors, data) {
        super();
        this.actors = actors;
        this.data = data;
        this.abilities = data.abilities;
        this.saves = data.saves;
        this.skills = data.skills;
        this.advantage = data.advantage;
        this.mode = data.mode;
        this.message = data.message;
        this.tables = data.tables;
        this.chooseOne = data.chooseOne ?? false;

        if (game.system.id === 'pf2e') {
            this.dc = data.dc;
            this.pf2Roll = '';
        }

        if (game.system.id === 'demonlord') {
            this.BBDice = data.BBDice;
            this.AddMod = data.AddMod;
        }

        if (data.title) {
            this.options.title = data.title;
        }

        this.pf2eRollFor = {
            ABILITY: "ability",
            SAVE: "save",
            SKILL: "skill",
            PERCEPTION: "perception",
        }

        this.hasMidi = game.modules.get("midi-qol")?.active;
        this.midiUseNewRoller = isNewerVersion(game.modules.get("midi-qol")?.version, "10.0.26");

        Handlebars.registerHelper('canFailAbilityChecks', function (name, ability) {
            if (LMRTFY.canFailChecks) {
                return `<div>` +
                        `<button type="button" class="lmrtfy-ability-check-fail" data-ability="${ability}" disabled>${game.i18n.localize('LMRTFY.AbilityCheckFail')} ${game.i18n.localize(name)}</button>` +
                        `<div class="lmrtfy-dice-tray-button enable-lmrtfy-ability-check-fail" data-ability="${ability}" title="${game.i18n.localize('LMRTFY.EnableChooseFail')}">` +            
                            `${LMRTFY.d20Svg}` +
                        `</div>` +
                    `</div>`;
            } else {
                return '';
            }
        });

        Handlebars.registerHelper('canFailSaveChecks', function (name, ability) {
            if (LMRTFY.canFailChecks) {
                return `<div>` +
                        `<button type="button" class="lmrtfy-ability-save-fail" data-ability="${ability}" disabled>${game.i18n.localize('LMRTFY.SavingThrowFail')} ${game.i18n.localize(name)}</button>` +
                        `<div class="lmrtfy-dice-tray-button enable-lmrtfy-ability-save-fail" data-ability="${ability}" title="${game.i18n.localize('LMRTFY.EnableChooseFail')}">` +            
                            `${LMRTFY.d20Svg}` +
                        `</div>` +
                    `</div>`;
            } else {
                return '';
            }
        });

        Handlebars.registerHelper('canFailSkillChecks', function (name, skill) {
            if (LMRTFY.canFailChecks) {
                return `<div>` +
                        `<button type="button" class="lmrtfy-skill-check-fail" data-skill="${skill}" disabled>${game.i18n.localize('LMRTFY.SkillCheckFail')} ${game.i18n.localize(name)}</button>` +
                        `<div class="lmrtfy-dice-tray-button enable-lmrtfy-skill-check-fail" data-skill="${skill}" title="${game.i18n.localize('LMRTFY.EnableChooseFail')}">` +            
                            `${LMRTFY.d20Svg}` +
                        `</div>` +
                    `</div>`;
            } else {
                return '';
            }
        });
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = game.i18n.localize("LMRTFY.Title");
        options.template = "modules/lmrtfy/templates/roller.html";
        options.popOut = true;
        options.width = 400;
        options.height = "auto";
        options.classes = ["lmrtfy", "lmrtfy-roller"];
        if (game.settings.get('lmrtfy', 'enableParchmentTheme')) {
          options.classes.push('lmrtfy-parchment');
        }
        return options;
    }

    static requestAbilityChecks(actor, abilities, options={}) {
        if (!actor || !abilities) return;
        if (typeof(abilities) === "string") abilities = [abilities];
        const data = mergeObject(options, {
            abilities: [],
            saves: [],
            skills: []
        }, {inplace: false});
        data.abilities = abilities;
        new LMRTFYRoller([actor], data).render(true);
    }
    static requestSkillChecks(actor, skills, options={}) {
        if (!actor || !skills) return;
        if (typeof(skills) === "string") skills = [skills];
        const data = mergeObject(options, {
            abilities: [],
            saves: [],
            skills: []
        }, {inplace: false});
        data.skills = skills;
        new LMRTFYRoller([actor], data).render(true);
    }
    static requestSavingThrows(actor, saves, options={}) {
        if (!actor || !saves) return;
        if (typeof(saves) === "string") saves = [saves];
        const data = mergeObject(options, {
            abilities: [],
            saves: [],
            skills: []
        }, {inplace: false});
        data.saves = saves;
        new LMRTFYRoller([actor], data).render(true);
    }

    async getData() {
        let note = ""
        if (this.advantage == 1)
            note = (game.system.id === 'demonlord') ? game.i18n.localize("LMRTFY.DemonLordBoonsNote") : game.i18n.localize("LMRTFY.AdvantageNote");
        else if (this.advantage == -1)
            note = (game.system.id === 'demonlord') ? game.i18n.localize("LMRTFY.DemonLordBanesNote") : game.i18n.localize("LMRTFY.DisadvantageNote");

        let abilities = {}
        let saves = {}
        let skills = {}
        this.abilities.forEach(a => abilities[a] = LMRTFY.abilities[a])
        this.saves.forEach(a => saves[a] = LMRTFY.saves[a])
        this.skills
            .sort((a, b) => {
                const skillA = (LMRTFY.skills[a]?.label) ? LMRTFY.skills[a].label : LMRTFY.skills[a];
                const skillB = (LMRTFY.skills[b]?.label) ? LMRTFY.skills[b].label : LMRTFY.skills[b];
                game.i18n.localize(skillA).localeCompare(skillB)
            })
            .forEach(s => {
                const skill = (LMRTFY.skills[s]?.label) ? LMRTFY.skills[s].label : LMRTFY.skills[s];
                skills[s] = skill;
            });

        const data = {
            actors: this.actors,
            abilities: abilities,
            saves: saves,
            skills: skills,
            note: note,
            message: this.message,
            customFormula: this.data.formula || false,
            deathsave: this.data.deathsave,
            initiative: this.data.initiative,
            perception: this.data.perception,
            tables: this.tables,
            chooseOne: this.chooseOne,
        };

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.element.find(".lmrtfy-ability-check").click(this._onAbilityCheck.bind(this))
        this.element.find(".lmrtfy-ability-save").click(this._onAbilitySave.bind(this))
        this.element.find(".lmrtfy-skill-check").click(this._onSkillCheck.bind(this))
        this.element.find(".lmrtfy-custom-formula").click(this._onCustomFormula.bind(this))
        this.element.find(".lmrtfy-roll-table").click(this._onRollTable.bind(this));
        if(LMRTFY.specialRolls['initiative']) {
            this.element.find(".lmrtfy-initiative").click(this._onInitiative.bind(this))
        }
        if(LMRTFY.specialRolls['deathsave']) {
            this.element.find(".lmrtfy-death-save").click(this._onDeathSave.bind(this))
        }
        if(LMRTFY.specialRolls['perception']) {
            this.element.find(".lmrtfy-perception").click(this._onPerception.bind(this))
        }

        this.element.find(".enable-lmrtfy-ability-check-fail").click(this._onToggleFailAbilityRoll.bind(this));
        this.element.find(".lmrtfy-ability-check-fail").click(this._onFailAbilityCheck.bind(this));        
        
        this.element.find(".enable-lmrtfy-ability-save-fail").click(this._onToggleFailSaveRoll.bind(this));
        this.element.find(".lmrtfy-ability-save-fail").click(this._onFailAbilitySave.bind(this));    

        this.element.find(".enable-lmrtfy-skill-check-fail").click(this._onToggleFailSkillRoll.bind(this));
        this.element.find(".lmrtfy-skill-check-fail").click(this._onFailSkillCheck.bind(this));    
    }

    _checkClose() {
        if (this.element.find("button").filter((i, e) => !e.disabled).length === 0 || this.chooseOne) {
            this.close();
        }
    }

    _disableButtons(event) {
        event.currentTarget.disabled = true;

        if (LMRTFY.canFailChecks) {
            const buttonSelector = `${event.currentTarget.className}`;
            let oppositeSelector = "";
            let dataSelector = "";

            if (
                event.currentTarget.className.indexOf('ability-check') > 0 || 
                event.currentTarget.className.indexOf('ability-save') > 0
            ) {
                dataSelector = `[data-ability *= '${event?.currentTarget?.dataset?.ability}']`;
            } else {
                dataSelector = `[data-skill *= '${event?.currentTarget?.dataset?.skill}']`;
            }

            if (event.currentTarget.className.indexOf('fail') > 0) {
                oppositeSelector = event.currentTarget.className.substring(0, event.currentTarget.className.indexOf('fail') - 1);
            } else {
                oppositeSelector = `${event.currentTarget.className}-fail`;            
            }

            const enableButton = document.querySelector(`.enable-${buttonSelector}${dataSelector}`);
            if (enableButton) {
                enableButton.disabled = true;
                enableButton.classList.add('disabled-button');
            }

            const oppositeButton = document.querySelector(`.${oppositeSelector}${dataSelector}`);
            if (oppositeButton) oppositeButton.disabled = true;
        }
    }

    _getRollOptions(event, failRoll) {
        let options;
        switch(this.advantage) {
            case -1:
                options = {... LMRTFY.disadvantageRollEvent };
                break;
            case 0:
                options = {... LMRTFY.normalRollEvent };
                break;
            case 1:
                options = {... LMRTFY.advantageRollEvent };
                break;
            case 2:
                options = { event: event };
                break;
        }

        if (failRoll) {
            options["parts"] = [-100];
        }

        return options;
    }

    async _makeRoll(event, rollMethod, failRoll, ...args) {
        let options = this._getRollOptions(event, failRoll);                

        // save the current roll mode to reset it after this roll
        const rollMode = game.settings.get("core", "rollMode");
        game.settings.set("core", "rollMode", this.mode || CONST.DICE_ROLL_MODES);

        for (let actor of this.actors) {
            Hooks.once("preCreateChatMessage", this._tagMessage.bind(this));

            // system specific roll handling
            switch (game.system.id) {
                case "pf2e": {
                    switch (this.pf2Roll) {
                        case this.pf2eRollFor.ABILITY:
                            const modifier = LMRTFY.buildAbilityModifier(actor, args[0]);
                            game.pf2e.Check.roll(modifier, { type: 'skill-check', dc: this.dc, actor }, event);
                            break;

                        case this.pf2eRollFor.SAVE:
                            const save = actor.saves[args[0]].check;
                            const saveOptions = actor.getRollOptions(['all', `${save.ability}-based`, 'saving-throw', save.name]);
                            save.roll({ event, saveOptions, dc: this.dc });
                            break;

                        case this.pf2eRollFor.SKILL:
                            // system specific roll handling
                            const skill = actor.system.skills[args[0]];
                            // roll lore skills only for actors who have them ...
                            if (!skill) continue;

                            const skillOptions = actor.getRollOptions(['all', `${skill.ability ?? 'int'}-based`, 'skill-check', skill.name]);
                            skill.roll({ event, skillOptions, dc: this.dc });
                            break;

                        case this.pf2eRollFor.PERCEPTION:
                            const precOptions = actor.getRollOptions(['all', 'wis-based', 'perception']);
                            actor.perception.roll({ event, precOptions, dc: this.dc });
                            break;
                    }

                    break;
                }

                case "foundry-chromatic-dungeons": {
                    const key = args[0];
                    const {attributes, attributeMods, saves} = actor.system.data;
                    let label, formula, target;

                    switch (rollMethod) {
                        case 'attributeRoll':
                            label = LMRTFY.abilities[key];
                            formula = `1d20-${attributeMods[key]}`;
                            target = attributes[key];
                            break;
                        case 'saveRoll':
                            label = LMRTFY.saves[key];
                            formula = `1d20+${saves.mods[key]}`;
                            target = saves.targets[key];
                            break;
                    }

                    actor[rollMethod](game.i18n.localize(label), formula, target);
                    break;
                }

                case "degenesis": {
                    const key = args[0];
                    actor[rollMethod].call(actor, key, false)
                    break;
                }

                case "demonlord": {
                    const key = args[0];
                    switch(this.advantage) {
                      case 0:
                        await actor.rollAttribute(actor.getAttribute(key), 0, 0)
                        break;
                      case 1:
                        await actor.rollAttribute(actor.getAttribute(key), this.BBDice, this.AddMod)
                        break;
                      case -1:
                        await actor.rollAttribute(actor.getAttribute(key), (this.BBDice)*-1, this.AddMod)
                        break;
                      case 2:
                        await actor[rollMethod].call(actor, ...args, options);
                        break;
                    }			
					break;
                }

                default: {
                    await actor[rollMethod].call(actor, ...args, options);
                }
            }
        }

        game.settings.set("core", "rollMode", rollMode);

        this._disableButtons(event);
        this._checkClose();
    }

    _makePF2EInitiativeRoll(event) {
        // save the current roll mode to reset it after this roll
        const rollMode = game.settings.get("core", "rollMode");
        game.settings.set("core", "rollMode", this.mode || CONST.DICE_ROLL_MODES);

        for (let actor of this.actors) {
            const initiative = actor.data.data.attributes.initiative;
            const rollNames = ['all', 'initiative'];
            if (initiative.ability === 'perception') {
                rollNames.push('wis-based');
                rollNames.push('perception');
            } else {
                const skill = actor.data.data.skills[initiative.ability];
                rollNames.push(`${skill.ability}-based`);
                rollNames.push(skill.name);
            }
            const options = actor.getRollOptions(rollNames);
            initiative.roll({ event, options });
        }

        game.settings.set("core", "rollMode", rollMode);

        event.currentTarget.disabled = true;
        this._checkClose();
    }

    _tagMessage(candidate, data, options) {
        candidate.updateSource({"flags.lmrtfy": {"message": this.data.message, "data": this.data.attach, "blind": candidate.blind}});
    }

    _makeDemonLordInitiativeRoll(event) {
        // save the current roll mode to reset it after this roll
        const rollMode = game.settings.get("core", "rollMode");
        game.settings.set("core", "rollMode", this.mode || CONST.DICE_ROLL_MODES);

        if (game.combat?.combatants !== undefined) {
            let combatantFound
            for (let actor of this.actors) {
                combatantFound = null
                for (const combatant of game.combat.combatants) {
                    if (combatant.actor?._id === actor._id) {
                        combatantFound = combatant
                    }
                }
                if (combatantFound) {
                    game.combat.rollInitiative(combatantFound._id)
                } else {
                    ui.notifications.warn(game.i18n.localize("LMRTFY.DemonLordNoCombat"));
                }
            }
        } else {
            ui.notifications.warn(game.i18n.localize("LMRTFY.DemonLordNoCombat"));
        }

        game.settings.set("core", "rollMode", rollMode);

        event.currentTarget.disabled = true;
        this._checkClose();
    }

    async _makeDiceRoll(event, formula, defaultMessage = null) {
        if (formula.startsWith("1d20")) {
            if (this.advantage === 1)
                formula = formula.replace("1d20", "2d20kh1")
            else if (this.advantage === -1)
                formula = formula.replace("1d20", "2d20kl1")
        }

        const messageFlag = {"message": this.data.message, "data": this.data.attach};

        const rollMessages = [];
        const rollMessagePromises = this.actors.map(async (actor) => {
            const speaker = ChatMessage.getSpeaker({actor: actor});

            const rollData = actor.getRollData();
            const roll = new Roll(formula, rollData);
            const rollMessageData = await roll.toMessage(
                {"flags.lmrtfy": messageFlag},
                {rollMode: this.mode, create: false},
            );

            rollMessages.push(
                mergeObject(
                    rollMessageData,
                    {
                        speaker: {
                            alias: speaker.alias,
                            scene: speaker.scene,
                            token: speaker.token,
                            actor: speaker.actor,
                        },
                        flavor: this.message || defaultMessage,
                        rollMode: this.mode,
                    },
                ),
            );
        })

        await Promise.allSettled(rollMessagePromises);
        await ChatMessage.create(rollMessages, {rollMode: this.mode});

        event.currentTarget.disabled = true;
        this._checkClose();
    }

    _drawTable(event, table) {
        const icons = {
            Actor: 'fas fa-user',
            Item: 'fas fa-suitcase',
            Scene: 'fas fa-map',
            JournalEntry: 'fas fa-book-open',
            Macro: 'fas fa-terminal',
            Playlist: '',
            Compendium: 'fas fa-atlas',
        }

        let chatMessages = [];
        let count = 0;
        const rollTable = game.tables.getName(table);

        if (rollTable) {
            for (let actor of this.actors) {
                rollTable.draw({ displayChat: false }).then((res) => {
                    count++;
                    const rollResults = res.results;

                    const nr = rollResults.length > 1 ? `${rollResults.length} results` : "a result";
                    let content = "";

                    for (const rollResult of rollResults) {
                        const result = rollResult;

                        if (!result.documentCollection) {
                            content += `<p>${result.text}</p>`;
                        } else if (['Actor', 'Item', 'Scene', 'JournalEntry', 'Macro'].includes(result.documentCollection)) {
                            content += `<p><a class="content-link" draggable="true" data-entity="${result.documentCollection}" data-uuid="${result.documentCollection}.${result.documentId}">
                                <i class="${icons[result.documentCollection]}"></i> ${result.text}</a></p>`;
                        } else if (result.documentCollection === 'Playlist') {
                            content += `<p>@${result.documentCollection}[${result.documentId}]{${result.text}}</p>`;
                        } else if (result.documentCollection) { // if not specific collection, then is compendium
                            content += `<p><a class="content-link" draggable="true" data-pack="${result.documentCollection}" data-uuid="${result.documentCollection}.${result.documentId}">
                                <i class="${icons[result.documentCollection]}"></i> ${result.text}</a></p>`;
                        }
                    }
                    let chatData = {
                        user: game.user.id,
                        speaker: ChatMessage.getSpeaker({actor}),
                        flavor: `Draws ${nr} from the ${table} table.`,
                        content: content,
                        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                    };

                    if ( ["gmroll", "blindroll"].includes(this.mode) ) {
                        chatData.whisper = ChatMessage.getWhisperRecipients("GM");
                    }
                    if ( this.mode === "selfroll" ) chatData.whisper = [game.user.id];
                    if ( this.mode === "blindroll" ) chatData.blind = true;

                    setProperty(chatData, "flags.lmrtfy", {"message": this.data.message, "data": this.data.attach, "blind": chatData.blind});

                    chatMessages.push(chatData);

                    if (count === this.actors.length) {
                        ChatMessage.create(chatMessages, {});

                        event.currentTarget.disabled = true;
                        this._checkClose();
                    }
                });
            }
        }
    }

    _onAbilityCheck(event) {
        event.preventDefault();
        const ability = event.currentTarget.dataset.ability;
        if (game.system.id === 'pf2e') this.pf2Roll = this.pf2eRollFor.ABILITY;
        
        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.abilityRollMethod, false, ability);
        } else {
            this._makeRoll(event, LMRTFY.abilityRollMethod, ability);
        }
    }

    _onFailAbilityCheck(event) {
        event.preventDefault();
        const ability = event.currentTarget.dataset.ability;
        if (game.system.id === 'pf2e') this.pf2Roll = this.pf2eRollFor.ABILITY;

        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.abilityRollMethod, true, ability);
        } else {
            this._makeRoll(event, LMRTFY.abilityRollMethod, ability);
        }
    }

    _onAbilitySave(event) {
        event.preventDefault();
        const saves = event.currentTarget.dataset.ability;
        if (game.system.id === 'pf2e') this.pf2Roll = this.pf2eRollFor.SAVE;
        
        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.saveRollMethod, false, saves);
        } else {
            this._makeRoll(event, LMRTFY.saveRollMethod, saves);
        }
    }

    _onFailAbilitySave(event) {
        event.preventDefault();
        const saves = event.currentTarget.dataset.ability;
        if (game.system.id === 'pf2e') this.pf2Roll = this.pf2eRollFor.SAVE;

        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.saveRollMethod, true, saves);
        } else {
            this._makeRoll(event, LMRTFY.saveRollMethod, saves);
        }
    }

    _onSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.dataset.skill;
        if (game.system.id === 'pf2e') this.pf2Roll = this.pf2eRollFor.SKILL;

        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.skillRollMethod, false, skill);
        } else {
            this._makeRoll(event, LMRTFY.skillRollMethod, skill);
        }
    }

    _onFailSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.dataset.skill;
        if (game.system.id === 'pf2e') this.pf2Roll = this.pf2eRollFor.SKILL;

        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.skillRollMethod, true, skill);
        } else {
            this._makeRoll(event, LMRTFY.skillRollMethod, skill);
        }
    }

    async _onCustomFormula(event) {
        event.preventDefault();
        await this._makeDiceRoll(event, this.data.formula);
    }

    _onInitiative(event) {
        event.preventDefault();

        switch (game.system.id) {
            case 'pf2e': 
                this._makePF2EInitiativeRoll(event);
                break;
            case 'demonlord': 
                this._makeDemonLordInitiativeRoll(event);
                break;                
            default:
                if (this.data.initiative) {
                    for (let actor of this.actors) {
                        actor.rollInitiative();
                    }
                    event.currentTarget.disabled = true;
                    this._checkClose();
                } else {
                    const initiative = CONFIG.Combat.initiative.formula || game.system.data.initiative;
                    this._makeDiceRoll(event, initiative, game.i18n.localize("LMRTFY.InitiativeRollMessage"));
                }
                break;
        }
    }

    _onDeathSave(event) {
        event.preventDefault();
        if (game.system.id == "dnd5e") {
            for (let actor of this.actors) {
                actor.rollDeathSave(event);
            }
            event.currentTarget.disabled = true;
            this._checkClose();
        } else if (game.system.id == "pf2e") {
            for (let actor of this.actors) {
                actor.rollRecovery();
            }
            event.currentTarget.disabled = true;
            this._checkClose();
        } else {
            this._makeDiceRoll(event, "1d20", game.i18n.localize("LMRTFY.DeathSaveRollMessage"));
        }
    }

    _onPerception(event) {
        event.preventDefault();
        this._makeDiceRoll(event, `1d20 + @attributes.perception.totalModifier`, game.i18n.localize("LMRTFY.PerceptionRollMessage"));
    }

    _onRollTable(event) {
        event.preventDefault();
        const table = event.currentTarget.dataset.table;
        this._drawTable(event, table);
    }

    _onToggleFailAbilityRoll(event) {
        event.preventDefault();
        if (event.currentTarget.classList.contains('disabled-button')) return;

        const failButton = document.querySelector(`.lmrtfy-ability-check-fail[data-ability *= '${event?.currentTarget?.dataset?.ability}']`);
        if (failButton) failButton.disabled = !failButton.disabled;

        const normalButton = document.querySelector(`.lmrtfy-ability-check[data-ability *= '${event?.currentTarget?.dataset?.ability}']`);
        if (normalButton) normalButton.disabled = !normalButton.disabled;
    }

    _onToggleFailSaveRoll(event) {
        event.preventDefault();
        if (event.currentTarget.classList.contains('disabled-button')) return;

        const failButton = document.querySelector(`.lmrtfy-ability-save-fail[data-ability *= '${event?.currentTarget?.dataset?.ability}']`);
        if (failButton) failButton.disabled = !failButton.disabled;

        const normalButton = document.querySelector(`.lmrtfy-ability-save[data-ability *= '${event?.currentTarget?.dataset?.ability}']`);
        if (normalButton) normalButton.disabled = !normalButton.disabled;
    }

    _onToggleFailSkillRoll(event) {
        event.preventDefault();
        if (event.currentTarget.classList.contains('disabled-button')) return;

        const failButton = document.querySelector(`.lmrtfy-skill-check-fail[data-skill *= '${event?.currentTarget?.dataset?.skill}']`);
        if (failButton) failButton.disabled = !failButton.disabled;

        const normalButton = document.querySelector(`.lmrtfy-skill-check[data-ability *= '${event?.currentTarget?.dataset?.ability}']`);
        if (normalButton) normalButton.disabled = !normalButton.disabled;
    }
}

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
        this.dc = data.dc;

        if (data.title) {
            this.options.title = data.title;
        }

        this.hasMidi = game.modules.get("midi-qol")?.active;
        this.midiUseNewRoller = isNewerVersion(game.modules.get("midi-qol")?.version, "10.0.26");

        Handlebars.registerHelper('canFailAbilityChecks', function (name, ability) {
            if (LMRTFY.currentRollProvider.canFailChecks()) {
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
            if (LMRTFY.currentRollProvider.canFailChecks()) {
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
            if (LMRTFY.currentRollProvider.canFailChecks()) {
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
	static rollTypes() {
		return {
            ABILITY: "ability",
            SAVE: "save",
            SKILL: "skill",
            PERCEPTION: "perception",
			INITIATIVE: "initiative",
			DEATHSAVE: "deathsave"
        };
	}

    async getData() {
        let note = ""
        if (this.advantage == 1)
            note = game.i18n.localize("LMRTFY.AdvantageNote");
        else if (this.advantage == -1)
            note = game.i18n.localize("LMRTFY.DisadvantageNote");

        let abilities = {}
        let saves = {}
        let skills = {}
        this.abilities.forEach(a => abilities[a] = LMRTFY.currentRollProvider.abilities()[a])
        this.saves.forEach(a => saves[a] = LMRTFY.currentRollProvider.saves()[a])
        this.skills
            .sort((a, b) => {
                const skillA = (LMRTFY.currentRollProvider.skills()[a]?.label) ? LMRTFY.currentRollProvider.skills()[a].label : LMRTFY.currentRollProvider.skills()[a];
                const skillB = (LMRTFY.currentRollProvider.skills()[b]?.label) ? LMRTFY.currentRollProvider.skills()[b].label : LMRTFY.currentRollProvider.skills()[b];
                game.i18n.localize(skillA).localeCompare(skillB)
            })
            .forEach(s => {
                const skill = (LMRTFY.currentRollProvider.skills()[s]?.label) ? LMRTFY.currentRollProvider.skills()[s].label : LMRTFY.currentRollProvider.skills()[s];
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
		var specialRolls = LMRTFY.currentRollProvider.specialRolls();
        if(specialRolls['initiative']) {
            this.element.find(".lmrtfy-initiative").click(this._onInitiative.bind(this))
        }
        if(specialRolls['deathsave']) {
            this.element.find(".lmrtfy-death-save").click(this._onDeathSave.bind(this))
        }
        if(specialRolls['perception']) {
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
                options = {... LMRTFY.currentRollProvider.disadvantageRollEvent() };
                break;
            case 0:
                options = {... LMRTFY.currentRollProvider.normalRollEvent() };
                break;
            case 1:
                options = {... LMRTFY.currentRollProvider.advantageRollEvent() };
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

    async _makeRoll(event, rollMethod, rolledType, failRoll, ...args) {
        let options = this._getRollOptions(event, failRoll);                

        // save the current roll mode to reset it after this roll
        const rollMode = game.settings.get("core", "rollMode");
        game.settings.set("core", "rollMode", this.mode || CONST.DICE_ROLL_MODES);

        for (let actor of this.actors) {
            Hooks.once("preCreateChatMessage", this._tagMessage.bind(this));

			if (LMRTFY.currentRollProvider.handleCustomRoll(actor, event, rollMethod, rolledType, failRoll, this.dc, args)) {
				continue;
			}
			
			await actor[rollMethod].call(actor, ...args, options);
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
        
        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.currentRollProvider.abilityRollMethod(), LMRTFYRoller.rollTypes().ABILITY, false, ability);
        } else {
            this._makeRoll(event, LMRTFY.currentRollProvider.abilityRollMethod(), LMRTFYRoller.rollTypes().ABILITY, ability);
        }
    }

    _onFailAbilityCheck(event) {
        event.preventDefault();
        const ability = event.currentTarget.dataset.ability;

        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.currentRollProvider.abilityRollMethod(), LMRTFYRoller.rollTypes().ABILITY, true, ability);
        } else {
            this._makeRoll(event, LMRTFY.currentRollProvider.abilityRollMethod(), LMRTFYRoller.rollTypes().ABILITY, ability);
        }
    }

    _onAbilitySave(event) {
        event.preventDefault();
        const saves = event.currentTarget.dataset.ability;
        
        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.currentRollProvider.saveRollMethod(), LMRTFYRoller.rollTypes().SAVE, false, saves);
        } else {
            this._makeRoll(event, LMRTFY.currentRollProvider.saveRollMethod(), LMRTFYRoller.rollTypes().SAVE, saves);
        }
    }

    _onFailAbilitySave(event) {
        event.preventDefault();
        const saves = event.currentTarget.dataset.ability;

        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.currentRollProvider.saveRollMethod(), LMRTFYRoller.rollTypes().SAVE, true, saves);
        } else {
            this._makeRoll(event, LMRTFY.currentRollProvider.saveRollMethod(), LMRTFYRoller.rollTypes().SAVE, saves);
        }
    }

    _onSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.dataset.skill;

        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.currentRollProvider.skillRollMethod(), LMRTFYRoller.rollTypes().SKILL, false, skill);
        } else {
            this._makeRoll(event, LMRTFY.currentRollProvider.skillRollMethod(), LMRTFYRoller.rollTypes().SKILL, skill);
        }
    }

    _onFailSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.dataset.skill;

        // until patching has been removed
        if (!this.hasMidi || this.midiUseNewRoller) {
            this._makeRoll(event, LMRTFY.currentRollProvider.skillRollMethod(), LMRTFYRoller.rollTypes().SKILL, true, skill);
        } else {
            this._makeRoll(event, LMRTFY.currentRollProvider.skillRollMethod(), LMRTFYRoller.rollTypes().SKILL, skill);
        }
    }

    async _onCustomFormula(event) {
        event.preventDefault();
        await this._makeDiceRoll(event, this.data.formula);
    }

    _onInitiative(event) {
        event.preventDefault();

		//Custom Event Handling for Initiative Rolls (if needed)
		var initRollHandling = LMRTFY.currentRollProvider.handleInitiativeRoll(event, this.mode, this.actors);
		if (initRollHandling && initRollHandling.isHandled) {
			if (initRollHandling.checkClose) {
				this._checkClose();
			}
			return;
		}
		
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
    }

    _onDeathSave(event) {
        event.preventDefault();
		
		var deathSaveHandling = LMRTFY.currentRollProvider.handleDeathSave(this.actors, event);
		if (deathSaveHandling && deathSaveHandling.isHandled) {
			if (deathSaveHandling.checkClose) {
				this._checkClose();
			}
			return;
		}
		this._makeDiceRoll(event, "1d20", game.i18n.localize("LMRTFY.DeathSaveRollMessage"));
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

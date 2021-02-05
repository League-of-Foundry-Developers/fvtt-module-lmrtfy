

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
        if (data.title) {
            this.options.title = data.title;
        }
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
            note = game.i18n.localize("LMRTFY.AdvantageNote");
        else if (this.advantage == -1)
            note = game.i18n.localize("LMRTFY.DisadvantageNote");
        
        let abilities = {}
        let saves = {}
        let skills = {}
        this.abilities.forEach(a => abilities[a] = LMRTFY.abilities[a])
        this.saves.forEach(a => saves[a] = LMRTFY.saves[a])
        this.skills
            .sort((a, b) => game.i18n.localize(LMRTFY.skills[a]).localeCompare(game.i18n.localize(LMRTFY.skills[b])))
            .forEach(s => skills[s] = LMRTFY.skills[s]);
        return {
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
        };
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
    }

    _makeRoll(event, rollMethod, ...args) {
        let fakeEvent = {}
        switch(this.advantage) {
            case -1: 
                fakeEvent = LMRTFY.disadvantageRollEvent;
                break;
            case 0:
                fakeEvent = event;
                break;
            case 1:
                fakeEvent = LMRTFY.advantageRollEvent;
                break;
            case 2: 
                fakeEvent = event;
                break;
        }
        const rollMode = game.settings.get("core", "rollMode");
        game.settings.set("core", "rollMode", this.mode || CONST.DICE_ROLL_MODES);
        for (let actor of this.actors) {
            Hooks.once("preCreateChatMessage", this._tagMessage.bind(this));
            if(game.system.id=="pf2e") {
                actor[rollMethod].call(actor, fakeEvent, ...args);                        
            } else {
                actor[rollMethod].call(actor, ...args, { event: fakeEvent });                        
            }

        }
        game.settings.set("core", "rollMode", rollMode);
        event.currentTarget.disabled = true;
        if (this.element.find("button").filter((i, e) => !e.disabled).length === 0)
            this.close();
    }

    _tagMessage(data, options) {
      setProperty(data, "flags.lmrtfy", {"message": this.data.message, "data": this.data.attach});
    }

    _makeDiceRoll(event, formula, defaultMessage = null) {
        if (formula.startsWith("1d20")) {
            if (this.advantage === 1)
                formula = formula.replace("1d20", "2d20kh1")
            else if (this.advantage === -1)
                formula = formula.replace("1d20", "2d20kl1")
        }
        let chatMessages = []
        for (let actor of this.actors) {
            let chatData = {
              user: game.user._id,
              speaker: ChatMessage.getSpeaker({actor}),
              content: formula,
              flavor: this.message || defaultMessage,
              type: CONST.CHAT_MESSAGE_TYPES.ROLL
            };
            try {
                let data = duplicate(actor.data.data);
                data["name"] = actor.name;
                let roll = new Roll(formula, data).roll();
                chatData.roll = JSON.stringify(roll);
                chatData.sound = CONFIG.sounds.dice;
            } catch(err) {
                chatData.content = `Error parsing the roll formula: ${formula}`
                chatData.roll = null;
                chatData.type = CONST.CHAT_MESSAGE_TYPES.OOC;
            }
        
            // Record additional roll data
            if ( ["gmroll", "blindroll"].includes(this.mode) )
                chatData.whisper = ChatMessage.getWhisperRecipients("GM");
            if ( this.mode === "selfroll" ) chatData.whisper = [game.user._id];
            if ( this.mode === "blindroll" ) chatData.blind = true;
            setProperty(chatData, "flags.lmrtfy", {"message": this.data.message, "data": this.data.attach});
            chatMessages.push(chatData);
        }
        ChatMessage.create(chatMessages, {});

        event.currentTarget.disabled = true;
        if (this.element.find("button").filter((i, e) => !e.disabled).length === 0)
            this.close();
    }

    _drawTable(event, table) {
        let chatMessages = [];
        let count = 0;
        const rollTable = game.tables.getName(table);

        if (rollTable) {
            for (let actor of this.actors) {
                rollTable.draw({ displayChat: false }).then((res) => {
                    count++;
                    const rollResult = res.results;
    
                    const nr = rollResult.length > 1 ? `${rollResult.length} results` : "a result";
                    let content = "";
                    for (const result of rollResult) {
                        content += `<p>${result.text}</p>`
                    }
                    let chatData = {
                        user: game.user._id,
                        speaker: ChatMessage.getSpeaker({actor}),                
                        flavor: `Draws ${nr} from the ${table} table.`,
                        content: content,
                        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                    };

                    if ( ["gmroll", "blindroll"].includes(this.mode) ) {
                        chatData.whisper = ChatMessage.getWhisperRecipients("GM");
                    }              
                    if ( this.mode === "selfroll" ) chatData.whisper = [game.user._id];
                    if ( this.mode === "blindroll" ) chatData.blind = true;

                    setProperty(chatData, "flags.lmrtfy", {"message": this.data.message, "data": this.data.attach});
                    chatMessages.push(chatData);
    
                    if (count === this.actors.length) {
                        ChatMessage.create(chatMessages, {});
    
                        event.currentTarget.disabled = true;
                        if (this.element.find("button").filter((i, e) => !e.disabled).length === 0) {
                            this.close();
                        }
                    }
                });                                 
            }
        }        
    }

    _onAbilityCheck(event) {
        event.preventDefault();
        const ability = event.currentTarget.dataset.ability;
        this._makeRoll(event, LMRTFY.abilityRollMethod, ability);
    }

    _onAbilitySave(event) {
        event.preventDefault();
        const saves = event.currentTarget.dataset.ability;
        this._makeRoll(event, LMRTFY.saveRollMethod, saves);
    }

    _onSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.dataset.skill;
        this._makeRoll(event, LMRTFY.skillRollMethod, skill);
    }
    _onCustomFormula(event) {
        event.preventDefault();
        this._makeDiceRoll(event, this.data.formula);
    }
    _onInitiative(event) {
        event.preventDefault();
        const initiative = CONFIG.Combat.initiative.formula || game.system.data.initiative;
        this._makeDiceRoll(event, initiative, game.i18n.localize("LMRTFY.InitiativeRollMessage"));
    }
    _onDeathSave(event) {
        event.preventDefault();
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

}

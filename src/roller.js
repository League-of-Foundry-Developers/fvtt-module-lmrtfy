

class LMRTFYRoller extends Application {

    constructor(actors, data) {
        super()
        this.actors = actors
        this.data = data
        this.abilities = data.abilities
        this.saves = data.saves
        this.skills = data.skills
        this.advantage = data.advantage
        this.mode = data.mode
        this.message = data.message
        if (data.title)
            this.options.title = data.title;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = game.i18n.localize("LMRTFY.Title");
        options.template = "modules/lmrtfy/templates/roller.html";
        options.popOut = true;
        options.width = 400;
        options.height = "auto";
        options.classes = ["lmrtfy", "lmrtfy-roller"]
        return options;
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
        this.abilities.forEach(a => abilities[a] = CONFIG.DND5E.abilities[a])
        this.saves.forEach(a => saves[a] = CONFIG.DND5E.abilities[a])
        this.skills.forEach(s => skills[s] = CONFIG.DND5E.skills[s])
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
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.element.find(".lmrtfy-ability-check").click(this._onAbilityCheck.bind(this))
        this.element.find(".lmrtfy-ability-save").click(this._onAbilitySave.bind(this))
        this.element.find(".lmrtfy-skill-check").click(this._onSkillCheck.bind(this))
        this.element.find(".lmrtfy-custom-formula").click(this._onCustomFormula.bind(this))
        this.element.find(".lmrtfy-initiative").click(this._onInitiative.bind(this))
        this.element.find(".lmrtfy-death-save").click(this._onDeathSave.bind(this))
    }

    _makeRoll(event, rollMethod, ...args) {
        let fakeEvent = {}
        if (this.advantage === 0) {
            fakeEvent.shiftKey = true;
            fakeEvent.altKey = false;
            fakeEvent.ctrlKey = false;
        } else if (this.advantage === 1) {
            fakeEvent.shiftKey = false;
            fakeEvent.altKey = true;
            fakeEvent.ctrlKey = false;
        } else if (this.advantage === -1) {
            fakeEvent.shiftKey = false;
            fakeEvent.altKey = false;
            fakeEvent.ctrlKey = true;
        }
        const rollMode = game.settings.get("core", "rollMode");
        game.settings.set("core", "rollMode", this.mode);
        for (let actor of this.actors) {
            actor[rollMethod].call(actor, ...args, { event: fakeEvent });
        }
        game.settings.set("core", "rollMode", rollMode);
        event.currentTarget.disabled = true;
        if (this.element.find("button").filter((i, e) => !e.disabled).length === 0)
            this.close();
    }

    _makeDiceRoll(event, formula) {
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
              flavor: this.message || null,
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
            if ( ["gmroll", "blindroll"].includes(this.mode) ) chatData.whisper = ChatMessage.getWhisperIDs("GM");
            if ( this.mode === "selfroll" ) chatData.whisper = [game.user._id];
            if ( this.mode === "blindroll" ) chatData.blind = true;
            chatMessages.push(chatData);
        }
        ChatMessage.create(chatMessages, {});

        event.currentTarget.disabled = true;
        if (this.element.find("button").filter((i, e) => !e.disabled).length === 0)
            this.close();
    }


    _onAbilityCheck(event) {
        event.preventDefault();
        const ability = event.currentTarget.dataset.ability;
        this._makeRoll(event, 'rollAbilityTest', ability);
    }

    _onAbilitySave(event) {
        event.preventDefault();
        const ability = event.currentTarget.dataset.ability;
        this._makeRoll(event, 'rollAbilitySave', ability);
    }

    _onSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.dataset.skill;
        this._makeRoll(event, 'rollSkill', skill);
    }
    _onCustomFormula(event) {
        event.preventDefault();
        this._makeDiceRoll(event, this.data.formula);
    }
    _onInitiative(event) {
        event.preventDefault();
        this._makeDiceRoll(event, game.system.data.initiative);
    }
    _onDeathSave(event) {
        event.preventDefault();
        this._makeDiceRoll(event, "1d20");
    }

}

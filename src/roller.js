

class LMRTFYRoller extends Application {

    constructor(actors, data) {
        super()
        this.actors = actors
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
        options.title = "Let Me Roll That For You!";
        options.template = "modules/lmrtfy/templates/roller.html";
        options.popOut = true;
        options.width = "auto";
        options.height = "auto";
        options.classes = ["lmrtfy", "lmrtfy-roller"]
        return options;
    }

    async getData() {
        let note = ""
        if (this.advantage == 1)
            note = "These rolls will be made with advantage"
        else if (this.advantage == -1)
            note = "These rolls will be made with disadvantage"
        
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
            message: this.message
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.element.find(".lmrtfy-ability-check").click(this._onAbilityCheck.bind(this))
        this.element.find(".lmrtfy-ability-save").click(this._onAbilitySave.bind(this))
        this.element.find(".lmrtfy-skill-check").click(this._onSkillCheck.bind(this))
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

}

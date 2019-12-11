class LMRTFYRequestor extends FormApplication {
    constructor(...args) {
        super(...args)
        game.users.apps.push(this)
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = "Let Me Roll That For You!";
        options.id = "lmrtfy";
        options.template = "modules/lmrtfy/templates/request-rolls.html";
        options.closeOnSubmit = false;
        options.popOut = true;
        options.width = "auto";
        options.height = "auto";
        options.classes = ["lmrtfy", "lmrtfy-roller"]
        return options;
    }

    async getData() {
        // Return data to the template
        const actors = game.users.entities.map(u => u.character).filter(a => a);
        const abilities = CONFIG.DND5E.abilities;
        const skills = CONFIG.DND5E.skills;
        return {
            actors,
            abilities,
            skills
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.element.find(".select-all").click((event) => this.setActorSelection(event, true));
        this.element.find(".deselect-all").click((event) => this.setActorSelection(event, false));
    }

    setActorSelection(event, enabled) {
        event.preventDefault();
        this.element.find(".lmrtfy-actor-select").prop("checked", enabled)
    }

    _updateObject(event, formData) {
        console.log("LMRTFY submit: ", formData)
        const keys = Object.keys(formData)
        const actors = keys.filter(k => k.startsWith("actor-")).reduce((acc, k) => { if (formData[k]) acc.push(k.slice(6)); return acc;}, [])
        const abilities = keys.filter(k => k.startsWith("check-")).reduce((acc, k) => { if (formData[k]) acc.push(k.slice(6)); return acc;}, [])
        const saves = keys.filter(k => k.startsWith("save-")).reduce((acc, k) => { if (formData[k]) acc.push(k.slice(5)); return acc;}, [])
        const skills = keys.filter(k => k.startsWith("skill-")).reduce((acc, k) => { if (formData[k]) acc.push(k.slice(6)); return acc;}, [])
        if (actors.length === 0 || (abilities.length === 0 && saves.length === 0 && skills.length === 0))
            return;
        const socketData = {
            actors,
            abilities,
            saves,
            skills,
            modifiers: formData.modifiers
        }
        console.log("LMRTFY socket send : ", socketData)
        game.socket.emit('module.lmrtfy', socketData);
        // Send to ourselves
        if (game.user.character && actors.includes(game.user.character.id))
            LMRTFY.onMessage(socketData);
    }
}

class LMRTFYRoller extends Application {

    constructor(actor, abilities, saves, skills, modifiers) {
        super()
        this.actor = actor
        this.abilities = abilities
        this.saves = saves
        this.skills = skills
        this.modifiers = modifiers
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
        if (this.modifiers == 1)
            note = "These rolls will be with advantage"
        else if (this.modifiers == -1)
            note = "These rolls will be with disadvantage"
        
        let abilities = {}
        let saves = {}
        let skills = {}
        this.abilities.forEach(a => abilities[a] = CONFIG.DND5E.abilities[a])
        this.saves.forEach(a => saves[a] = CONFIG.DND5E.abilities[a])
        this.skills.forEach(s => skills[s] = CONFIG.DND5E.skills[s])
        return {
            actor: this.actor,
            abilities: abilities,
            saves: saves,
            skills: skills,
            note: note
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.element.find(".lmrtfy-ability-check").click(this._onAbilityCheck.bind(this))
        this.element.find(".lmrtfy-ability-save").click(this._onAbilitySave.bind(this))
        this.element.find(".lmrtfy-skill-check").click(this._onSkillCheck.bind(this))
    }

    _modifyEvent(event) {
        if (this.modifiers === 0) {
            event.shiftKey = true;
            event.altKey = false;
            event.ctrlKey = false;
        } else if (this.modifiers === 1) {
            event.shiftKey = false;
            event.altKey = true;
            event.ctrlKey = false;
        } else if (this.modifiers === -1) {
            event.shiftKey = false;
            event.altKey = false;
            event.ctrlKey = true;
        }
    }

    _onAbilityCheck(event) {
        event.preventDefault();
        const ability = event.currentTarget.dataset.ability;
        this._modifyEvent(event);
        this.actor.rollAbilityTest(ability, { event })
    }

    _onAbilitySave(event) {
        event.preventDefault();
        const ability = event.currentTarget.dataset.ability;
        this._modifyEvent(event);
        this.actor.rollAbilitySave(ability, { event })
    }

    _onSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.dataset.skill;
        this._modifyEvent(event);
        this.actor.rollSkill(skill, { event })
    }

}


class LMRTFY {

    static ready() {
        game.socket.on('module.lmrtfy', LMRTFY.onMessage);
    }

    static onMessage(data) {
        console.log("LMRTF got message: ", data)
        if (!game.user.character)
            return;
        if (!data.actors.includes(game.user.character.id))
            return;
        new LMRTFYRoller(game.user.character, data.abilities, data.saves, data.skills, data.modifiers).render(true);
    }
	static requestRoll() {
		if (LMRTFY.requestor === undefined)
			LMRTFY.requestor = new LMRTFYRequestor();
		LMRTFY.requestor.render(true);
	}

	static getSceneControlButtons(buttons) {
		let tokenButton = buttons.find(b => b.name == "token")

		if (tokenButton) {
			tokenButton.tools.push({
				name: "request-roll",
				title: "Request Roll",
				icon: "fas fa-dice-d20",
				visible: game.user.isGM,
				onClick: () => LMRTFY.requestRoll()
			});
		}
	}
}

Hooks.on('ready', LMRTFY.ready)
Hooks.on('getSceneControlButtons', LMRTFY.getSceneControlButtons)
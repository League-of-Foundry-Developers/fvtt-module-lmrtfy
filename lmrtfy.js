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
        options.width = 600;
        options.height = "auto";
        options.classes = ["lmrtfy", "lmrtfy-requestor"]
        return options;
    }

    async getData() {
        // Return data to the template
        const actors = game.actors.entities;
        const users = game.users.entities;
        const abilities = CONFIG.DND5E.abilities;
        const skills = CONFIG.DND5E.skills;
        return {
            actors,
            users,
            abilities,
            skills,
            rollModes: CONFIG.rollModes
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.element.find(".select-all").click((event) => this.setActorSelection(event, true));
        this.element.find(".deselect-all").click((event) => this.setActorSelection(event, false));
        this.element.find("select[name=user]").change(this._onUserChange.bind(this));
        this._onUserChange();
    }

    setActorSelection(event, enabled) {
        event.preventDefault();
        this.element.find(".lmrtfy-actor input").prop("checked", enabled)
    }

    _onUserChange() {
        const userId = this.element.find("select[name=user]").val();
        let actors = [];
        if (userId === "") {
            actors = game.users.entities.map(u => u.character).filter(a => a)
        } else {
            const user = game.users.get(userId);
            if (user)
                actors = game.actors.entities.filter(a => a.hasPerm(user, "OWNER"))
        }
        actors = actors.map(a => a.id);
        this.element.find(".lmrtfy-actor").hide().filter((i, e) => actors.includes(e.dataset.id)).show();

    }

    _updateObject(event, formData) {
        console.log("LMRTFY submit: ", formData)
        const keys = Object.keys(formData)
        const user = game.users.get(formData.user) || null;
        const user_actors = (user ? game.actors.entities.filter(a => a.hasPerm(user, "OWNER")) : game.users.entities.map(u => u.character).filter(a => a)).map(a => `actor-${a.id}`);
        const actors = keys.filter(k => k.startsWith("actor-")).reduce((acc, k) => { if (formData[k] && user_actors.includes(k)) acc.push(k.slice(6)); return acc;}, [])
        const abilities = keys.filter(k => k.startsWith("check-")).reduce((acc, k) => { if (formData[k]) acc.push(k.slice(6)); return acc;}, [])
        const saves = keys.filter(k => k.startsWith("save-")).reduce((acc, k) => { if (formData[k]) acc.push(k.slice(5)); return acc;}, [])
        const skills = keys.filter(k => k.startsWith("skill-")).reduce((acc, k) => { if (formData[k]) acc.push(k.slice(6)); return acc;}, [])
        if (actors.length === 0 || (abilities.length === 0 && saves.length === 0 && skills.length === 0))
            return;
        const { advantage, mode, title, message } = formData;
        const socketData = {
            user: formData.user || null,
            actors,
            abilities,
            saves,
            skills,
            advantage,
            mode,
            title,
            message
        }
        console.log("LMRTFY socket send : ", socketData)
        game.socket.emit('module.lmrtfy', socketData);
        // Send to ourselves
        LMRTFY.onMessage(socketData);
    }
}

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

    _makeRoll(rollMethod, ...args) {
        event = {}
        if (this.advantage === 0) {
            event.shiftKey = true;
            event.altKey = false;
            event.ctrlKey = false;
        } else if (this.advantage === 1) {
            event.shiftKey = false;
            event.altKey = true;
            event.ctrlKey = false;
        } else if (this.advantage === -1) {
            event.shiftKey = false;
            event.altKey = false;
            event.ctrlKey = true;
        }
        const rollMode = game.settings.get("core", "rollMode");
        game.settings.set("core", "rollMode", this.mode);
        for (let actor of this.actors) {
            actor[rollMethod].call(actor, ...args, { event });
        }
        game.settings.set("core", "rollMode", rollMode);
    }


    _onAbilityCheck(event) {
        event.preventDefault();
        const ability = event.currentTarget.dataset.ability;
        this._makeRoll('rollAbilityTest', ability);
    }

    _onAbilitySave(event) {
        event.preventDefault();
        const ability = event.currentTarget.dataset.ability;
        this._makeRoll('rollAbilitySave', ability);
    }

    _onSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.dataset.skill;
        this._makeRoll('rollSkill', skill);
    }

}


class LMRTFY {

    static ready() {
        game.socket.on('module.lmrtfy', LMRTFY.onMessage);
    }

    static onMessage(data) {
        console.log("LMRTF got message: ", data)
        if (data.user === null &&
            (!game.user.character || !data.actors.includes(game.user.character.id)))
            return;
        else if (data.user !== null && data.user !== game.user.id)
            return;
        const actors = data.user === null ? [game.user.character] : data.actors.map(id => game.actors.get(id)).filter(a => a);
        new LMRTFYRoller(actors, data).render(true);
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
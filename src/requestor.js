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
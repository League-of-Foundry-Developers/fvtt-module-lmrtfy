

class LMRTFYRequestor extends FormApplication {
    constructor(...args) {
        super(...args)
        game.users.apps.push(this)
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = game.i18n.localize("LMRTFY.Title");
        options.id = "lmrtfy";
        options.template = "modules/lmrtfy/templates/request-rolls.html";
        options.closeOnSubmit = false;
        options.popOut = true;
        options.width = 600;
        options.height = "auto";
        options.classes = ["lmrtfy", "lmrtfy-requestor"];
        if (game.settings.get('lmrtfy', 'enableParchmentTheme')) {
          options.classes.push('lmrtfy-parchment');
        }
        return options;
    }

    async getData() {
        // Return data to the template
        const actors = game.actors.entities;
        const users = game.users.entities;
        // Note: Maybe these work better at a global level, but keeping things simple
        const abilities = LMRTFY.abilities;
        const saves = LMRTFY.saves;

        const skills = Object.keys(LMRTFY.skills)
            .sort((a, b) => game.i18n.localize(LMRTFY.skills[a]).localeCompare(game.i18n.localize(LMRTFY.skills[b])))
            .reduce((acc, skillKey) => {
                acc[skillKey] = LMRTFY.skills[skillKey];
                return acc;
            }, {});

        let tables = null;
        if (game.tables) {
            tables = [];
            game.tables.forEach(t => tables.push(t.data.name));
        }

        return {
            actors,
            users,
            abilities,
            saves,
            skills,
            tables,
            specialRolls: LMRTFY.specialRolls,
            rollModes: CONFIG.Dice.rollModes,
        };
    }

    render(force, context={}) {
        // Only re-render if needed
        const {action, data} = context;
        if (action && !["create", "update", "delete"].includes(action)) return;
        if (action === "update" && !data.some(d => "character" in d)) return;
        if (force !== true && !action) return;
        return super.render(force, context);
      }
    
    activateListeners(html) {
        super.activateListeners(html);
        this.element.find(".select-all").click((event) => this.setActorSelection(event, true));
        this.element.find(".deselect-all").click((event) => this.setActorSelection(event, false));
        this.element.find("select[name=user]").change(this._onUserChange.bind(this));
        this.element.find(".lmrtfy-save-roll").click(this._onSubmit.bind(this));
        this.element.find(".lmrtfy-actor").hover(this._onHoverActor.bind(this));
        this._onUserChange();
    }

    setActorSelection(event, enabled) {
        event.preventDefault();
        this.element.find(".lmrtfy-actor input").prop("checked", enabled)
    }

    // From _onHoverMacro
    _onHoverActor(event) {
        event.preventDefault();
        const div = event.currentTarget;

        // Remove any existing tooltip
        const tooltip = div.querySelector(".tooltip");
        if (tooltip) div.removeChild(tooltip);

        // Handle hover-in
        if (event.type === "mouseenter") {
            const userId = this.element.find("select[name=user]").val();
            const actorId = div.dataset.id;
            const actor = game.actors.get(actorId);
            if (!actor) return;
            const user = userId === "character" ? game.users.entities.find(u => u.character && u.character._id === actor._id) : null;
            const tooltip = document.createElement("SPAN");
            tooltip.classList.add("tooltip");
            tooltip.textContent = `${actor.name}${user ? ` (${user.name})` : ''}`;
            div.appendChild(tooltip);
        }
    }

    _getUserActorIds(userId) {
        let actors = [];
        if (userId === "character") {
            actors = game.users.entities.map(u => u.character && u.character.id).filter(a => a)
        } else if (userId === "tokens") {
            actors = Array.from(new Set(canvas.tokens.placeables.map(t => t.data.actorId))).filter(a => a);
        } else {
            const user = game.users.get(userId);
            if (user)
                actors = game.actors.entities.filter(a => a.hasPerm(user, "OWNER")).map(a => a.id)
        }
        return actors;
    }
    _onUserChange() {
        const userId = this.element.find("select[name=user]").val();
        const actors = this._getUserActorIds(userId)
        this.element.find(".lmrtfy-actor").hide().filter((i, e) => actors.includes(e.dataset.id)).show();

    }

    async _updateObject(event, formData) {
        //console.log("LMRTFY submit: ", formData)
        const saveAsMacro = $(event.currentTarget).hasClass("lmrtfy-save-roll")
        const keys = Object.keys(formData)
        const user_actors = this._getUserActorIds(formData.user).map(id => `actor-${id}`);
        const actors = keys.filter(k => k.startsWith("actor-")).reduce((acc, k) => {
            if (formData[k] && user_actors.includes(k)) 
                acc.push(k.slice(6));
            return acc;
        }, []);
        const abilities = keys.filter(k => k.startsWith("check-")).reduce((acc, k) => {
            if (formData[k])
                acc.push(k.slice(6));
            return acc;
        }, []);
        const saves = keys.filter(k => k.startsWith("save-")).reduce((acc, k) => {
            if (formData[k])
                acc.push(k.slice(5));
            return acc;
        }, []);
        const skills = keys.filter(k => k.startsWith("skill-")).reduce((acc, k) => {
            if (formData[k])
                acc.push(k.slice(6));
            return acc;
        }, []);
        const tables = formData.table;
        const formula = formData.formula.trim();
        const { advantage, mode, title, message } = formData;
        if (actors.length === 0 ||
             (!message && abilities.length === 0 && saves.length === 0 && skills.length === 0 &&
                formula.length === 0 && !formData['extra-death-save'] && !formData['extra-initiative'] && !formData['extra-perception'] &&
                    tables.length === 0)) {
            ui.notifications.warn(game.i18n.localize("LMRTFY.NothingNotification"));
            return;
        }
        const socketData = {
            user: formData.user,
            actors,
            abilities,
            saves,
            skills,
            advantage,
            mode,
            title,
            message,
            formula,
            deathsave: formData['extra-death-save'],
            initiative: formData['extra-initiative'],
            perception: formData['extra-perception'],
            tables: tables,
        }
        // console.log("LMRTFY socket send : ", socketData)
        if (saveAsMacro) {

            const actorTargets = actors.map(a => game.actors.get(a)).filter(a => a).map(a => a.name).join(", ");
            const user = game.users.get(formData.user) || null;
            const target = user ? user.name : actorTargets;
            const scriptContent = `// ${title} ${message ? " -- " + message : ""}\n` +
                `// Request rolls from ${target}\n` +
                `// Abilities: ${abilities.map(a => LMRTFY.abilities[a]).filter(s => s).join(", ")}\n` +
                `// Saves: ${saves.map(a => LMRTFY.saves[a]).filter(s => s).join(", ")}\n` +
                `// Skills: ${skills.map(s => LMRTFY.skills[s]).filter(s => s).join(", ")}\n` +
                `const data = ${JSON.stringify(socketData, null, 2)};\n\n` +
                `game.socket.emit('module.lmrtfy', data);\n`;
            const macro = await Macro.create({
                name: "LMRTFY: " + (message || title),
                type: "script",
                scope: "global",
                command: scriptContent,
                img: "icons/svg/d20-highlight.svg"
            });
            macro.sheet.render(true);
        } else {
            game.socket.emit('module.lmrtfy', socketData);
            // Send to ourselves
            LMRTFY.onMessage(socketData);
            ui.notifications.info(game.i18n.localize("LMRTFY.SentNotification"))
        }
    }
}

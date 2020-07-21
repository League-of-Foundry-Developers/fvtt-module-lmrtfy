class LMRTFY {
    static ready() {
        game.socket.on('module.lmrtfy', LMRTFY.onMessage);
        if(game.system.id == "pf2e") {
            LMRTFY.saveRollMethod = 'rollSave';
            LMRTFY.abilityRollMethod = 'rollAbility';
            LMRTFY.skillRollMethod = 'rollSkill';
            LMRTFY.abilities = CONFIG.PF2E.abilities;
            LMRTFY.skills = CONFIG.PF2E.skills;
            LMRTFY.saves = CONFIG.PF2E.saves;
            // This specifies whether the default game behavior is to send
            // a player roll query when SHIFT is sent. Pathfinder 2E acts 
            // the opposite of the 5E game system in this manner.
            LMRTFY.defaultQuery = true;  
        } else {
            LMRTFY.saveRollMethod = 'rollAbilitySave';
            LMRTFY.abilityRollMethod = 'rollAbilityTest';
            LMRTFY.skillRollMethod = 'rollSkill';
            LMRTFY.abilities = CONFIG.DND5E.abilities;
            LMRTFY.skills = CONFIG.DND5E.skills;
            LMRTFY.saves = CONFIG.DND5E.abilities;
            LMRTFY.defaultQuery = false;
        }
    }

    static onMessage(data) {
        //console.log("LMRTF got message: ", data)
        if (data.user === "character" &&
            (!game.user.character || !data.actors.includes(game.user.character.id)))
            return;
        else if (!["character", "tokens"].includes(data.user) && data.user !== game.user.id)
            return;
        let actors = [];
        if (data.user === "character")
            actors = [game.user.character];
        else if (data.user === "tokens")
            actors = canvas.tokens.controlled.map(t => t.actor);
        else
            actors = data.actors.map(id => game.actors.get(id));
        actors = actors.filter(a => a);
        if (actors.length === 0) return;
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
				title: game.i18n.localize('LMRTFY.ControlTitle'),
				icon: "fas fa-dice-d20",
				visible: game.user.isGM,
				onClick: () => LMRTFY.requestRoll(),
                button: true
			});
		}
	}
}

Hooks.on('ready',LMRTFY.ready);
Hooks.on('getSceneControlButtons', LMRTFY.getSceneControlButtons)

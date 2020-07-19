class LMRTFY {

    static ready() {
        game.socket.on('module.lmrtfy', LMRTFY.onMessage);
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

Hooks.on('ready', LMRTFY.ready)
Hooks.on('getSceneControlButtons', LMRTFY.getSceneControlButtons)
Hooks.once("ready", () => {
    game.settings.register("lmrtfy", "useShiftedRolls", {
        name: "SHIFTed Rolls",
        hint: "The default for LMRTFY is to attempt the roll from the user as if they were holding [SHIFT] which prompts for mods, advantage, disadvantage. Deselecting this will send a Normal roll through directly, which may keep consistency in some systems.",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
      });
})
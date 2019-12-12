class LMRTFY {

    static ready() {
        game.socket.on('module.lmrtfy', LMRTFY.onMessage);
    }

    static onMessage(data) {
        //console.log("LMRTF got message: ", data)
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
				title: game.i18n.localize('LMRTFY.ControlTitle'),
				icon: "fas fa-dice-d20",
				visible: game.user.isGM,
				onClick: () => LMRTFY.requestRoll()
			});
		}
	}
}

Hooks.on('ready', LMRTFY.ready)
Hooks.on('getSceneControlButtons', LMRTFY.getSceneControlButtons)
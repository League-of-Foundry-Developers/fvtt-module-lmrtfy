class lmrtfy_RollProvider_degenesis extends lmrtfy_RollProvider {
	/**
	 * The system identifier for this specific RollProvider.
	 *
	 * @return string Identifying the System.
	 */
	systemIdentifiers() {
		return 'degenesis';
	}
	
	requestRollTemplate() {
		return "modules/lmrtfy/templates/degenesis-request-rolls.html";
	}

	/**
	 * Where all of the Skills are defined for this system.
	 *
	 * @return array Of Skills
	 */
	skills() {
		let dskills = game.actors.contents[0].skills;
		for (const [key, value] of Object.entries(dskills)) {
			dskills[key]["label"] = key;
			dskills[key]["ability"] = value.attribute;
		}
		return dskills;
	}

	/**
	 * Name of the method to roll on the Actor class to roll the appropriate check
	 *
	 * @return string Of method name associated with the appropriate check
	 */
	skillRollMethod() {
		return 'rollSkill';
	}
	
	handleCustomRoll(actor, event, rollMethod, rolledType, failRoll, dc, ...args) {
		const key = args[0];
		actor[rollMethod].call(actor, key, false)
		return true;
	}
}
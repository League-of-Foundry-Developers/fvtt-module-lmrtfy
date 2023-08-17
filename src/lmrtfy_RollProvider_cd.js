class lmrtfy_RollProvider_cd extends lmrtfy_RollProvider {
	/**
	 * The system identifier for this specific RollProvider.
	 *
	 * @return string Identifying the System.
	 */
	systemIdentifiers() {
		return 'foundry-chromatic-dungeons';
	}
	
	/**
	 * Where all of the Abilities are defined for this system.
	 *
	 * @return array Of Abilities
	 */
	abilities() {
		return CONFIG.CHROMATIC.attributeLabels;
	}

	/**
	 * Where all of the Abilities Abbreviations are defined for this system, if any.
	 *
	 * @return array Of Abilities with Abbreviations
	 */
	abilityAbbreviations() {
		return CONFIG.CHROMATIC.attributeAbbreviations;
	}

	/**
	 * Where all of the Ability Modifiers are defined for this system.
	 *
	 * @return array Of Ability Modifiers
	 */
	abilityModifiers() {
		return parseAbilityModifiers();
	}

	/**
	 * Name of the method to roll on the Actor class to roll the appropriate check
	 *
	 * @return string Of method name associated with the appropriate check
	 */
	abilityRollMethod() {
		return 'attributeRoll';
	}

	/**
	 * Name of the method to roll on the Actor class to roll the appropriate check
	 *
	 * @return string Of method name associated with the appropriate check
	 */
	saveRollMethod() {
		return 'saveRoll';
	}

	/**
	 * Where all of the Saves are defined for this system.
	 *
	 * @return array Of Saves
	 */
	saves() {
		return CONFIG.CHROMATIC.saves;
	}

	handleCustomRoll(actor, event, rollMethod, rolledType, failRoll, dc, ...args) {
		const key = args[0];
		const {attributes, attributeMods, saves} = actor.system.data;
		let label, formula, target;

		switch (rollMethod) {
			case 'attributeRoll':
				label = LMRTFY.currentRollProvider.abilities()[key];
				formula = `1d20-${attributeMods[key]}`;
				target = attributes[key];
				break;
			case 'saveRoll':
				label = LMRTFY.currentRollProvider.saves()[key];
				formula = `1d20+${saves.mods[key]}`;
				target = saves.targets[key];
				break;
		}

		actor[rollMethod](game.i18n.localize(label), formula, target);
		
		return true;
	}
}
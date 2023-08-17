class lmrtfy_RollProvider_sf1e extends lmrtfy_RollProvider {
	/**
	 * The system identifier for this specific RollProvider.
	 *
	 * @return string Identifying the System.
	 */
	systemIdentifiers() {
		return 'sfrpg';
	}
	
	/**
	 * Where all of the Abilities are defined for this system.
	 *
	 * @return array Of Abilities
	 */
	abilities() {
		return CONFIG.SFRPG.abilities;
	}

	/**
	 * Where all of the Abilities Abbreviations are defined for this system, if any.
	 *
	 * @return array Of Abilities with Abbreviations
	 */
	abilityAbbreviations() {
		return CONFIG.SFRPG.abilities;
	}


	/**
	 * Name of the method to roll on the Actor class to roll the appropriate check
	 *
	 * @return string Of method name associated with the appropriate check
	 */
	abilityRollMethod() {
		return 'rollAbility';
	}

	/**
	 * lmrtfy_RollEvent that is checked for special keys if a specific roll event is run.
	 *
	 * @return lmrtfy_RollEvent for this Event
	 */
	advantageRollEvent() {
		return new lmrtfy_RollEvent();
	}

	/**
	 * lmrtfy_RollEvent that is checked for special keys if a specific roll event is run.
	 *
	 * @return lmrtfy_RollEvent for this Event
	 */
	disadvantageRollEvent() {
		return new lmrtfy_RollEvent();
	}

	/**
	 * lmrtfy_RollEvent that is checked for special keys if a specific roll event is run.
	 *
	 * @return lmrtfy_RollEvent for this Event
	 */
	normalRollEvent() {
		return new lmrtfy_RollEvent();
	}

	/**
	 * Name of the method to roll on the Actor class to roll the appropriate check
	 *
	 * @return string Of method name associated with the appropriate check
	 */
	saveRollMethod() {
		return 'rollSave';
	}

	/**
	 * Where all of the Saves are defined for this system.
	 *
	 * @return array Of Saves
	 */
	saves() {
		return CONFIG.SFRPG.saves;
	}

	/**
	 * Where all of the Skills are defined for this system.
	 *
	 * @return array Of Skills
	 */
	skills() {
		return CONFIG.SFRPG.skills;
	}

	/**
	 * Name of the method to roll on the Actor class to roll the appropriate check
	 *
	 * @return string Of method name associated with the appropriate check
	 */
	skillRollMethod() {
		return 'rollSkill';
	}

	/**
	 * Array of special rolls:
	 *  initiative
	 *  deathsave
	 *  perception
	 *
	 * @return array Containing special rolls that might be used for this System
	 */
	specialRolls() {
		return {'initiative': true, 'perception': true};
	}
}
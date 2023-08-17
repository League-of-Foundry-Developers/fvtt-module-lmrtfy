class lmrtfy_RollProvider_ffd20 extends lmrtfy_RollProvider {
	/**
	 * The system identifier for this specific RollProvider.
	 *
	 * @return string Identifying the System.
	 */
	systemIdentifiers() {
		return 'ffd20';
	}
	
	/**
	 * Where all of the Abilities are defined for this system.
	 *
	 * @return array Of Abilities
	 */
	abilities() {
		return CONFIG.FFD20.abilities;
	}

	/**
	 * Where all of the Abilities Abbreviations are defined for this system, if any.
	 *
	 * @return array Of Abilities with Abbreviations
	 */
	abilityAbbreviations() {
		return CONFIG.abilitiesShort;
	}

	/**
	 * Name of the method to roll on the Actor class to roll the appropriate check
	 *
	 * @return string Of method name associated with the appropriate check
	 */
	abilityRollMethod() {
		return 'rollAbilityTest';
	}

	/**
	 * Name of the method to roll on the Actor class to roll the appropriate check
	 *
	 * @return string Of method name associated with the appropriate check
	 */
	saveRollMethod() {
		return 'rollSavingThrow';
	}

	/**
	 * Where all of the Saves are defined for this system.
	 *
	 * @return array Of Saves
	 */
	saves() {
		return CONFIG.FFD20.savingThrows;
	}

	/**
	 * Where all of the Skills are defined for this system.
	 *
	 * @return array Of Skills
	 */
	skills() {
		return CONFIG.FFD20.skills;
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
		return { 'initiative': true, 'deathsave': false, 'perception': false };
	}
}
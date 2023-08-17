class lmrtfy_RollProvider_pf1 extends lmrtfy_RollProvider {
	systemIdentifiers() {
		return 'pf1';
	}
	abilities() {
		return CONFIG.PF1.abilities;
	}

	abilityAbbreviations() {
		return CONFIG.PF1.abilitiesShort;
	}

	abilityRollMethod() {
		return 'rollAbility';
	}

	advantageRollEvent() {
		return new lmrtfy_RollEvent(false, true, false);
	}

	disadvantageRollEvent() {
		return new lmrtfy_RollEvent(false, false, true);
	}

	normalRollEvent() {
		return new lmrtfy_RollEvent(false, false, false);
	}

	saveRollMethod() {
		return 'rollSavingThrow';
	}

	saves() {
		return CONFIG.PF1.savingThrows;
	}

	skills() {
		return CONFIG.PF1.skills;
	}

	skillRollMethod() {
		return 'rollSkill';
	}

	specialRolls() {
		return {'initiative': true, 'deathsave': false, 'perception': false};
	}
}
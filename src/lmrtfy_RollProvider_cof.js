class lmrtfy_RollProvider_cof extends lmrtfy_RollProvider {
	systemIdentifiers() {
		return 'cof';
	}
	
	
	abilities() {
		return CONFIG.COF.stats;
	}

	abilityAbbreviations() {
		return CONFIG.COF.statAbbreviations;
	}

	abilityRollMethod() {
		return 'rollStat';
	}

	advantageRollEvent() {
		return new lmrtfy_RollEvent( false, false, false );
	}

	disadvantageRollEvent() {
		return new lmrtfy_RollEvent( false, false, false );
	}

	normalRollEvent() {
		return new lmrtfy_RollEvent( false, false, false );
	}

	saveRollMethod() {
		return 'rollStat';
	}

	skills() {
		return CONFIG.COF.skills;
	}

	skillRollMethod() {
		return 'rollStat';
	}

	specialRolls() {
		return {};
	}
}
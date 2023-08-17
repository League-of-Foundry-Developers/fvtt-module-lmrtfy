class lmrtfy_RollProvider_coc extends lmrtfy_RollProvider_cof {
	systemIdentifiers() {
		return 'coc';
	}
	
	abilities() {
		return CONFIG.COC.stats;
	}

	abilityAbbreviations() {
		return CONFIG.COC.statAbbreviations;
	}

	skills() {
		return CONFIG.COC.skills;
	}

	specialRolls() {
		return {};
	}
}
class lmrtfy_RollProvider_ose extends lmrtfy_RollProvider {
	/**
	 * The system identifier for this specific RollProvider.
	 *
	 * @return string Identifying the System.
	 */
	systemIdentifiers() {
		return 'ose';
	}
	
	
	abilities() {
		return CONFIG.OSE.scores;
	}

	abilityAbbreviations() {
		return CONFIG.OSE.scores_short;
	}

	abilityRollMethod() {
		return 'rollCheck';
	}

	canFailChecks() {
		return game.settings.get('lmrtfy', 'showFailButtons');
	}
	
	modIdentifier() {
		return 'modifier';
	}

	saveRollMethod() {
		return 'rollSave';
	}

	saves() {
		return CONFIG.OSE.saves_long;
	}

	skills() {
		return CONFIG.OSE.exploration_skills;
	}

	skillRollMethod() {
		return 'rollExploration';
	}
}
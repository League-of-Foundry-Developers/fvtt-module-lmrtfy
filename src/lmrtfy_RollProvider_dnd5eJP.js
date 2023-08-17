class lmrtfy_RollProvider_dnd5eJP extends lmrtfy_RollProvider_dnd5e {
	systemIdentifiers() {
		return 'dnd5eJP';
	}
	
	advantageRollEvent() {
		return new lmrtfy_RollEvent(false, true, false);
	}
	
	disadvantageRollEvent() {
		return new lmrtfy_RollEvent(false, false, true);
	}
	
	normalRollEvent() {
		return new lmrtfy_RollEvent(true, false, false);
	}
}
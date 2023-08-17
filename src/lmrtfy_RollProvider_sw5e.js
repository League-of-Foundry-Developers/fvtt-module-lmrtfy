class lmrtfy_RollProvider_sw5e extends lmrtfy_RollProvider_dnd5e {
	systemIdentifiers() {
		return 'sw5e';
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
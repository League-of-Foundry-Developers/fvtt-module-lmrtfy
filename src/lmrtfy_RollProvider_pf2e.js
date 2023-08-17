class lmrtfy_RollProvider_pf2e extends lmrtfy_RollProvider_pf1 {
	systemIdentifiers() {
		return 'pf2e';
	}
	abilities() {
		return CONFIG.PF2E.abilities;
	}

	abilityAbbreviations() {
		return CONFIG.PF2E.abilities;
	}
	
	buildAbilityModifier(actor, ability) {
        const modifiers = [];

        const mod = game.pf2e.AbilityModifier.fromScore(ability, actor.data.data.abilities[ability].value);
        modifiers.push(mod);

        [`${ability}-based`, 'ability-check', 'all'].forEach((key) => {
            (actor.synthetics.statisticsModifier[key] || []).forEach((m) => modifiers.push(m.clone()));
        });
        
        return new game.pf2e.StatisticModifier(`${game.i18n.localize('LMRTFY.AbilityCheck')} ${game.i18n.localize(mod.label)}`, modifiers);
    }
	
	handleCustomRoll(actor, event, rollMethod, rolledType, failRoll, dc, ...args) {
		switch (rolledType) {
			case roller.rollTypes().ABILITY:
				const modifier = this.buildAbilityModifier(actor, args[0]);
				game.pf2e.Check.roll(modifier, { type: 'skill-check', dc: this.dc, actor }, event);
				break;

			case this.rollTypes().SAVE:
				const save = actor.saves[args[0]].check;
				const saveOptions = actor.getRollOptions(['all', `${save.ability}-based`, 'saving-throw', save.name]);
				save.roll({ event, saveOptions, dc: this.dc });
				break;

			case this.rollTypes().SKILL:
				// system specific roll handling
				const skill = actor.system.skills[args[0]];
				// roll lore skills only for actors who have them ...
				if (!skill) continue;

				const skillOptions = actor.getRollOptions(['all', `${skill.ability ?? 'int'}-based`, 'skill-check', skill.name]);
				skill.roll({ event, skillOptions, dc: this.dc });
				break;

			case this.rollTypes().PERCEPTION:
				const precOptions = actor.getRollOptions(['all', 'wis-based', 'perception']);
				actor.perception.roll({ event, precOptions, dc: this.dc });
				break;
		}
		return true;
	}
	
	handleInitiativeRoll(event, mode, actors) {
		// save the current roll mode to reset it after this roll
        const rollMode = game.settings.get("core", "rollMode");
        game.settings.set("core", "rollMode", mode || CONST.DICE_ROLL_MODES);

        for (let actor of actors) {
            const initiative = actor.data.data.attributes.initiative;
            const rollNames = ['all', 'initiative'];
            if (initiative.ability === 'perception') {
                rollNames.push('wis-based');
                rollNames.push('perception');
            } else {
                const skill = actor.data.data.skills[initiative.ability];
                rollNames.push(`${skill.ability}-based`);
                rollNames.push(skill.name);
            }
            const options = actor.getRollOptions(rollNames);
            initiative.roll({ event, options });
        }

        game.settings.set("core", "rollMode", rollMode);

        event.currentTarget.disabled = true;
		
		return {isHandled: true, checkClose: true};
	}
	
	handleDeathSave(actors, event) {
		for (let actor of this.actors) {
			actor.rollRecovery();
		}
		event.currentTarget.disabled = true;
		return {isHandled: true, checkClose: true};
	}
	

	saveRollMethod() {
		return 'rollSave';
	}

	saves() {
		return CONFIG.PF2E.saves;
	}

	skills() {
		return CONFIG.PF2E.skills;
	}

	skillRollMethod() {
		return 'rollSkill';
	}

	specialRolls() {
		return {'initiative': true, 'deathsave': true, 'perception': true};
	}
	
	useDC() {
		return true;
	}
}
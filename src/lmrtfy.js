class LMRTFY {
    static async init() {
        game.settings.register('lmrtfy', 'enableParchmentTheme', {
            name: game.i18n.localize('LMRTFY.EnableParchmentTheme'),
            hint: game.i18n.localize('LMRTFY.EnableParchmentThemeHint'),
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => LMRTFY.onThemeChange(value)
        });
        game.settings.register('lmrtfy', 'deselectOnRequestorRender', {
            name: game.i18n.localize('LMRTFY.DeselectOnRequestorRender'),
            hint: game.i18n.localize('LMRTFY.DeselectOnRequestorRenderHint'),
            scope: 'world',
            config: true,
            type: Boolean,
            default: false,
            onChange: () => window.location.reload()
        });
        game.settings.register('lmrtfy', 'useTokenImageOnRequester', {
            name: game.i18n.localize('LMRTFY.UseTokenImageOnRequester'),
            hint: game.i18n.localize('LMRTFY.UseTokenImageOnRequesterHint'),
            scope: 'world',
            config: true,
            type: Boolean,
            default: false,
            onChange: () => window.location.reload()
        });

        var showFailButtonSetting = false;
        if (game.system.id === 'dnd5e') {
            showFailButtonSetting = true;
        }
        game.settings.register('lmrtfy', 'showFailButtons', {
            name: game.i18n.localize('LMRTFY.ShowFailButtons'),
            hint: game.i18n.localize('LMRTFY.ShowFailButtonsHint'),
            scope: 'world',
            config: showFailButtonSetting,
            type: Boolean,
            default: showFailButtonSetting, // if it's DnD 5e default to true
            onChange: () => window.location.reload()
        });

        Handlebars.registerHelper('lmrtfy-controlledToken', function (actor) {
            const actorsControlledToken = canvas.tokens?.controlled.find(t => t.actor.id === actor.id);
            if (actorsControlledToken) {
                return true;
            } else {
                return false;
            }
        });

        Handlebars.registerHelper('lmrtfy-showTokenImage', function (actor) {
            if (game.settings.get('lmrtfy', 'useTokenImageOnRequester')) {
                return true;
            } else {
                return false;
            }
        });
    }

    static ready() {
        game.socket.on('module.lmrtfy', LMRTFY.onMessage);
        
        var externalRollProviders = [
            new lmrtfy_RollProvider_cd(),
            new lmrtfy_RollProvider_coc(),
            new lmrtfy_RollProvider_cof(),
            new lmrtfy_RollProvider_degenesis(),
            new lmrtfy_RollProvider_dnd5e(),
            new lmrtfy_RollProvider_dnd5eJP(),
            new lmrtfy_RollProvider_dnd35(),
            new lmrtfy_RollProvider_ffd20(),
            new lmrtfy_RollProvider_ose(),
            new lmrtfy_RollProvider_pf1(),
            new lmrtfy_RollProvider_pf2e(),
            new lmrtfy_RollProvider_sf1e(),
            new lmrtfy_RollProvider_sw5e()
        ];
        
        for (var i = 0; i < externalRollProviders.length; i++) {
            if (externalRollProviders[i].systemIdentifiers() == game.system.id) {
                LMRTFY.currentRollProvider = externalRollProviders[i];
                break;
            }
        }

        if (!LMRTFY.currentRollProvider) {
            console.error('LMRFTY | Unsupported system detected');
        }

        LMRTFY.d20Svg = '<svg class="lmrtfy-dice-svg-normal" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"' +
            'viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">' +
            '<g transform="translate(-246.69456,-375.66745)">' +
                '<path d="M278.2,382.1c-0.1,0-0.2,0-0.3,0.1L264.8,398c-0.2,0.3-0.2,0.3,0.1,0.3l26.4-0.1c0.4,0,0.4,0,0.1-0.3l-13-15.8' +
                'C278.4,382.1,278.3,382.1,278.2,382.1L278.2,382.1z M280.7,383.5l11.9,14.5c0.2,0.2,0.2,0.2,0.5,0.1l6.3-2.9' +
                'c0.4-0.2,0.4-0.2,0.1-0.4L280.7,383.5z M275.2,384c0,0-0.1,0.1-0.3,0.2l-17.3,11.4l5.4,2.5c0.3,0.1,0.4,0.1,0.5-0.1l11.4-13.6' +
                'C275.1,384.1,275.2,384,275.2,384L275.2,384z M300.3,395.8c-0.1,0-0.1,0-0.3,0.1l-6.4,2.9c-0.2,0.1-0.2,0.2-0.1,0.4l7.5,19' +
                'l-0.5-22.1C300.4,395.9,300.4,395.8,300.3,395.8L300.3,395.8z M257.1,396.4l-0.7,21.5l6.3-18.6c0.1-0.3,0.1-0.3-0.1-0.4' +
                'L257.1,396.4L257.1,396.4z M291.6,399.2l-27,0.1c-0.4,0-0.4,0-0.2,0.3l13.7,23.1c0.2,0.4,0.2,0.3,0.4,0l13.2-23.2' +
                'C291.9,399.3,291.9,399.2,291.6,399.2L291.6,399.2z M292.7,399.8c0,0-0.1,0.1-0.1,0.2l-13.3,23.3c-0.1,0.2-0.2,0.3,0.2,0.3' +
                'l21.1-2.9c0.3-0.1,0.3-0.2,0.2-0.5l-7.9-20.2C292.7,399.9,292.7,399.8,292.7,399.8L292.7,399.8z M263.6,400c0,0,0,0.1-0.1,0.3' +
                'l-6.7,19.8c-0.1,0.4-0.1,0.6,0.3,0.7l20.1,2.9c0.4,0.1,0.3-0.1,0.2-0.3l-13.7-23.1C263.6,400,263.6,400,263.6,400L263.6,400z' +
                'M258.3,421.9l19.7,11.2c0.3,0.2,0.3,0.1,0.3-0.2l-0.4-7.9c0-0.3,0-0.4-0.3-0.4L258.3,421.9L258.3,421.9z M299.1,421.9l-20,2.8' +
                'c-0.3,0-0.2,0.2-0.2,0.4l0.4,8c0,0.2,0,0.3,0.3,0.2L299.1,421.9z"/>' +
            '</g>' +
        '</svg>';

        // for now we don't allow can fails until midi-qol has update patching.js
        if (game.modules.get("midi-qol")?.active && !isNewerVersion(game.modules.get("midi-qol")?.version, "10.0.26")) {
            LMRTFY.currentRollProvider.overrideFailChecks(false);
        }

        if (game.settings.get('lmrtfy', 'deselectOnRequestorRender')) {
            Hooks.on("renderLMRTFYRequestor", () => {
                canvas.tokens.releaseAll();
            })
        }
    }
   

    static onMessage(data) {
        //console.log("LMRTF got message: ", data)
        if (data.user === "character" &&
            (!game.user.character || !data.actors.includes(game.user.character.id))) {
            return;
        } else if (!["character", "tokens"].includes(data.user) && data.user !== game.user.id) {
            return;
        }
        
        let actors = [];
        if (data.user === "character") {
            actors = [game.user.character];
        } else if (data.user === "tokens") {
            actors = canvas.tokens.controlled.map(t => t.actor).filter(a => data.actors.includes(a.id));
        } else {
            actors = data.actors.map(aid => LMRTFY.fromUuid(aid));
        }
        actors = actors.filter(a => a);
        
        // remove player characters from GM's requests
        if (game.user.isGM) {
            actors = actors.filter(a => !a.hasPlayerOwner);
        }        
        if (actors.length === 0) return;
        new LMRTFYRoller(actors, data).render(true);
    }
    static requestRoll() {
        if (LMRTFY.requestor === undefined)
            LMRTFY.requestor = new LMRTFYRequestor();
        LMRTFY.requestor.render(true);
    }

    static onThemeChange(enabled) {
        $(".lmrtfy.lmrtfy-requestor,.lmrtfy.lmrtfy-roller").toggleClass("lmrtfy-parchment", enabled)
        if (!LMRTFY.requestor) return;
        if (enabled)
            LMRTFY.requestor.options.classes.push("lmrtfy-parchment")
        else
            LMRTFY.requestor.options.classes = LMRTFY.requestor.options.classes.filter(c => c !== "lmrtfy-parchment")
        // Resize to fit the new theme
        if (LMRTFY.requestor.element.length)
            LMRTFY.requestor.setPosition({ width: "auto", height: "auto" })
    }

    static getSceneControlButtons(buttons) {
        let tokenButton = buttons.find(b => b.name == "token")

        if (tokenButton) {
            tokenButton.tools.push({
                name: "request-roll",
                title: game.i18n.localize('LMRTFY.ControlTitle'),
                icon: "fas fa-dice-d20",
                visible: game.user.isGM,
                onClick: () => LMRTFY.requestRoll(),
                button: true
            });
        }
    }

    static async hideBlind(app, html, msg) {
        if (msg.message.flags && msg.message.flags.lmrtfy) {
            if (msg.message.flags.lmrtfy.blind && !game.user.isGM) {
                msg.content = '<p>??</p>';

                let idx = html[0].innerHTML.indexOf('<div class="message-content">');
                html[0].innerHTML = html[0].innerHTML.substring(0, idx);
                html[0].innerHTML += `<div class="message-content">${msg.content}</div>`;
            }
        }
    }

    static fromUuid(uuid) {
        let parts = uuid.split(".");
        let doc;

        if (parts.length === 1) return game.actors.get(uuid);
        // Compendium Documents
        if (parts[0] === "Compendium") {
            return undefined;
        }

        // World Documents
        else {
            const [docName, docId] = parts.slice(0, 2);
            parts = parts.slice(2);
            const collection = CONFIG[docName].collection.instance;
            doc = collection.get(docId);
        }

        // Embedded Documents
        while (parts.length > 1) {
            const [embeddedName, embeddedId] = parts.slice(0, 2);
            doc = doc.getEmbeddedDocument(embeddedName, embeddedId);
            parts = parts.slice(2);
        }
        if (doc.actor) doc = doc.actor;
        return doc || undefined;
    }
}

globalThis.LMRTFYRequestRoll = LMRTFY.requestRoll;

Hooks.once('init', LMRTFY.init);
Hooks.on('ready', LMRTFY.ready);
Hooks.on('getSceneControlButtons', LMRTFY.getSceneControlButtons);
Hooks.on('renderChatMessage', LMRTFY.hideBlind);

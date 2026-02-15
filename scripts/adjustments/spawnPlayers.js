import {cModuleName, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAspawnPlayers extends regionbaBasic {
	static type = cModuleName + ".spawnPlayers";
	
	static Settings = {
		onlySpawnActiveUsers : {
			default : () => {return true},
			configDialog : true
		}
	}

	static Support() {
		return {
		
		}
	}
	
	static overrideMethods() {
		const cBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;

		cBehaviorType.RBAspawnActor = function() {
			let vRelevantUsers = [...game.users];
			
			if (this.regionba.onlySpawnActiveUsers) vRelevantUsers = vRelevantUsers.filter(vUser => vUser.active);
			
			return vRelevantUsers;
		}

		cBehaviorType.RBAonView = async function(pEvent) {
			if ( !game.user.isActiveGM ) return;
			
			const cCharacters = this.RBAspawnActor().map(vUser => vUser.character).filter(vCharacter => vCharacter);
			const cPrototypeTokens = cCharacters.map(vCharacter => vCharacter.prototypeToken).filter(vToken => vToken);
			
			for (const cPrototype of cPrototypeTokens) {
				if (!canvas.tokens.placeables.find(vToken => vToken.actor == cPrototype.actor)) {
					const cNewToken = await foundry.documents.TokenDocument.implementation.create({...cPrototype.toObject(), actorId : cPrototype.actor.id}, {parent: this.region.parent});
					
					this.region.teleportToken(cNewToken);
				}
			}
		}
		
		CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.BEHAVIOR_VIEWED] = cBehaviorType.RBAonView;
	}
}
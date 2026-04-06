import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAchangeAppearance extends regionbaBasic {
	static type = cModuleName + ".changeAppearance";
	
	static Settings = {
		appearanceDocuments : {
			default : () => {return []},
			configDialog : true,
			objectType : "placeables",
			validSelectable : (pPlaceable) => {return ["Tile", "Token"].includes(pPlaceable.documentName)}
		},
		appearanceImageList : {
			default : () => {return []},
			configDialog : true,
			isFile : true,
			type : "image"
		},
		loopAppearance : {
			default : () => {return true},
			configDialog : true
		},	
		playerTokensTriggeronly : {
			default : () => {return false},
			configDialog : true
		},			
		once : {
			default : () => {return false},
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
		
		cBehaviorType.validDocuments = function() {
			let vDocuments = this.regionba.appearanceDocuments.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			return [...new Set(vDocuments)];
		}
		
		cBehaviorType._handleRegionEvent = async function(pEvent) {
			if ( !game.user.isActiveGM ) return;
			
			const cToken = pEvent.data.token;
			
			if (this.regionba.playerTokensTriggeronly) {
				if (!utils.isPlayerToken(cToken)) return;
			}
			
			if (this.regionba.once) {
				this.parent.update({
					disabled: true
				});
			}
			
			let vPlaceables = this.validDocuments();
			
			if (this.regionba.appearanceImageList.length > 0) {
				for (let vPlaceable of vPlaceables) {
					const vCurrentImage = vPlaceable.texture.src || "";
					const vCurrentID = this.regionba.appearanceImageList.indexOf(vCurrentImage);

					if (vCurrentID < (this.regionba.appearanceImageList.length-1) || this.regionba.loopAppearance) {
						const cNextID = (vCurrentID + 1)%this.regionba.appearanceImageList.length;
						
						if (cNextID >= 0) {
							await vPlaceable.update({texture : {src : this.regionba.appearanceImageList[cNextID]}})
						}
					}
				}
			}
		}
	}
}
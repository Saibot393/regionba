import {cModuleName, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAping extends regionbaBasic {
	static type = cModuleName + ".ping";
	
	static Settings = {
		pingLocation : {
			default : () => {return []},
			configDialog : true,
			objectType : "position",
			positionType : "localxy"
		},
		pingColor : {
			default : () => {return "#000000"},
			isColor : true,
			configDialog : true
		},
		pingDuration : {
			default : () => {return 1},
			configDialog : true,
			range : {
				min : 0.1,
				max : 10,
				step : 0.1
			}
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
		const PingRegionBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;

		PingRegionBehaviorType._handleRegionEvent = async function(pEvent) {
			if (this.regionba.once) {
				if (game.user.isActiveGM) {
					this.parent.update({
						disabled: true
					});
				}
			}
			
			const cUser = pEvent.user;
			if ( !cUser.isSelf ) return;
			
			//CONFIG.Canvas.pings.types
			canvas.ping({x : this.regionba.pingLocation[0], y : this.regionba.pingLocation[1]}, {style : "pulse", duration :  1000 * this.regionba.pingDuration, color : this.regionba.pingColor});
			
		}
	}
}
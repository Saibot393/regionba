import {cModuleName, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAping extends regionbaBasic {
	static type = cModuleName + ".ping";
	
	static Settings = {
		pingPosition : {
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
		pingTokensonRegion : {
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
		const PingRegionBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;

		PingRegionBehaviorType.pingPosition = function() {
			let vPositions = [];
			
			if (this.regionba.pingPosition.length >= 2) {
				vPositions.push({x : this.regionba.pingPosition[0], y : this.regionba.pingPosition[1]});
			}
			
			if (this.regionba.pingTokensonRegion) {
				vPositions = vPositions.concat([...this.region.tokens].map(vToken => vToken.object).filter(vToken => vToken).map(vToken => vToken.center));
			}
			
			return vPositions;
		}

		PingRegionBehaviorType._handleRegionEvent = function(pEvent) {
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
			for (const cPosition of this.pingPosition()) {
				canvas.ping(cPosition, {style : "pulse", duration :  1000 * this.regionba.pingDuration, color : this.regionba.pingColor});
			}
		}
	}
}
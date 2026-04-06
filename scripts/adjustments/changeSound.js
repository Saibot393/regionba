import {cModuleName, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAchangeSound extends regionbaBasic {
	static type = cModuleName + ".changeSound";
	
	static Settings = {
	}

	static Support() {
		return {
			soundDocuments : {
				default : () => {return ""},
				configDialog : true,
				isTextBlock : true
			}
		}
	}
	
	static overrideMethods() {
		const cBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;


		cBehaviorType._handleRegionEvent = function(pEvent) {
			
		}
	}
}
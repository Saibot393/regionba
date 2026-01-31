export const cModuleName = "regionba";
export const cModuleAbbr = "RBA";

export class utils {
	static selectedPlaceables() {
		let vSelected = [];
		
		for (const cType of ["tokens", "tiles", "walls", "lights"]) {
			const cTypeSelected = canvas[cType]?.controlled;
			
			if (cTypeSelected) {
				vSelected = vSelected.concat(cTypeSelected);
			}
		}
		
		return vSelected.map(vSelected => vSelected.document);
	}
	
	static isDoor(pWall) {
		if (pWall.documentName == "Wall") {
			return pWall.door > 0;
		}
	
		return undefined;
	}
	
	static doorHidden(pWall) {
		if (utils.isDoor(pWall)) {
			return pWall.door == 2;
		}
		
		return undefined;
	}
	
	static async setDoorHidden(pWall, pHidden) {
		if (utils.isDoor(pWall)) {
			const cTargetState = pHidden ? 2 : 1;
			
			if (pWall.door != cTargetState) {
				await pWall.update({door : cTargetState});
			}
		}
		
		return undefined;
	}
}

export function Translate(pPath, pWords = {}) {
	let vContent = game.i18n.localize(pPath);
	
	for (let vWord of Object.keys(pWords)) {
		vContent = vContent.replace("{" + vWord + "}", pWords[vWord]);
	}
 
	return vContent;
}
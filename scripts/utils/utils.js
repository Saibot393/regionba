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
}

export function Translate(pPath, pWords = {}) {
	let vContent = game.i18n.localize(pPath);
	
	for (let vWord of Object.keys(pWords)) {
		vContent = vContent.replace("{" + vWord + "}", pWords[vWord]);
	}
 
	return vContent;
}
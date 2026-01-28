export const cModuleName = "regionba";

export class utils {
	
}

export function Translate(pPath, pWords = {}) {
	let vContent = game.i18n.localize(pPath);
	
	for (let vWord of Object.keys(pWords)) {
		vContent = vContent.replace("{" + vWord + "}", pWords[vWord]);
	}
 
	return vContent;
}
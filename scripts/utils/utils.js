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
	
	static isPlayerToken(pToken) {
		return [...game.users].find(vUser => vUser.character == pToken.actor);
	}
	
	static findIteminActor(pActor, pItem) {
		if (pActor?.items) {
			const cInventory = [...pActor.items];
			
			console.log(cInventory);
			console.log(cInventory.map(vItem => vItem._stats.compendiumSource));
			return cInventory.find(vItem => [vItem._stats.compendiumSource, vItem._stats.duplicateSource].includes(pItem.uuid))
		}
	}
	
	static async giveItemtoActor(pActor, pItem) {
		if (pActor && pItem) {
			const cCreateItem = pItem.clone({}, {addSource : true});
			
			const cTokenItem = await pActor.createEmbeddedDocuments("Item", [cCreateItem]);
			
			if (cTokenItem.length) {
				return cTokenItem[0];
			}
		}
	}
}

export function Translate(pPath, pWords = {}) {
	let vContent = game.i18n.localize(pPath);
	
	for (let vWord of Object.keys(pWords)) {
		vContent = vContent.replace("{" + vWord + "}", pWords[vWord]);
	}
 
	return vContent;
}
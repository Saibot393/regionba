import {cModuleName, cModuleAbbr, utils, Translate} from "../utils/utils.js";

export class customInputs {
	static canvasSelector(pElementName, pButton) {
		const cElement = document.createElement(pElementName);
		cElement.style.display = "flex";
		cElement.style.flexDirection = "row";
		
		const cInput = document.createElement("input");
		cInput.type = "text";
	
		const cSelect = document.createElement("button");
		cSelect.classList.add("icon", ...pButton.icon);
		cSelect.style.marginLeft = "5px";
		
		cSelect.onclick = (pEvent) => {
			pEvent.stopPropagation();
			pEvent.preventDefault();
			pButton.onclick(pEvent, (pValue) => {cInput.value = pValue})
		};
		
		cElement.appendChild(cInput);
		cElement.appendChild(cSelect);
		
		Object.defineProperty(cElement, "value", {
			get() {
				return cInput.value.split(",")
			},
			set(pValue) {
				cInput.value = pValue.join(",");
			}
		});
		
		return cElement;
	}
	
	static position(pPositionType) {
		let vButtonClick;
	
		switch (pPositionType) {
			case "localxy":
				vButtonClick = (pEvent, pSetInput) => {
					Hooks.once(cModuleName + ".onCanvasClick", (pEvent) => {try {pSetInput([pEvent.clientX, pEvent.clientY].join(","))} catch {}})
				}
			break;
			break;
		}
		
		return customInputs.canvasSelector(cModuleAbbr+"position", {onclick : vButtonClick, icon : ["fa-solid", "fa-bullseye"], hint : ""});
	}
	
	static placeables(pSelectedableValidation) {
		const cButtonClick = (pEvent, pSetInput) => {
			pSetInput(utils.selectedPlaceables().filter(vPlaceable => pSelectedableValidation(vPlaceable)).map(vPlaceable => vPlaceable.uuid));
		}
		
		return customInputs.canvasSelector(cModuleAbbr+"placeable", {onclick : cButtonClick, icon : ["fa-solid", "fa-file-circle-plus"], hint : ""});
	}
}
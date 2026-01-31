import {cModuleName, cModuleAbbr, utils, Translate} from "../utils/utils.js";

export class customInputs {
	static range(pRange) {
		const cRange = document.createElement("RBARange");
		cRange.style.display = "flex";
		cRange.style.flexDirection = "row";
		
		const cNumberLine = document.createElement("input");
		cNumberLine.type = "range";
		
		const cNumberInput = document.createElement("input");
		cNumberInput.type = "number";
		cNumberInput.style.width = "40px";
		cNumberInput.style.marginLeft = "5px";
		
		for (const cKey of Object.keys(pRange)) {
			for (const cObject of [cRange, cNumberLine, cNumberInput]) {
				cObject[cKey] = pRange[cKey];
			}
		}
		
		cNumberLine.onchange = (pEvent) => {if (cNumberInput.value != cNumberLine.value) cNumberInput.value = cNumberLine.value};
		cNumberLine.oninput = cNumberLine.onchange;
		cNumberInput.onchange = (pEvent) => {if (cNumberLine.value != cNumberInput.value) cNumberLine.value = cNumberInput.value};
		
		Object.defineProperty(cRange, "value", {
			get() {
				return cNumberLine.value;
			},
			set(pValue) {
				cNumberLine.value = pValue;
				cNumberInput.value = pValue;
			}
		});
		
		cRange.appendChild(cNumberLine);
		cRange.appendChild(cNumberInput);
		
		return cRange;
	}
	
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
			pButton.onclick(pEvent, {setValue : (pValue) => {cInput.value = pValue}, addValue : (pValue) => {cInput.value += (cInput.value ? "," : "") + pValue}})
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
				vButtonClick = (pEvent, pInput) => {
					Hooks.once(cModuleName + ".onCanvasClick", ({pEvent, pMousePosition}) => {try {pInput.setValue([Math.round(pMousePosition.x), Math.round(pMousePosition.y)].join(","))} catch {}})
				}
			break;
			break;
		}
		
		return customInputs.canvasSelector(cModuleAbbr+"position", {onclick : vButtonClick, icon : ["fa-solid", "fa-bullseye"], hint : ""});
	}
	
	static placeables(pSelectedableValidation) {
		const cButtonClick = (pEvent, pInput) => {
			if (pEvent.shiftKey) pInput.addValue(utils.selectedPlaceables().filter(vPlaceable => pSelectedableValidation(vPlaceable)).map(vPlaceable => vPlaceable.uuid))
			else pInput.setValue(utils.selectedPlaceables().filter(vPlaceable => pSelectedableValidation(vPlaceable)).map(vPlaceable => vPlaceable.uuid));
		}
		
		return customInputs.canvasSelector(cModuleAbbr+"placeable", {onclick : cButtonClick, icon : ["fa-solid", "fa-file-circle-plus"], hint : ""});
	}
}
import {cModuleName, utils, Translate} from "../utils/utils.js";

JSON.parse('["' + ["test",1].join('","') + '"]')

export class regionbaBasic {
	static onInit() {
		if (this.canInit()) {
			this.registerPropertyAccess();
			this.registerSettingDialog();
			this.overrideMethods();
		}
		else {
			throw new Error(`Region behaviour adjustment ${this.type} can not be initialised, it might be incompatible with this version`);
		}
	}
	
	static canInit() {
		return Boolean(CONFIG.RegionBehavior.dataModels[this.type]);
	}
	
	static type = "basic"; //OVERRIDE
	
	static Settings = {}; //OVERRIDE
	
	static Support() {return {}}; //OVERRIDE
	
	static overrideMethods() {}; //OVERRIDE
	
	static registerPropertyAccess() {
		const cSettings = this.Settings;
		const cSupport = this.Support();
		
		Object.defineProperty(CONFIG.RegionBehavior.dataModels[this.type].prototype, cModuleName, {
			get() {
				const cBehaviour = this;
				const cManagerObject = {};
				
				Object.defineProperty(cManagerObject, "Behaviour", {get() {return cBehaviour}});
				Object.defineProperty(cManagerObject, "Support", {get() {return cSupport}});
				
				for (const cFlag of Object.keys(cSettings)) {
					Object.defineProperty(cManagerObject, cFlag, {
						get() {
							if (this.Behaviour.parent.flags[cModuleName]?.[cFlag] != undefined) {
								if (typeof this.Behaviour.parent.flags[cModuleName][cFlag] == typeof cSettings[cFlag].default()) {
									return this.Behaviour.parent.flags[cModuleName][cFlag];
								}
							}
						
							return cSettings[cFlag].default();
						},
						set(pValue) {
							if (!cSettings[cFlag].preventSet) {
								if (typeof pValue == typeof cSettings[cFlag].default()) {
									let vValueWrap = {newValue : pValue, regionBehaviour : this.Behaviour, oldValue : this[cFlag], preventChange : false};
									
									if (cSettings[cFlag].hasOwnProperty("onSet")) {
										
										cSettings[cFlag].onSet(vValueWrap)
									}
									
									if (!vValueWrap.preventChange) this.Behaviour.parent.setFlag(cModuleName, cFlag, vValueWrap.newValue);
								}
								else {
									throw new Error(`Tried to set ${cModuleName} flag ${cFlag} to a value of type ${typeof pValue}, expected ${typeof cSettings[cFlag].default()}`);
								}
							}
							else {
								throw new Error(`Tried to set ${cModuleName} flag ${cFlag}, this flag does not want to be set, please respect its personal boundaries`)
							}
						}
					})
				}
				
				return cManagerObject;
			}
		})
	}
	
	static registerSettingDialog() {
		Hooks.on("renderRegionBehaviorConfig", (vRBC, vForm, vData, vOptions) => {
			if (vData.document.type == this.type) {
				const coldClick = vForm.querySelector(`button[type="submit"]`).onclick;
				
				vForm.querySelector(`button[type="submit"]`).onclick = (pEvent) => {
					vData.document.update({flags : {[cModuleName] : this.evaluateForm(vForm)}});
					
					if (coldClick) {
						coldClick(pEvent);
					}
				}
				
				this.addSettingstoDialog(vRBC, vForm, vData, vOptions, vData.document);
			}
		});
	}
	
	static settingType(pFlag) {
		if (this.Settings[pFlag].isMultiSelect || this.Settings[pFlag].isLevelSelect) {
			return "multiSelect";
		}
		else {
			if (this.Settings[pFlag].isColor) {
				return "color";
			}
			else {
				if (this.Settings[pFlag].hasOwnProperty("options")) {
					return "selection";
				}
				else {
					return typeof this.Settings[pFlag].default();
				}
			}
		}
	}
	
	static addSettingstoDialog(pRBC, pForm, pData, pOptions, pDocument) {
		const cSettingstoAdd =  Object.keys(this.Settings).filter(vKey => this.Settings[vKey].configDialog);
		console.log(this.Settings);
		if (cSettingstoAdd.length) {
			let vFieldSet = document.createElement("fieldset");
			vFieldSet.classList.add(cModuleName);
			let vLegend = document.createElement("legend");
			if (pDocument.system.isRBAcustom) {
				vLegend.innerText = Translate(`${cModuleName}.Titles.${pDocument.type}`);
			}
			else {
				vLegend.innerText = Translate(`${cModuleName}.Titles.${cModuleName}`);
			}
			vFieldSet.appendChild(vLegend);
			
			pForm.querySelector('section.standard-form[data-application-part="form"]').appendChild(vFieldSet); //makes it easier to identify problems
			
			let vonChange = (pEvent) => {
				let vUpdateData = this.evaluateForm(pForm);
				
				for (const cFlag of Object.keys(this.Settings).filter(vKey => this.Settings[vKey].configDialog)) {
					if (this.Settings[cFlag].hasOwnProperty("showinDialog")) {
						let vInput = vFieldSet.querySelector(`[id="${cModuleName}.${cFlag}"]`);

						let vFormGroup = vInput?.closest("div.form-group");

						if (vFormGroup) vFormGroup.style.display = this.Settings[cFlag].showinDialog(vUpdateData) ? "" : "none";
					}
				}
			}	
			
			for (const cFlag of cSettingstoAdd) {
				const cSettingType = this.settingType(cFlag);
				
				let vFormGroup = document.createElement("div");
				vFormGroup.classList.add("form-group");
				
				let vLabel = document.createElement("label");
				vLabel.innerText = Translate(`${cModuleName}.Settings.${cFlag}.name`);
				
				let vFormField = document.createElement("div");
				vFormField.classList.add("form-fields");
				
				let vContent;
				switch(cSettingType) {
					case "boolean":
						vContent = document.createElement("input");
						vContent.type = "checkbox";
						vContent.checked = Boolean(pDocument.system[cModuleName][cFlag])
						break;
					case "number":
						vContent = document.createElement("input");
						vContent.type = "number";
						break;
					case "string":
						vContent = document.createElement("input");
						vContent.type = "text";
						break;
					case "selection":
						vContent = document.createElement("select");

						for (const cOption of this.Settings[cFlag].options()) {
							let vOption = document.createElement("option");
							if (typeof cOption == "object") {
								vOption.value = cOption.id;
								vOption.innerText = cOption.name;
							}
							else {
								vOption.value = cOption;
								vOption.innerText = Translate(`${cModuleName}.Settings.${cFlag}.options.${cOption}`);
							}
							vContent.appendChild(vOption);
						}
						break;
					case "multiSelect":
						vContent = document.createElement("multi-select");
						
						let vOptionsGroup = document.createElement("optgroup");
						
						const cOptions = this.Settings[cFlag].isLevelSelect ? Array.from(pDocument.region.parent.levels) : this.Settings[cFlag].options();
						
						for (const cOption of cOptions) {
							let vOption = document.createElement("option");
							vOption.value = cOption.id;
							vOption.innerText = Translate(cOption.name);
							vOptionsGroup.appendChild(vOption);
						}
						
						vContent.appendChild(vOptionsGroup);
						break;
					case "color":
						vContent = document.createElement("color-picker");
					case "object":
						switch (this.Settings[cFlag].objectType) {
							case "position":
								vContent = document.createElement("div");
								
								let vPositionInput = document.createElement("input");
								vPositionInput.type = "text";
							
								let vPositionSelect = document.createElement("button");
								vPositionSelect.classList.add("icon", "fa-solid", "fa-bullseye");
							
								let vButtonClick;
							
								switch (this.Settings[cFlag].positionType) {
									case "localxy":
										vButtonClick = (pEvent) => {
											pEvent.stopPropagation();
											pEvent.preventDefault();
											Hooks.once(cModuleName + ".onCanvasClick", (pEvent) => {try {vPositionInput.value = [pEvent.clientX, pEvent.clientY]} catch {}})
										}
									break;
									break;
								}
								
								vPositionSelect.onclick = vButtonClick;
								
								vContent.appendChild(vPositionInput);
								vContent.appendChild(vPositionSelect);
								break;
							case "placeables":
								vContent = document.createElement("div");
								
								let vPlaceablesInput = document.createElement("input");
								vPlaceablesInput.type = "text";
							
								let vPlaceablesSelect = document.createElement("button");
								vPlaceablesSelect.classList.add("icon", "fa-solid", "fa-file-circle-plus");
								
								if (this.Settings[cFlag].validSelectable) {
									vPlaceablesSelect.onclick = (pEvent) => {
										pEvent.stopPropagation();
										pEvent.preventDefault();
										console.log(utils.selectedPlaceables());
										console.log(utils.selectedPlaceables().filter(vPlaceable => this.Settings[cFlag].validSelectable(vPlaceable)));
										vPlaceablesInput.value = utils.selectedPlaceables().filter(vPlaceable => this.Settings[cFlag].validSelectable(vPlaceable)).map(vPlaceable => vPlaceable.uuid)
									}
								}
								
								vContent.appendChild(vPlaceablesInput);
								vContent.appendChild(vPlaceablesSelect);
								break;
						}
						
						vContent.style.display = "flex";
						vContent.style.flexDirection = "row";
						
				}
				
				if (!["boolean", "multiSelect", "object"].includes(cSettingType)) vContent.value = pDocument.system[cModuleName][cFlag];
				if (cSettingType == "object") vContent.querySelector("input").value = pDocument.system[cModuleName][cFlag].join(",");
				
				vContent.id = `${cModuleName}.${cFlag}`;
				vContent.onchange = vonChange;
				
				let vHint = document.createElement("p");
				vHint.classList.add("hint");
				vHint.innerText = Translate(`${cModuleName}.Settings.${cFlag}.hint`);

				vFormField.appendChild(vContent)

				vFormGroup.appendChild(vLabel);
				vFormGroup.appendChild(vFormField);
				vFormGroup.appendChild(vHint);
				
				if (cSettingType == "multiSelect" && this.Settings[cFlag].scChangeAll) {
					vFormGroup.onclick = (pEvent) => {if (pEvent.shiftKey) vContent.value = (this.Settings[cFlag].isLevelSelect ? Array.from(pDocument.region.parent.levels) : this.Settings[cFlag].options()).map(vOption => vOption.id)};
					vFormGroup.oncontextmenu = (pEvent) => {if (pEvent.shiftKey) vContent.value = []};
					
					vHint.innerText = vHint.innerText + " " + Translate(`${cModuleName}.Settings.scChangeHint`);
				}
				
				vFieldSet.appendChild(vFormGroup);
				
				if (["multiSelect", "color"].includes(cSettingType)) vContent.value = pDocument.system[cModuleName][cFlag]; //special quirk of multi-select dom
			}
			
			vonChange({});
		}
	}	
	
	static evaluateForm(pForm) {
		let vFieldSet = pForm.querySelector(`fieldset.${cModuleName}`);
		
		let vFlagUpdate = {};
		
		if (vFieldSet) {
			for (const cFlag of Object.keys(this.Settings).filter(vKey => this.Settings[vKey].configDialog)) {

				let vContent = vFieldSet.querySelector(`[id="${cModuleName}.${cFlag}"]`);
				
				if (vContent) {
					const cSettingType = this.settingType(cFlag);
					
					switch (cSettingType) {
						case "boolean":
							vFlagUpdate[cFlag] = Boolean(vContent.checked);
							break;
						case "object":
							vFlagUpdate[cFlag] = vContent.querySelector("input")?.value?.split(",")
							break;
						default:
							vFlagUpdate[cFlag] = vContent.value;
							break;
					}
				}
			}
		}
		
		return vFlagUpdate;
	}
}
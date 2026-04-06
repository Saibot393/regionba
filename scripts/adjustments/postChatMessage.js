import {cModuleName, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBApostChatMessage extends regionbaBasic {
	static type = cModuleName + ".postChatMessage";
	
	static Settings = {
		chatMessage : {
			default : () => {return ""},
			configDialog : true,
			isTextBlock : true
		},
		messageSpeaker : {
			default : () => {return []},
			configDialog : true,
			isSingle : true,
			objectType : "documents",
			validSelectable : (pDocument) => {return ["Token", "Actor"].includes(pDocument.documentName)}
		},
		whisperMessage : {
			default : () => {return false},
			configDialog : true
		},
		playerTokensTriggeronly : {
			default : () => {return true},
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
		const cBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;

		cBehaviorType.modifiedMessage = function(pEvent) {
			let vMessage = this.regionba.chatMessage;
			console.log(vMessage);
			vMessage = vMessage.replace("{token}", pEvent.data.token.name);
			
			vMessage = vMessage.replace("{tokens}", Array.from(pEvent.region.tokens).map(vToken => vToken.name).join(", "))
			
			return vMessage;
		}
		
		cBehaviorType.messageSpeakerData = function(pEvent) {
			let vData = {};
			
			let vSpeaker = this.regionba.messageSpeaker;
			
			vSpeaker = vSpeaker?.[0];
			
			vSpeaker = fromUuidSync(vSpeaker);
			
			if (vSpeaker) {
				vData = ChatMessage.getSpeaker({actor : vSpeaker, token : vSpeaker})
			}
			
			return vData;
		}

		cBehaviorType.whisperRecipient = function(pEvent) {
			if (this.regionba.whisperMessage) {
				return game.users.filter(vUser => vUser.character == pEvent.data.token.actor).map(vUser => vUser?.id);
			}
			
			return [];
		}

		cBehaviorType._handleRegionEvent = function(pEvent) {
			if ( !game.user.isActiveGM ) return;
			
			const cToken = pEvent.data.token;
			
			if (this.regionba.playerTokensTriggeronly) {
				if (!utils.isPlayerToken(cToken)) return;
			}
			
			if (this.regionba.once) {
				this.parent.update({
					disabled: true
				});
			}

			ChatMessage.create({speaker : this.messageSpeakerData(pEvent), content : this.modifiedMessage(pEvent), whisper : this.whisperRecipient(pEvent)})
		}
	}
}
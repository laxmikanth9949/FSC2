sap.ui.define([
	"sap/support/fsc2/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	'sap/ui/model/Filter',
	"sap/ui/model/odata/v2/ODataModel",
	'sap/support/fsc2/model/formatter'
], function (Controller, JSONModel, Filter, ODataModel, formatter) {
	"use strict";
	return Controller.extend("sap.support.fsc2.controller.CommentCIMReq", {

		onInit: function () {
			this.setModel(new JSONModel({
				"results": []
			}), "EntryCollection");
			this.getRouter().getRoute("commentCIMReq").attachMatched(this._onRouteMatched, this);

		},
		_onRouteMatched: function (oEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			this.getModel("EntryCollection").setData("");
			var oArgs = oEvent.getParameter("arguments");

			this.objectId = oArgs.id;
			this.sTransType = oArgs.transType;
			var bIsNowEsc = (oArgs.transType === "sn_customerservice_escalation") ? true : false;
			this.getView().setModel(new JSONModel({
				"isNowEsc": bIsNowEsc
			}), "TitleModel");
			this.getView().setBusy(true);
			if (this.sTransType === "sn_customerservice_escalation") { //I338673 decide betweeen cim and NOW
				this.loadSnowNoteData();
			} else {
				this.loadNoteData();
			}

		},
		loadNoteData: function () {
			sap.support.fsc2.FSC2Model.read("/NotesSet", {
				filters: [new Filter("id", "EQ", this.objectId),
					new Filter("process_type", "EQ", 'ZS90'),
					new Filter("notes_type", "EQ", 'HIST')
				],
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					var aNoteResults = oData.results;
					var aFeedItems = [];
					var index = 0;
					var oFeedItem = {
						Author: "",
						Type: "",
						Date: "",
						Text: "\n"
					};
					while (aNoteResults.length > index) {
						if (index === aNoteResults.length - 1) {
							oFeedItem.text = oFeedItem.text + aNoteResults[index].tdline;
							oFeedItem.text += "\n";
							aFeedItems.push(oFeedItem);
							oFeedItem = {
								Author: "",
								Type: "",
								Date: "",
								Text: ""
							};
							index++;
						} else {
							switch (aNoteResults[index].tdline) {
							case "Business Impact.":
								oFeedItem.Date = aNoteResults[index + 1].tdline.replace(/\s+/g, " ").split(" ", 2).join(" ");
								oFeedItem.Author = aNoteResults[index + 2].tdline;
								oFeedItem.Type = "Business Impact.";
								index = index + 3;
								break;
							case "Update to CIM":
								oFeedItem.Date = aNoteResults[index + 1].tdline.replace(/\s+/g, " ").split(" ", 2).join(" ");
								oFeedItem.Author = aNoteResults[index + 2].tdline;
								oFeedItem.Type = "Update to CIM";
								index = index + 3;
								break;
							case "Notes":
								oFeedItem.Date = aNoteResults[index + 1].tdline.replace(/\s+/g, " ").split(" ", 2).join(" ");
								oFeedItem.Author = aNoteResults[index + 2].tdline;
								oFeedItem.Type = "Notes";
								index = index + 3;
								break;
							case "Inbound Email Summary":
								oFeedItem.Date = aNoteResults[index + 1].tdline.replace(/\s+/g, " ").split(" ", 2).join(" ");
								oFeedItem.Author = aNoteResults[index + 2].tdline;
								oFeedItem.Type = "Inbound Email Summary";
								index = index + 3;
								break;
							case "":
								index++;
								break;
							case "____________________":
								aFeedItems.push(oFeedItem);
								oFeedItem = {
									Author: "",
									Type: "",
									Date: "",
									Text: ""
								};
								index++;
								break;
							default:
								oFeedItem.Text = oFeedItem.Text + aNoteResults[index].tdline;
								oFeedItem.Text += "\n";
								index++;
							}
						}
					}
					this.getModel("EntryCollection").setData({
						"results": aFeedItems
					});
					this.getView().setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
					this.getView().setBusy(false);
					// sap.m.MessageToast.show("Service Unavailable!");
				}.bind(this)
			});
		},
		formatTime: function (time) {
			var bSnowDate = false;
			if (time.includes("-")) { //if the date contains "-" we assume its coming from ServiceNow
				bSnowDate = true;
				time = time.replace(/-/g, ".");
			}
			var temp = time.split(" "); // snow returns 2020-mm-dd 16:00:40, exisng is dd.mm.yyyy 16:00:40, we replace the - with . to make all formats the s

			var temp1 = temp[0].split(".");
			var iDay = temp1[0];
			var iMonth = temp1[1];
			var iYear = temp1[2];

			if (bSnowDate) {
				iDay = temp1[2];
				iMonth = temp1[1];
				iYear = temp1[0];
			}

			var temp2 = temp[1].split(":");
			//sTime = new Date(temp[0].split(".")[2] + "/" + temp[0].split(".")[1] + "/" + temp[0].split(".")[0] + " " + temp[1]);
			var sTime = new Date(Date.UTC(iYear, iMonth - 1, iDay, temp2[0], temp2[1], temp2[2]));
			return sTime;
		},

		loadSnowNoteData: function () {
			var sUrl =
				sap.support.fsc2.servicenowEscalationNotesUrl + "?sys_id=" + this.objectId;

			$.ajax({
				method: "GET",
				contentType: "application/json",
				url: sUrl,
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				success: function (oData) {
					var aNoteResults = oData.result.communication_summary;
					var aFeedItems = [];
					var index = 0;
					/*var oFeedItem = {
						name: "",
						time: "",
						text: "\n"
					};*/
					var sTime = "";
					while (aNoteResults.length > index) {
						var oFeedItem = {
							Author: "",
							Date: "",
							Text: "\n"
						};

						switch (aNoteResults[index].type) {

						case "work_notes":
							sTime = aNoteResults[index].created_on; //aNoteResults[index + 1].tdline.replace(/\s+/g, " ").split(" ", 2).join(" ");
							oFeedItem.Date = this.formatTime(sTime);
							oFeedItem.Author = aNoteResults[index].user_name;
							oFeedItem.Text = "\n" + aNoteResults[index].text;
							//oFeedItem.Type = "";
							aFeedItems.push(oFeedItem);
							index++; //= index + 3;
							break;
						case "comments":
							sTime = aNoteResults[index].created_on;
							oFeedItem.Date = this.formatTime(sTime); //13.08.2020          00:51:22 
							oFeedItem.Author = aNoteResults[index].user_name;
							oFeedItem.Text = "\n" + aNoteResults[index].text;
							//oFeedItem.Type = "Comments";
							aFeedItems.push(oFeedItem);
							index++; //= index + 3;
							break;
						case "u_approval_history":
							sTime = aNoteResults[index].created_on;
							oFeedItem.Date = this.formatTime(sTime); //13.08.2020          00:51:22 
							oFeedItem.Author = aNoteResults[index].user_name;
							oFeedItem.Text = "\n" + aNoteResults[index].text;
							// oFeedItem.Type = "Approval status update";
							aFeedItems.push(oFeedItem);
							index++; //= index + 3;
							break;
							/*case "":
								index++;
								break;
							case "____________________":
								aFeedItems.push(oFeedItem);
								oFeedItem = {
									name: "",
									time: "",
									text: ""
								};
								index++;
								break;*/
						default:
							oFeedItem.Text = oFeedItem.Text + aNoteResults[index].type;
							oFeedItem.Text += "\n";
							index++;
						}
					}
					this.getModel("EntryCollection").setData({
						"results": aFeedItems
					});
					this.getView().setBusy(false);
					//this.getModel("NoteList").setProperty("/results", aFeedItems);
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
					this.getView().setBusy(false);
				}
			});
		},
		
		onPostButtonPress: function (oEvent) {
			var sUserID = this.getModel("CurrentUserInfo").getProperty("/UserID");
			var sValue = oEvent.getParameter("value");

			if (this.sTransType === "sn_customerservice_escalation") { //if NOW esc
				this.getView().setBusy(true);
				//sValue = sValue.replace(\n/g, " \\r\\n ");
				sValue = sValue.replace("\n/g", "\\n"); //for sNow side cant handle return carraige. not needed anymore? i338673
				//sValue = sValue.replace("\n/g", " \\r\\n "); also working
				var obj_Snow = {
					"u_comments": "[code]" + sValue + "[code]", 
					"u_last_user_updated_by": sUserID,
					"sys_target_sys_id": this.objectId
				};
				$.ajax({
					method: "POST",
					data: JSON.stringify(obj_Snow),
					contentType: "application/json",
					headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
					url: sap.support.fsc2.servicenowEscalationUrlCreateApi, //= sys_id
					success: function () {
						this.loadSnowNoteData();
					}.bind(this),
					error: function (oError) {
						this.showErrorMessage(oError);
						this.getView().setBusy(false);
					}.bind(this)

				});
			} 

		},
		handleRefresh: function () {
			this.getView().setBusy(true);
			setTimeout(function () {
				this.getView().byId("idPullToRefresh").hide();
				if (this.sTransType === "sn_customerservice_escalation") {
					this.loadSnowNoteData();
				} else {
					this.loadNoteData();
				}

			}.bind(this), 1000);
		}
	});
});
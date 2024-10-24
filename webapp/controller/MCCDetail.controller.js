/*global history*/
sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	'sap/support/fsc2/model/formatter'
], function (BaseController, JSONModel, Filter, ODataModel, models, formatter) {
	"use strict";
	return BaseController.extend("sap.support.fsc2.controller.MCCDetail", {
		formatter: formatter,
		onInit: function () {
			this.setModel(new JSONModel({
				"display": true,
				"edit": false,
				"_bFavorite": false,
				"_bShowCaseIcon": false
			}), "MCCPageConfig");
			this.setModel(new JSONModel({}), "MCCDetail");
			this.setModel(new JSONModel({
				"results": []
			}), "NoteList");
			this.setModel(new JSONModel(), "Communication");
			this.setModel(new JSONModel(), "MCCSettings");
			this.setModel(new JSONModel(), "DetailEdit");
			this.getView().byId("noRelatedCaseImg").setSrc(jQuery.sap.getModulePath("sap.support.fsc2", "/image/mdr2.png"));
			this.getRouter().getRoute("mccDetail").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("mccDetailRequest").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("mccDetailRequestSearch").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("mccDetailEnd").attachPatternMatched(this._onRouteMatched, this);
			this._setImageSRC();
			this.loadSettingsData();

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
			var oNav = this.getView().byId("idMCCNav");
			oNav.to(this.getView().byId("idDetailPage"));
			/******comment:
			 These two flags are uesd to check if the data has been loaded completed.
			 ******/
			this.bFlag1 = false;
			this.bFlag2 = false;
			jQuery.sap.delayedCall(10, this, function () {
				this.getView().setBusy(true);
			});
			var oArgs = oEvent.getParameter("arguments");
			this.sID = oArgs.activity_id; // for test //"230559";//
			// this.getView().byId("idMCCObjectPageLayout").scrollToSection(this.getView().byId("idNotes").getId());
			this.getView().byId("idMCCObjectPageLayout").setSelectedKey("Notes");
			this.loadDetailData();
			//	this.loadNoteData();

		},
		handleClose: function () {
			//when two columns are visible --> close second one, nav to first on fullscreen
			var prevTarget = this.getRouter()._oMatchedRoute._oConfig.target[0];
			var columnPages = this.getRouter().getTarget(prevTarget)._oOptions.controlAggregation;
			if (columnPages === "beginColumnPages") {
				var layout = "OneColumn";
			} else if (columnPages === "midColumnPages") {
				var layout = "MidColumnFullScreen";
			}
			this.getRouter().navTo(prevTarget, {
				layout: layout
			});
		},
		loadDetailData: function () {
			sap.support.fsc2.FSC2Model.read("/FSC2ActivitySet", {
				filters: [new Filter("activity_id", "EQ", this.sID),
					new Filter("activity_process_type", "EQ", 'ZS46')
				],
				urlParameters: {
					$expand: "FSC2Activity_Parties,FSC2Activity_CaseSet,AttachmentSet"
				},
				success: function (oData, oResponse) {
					/******comment: if close the busy state or not ******/
					this.bFlag1 = true;
					if (this.bFlag1 && this.bFlag2) {
						this.getView().setBusy(false);
					}
					if (oResponse.headers["sap-message"] !== undefined) {
						var oResp = JSON.parse(oResponse.headers["sap-message"]);
						sap.m.MessageBox.error(oResp.message);
					} else {
						if (oData.results && oData.results[0]) {
							var oActivity = oData.results[0];
							this.CustomerNo = oActivity.activity_customer;
							this.CustomerName = oActivity.account_name_F;
							oActivity.activity_change_time = oActivity.activity_change_date.setMilliseconds(oActivity.activity_change_time.ms - 28800000);
							oActivity.activity_change_time = new Date(oActivity.activity_change_time);
							oActivity.activity_create_time = oActivity.activity_create_date.setMilliseconds(oActivity.activity_create_time.ms - 28800000);
							oActivity.activity_create_time = new Date(oActivity.activity_create_time);
							this.getModel("MCCDetail").setData(oData.results[0]);
							if (oActivity.is_favorite === "X") {
								this.getModel("MCCPageConfig").setProperty("/_bFavorite", true);
							} else {
								this.getModel("MCCPageConfig").setProperty("/_bFavorite", false);
							}
							if (oActivity.FSC2Activity_CaseSet.results.length === 0) {
								// add empty case_id for data binding
								oActivity.FSC2Activity_CaseSet.results.push({
									transactions_case_id: "",
									transactions_id: ""
								});
								this.getModel("MCCPageConfig").setProperty("/_bShowCaseIcon", true);
							} else {
								this.getModel("MCCPageConfig").setProperty("/_bShowCaseIcon", false);
							}
						}
						this.formatMasterBtnEnable();

						this.loadNoteData();
					}
				}.bind(this),
				error: function (err) {
					this.bFlag1 = true;
					if (this.bFlag1 && this.bFlag2) {
						this.getView().setBusy(false);
					}
					sap.m.MessageToast.show("Service Unavailable!");
				}.bind(this)
			});

		},
		onLinkCaseId: function (oEvent) {
			var sLink = "ht" + "tps://ic" + this.getSystem() + ".wdf.sap.corp/" +
				"sap/bc/bsp/sap/crm_ui_start/default.htm?" +
				"crm-object-type=CRM_CMG&crm-object-action=B&sap-language=EN&crm-object-keyname=EXT_KEY&crm-object-" +
				"value=" + oEvent.getSource().getText();
			sap.m.URLHelper.redirect(sLink, true);
		},
		onLinkActivityId: function (oEvent) {
			var sLink = "ht" + "tps://ic" + this.getSystem() +
				".wdf.sap.corp/sap/bc/bsp/sap/crm_ui_start/default.htm?" +
				"crm-object-type=BT126_APPT&crm-object-action=B&sap-language=EN&crm-object-keyname=OBJECT_ID&crm-object-" +
				"value=" + oEvent.getSource().getText();
			sap.m.URLHelper.redirect(sLink, true);
		},
		_setImageSRC: function () {
			var oImageSRC = jQuery.sap.getModulePath("sap.support.fsc2") + "/image/mdr2.png";
			var oImageModel = new sap.ui.model.json.JSONModel();
			oImageModel.setProperty("/mdr2", oImageSRC);
			this.getView().setModel(oImageModel, "Image");
		},

		formatTime: function (time) {
			var temp = time.split(" ");
			var temp1 = temp[0].split("."),
				temp2 = temp[1].split(":");
			//sTime = new Date(temp[0].split(".")[2] + "/" + temp[0].split(".")[1] + "/" + temp[0].split(".")[0] + " " + temp[1]);
			var sTime = new Date(Date.UTC(temp1[2], temp1[1] - 1, temp1[0], temp2[0], temp2[1], temp2[2]));
			return sTime;
		},

		/*	onIconTabBarSelectionChanged: function (oEvent) {
			var bScroll = true;
				if (oEvent.getParameter("selectedKey") === "Notes") {
					bScroll = false;
				}
				this.getView().byId("idDetailPage").setEnableScrolling(bScroll);
		},
*/
		loadNoteData: function () {
			//https://pgdmain.wdf.sap.corp/sap/opu/odata/sap/ZS_AGS_FSC2_SRV/NotesSet?$filter=id%20eq%20%27191752%27%20and%20process_type%20eq%20%27ZS46%27%20and%20%20notes_type%20eq%20%27HIST%27 
			sap.support.fsc2.FSC2Model.read("/NotesSet", {
				filters: [new Filter("id", "EQ", this.sID),
					new Filter("process_type", "EQ", 'ZS46'),
					new Filter("notes_type", "EQ", 'HIST')
				],
				success: function (oData) {
					/******comment: if close the busy state or not ******/
					this.bFlag2 = true;
					if (this.bFlag1 && this.bFlag2) {
						this.getView().setBusy(false);
					}
					var aNoteResults = oData.results;
					var aFeedItems = [];
					var index = 0;
					var oFeedItem = {
						name: "",
						time: "",
						text: '\n',
						userId: ""
					};
					var sTime = "";
					while (aNoteResults.length > index) {
						if (index === aNoteResults.length - 1) {
							oFeedItem.text = oFeedItem.text + aNoteResults[index].tdline;
							oFeedItem.text += '\n';
							aFeedItems.push(oFeedItem);
							oFeedItem = {
								name: "",
								time: "",
								text: '',
								userId: ""
							};
							index++;
						} else {
							switch (aNoteResults[index].tdline) {
							case "Description":
								sTime = aNoteResults[index + 1].tdline.replace(/\s+/g, " ").split(" ", 2).join(" ");
								oFeedItem.time = this.formatTime(sTime);
								oFeedItem.name = aNoteResults[index + 2].tdline;
								oFeedItem.userId = aNoteResults[index + 1].tdline.replace(/\s+/g, " ").split(" ", 3)[2];
								index = index + 3;
								break;
							case "Initial Information":
								sTime = aNoteResults[index + 1].tdline.replace(/\s+/g, " ").split(" ", 2).join(" ");
								oFeedItem.time = this.formatTime(sTime);
								oFeedItem.name = aNoteResults[index + 2].tdline;
								oFeedItem.userId = aNoteResults[index + 1].tdline.replace(/\s+/g, " ").split(" ", 3)[2];
								index = index + 3;
								break;
							case "Note":
								sTime = aNoteResults[index + 1].tdline.replace(/\s+/g, " ").split(" ", 2).join(" ");
								oFeedItem.time = this.formatTime(sTime);
								oFeedItem.name = aNoteResults[index + 2].tdline;
								oFeedItem.userId = aNoteResults[index + 1].tdline.replace(/\s+/g, " ").split(" ", 3)[2];
								index = index + 3;
								break;
							case "":
								index++;
								oFeedItem.text += '\n';
								break;
							case "____________________":
								aFeedItems.push(oFeedItem);
								oFeedItem = {
									name: "",
									time: "",
									text: '',
									userId: ""
								};
								index++;
								break;
							default:
								oFeedItem.text = oFeedItem.text + aNoteResults[index].tdline;
								oFeedItem.text += '\n';
								index++;
							}
						}
					}
					this.getModel("NoteList").setProperty("/results", aFeedItems);
					this.addInitialFeedItems(aFeedItems, this.getModel("MCCDetail").getProperty("/activity_requestor_id"), this.getModel(
						"MCCDetail").getProperty("/activity_created_by"));
					if (aFeedItems.length > 0) {
						this._myDelegate = {
							"onAfterRendering": function () {
								this.getView().byId("idDetailPage")._getPage().getScrollDelegate().scrollTo(0, 100000, 0);
							}
						};
						this.getView().byId("chatList").getItems()[this.getView().byId("chatList").getItems().length - 1].addEventDelegate(this._myDelegate,
							this);
					}

					if (sap.ACreated === true) {
						document.cookie = "qualtrics=create";
						this.fillEmbeddedData();
						sap.ACreated = false;
					}
					this.onScrollBottom();
				}.bind(this),
				error: function (err) {
					this.bFlag2 = true;
					if (this.bFlag1 && this.bFlag2) {
						this.getView().setBusy(false);
					}
					sap.m.MessageToast.show("Service Unavailable!");
				}.bind(this)
			});

		},

		onAddNotes: function (oEvent) {
			var oNav = this.getView().byId("idMCCNav");
			this.getView().byId("saveNoteBtn").setEnabled(false);
			this.getView().byId("saveNoteMCCBtn").setEnabled(false);
			this.oTextArea = this.getView().byId("idTextArea");
			this.oTextArea.setValue();
			oNav.to(this.getView().byId("idNotePage"));

			this.oNav = oNav;
			// 	if (!this._oNoteDialog) {
			// 	this._oNoteDialog = sap.ui.xmlfragment("sap.support.fsc2.view.fragments.AddMCCNotes", this);
			// 	this.getView().addDependent(this._oNoteDialog);
			// }
			// // this._oNoteDialog.open();
			// 	var oButton = oEvent.getSource();
			// jQuery.sap.delayedCall(0, this, function() {
			// 	this._oNoteDialog.openBy(oButton);
			// });
			// if(!this._oNoteDialog){
			// 	this.oTextArea = new sap.m.TextArea({
			// 		width:"100%",
			// 		rows:5,
			// 		placeholder:"Enter a note"
			// 	});
			// 	this._oNoteDialog = new sap.m.Dialog({
			// 		title:"Add A Note",
			// 		contentWidth:"100%",
			// 		contentHeight:"100%",
			// 		content:[this.oTextArea],
			// 		buttons:[
			// 			new sap.m.Button({
			// 			text: this.getResourceBundle().getText("save"),
			// 			press: function () {
			// 				this.onSaveNote();
			// 				this._oNoteDialog.close();
			// 			}.bind(this)
			// 		}),
			// 		new sap.m.Button({
			// 			text: this.getResourceBundle().getText("saveSendToMCC"),
			// 			press: function () {
			// 				this.onSaveNoteAndSendMCC();
			// 				this._oNoteDialog.close();
			// 			}.bind(this)
			// 		}),
			// 		// new sap.m.Button({
			// 		// 	text: this.getResourceBundle().getText("close"),
			// 		// 	press: function () {
			// 		// 		this.onSaveNoteAndClose();
			// 		// 		this._oNoteDialog.close();
			// 		// 	}.bind(this)
			// 		// }),
			// 		new sap.m.Button({
			// 			text: this.getResourceBundle().getText("cancel"),
			// 			press: function () {
			// 				this._oNoteDialog.close();
			// 			}.bind(this)
			// 		})]
			// 	});
			// }	
			// this._oNoteDialog.open();
		},
		onNoteChange: function (oEvent) {
			var sValue = oEvent.getSource().getValue();
			sValue = $.trim(sValue);
			var sEnabled = sValue ? true : false;
			this.getView().byId("saveNoteBtn").setEnabled(sEnabled);
			this.getView().byId("saveNoteMCCBtn").setEnabled(sEnabled);
		},
		onCancelNote: function () {
			// this._oNoteDialog.close();
			var oNav = this.getView().byId("idMCCNav");
			oNav.back();
			// oNav.to(this.getView().byId("idDetailPage"));
		},
		loadSettingsData: function () {
			// this.getModel("MCCSettings").loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/model/mccSelectList.json"), {}, false);
			sap.support.fsc2.FSC2Model.read("/SettingSet", {
				filters: [new Filter("key", "EQ", "SERVICETEAM")],
				success: function (oData) {
					this.getModel("MCCSettings").setProperty("/RegionList", this.groupServiceTeam(oData.results));
				}.bind(this),
				error: function (err) {
					sap.m.MessageToast.show("Service Unavailable!");
				}
			});
			sap.support.fsc2.FSC2Model.read("/SettingSet", {
				filters: [new Filter("key", "EQ", "STATUS")],
				success: function (oData) {
					this.getModel("MCCSettings").setProperty("/StatusList", oData.results);
				}.bind(this),
				error: function (err) {
					sap.m.MessageToast.show("Service Unavailable!");
				}
			});
			sap.support.fsc2.FSC2Model.read("/SettingSet", {
				filters: [new Filter("key", "EQ", "CATEGORY")],
				success: function (oData) {
					this.getModel("MCCSettings").setProperty("/CategoryList", oData.results);
				}.bind(this),
				error: function (err) {
					sap.m.MessageToast.show("Service Unavailable!");
				}
			});
			sap.support.fsc2.FSC2Model.read("/SettingSet", {
				filters: [new Filter("key", "EQ", "RATING")],
				success: function (oData) {
					this.getModel("MCCSettings").setProperty("/RatingList", oData.results);
				}.bind(this),
				error: function (err) {
					sap.m.MessageToast.show("Service Unavailable!");
				}
			});
			sap.support.fsc2.FSC2Model.read("/SettingSet", {
				filters: [new Filter("key", "EQ", "PRIORITY")],
				success: function (oData) {
					this.getModel("MCCSettings").setProperty("/PriorityList", oData.results);
				}.bind(this),
				error: function (err) {
					sap.m.MessageToast.show("Service Unavailable!");
				}
			});
		},
		groupServiceTeam: function (aServiceTeam) {
			var aGroupList = [];
			if (!Array.isArray(aServiceTeam)) {
				return aGroupList;
			} else {
				$.each(aServiceTeam, function (index, item) {
					var flagEqual = false;
					$.each(aGroupList, function (index01, item01) {
						if (item01.Region === item.value2) {
							flagEqual = true;
							item01.Topic.push({
								name: item.value3,
								service_team_id: item.value1
							});
							return;
						}
					});
					if (!flagEqual) {
						aGroupList.push({
							Region: item.value2,
							Topic: [{
								name: item.value3,
								service_team_id: item.value1
							}]
						});
					}
				});
				return aGroupList;
			}
		},
		onSetFavorite: function () {
			this.eventUsage(false, "Set \'MCC Activity\' favorite");
			sap.support.fsc2.UserProfileModel.create("/Entries", {
				"Attribute": "FAVORITE_ACTIVITIES",
				"Value": this.sID
			}, {
				success: function () {
					this.getModel("MCCPageConfig").setProperty("/_bFavorite", true);
					this.loadDetailData();
					this.loadFavCustData();
					this.getEventBus().publish("Favorites", "_onRouteMatched");
				}.bind(this)
			});
		},
		onRemoveFavorite: function () {
			this.eventUsage(false, "Set \'MCC Activity\' unfavorite");
			var oData = this.getModel("MCCDetail").getData();
			var iField = oData.favorite_field || "";
			iField = iField.trim();
			sap.support.fsc2.UserProfileModel.remove("/Entries(Username='',Attribute='FAVORITE_ACTIVITIES',Field='" + iField + "')", {
				success: function () {
					this.getModel("MCCPageConfig").setProperty("/_bFavorite", false);
					this.loadDetailData();
					this.loadFavCustData();
					this.getEventBus().publish("Favorites", "_onRouteMatched");
				}.bind(this)
			});
		},
		onRegionChange: function (oEvent) {
			var sRegionKey = oEvent.getParameter("selectedItem").getProperty("key");
			this.setTopicList(sRegionKey);
		},
		setTopicList: function (regionkey) {
			var iRegionKey = parseInt(regionkey, 0);
			var aData = this.getModel("MCCSettings").getProperty("/RegionList")[iRegionKey].Topic;
			var oTopic = this.getView().byId("topic");
			oTopic.removeAllItems();
			oTopic.addItem(new sap.ui.core.Item({
				key: -1,
				text: "Please select"
			}));
			for (var index = 0; index < aData.length; index++) {
				oTopic.addItem(
					new sap.ui.core.Item({
						key: aData[index].service_team_id,
						text: aData[index].name
					})
				);
			}
		},
		// handleNoteInput: function(oEvent) {
		// 	var sValue = oEvent.getParameter("value");
		// 	if (sValue && sValue !== " ") {
		// 		this._setNotesActionButtonsEnable(true);
		// 	} else {
		// 		this._setNotesActionButtonsEnable(false);
		// 	}
		// },
		// _setNotesActionButtonsEnable: function(bEnable) {
		// 	this.getView().byId("idSaveNote").setEnabled(bEnable);
		// 	this.getView().byId("idNoteAndSendMCC").setEnabled(bEnable);
		// },
		onSaveNote: function (oEvent) {
			this.eventUsage(false, "Add notes for MCC Activity");
			//	var sNote = this.oTextArea.getProperty("value"); //this.getView().byId("idNoteInput").getProperty("value");
			var sNote = oEvent.getParameter("value");
			var sUser = "";
			var sStatus = this.getModel("MCCDetail").getProperty("/activity_status");
			if (sStatus === "E0011" || sStatus === "E0019") {
				sUser = this.getModel("MCCDetail").getProperty("/activity_person_user_id");
			}
			var oEntity = {
				"Notes": sNote,
				"activity_status": "E0011", // do not change status > i guess we're changing it
				"activity_person_user_id": sUser,
				"activity_process_type": "ZS46"
			};

			this.updateActivityNote(oEntity, true);
		},

		onSaveNoteAndSendMCC: function (oEvent) {
			this.eventUsage(false, "Add notes for MCC Activity");
			var sNote = this.oTextArea.getProperty("value");
			var oRejectModel = {
				"Notes": sNote,
				"activity_status": "E0011",
				"activity_person_user_id": "",
				"activity_process_type": "ZS46"
			};

			this.updateActivityNote(oRejectModel, true);
		},

		onSaveNoteAndClose: function (oEvent) {
			var sNote = this.oTextArea.getProperty("value");
			var oCloseModel = {
				"Notes": sNote,
				"activity_status": "E0014",
				"activity_process_type": "ZS46"
			};
			sap.m.MessageBox.confirm(
				this.getResourceBundle().getText("txt_msgCloseAct"), {
					onClose: function (oAction) {
						if (oAction === "OK") {
							this.updateActivityNote(oCloseModel, true);
						}
					}.bind(this)
				}
			);
		},
		updateActivityNote: function (oUpdateEntry, fRefreshMaster) {
			sap.support.fsc2.FSC2Model.update("/FSC2ActivitySet('" + this.sID + "')", oUpdateEntry, {
				success: function (oData) {
					/*	this.oTextArea.setValue(""); // this.getView().byId("idNoteInput").setValue("");
						this.oNav.back();*/
					if (fRefreshMaster) {
						this.loadNoteData();
						this.loadDetailData();
					}
				}.bind(this),
				error: function (error) {
					sap.m.MessageToast.show("Error during update");
				}
			});
		},
		openQuickView: function (oEvent) {
			if (!this._oQuickView) {
				this._oQuickView = sap.ui.xmlfragment("sap.support.fsc2.view.fragments.NoCaseQuickView", this);
				this.getView().addDependent(this._oQuickView);
			}
			// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
			var oButton = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function () {
				this._oQuickView.openBy(oButton);
			});
		},
		copyDetailModelToEditModel: function () {
			var oDetailData = this.getModel("MCCDetail").getData();
			var oDetailEditData = jQuery.extend(true, {}, oDetailData);
			this.getModel("DetailEdit").setData(oDetailEditData);
		},
		onEdit: function () {
			this.getModel("MCCPageConfig").setProperty("/edit", true);
			this.copyDetailModelToEditModel();
			// this.getView().byId("idMCCObjectPageLayout").scrollToSection(this.getView().byId("idDetail").getId());
			this.getView().byId("idMCCObjectPageLayout").setSelectedKey("DetailsEdit");
			var oView = this.getView();
			var oData = this.getModel("MCCDetail").getData();
			// oView.byId("status").setSelectedKey(oData.activity_status);
			// oView.byId("category").setSelectedKey(oData.activity_cat);
			// oView.byId("rating").setSelectedKey(oData.activity_rating);
			// oView.byId("priority").setSelectedKey(oData.activity_priority);
			var oInServiceTeam = oView.byId("inServiceTeam");
			var oRegion = oView.byId("region");
			var oTopic = oView.byId("topic");
			if (oInServiceTeam.getValue() === "") {
				oRegion.setSelectedKey(-1);
				oRegion.setVisible(false);
				oTopic.setVisible(false);
				oInServiceTeam.setVisible(true);
				oInServiceTeam.setEnabled(false);
				oInServiceTeam.setPlaceholder("No service team entered");
			} else {
				oInServiceTeam.setVisible(true);
				oInServiceTeam.setEnabled(false);
				oRegion.setVisible(false);
				oTopic.setVisible(false);
			}
			// this.getView().byId("idMCCObjectPageLayout").scrollToSection(this.getView().byId("idDetail").getId());
			this.getView().byId("idMCCObjectPageLayout").setSelectedKey("DetailsEdit");
			this.getView().byId("scrollUpButton").setVisible(false);
			this.getView().byId("scrollDownButton").setVisible(false);
		},
		onSave: function () {
			this.eventUsage(false, "Edit \'MCC Activity\'");
			this.getModel("MCCPageConfig").setProperty("/edit", false);
			this.saveActivity();
		},

		getChangeData: function () {
			var oView = this.getView();
			var oDetailModel = this.getView().getModel("DetailEdit");
			var oActivity = {
				userId: oDetailModel.getProperty("/activity_person_user_id"), //oView.byId("inPersonUserID").getValue(),
				caseid: oDetailModel.getProperty("/FSC2Activity_CaseSet/results/0/transactions_case_id"), //oView.byId("idMatnrInputCaseID").getValue(),
				serviceTeam: oDetailModel.getProperty("/activity_service_team"), //oView.byId("inServiceTeam").getValue(),
				status: oDetailModel.getProperty("/activity_status"), //oView.byId("status").getSelectedKey(),
				category: oDetailModel.getProperty("/activity_cat"), //oView.byId("category").getSelectedKey(),
				rating: oDetailModel.getProperty("/activity_rating"), //oView.byId("rating").getSelectedKey(),
				priority: oDetailModel.getProperty("/activity_priority"), //oView.byId("priority").getSelectedKey(),
				planned_date_to: oDetailModel.getProperty("/activity_planned_date_to") //"/Date(" + Date.parse(oView.byId("inPlannedDateTo").getValue()) + ")/"
			};
			return oActivity;
		},

		saveActivity: function () {
			var bCloseButtonPressed = this.getModel("MCCPageConfig").getProperty("/close");
			if (bCloseButtonPressed) {
				this.copyDetailModelToEditModel();
			}
			var oActivityData = this.getChangeData();
			var entries = {};
			if (oActivityData.serviceTeam !== null && oActivityData.serviceTeam !== "0") {
				entries.activity_service_team = oActivityData.serviceTeam;
			} else {
				entries.activity_service_team = "";
			}
			if (oActivityData.category !== null && oActivityData.category !== "0") {
				entries.activity_cat = oActivityData.category;
			} else {
				entries.category = "";
			}
			if (oActivityData.priority !== null && oActivityData.priority !== "0") {
				entries.activity_priority_code = oActivityData.priority;
			} else {
				entries.activity_priority_code = "";
			}
			if (oActivityData.caseid !== null && oActivityData.caseid !== "0") {
				entries.activity_case_id = oActivityData.caseid;
			} else {
				entries.activity_case_id = "";
			}
			if (oActivityData.rating !== null && oActivityData.rating !== "0") {
				entries.rating = oActivityData.rating;
			} else {
				entries.rating = "";
			}
			var oEntry = {
				activity_person_user_id: formatter.uppercaseLeadingLetter(oActivityData.userId),
				activity_service_team: entries.activity_service_team,
				activity_status: oActivityData.status,
				activity_rating: entries.rating,
				activity_cat: entries.activity_cat,
				activity_priority: entries.activity_priority_code,
				//activity_planned_date: oActivityData.planned_date,
				activity_planned_date_to: oActivityData.planned_date_to,
				CaseId: entries.activity_case_id,
				"activity_process_type": "ZS46"
			};
			//if close then change status
			if (bCloseButtonPressed) {
				oEntry.activity_status = "E0014";
				oEntry.activity_planned_date_to = this.getModel("MCCDetail").getProperty("/activity_planned_date_to");
			}
			this.getView().setBusy(true);
			sap.support.fsc2.FSC2Model.update("/FSC2ActivitySet('" + this.sID + "')", oEntry, {
				success: function (oData) {
					this.loadDetailData();
					this.onCancel();
					this.getEventBus().publish("Request", "_onRouteMatched");
					// if close then send feedback
				}.bind(this),
				error: function (error) {
					this.getView().setBusy(false);
					sap.m.MessageToast.show("Error during update");
					this.onCancel();
				}.bind(this)
			});
		},
		onCancel: function () {
			this.copyDetailModelToEditModel();
			this.getView().byId("topic").setVisible(false);
			this.getModel("MCCPageConfig").setProperty("/edit", false);
		},
		onChange: function (oEvent) {
			if (this.sID) {
				var oUploadCollection = oEvent.getSource();
				// this.getView().setBusy(true);
				var uploadUrl = this.getOwnerComponent().sICDest + "/sap/ZS_AGS_FSC2_SRV/FSC2ActivitySet('" + this.sID + "')/AttachmentSet";
				oUploadCollection.setUploadUrl(uploadUrl);
				oUploadCollection.upload();
			}
		},

		onBeforeUploadStarts: function (oEvent) {
			var oModel = new sap.ui.model.odata.v2.ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: this.getOwnerComponent().sICDest + "/sap/ZS_AGS_FSC2_SRV",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				}
			});
			
			oModel.refreshSecurityToken();
			var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: oModel.getSecurityToken()
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);
			// Header APIM Identifier
			var oCustomHeaderAPIIDent = new sap.m.UploadCollectionParameter({
				name: "AppIdentifier",
				value: "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
			});
			oEvent.getParameters().addHeaderParameter(oCustomHeaderAPIIDent);
			
			// Header Slug
			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
		},

		onUploadComplete: function (oEvent) {
			this.eventUsage(false, "Upload \'MCC Activity\' attachment");
			this.loadDetailData();
		},

		onFileSizeExceed: function (oEvent) {
			sap.m.MessageToast.show("Please choose a file less than 10 MB.");
		},

		onFileNameExceed: function (oEvent) {
			sap.m.MessageToast.show("Please choose a file name less than 100 characters.");
		},
		onMailToPersonResponsible: function () {
			this.eventUsage(false, "Send E-Mail to person responsible");
			var sUserId = this.getModel("MCCDetail").getProperty("/activity_person_user_id");
			this.MailTo(sUserId);
		},

		onMailToLastChanger: function () {
			var sUserId = this.getModel("MCCDetail").getProperty("/ChangedBy");
			this.MailTo(sUserId);
		},

		onMailToCreator: function () {
			this.eventUsage(false, "Sent E-Mail to creator");
			var sUserId = this.getModel("MCCDetail").getProperty("/activity_created_by");
			this.MailTo((this._checkValidEmailTo(sUserId) ? sUserId : ""));
		},

		MailTo: function (sRecipient) {
			var sActivityId = this.getModel("MCCDetail").getProperty("/activity_id");
			var sSubject = "[CONFIDENTIAL] MCC Activity with ID: " + sActivityId;
			var sRequestor = this.getModel("MCCDetail").getProperty("/activity_created_by");
			// var aNoteList = this.getView().getModel("MCCDetail").getProperty("/NoteList");
			var sCcAddress, sNote = "";
			sCcAddress = this._checkValidEmailTo(sRequestor) ? sRequestor : "";
			if (sCcAddress === sRecipient) {
				sCcAddress = "";
			}
			// if (aNoteList && aNoteList.length > 0 && aNoteList[0]) {
			// 	sNote = "\n------------------------------------------------------------------------------------------------------------------\n" +
			// 		aNoteList[0].name + ":\n" + this._cutLastNote(aNoteList[0].text) + "\n" + aNoteList[0].time +
			// 		"\n------------------------------------------------------------------------------------------------------------------";
			// }
			var sLandscape = this.getSystem();
			var sUrlPara = "";
			switch (sLandscape) {
			case "p":
				sUrlPara = "fiorilaunchpad.sap.com/sites#mccsos-Display&/mccDetail/activity_id=";
				break;
			case "t":
				sUrlPara = "fiorilaunchpad-sapitcloudt.dispatcher.hana.ondemand.com/sites#mccsos-Display&/mccDetail/activity_id=";
				break;
			case "d":
				sUrlPara = "mccsos-br339jmc4c.dispatcher.int.sap.eu2.hana.ondemand.com/?hc_reset#/mccDetail/activity_id=";
				break;
			default:
				sUrlPara = "mccsos-br339jmc4c.dispatcher.int.sap.eu2.hana.ondemand.com/?hc_reset#/mccDetail/activity_id=";
				break;
			}
			/*var sShareEmailText = "Dear colleague,\n\nPlease have a look at MCC Activity " + sActivityId + "." + sNote +
				"\n\nTo access the MCC Activity please use the links below." +
				"\n\nLink to UI5 App:\nht" + "tps://" + location.host +
				(location.host.indexOf("fiorilaunchpad") === -1 ? ("/#/mccDetail/activity_id=" + sActivityId) :
					"/sites#mccsos-Display&/mccDetail/activity_id=" + sActivityId) +
				" " + "\n\nLink to CRM Web UI:\nht" + "tps://ic" + this.getSystem() +
				".wdf.sap.corp/sap(bD1lbiZjPTAwMSZkPW1pbg==)/bc/bsp/sap/crm_ui_start/default.htm?crm-object-type=BT126_APPT&crm-object-action=B&sap-language=EN&crm-object-keyname=OBJECT_ID&crm-object-value=" +
				sActivityId + " " +
				"\n\n\n------------------------------------------------------------------------------------------------------------------\n" +
				"DISCLAIMER: This document is confidential and should only be used internally.\n" +
				"------------------------------------------------------------------------------------------------------------------" +
				"\n\nCreated by MCC SOS app"; */

			var sShareEmailText = "Dear colleague,\n\nPlease have a look at MCC Activity " + sActivityId + "." + sNote +
				"\n\nTo access the MCC Activity please use the links below." +
				"\n\nLink to UI5 App:\nht" + "tps://" + sUrlPara + sActivityId +
				" " + "\n\nLink to CRM Web UI:\nht" + "tps://ic" + this.getSystem() +
				".wdf.sap.corp/sap(bD1lbiZjPTAwMSZkPW1pbg==)/bc/bsp/sap/crm_ui_start/default.htm?crm-object-type=BT126_APPT&crm-object-action=B&sap-language=EN&crm-object-keyname=OBJECT_ID&crm-object-value=" +
				sActivityId + " " +
				"\n\n\n------------------------------------------------------------------------------------------------------------------\n" +
				"DISCLAIMER: This document is confidential and should only be used internally.\n" +
				"------------------------------------------------------------------------------------------------------------------" +
				"\n\nCreated by MCC SOS app"; //Created by FSC2 App
			if (this.getOwnerComponent().getModel("device").getProperty("/isPhone") && sRecipient !== "") {
				sRecipient += "@exchange.sap.corp";
			}

			sap.m.URLHelper.triggerEmail(sRecipient, sSubject, sShareEmailText, sCcAddress);
		},

		_checkValidEmailTo: function (oStr) {
			if (!oStr) {
				return false;
			} else {
				switch (oStr.substr(0, 1)) {
				case "D":
				case "I":
					return oStr.length === 7 && /^[0-9]+$/.test(oStr.substr(1, 6));
				case "C":
					return oStr.length === 8 && /^[0-9]+$/.test(oStr.substr(1, 7));
				default:
					return this._emailFormatCheck(oStr);
				}
			}
		},

		_emailFormatCheck: function (oText) {
			var reg =
				/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
			return reg.test(oText);
		},

		getSystem: function () {
			var sReturnValue = "d";
			var sUrl = window.location.href;
			if (sUrl.indexOf("br339jmc4c") > -1) { //wfd7746b4
				sReturnValue = "d";
			} else if (sUrl.indexOf("sapitcloudt") > -1) {
				sReturnValue = "t";
			} else if (sUrl.indexOf("sapitcloud") > -1) {
				sReturnValue = "p";
			} else if (sUrl.indexOf("fiorilaunchpad.sap") > -1) {
				sReturnValue = "p";
			}
			return sReturnValue;
		},
		onOverflow: function (oEvent) {
			var oButton = oEvent.getSource();
			if (!this._actionSheet) {
				this._actionSheet = sap.ui.xmlfragment("sap.support.fsc2.view.fragments.MCCDetailActionSheet", this);
				this.getView().addDependent(this._actionSheet);
			}
			this._actionSheet.openBy(oButton);
		},

		onScrollTop: function (oEvent) {
			this.getView().byId("idDetailPage")._getPage().getScrollDelegate().scrollTo(0, 0, 0);
		},

		onScrollBottom: function (oEvent) {
			this.getView().byId("idDetailPage")._getPage().getScrollDelegate().scrollTo(0, 100000, 0);
		},

		onIconTabFilterChanged: function (oEvent) {
			if (oEvent.getParameter("selectedKey") === "Notes") {
				this.getView().byId("scrollUpButton").setVisible(true);
				this.getView().byId("scrollDownButton").setVisible(true);
				this.onScrollBottom();

			} else {
				this.getView().byId("scrollUpButton").setVisible(false);
				this.getView().byId("scrollDownButton").setVisible(false);
			}
		},
		closeActivity: function (oEvent) {
			//change the value of the state box  "E0014"
			//this.getView().byId("status").setSelectedKey("E0014"); 
			this.getModel("MCCPageConfig").setProperty("/close", true);
			this.saveActivity();
			this.getModel("MCCPageConfig").setProperty("/close", false);
			document.cookie = "qualtrics=close";
			this.fillEmbeddedData(); // feedbackform

		},
		formatMasterBtnEnable: function () {
			//sUserId, sCreator, aPartiesInvolved, fDisplay, sStatus
			//return false;
			var sUserId = this.getOwnerComponent().getModel("CurrentUserInfo").getData().UserID;
			var sCreator = this.getOwnerComponent().getModel("MCCDetail").getData().activity_created_by;
			var aPartiesInvolved = this.getOwnerComponent().getModel("MCCDetail").getData().FSC2Activity_Parties;
			var fDisplay = this.getOwnerComponent().getModel("MCCPageConfig").getData().display;
			var sStatus = this.getOwnerComponent().getModel("MCCDetail").getData().activity_status;

			var bResult = false;
			//return false
			if (sUserId && fDisplay && sStatus && sStatus !== "E0014") {
				if (sCreator && sCreator === sUserId) {
					bResult = true; // the user is the creator of the activity
				} else if (aPartiesInvolved && Array.isArray(aPartiesInvolved.results)) {
					var fRequestor = false;
					$.each(aPartiesInvolved.results, function (index, item) {
						if (item.parties_function === "Requestor" && item.xubname === sUserId) {
							fRequestor = true;
							return false; // this just breaks out of the each loop
						}
					});
					bResult = fRequestor;
				} else {
					bResult = false;
				}
			} else {
				bResult = false;
			}
			this.getModel("MCCPageConfig").setProperty("/bCloseButton", bResult);
		},
		feedback: function () { //Qualtrics // call the feedback form
			document.cookie = "qualtrics=permanent";
			this.fillEmbeddedData();

		},

	});

});
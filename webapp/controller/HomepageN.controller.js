sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/support/fsc2/model/formatter',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	'sap/m/MessageBox'
], function (BaseController, formatter, JSONModel, Filter, ODataModel, models, MessageBox) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.HomepageN", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.support.fsc2.view.HomepageN
		 */
		formatter: formatter,
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.setModel(new JSONModel(), "history");
			this.setModel(new JSONModel(), "suggestion");
			this.SearchDescription = "";
			this.bSelectItem = false;
			this.oCategory = {
				"ALL": "ALL"
			};
			this.setModel(new JSONModel(), "requestSet");
			this.setModel(new JSONModel(), "activitySet");
			//setting case value help
			this.setModel(new JSONModel({
				"case_id": "",
				"customer_r3_no": "",
				"customer_bp_id": "",
				"customer_name": "",
				"free_text": ""
			}), "caseSearch");
			this.setModel(new JSONModel({}), "ActivityCaseList");
			this.onCloseInputSuggest();
			this.getRouter().getRoute("homepage").attachPatternMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function () {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			this.onCheckUserAuth();
			this.refreshFavoriteIncidentsModel();
		},
		onNavToDashboard: function () {
			this.oRouter.navTo("dashboard", {
				layout: "OneColumn"
			});
		},

		onCheckUserAuth: function () {
			var that = this;
			var oData = this.getModel("user").getData();
			if (!oData || oData.Userid === undefined) {
				setTimeout(function () {
					that.onCheckUserAuth();
				}, 100);
			} else {
				/******comment:
				This method checks whether the user has authorization to use the app. If it is true, the functions, such as setting, notification, search, load data, create in home page could be used.
				******/
				var fAuthgeneral = this.getModel("user").getProperty("/Authgeneral");
				if (fAuthgeneral) {
					this._mapCategory();
					this.loadHistroyData();
					this.getEventBus().publish("Request", "_onRouteMatched");
					this.getEventBus().publish("myActivity", "_onRouteMatched");
					this.getView().byId("createBtn").setEnabled(true);
					this.getView().byId("notificationBtn").setEnabled(true);
					this.getView().byId("settingBtn").setEnabled(true);
					this.getView().byId("searchField").setEnabled(true);
				} else {
					sap.m.MessageToast.show("You have no authoration to use this app.");
					this.getView().byId("createBtn").setEnabled(false);
					this.getView().byId("notificationBtn").setEnabled(false);
					this.getView().byId("settingBtn").setEnabled(false);
					this.getView().byId("searchField").setEnabled(false);
					this.getEventBus().publish("Request", "tbUnvisible");
				}
			}
		},
		loadHistroyData: function () {
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				urlParameters: {
					$top: "6",
					$orderby: "Field desc"
				},
				filters: [new Filter("Attribute", "EQ", "APP_FSC2_SEARCH_HISTORY")],
				success: function (oData) {
					this.getModel("history").setData(oData);
				}.bind(this),
				error: function (oError) {
					this.getModel("history").setData({
						"results": []
					});
				}.bind(this)
			});
		},
		_mapCategory: function () {
			var that = this;
			var aCategory = ["searchCustomer", "searchSituation", "searchIncident"];
			aCategory.forEach(function (v) {
				that.oCategory[that.getResourceBundle().getText(v)] = v;
			});
		},
		onNavToNotification: function () {
			//	this.eventUsage("notification\' view");
			//	this.getRouter().navTo("notification");

			this.getRouter().navTo("notificationFCL", {
				layout: "MidColumnFullScreen"
			});
		},
		onNavToSubscription: function () {
			// this.getView().setBusy(true);
			this.getRouter().navTo("subscription");
		},
		onSettingPress: function () {
			var oData = this.getModel("homePageConfig").getData();
			this.oInitSettingData = JSON.parse(JSON.stringify(oData));
			if (!this._oSettingDialog) {
				this._oSettingDialog = new sap.ui.xmlfragment("SettingFragId", "sap.support.fsc2.view.fragments.Settings", this);
			}
			this.getView().addDependent(this._oSettingDialog);
			this._oSettingDialog.setModel(this.getModel("homePageConfig"), "homePageConfig");
			this._oSettingDialog.open();
			// this._updateSetting();
		},
		onConfirmSetting: function () {
			this.eventUsage(false, "Confirm configure setting");
			var oState = this.getModel("homePageConfig").getProperty("/expertMode");
			var oExpertEntry = {
				"Attribute": "APP_FSC2_EXPERT_MODE",
				"Value": oState ? "YES" : "NO"
			};
			sap.support.fsc2.UserProfileModel.create("/Entries", oExpertEntry);

			var oNotiState = this.getModel("homePageConfig").getProperty("/enableNotification");
			var oNofiEntry = {
				"Attribute": "NEED_FSC2_PUSHNOTIFICATION",
				"Value": oNotiState ? "YES" : "NO"
			};
			sap.support.fsc2.UserProfileModel.create("/Entries", oNofiEntry);

			var oSaMState = this.getModel("homePageConfig").getProperty("/enableSaM");
			var oSaMEntry = {
				"Attribute": "APP_FSC2_USE_SAM",
				"Value": oSaMState ? "YES" : "NO"
			};
			sap.support.fsc2.UserProfileModel.create("/Entries", oSaMEntry);

			var sEnableDefaultCase = this.getModel("homePageConfig").getProperty("/enableDefaultCase");
			var sEnableCaseEntity = {
				"Attribute": "APP_FSC2_USE_ENG_CASE ",
				"Value": sEnableDefaultCase ? "YES" : "NO"
			};
			sap.support.fsc2.UserProfileModel.create("/Entries", sEnableCaseEntity);

			var sDefaultCase = this.getModel("homePageConfig").getProperty("/defaultCase");
			var sCaseEntity = {
				"Attribute": "APP_MCC_ACTIVITIES_DEFAULT_CASE",
				"Value": sDefaultCase
			};
			sap.support.fsc2.UserProfileModel.create("/Entries", sCaseEntity);
			this._oSettingDialog.close();
		},
		onCacelSetting: function () {
			this.getModel("homePageConfig").setData(this.oInitSettingData);
			this._oSettingDialog.close();
		},
		onSearch: function (oEvent) {
			var item = oEvent.getParameter("suggestionItem");
			var sValue = "";
			if (item) {
				sValue = item.getText().trimStart();
				this.SearchDescription = item.getDescription() || "ALL";
				this.bSelectItem = true;
				if (sValue) {
					this._updateHistory(sValue);
					this.getRouter().navTo("search", {
						"value": encodeURIComponent(sValue),
						"description": this.oCategory[this.SearchDescription]
					});
				}
			} else {
				if (!this.bSelectItem) {
					this.SearchDescription = "ALL";
					sValue = oEvent.getParameter("query").trimStart();
					if (sValue) {
						this._updateHistory(sValue);
						this.getRouter().navTo("search", {
							"value": encodeURIComponent(sValue),
							"description": this.oCategory[this.SearchDescription]
						});
					}
				}
				this.bSelectItem = false;
			}
		},
		_updateHistory: function (sValue) {
			var aHistroy = this.getModel("history").getData().results || [];
			var sGroup = "myHistory";
			sap.support.fsc2.UserProfileModel.setUseBatch(true);
			sap.support.fsc2.UserProfileModel.setDeferredGroups([sGroup]);
			var aEntries = [];
			for (var i = aHistroy.length - 1; i >= 0; i--) {
				if (aHistroy[i].Value.toUpperCase() !== sValue.toUpperCase()) {
					aEntries.push({
						"Attribute": "APP_FSC2_SEARCH_HISTORY",
						"Value": aHistroy[i].Value
					});
				}
			}
			aEntries.push({
				"Attribute": "APP_FSC2_SEARCH_HISTORY",
				"Value": sValue
			});
			for (var j = 0; j < aEntries.length; j++) {
				sap.support.fsc2.UserProfileModel.create("/Entries", aEntries[j], {
					groupId: sGroup
				});
			}
			sap.support.fsc2.UserProfileModel.remove("/Entries(Username='',Attribute='APP_FSC2_SEARCH_HISTORY',Field='')", {
				success: function () {
					sap.support.fsc2.UserProfileModel.submitChanges({
						groupId: sGroup,
						success: function () {
							sap.support.fsc2.UserProfileModel.setUseBatch(false);
						}
					});
				}
			});
		},
		onSuggest: function (oEvent) {
			var value = oEvent.getParameter("suggestValue");
			this._updateSuggestionModel(value);
			var oSearchField = oEvent.getSource();
			oSearchField.suggest();
		},
		_updateSuggestionModel: function (value) {
			var that = this;
			var sValue = value.trim();
			var oHistoryModel = this.getModel("history");
			var aHistoryData = oHistoryModel.getData().results;
			var aSuggestionData = [];
			if (aHistoryData) {
				for (var i = 0, len = aHistoryData.length; i < len; i++) {
					if (aHistoryData[i].Value.toUpperCase().indexOf(sValue.toUpperCase()) > -1) {
						aSuggestionData.push({
							"Name": aHistoryData[i].Value,
							"Description": ""
						});
					}
				}
			}
			var aCategory = ["searchCustomer", "searchSituation", "searchIncident"];
			var aSuggestionCategory = [];
			if (sValue) {
				aCategory.forEach(function (v) {
					aSuggestionCategory.push({
						"Name": sValue,
						"Description": that.getResourceBundle().getText(v)
					});
				});
				aSuggestionData = aSuggestionData.concat(aSuggestionCategory);
			}
			var oSuggestionModel = this.getModel("suggestion");
			oSuggestionModel.setData({
				"results": aSuggestionData
			});
		},
		onCreateIssue: function () {
			var oState = this.getModel("homePageConfig").getProperty("/expertMode");
			if (oState) {
				this.onOpenExpertDialog();
			} else {
				this.eventUsage("create\' view");
				// var sDefaultCase = this.getModel("homePageConfig").getProperty("/defaultCase");
				// var sDefaultCustNo = this.getModel("homePageConfig").getProperty("/defaultCustNo").replace(/\b(0+)/gi, "");
				// var sDefaultCustName = this.getModel("homePageConfig").getProperty("/defaultCustName");
				this.getRouter().navTo("createByDefault");
			}
		},
		onOpenHelpJAM: function () {
			this.getRouter().navTo("help");
			/*	
				var confirmDialog = new sap.m.Dialog({
					title: "Help",
					type: "Message",
					content: [
						new sap.m.Text({
							text: "To report issues or request new functions, please go to our JAM page at "
						}),
						new sap.m.Link({
							text: "https" + "://jam4.sapjam.com/groups/Uit0yfV4hybEaihDxSX6LD",
							wrapping: true,
							target: "_blank",
							href: "https" + "://jam4.sapjam.com/groups/Uit0yfV4hybEaihDxSX6LD"
						}).addStyleClass("sapUiSelectable")
					],
					beginButton: new sap.m.Button({
						text: "Go to JAM Page",
						press: function () {
							this.eventUsage(false, "Open JAM page");
							var url = "https" + "://jam4.sapjam.com/groups/Uit0yfV4hybEaihDxSX6LD";
							if (!sap.Push) {
								window.open(url);
							} else {
								window.location.href = url;
							}
							confirmDialog.close();
						}.bind(this)
					}),
					endButton: new sap.m.Button({
						text: "Cancel",
						press: function () {
							confirmDialog.close();
						}
					}),
					afterClose: function () {
						confirmDialog.destroy();
					}
				});

				confirmDialog.open();
				*/
		},
		onCaseHelp: function () {
			this._oCaseDialog = new sap.ui.xmlfragment("DefaultCaseFragId", "sap.support.fsc2.view.fragments.CaseSearch", this);
			this.getView().addDependent(this._oCaseDialog);
			this.getModel("ActivityCaseList").setData();
			this._oCaseDialog.open();
		},
		onCloseCaseDialog: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			this.getModel("caseSearch").setData({
				"case_id": "",
				"customer_r3_no": "",
				"customer_bp_id": "",
				"customer_name": "",
				"free_text": ""
			});
			this.getModel("caseSearch").refresh();
			this.getModel("ActivityCaseList").setData();
			this.getModel("ActivityCaseList").refresh();
			oDialog.close();
			this._oCaseDialog.destroy();
		},
		onConfirmCaseSecect: function (oEvent) {
			var selestecItem = sap.ui.core.Fragment.byId("DefaultCaseFragId", "iResultsList").getSelectedItem();
			if (!selestecItem) {
				sap.m.MessageBox.warning("Please select one case first");
				return;
			} else {
				var sObject = selestecItem.getBindingContext("ActivityCaseList").getObject();
				sap.ui.core.Fragment.byId("SettingFragId", "idDefaultCase").setValue(sObject.case_id);
				this.getModel("homePageConfig").setProperty("/defaultCase", sObject.case_id);
				this.getModel("homePageConfig").setProperty("/defaultCustNo", sObject.customer_r3_no);
				this.getModel("homePageConfig").setProperty("/defaultCustName", sObject.customer_name);
			}
			this.onCloseCaseDialog(oEvent);
		},
		getCaseFilter: function () {
			var aFilter = [];
			var oCaseSearchData = this.getModel("caseSearch").getData();
			if (oCaseSearchData.case_id !== "") {
				aFilter.push(new sap.ui.model.Filter("case_id", "EQ", oCaseSearchData.case_id));
			}
			if (oCaseSearchData.customer_r3_no !== "") {
				aFilter.push(new sap.ui.model.Filter("customer_r3_no", "EQ", oCaseSearchData.customer_r3_no));
			}
			if (oCaseSearchData.customer_bp_id !== "") {
				aFilter.push(new sap.ui.model.Filter("customer_bp_id", "EQ", oCaseSearchData.customer_bp_id));
			}
			if (oCaseSearchData.customer_name !== "") {
				aFilter.push(new sap.ui.model.Filter("customer_name", "EQ", oCaseSearchData.customer_name));
			}
			if (oCaseSearchData.free_text !== "") {
				aFilter.push(new sap.ui.model.Filter("free_text", "EQ", oCaseSearchData.free_text));
			}
			//case_type ZS02 Engagement Cases
			aFilter.push(new sap.ui.model.Filter("case_type", "EQ", "ZS02"));
			//status without 90 Closed, 98 Restricts
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "71"));
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "80"));
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "81"));
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "99"));

			return aFilter;
		},
		onPressCaseSearch: function (oEvent) {
			var that = this;
			var sTable = sap.ui.core.Fragment.byId("DefaultCaseFragId", "iResultsList");
			sTable.setBusy(true);
			sap.support.fsc2.FSC2Model.read("/CasesSet", {
				filters: that.getCaseFilter(),
				success: function (oData) {
					that.getModel("ActivityCaseList").setData(oData);
					sTable.setBusy(false);
				},
				error: function () {
					sTable.setBusy(false);
				}
			});
		},
		onSearchCaseID: function (oEvent) {
			var sDefaultCtrl = oEvent.getSource();
			var sValue = sDefaultCtrl.getValue();
			var aFilter = [];
			if (sValue !== "") {
				aFilter.push(new Filter("case_id", "EQ", sValue));
				//case_type ZS02 Engagement Cases
				aFilter.push(new sap.ui.model.Filter("case_type", "EQ", "ZS02"));
				//status without 90 Closed, 98 Restricts
				aFilter.push(new sap.ui.model.Filter("status", "EQ", "71"));
				aFilter.push(new sap.ui.model.Filter("status", "EQ", "80"));
				aFilter.push(new sap.ui.model.Filter("status", "EQ", "81"));
				aFilter.push(new sap.ui.model.Filter("status", "EQ", "99"));
			} else {
				return;
			}
			sap.support.fsc2.FSC2Model.read("/CasesSet", {
				filters: [aFilter],
				success: function (oData) {
					if (!oData.results || oData.results.length === 0) {
						sap.m.MessageBox.warning("Couldn't find the case.\nPlease search the exact case id.", {
							title: "Warning",
							actions: [sap.m.MessageBox.Action.CLOSE]
						});
						this.getModel("homePageConfig").setProperty("/defaultCase", "");
						sDefaultCtrl.setValue();
					} else {
						this.getModel("homePageConfig").setProperty("/defaultCase", sValue);
					}
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
				}.bind(this)
			});
		}

	});

});
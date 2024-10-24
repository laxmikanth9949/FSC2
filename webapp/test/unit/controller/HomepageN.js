sap.ui.require([
	"sap/support/fsc2/controller/HomepageN.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/m/SearchField",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"

], function (HomepageN, model, ManagedObject, ResourceModel, SearchField, Filter, JSONModel, ODataModel) {
	"use strict";
	QUnit.module("Homepage", {
		beforeEach: function () {
			this.oHomepage = new HomepageN();
			this.oHistoryModel = new JSONModel();
			this.oHistoryModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/suggestion.json"), {}, false);
			this.oSuggestionModel = new JSONModel();
			this.oModelI18n = new ResourceModel({
				bundleName: "sap.support.fsc2.i18n.i18n",
				bundleLocale: "EN"
			});
			this.oConfigModel = new JSONModel({
				"expertMode": false,
				"enableNotification": false,
				"createType": "",
				"defaultCustNo":"11010",
				"defaultCustName":"Bay Test Cust",
				"defaultCase":"20000792"
			});
			this.oComponent = new ManagedObject();
			this.oComponent.setModel(this.oHistoryModel, "history");
			this.oComponent.setModel(this.oSuggestionModel, "suggestion");
			this.oComponent.setModel(this.oConfigModel, "homePageConfig");
			this.oComponent.setModel(new JSONModel({
				"myRequests": 0,
				"myFavorites": 0,
				"myActivities": 0
			}), "homePageCount");
			this.oComponent.setModel(new JSONModel(), "activitySet");
			this.oComponent.setModel(new JSONModel(), "ActivityCaseList");
			this.oComponent.setModel(new JSONModel({
				"case_id": "",
				"customer_r3_no": "",
				"customer_bp_id": "",
				"customer_name": "",
				"free_text": ""
			}), "caseSearch");
			this.oComponent.setModel(new JSONModel({
				"Customer": {
					"count": "0",
					"expanded": false,
					"results": []
				},
				"Situation": {
					"count": "0",
					"expanded": false,
					"results": []
				},
				"Incident": {
					"count": "0",
					"expanded": false,
					"results": []
				}
			}), "favorite");
			// this.oComponent.setModel(new JSONModel({
			// 	"Userid": "",
			// 	"Authgeneral": "X"
			// }), "user");
			this.oComponent.setModel(this.oModelI18n, "i18n");
			sinon.stub(this.oHomepage, "getOwnerComponent").returns(this.oComponent);
			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
			});
			this.FSC2Read = sinon.stub(sap.support.fsc2.FSC2Model, "read");

			sap.support.fsc2.UserProfileModel = new ODataModel({
				json: true,
				useBatch: true,
				serviceUrl: "/sap/opu/odata/SVT/USER_PROFILE_SRV"
			});
			this.UserProfileCreate = sinon.stub(sap.support.fsc2.UserProfileModel, "create");
			this.UserProfileRead = sinon.stub(sap.support.fsc2.UserProfileModel, "read");
			this.UserProfileDelete = sinon.stub(sap.support.fsc2.UserProfileModel, "remove");

			var oView = {
				byId: function (sId) {},
				addDependent: function () {}
			};
			this.oControl = {
				setEnabled: function () {},
				getSelectedItem: function () {
					return new sap.m.ObjectListItem();
				}
			};
			sinon.stub(this.oHomepage, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);

			var oEventBus = {
				publish: function () {},
				subscribe: function () {}
			};
			this.stubEventBus = sinon.stub(this.oHomepage, "getEventBus").returns(oEventBus);

			var oResource = {
				getText: function (sText) {
					return "test";
				}
			};
			sinon.stub(this.oHomepage, "getResourceBundle").returns(oResource);

			sinon.stub(sap.support.fsc2.UserProfileModel, "submitChanges");
			this.oStubDialogOpen = sinon.stub(sap.m.Dialog.prototype, "open");
			this.oStubDialogClose = sinon.stub(sap.m.Dialog.prototype, "close");
			this.oStubMsgShow = sinon.stub(sap.m.MessageToast, "show");
			this.oStubMsgBoxWarn = sinon.stub(sap.m.MessageBox, "warning");
			this.oHomepage._oCustomerDialog = new sap.m.Dialog();
			sinon.stub(this.oHomepage, "eventUsage");
		},
		afterEach: function () {
			this.oHomepage.destroy();
			this.oHomepage.getOwnerComponent.restore();
			this.oComponent.destroy();
			sap.m.Dialog.prototype.open.restore();
			sap.m.Dialog.prototype.close.restore();
			sap.m.MessageBox.warning.restore();
			sap.m.MessageToast.show.restore();
			this.oHomepage._oCustomerDialog.destroy();
			if (this.oHomepage._oSettingDialog) {
				this.oHomepage._oSettingDialog.destroy();
			}
			if (this.oHomepage._oCaseDialog) {
				this.oHomepage._oCaseDialog.destroy();
			}
		}
	});
	QUnit.test("Init model when opening the app", function (assert) {
		var sAttach = {
			attachPatternMatched: function () {}
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "getRoute").returns(sAttach);
		var oStubRouter = this.stub(this.oHomepage, "getRouter").returns(router);

		//Action
		this.oHomepage.onInit();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Enter home page when opening the app with authoration", function (assert) {
		//Arrangment   
		this.oComponent.setModel(new JSONModel({
			"Userid": "",
			"Authgeneral": "X"
		}), "user");
		this.stub(this.oHomepage, "loadSettingData");
		this.stub(this.oHomepage, "loadHistroyData");
		this.oHomepage.oCategory = {
			"ALL": "ALL"
		};
		//Action
		this.oHomepage._onRouteMatched();
		//Assertion
		assert.equal(this.stubEventBus.callCount, 2);
	});

	QUnit.test("should wait until user model complete load data when check the user's authoration", function (assert) {
		//Arrangment   
		this.oComponent.setModel(new JSONModel(), "user");
		var oStub = this.stub(window, "setTimeout");
		//Action
		this.oHomepage.onCheckUserAuth();
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("Enter home page when opening the app without authoration", function (assert) {
		//Arrangment   
		this.oComponent.setModel(new JSONModel({
			"Userid": "",
			"Authgeneral": ""
		}), "user");
		this.stub(this.oHomepage, "loadSettingData");
		this.stub(this.oHomepage, "loadHistroyData");
		this.oHomepage.oCategory = {
			"ALL": "ALL"
		};
		//Action
		this.oHomepage._onRouteMatched();
		//Assertion
		assert.equal(this.stubEventBus.callCount, 1);
	});
	QUnit.test("Load 'Search History' data when open the app", function (assert) {
		//Arrangment   
		this.oHistoryModel = new JSONModel();
		this.oHistoryModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SearchHistory.json"), {}, false);
		var oData = this.oHistoryModel.getData();
		this.UserProfileRead.withArgs("/Entries").yieldsTo("success", oData);
		//Action
		this.oHomepage.loadHistroyData();
		//Assertion
		assert.equal(this.oHistoryModel.getData().results.length, "5");
	});

	QUnit.test("should return empty search history data when load 'Search History' data but get oData service error", function (assert) {
		//Arrangment   
		this.UserProfileRead.withArgs("/Entries").yieldsTo("error", {});
		//Action
		this.oHomepage.loadHistroyData();
		//Assertion
		assert.deepEqual(this.oComponent.getModel("history").getData().results, []);
	});

	

	QUnit.test("Display all history content when user entry nothing and just click the search field", function (assert) {
		// 	var oSearchField = new sap.m.SearchField();
		// var oEvent = new sap.ui.base.Event(null, oSearchField, {
		var sSearchValue = "";
		// });
		var oData = {
			"results": [{
				"Name": "202418",
				"Description": ""
			}, {
				"Name": "OSS corp. function",
				"Description": ""
			}, {
				"Name": "BMW",
				"Description": ""
			}, {
				"Name": "aPaul Pharma Test",
				"Description": ""
			}, {
				"Name": "Bayer",
				"Description": ""
			}]
		};
		//Action
		this.oHomepage._updateSuggestionModel(sSearchValue);
		//Assertion
		assert.deepEqual(this.oHomepage.getModel("suggestion").getData(), oData);
	});
	QUnit.test("Display all history content when user enter '202418'", function (assert) {
		var sSearchValue = "202418";
		var oData = {
			"results": [{
				"Description": "",
				"Name": "202418"
			}, {
				"Description": "test",
				"Name": "202418"
			}, {
				"Description": "test",
				"Name": "202418"
			}, {
				"Description": "test",
				"Name": "202418"
			}]
		};
		//Action
		this.oHomepage._updateSuggestionModel(sSearchValue);
		//Assertion
		assert.propEqual(this.oHomepage.getModel("suggestion").getData(), oData);
	});
	QUnit.test("Update 'Search History' data when trigger a new search", function (assert) {
		//Arrangment   
		this.UserProfileDelete.yieldsTo("success");

		//Action
		this.oHomepage._updateHistory("test 1");
		//Assertion
		assert.equal(sap.support.fsc2.UserProfileModel.submitChanges.callCount, "1");
	});

	QUnit.test("should update suggest history data and trigger suggestion when enter value for SearchField", function (assert) {
		//Arrangment   
		var oEvent = {
			getSource: function () {
				return new sap.m.SearchField({
					value: "10010"
				});
			},
			getParameter: function (sPara) {
				return {
					"results": []
				};
			}
		};
		// var sCtrl = oEvent.getSource();
		// var oStub1 = this.stub(sCtrl, "suggest");
		var oStub = this.stub(this.oHomepage, "_updateSuggestionModel");
		//Action
		this.oHomepage.onSuggest(oEvent);
		//Assertion
		// assert.equal(oStub1.callCount, 1);
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("onNavToNotification: nav to notification page when notification button was pressed", function (assert) {
		//Arrangment   
		var router = new sap.ui.core.routing.Router();
		var oStubNav = this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oHomepage, "getRouter").returns(router);

		//Action
		this.oHomepage.onNavToNotification();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
		assert.strictEqual(oStubNav.callCount, 1);
	});
	QUnit.test("should open Setting dialog after function onSettingPress", function (assert) {
		//Action
		// var oStubUpdate = this.stub(this.oHomepage, "_updateSetting");
		this.oHomepage.onSettingPress();
		//Assertion
		assert.equal(this.oStubDialogOpen.callCount, 1);
	});
	// QUnit.test("should set value for setting dialoig after run function _updateSetting", function (assert) {
	// 	this.oHomepage.onSettingPress();
	// 	this.oHomepage._updateSetting();
	// 	//Assertion
	// 	assert.equal(this.oComponent.getModel("homePageConfig").getProperty("/expertMode"), false);
	// });
	QUnit.test("should create setting data five times when clike 'confirm' button and run function onConfirmSetting:", function (assert) {
		// this.stub(this.oHomepage, "_updateSetting");
		this.oHomepage.onSettingPress();
		// this.oHomepage._updateSetting();
		this.oHomepage.onConfirmSetting();
		assert.strictEqual(this.UserProfileCreate.callCount, 5);
	});
	QUnit.test("should reset setting dialog after run function onCacelSetting:", function (assert) {
		// var oUpdateSet = this.stub(this.oHomepage, "_updateSetting");
		this.oHomepage.onSettingPress();
		this.oHomepage.onCacelSetting();
		assert.strictEqual(this.oStubDialogClose.callCount, 1);
	});
	QUnit.test("onSearch: search the result when a suggent item was pressed", function (assert) {
		//Arrangment   
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(new sap.m.SuggestionItem({
			"text": "12186",
			"description": ""
		}));
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oHomepage, "getRouter").returns(router);
		this.stub(this.oHomepage, "_updateHistory");
		this.oHomepage.oCategory = {
			"ALL": ""
		};

		//Action
		this.oHomepage.onSearch(oEvent);
		//Assertion
		assert.equal(oStubRouter.called, true);
	});
	QUnit.test("onSearch: search the result when no item was pressed", function (assert) {
		//Arrangment   
		var oEvent = new sap.ui.base.Event();
		var temp = this.stub(oEvent, "getParameter");
		temp.withArgs("suggestionItem").returns(undefined);
		temp.withArgs("query").returns("12186");
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oHomepage, "getRouter").returns(router);
		this.stub(this.oHomepage, "_updateHistory");
		this.oHomepage.oCategory = {
			"ALL": ""
		};

		//Action
		this.oHomepage.onSearch(oEvent);
		//Assertion
		assert.equal(oStubRouter.called, true);
	});
	QUnit.test("onCreateIssue: nav to create page when expertMode is false", function (assert) {
		//Arrangment   
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oHomepage, "getRouter").returns(router);
		this.oComponent.getModel("homePageConfig").setProperty("/expertMode", false);

		//Action
		this.oHomepage.onCreateIssue();
		//Assertion
		assert.equal(oStubRouter.called, true);
	});
	QUnit.test("onCreateIssue: nav to create page when expertMode is true", function (assert) {
		//Arrangment   
		var oStubRouter = this.stub(this.oHomepage, "onOpenExpertDialog");
		this.oComponent.getModel("homePageConfig").setProperty("/expertMode", true);

		//Action
		this.oHomepage.onCreateIssue();
		//Assertion
		assert.equal(oStubRouter.called, true);
	});
	
	QUnit.test("should navigate to help page when click help icon", function (assert) {
		//Action
		var router = new sap.ui.core.routing.Router();
		var oStubNav = this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oHomepage, "getRouter").returns(router);
		this.oHomepage.onOpenHelpJAM();
		//Assertion
		assert.equal(oStubNav.callCount, 1);
		assert.equal(oStubRouter.callCount, 1);
	});
	
	QUnit.test("should open help dialog when press help icon on homepage", function (assert) {
		//Action
		var oStubUpdate = this.oStubDialogOpen;
		this.oHomepage.onCaseHelp();
		//Assertion
		assert.equal(oStubUpdate.callCount, 1);
	});
	QUnit.test("should reset data for model caseSearch and ActivityCaseList when function onCloseCaseDialog", function (assert) {
		//Action
		var oEvent = {
			getSource: function () {}
		};
		this.oHomepage.onCaseHelp();
		var sCtrl = {
			getParent: function () {}
		};
		this.stub(oEvent, "getSource").returns(sCtrl);
		this.stub(sCtrl, "getParent").returns(this.oHomepage._oCaseDialog);
		this.oHomepage.onCloseCaseDialog(oEvent);
		var sData1 = this.oComponent.getModel("caseSearch").getData().case_id;
		var sData2 = this.oComponent.getModel("ActivityCaseList").getData();
		//Assertion
		assert.equal(sData1, "");
		assert.equal(sData2, null);
	});

	QUnit.test("should give warning message when press confirm on case value help dialog without select any case", function (assert) {
		//Action
		var oStubCloseCase = this.stub(this.oHomepage, "onCloseCaseDialog");
		this.oHomepage.onCaseHelp();
		this.oHomepage.onConfirmCaseSecect();
		//Assertion
		assert.equal(oStubCloseCase.callCount, 0);
		assert.equal(this.oStubMsgBoxWarn.callCount, 1);
	});

	QUnit.test("should call onCloseCaseDialog once when select one case and press confirm on case value help dialog", function (assert) {
		//Action
		var oCtrl = {
			setValue: function () {},
			getSelectedItem: function () {
				return {
					getBindingContext: function () {
						return {
							getObject: function () {
								return {
									"case_id": "20000972"
								};
							}
						};
					}
				};
			}
		};
		this.stub(sap.ui.core.Fragment, "byId").returns(oCtrl);
		var oStubCloseCase = this.stub(this.oHomepage, "onCloseCaseDialog");
		// this.oHomepage.onCaseHelp();
		this.oHomepage.onConfirmCaseSecect();
		//Assertion
		assert.equal(oStubCloseCase.callCount, 1);
	});

	QUnit.test("should return filter array when run function getCaseFilter", function (assert) {
		//Action
		this.oComponent.getModel("caseSearch").setData({
			"case_id": "111111",
			"customer_r3_no": "111111",
			"customer_bp_id": "111111",
			"customer_name": "text",
			"free_text": "text"
		});
		var aFilterLength = this.oHomepage.getCaseFilter().length;
		//Assertion
		assert.equal(aFilterLength, 10);
	});
	QUnit.test("should run read FSC2Model once whensearch case on value help dialog", function (assert) {
		//Action
		// this.oHomepage.onCaseHelp();
		var oCtrl = {
			setBusy:function(){}
		};
		this.stub(this.oHomepage,"getCaseFilter").returns([]);
		this.stub(sap.ui.core.Fragment, "byId").returns(oCtrl);
		this.FSC2Read.withArgs("/CasesSet").yieldsTo("success",{"results":[]});
		this.oHomepage.onPressCaseSearch();
		//Assertion
		assert.equal(this.FSC2Read.callCount, 1);
	});
	QUnit.test("should run read FSC2Model once and give warning message when run function onSearchCaseID and got no results", function (assert) {
		//Action
		var oEvent = {
			getSource: function () {}
		};
		var sCtrl = {
			getValue: function () {
				return "searchValue";
			},
			setValue:function(){}
		};
		var oData = {
			"results":[
				]
		};
		this.FSC2Read.withArgs("/CasesSet").yieldsTo("success",oData);
		this.stub(oEvent, "getSource").returns(sCtrl);
		this.oHomepage.onSearchCaseID(oEvent);
		//Assertion
		assert.equal(this.FSC2Read.callCount, 1);
	});
	
	QUnit.test("should return without reading FSC2Model when enter empty content and trigger change function", function (assert) {
		//Action
		var oEvent = {
			getSource: function () {}
		};
		var sCtrl = {
			getValue: function () {
				return "";
			},
			setValue:function(){}
		};
		// var oData = {
		// 	"results":[
		// 		]
		// };
		// this.FSC2Read.withArgs("/CasesSet").yieldsTo("success",oData);
		this.stub(oEvent, "getSource").returns(sCtrl);
		this.oHomepage.onSearchCaseID(oEvent);
		//Assertion
		assert.equal(this.FSC2Read.callCount, 0);
	});
	
	QUnit.test("should set value to defaultCase when get search results for entered case id", function (assert) {
		//Action
		var oEvent = {
			getSource: function () {}
		};
		var sCtrl = {
			getValue: function () {
				return "20000972";
			},
			setValue:function(){}
		};
		var oData = {
			"results":[
				{"case_id" : "20000972"}
				]
		};
		this.FSC2Read.withArgs("/CasesSet").yieldsTo("success",oData);
		this.stub(oEvent, "getSource").returns(sCtrl);
		this.oHomepage.onSearchCaseID(oEvent);
		//Assertion
		assert.equal(this.FSC2Read.callCount, 1);
		assert.equal(this.oComponent.getModel("homePageConfig").getProperty("/defaultCase"), "20000972");
	});
	
	QUnit.test("should give error message when entered case id and press enter then get oData service error", function (assert) {
		//Action
		var oStub = this.stub(this.oHomepage, "showErrorMessage");
		var oEvent = {
			getSource: function () {}
		};
		var sCtrl = {
			getValue: function () {
				return "20000972";
			},
			setValue:function(){}
		};
		this.FSC2Read.withArgs("/CasesSet").yieldsTo("error",{});
		this.stub(oEvent, "getSource").returns(sCtrl);
		this.oHomepage.onSearchCaseID(oEvent);
		//Assertion
		assert.equal(this.FSC2Read.callCount, 1);
		assert.equal(oStub.callCount, 1);
	});
	
});
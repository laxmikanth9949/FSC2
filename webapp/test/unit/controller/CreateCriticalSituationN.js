sap.ui.require([
	"sap/support/fsc2/controller/CreateCriticalSituationN.controller",
	"sap/support/fsc2/model/models",
	"sap/m/MessageBox",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (CreateCriticalSituationN, models, MessageBox, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";
	QUnit.module("CreateCriticalSituation", {
		beforeEach: function () {
			this.oCriticalSituation = new CreateCriticalSituationN();
			this.oComponent = new ManagedObject();
			this.oIncidentListModel = new JSONModel();
			this.oIncidentListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentList.json"), {}, false);
			this.oComponent.setModel(this.oIncidentListModel, "incidentList");
			this.oComponent.setModel(new JSONModel({"bEnable":true}), "EnableSnowCase");
			this.oSNowCaseListModel = new JSONModel();
			this.oSNowCaseListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SNowCasesList.json"), {}, false);
			this.oComponent.setModel(this.oSNowCaseListModel, "snowCaseList");

			this.oIncidentLongTextModel = new JSONModel();
			this.oIncidentLongTextModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentLongText.json"), {}, false);
			this.oComponent.setModel(this.oIncidentLongTextModel, "incidentLongText");
			this.oCriticalModel = new JSONModel({
				"CustomerNo": "",
				"CustomerNoEdit": true,
				"CustomerName": "",
				"BusinessImpact": {
					"Text": ""
				},
				"AllSelected": [],
				"CaseID": ""
			});
			this.oComponent.setModel(new JSONModel({
				"expertMode": false,
				"enableNotification": false,
				"enableDefaultCase": true,
				"defaultCase": "20001311",
				"defaultCustNo": "10010",
				"defaultCustName": "Robert Bosch GmbH",
				"createType": ""
			}), "homePageConfig");
			this.oIncidentModel = new JSONModel();
			this.oModelI18n = new ResourceModel({
				bundleName: "sap.support.fsc2.i18n.i18n",
				bundleLocale: "EN"
			});
			this.oCustomerSearch = new JSONModel({
				CustomerNo: "12186",
				CustomerName: "",
				CustomerBPNo: ""
			});
			this.oComponent.setModel(new JSONModel({
				"AddIncBtn": true
			}), "FieldVisible");
			this.oComponent.setModel(this.oCustomerSearch, "customerSearch");
			this.oComponent.setModel(new JSONModel(), "customerList");
			this.oComponent.setModel(new JSONModel(), "SelectIncident");
			this.oComponent.setModel(this.oCriticalModel, "createCriticalSituation");
			this.keyWordsModel = new JSONModel();
			this.oComponent.setModel(this.keyWordsModel, "keyWords");
			this.keyWordsModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/KeyWords.json"), {}, false);
			this.oComponent.setModel(new JSONModel({
				"results": [{
					"id": "002075129500001194302020",
					"title": "Paul Donaldson Test CDS - PLEASE IGNORE",
					"desc": "119430/2020 In progress",
					"priority": "2",
					"IncidentNum": "002075129500001194302020",
					"Sys_ID": "c487e4da1bcb88d0461c777c8b4bcb3a",
					"SNow_number": "CS20200000230672"
				}, {
					"id": "002028376700002880862020",
					"title": "THIS IS A TEST CHAT",
					"desc": "288086/2020 In progress",
					"priority": "2",
					"IncidentNum": "002028376700002880862020",
					"Sys_ID": "64a567501bd7c810f0e310a38b4bcbb6",
					"SNow_number": "CS20200000288086"
				}]
			}), "selectedIncidentList");
			sinon.stub(this.oCriticalSituation, "getOwnerComponent").returns(this.oComponent);
			this.oComponent.setModel(new JSONModel({
				"case_id": "",
				"customer_r3_no": "",
				"customer_bp_id": "",
				"customer_name": "",
				"free_text": ""
			}), "caseSearch");
			this.oComponent.setModel(new JSONModel({}), "ActivityCaseList");
			var oView = {
				byId: function (sId) {},
				setBusy: function () {},
				addDependent: function () {}
			};
			this.oControl = {
				setBusy: function () {},
				setVisible: function () {},
				selectAll: function () {},
				setValueState: function () {},
				setEnabled: function () {},
				setValidated: function (sFlag) {},
				getItems: function () {
					return [];
				},
				getIncompleteItems: function () {
					return [];
				},
				removeAllItems: function () {},
				removeAllIncompleteItems: function () {},
				removeIncompleteItem: function () {},
				removeAllHeaderFields: function () {},
				getContent: function () {
					return [];
				},
				setState: function () {},
				getState: function () {
					return true;
				},
				setValue: function () {},
				getValue: function () {},
				setActive: function () {},
				setSelected: function () {},
				addHeaderParameter: function () {},
				addHeaderField: function () {}
			};
			sinon.stub(this.oCriticalSituation, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);
			sap.support.fsc2.IncidentModel = new ODataModel({
				json: true,
				serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
			});
			this.IncidentRead = sinon.stub(sap.support.fsc2.IncidentModel, "read");
			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV",
				defaultUpdateMethod: "Put"
			});
			this.Fsc2Read = sinon.stub(sap.support.fsc2.FSC2Model, "read");
			this.Fsc2Create = sinon.stub(sap.support.fsc2.FSC2Model, "create");
			sap.support.fsc2.UserProfileModel = new ODataModel({
				json: true,
				useBatch: true,
				serviceUrl: "/sap/opu/odata/SVT/USER_PROFILE_SRV"
			});
			this.oCriticalSituation.oFileModel = new ODataModel({
				json: true,
				useBatch: true,
				serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
			});
			this.UserProfileCreate = sinon.stub(sap.support.fsc2.UserProfileModel, "create");
			this.UserProfileRead = sinon.stub(sap.support.fsc2.UserProfileModel, "read");
			// this.UserProfileDelete = sinon.stub(sap.support.fsc2.UserProfileModel, "remove");
			var oResource = {
				getText: function (sText) {
					return "";
				}
			};
			sinon.stub(this.oCriticalSituation, "getResourceBundle").returns(oResource);
			// sinon.stub(this.oCriticalSituation, "_onInitCreate");
			// this.oCriticalSituation._oDialog = {
			// 	setBusy: function () {},
			// 	open: function () {},
			// 	close: function () {},
			// 	destroy:function () {}
			// };
			// this.oCriticalSituation._oSelectDialog = {
			// 	setBusy: function () {},
			// 	open: function () {},
			// 	close: function () {},
			// 	destroy:function () {}
			// };
			this.oStubMsgShow = sinon.stub(sap.m.MessageToast, "show");
			var oEventBus = {
				publish: function () {},
				subscribe: function () {}
			};
			this.stubEventBus = sinon.stub(this.oCriticalSituation, "getEventBus").returns(oEventBus);
			this.stubEventReg = sinon.stub(this.oCriticalSituation, "eventUsage");
			this.oStubMsgBoxWarn = sinon.stub(MessageBox, "warning");
			this.oStubMsgBoxError = sinon.stub(MessageBox, "error");
			this.oStubMsgBoxSuccess = sinon.stub(MessageBox, "success");
			this.oStubDialogOpen = sinon.stub(sap.m.Dialog.prototype, "open");
			this.oStubDialogClose = sinon.stub(sap.m.Dialog.prototype, "close");
			// sinon.stub(this.oCriticalSituation, "loadDefaultCase");
		},
		afterEach: function () {
			sap.m.MessageToast.show.restore();
			sap.m.MessageBox.warning.restore();
			sap.m.MessageBox.error.restore();
			sap.m.MessageBox.success.restore();
			this.oCriticalSituation.destroy();
			sap.m.Dialog.prototype.open.restore();
			sap.m.Dialog.prototype.close.restore();
			this.oCriticalSituation.getOwnerComponent.restore();
			this.oComponent.destroy();
			if (this.oCriticalSituation._oDialog) {
				this.oCriticalSituation._oDialog.close();
				this.oCriticalSituation._oDialog.destroy();
			}
			if (this.oCriticalSituation._oCaseDialog) {
				// this.oCriticalSituation._oCaseDialog.close();
				this.oCriticalSituation._oCaseDialog.destroy();
			}
			if (this.oCriticalSituation._oSelectDialog) {
				this.oCriticalSituation._oSelectDialog.close();
				this.oCriticalSituation._oSelectDialog.destroy();
			}

		}
	});
	QUnit.test("Init when entering create page", function (assert) {
		// this.stub(this.oCriticalSituation, "loadDefaultCase");
		var sAttach = {
			attachPatternMatched: function () {}
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "getRoute").returns(sAttach);
		var oStubRouter = this.stub(this.oCriticalSituation, "getRouter").returns(router);

		//Action
		this.oCriticalSituation.onInit();
		//Assertion
		assert.equal(oStubRouter.callCount, 4);
	});

	QUnit.test("should run _onRouteMatched once when press set default button without deault case", function (assert) {
		//Arrangment
		var oParam = {
			"caseid": "",
			"custnum": "",
			"custname": ""
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.stub(this.oCriticalSituation.__proto__, "_loadKeyWords");
		//Action
		this.oCriticalSituation._onRouteMatched(oEvent);

		//Assertion
		assert.equal(this.oCriticalSituation._loadKeyWords.callCount, 1);
	});

	QUnit.test("Create a new request when click create button on Homepage with deault case and customerNo", function (assert) {
		//Arrangment
		var oParam = {
			"caseid": "20001311",
			"custnum": "10010",
			"custname": "Robert Bosch GmbH"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.stub(this.oCriticalSituation.__proto__, "_loadKeyWords");
		//Action
		this.oCriticalSituation._onRouteMatched(oEvent);

		//Assertion
		assert.equal(this.oCriticalSituation._loadKeyWords.callCount, 1);
	});
	QUnit.test("Create a new request when click create button on Homepage with closed deault case", function (assert) {
		//Arrangment
		var oStub = this.oStubMsgBoxError;
		this.oStubMsgBoxError.yieldsTo("onClose", "");
		var oParam = {
			"caseid": "20001311",
			"custnum": "Empty",
			"custname": "Empty"
		};
		this.oComponent.getModel("homePageConfig").setProperty("/defaultCase", "20001311");
		this.oComponent.getModel("homePageConfig").setProperty("/defaultCustNo", "");
		this.oComponent.getModel("homePageConfig").setProperty("/defaultCustName", "");
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.stub(this.oCriticalSituation.__proto__, "_loadKeyWords");
		//Action
		this.oCriticalSituation._onRouteMatched(oEvent);
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	QUnit.test("Create a new request when click create button on Homepage and no sefault case in setting", function (assert) {
		//Arrangment
		var oParam = {
			"caseid": "Empty",
			"custnum": "Empty",
			"custname": "Empty"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.stub(this.oCriticalSituation.__proto__, "_loadKeyWords");
		//Action
		this.oCriticalSituation._onRouteMatched(oEvent);

		//Assertion
		assert.equal(this.oCriticalSituation._loadKeyWords.callCount, 1);
	});
	QUnit.test("Load key words when create a new request", function (assert) {
		//Arrangment    
		var oData = this.keyWordsModel.getData();
		this.Fsc2Read.withArgs("/FSC2KeywordSet").yieldsTo("success", oData);
		//Action
		this.oCriticalSituation._loadKeyWords();
		//Assertion
		assert.equal(this.oComponent.getModel("keyWords").getProperty("/results").length, 6);
	});

	QUnit.test("shoild give error message when Load key words and read FSC2Model got error", function (assert) {
		//Arrangment    
		var oStub = this.stub(this.oCriticalSituation, "showErrorMessage");
		this.Fsc2Read.withArgs("/FSC2KeywordSet").yieldsTo("error", {});
		//Action
		this.oCriticalSituation._loadKeyWords();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("Create a new request when click create request button on customer detail page", function (assert) {
		//Arrangment
		var oParam = {
			"custnum": "10010",
			"custname": "Robert Bosch GmbH"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.stub(this.oCriticalSituation.__proto__, "_loadKeyWords");
		//Action
		this.oCriticalSituation._onRouteMatchedCustomer(oEvent);
		//Assertion
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerNo"), "10010 - Robert Bosch GmbH");
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerName"), "Robert Bosch GmbH");
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerNoEdit"), false);
		assert.equal(this.oCriticalSituation._loadKeyWords.callCount, 1);
	});

	QUnit.test("should hide set default button when click create request button on customer detail page and no default case id", function (
		assert) {
		//Arrangment
		var oParam = {
			"custnum": "10010",
			"custname": "Robert Bosch GmbH"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.oComponent.getModel("homePageConfig").setProperty("/defaultCase", "Empty");
		this.stub(this.oCriticalSituation.__proto__, "_loadKeyWords");
		//Action
		this.oCriticalSituation._onRouteMatchedCustomer(oEvent);
		//Assertion
		assert.equal(this.oCriticalSituation._loadKeyWords.callCount, 1);
	});

	QUnit.test("Create a new request when this was escalated from an incident", function (assert) {
		//Arrangment
		var oParam = {
			"custnum": "10010",
			"custname": "Robert Bosch GmbH",
			"incident": "10100110"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.stub(this.oCriticalSituation.__proto__, "_loadKeyWords");
		this.stub(this.oCriticalSituation.__proto__, "_loadIncident");
		//Action
		this.oCriticalSituation._onRouteMatchedIncident(oEvent);
		//Assertion

		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerNo"), "10010 - Robert Bosch GmbH");
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerName"), "Robert Bosch GmbH");
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerNoEdit"), false);
		assert.equal(this.oCriticalSituation._loadKeyWords.callCount, 1);
		assert.equal(this.oCriticalSituation._loadIncident.callCount, 1);
	});

	QUnit.test("should hide set default button when press escalated button from an incident detail page and no default case id", function (
		assert) {
		//Arrangment
		var oParam = {
			"custnum": "10010",
			"custname": "Robert Bosch GmbH",
			"incident": "10100110"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.oComponent.getModel("homePageConfig").setProperty("/defaultCase", "Empty");
		this.stub(this.oCriticalSituation.__proto__, "_loadKeyWords");
		this.stub(this.oCriticalSituation.__proto__, "_loadIncident");
		//Action
		this.oCriticalSituation._onRouteMatchedIncident(oEvent);
		//Assertion
		assert.equal(this.oCriticalSituation._loadKeyWords.callCount, 1);
		assert.equal(this.oCriticalSituation._loadIncident.callCount, 1);
	});
	
	QUnit.test("Should load all related incidents and put them into selectIncident dialog when follow-up an incident from BCP system", function (assert) {
		//Arrangment
		var oParam = {
			"icdNum": "10010",
			"icdYear": "2017",
			"type": "icdNumYear"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.stub(this.oCriticalSituation.__proto__, "_loadKeyWords");
		var oData_Snow = this.oComponent.getModel("snowCaseList").getData();
		var oData_BCIncident =  this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData_BCIncident);     
		this.stub($,"ajax").yieldsTo("success", oData_Snow);  
		var oStub1 = this.stub(this.oCriticalSituation,"afterLoadIncidents");
		//Action
		this.oCriticalSituation._onRouteMatchedIncidentOptions(oEvent);
		//Assertion
		assert.equal(oStub1.callCount, 2);
	});
	
	QUnit.test("Should set loaded incident into create page if there is only one incident when call function afterLoadIncidents", function (assert) {
		//Arrangment
		var oData_BCIncident =  this.oIncidentListModel.getProperty("/results")[0];
		var oData=[];
		oData.push(oData_BCIncident);
		this.oComponent.getModel("SelectIncident").setData({
				"IncidentNo": "12186",
				"IncidentYear": "2017",
				"BCIncident": {
					"results": oData,
					"loadComplete": true
				},
				"ServiceNow": {
					"results": [],
					"loadComplete": true
				},
				"results": []
		});
		this.stub(this.oCriticalSituation.__proto__, "_loadKeyWords");
		var oStub1 = this.stub(this.oCriticalSituation,"onNavToCreateByIncident");
		//Action
		this.oCriticalSituation.afterLoadIncidents();
		//Assertion
		assert.equal(oStub1.callCount, 1);
	});
	QUnit.test("Should set selected incident into creation page when call function onNavToCreateByIncident", function (assert) {
		//Arrangment
		var oData_BCIncident =  this.oIncidentListModel.getProperty("/results")[0];
		var oEvent = {
			getSource:function(){
				return {
					getBindingContext:function(){
						return {
							getObject:function(){
								return oData_BCIncident;
							}
						};
					}         
				};
			}
		};
		this.stub(this.oCriticalSituation, "onGiveUpCreateCritical");
		this.stub(this.oCriticalSituation, "_onInitCreate");
		this.stub(this.oCriticalSituation, "_loadKeyWords");
		var oStub1 = this.stub(this.oCriticalSituation,"loadInicidentLongText");
		//Action
		this.oCriticalSituation.onNavToCreateByIncident(oEvent);
		//Assertion
		assert.equal(oStub1.callCount, 1);
	});
	
	QUnit.test("should display warning message when press set default button", function (assert) {
		var oStub = this.stub(this.oCriticalSituation, "onConfirmSetDefault");
		this.oStubMsgBoxWarn.yieldsTo("onClose", "YES");
		// System under test
		this.oCriticalSituation.onSetDefault();
		// Assert
		assert.equal(oStub.callCount, 1);
	});
	QUnit.test("should run routeMatched again when confirm after press set default button", function (assert) {
		this.stub(this.oCriticalSituation, "onInit");
		this.stub(this.oCriticalSituation, "_onRouteMatched");
		var oStubRemoveUpload = this.stub(this.oCriticalSituation, "_removeAllUpload");
		// System under test
		this.oCriticalSituation.onConfirmSetDefault();
		// Assert
		assert.equal(oStubRemoveUpload.callCount, 1);
	});

	QUnit.test("should display warning message when press clear all button", function (assert) {
		// this.stub(this.oCriticalSituation,"onInit");
		// this.stub(this.oCriticalSituation,"_onRouteMatched");
		// var oStubRemoveUpload = this.stub(this.oCriticalSituation,"_removeAllUpload");
		var oStub = this.stub(this.oCriticalSituation, "onConfirmClearAll");
		this.oStubMsgBoxWarn.yieldsTo("onClose", "YES");
		// System under test
		this.oCriticalSituation.onClearAll();
		// Assert
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should set all fields to empty when confirm after press clear all button", function (assert) {
		this.stub(this.oCriticalSituation, "onConfirmSetDefault");
		var AddIncBtn_visible = this.oComponent.getModel("FieldVisible").getProperty("/AddIncBtn");
		// System under test
		this.oCriticalSituation.onConfirmClearAll();
		// Assert
		assert.equal(AddIncBtn_visible, true);
		assert.equal(this.oCriticalSituation.ClearAll, false);
	});

	QUnit.test("Load incident by CssObjectID", function (assert) {
		//Arrangment   
		var sInicidentId = "002028376000000010932018";
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		var aData = oData.results;
		var oEntry = {
			"ID": aData[0].CssObjectID,
			"IncidentNum": aData[0].CssObjectID,
			"Title": aData[0].ObjectID + "/" + aData[0].MessageYear + " " + aData[0].StatusTxt,
			"ShortID": aData[0].ObjectID + "/" + aData[0].MessageYear,
			"Name": aData[0].CustomerName,
			"ComponentName": aData[0].ComponentName,
			"Description": aData[0].Description,
			"Priority": aData[0].PriorityTxt,
			"PriorityKey": aData[0].Priority,
			"Status": aData[0].StatusTxt,
			"Sys_ID": "",
			"Type": "FAVORITE_INCIDENTS"
		};
		sinon.stub(this.oCriticalSituation, "loadInicidentLongText");
		//Action
		this.oCriticalSituation._loadIncident(sInicidentId);
		//Assertion
		assert.deepEqual(this.oComponent.getModel("incidentList").getProperty("/results"), [oEntry]);
		assert.deepEqual(this.oComponent.getModel("createCriticalSituation").getProperty("/AllSelected"), ["002028376000000010932018"]);
	});

	QUnit.test("should give error message when got error to Load incident", function (assert) {
		//Arrangment   
		var sInicidentId = "002028376000000010932018";
		var oStub = this.stub(this.oCriticalSituation, "showErrorMessage");
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("error", {});
		sinon.stub(this.oCriticalSituation, "loadInicidentLongText");
		this.oCriticalSituation._loadIncident(sInicidentId);
		//Assertion
		assert.deepEqual(oStub.callCount, 1);
	});

	QUnit.test("Load SNow Cases by ponit or number", function (assert) {
		//Arrangment   
		var sInicidentId = "002028376000000010932018";
		var oData = this.oComponent.getModel("snowCaseList").getData();
		this.stub($, "ajax").yieldsTo("success", oData);
		// var aData = oData.results;
		var oStub = this.stub(this.oCriticalSituation, "loadInicidentLongText");
		//Action
		this.oCriticalSituation._loadSNowCase(sInicidentId);
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("should check if Case ID is belong to the Customer No when change customer No", function (assert) {
		this.oCriticalSituation.sCustomerNo = "10010";
		this.oComponent.getModel("createCriticalSituation").setProperty("/CaseID", "20001311");
		var oData = {};
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		// System under test
		this.oCriticalSituation.checkConsistCustomer_Case();
		// Assert
		assert.equal(this.oStubMsgBoxWarn.callCount, 1);
	});

	QUnit.test("should give error message when the oData service FSC2Model have something error", function (assert) {
		this.oCriticalSituation.sCustomerNo = "10010";
		this.oComponent.getModel("createCriticalSituation").setProperty("/CaseID", "20001311");
		var oStub = this.stub(this.oCriticalSituation, "showErrorMessage");
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("error", {});
		// System under test
		this.oCriticalSituation.checkConsistCustomer_Case();
		// Assert
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("Trigger '_handleMessageBoxOpen' when 'nav' button was pressed", function (assert) {
		this.stub(this.oCriticalSituation.__proto__, "_handleMessageBoxOpen");
		// System under test
		this.oCriticalSituation.onNavBackCreate();
		// Assert
		assert.equal(this.oCriticalSituation._handleMessageBoxOpen.callCount, 1);
	});

	QUnit.test("Trigger '_handleMessageBoxOpen' when 'home' button was pressed", function (assert) {
		this.stub(this.oCriticalSituation.__proto__, "_handleMessageBoxOpen");
		// System under test
		this.oCriticalSituation.onNavHomeCreate();
		// Assert
		assert.equal(this.oCriticalSituation._handleMessageBoxOpen.callCount, 1);
	});

	QUnit.test("should display messageBox and nav back when run function _handleMessageBoxOpen", function (assert) {
		// System under test
		var stubNavBack = this.stub(this.oCriticalSituation, "onNavBack");
		var stubNavHome = this.stub(this.oCriticalSituation, "onNavHome");
		this.stub(this.oCriticalSituation, "onGiveUpCreateCritical");
		this.stub(this.oCriticalSituation, "_onInitCreate");
		var oAction = MessageBox.Action.YES;
		this.oStubMsgBoxWarn.yieldsTo("onClose", oAction);
		this.oCriticalSituation._handleMessageBoxOpen("Message warning", "warning", "back");
		this.oCriticalSituation._handleMessageBoxOpen("Message warning", "warning", "home");
		// Assert
		assert.equal(stubNavBack.callCount, 1);
		assert.equal(stubNavHome.callCount, 1);
	});
	QUnit.test("should remove all selected Request Reason when run function _removeAllSelectedKeyWords", function (assert) {
		// System under test
		var oCheckBoxs = {
			getContent: function () {
				return [
					new sap.m.CheckBox({
						"selected": true
					}),
					new sap.m.CheckBox()
				];
			}
		};
		this.byId.withArgs("idVerticalLayout").returns(oCheckBoxs);
		this.oCriticalSituation._removeAllSelectedKeyWords();
		// Assert
		assert.deepEqual(this.oCriticalSituation.selectedKeyWords, []);
	});
	QUnit.test("should iniate _oDialog when run function onInputHelp", function (assert) {
		// System under test
		this.oCriticalSituation.onInputHelp();
		// Assert
		assert.equal(!(this.oCriticalSituation._oDialog), false);
	});
	QUnit.test("Search 'Customer' by customer name 'Bayer' and then open customer list dialog", function (assert) {
		//Arrangment   
		var oData = {
			"results": [{
				"Customer_No": "0000010337",
				"Customer_Name": "Bayer S.p.A."
			}, {
				"Customer_No": "0000010582",
				"Customer_Name": "Kassenärztliche Vereinigung Bayerns"
			}]
		};
		this.Fsc2Read.withArgs("/CustomerInfoSet").yieldsTo("success", oData);
		this.stub(this.oCriticalSituation, "_openSelectDialog");
		//Action
		this.oCriticalSituation.onInputHelp();
		this.oCriticalSituation.onSearch();
		//Assertion
		assert.deepEqual(this.oComponent.getModel("customerList").getData(), oData);
		assert.equal(this.oCriticalSituation._openSelectDialog.callCount, 1);
	});

	QUnit.test("shoulf give error message when Search 'Customer' by customer name 'Bayer' and oData service error", function (assert) {
		//Arrangment   
		var oStub = this.stub(this.oCriticalSituation, "showErrorMessage");
		this.Fsc2Read.withArgs("/CustomerInfoSet").yieldsTo("error", {});
		this.stub(this.oCriticalSituation, "_openSelectDialog");
		//Action
		this.oCriticalSituation.onInputHelp();
		this.oCriticalSituation.onSearch();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("Set value for customer No when select one customer from value help dialog and confirmed", function (assert) {
		//Arrangment   
		this.oCriticalSituation._openSelectDialog();
		this.oCriticalSituation.onInputHelp();
		var oData = {
			"results": [{
				"Customer_No": "0000012186",
				"Customer_Name": "Bayer Aktiengesellschaft"
			}]
		};
		this.oComponent.getModel("customerList").setData(oData);
		var oListItem = new sap.m.ColumnListItem({
			"cells": [
				new sap.m.Text({
					"text": "12186"
				}),
				new sap.m.Text({
					"text": "Bayer Aktiengesellschaft"
				})
			],
			"customData": [new sap.ui.core.CustomData({
				"key": "customerNo",
				"value": "0000012186"
			})]
		});
		var oTable = new sap.m.Table({});
		this.stub(oTable, "getSelectedItem").returns(oListItem);
		this.stub(sap.ui.core.Fragment, "byId").returns(oTable);
		var oStub = this.stub(this.oCriticalSituation, "_onInitCreate");
		//Action
		this.oCriticalSituation.onConfirm();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should give warning message to select one customer when press confirm button on customer value help dialog", function (
		assert) {
		//Arrangment   
		this.oCriticalSituation._openSelectDialog();
		this.oCriticalSituation.onInputHelp();
		var oData = {
			"results": [{
				"Customer_No": "0000012186",
				"Customer_Name": "Bayer Aktiengesellschaft"
			}]
		};
		this.oComponent.getModel("customerList").setData(oData);
		var oTable = new sap.m.Table({});
		this.stub(oTable, "getSelectedItem").returns();
		this.stub(sap.ui.core.Fragment, "byId").returns(oTable);
		//Action
		this.oCriticalSituation.onConfirm();
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});

	QUnit.test("should close customer search dialog when run function onCloseDialog", function (assert) {
		// System under test
		var that = this;
		this.oCriticalSituation.onInputHelp();
		var oButton = {
			getParent: function () {
				return that.oCriticalSituation._oDialog;
			}
		};
		var oEvent = {
			getSource: function () {
				return oButton;
			}
		};
		this.oCriticalSituation.onCloseDialog(oEvent);
		// Assert
		assert.equal(!(this.oCriticalSituation._oDialog), false);
	});

	QUnit.test("Search 'Customer' by customer No. '12186' and then open customer list dialog", function (assert) {
		//Arrangment   
		var oData = {
			"results": [{
				"Customer_No": "0000012186",
				"Customer_Name": "Bayer Aktiengesellschaft"
			}]
		};
		this.Fsc2Read.withArgs("/CustomerInfoSet").yieldsTo("success", oData);
		this.stub(this.oCriticalSituation, "_openSelectDialog");
		//Action
		this.oCriticalSituation.onInputHelp();
		this.oCriticalSituation.onSearch();

		//Assertion
		assert.deepEqual(this.oComponent.getModel("customerList").getData(), oData);
		assert.equal(this.oCriticalSituation._openSelectDialog.callCount, 1);
	});

	QUnit.test("should iniate _oDialog when run function onInputHelp", function (assert) {
		// System under test
		this.oCriticalSituation._openSelectDialog();
		// Assert
		assert.equal(!(this.oCriticalSituation._oSelectDialog), false);
	});

	QUnit.test("Set customer name when a valid customer number was input", function (assert) {
		//Arrangment 
		var oData = {
			"results": [{
				"Customer_No": "0000012186",
				"Customer_Name": "Bayer Aktiengesellschaft"
			}]
		};
		var sCustomerNo = "0000012186";
		var oCustomer = {
			setValue: function () {},
			setBusy: function () {}
		};
		this.byId.withArgs("idCustNo").returns(oCustomer);
		this.oComponent.getModel("createCriticalSituation").setProperty("/CustomerNo", sCustomerNo);
		this.Fsc2Read.withArgs("/CustomerInfoSet").yieldsTo("success", oData);
		sinon.stub(this.oCriticalSituation, "byId").returns(this.oControl);
		//Action
		this.oCriticalSituation._openSelectDialog();
		this.oCriticalSituation.onSearchCustomerName();
		//Assertion
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerName"), "Bayer Aktiengesellschaft");
	});

	QUnit.test("should set the value state of fields Customer Name as none when customer name isn't null", function (assert) {
		//Arrangment 
		this.oComponent.getModel("createCriticalSituation").setProperty("/CustomerName", "XXXXXX");
		var oControl = this.oCriticalSituation.getView().byId("idCustName");
		var oStub = this.stub(oControl, "setValueState");
		this.oCriticalSituation.onCustInputChange();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should give error message when the entered Customer No not existed", function (assert) {
		//Arrangment 
		var oData = {
			"results": []
		};
		var sCustomerNo = "186";
		var oCustomer = {
			setValue: function () {},
			setBusy: function () {}
		};
		this.byId.withArgs("idCustNo").returns(oCustomer);
		this.oComponent.getModel("createCriticalSituation").setProperty("/CustomerNo", sCustomerNo);
		this.oStubMsgBoxError.yieldsTo("onClose", "");
		this.Fsc2Read.withArgs("/CustomerInfoSet").yieldsTo("success", oData);
		sinon.stub(this.oCriticalSituation, "byId").returns(this.oControl);
		//Action
		this.oCriticalSituation._openSelectDialog();
		this.oCriticalSituation.onSearchCustomerName();
		//Assertion
		assert.equal(this.oStubMsgBoxWarn.callCount, 1);
	});
	QUnit.test("should give error message when get oData service error on customer no search", function (assert) {
		//Arrangment 
		var sCustomerNo = "186";
		var oCustomer = {
			setValue: function () {},
			setBusy: function () {}
		};
		var oStub = this.stub(this.oCriticalSituation, "showErrorMessage");
		this.byId.withArgs("idCustNo").returns(oCustomer);
		this.oComponent.getModel("createCriticalSituation").setProperty("/CustomerNo", sCustomerNo);
		this.oStubMsgBoxError.yieldsTo("onClose", "");
		this.Fsc2Read.withArgs("/CustomerInfoSet").yieldsTo("error", {});
		sinon.stub(this.oCriticalSituation, "byId").returns(this.oControl);
		//Action
		this.oCriticalSituation._openSelectDialog();
		this.oCriticalSituation.onSearchCustomerName();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should not load any data from back end system when search Customer No with empty content", function (assert) {
		var sCustomerNo = "";
		var oCustomer = {
			setValue: function () {},
			setBusy: function () {}
		};
		this.byId.withArgs("idCustNo").returns(oCustomer);
		this.oComponent.getModel("createCriticalSituation").setProperty("/CustomerNo", sCustomerNo);
		this.oCriticalSituation.onSearchCustomerName();
		//Assertion
		assert.equal(this.Fsc2Read.callCount, 0);
	});

	QUnit.test("Nav to incident list page when 'Add' button was pressed", function (assert) {
		//Arrangment   
		var router = new sap.ui.core.routing.Router();
		var oStubNav = this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oCriticalSituation, "getRouter").returns(router);
		this.oComponent.getModel("createCriticalSituation").setProperty("/CustomerNo", "0000012186 - Bayer AG");

		//Action
		this.oCriticalSituation.onAddIncidentImpact();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
		assert.strictEqual(oStubNav.callCount, 1);
	});

	// QUnit.test("Load business impact for selected incident when this.offline is true", function (assert) {
	// 	//Arrangment 
	// 	var oData = {
	// 		"bFlag": false,
	// 		"currentSelected": {
	// 			"ComponentName": "BC-ABA-LA",
	// 			"Description": "UPGRADE DMO Preparation: SAP notes 19201",
	// 			"ID": "002075129400000733972017",
	// 			"Name": "Bayer AG",
	// 			"Priority": "High",
	// 			"PriorityKey": "3",
	// 			"ShortID": "73397/2017",
	// 			"Status": "Customer Action",
	// 			"Title": "73397/2017 Customer Action",
	// 			"Type": "FAVORITE_INCIDENTS"
	// 		},
	// 		"allSelected": {
	// 			"results": [{
	// 				"id": "UPGRADE DMO Preparation: SAP notes 19201",
	// 				"title": "002075129400000733972017",
	// 				"desc": "73397/2017 Customer Action"
	// 			}]
	// 		}
	// 	};
	// 	var oEntry = {
	// 		"Author": "I034868-Long Zheng",
	// 		"Description": "UPGRADE DMO Preparation: SAP notes 19201",
	// 		"ID": "73397/2017",
	// 		"Text": "Test business Impact",
	// 		"Time": "31.07.2018 10:14:17"
	// 	};
	// 	this.oCriticalSituation.Offline = true;
	// 	this.stub(this.oCriticalSituation, "_updateBusinessImpact");
	// 	//Action
	// 	this.oCriticalSituation.loadInicidentLongText("Create", "loadInicidentLongText", oData);
	// 	//Assertion
	// 	assert.propEqual(this.oComponent.getModel("createCriticalSituation").getProperty("/BusinessImpact/002075129400000733972017"), oEntry);
	// });

	QUnit.test("Load business impact for selected incident when this.offline is false", function (assert) {
		//Arrangment 
		var oData = {
			"bFlag": false,
			"currentSelected": {
				"ComponentName": "BC-ABA-LA",
				"Description": "UPGRADE DMO Preparation: SAP notes 19201",
				"ID": "002075129400000733972017",
				"Name": "Bayer AG",
				"Priority": "High",
				"PriorityKey": "3",
				"ShortID": "73397/2017",
				"Status": "Customer Action",
				"Title": "73397/2017 Customer Action",
				"Type": "FAVORITE_INCIDENTS",
				"IncidentNum": "002075129400000733972017"
			},
			"allSelected": {
				"results": [{
					"id": "002075129400000733972017",
					"title": "73397/2017 Customer Action",
					"desc": "UPGRADE DMO Preparation: SAP notes 19201"
				}]
			}
		};
		var oEntry = {
			"Author": "I034868-Long Zheng",
			"Description": "UPGRADE DMO Preparation: SAP notes 19201",
			"ID": "73397/2017",
			"Text": "Test business Impact",
			"Time": "31.07.2018 10:14:17"
		};
		var oResponceData = this.oIncidentLongTextModel.getData();
		this.IncidentRead.withArgs("/LongText").yieldsTo("success", oResponceData);
		this.oCriticalSituation.Offline = false;
		this.stub(this.oCriticalSituation, "_updateBusinessImpact");
		//Action
		this.oCriticalSituation.loadInicidentLongText("Create", "loadInicidentLongText", oData);
		//Assertion
		assert.propEqual(this.oComponent.getModel("createCriticalSituation").getProperty("/BusinessImpact/002075129400000733972017"), oEntry);
	});

	QUnit.test("should give error message when get oData service error on loading business impact for selected incident", function (assert) {
		//Arrangment 
		var oStub = this.stub(this.oCriticalSituation, "showErrorMessage");
		var oData = {
			"currentSelected": {
				"ID": "002075129400000733972017"
			}
		};
		this.IncidentRead.withArgs("/LongText").yieldsTo("error", {});
		this.stub(this.oCriticalSituation, "_updateBusinessImpact");
		//Action
		this.oCriticalSituation.loadInicidentLongText("Create", "loadInicidentLongText", oData);
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("Update business impact when an incident was selected", function (assert) {
		//Arrangment 
		var oData = {
			"bFlag": true,
			"currentSelected": {
				"ComponentName": "BC-ABA-LA",
				"Description": "UPGRADE DMO Preparation: SAP notes 19201",
				"ID": "002075129400000733972017",
				"IncidentNum": "002075129400000733972017",
				"Name": "Bayer AG",
				"Priority": "High",
				"PriorityKey": "3",
				"ShortID": "73397/2017",
				"Status": "Customer Action",
				"Title": "73397/2017 Customer Action",
				"Type": "FAVORITE_INCIDENTS"
			},
			"allSelected": {
				"results": []
			}
		};
		this.oCriticalModel.setData({
			"CustomerNo": "",
			"CustomerNoEdit": true,
			"CustomerName": "",
			"BusinessImpact": {
				"002075129400000733972017": {
					"ComponentName": "BC-ABA-LA",
					"Description": "UPGRADE DMO Preparation: SAP notes 19201",
					"ID": "002075129400000733972017",
					"Name": "Bayer AG",
					"Priority": "High",
					"PriorityKey": "3",
					"ShortID": "73397/2017",
					"Status": "Customer Action",
					"Title": "73397/2017 Customer Action",
					"Type": "FAVORITE_INCIDENTS"
				},
				"Text": ""
			},
			"AllSelected": []
		});
		this.oComponent.getModel("selectedIncidentList").setData({
			"results": [{
				"id": "002075129500001194302020",
				"title": "Paul Donaldson Test CDS - PLEASE IGNORE",
				"desc": "119430/2020 In progress",
				"priority": "2",
				"IncidentNum": "002075129500001194302020",
				"Sys_ID": "c487e4da1bcb88d0461c777c8b4bcb3a",
				"SNow_number": "CS20200000230672"
			}]
		});
		//Action
		this.oCriticalSituation._updateBusinessImpact("Create", "loadInicidentLongText", oData);
		//Assertion
		assert.propEqual(this.oComponent.getModel("createCriticalSituation").getProperty("/BusinessImpact/Text"), {});
	});

	QUnit.test("Update business impact when more than one incidents were selected", function (assert) {
		//Arrangment 
		var oData = {
			"bFlag": true,
			"currentSelected": {
				"ComponentName": "BC-ABA-LA",
				"Description": "UPGRADE DMO Preparation: SAP notes 19201",
				"ID": "002075129400000733972017",
				"IncidentNum": "002075129400000733972017",
				"Name": "Bayer AG",
				"Priority": "High",
				"PriorityKey": "3",
				"ShortID": "73397/2017",
				"Status": "Customer Action",
				"Title": "73397/2017 Customer Action",
				"Type": "FAVORITE_INCIDENTS"
			},
			"allSelected": {
				"results": [{
					"ComponentName": "BC-ABA-LA",
					"Description": "UPGRADE DMO Preparation: SAP notes 19201",
					"ID": "002075129400000733972017",
					"IncidentNum": "002075129400000733972017",
					"Name": "Bayer AG",
					"Priority": "High",
					"PriorityKey": "3",
					"ShortID": "73397/2017",
					"Status": "Customer Action",
					"Title": "73397/2017 Customer Action",
					"Type": "FAVORITE_INCIDENTS"
				}, {
					"ComponentName": "BC-ABA-LA",
					"Description": "UPGRADE DMO Preparation: SAP notes 19201",
					"ID": "002075129400000733982017",
					"IncidentNum": "002075129400000733982017",
					"Name": "Bayer AG",
					"Priority": "High",
					"PriorityKey": "3",
					"ShortID": "73397/2017",
					"Status": "Customer Action",
					"Title": "73397/2017 Customer Action",
					"Type": "FAVORITE_INCIDENTS"
				}]
			}
		};
		this.oCriticalModel.setData({
			"CustomerNo": "",
			"CustomerNoEdit": true,
			"CustomerName": "",
			"BusinessImpact": {
				"002075129400000733972017": {
					"ComponentName": "BC-ABA-LA",
					"Description": "UPGRADE DMO Preparation: SAP notes 19201",
					"ID": "002075129400000733972017",
					"Name": "Bayer AG",
					"Priority": "High",
					"PriorityKey": "3",
					"ShortID": "73397/2017",
					"Status": "Customer Action",
					"Title": "73397/2017 Customer Action",
					"Type": "FAVORITE_INCIDENTS"
				},
				"Text": ""
			},
			"AllSelected": []
		});
		//Action
		this.oCriticalSituation._updateBusinessImpact("Create", "loadInicidentLongText", oData);
		//Assertion
		assert.propEqual(this.oComponent.getModel("createCriticalSituation").getProperty("/BusinessImpact/Text"), {});
	});
	QUnit.test("Update business impact when an incident was unselected", function (assert) {
		//Arrangment 
		var oData = {
			"bFlag": false,
			"currentSelected": {
				"ComponentName": "BC-ABA-LA",
				"Description": "UPGRADE DMO Preparation: SAP notes 19201",
				"ID": "002075129400000733972017",
				"IncidentNum": "002075129400000733972017",
				"Name": "Bayer AG",
				"Priority": "High",
				"PriorityKey": "3",
				"ShortID": "73397/2017",
				"Status": "Customer Action",
				"Title": "73397/2017 Customer Action",
				"Type": "FAVORITE_INCIDENTS"
			},
			"allSelected": {
				"results": [{
					"id": "002075129400000733972017",
					"title": "73397/2017 Customer Action",
					"desc": "UPGRADE DMO Preparation: SAP notes 19201",
					"IncidentNum": "002075129400000733972017"
				}]
			}
		};
		this.oCriticalModel.setData({
			"CustomerNo": "",
			"CustomerNoEdit": true,
			"CustomerName": "",
			"BusinessImpact": {
				"002075129400000733972017": {
					"ComponentName": "BC-ABA-LA",
					"Description": "UPGRADE DMO Preparation: SAP notes 19201",
					"ID": "002075129400000733972017",
					"Name": "Bayer AG",
					"Priority": "High",
					"PriorityKey": "3",
					"ShortID": "73397/2017",
					"Status": "Customer Action",
					"Title": "73397/2017 Customer Action",
					"Type": "FAVORITE_INCIDENTS"
				},
				"Text": ""
			},
			"AllSelected": ["002075129400000733972017"]
		});
		this.oComponent.getModel("selectedIncidentList").setData({
			"results": [{
				"id": "002075129400000733972017",
				"title": "73397/2017 Customer Action",
				"desc": "UPGRADE DMO Preparation: SAP notes 19201",
				"IncidentNum": "002075129400000733972017",
				"priority": "2",
				"Sys_ID": "c487e4da1bcb88d0461c777c8b4bcb3a",
				"SNow_number": "CS20200000230672"
			}]
		});
		var sText =
			"Inserted business impact from selected incidents:\n----------\n002075129400000733972017\nFrom: undefined\nUPGRADE DMO Preparation: SAP notes 19201\nundefined\nundefined\n";
		//Action
		this.oCriticalSituation._updateBusinessImpact("Create", "loadInicidentLongText", oData);
		//Assertion
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/BusinessImpact/Text"), sText);
	});

	QUnit.test("should update selectedKeyWords if Request Reason when select or deselect checkBox", function (assert) {
		//Arrangment 
		var oControl = this.byId("idVerticalLayout");
		this.stub(oControl, "getContent").returns([
			new sap.m.CheckBox({
				"text": "text1",
				"tooltip": "key1",
				"selected": true
			}),
			new sap.m.CheckBox({
				"text": "text2",
				"tooltip": "key2",
				"selected": true
			})
		]);

		//Action
		this.oCriticalSituation.checkBoxSelect();
		//Assertion
		assert.deepEqual(this.oCriticalSituation.selectedKeyWordsID, ["key1", "key2"]);
	});

	QUnit.test("should register event once when change request title", function (assert) {
		//Action
		this.oCriticalSituation.onTitleInputChange();
		//Assertion
		assert.equal(this.stubEventReg.callCount, 1);
	});

	QUnit.test("should setValueState of description to None  when it's not empty", function (assert) {
		//Action
		this.oComponent.getModel("createCriticalSituation").setProperty("/Description", "test desc");
		var sControl = this.oCriticalSituation.getView().byId("idDesc");
		var oStub = this.stub(sControl, "setValueState");
		this.oCriticalSituation.onDescInputChange();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	// QUnit.test("should add Header Parameter for uploadCollection when select one file from upload dialog", function (assert) {
	// 	//Action
	// 	var sControl = this.oCriticalSituation.getView().byId("idUploadCollection");
	// 	var oEvent = {
	// 		getSource: function () {
	// 			return sControl;
	// 		}
	// 	};
	// 	var oUploadCollection = oEvent.getSource();
	// 	var oStub = this.stub(oUploadCollection, "addHeaderParameter");
	// 	this.oCriticalSituation.onChange(oEvent);
	// 	//Assertion
	// 	assert.equal(oStub.callCount, 1);
	// });
	QUnit.test("should give successful message when delete the uploaded file", function (assert) {
		//Action
		this.oCriticalSituation.onFileDeleted();
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});

	QUnit.test("should give warning message when the uploaded file name is too long", function (assert) {
		//Action
		var oEvent = {
			getParameter: function () {}
		};
		this.oCriticalSituation.onFilenameLengthExceed(oEvent);
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});

	QUnit.test("should give warning message when the size of uploaded file is too big", function (assert) {
		//Action
		var oEvent = {
			getParameter: function () {}
		};
		this.oCriticalSituation.onFileSizeExceed(oEvent);
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});

	QUnit.test("should give warning message when the type of uploaded file is not correct", function (assert) {
		//Action
		var oEvent = {
			getParameter: function () {}
		};
		this.oCriticalSituation.onTypeMissmatch(oEvent);
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});

	QUnit.test("should add Header Parameter for uploadCollection when the actual upload starts", function (assert) {
		//Action
		var sControl = this.oCriticalSituation.getView().byId("idUploadSet");
		var oEvent = {
			getParameters: function () {
				return {
					"item": {
						getFileName: function () {
							return "FileName";
						}
					}
				};
			},
			getSource: function () {
				return sControl;
			},
			getParameter: function () {}
		};
		var oUploadSet = oEvent.getSource();
		var oStub = this.stub(oUploadSet, "addHeaderField");
		this.oCriticalSituation.onBeforeUploadStarts(oEvent);
		//Assertion
		assert.equal(oStub.callCount, 2);
	});

	QUnit.test("should give message for create successfullly when the file upload completed and return type ZS46", function (assert) {
		//Action
		this.oCriticalSituation.Create = {
			"ResultText": "create successfully.",
			"Type": "ZS46",
			"ID": "12345678"
		};
		this.oCriticalSituation.selectedKeyWordsID = [];
		this.stub(this.oCriticalSituation, "onNavToDetail");
		this.stub(this.oCriticalSituation, "onGiveUpCreateCritical");
		var oStubInitCreate = this.stub(this.oCriticalSituation, "_onInitCreate");
		this.oStubMsgBoxSuccess.yieldsTo("onClose", "YES");
		this.oCriticalSituation.sFilesNum = 1;
		this.oCriticalSituation.sUploadComp = 0;
		this.oCriticalSituation.onUploadComplete();
		//Assertion
		assert.equal(oStubInitCreate.callCount, 1);
	});
	QUnit.test("should give message for create successfullly when the file upload completed and return type ZS90", function (assert) {
		//Action
		this.oCriticalSituation.Create = {
			"ResultText": "create successfully.",
			"Type": "ZS90",
			"ID": "12345678"
		};
		this.oCriticalSituation.selectedKeyWordsID = [];
		this.stub(this.oCriticalSituation, "onNavToDetail");
		this.stub(this.oCriticalSituation, "onGiveUpCreateCritical");
		var oStubInitCreate = this.stub(this.oCriticalSituation, "_onInitCreate");
		this.oStubMsgBoxSuccess.yieldsTo("onClose", "YES");
		this.oCriticalSituation.sFilesNum = 1;
		this.oCriticalSituation.sUploadComp = 0;
		this.oCriticalSituation.onUploadComplete();
		//Assertion
		assert.equal(oStubInitCreate.callCount, 1);
	});

	QUnit.test("Check if the customer is in your favorite list when creating request successfully ", function (assert) {
		//Arrangment 
		var oStub = this.stub(this.oCriticalSituation, "setFavorite");
		var oData = {
			"results": [{
				"CustomerNo": "0000010004",
				"CustomerName": "Arburg GmbH + Co Test WD 4",
				"FavoriteType": "FAVORITE_CUSTOMERS"
			}, {
				"CustomerNo": "0000012187",
				"CustomerName": "Bayer Aktiengesellschaft",
				"FavoriteType": "FAVORITE_CUSTOMERS"
			}]
		};
		this.Fsc2Read.withArgs("/FavoriteObjectSet").yieldsTo("success", oData);
		this.oStubMsgBoxWarn.yieldsTo("onClose", MessageBox.Action.YES);
		//Action
		this.oCriticalSituation.checkFavorite("0000012186");
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test(
		"should load request detail data when check the customer and found it's not in your favorite list and do not set it as favorite",
		function (assert) {
			//Arrangment 
			var oStub = this.stubEventBus;
			var oData = {
				"results": [{
					"CustomerNo": "0000010004",
					"CustomerName": "Arburg GmbH + Co Test WD 4",
					"FavoriteType": "FAVORITE_CUSTOMERS"
				}, {
					"CustomerNo": "0000012187",
					"CustomerName": "Bayer Aktiengesellschaft",
					"FavoriteType": "FAVORITE_CUSTOMERS"
				}]
			};
			this.Fsc2Read.withArgs("/FavoriteObjectSet").yieldsTo("success", oData);
			this.oStubMsgBoxWarn.yieldsTo("onClose", MessageBox.Action.NO);
			//Action
			this.oCriticalSituation.checkFavorite("0000012186");
			//Assertion
			assert.equal(oStub.callCount, 1);
		});

	QUnit.test("should give error message when get oData service error on checking if the customer is in your favorite list ", function (
		assert) {
		//Arrangment 
		this.Fsc2Read.withArgs("/FavoriteObjectSet").yieldsTo("error", {});
		//Action
		this.oCriticalSituation.checkFavorite("0000012186");
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});

	QUnit.test("should create one item to UserProfileModel entries when press confirm on favorite check dialog", function (assert) {
		this.UserProfileCreate.withArgs("/Entries").yieldsTo("success", {});
		//Action
		this.oCriticalSituation.setFavorite("10010");
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});

	QUnit.test("Nav to MCC Detail page when creating request successfully and getting transtype is 'ZS46'", function (assert) {
		//Arrangment 
		this.oCriticalSituation.Create = {
			"Type": "ZS46"
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oCriticalSituation, "getRouter").returns(router);
		//Action
		this.oCriticalSituation.onNavToDetail();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Nav to CIM request detail page when creating request successfully and getting transtype is 'ZS90'", function (assert) {
		//Arrangment 
		this.oCriticalSituation.Create = {
			"Type": "ZS90"
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oCriticalSituation, "getRouter").returns(router);
		//Action
		this.oCriticalSituation.onNavToDetail();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});

	QUnit.test("Nav to home page when creating request successfully", function (assert) {
		//Arrangment 
		this.oCriticalSituation.Create = {
			"Type": ""
		};
		var oStub = this.stub(this.oCriticalSituation, "onNavHome");
		//Action
		this.oCriticalSituation.onNavToDetail();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should run function _handleMessageBoxOpen once and give warningf message when run handleCancel", function (assert) {
		//Arrangment 
		var oStub = this.stub(this.oCriticalSituation, "_handleMessageBoxOpen");
		//Action
		this.oCriticalSituation.handleCancel();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should give warning message when press submit button and the CaseID and customer No are not consistent", function (assert) {
		//Arrangment 
		this.oComponent.getModel("createCriticalSituation").setData({
			"AllSelected": [],
			"BusinessImpact": {
				"Text": "test"
			},
			"CustomerName": "Bayer AG",
			"CustomerNo": "12186",
			"CustomerNoEdit": true,
			"Description": "test",
			"IncidentTitle": "Current open P1 and P2 incidents (6)",
			"RequestReason": "",
			"Title": "Request support for critical situation",
			"CaseID": "20000972"
		});
		this.oCriticalSituation.sCustomerNo = "10010";
		this.oCriticalSituation.selectedKeyWordsID = ["RIP", "RSC"];
		this.oCriticalSituation.sSelectList = "";
		this.oCriticalSituation.selectedKeyWords = ["Raise incident priority", "Request support for critical situation"];
		var oStub = this.stub(this.oCriticalSituation, "onSend");
		var oData2 = {
			"results": []
		};
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData2);
		//Action
		this.oCriticalSituation.handleSubmit();
		//Assertion
		assert.equal(oStub.callCount, 0);
	});

	QUnit.test("should Check mandatory field and sgive corresponding message when press submit button", function (assert) {
		//Arrangment 
		this.oComponent.getModel("createCriticalSituation").setData({
			"AllSelected": [],
			"BusinessImpact": {
				"Text": ""
			},
			"CustomerName": "",
			"CustomerNo": "",
			"CustomerNoEdit": true,
			"Description": "",
			"IncidentTitle": "Current open P1 and P2 incidents (6)",
			"RequestReason": "",
			"Title": "Request support for critical situation",
			"CaseID": "",
		});
		this.oCriticalSituation.sCustomerNo = "10010";
		this.oCriticalSituation.selectedKeyWordsID = ["RIP", "RSC"];
		this.oCriticalSituation.sSelectList = "";
		this.oCriticalSituation.selectedKeyWords = ["Raise incident priority", "Request support for critical situation"];
		var oStub = this.stub(this.oCriticalSituation, "onSend");
		//Action
		this.oCriticalSituation.handleSubmit();
		//Assertion
		assert.equal(this.oStubMsgBoxError.callCount, 1);
		assert.equal(oStub.callCount, 0);
	});

	QUnit.test("should create one item to FSC2RequestSet when press submit button and all field check passed", function (assert) {
		//Arrangment 
		this.oComponent.getModel("createCriticalSituation").setData({
			"AllSelected": [],
			"BusinessImpact": {
				"Text": "test"
			},
			"CustomerName": "Test Customer Name",
			"CustomerNo": "10010",
			"CustomerNoEdit": true,
			"Description": "test",
			"IncidentTitle": "Current open P1 and P2 incidents (6)",
			"RequestReason": "",
			"Title": "Request support for critical situation",
			"CaseID": "",
			"IsBusiDown": true
		});
		this.oCriticalSituation.sCustomerNo = "10010";
		this.oCriticalSituation.selectedKeyWordsID = ["RIP", "RSC"];
		this.oCriticalSituation.sSelectList = "";
		this.oCriticalSituation.selectedKeyWords = ["Raise incident priority", "Request support for critical situation"];
		var oResponceData = {
			"ID": "12345678",
			"TransType": "ZS90",
			"ResultText": "save successfully",
			"CustomerNo": "10010",
			"CustomerName": "test customer name",
			"snow_sysid": "xxxxxxxxxx"
		};
		//Action
		var oStub = this.stub(this.oCriticalSituation, "onUploadComplete");
		this.Fsc2Create.withArgs("/FSC2RequestSet").yieldsTo("success", oResponceData);
		this.oCriticalSituation.onSend();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should give warning message when change the do not know customer No", function (assert) {
		//Action
		this.oCriticalSituation.sDefaultCase = "20000792";
		this.stub(this.oCriticalSituation, "_removeAllUpload");
		this.stub(this.oCriticalSituation, "onGiveUpCreateCritical");
		this.stub(this.oCriticalSituation, "_removeAllSelectedKeyWords");
		var oStub = this.stub(this.oCriticalSituation, "onSearchCustomerName");
		var sControl = this.oCriticalSituation.getView().byId("idSwitch");
		this.stub(sControl, "getState").returns(true);
		this.oStubMsgBoxWarn.yieldsTo("onClose", MessageBox.Action.YES);
		// this.oStubDialogClose = sinon.stub(sap.m.Dialog.prototype, "close");
		this.oCriticalSituation.onSwitchChange();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should open a new window on website when run function onNavtoJamGroup", function (assert) {
		//Action
		var oStub = this.stub(window, "open");
		this.oCriticalSituation.onNavtoJamGroup();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should initate _oCaseDialog when function onCaseHelp", function (assert) {
		//Action
		// var oStubDialogOpen = this.stub(sap.m.Dialog.prototype, "open");
		// this.oStubDialogClose = sinon.stub(sap.m.Dialog.prototype, "close");
		this.oCriticalSituation.onCaseHelp();
		//Assertion
		assert.equal(this.oStubDialogOpen.callCount, 1);
	});
	QUnit.test("should reset data for model caseSearch and ActivityCaseList when function onCloseCaseDialog", function (assert) {
		//Action
		this.oCriticalSituation.onCaseHelp();
		var oEvent = {
			getSource: function () {}
		};
		var sCtrl = {
			getParent: function () {}
		};
		this.stub(oEvent, "getSource").returns(sCtrl);
		this.stub(sCtrl, "getParent").returns(this.oCriticalSituation._oCaseDialog);
		this.oCriticalSituation.onCloseCaseDialog(oEvent);
		var sData1 = this.oComponent.getModel("caseSearch").getData().case_id;
		var sData2 = this.oComponent.getModel("ActivityCaseList").getData();
		//Assertion
		assert.equal(sData1, "");
		assert.equal(!sData2, true);
	});

	QUnit.test("should give warning message when select no case and press confirm on case help dialog", function (assert) {
		var oStub = this.stub(this.oCriticalSituation, "onCloseCaseDialog");
		this.oCriticalSituation.onCaseHelp();
		var sControl = sap.ui.core.Fragment.byId("CaseFragId", "iResultsList");
		this.stub(sControl, "getSelectedItem").returns();
		this.oCriticalSituation.sCustomerNo = "";
		//Action
		this.oCriticalSituation.onConfirmCaseSecect();
		//Assertion
		assert.equal(this.oStubMsgBoxWarn.callCount, 1);
		assert.equal(oStub.callCount, 0);
		// sap.m.MessageToast.show.restore();
	});

	QUnit.test("should bring the case ID and customer No to create page when select one case and press confirm on case help dialog",
		function (assert) {
			var oStub = this.stub(this.oCriticalSituation, "onSearchCustomerName");
			this.oCriticalSituation.onCaseHelp();
			var sControl = sap.ui.core.Fragment.byId("CaseFragId", "iResultsList");
			var oItem = new sap.m.ColumnListItem({});
			this.stub(oItem, "getBindingContext").returns({
				getObject: function () {
					return {
						"customer_r3_no": "10010",
						"case_id": "20000972"
					};
				}
			});
			this.stub(sControl, "getSelectedItem").returns(oItem);
			this.oCriticalSituation.sCustomerNo = "";
			//Action
			this.stub(this.oCriticalSituation, "onCloseCaseDialog");
			// this.oCriticalSituation.onCaseHelp();
			this.oCriticalSituation.onConfirmCaseSecect();
			//Assertion
			assert.equal(oStub.callCount, 1);
			// sap.m.MessageToast.show.restore();
		});
	QUnit.test(
		"should only bring the case ID  to create page and give warning message when select one case and press confirm on case help dialog,case related Customer No is not equal to original customer No",
		function (assert) {
			var oStub = this.stub(this.oCriticalSituation, "onCloseCaseDialog");
			this.oCriticalSituation.onCaseHelp();
			var sControl = sap.ui.core.Fragment.byId("CaseFragId", "iResultsList");
			var oItem = new sap.m.ColumnListItem({});
			this.stub(oItem, "getBindingContext").returns({
				getObject: function () {
					return {
						"customer_r3_no": "10010",
						"case_id": "20000972"
					};
				}
			});
			this.stub(sControl, "getSelectedItem").returns(oItem);
			this.oCriticalSituation.sCustomerNo = "12186";
			//Action
			this.oCriticalSituation.onConfirmCaseSecect();
			//Assertion
			assert.equal(oStub.callCount, 1);
			assert.equal(this.oStubMsgBoxWarn.callCount, 1);
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
		var aFilterLength = this.oCriticalSituation.getCaseFilter().length;
		//Assertion
		assert.equal(aFilterLength, 10);
	});
	QUnit.test("should run read FSC2Model once when run function onPressCaseSearch", function (assert) {
		//Action
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", {});
		this.oCriticalSituation.onCaseHelp();
		this.oCriticalSituation.onPressCaseSearch();
		//Assertion
		assert.propEqual(this.oCriticalSituation.getModel("ActivityCaseList").getData, {});
	});
	QUnit.test("should give error message when input a case ID with wrong format", function (assert) {
		//Action
		var oEvent = {
			getSource: function () {}
		};
		var sCtrl = {
			getValue: function () {
				return "1000";
			},
			setValueState: function (sValue) {}
		};
		this.stub(oEvent, "getSource").returns(sCtrl);
		this.oCriticalSituation.onSearchCaseID(oEvent);
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});

	QUnit.test("should run read FSC2Model once when input a case ID with correct format", function (assert) {
		//Action
		var oEvent = {
			getSource: function () {}
		};
		var sCtrl = {
			getValue: function () {
				return "20009756";
			},
			setValueState: function (sValue) {}
		};
		var oData = {
			"results": []
		};
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		this.stub(oEvent, "getSource").returns(sCtrl);
		this.oCriticalSituation.onSearchCaseID(oEvent);
		//Assertion
		assert.equal(this.Fsc2Read.callCount, 1);
	});
	QUnit.test("should bring the case related customer number to create page when input an exist case ID", function (assert) {
		//Action
		var oStub = this.stub(this.oCriticalSituation, "onSearchCustomerName");
		var oEvent = {
			getSource: function () {}
		};
		var sCtrl = {
			getValue: function () {
				return "20009756";
			},
			setValueState: function (sValue) {}
		};
		var oData = {
			"results": [{
				"customer_r3_no": "10010",
				"case_id": "20009756"
			}]
		};
		this.oCriticalSituation.sCustomerNo = "";
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		this.stub(oEvent, "getSource").returns(sCtrl);
		this.oCriticalSituation.onSearchCaseID(oEvent);
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
});
sap.ui.require([
	"sap/support/fsc2/controller/CustomerDetailN.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (CustomerDetailN, models, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";

	QUnit.module("CustomerDetail", {
		beforeEach: function () {
			this.oCustomerDetail = new CustomerDetailN();
			this.oCustomerModel = models.createCustomerDetailModel();
			this.oComponent = new ManagedObject();
			this.oComponent.setModel(this.oCustomerModel, "customerPageConfig");
			this.oListModel = new JSONModel();
			// this.oComponent.setModel(this.oListModel, "detailList");
			this.oIncidentListModel = new JSONModel();
			this.oIncidentListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentList.json"), {}, false);
			this.oRequestListModel = new JSONModel();
			this.oRequestListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/RequestList.json"), {}, false);
			this.oCaseListModel = new JSONModel();
			this.oCaseListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/CaseList.json"), {}, false);
			this.oComponent.setModel(new JSONModel({
				"Authgeneral": "X",
				"Authgloesca": "X"
			}), "user");
			this.oComponent.setModel(new JSONModel({
				"expertMode": false
			}), "homePageConfig");
			this.oComponent.setModel(new JSONModel(), "downloadModel");
			var oFilterModel = new JSONModel();
			this.oComponent.setModel(oFilterModel, "filterOptionModel");
			oFilterModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2","model/CustDetailFilter.json"));
			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				serviceUrl: this.sICDest + "/sap/ZS_AGS_FSC2_SRV"
			});
			this.Fsc2Read = sinon.stub(sap.support.fsc2.FSC2Model, "read");
			sap.support.fsc2.UserProfileModel = new ODataModel({
				json: true,
				useBatch: true,
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				serviceUrl:this.sICDest + "/svt/USER_PROFILE_SRV"
			});
			this.UserProfileModelCreate = sinon.stub(sap.support.fsc2.UserProfileModel, "create");
			this.UserProfileModelRead = sinon.stub(sap.support.fsc2.UserProfileModel, "read");
			this.UserProfileModelRemove = sinon.stub(sap.support.fsc2.UserProfileModel, "remove");
			sap.support.fsc2.IncidentModel = new ODataModel({
				json: true,
				serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
			});
			this.IncidentRead = sinon.stub(sap.support.fsc2.IncidentModel, "read");
			sinon.stub(this.oCustomerDetail, "getOwnerComponent").returns(this.oComponent);
			var oView = {
				byId: function (sId) {},
				setBusy: function () {}
			};
			this.oControl = {
				setBusy: function () {},
				setVisible: function () {},
				setValue: function () {
					return new sap.m.SearchField();
				},
				removeAllSelectedItems: function () {},
				setSelectedKey: function () {
					return new sap.m.ComboBox();
				},
				getValue:function(){
					return "test value";	
				},
				getSelectedItems: function () {
					return [];
				},
				getSelectedKey: function () {return "incident";},
				getVisible: function () {},
				// getBinding: function () {return {};}
			};

			sinon.stub(this.oCustomerDetail, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);
			this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
				selectedKey: "all"
			});
			this.oCustomerDetail.oAll = {
				"count": 0,
				"results": []
			};
			this.oCustomerDetail.oFilter = {
				"all": {
					"situation": [],
					"incident": []
				},
				"situation": [],
				"businessDown": [],
				"incident": [],
				"case": []
			};
			this.oCustomerDetail.loadAllFlag = true;
			this.oCustomerDetail.loadSepFlag = true;
			sinon.stub(this.oCustomerDetail, "eventUsage");
			this.oStubExportSaveFile = sinon.stub(sap.ui.core.util.Export.prototype, "saveFile");
			this.oStubMsgShow = sinon.stub(sap.m.MessageToast, "show");
			this.oStubDialogOpen = sinon.stub(sap.m.Dialog.prototype, "open");
			this.oStubDialogClose = sinon.stub(sap.m.Dialog.prototype, "close");
		},
		afterEach: function () {
			sap.m.MessageToast.show.restore();
			sap.m.Dialog.prototype.open.restore();
			sap.m.Dialog.prototype.close.restore();
			this.oCustomerDetail.destroy();
			this.oStubExportSaveFile.restore();
			this.oCustomerDetail.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});
	QUnit.test("Init when entering customer detail page", function (assert) {
		var sAttach = {
			attachPatternMatched: function () {}
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "getRoute").returns(sAttach);
		var oStubRouter = this.stub(this.oCustomerDetail, "getRouter").returns(router);

		//Action
		this.oCustomerDetail.onInit();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Enter a customer detail page when clicking a customer", function (assert) {
		//Arrangment    
		var oParam = {
			"custnum": "12186",
			"custname": "test",
			"favorite": "true"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.oCustomerDetail._bFavorite = "true";
		// this.stub(this.oCustomerDetail, "loadFilterOption");
		this.stub(this.oCustomerDetail, "loadRequestData");
		this.stub(this.oCustomerDetail, "loadIncidentData");
		this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");

		//Action
		this.oCustomerDetail._onRouteMatched(oEvent);
		//Assertion

		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/_bFavorite"), true);
	});

	QUnit.test("Load top 10 situation requests when click a customer", function (assert) {
		//Arrangment    
		var oData = this.oRequestListModel.getData();
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.loadRequestData(true, true);
		//Assertion

		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/situation/count"), 9);
	});

	QUnit.test("Load top 10 all requests when click a customer", function (assert) {
		//Arrangment    
		var oData = this.oRequestListModel.getData();
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.loadRequestData(true, true);
		//Assertion

		assert.equal(this.oCustomerDetail.oAll.count, 9);
	});
	
	QUnit.test("should load all requests when press download button on all tab", function (assert) {
		//Arrangment    
		var oStub = this.stub(this.oCustomerDetail,"_closeBusy");
		this.oCustomerDetail.downLoadFlag = true;
		var oData = this.oRequestListModel.getData();
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.loadRequestData(false, false, true);
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("should load all requests when press show more button on all tab", function (assert) {
		//Arrangment    
		var oStub = this.stub(this.oCustomerDetail,"_closeBusy");
		this.oCustomerDetail.loadAllFlag = true;
		var oData = this.oRequestListModel.getData();
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.loadRequestData(true, true, false);
		//Assertion
		assert.equal(oStub.called, 1);
	});
	
	QUnit.test("should give error message when load request data and get oData service error", function (assert) {
		//Arrangment    
		this.stub(this.oCustomerDetail,"_closeBusy");
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("error", {});
		//Action
		this.oCustomerDetail.loadRequestData(true, false, false);
		//Assertion
		assert.equal(this.oStubMsgShow.called, true);
	});	
	
	QUnit.test("Load all situation requests when click the 'show more' button on critical situation tab ", function (assert) {
		//Arrangment    
		var oData = this.oRequestListModel.getData();
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		var oParam = {
			getParent: function () {
				return new sap.m.Toolbar();
			}
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oParam);
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "situation"
		});
		//Action
		this.oCustomerDetail.onShowMore(oEvent);
		//Assertion

		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/situation/count"), 9);
	});

	QUnit.test("Load top 10 global escalation case requests when click a customer with authoration", function (assert) {
		//Arrangment
		var oData = this.oCaseListModel.getData();
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		this.Fsc2Read.withArgs("/CasesSet/$count").yieldsTo("success", 58);

		//Action
		this.oCustomerDetail.onCheckUserEscalationAuth(true, true);
		//Assertion

		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/case/count"), 58);
		// assert.equal(stubToolbar.callCount, 1);
	});
	QUnit.test("Set escalation case tab unvisible when click a customer without authoration", function (assert) {
		//Arrangment
		this.oComponent.setModel(new JSONModel({
			"Authgeneral": "X",
			"Authgloesca": ""
		}), "user");
		var oStub = this.stub(this.oCustomerDetail, "_closeBusy");
		//Action
		this.oCustomerDetail.onCheckUserEscalationAuth(true, true);
		//Assertion;
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("should wait for 0.1 second to check authorization again when user model do not load data completely", function (assert) {
		//Arrangment
		this.oComponent.setModel(new JSONModel(), "user");
		var oStub = this.stub(window, "setTimeout");
		//Action
		this.oCustomerDetail.onCheckUserEscalationAuth(true, true);
		//Assertion;
		assert.equal(oStub.called, true);
	});

	QUnit.test("should open or hide filter panel when click the filter icon on top of each list", function (assert) {
		//Arrangment
		var cGrid = this.oCustomerDetail.getView().byId(this.oCustomerDetail.oTabBar.getSelectedKey() + "FilterGrid");
		var oStub = this.stub(cGrid, "setVisible");
		//Action
		this.oCustomerDetail.openFilterPanel();
		//Assertion;
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should get Filter criteria for all list and load all data when run function onFilterAll", function (assert) {
		//Arrangment
		this.stub(this.oCustomerDetail, "getFilterAll");
		var oStub = this.stub(this.oCustomerDetail, "loadAllData");
		//Action
		this.oCustomerDetail.onFilterAll();
		//Assertion;
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should load request, cases and incident data from back end when loadAllData", function (assert) {
		//Arrangment
		this.oCustomerDetail.hasPriorityVeryHigh = true;
		this.oCustomerDetail.hasPriorityMediumLow = false;
		this.stub(this.oCustomerDetail, "exportData");
		this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");
		this.stub(this.oCustomerDetail, "loadRequestData");
		var oStub = this.stub(this.oCustomerDetail, "loadIncidentData");
		//Action
		this.oCustomerDetail.loadAllData();
		//Assertion;
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("should only load request, cases and do not load incident data from back end when loadAllData with priority medium or low",
		function (assert) {
			//Arrangment
			this.oCustomerDetail.hasPriorityVeryHigh = false;
			this.oCustomerDetail.hasPriorityMediumLow = true;
			this.stub(this.oCustomerDetail, "exportData");
			this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");
			this.stub(this.oCustomerDetail, "loadRequestData");
			var oStub = this.stub(this.oCustomerDetail, "loadIncidentData");
			//Action
			this.oCustomerDetail.loadAllData(false, false, true);
			//Assertion;
			assert.equal(oStub.callCount, 0);
		});
		
		QUnit.test("should run _closeBusy to export all data when download all data with priority medium or low",
		function (assert) {
			//Arrangment
			this.oCustomerDetail.hasPriorityVeryHigh = false;
			this.oCustomerDetail.hasPriorityMediumLow = true;
			this.oCustomerDetail.downLoadFlag = true;
			// this.stub(this.oCustomerDetail, "exportData");
			this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");
			this.stub(this.oCustomerDetail, "loadRequestData");
			var oStub = this.stub(this.oCustomerDetail, "_closeBusy");
			//Action
			this.oCustomerDetail.loadAllData(false, false, true);
			//Assertion;
			assert.equal(oStub.callCount, 1);
		});
		
		QUnit.test("should run _closeBusy to close busy when load top 5 items for all list data with priority medium or low",
		function (assert) {
			//Arrangment
			this.oCustomerDetail.hasPriorityVeryHigh = false;
			this.oCustomerDetail.hasPriorityMediumLow = true;
			this.oCustomerDetail.downLoadFlag = false;
			// this.stub(this.oCustomerDetail, "exportData");
			this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");
			this.stub(this.oCustomerDetail, "loadRequestData");
			var oStub = this.stub(this.oCustomerDetail, "_closeBusy");
			//Action
			this.oCustomerDetail.loadAllData(true, true, false);
			//Assertion;
			assert.equal(oStub.callCount, 1);
		});

	QUnit.test("should get filter criteria of request list and load data from back end when run function onFilterSituation", function (
		assert) {
		//Arrangment
		this.stub(this.oCustomerDetail, "getFilter");
		var oStub = this.stub(this.oCustomerDetail, "loadRequestData");
		//Action
		this.oCustomerDetail.onFilterSituation();
		//Assertion;
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should get filter criteria of incident or Budiness Down list and load data from back end when run function onFilterIncident",
		function (assert) {
			//Arrangment
			this.stub(this.oCustomerDetail, "getFilter");
			var oStub = this.stub(this.oCustomerDetail, "loadIncidentData");
			//Action
			this.oCustomerDetail.onFilterIncident();
			//Assertion;
			assert.equal(oStub.callCount, 1);
		});

	QUnit.test("should get filter criteria of incident when filter priority and timeperiod for incident list", function (assert) {
		//Arrangment
		this.stub(this.oCustomerDetail, "getTimePeriod");
		var sPriorityContrl = this.oCustomerDetail.getView().byId("incidentPriorityFilter");
		this.stub(sPriorityContrl, "getSelectedItems").returns([
			new sap.ui.core.Item({
				text: "very high",
				key: "1"
			}),
			new sap.ui.core.Item({
				text: "very high",
				key: "3"
			}),
			new sap.ui.core.Item({
				text: "very high",
				key: "9"
			})
		]);
		var sTimeFilterContrl = this.oCustomerDetail.getView().byId("incidentTimeFilter");
		this.stub(sTimeFilterContrl, "getSelectedKey").returns("5");
		//Action
		var aFilter = this.oCustomerDetail.getFilter(false, "incident");
		//Assertion;
		assert.equal((aFilter.length > 0), true);
	});
	
	QUnit.test("should get filter criteria of incident when filter status and timeperiod for all list", function (assert) {
		//Arrangment
		this.stub(this.oCustomerDetail, "getTimePeriod");
		var sStatusContrl = this.oCustomerDetail.getView().byId("incidentStatusFilter");
		this.stub(sStatusContrl, "getSelectedItems").returns([
			new sap.ui.core.Item({
				text: "new",
				key: "E0010"
			}),
			new sap.ui.core.Item({
				text: "non-complete",
				key: "E0011"
			}),
			new sap.ui.core.Item({
				text: "complete",
				key: "E0014"
			})
		]);
		var sTimeFilterContrl = this.oCustomerDetail.getView().byId("incidentTimeFilter");
		this.stub(sTimeFilterContrl, "getSelectedKey").returns("3");
		//Action
		var aFilter = this.oCustomerDetail.getFilter(true, "incident");
		//Assertion;
		assert.equal((aFilter.length > 0), true);
	});
	
	QUnit.test("should get filter criteria of incident when filter one status for all list", function (assert) {
		//Arrangment
		this.stub(this.oCustomerDetail, "getTimePeriod");
		var sStatusContrl = this.oCustomerDetail.getView().byId("incidentStatusFilter");
		this.stub(sStatusContrl, "getSelectedItems").returns([
			new sap.ui.core.Item({
				text: "non-complete",
				key: "E0011"
			})
		]);
		//Action
		var aFilter = this.oCustomerDetail.getFilter(true, "incident");
		//Assertion;
		assert.equal((aFilter.length > 0), true);
	});

	QUnit.test("should get filter criteria of request list when filter status for all list", function (assert) {
		//Arrangment
		this.stub(this.oCustomerDetail, "getTimePeriod");
		var sStatusContrl = this.oCustomerDetail.getView().byId("situationStatusFilter");
		this.stub(sStatusContrl, "getSelectedItems").returns([
			new sap.ui.core.Item({
				text: "new",
				key: "E0010"
			}),
			new sap.ui.core.Item({
				text: "non-complete",
				key: "E0011"
			}),
			new sap.ui.core.Item({
				text: "complete",
				key: "E0014"
			}),
			new sap.ui.core.Item({
				text: "all",
				key: "all"
			})
		]);
		var sTimeFilterContrl = this.oCustomerDetail.getView().byId("situationTimeFilter");
		this.stub(sTimeFilterContrl, "getSelectedKey").returns("3");
		//Action
		var aFilter = this.oCustomerDetail.getFilter(true, "situation");
		//Assertion;
		assert.equal((aFilter.length > 0), true);
	});

	QUnit.test("Load all global escalation case requests when click the 'show more' button on global escalation case tab", function (assert) {
		//Arrangment   
		var oData = this.oCaseListModel.getData();
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		var oParam = {
			getParent: function () {
				return new sap.m.Toolbar();
			}
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oParam);
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "case"
		});

		//Action
		this.oCustomerDetail.onShowMore(oEvent);
		// this.oCustomerDetail.loadCaseData(false, false);
		//Assertion

		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/case/count"), 58);
		// assert.equal(stubToolbar.callCount, 1);

	});

	QUnit.test("Load top 10 business down incident when click a customer", function (assert) {
		//Arrangment   
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);

		//Action
		this.oCustomerDetail.loadIncidentData("businessDown", true, true);
		//Assertion

		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/businessDown/count"), 14);

	});

	QUnit.test("Load all business down incident when click the 'show more' button on business down tab ", function (assert) {
		//Arrangment   
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		var oParam = {
			getParent: function () {
				return new sap.m.Toolbar();
			}
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oParam);
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "businessDown"
		});

		//Action
		this.oCustomerDetail.onShowMore(oEvent);
		//this.oCustomerDetail.loadIncidentData("businessDown", false, false);
		//Assertion
		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/businessDown/count"), 14);
	});

	QUnit.test("Load top 10 P1 incidents when click a customer", function (assert) {
		//Arrangment   
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadIncidentData("incident", true, true);
		//Assertion

		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/incident/count"), 14);
		assert.equal(this.oCustomerDetail.oAll.count, 14);
	});
	
	QUnit.test("Load incident data when press download button on all tab", function (assert) {
		//Arrangment   
		this.oCustomerDetail.downLoadFlag =true;
		var oStub = this.stub(this.oCustomerDetail,"_closeBusy");
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadIncidentData("incident", false, false, true);
		//Assertion

		assert.equal(oStub.called, true);
		assert.equal(this.oCustomerDetail.oAll.count, 14);
	});
	
	QUnit.test("Load incident data when press show more button on all tab", function (assert) {
		//Arrangment   
		this.oCustomerDetail.downLoadFlag = false;
		var oStub = this.stub(this.oCustomerDetail,"_closeBusy");
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadIncidentData("incident", false, true, false);
		//Assertion

		assert.equal(oStub.called, true);
	});
	
	QUnit.test("should give error message when get oData service error on loading incident data", function (assert) {
		//Arrangment   
		var oStub = this.oStubMsgShow;
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("error", {});
		//Action
		this.oCustomerDetail.loadIncidentData("incident", false, true, false);
		//Assertion
		assert.equal(oStub.called, true);
	});
	QUnit.test("Load all P1 incidents when click the 'show more' button on P1 incident tab ", function (assert) {
		//Arrangment   
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		var oParam = {
			getParent: function () {
				return new sap.m.Toolbar();
			}
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oParam);
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "incident"
		});

		//Action
		this.oCustomerDetail.onShowMore(oEvent);
		//this.oCustomerDetail.loadIncidentData("incident", true, true);
		//Assertion
		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/incident/count"), 14);
	});
	QUnit.test("Load all items when click the 'show more' button on 'All' tab ", function (assert) {
		//Arrangment  
		var oParam = {
			getParent: function () {
				return new sap.m.Toolbar();
			}
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oParam);
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "all"
		});
		this.stub(this.oCustomerDetail, "loadRequestData");
		this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");
		this.stub(this.oCustomerDetail, "loadIncidentData");
		//Action
		this.oCustomerDetail.onShowMore(oEvent);
		//Assertion
		assert.equal(this.oCustomerDetail.topFlagAll, false);
	});

	QUnit.test("should load escalation case data when press download button on all tab", function (assert) {
		//Arrangment   
		this.oCustomerDetail.downLoadFlag =true;
		var oStub = this.stub(this.oCustomerDetail,"_closeBusy");
		var oData = {"results":[
			  {"caseid":"20000972"}
			]};
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadCaseData( false, false, true);
		//Assertion

		assert.equal(oStub.called, true);
	});
	
	QUnit.test("should load escalation case data when press show more button on all tab", function (assert) {
		//Arrangment   
		this.oCustomerDetail.downLoadFlag =false;
		var oStub = this.stub(this.oCustomerDetail,"_closeBusy");
		var oData = this.oCaseListModel.getData();
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadCaseData( false, true, false);
		//Assertion

		assert.equal(oStub.called, true);
	});
	
	QUnit.test("should give error message when load escalation case data and get oData service error", function (assert) {
		//Arrangment   
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("error", {});
		//Action
		this.oCustomerDetail.loadCaseData( false, true, false);
		//Assertion
		assert.equal(this.oStubMsgShow.called, true);
	});
	
	QUnit.test("Nav to create page when 'Create Critical Situation' button was pressed", function (assert) {
		//Arrangment   
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oCustomerDetail, "getRouter").returns(router);
		this.oCustomerDetail.sCustomerNo = "0000012186";
		this.oCustomerDetail.sCustomerName = "Bayer AG";

		//Action
		this.oCustomerDetail.onCreateSituation();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});

	QUnit.test("Nav to incident detail when selected icontabbar was business down or p1 incident", function (assert) {
		//Arrangment   

		this.stub(this.oCustomerDetail.oTabBar, "getSelectedKey").returns("businessDown");

		var getBindingContext = function (sModelName) {
			var oBindObject = {
				getObject: function () {
					return {
						"ID": "1872/2018",
						"Description": "CSM Toolset. Third Incident",
						"Status": "In process",
						"CustomerName": "Robert Bosch GmbH",
						"EntryKey": "002028376400000018722018",
						"TransType": "ZTINP"
					};
				}
			};
			return oBindObject;
		};

		var oBindingContext = {
			getBindingContext: getBindingContext
		};

		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBindingContext);

		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oCustomerDetail, "getRouter").returns(router);
		//Action
		this.oCustomerDetail.onRowPress(oEvent);
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Nav to escalation case detail when selected icontabbar was case", function (assert) {
		//Arrangment   

		this.stub(this.oCustomerDetail.oTabBar, "getSelectedKey").returns("case");

		var getBindingContext = function (sModelName) {
			var oBindObject = {
				getObject: function () {
					return {
						"ID": "1872/2018",
						"Description": "CSM Toolset. Third Incident",
						"Status": "In process",
						"CustomerName": "Robert Bosch GmbH",
						"EntryKey": "002028376400000018722018",
						"TransType": "ZS01"
					};
				}
			};
			return oBindObject;
		};

		var oBindingContext = {
			getBindingContext: getBindingContext
		};

		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBindingContext);

		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oCustomerDetail, "getRouter").returns(router);
		//Action
		this.oCustomerDetail.onRowPress(oEvent);
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});

	QUnit.test("Nav to critical request detail when selected icontabbar was situation", function (assert) {
		//Arrangment   

		this.stub(this.oCustomerDetail.oTabBar, "getSelectedKey").returns("situation");

		var getBindingContext = function (sModelName) {
			var oBindObject = {
				getObject: function () {
					return {
						"ID": "1872/2018",
						"Description": "CSM Toolset. Third Incident",
						"Status": "In process",
						"CustomerName": "Robert Bosch GmbH",
						"EntryKey": "002028376400000018722018",
						"TransType": "ZS01"
					};
				}
			};
			return oBindObject;
		};

		var oBindingContext = {
			getBindingContext: getBindingContext
		};

		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBindingContext);

		// var router = new sap.ui.core.routing.Router();
		// this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oCustomerDetail, "onNavToCriticalRequest");
		//Action
		this.oCustomerDetail.onRowPress(oEvent);
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});

	QUnit.test("Flag a customer favorite when 'Set Favorite' button was pressed", function (assert) {
		//Arrangment  
		this.UserProfileModelCreate.withArgs("/Entries").yieldsTo("success", "");
		//Action
		this.oCustomerDetail.onSetFavorite();
		//Assertion
		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/_bFavorite"), true);
	});

	QUnit.test("Flag a customer unfavorite when 'Remove Favorite' button was pressed", function (assert) {
		//Arrangment  
		var oData = {
			"results": [{
				"Username": "",
				"Attribute": "FAVORITE_CUSTOMERS",
				"Field": "1",
				"Value": "0000011174",
				"Text": "0000011174"
			}]
		};
		this.oCustomerDetail.sCustomerNo = "0000011174";
		this.UserProfileModelRead.withArgs("/Entries").yieldsTo("success", oData);
		this.UserProfileModelRemove.withArgs("/Entries(Username='',Attribute='FAVORITE_CUSTOMERS',Field='1')").yieldsTo("success",
			"");
		//Action
		this.oCustomerDetail.onRemoveFavorite();
		//Assertion
		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/_bFavorite"), false);
	});

	QUnit.test("Close view busy when showing top 10 items on 'All' tab", function (assert) {
		//Arrangment  
		this.oCustomerDetail.iLoadCount = 4;
		this.oCustomerDetail.downLoadFlag = false;
		this.oCustomerDetail.topFlagAll = true;
		this.oCustomerDetail.oAll = {
			"results": [{
				"UpdateDate": 1
			}, {
				"UpdateDate": 2
			}]
		};
		//Action
		this.oCustomerDetail._closeBusy();
		//Assertion
		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/all"), this.oCustomerDetail.oAll);
	});
	QUnit.test("Download all items on 'All' tab", function (assert) {
		//Arrangment  
		this.oCustomerDetail.iLoadCount = 4;
		this.oCustomerDetail.downLoadFlag = true;
		this.oCustomerDetail.oTabBar = new sap.m.Toolbar();
		this.oCustomerDetail.oAll = {
			"results": [{
				"UpdateDate": 1
			}, {
				"UpdateDate": 2
			}]
		};
		var oStub = this.stub(this.oCustomerDetail, "exportData");
		//Action
		this.oCustomerDetail._closeBusy();
		//Assertion
		assert.equal(oStub.called, true);
	});
	
	QUnit.test("should show all items and close control busy when click show more button under all tab", function (assert) {
		//Arrangment  
		this.oCustomerDetail.iLoadCount = 4;
		this.oCustomerDetail.downLoadFlag = false;
		this.oCustomerDetail.topFlagAll = false;
		this.oCustomerDetail.oTabBar = new sap.m.Toolbar();
		this.oCustomerDetail.oAll = {
			"results": [{
				"UpdateDate": 1
			}, {
				"UpdateDate": 2
			}]
		};
		var oView = this.oCustomerDetail.getView();
		var oStub = this.stub(oView, "setBusy");
		//Action
		this.oCustomerDetail._closeBusy();
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("Download businessDown list when 'Download' button was pressed", function (assert) {
		//Arrangment  
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "businessDown"
		});
		var oStub = this.stub(this.oCustomerDetail, "exportData");
		this.oCustomerDetail.downLoadFlag = false;
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.onDownload();
		//Assertion
		assert.equal(oStub.called, true);
	});
	QUnit.test("Download escalation list when 'Download' button was pressed on global escalation case tab", function (assert) {
		//Arrangment  
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "case"
		});
		var oStub = this.stub(this.oCustomerDetail, "exportData");
		this.oCustomerDetail.downLoadFlag = false;
		var oData = this.oCaseListModel.getData();
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.onDownload();
		//Assertion
		assert.equal(oStub.called, true);
	});
	QUnit.test("Download incident list when 'Download' button was pressed on incident tab", function (assert) {
		//Arrangment  
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "incident"
		});
		var oStub = this.stub(this.oCustomerDetail, "exportData");
		this.oCustomerDetail.downLoadFlag = false;
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.onDownload();
		//Assertion
		assert.equal(oStub.called, true);
	});
	QUnit.test("Download situstion list when 'Download' button was pressed on situation tab", function (assert) {
		//Arrangment  
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "situation"
		});
		var oStub = this.stub(this.oCustomerDetail, "exportData");
		this.oCustomerDetail.downLoadFlag = false;
		var oData = this.oRequestListModel.getData();
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.onDownload();
		//Assertion
		assert.equal(oStub.called, true);
	});
	QUnit.test("Download all list when 'Download' button was pressed on all tab", function (assert) {
		//Arrangment  
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "all"
		});
		// var oStub = this.stub(this.oCustomerDetail, "exportData");
		this.stub(this.oCustomerDetail, "loadRequestData");
		this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");
		this.stub(this.oCustomerDetail, "loadIncidentData");
		//Action
		this.oCustomerDetail.onDownload();
		//Assertion
		assert.equal(this.oCustomerDetail.downLoadFlag, true);
	});
	
	QUnit.test("should download 17 columns when 'Download' button was pressed under incident or business down list", function (assert) {
		//Arrangment  
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "incident"
		});
		//Action
		this.oCustomerDetail.exportData();
		//Assertion
		assert.equal(this.oStubExportSaveFile.callCount, 1);
	});
	
	// QUnit.test("should filter list based on search value when enter search text in search field on top of list", function (assert) {
	// 	//Arrangment  
	// 	var oIconnTabBar = this.oCustomerDetail.getView().byId("idIconTabBar");
	// 	this.stub(oIconnTabBar,"getSelectedKey").returns("incident");
	// 	var oEvent = {
	// 		getSource:function(){
	// 			return new sap.m.SearchField({"value":"complete"});
	// 		}
	// 	};
	// 	//Action
	// 	this.oCustomerDetail.onSearch(oEvent);
	// 	//Assertion
	// 	assert.equal(oStub.callCount, 1);
	// });
	QUnit.test("should return the date the specific days before when run function getTimePeriod", function (assert) {
		//Arrangment  
		var oStub = this.stub(this.oCustomerDetail,"getDay");
		//Action
		this.oCustomerDetail.getTimePeriod("1");
		this.oCustomerDetail.getTimePeriod("2");
		this.oCustomerDetail.getTimePeriod("3");
		this.oCustomerDetail.getTimePeriod("4");
		this.oCustomerDetail.getTimePeriod("5");
		this.oCustomerDetail.getTimePeriod("6");
		this.oCustomerDetail.getTimePeriod(0);
		//Assertion
		assert.equal(oStub.callCount, 7);
	});
});
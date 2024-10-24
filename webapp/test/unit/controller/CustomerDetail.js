sap.ui.require([
	"sap/support/fsc2/controller/CustomerDetail.controller",
	"sap/support/fsc2/model/models",
	"sap/support/fsc2/model/formatter",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (CustomerDetailN, models, formatter, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";

	QUnit.module("CustomerDetail", {
		beforeEach: function () {
			this.oCustomerDetail = new CustomerDetailN();
			this.oCustomerModel = new JSONModel(models.initCustomerDetailData());
			this.oComponent = new ManagedObject();
			this.oComponent.setModel(this.oCustomerModel, "customerPageConfig");
			this.oComponent.setModel(new JSONModel({
				"bEnable": false
			}), "EnableSnowCase");
			this.oListModel = new JSONModel();
			// this.oComponent.setModel(this.oListModel, "detailList");
			this.oIncidentListModel = new JSONModel();
			this.oIncidentListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentList.json"), {}, false);
			this.oRequestListModel = new JSONModel();
			this.oRequestListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/RequestList.json"), {}, false);
			this.oCaseListModel = new JSONModel();
			this.oCaseListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/CaseList.json"), {}, false);
			this.oSNowCaseListModel = new JSONModel();
			this.oSNowCaseListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SNowCasesList.json"), {}, false);
			this.oComponent.setModel(this.oSNowCaseListModel,"oSNowCaseListModel");
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
			oFilterModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "model/CustDetailFilter.json"));
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
				serviceUrl: this.sICDest + "/svt/USER_PROFILE_SRV"
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
				getValue: function () {
					return "test value";
				},
				getSelectedItems: function () {
					return [];
				},
				getSelectedKey: function () {
					return "incident";
				},
				getVisible: function () {},
				// getBinding: function () {return {};}
			};

			sinon.stub(this.oCustomerDetail, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);
			this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
				selectedKey: "all"
			});
			this.oCustomerDetail.oIconTab = new sap.m.IconTabBar({
				selectedKey: "all"
			});
			this.oCustomerDetail.initCustData = models.initCustomerDetailData();
			this.oCustomerDetail.oAll = {
				"count": 0,
				"results": []
			};
			this.oCustomerDetail.oFilter = {
				"all": {
					"situation": [],
					"businessDown": [],
					"incident": [],
					"snowCase": {
						"status": [],
						"priority": [],
						"timePeriod": []
					}
				},
				"situation": [],
				"businessDown": [],
				"incident": [],
				"snowCase": {
					"status": [],
					"priority": [],
					"timePeriod": []
				}
			};
			this.oCustomerDetail.loadAllFlag = true;
			this.oCustomerDetail.loadSepFlag = true;
			sinon.stub(this.oCustomerDetail, "eventUsage");
			this.oStubExportSaveFile = sinon.stub(sap.ui.core.util.Export.prototype, "saveFile");
			this.oStubMsgShow = sinon.stub(sap.m.MessageToast, "show");
			this.oStubDialogOpen = sinon.stub(sap.m.Dialog.prototype, "open");
			this.oStubDialogClose = sinon.stub(sap.m.Dialog.prototype, "close");
			var oEventBus = {
				publish: function () {},
				subscribe: function () {}
			};
			this.stubEventBus = sinon.stub(this.oCustomerDetail, "getEventBus").returns(oEventBus);
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
		this.stub(this.oCustomerDetail, "loadBcIncidentData");
		this.stub(this.oCustomerDetail, "loadBusDownData");
		this.stub(this.oCustomerDetail, "loadSnowCaseData");
		this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");

		//Action
		this.oCustomerDetail._onRouteMatched(oEvent);
		//Assertion

		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/_bFavorite"), true);
	});

	QUnit.test("Load top 10 situation requests for situation tab when click a customer", function (assert) {
		//Arrangment    
		var oData = this.oRequestListModel.getData();
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.loadRequestData(true, "situation", false);
		//Assertion

		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/situation/count"), 9);
	});
	QUnit.test("Load all situation requests for download situation", function (assert) {
		//Arrangment    
		var oData = this.oRequestListModel.getData();
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		var oStub1 = this.stub(this.oCustomerDetail,"exportData");
		//Action
		this.oCustomerDetail.loadRequestData(false, "situation", true);
		//Assertion
		assert.equal(oStub1.called, true);
	});
	QUnit.test("Load all situation requests for both situation and all tab", function (assert) {
		//Arrangment    
		var oData = this.oRequestListModel.getData();
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		var oStub1 = this.stub(this.oCustomerDetail,"loadAllDataComplete");
		//Action
		this.oCustomerDetail.loadRequestData(true, "bothTab", false);
		//Assertion
		assert.equal(oStub1.called, true);
	});
	// QUnit.test("Load top 10 all requests when click a customer", function (assert) {
	// 	//Arrangment    
	// 	var oData = this.oRequestListModel.getData();
	// 	this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
	// 	//Action
	// 	this.oCustomerDetail.loadRequestData(true, "", false);
	// 	//Assertion

	// 	assert.equal(this.oCustomerDetail.oAll.count, 9);
	// });

	QUnit.test("should load all requests when press download button on all tab", function (assert) {
		//Arrangment    
		var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
		this.oCustomerDetail.downLoadFlag = true;
		var oData = this.oRequestListModel.getData();
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.loadRequestData(false, "allTab", true);
		//Assertion
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should load all requests when press show more button on all tab", function (assert) {
		//Arrangment    
		var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
		// this.oCustomerDetail.loadAllFlag = true;
		var oData = this.oRequestListModel.getData();
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.loadRequestData(false, "allTab", false);
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("should give error message when load request data and get oData service error", function (assert) {
		//Arrangment    
		this.stub(this.oCustomerDetail, "loadAllDataComplete");
		this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("error", {});
		//Action
		this.oCustomerDetail.loadRequestData(true, "situation", false);
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
		this.oCustomerDetail.onCheckUserEscalationAuth(true, "bothTab", false);
		//Assertion

		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/case/count"), 58);
		// assert.equal(stubToolbar.callCount, 1);
	});
	QUnit.test(
		"Set escalation case tab unvisible and set case load to complete when load cases in cases tab and all tab without authoration",
		function (assert) {
			//Arrangment
			this.oComponent.setModel(new JSONModel({
				"Authgeneral": "X",
				"Authgloesca": ""
			}), "user");
			var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
			//Action
			this.oCustomerDetail.onCheckUserEscalationAuth(true, "bothTab", false);
			//Assertion;
			assert.equal(oStub.callCount, 1);
		});
	QUnit.test("Set escalation case tab unvisible and set case load to complete when only load cases in cases tab without authoration",
		function (assert) {
			//Arrangment
			this.oComponent.setModel(new JSONModel({
				"Authgeneral": "X",
				"Authgloesca": ""
			}), "user");
			var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
			//Action
			this.oCustomerDetail.onCheckUserEscalationAuth(true, "case", false);
			//Assertion;
			assert.equal(oStub.callCount, 1);
		});

	QUnit.test("Set escalation case tab unvisible and set case load to complete when only load cases in cases tab without authoration",
		function (assert) {
			//Arrangment
			this.oComponent.setModel(new JSONModel({
				"Authgeneral": "X",
				"Authgloesca": ""
			}), "user");
			var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
			//Action
			this.oCustomerDetail.onCheckUserEscalationAuth(true, "case", false);
			//Assertion;
			assert.equal(oStub.callCount, 1);
		});
	QUnit.test("Set escalation case tab unvisible and set case load to complete when only load cases in cases tab without authoration",
		function (assert) {
			//Arrangment
			this.oComponent.setModel(new JSONModel({
				"Authgeneral": "X",
				"Authgloesca": ""
			}), "user");
			var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
			//Action
			this.oCustomerDetail.onCheckUserEscalationAuth(true, "allTab", false);
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
		this.stub(this.oCustomerDetail, "getFilterCond_All");
		var oStub = this.stub(this.oCustomerDetail, "loadAllData");
		//Action
		this.oCustomerDetail.onFilterAll();
		//Assertion;
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should load request, Escalation cases ,SNow cases and BC incident data from back end when loadAllData", function (assert) {
		//Arrangment
		this.oCustomerDetail.hasPriorityVeryHigh = true;
		this.oCustomerDetail.hasPriorityMediumLow = false;
		this.stub(this.oCustomerDetail, "exportData");
		this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");
		this.stub(this.oCustomerDetail, "loadRequestData");
		this.stub(this.oCustomerDetail, "loadSnowCaseData");
		var oStub = this.stub(this.oCustomerDetail, "loadBcIncidentData");
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
			this.stub(this.oCustomerDetail, "loadSnowCaseData");
			var oStub = this.stub(this.oCustomerDetail, "loadBcIncidentData");
			//Action
			this.oCustomerDetail.loadAllData(false, false, true);
			//Assertion;
			assert.equal(oStub.callCount, 0);
		});

	QUnit.test("should run  loadAllDataComplete to export all data when download all data with priority medium or low",
		function (assert) {
			//Arrangment
			this.oCustomerDetail.hasPriorityVeryHigh = false;
			this.oCustomerDetail.hasPriorityMediumLow = true;
			this.oCustomerDetail.downLoadFlag = true;
			// this.stub(this.oCustomerDetail, "exportData");
			this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");
			this.stub(this.oCustomerDetail, "loadRequestData");
			var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
			//Action
			this.oCustomerDetail.loadAllData(false, false, true);
			//Assertion;
			assert.equal(oStub.callCount, 1);
		});

	QUnit.test("should run  loadAllDataComplete to close busy when load top 5 items for all list data with priority medium or low",
		function (assert) {
			//Arrangment
			this.oCustomerDetail.hasPriorityVeryHigh = false;
			this.oCustomerDetail.hasPriorityMediumLow = true;
			this.oCustomerDetail.downLoadFlag = false;
			// this.stub(this.oCustomerDetail, "exportData");
			this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");
			this.stub(this.oCustomerDetail, "loadRequestData");
			var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
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

	QUnit.test("should get filter criteria of incident list and load data from back end when run function onFilterIncident",
		function (assert) {
			//Arrangment
			this.stub(this.oCustomerDetail, "getFilter");
			this.stub(this.oCustomerDetail, "loadSnowCaseData");
			var oStub = this.stub(this.oCustomerDetail, "loadBcIncidentData");
			//Action
			this.oCustomerDetail.onFilterIncident();
			//Assertion;
			assert.equal(oStub.callCount, 1);
		});

	QUnit.test("should get filter criteria of Budiness Down list and load data from back end when run function onFilterBusinessDown",
		function (assert) {
			//Arrangment
			this.stub(this.oCustomerDetail, "getFilter");
			var oStub = this.stub(this.oCustomerDetail, "loadBusDownData");
			//Action
			this.oCustomerDetail.onFilterBusinessDown();
			//Assertion;
			assert.equal(oStub.callCount, 1);
		});
	QUnit.test("should get filter criteria of SNowCase when filter priority and timeperiod for incident list", function (assert) {
		//Arrangment
		this.stub(this.oCustomerDetail, "getTimePeriod");
		var sPriorityContrl2 = this.oCustomerDetail.getView().byId("allPriorityFilter");
		this.stub(sPriorityContrl2, "getSelectedItems").returns([
			new sap.ui.core.Item({
				text: "very high",
				key: "1"
			}),
			new sap.ui.core.Item({
				text: "high",
				key: "3"
			}),
			new sap.ui.core.Item({
				text: "low",
				key: "9"
			})
		]);
		var sTimeFilterContrl2 = this.oCustomerDetail.getView().byId("incidentTimeFilter");
		this.stub(sTimeFilterContrl2, "getSelectedKey").returns("5");
		//Action
		var aFilter = this.oCustomerDetail.getFilter_snowCase("incident");
		//Assertion;
		assert.equal((aFilter.priority.length > 0), true);
	});
	QUnit.test("should get filter criteria of SNowCase when filter status and timeperiod for incident list", function (assert) {
		//Arrangment
		// this.stub(this.oCustomerDetail, "getTimePeriod");
		var sStateContrl2 = this.oCustomerDetail.getView().byId("incidentStatusFilter");
		this.stub(sStateContrl2, "getSelectedItems").returns([
			new sap.ui.core.Item({
				text: "new",
				key: "E0010"
			}),
			new sap.ui.core.Item({
				text: "not complete",
				key: "E0011"
			}),
			new sap.ui.core.Item({
				text: "new",
				key: "E0001"
			}),
			new sap.ui.core.Item({
				text: "in process",
				key: "E0002"
			}),
			new sap.ui.core.Item({
				text: "awaiting info",
				key: "18"
			}),
			new sap.ui.core.Item({
				text: "Resolved",
				key: "6"
			}),
			new sap.ui.core.Item({
				text: "others",
				key: "E"
			})
		]);
		var sTimeFilterContrl2 = this.oCustomerDetail.getView().byId("incidentTimeFilter");
		this.stub(sTimeFilterContrl2, "getSelectedKey").returns("5");
		//Action
		var aFilter = this.oCustomerDetail.getFilter_snowCase("incident");
		//Assertion;
		assert.equal((aFilter.status.length > 0), true);
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
	QUnit.test("should return empty for SNowCase when disabled the switch EnableSnowCase", function (assert) {
		//Arrangment   

		var oStub1 = this.stub(this.oCustomerDetail, "loadAllDataComplete");
		//Action
		this.oCustomerDetail.loadSnowCaseData(true, "allTab", false);
		this.oCustomerDetail.loadSnowCaseData(true, "bothTab", false);
		this.oCustomerDetail.loadSnowCaseData(true, "snowCase", false);
		//Assertion
		assert.equal(oStub1.callCount, 2);
	});
	QUnit.test("should load SNowCase for all tab when enable the switch EnableSnowCase", function (assert) {
		//Arrangment   
		this.oComponent.getModel("EnableSnowCase").setProperty("/bEnable",true);
		this.oCustomerDetail.oFilter = {
			"all": {
				"snowCase": {"timePeriod":"5","priority":["1","2"],"status":["1","10"]}
			},
			"snowCase": {"timePeriod":"5","priority":["1","2"],"status":["1","10"]}
		};
		var oData = this.oComponent.getModel("oSNowCaseListModel").getData();
		this.stub($,"ajax").yieldsTo("success",oData);
		var oStub1 = this.stub(this.oCustomerDetail, "loadAllDataComplete");
		//Action
		this.oCustomerDetail.loadSnowCaseData(true, "allTab", false);
		//Assertion
		assert.equal(oStub1.callCount, 1);
	});
	
	QUnit.test("should load SNowCase for all tab and Incident tab when enable the switch EnableSnowCase", function (assert) {
		//Arrangment   
		this.oComponent.getModel("EnableSnowCase").setProperty("/bEnable",true);
		this.oCustomerDetail.oFilter = {
			"all": {
				"snowCase": {"timePeriod":"5","priority":["1","2"],"status":["1","10"]}
			},
			"snowCase": {"timePeriod":"5","priority":["1","2"],"status":["1","10"]}
		};
		this.oComponent.getModel("customerPageConfig").setProperty("/bcIncident/loadComplete",true);
		var oData = this.oComponent.getModel("oSNowCaseListModel").getData();
		this.stub($,"ajax").yieldsTo("success",oData);
		var oStub1 = this.stub(this.oComponent.getModel("customerPageConfig"), "setProperty");
		//Action
		this.oCustomerDetail.loadSnowCaseData(true, "snowCase", false);
		//Assertion
		assert.equal(oStub1.callCount,2);
	});
	
	QUnit.test("should load SNowCase only for both tab when enable the switch EnableSnowCase", function (assert) {
		//Arrangment   
		this.oComponent.getModel("EnableSnowCase").setProperty("/bEnable",true);
		this.oCustomerDetail.oFilter = {
			"all": {
				"snowCase": {"timePeriod":"5","priority":["1","2"],"status":["1","10"]}
			},
			"snowCase": {"timePeriod":"5","priority":["1","2"],"status":["1","10"]}
		};
		this.oComponent.getModel("customerPageConfig").setProperty("/bcIncident/loadComplete",true);
		var oData = this.oComponent.getModel("oSNowCaseListModel").getData();
		this.stub($,"ajax").yieldsTo("success",oData);
		var oStub1 = this.stub(this.oCustomerDetail, "loadAllDataComplete");
		//Action
		this.oCustomerDetail.loadSnowCaseData(true, "bothTab", false);
		//Assertion
		assert.equal(oStub1.callCount,1);
	});
	
	QUnit.test("should load SNowCase data for Incident tab when download the incident list with enable the switch EnableSnowCase", function (assert) {
		//Arrangment   
		this.oComponent.getModel("EnableSnowCase").setProperty("/bEnable",true);
		this.oCustomerDetail.oFilter = {
			"all": {
				"snowCase": {"timePeriod":"5","priority":["1","2"],"status":["1","10"]}
			},
			"snowCase": {"timePeriod":"5","priority":["1","2"],"status":["1","10"]}
		};
		this.oComponent.getModel("customerPageConfig").setProperty("/bcIncident/loadComplete",true);
		var oData = this.oComponent.getModel("oSNowCaseListModel").getData();
		this.stub($,"ajax").yieldsTo("success",oData);
		var oStub1 = this.stub(this.oCustomerDetail, "exportData");
		//Action
		this.oCustomerDetail.loadSnowCaseData(true, "snowCase", true);
		//Assertion
		assert.equal(oStub1.called,true);
	});

	QUnit.test("Load top 10 business down incident when click a customer", function (assert) {
		//Arrangment   
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.loadBusDownData(true, "businessDown", false);
		//Assertion
		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/businessDown/count"), 14);
	});
	QUnit.test("Load business down incident to download business down list", function (assert) {
		//Arrangment   
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		var oStub1 = this.stub(this.oCustomerDetail,"exportData");
		//Action
		this.oCustomerDetail.loadBusDownData(false, "businessDown", true);
		//Assertion
		assert.equal(oStub1.called, true);
	});
	QUnit.test("Load business down incident to when first time open the customer detail page", function (assert) {
		//Arrangment   
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		var oStub1 = this.stub(this.oCustomerDetail,"loadAllDataComplete");
		//Action
		this.oCustomerDetail.loadBusDownData(false, "bothTab", true);
		//Assertion
		assert.equal(oStub1.called, true);
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
		//Assertion
		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/businessDown/count"), 14);
	});
	QUnit.test("Load all BC*incidents when download incident list", function (assert) {
		//Arrangment   
		var oData = this.oIncidentListModel.getData();
		this.oComponent.getModel("customerPageConfig").setProperty("/snowCase/loadComplete",true);
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		var oStub = this.stub(this.oCustomerDetail,"exportData");
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadBcIncidentData(false, "bcIncident", true);
		//Assertion
		assert.equal(oStub.called, true);
	});
	
	QUnit.test("Load top 10 BC*incidents for incident tab", function (assert) {
		//Arrangment   
		var oData = this.oIncidentListModel.getData();
		this.oComponent.getModel("customerPageConfig").setProperty("/snowCase/loadComplete",true);
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		var oStub = this.stub(this.oComponent.getModel("customerPageConfig"),"setProperty");
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadBcIncidentData(true, "bcIncident", false);
		//Assertion
		assert.equal(oStub.called, true);
	});
	
	QUnit.test("Load top 10 BC*incidents when open the customerdetail page", function (assert) {
		//Arrangment   
		var oData = this.oIncidentListModel.getData();
		this.oComponent.getModel("customerPageConfig").setProperty("/snowCase/loadComplete",true);
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadBcIncidentData(true, "bothTab", false);
		//Assertion
		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/bcIncident/count"), 14);
		assert.equal(this.oCustomerDetail.oAll.count, 14);
	});

	QUnit.test("Load BC* incident data when press download button on all tab", function (assert) {
		//Arrangment   
		// this.oCustomerDetail.downLoadFlag =true;
		var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadBcIncidentData(false, "allTab", true);
		//Assertion

		assert.equal(oStub.called, true);
		// assert.equal(this.oCustomerDetail.oAll.count, 14);
	});

	QUnit.test("Load BC* incident data when press show more button on all tab", function (assert) {
		//Arrangment   
		this.oCustomerDetail.downLoadFlag = false;
		var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadBcIncidentData(false, "allTab", false);
		//Assertion

		assert.equal(oStub.called, true);
	});

	QUnit.test("should give error message when get oData service error on loading incident data", function (assert) {
		//Arrangment   
		var oStub = this.oStubMsgShow;
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("error", {});
		//Action
		this.oCustomerDetail.loadBcIncidentData(false, true, false);
		//Assertion
		assert.equal(oStub.called, true);
	});
	QUnit.test("Load all P1 incidents when click the 'show more' button on P1 incident tab ", function (assert) {
		//Arrangment 
		this.stub(this.oCustomerDetail, "loadSnowCaseData");
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
		//this.oCustomerDetail.loadBcIncidentData("incident", true, true);
		//Assertion
		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/bcIncident/count"), 14);
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
		// this.stub(this.oCustomerDetail, "loadRequestData");
		// this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");
		// this.stub(this.oCustomerDetail, "loadBcIncidentData");
		var oStub = this.stub(this.oCustomerDetail, "loadAllData");
		//Action
		this.oCustomerDetail.onShowMore(oEvent);
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("should load escalation case data when press download button on all tab", function (assert) {
		//Arrangment   
		this.oCustomerDetail.downLoadFlag = true;
		var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
		var oData = {
			"results": [{
				"caseid": "20000972"
			}]
		};
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadCaseData(false, false, true);
		//Assertion

		assert.equal(oStub.called, true);
	});

	QUnit.test("should load escalation case data when press show more button on all tab", function (assert) {
		//Arrangment   
		this.oCustomerDetail.downLoadFlag = false;
		var oStub = this.stub(this.oCustomerDetail, "loadAllDataComplete");
		var oData = this.oCaseListModel.getData();
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		this.oCustomerDetail.oAll = {
			"count": 0,
			"results": []
		};
		//Action
		this.oCustomerDetail.loadCaseData(false, true, false);
		//Assertion

		assert.equal(oStub.called, true);
	});

	QUnit.test("should give error message when load escalation case data and get oData service error", function (assert) {
		//Arrangment   
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("error", {});
		//Action
		this.oCustomerDetail.loadCaseData(false, true, false);
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
		this.stub(this.oCustomerDetail, "loadFavCustData");
		this.UserProfileModelCreate.withArgs("/Entries").yieldsTo("success", "");
		//Action
		this.oCustomerDetail.onSetFavorite();
		//Assertion
		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/_bFavorite"), true);
	});

	QUnit.test("Flag a customer unfavorite when 'Remove Favorite' button was pressed", function (assert) {
		//Arrangment  
		this.stub(this.oCustomerDetail, "loadFavCustData");
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
		// this.oCustomerDetail.iLoadCount = 4;
		// this.oCustomerDetail.downLoadFlag = false;
		// this.oCustomerDetail.topFlagAll = true;
		this.oComponent.getModel("customerPageConfig").setData({
			"all": {
				"loadBcIncident": true,
				"loadSnowCase": true,
				"loadSituation": true,
				"loadCase": true,
				"sBusDownloadComp": true,
				"results": []
			},
			"businessDown": {
				"loadComplete": true
			}
		});
		this.oCustomerDetail.oAll = {
			"results": [{
				"UpdateDate": 1
			}, {
				"UpdateDate": 2
			}]
		};
		//Action
		this.oCustomerDetail.loadAllDataComplete(true, false);
		//Assertion
		assert.equal(this.oComponent.getModel("customerPageConfig").getProperty("/all/results"), this.oCustomerDetail.oAll.results);
	});
	QUnit.test("Download all items on 'All' tab", function (assert) {
		//Arrangment  
		this.oComponent.getModel("customerPageConfig").setData({
			"all": {
				"loadBcIncident": true,
				"loadSnowCase": true,
				"loadSituation": true,
				"loadCase": true,
				"sBusDownloadComp": true,
				"results": []
			},
			"businessDown": {
				"loadComplete": true
			}
		});
		// this.oCustomerDetail.downLoadFlag = true;
		this.oCustomerDetail.oTabBar = new sap.m.Toolbar();
		this.oCustomerDetail.oAll = {
			"results": [{
				"UpdateDate": 1,
				"Update_sortby": 1
			}, {
				"UpdateDate": 2,
				"Update_sortby": 2
			}]
		};
		var oStub = this.stub(this.oCustomerDetail, "exportData");
		//Action
		this.oCustomerDetail.loadAllDataComplete(false, true);
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("should show all items and close control busy when click show more button under all tab", function (assert) {
		//Arrangment  
		this.oComponent.getModel("customerPageConfig").setData({
			"all": {
				"loadBcIncident": true,
				"loadSnowCase": true,
				"loadSituation": true,
				"loadCase": true,
				"sBusDownloadComp": true,
				"results": []
			},
			"businessDown": {
				"loadComplete": true
			}
		});
		// this.oCustomerDetail.downLoadFlag = false;
		// this.oCustomerDetail.topFlagAll = false;
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
		this.oCustomerDetail.loadAllDataComplete(false, false);
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("Download businessDown list when showMore button is invisible", function (assert) {
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
		var oCtrl = this.oCustomerDetail.getView().byId("caseToolbar");
		this.stub(oCtrl,"getVisible").returns(true);
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "case"
		});
		var oStub = this.stub(this.oCustomerDetail, "onCheckUserEscalationAuth");
		// var oData = this.oCaseListModel.getData();
		// this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.onDownload();
		//Assertion
		assert.equal(oStub.called, true);
	});
	QUnit.test("Download incident list when 'Download' button was pressed on incident tab", function (assert) {
		//Arrangment  
		var oCtrl = this.oCustomerDetail.getView().byId("incidentToolbar");
		this.stub(oCtrl,"getVisible").returns(true);
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "incident"
		});
		var oStub1 = this.stub(this.oCustomerDetail, "loadSnowCaseData");
		var oStub2 = this.stub(this.oCustomerDetail, "loadBcIncidentData");
		//Action
		this.oCustomerDetail.onDownload();
		//Assertion
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});
	QUnit.test("Download situstion list when 'Download' button was pressed on situation tab", function (assert) {
		//Arrangment  
		var oCtrl = this.oCustomerDetail.getView().byId("situationToolbar");
		this.stub(oCtrl,"getVisible").returns(true);
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "situation"
		});
		var oStub1 = this.stub(this.oCustomerDetail, "loadRequestData");
		// var oStub = this.stub(this.oCustomerDetail, "exportData");
		// this.oCustomerDetail.downLoadFlag = false;
		// var oData = this.oRequestListModel.getData();
		// this.Fsc2Read.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		//Action
		this.oCustomerDetail.onDownload();
		//Assertion
		assert.equal(oStub1.called, true);
	});
	QUnit.test("Download all list when 'Download' button was pressed on all tab", function (assert) {
		//Arrangment  
		var oCtrl = this.oCustomerDetail.getView().byId("allToolbar");
		this.stub(oCtrl,"getVisible").returns(true);
		this.oCustomerDetail.oTabBar = new sap.m.IconTabBar({
			"selectedKey": "all"
		});
		this.oCustomerDetail.getView().byId("allToolbar").setVisible(true);
		var oStub = this.stub(this.oCustomerDetail, "loadAllData");
		//Action
		this.oCustomerDetail.onDownload();
		//Assertion
		assert.equal(oStub.called, true);
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
		var oStub = this.stub(this.oCustomerDetail, "getDay");
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
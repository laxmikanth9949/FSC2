sap.ui.require([
	"sap/support/fsc2/controller/EscalationCaseDetail.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (EscalationCaseDetail, models, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";
	QUnit.module("EscalationCaseDetail", {
		beforeEach: function () {
			this.EscalationCaseDetail = new EscalationCaseDetail();
			this.oComponent = new ManagedObject();
			this.caseDetailModel = new JSONModel();
			this.oComponent.setModel(this.caseDetailModel, "caseDetail");
			this.oComponent.setModel(new JSONModel({
				"ShowFavorite": false
			}), "caseDetailPage");
			this.oComponent.setModel(new JSONModel(), "notes");
			sinon.stub(this.EscalationCaseDetail, "getOwnerComponent").returns(this.oComponent);
			this.caseDetailModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/CaseDetail.json"), {}, false);
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
			var oView = {
				setBusy: function (sId) {},
				byId: function (sId) {}
			};
			this.oControl = {
				getId: function () {},
				scrollToSection: function () {},
				setSelectedKey:function(){}
			};
			sinon.stub(this.EscalationCaseDetail, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);
			sinon.stub(this.EscalationCaseDetail, "eventUsage");
			this.oStubMsgShow = sinon.stub(sap.m.MessageToast,"show");
		},
		afterEach: function () {
			sap.m.MessageToast.show.restore();
			this.EscalationCaseDetail.destroy();
			this.EscalationCaseDetail.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});
	QUnit.test("Init model when entering the escalation case detail page", function (assert) {
		var sAttach = {
			attachPatternMatched: function () {}
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "getRoute").returns(sAttach);
		var oStubRouter = this.stub(this.EscalationCaseDetail, "getRouter").returns(router);

		//Action
		this.EscalationCaseDetail.onInit();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Load case set when click a global escalation case", function (assert) {
		//Arrangment  
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns({
			"id": "10000172"
		});
		var oData = this.caseDetailModel.getData();
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		this.EscalationCaseDetail.caseId = "10000172";
		//Action
		this.EscalationCaseDetail._onRouteMatched(oEvent);
		//Assertion
		assert.equal(this.oComponent.getModel("caseDetail").getData(), oData.results[0]);
	});

	QUnit.test("Load case set when click a global escalation case", function (assert) {
		//Arrangment  
		var oData = this.caseDetailModel.getData();
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		//Action
		this.EscalationCaseDetail.loadCaseDetailData(this.EscalationCaseDetail.caseId);
		//Assertion
		assert.equal(this.oComponent.getModel("caseDetail").getData(), oData.results[0]);
	});
	
	QUnit.test("should give error message when load case set and get oData serivice error", function (assert) {
		//Arrangment  
		var oStub = this.stub(this.EscalationCaseDetail,"showErrorMessage");
		this.Fsc2Read.withArgs("/CasesSet").yieldsTo("error", {});
		//Action
		this.EscalationCaseDetail.loadCaseDetailData(this.EscalationCaseDetail.caseId);
		//Assertion
		assert.equal(oStub.called,true);
	});
	
	QUnit.test("Flag an escalation case favorite when 'Set Favorite' button was pressed", function (assert) {
		//Arrangment  
		// var oData = this.caseDetailModel.getData();
		this.UserProfileModelCreate.withArgs("/Entries").yieldsTo("success", "");
		//Action
		this.EscalationCaseDetail.onSetFavorite();
		//Assertion
		assert.equal(this.oComponent.getModel("caseDetailPage").getProperty("/ShowFavorite"), true);
	});

	QUnit.test("Flag an escalation case unfavorite when 'Remove Favorite' button was pressed", function (assert) {
		//Arrangment  
		this.EscalationCaseDetail.caseId = "10014221";
		var oData = {
			"results": [{
				"Username": "",
				"Attribute": "FAVORITE_ESCALATION_REQUESTS",
				"Field": "1",
				"Value": "10014221",
				"Text": "10014221"
			}]
		};
		this.UserProfileModelRead.withArgs("/Entries").yieldsTo("success", oData);
		this.UserProfileModelRemove.withArgs("/Entries(Username='',Attribute='FAVORITE_ESCALATION_REQUESTS',Field='1')").yieldsTo("success",
			"");
		//Action
		this.EscalationCaseDetail.onRemoveFavorite();
		//Assertion
		assert.equal(this.oComponent.getModel("caseDetailPage").getProperty("/ShowFavorite"), false);
	});
	
	QUnit.test("should give error message when flag an escalation case unfavorite but get oData service error", function (assert) {
		//Arrangment  
		this.EscalationCaseDetail.caseId = "10014221";
		this.UserProfileModelRead.withArgs("/Entries").yieldsTo("error", {});
		//Action
		this.EscalationCaseDetail.onRemoveFavorite();
		//Assertion
		assert.equal(this.oStubMsgShow.called, true);
	});
});
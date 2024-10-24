sap.ui.require([
	"sap/support/fsc2/controller/CommentCIMReq.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (CommentCIMReq, models, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";
	QUnit.module("CommentCIMReq ", {
		beforeEach: function () {
			this.CommentCIMReq = new CommentCIMReq();
			this.oComponent = new ManagedObject();
			this.EntryModel = new JSONModel();
			this.oComponent.setModel(this.EntryModel, "EntryCollection");
			sinon.stub(this.CommentCIMReq, "getOwnerComponent").returns(this.oComponent);
			this.EntryModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/CIMRequestNotes.json"), {}, false);
			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
			});
			this.Fsc2Read = sinon.stub(sap.support.fsc2.FSC2Model, "read");
			this.Fsc2Update = sinon.stub(sap.support.fsc2.FSC2Model, "update");
			var oView = {
				setBusy: function (sId) {},
				byId: function (sId) {}
			};
			var oControl = {
				hide:function(){}
			};
			this.getView = sinon.stub(this.CommentCIMReq, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(oControl);
			this.CommentCIMReq.objectId = "0010252522";
			sinon.stub(this.CommentCIMReq, "eventUsage");
		},
		afterEach: function () {
			this.CommentCIMReq.destroy();
			this.CommentCIMReq.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});
	
	QUnit.test("Init when entering add notes page", function (assert) {
		var sAttach = {
			attachMatched: function () {}
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "getRoute").returns(sAttach);
		var oStubRouter = this.stub(this.CommentCIMReq, "getRouter").returns(router);

		//Action
		this.CommentCIMReq.onInit();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
	
	QUnit.test("Load CIM request notes when click the 'Add Notes' button", function (assert) {
		//Arrangment    
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns({
			"id": "0010252522"
		});
		var oData = this.EntryModel.getData();
		this.Fsc2Read.withArgs("/NotesSet").yieldsTo("success", oData);
		//Action
		this.CommentCIMReq._onRouteMatched(oEvent);
		//Assertion
		assert.equal(this.oComponent.getModel("EntryCollection").getProperty("/results").length, 6);
	});

	QUnit.test("should Load CIM request notes when pull the CommonCIMReq page", function (assert) {
		// var oStub = this.stub(this.CommentCIMReq, "loadNoteData");
		// // var sCallCount = 0;
		//Action
		this.CommentCIMReq.handleRefresh();
		assert.equal(this.getView.callCount, 1);
		
	});

});
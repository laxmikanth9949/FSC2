sap.ui.require([
	"sap/support/fsc2/controller/SaM.controller",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (SaM,ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";

	QUnit.module("SaMPage", {
		beforeEach: function () {
			this.oSaM = new SaM();
			this.oComponent = new ManagedObject();
			this.oComponent.setModel(new JSONModel({
				results:[
				{"index":0, "desc":"20191212,Thursday", "date":"20191212","weekDay":"Thursday","slotNum":"1","level1": true,"timeSlot":[]}
				]
			}), "SaMDateTree");
			sinon.stub(this.oSaM, "getOwnerComponent").returns(this.oComponent);
			this.oComponent.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/template/TimeZone.json")), "TimeZone");
			this.oComponent.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SaMdata.json")), "SaM");
			this.oComponent.setModel(new JSONModel({
				"TimeZone":"UTC"
			}),"homePageConfig");
			sinon.stub(this.oSaM, "onCloseInputSuggest");
			var oView = {
				setBusy: function () {},
				byId: function (sId) {},
				addDependent:function(){}
			};
			this.oControl = {
				setVisible: function () {},
				getSelectedKey: function () {},
				setBusy: function () {},
				setCurrentStep:function () {},
				setValidated:function(){},
				getValidated:function(){ return true;}
			};
			sinon.stub(this.oSaM, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);
			var oEventBus = {
				publish: function () {},
				subscribe: function () {}
			};
			sinon.stub(this.oSaM, "getEventBus").returns(oEventBus);
			sap.support.fsc2.oDataBCRequestModel = new ODataModel({
				json: true,
				serviceUrl: "bcp/odata/SID/SERVICE_REQUEST_SRV/"
			});
			this.oSaMRead = sinon.stub(sap.support.fsc2.oDataBCRequestModel, "read");
			this.oSaMCreate = sinon.stub(sap.support.fsc2.oDataBCRequestModel, "create");
			sap.support.fsc2.UserProfileModel = new ODataModel({
				json: true,
				useBatch: true,
				serviceUrl: "/sap/opu/odata/SVT/USER_PROFILE_SRV"
			});
			this.UserProfileCreate = sinon.stub(sap.support.fsc2.UserProfileModel, "create");
			this.oStubDialogOpen = sinon.stub(sap.m.Dialog.prototype, "open");
			this.oStubDialogClose = sinon.stub(sap.m.Dialog.prototype, "close");
		},
		afterEach: function () {
			sap.m.Dialog.prototype.open.restore();
			sap.m.Dialog.prototype.close.restore();
			this.oSaM.getOwnerComponent.restore();
			this.oSaM.destroy();
			this.oComponent.destroy();
		}
	});
	QUnit.test("Should initate all data model when open the SaM page ", function (assert) {
		var sAttach = {
			attachMatched: function () {}
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "getRoute").returns(sAttach);
		var oStubRouter = this.stub(this.oSaM, "getRouter").returns(router);
		this.oSaM.onInit();
		assert.equal(oStubRouter.callCount, 1);
	});
	
	QUnit.test("Should load all SaM related data based on incident number",function(assert){
		var oEvent = {
			getParameter:function(){
				return {"incident":"1234567899"};
			}
		};
		var oStub1 = this.stub(this.oSaM, "getUTCDateTime");
		var oStub2 = this.stub(this.oSaM, "loadDateHeaderSet");
		//action
		this.oSaM._onRouteMatched(oEvent);
		assert.equal(oStub1.callCount, 1);
		assert.equal(oStub2.callCount, 1);
	});
	
	QUnit.test("Should load available date based on incident number",function(assert){
		this.oSaM.sID = "1234567899";
		var oData = {
			results:[
				{"Date":"20191212","WeekDay":"Thursday","Count":"2"},
				{"Date":"20191213","WeekDay":"Friday","Count":"2"}
				]
		};
		this.oSaMRead.withArgs("/SaMDateHeaderSet").yieldsTo("success", oData);
		var oStub1 = this.stub(this.oSaM, "loadSlotOfDay");
		//action
		this.oSaM.loadDateHeaderSet();
		assert.equal(oStub1.callCount, 2);
	});
	
	QUnit.test("Should load available slots for available date",function(assert){
		this.oSaM.sID = "1234567899";
		this.oSaM.sLoadSlotComp = 0;
		this.oSaM.sLoadSlot = 1;
		this.oSaM.oDateTree = {
				results:[
				{"index":0, "desc":"20191212,Thursday", "date":"20191212","weekDay":"Thursday","slotNum":"1","level1": true,"timeSlot":[]}
				]
		};
		this.oSaM.sUTCDateTime ="20191212104800";
		var objDate = {"date":"20191212","index":"0","Count":"2"};
		var oData = {
			"results":[
				{"StartTime":"","TimeStamp":"20191212194800"}
				]
		};
		this.oSaMRead.withArgs("/SaMSlotsOfADaySet").yieldsTo("success", oData);

		//action
		this.oSaM.loadSlotOfDay(objDate);
		assert.equal(this.oComponent.getModel("SaMDateTree").getData().results[0].timeSlot.length,1);
	});
	
	QUnit.test("Should switch to display mode when click review button",function(assert){
		var oSaMModel = this.oComponent.getModel("SaM");
		// var oStub = this.stub(oSaMModel, "setProperty");
		//action
		this.oSaM.onReview();
		assert.propEqual(oSaMModel.getProperty("/bEdit"),true);
	});
	
	QUnit.test("Should navBack when click cancel button on edit mode",function(assert){
		var oStub = this.stub(this.oSaM, "onNavBack");
		//action
		this.oSaM.onCancel();
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("Should clear all data and back to step 1 when click cancel button on display mode",function(assert){
		var oStub = this.stub(this.oSaM, "onEditStep1");
		//action
		this.oSaM.onCancelSubmit();
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("Should navigate to corresponding step when click edit button on display mode",function(assert){
		var oCtrl = this.oSaM.getView().byId("ScheduleWizard");
		var oStub = this.stub(oCtrl, "setCurrentStep");
		//action
		this.oSaM.onEditStep1();
		this.oSaM.onEditStep2();
		this.oSaM.onEditStep3();
		this.oSaM.onEditStep4();
		assert.equal(oStub.callCount, 4);
	});
	
	QUnit.test("Should active or inactive the corresponding step when edit all SaM information",function(assert){
		var oCtrl1 = this.oSaM.getView().byId("Step1");
		var oCtrl2 = this.oSaM.getView().byId("Step2");
		var oCtrl3 = this.oSaM.getView().byId("Step3");
		//action
		this.oSaM.onActivateStep1();
		this.oSaM.onActivateStep2();
		this.oSaM.onActivateStep3();
		assert.propEqual(oCtrl1.getValidated, true);
		assert.propEqual(oCtrl2.getValidated, true);
		assert.propEqual(oCtrl3.getValidated, true);
	});
	
	QUnit.test("Should open Timezone dialog when click Time Zone field",function(assert){
		//action
		this.oSaM.onOpenDialog_TimeZone();
		assert.equal(this.oStubDialogOpen.callCount, 1);
	});
	
	QUnit.test("Should create once for Userperfile when select specific Time Zone",function(assert){
		var oEvent = {
			getSource:function(){
				return {
					getSelectedItem:function(){
						return {getBindingContext:function(){
							return {
								getObject:function(){
									return{
										"key":"UTC"
									};
								}
							};
						}
							
					};
				}
			};
		}
		};
		this.oSaM._oTimeZoneDialog = new sap.m.Dialog({});
		var oStub = this.stub(this.oSaM,"loadDateHeaderSet");
		//action
		this.oSaM.onSelectTimeZone(oEvent);
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("Should close Timezone dialog when click close button of Time Zone dialog",function(assert){
		//action
		this.oSaM._oTimeZoneDialog = new sap.m.Dialog({});
		this.oSaM.onCacelTimeZoneSelect();
		assert.equal(this.oStubDialogClose.callCount, 1);
	});
	
	QUnit.test("Should filter Timezone when search timzone with some words in Time Zone dialog",function(assert){
		var oEvent = {
			getSource:function(){
				return new sap.m.Input({value:"UTC"});
			}
		};
		var oCtrl = {getBinding:function(){
			return {filter:function(){}};
		}};
		var oStub = this.stub(sap.ui.core.Fragment,"byId").returns(oCtrl);
		//action
		this.oSaM.onSearchTimeZone(oEvent);
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("Should post data once to oDataBCRequestModel when click submit button",function(assert){
		this.oSaM.sID = "1234567899";
		var oData = {};
		var sResponse = {
			"headers":{
				"sap-message":""
			}
		};
		this.oSaMCreate.withArgs("/SaMBookingSet").yieldsTo("success", oData,sResponse);
		var oStub = this.stub(sap.m.MessageBox,"success");
		//action
		this.oSaM.onSubmit();
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("Should active step1 and show setp2 when select one timeslot",function(assert){
		var oEvent = {
			getSource:function(){
				return {
					getSelectedItem:function(){
						return {getBindingContext:function(){
							return {
								getObject:function(){
									return{
										"desc":"UTC",
										"time24H":""
									};
								},
								getPath:function(){
									return "/results/0/3";
								}
							};
						}
							
					};
				}
			};
		}
		};
		var oStub = this.stub(this.oSaM,"onActivateStep1");
		//action
		this.oSaM.onSelectDateTime(oEvent);
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("Should get current time with format yyyyMMddHHmmSS whencall function getUTCDateTime",function(assert){
		//action
		this.oSaM.getUTCDateTime();
		assert.equal(this.oSaM.sUTCDateTime.length, 14);
	});
	
	
});
sap.ui.require([
	"sap/support/fsc2/controller/IncidentDetail.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/core/mvc/View",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (IncidentDetail, model, View, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";

	QUnit.module("IncidentDetailPage", {
		beforeEach: function () {
			this.oIncidentDetail = new IncidentDetail();
			this.oDetailModel = new JSONModel();
			this.oComponent = new ManagedObject();
			this.oComponent.setModel(new JSONModel({
				"isRequest": true,
				"title": "",
				"Description": ""
			}), "incidentDetailPage");
			this.oComponent.setModel(new JSONModel({
				"enableSaM": true
			}), "homePageConfig");
			this.SaMDetailModel = new JSONModel();
			this.SaMDetailModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SaveSaMDetail.json"), {}, false);
			this.oComponent.setModel(this.SaMDetailModel, "SaMDetail");
			this.oComponent.setModel(new JSONModel({
				"enableCreate": false
			}), "SaMEnable");
			this.oComponent.setModel(this.oDetailModel, "incidentDetail");
			this.oComponent.setModel(new JSONModel(), "CIMRequest");
			this.oComponent.setModel(new JSONModel(), "Communication");
			this.favoriteIncidentsModel = new JSONModel();
			this.favoriteIncidentsModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/UserFavoriteIncident.json"), {}, false);
			this.oComponent.setModel(this.favoriteIncidentsModel, "favoriteIncidents");
			this.NoteListModel = new JSONModel();
			this.NoteListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/CIMRequestNotes.json"), {}, false);
			this.oComponent.setModel(this.NoteListModel, "NoteList");
			this.SNowCaseModel = new JSONModel();
			this.SNowCaseModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SNowCasesList.json"), {}, false);
			this.oComponent.setModel(this.SNowCaseModel, "SNowCaseModel");
			this.SaMBookingSetModel = new JSONModel();
			this.SaMBookingSetModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SaMBookingSet.json"), {}, false);
			sap.support.fsc2.IncidentModel = new ODataModel({
				json: true,
				serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
			});
			this.oIncidentRead = sinon.stub(sap.support.fsc2.IncidentModel, "read");

			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV",
				defaultUpdateMethod: "Put"
			});
			this.Fsc2Read = sinon.stub(sap.support.fsc2.FSC2Model, "read");
			this.Fsc2Update = sinon.stub(sap.support.fsc2.FSC2Model, "update");

			sap.support.fsc2.UserProfileModel = new ODataModel({
				json: true,
				useBatch: true,
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				serviceUrl: this.sICDest + "/svt/USER_PROFILE_SRV"
			});
			this.UserProfileModelRead = sinon.stub(sap.support.fsc2.UserProfileModel, "read");
			this.UserProfileModelCreate = sinon.stub(sap.support.fsc2.UserProfileModel, "create");
			this.UserProfileModelRemove = sinon.stub(sap.support.fsc2.UserProfileModel, "remove");
	
			sap.support.fsc2.oDataBCRequestModel = new ODataModel("/odata/SID/SERVICE_REQUEST_SRV/", {
					json: true,
					useBatch: false
				});
			this.SaMModelRead = sinon.stub(sap.support.fsc2.oDataBCRequestModel, "read");
			this.SaMModelCreate = sinon.stub(sap.support.fsc2.oDataBCRequestModel, "create");
			this.SaMModelRemove = sinon.stub(sap.support.fsc2.oDataBCRequestModel, "remove");
			this.SaMModelUpdate = sinon.stub(sap.support.fsc2.oDataBCRequestModel, "update");
			
			sinon.stub(this.oIncidentDetail, "getOwnerComponent").returns(this.oComponent);
			var oView = {
				setBusy: function () {},
				byId: function (sId) {},
				setModel: function () {}
			};
			this.oControl = {
				getId: function () {},
				scrollToSection: function () {},
				getHeaderTitle: function () {},
				setBusy: function () {},
				getValue: function () {},
				getSelectedKey:function(){},
				setSelectedKey:function(){},
				setVisible:function(){},
				setActive:function(){}
			};
			sinon.stub(this.oIncidentDetail, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);

			var oEventBus = {
				publish: function () {},
				subscribe: function () {}
			};
			sinon.stub(this.oIncidentDetail, "getEventBus").returns(oEventBus);
			sinon.stub(this.oIncidentDetail, "eventUsage");
			this.oStubMsgBoxError = sinon.stub(sap.m.MessageBox,"error");
			this.oStubMsgBoxInfo = sinon.stub(sap.m.MessageBox,"information");
			this.oStubMsgBoxWarn = sinon.stub(sap.m.MessageBox,"warning");
			this.oStubMsgShow = sinon.stub(sap.m.MessageToast,"show");
			this.oStubDialogOpen = sinon.stub(sap.m.Dialog.prototype, "open");
			this.oStubDialogClose = sinon.stub(sap.m.Dialog.prototype, "close");
		},
		afterEach: function () {
			sap.m.Dialog.prototype.open.restore();
			sap.m.Dialog.prototype.close.restore();
			sap.m.MessageBox.information.restore();
			sap.m.MessageToast.show.restore();
			sap.m.MessageBox.error.restore();
			sap.m.MessageBox.warning.restore();
			sap.support.fsc2.oDataBCRequestModel.destroy();
			this.oIncidentDetail.destroy();
			this.oIncidentDetail.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});
	QUnit.test("Init when entering incident detail page or cim request detail page", function (assert) {
		var sAttach = {
			attachPatternMatched: function () {}
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "getRoute").returns(sAttach);
		var oStubRouter = this.stub(this.oIncidentDetail, "getRouter").returns(router);

		//Action
		this.oIncidentDetail.onInit();
		//Assertion
		assert.equal(oStubRouter.callCount, 2);
	});
	QUnit.test("Display incidents detail when pattern is incident", function (assert) {
		//Arrangment
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns({
			"id": "002007974700008600812015",
			"flag": true,
			"sam":false
		});
		var temp = {
			setVisible: function () {
				return true;
			}
		};
		var obj = {
			getActions: function () {
				return [temp];
			}
		};
		this.stub(this.oControl, "getHeaderTitle").returns(obj);

		this.stub(this.oIncidentDetail, "loadIncidentData");
		this.stub(this.oIncidentDetail, "loadSummary");
		this.stub(this.oIncidentDetail, "markFavorite");
		this.stub(this.oIncidentDetail, "SamCheck");
		this.stub(this.oIncidentDetail, "loadSamDetail");
		// this.oIncidentDetailModel = new JSONModel();
		// this.oIncidentDetailModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentSet.json"), {}, false);

		//Action
		this.oIncidentDetail._onRouteMatched(oEvent);
		//Assertion

		assert.equal(this.oComponent.getModel("incidentDetailPage").getProperty("/isRequest"), false);
	});

	QUnit.test("Load BC*incidents detail data", function (assert) {
		//Arrangment
		this.oIncidentDetailModel = new JSONModel();
		this.oIncidentDetailModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentSet.json"), {}, false);

		var oData = this.oIncidentDetailModel.getData().__batchResponses[0].data;
		this.oIncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		//Action
		this.oIncidentDetail.loadIncidentData();
		//Assertion

		assert.equal(this.oComponent.getModel("incidentDetail").getProperty("/ID"), "0020079747 0000860081 2015");
	});
	
	QUnit.test("should give error message when load BC* incidents detail data but get oData service error", function (assert) {
		//Arrangment
		var oStub = this.stub(this.oIncidentDetail,"showErrorMessage");
		this.oIncidentRead.withArgs("/IncidentList").yieldsTo("error", {});
		//Action
		this.oIncidentDetail.loadIncidentData();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("Load snow case detail data when the latest details is stored in SNow now", function (assert) {
		//Arrangment
		this.oIncidentDetail.sID = "22222222222";
        var oStub1 = this.stub(this.oIncidentDetail,"loadSummary");
		var oData = this.SNowCaseModel.getData();
		this.stub($,"ajax").yieldsTo("success", oData);
		//Action
		this.oIncidentDetail.loadSnowCaseData("22222222222");
		//Assertion
		assert.equal(oStub1.called, true);
	});
	
	QUnit.test("should check the SaM availability for the incident", function (assert) {
		//Arrangment
		var sData= {"SaMFlag":"X"};
        var oStub1 = this.stub(this.oComponent.getModel("SaMEnable"),"setProperty");
		this.SaMModelRead.yieldsTo("success", sData);
		//Action
		this.oIncidentDetail.SamCheck("22222222222");
		//Assertion
		assert.equal(oStub1.called, true);
	});
	
	QUnit.test("should load SaM detail information according to incident number when run function loadSamDetail", function (assert) {
		//Arrangment
		this.oIncidentDetail.sID = "22222222222";
		var sData= this.SaMBookingSetModel.getData();
        var oStub1 = this.stub(this.oComponent.getModel("SaMDetail"),"setProperty");
		this.SaMModelRead.yieldsTo("success", sData);
		//Action
		this.oIncidentDetail.loadSamDetail();
		//Assertion
		assert.equal(oStub1.callCount, 2);
	});
	
	QUnit.test("Load incident 'Summary' data", function (assert) {
		//Arrangment
		this.oLongTextModel = new JSONModel();
		this.oLongTextModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentLongText.json"), {}, false);

		var oData = this.oLongTextModel.getData();
		this.oIncidentRead.withArgs("/LongText").yieldsTo("success", oData);
		//Action
		this.oIncidentDetail.loadSummary();
		//Assertion

		assert.equal(this.oComponent.getModel("Communication").getData().results.length, 6);
	});

	QUnit.test("Mark the incident favorite flag when the incident is in FAVORITE_INCIDENTS list ", function (assert) {
		//Arrangment
		this.oIncidentDetail.sID = "002007974700008600812015";
		//Action
		this.oIncidentDetail.markFavorite();
		//Assertion

		assert.equal(this.oComponent.getModel("incidentDetailPage").getProperty("/ShowFavorite"), true);
	});
	
	QUnit.test("should wait util model favoriteIncidents load completed when mark the incident favorite flag", function (assert) {
		//Arrangment
		this.oComponent.getModel("favoriteIncidents").setData();
		var oStub = this.stub(window,"setTimeout");
		// this.oIncidentDetail.sID = "002007974700008600812015";
		//Action
		this.oIncidentDetail.markFavorite();
		//Assertion

		assert.equal(oStub.called, true);
	});

	QUnit.test("Display CIM Request detail when pattern is requestDetail", function (assert) {
		//Arrangment
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns({
			"id": "002007974700008600812015",
			"flag": true,
			"sam":false
		});
		var temp = {
			setVisible: function () {
				return false;
			}
		};
		var obj = {
			getActions: function () {
				return [temp];
			}
		};
		this.stub(this.oControl, "getHeaderTitle").returns(obj);
		this.stub(this.oIncidentDetail, "loadIncidentData");
		this.stub(this.oIncidentDetail, "loadSummary");
		this.stub(this.oIncidentDetail, "markFavorite");
		//Action
		this.oIncidentDetail._onRouteRequestMatched(oEvent);
		//Assertion
		assert.equal(this.oComponent.getModel("incidentDetailPage").getProperty("/isRequest"), true);
	});

	function formatTimeTestCase(oOptions) {
		var sState = this.oIncidentDetail.formatTime(oOptions.sTime);
		oOptions.assert.propEqual(sState, oOptions.expected, "The result was correct");
	}

	QUnit.test("Should return exact time", function (assert) {
		formatTimeTestCase.call(this, {
			assert: assert,
			sTime: "13.12.2018.13 10:36:53",
			expected: new Date(1544697413000)
		});
	});

	QUnit.test("Load notes data of cim request", function (assert) {
		//Arrangment
		var oData = this.NoteListModel.getData();
		this.Fsc2Read.withArgs("/NotesSet").yieldsTo("success", oData);
		//Action
		this.oIncidentDetail.objectId = '0010252522';
		this.oIncidentDetail.loadNoteData();
		//Assertion

		assert.equal(this.oComponent.getModel("NoteList").getProperty("/results"), oData.results);
	});
	
	QUnit.test("should give error message when load notes data of cim request and get oData service error", function (assert) {
		//Arrangment
		var oStub = this.stub(this.oIncidentDetail,"showErrorMessage");
		this.Fsc2Read.withArgs("/NotesSet").yieldsTo("error", {});
		//Action
		this.oIncidentDetail.objectId = '0010252522';
		this.oIncidentDetail.loadNoteData();
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("Flag a CIM Request favorite when 'Set Favorite' button was pressed", function (assert) {
		//Arrangment  
		this.oIncidentDetail.getModel("incidentDetailPage").setProperty("/isRequest", true);
		this.UserProfileModelCreate.withArgs("/Entries").yieldsTo("success", "");
		sinon.stub(this.oIncidentDetail, "loadReqeustData");
		this.stub(this.oIncidentDetail,"loadFavCustData");
		//Action
		this.oIncidentDetail.onSetFavorite();
		//Assertion
		assert.equal(this.oComponent.getModel("incidentDetailPage").getProperty("/ShowFavorite"), true);
	});

	QUnit.test("Flag an Incident favorite when 'Set Favorite' button was pressed", function (assert) {
		//Arrangment  
		this.oComponent.getModel("incidentDetailPage").setProperty("/isRequest", false);
		this.UserProfileModelCreate.withArgs("/Entries").yieldsTo("success", "");
		this.stub(this.oIncidentDetail,"loadFavCustData");
		this.stub(this.oIncidentDetail,"refreshFavoriteIncidentsModel");
		//Action
		this.oIncidentDetail.onSetFavorite();
		//Assertion
		assert.equal(this.oComponent.getModel("incidentDetailPage").getProperty("/ShowFavorite"), true);
	});
	QUnit.test("Flag a CIM Request unfavorite when 'Remove Favorite' button was pressed", function (assert) {
		//Arrangment  
		this.oIncidentDetail.getModel("incidentDetailPage").setProperty("/isRequest", true);
		this.oIncidentDetail.getModel("CIMRequest").setProperty("/field", "0001");
		this.UserProfileModelRemove.withArgs("/Entries(Username='',Attribute='FAVORITE_CIM_REQUESTS',Field='0001')").yieldsTo("success",
			"");
		//Action
		this.stub(this.oIncidentDetail,"loadFavCustData");
		this.oIncidentDetail.onRemoveFavorite();
		//Assertion
		assert.equal(this.oComponent.getModel("incidentDetailPage").getProperty("/ShowFavorite"), false);
	});

	QUnit.test("Flag a incident unfavorite when 'Remove Favorite' button was pressed", function (assert) {
		//Arrangment  
		this.oIncidentDetail.getModel("incidentDetailPage").setProperty("/isRequest", false);
		var oData = this.favoriteIncidentsModel.getData();
		this.UserProfileModelRead.withArgs("/Entries").yieldsTo("success", oData);
		this.oIncidentDetail.sID = "002007974700008600812015";
		this.UserProfileModelRemove.withArgs("/Entries(Username='',Attribute='FAVORITE_INCIDENTS',Field='1')").yieldsTo("success",
			"");
		this.stub(this.oIncidentDetail, "refreshFavoriteIncidentsModel");
		this.stub(this.oIncidentDetail,"loadFavCustData");
		//Action
		this.oIncidentDetail.onRemoveFavorite();
		//Assertion
		assert.equal(this.oComponent.getModel("incidentDetailPage").getProperty("/ShowFavorite"), false);
	});
	
	QUnit.test("should open Budiness Impact dialog when press edit button related to business dialog", function (assert) {
		//Arrangment 
		this.stub(this.oIncidentDetail,"getResourceBundle").returns({
			getText: function(){
				return "i18ntext" ;
			}
		});
		this.stub(this.oIncidentDetail,"onBusImpactPress");
		//Action
		this.oIncidentDetail.onOpenBusImpactDialog();
		this.oIncidentDetail.oDialog.getButtons()[0].firePress();
		this.oIncidentDetail.oDialog.getButtons()[1].firePress();
		//Assertion
		assert.equal(this.oStubDialogOpen.called, true);
	});
	
	QUnit.test("Update business impact when click the 'save' button ", function (assert) {
		//Arrangment  
		this.oIncidentDetail.oTextArea = new sap.m.TextArea({"value":"test"});
		this.oIncidentDetail.objectId = '0010252522';
		this.Fsc2Update.yieldsTo("success", "");
		this.stub(this.oIncidentDetail,"loadReqeustData");
		//Action
		this.oIncidentDetail.onBusImpactPress();
		//Assertion
		assert.equal(this.Fsc2Update.callCount, 1);
	});
	QUnit.test("Save category when click 'save' button ", function (assert) {
		//Arrangment  
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(new sap.m.Button()); 
		this.oIncidentDetail.objectId = '0010252522';
		this.byId.withArgs("idCategorySelect1").returns(this.oControl);
		this.Fsc2Update.yieldsTo("success", "");
		this.stub(this.oIncidentDetail,"loadReqeustData");
		//Action
		this.oIncidentDetail.onSaveCategoryButtonPress(oEvent);
		//Assertion
		assert.equal(this.Fsc2Update.callCount, 1);
	});
	QUnit.test("Save category when click 'save' button ", function (assert) {
		//Arrangment  
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(new sap.m.Button()); 
		this.oIncidentDetail.objectId = '0010252522';
		this.byId.withArgs("idCategorySelect1").returns(this.oControl);
		this.Fsc2Update.yieldsTo("success", "");
		this.stub(this.oIncidentDetail,"loadReqeustData");
		//Action
		this.oIncidentDetail.onSaveCategoryButtonPress(oEvent);
		//Assertion
		assert.equal(this.Fsc2Update.callCount, 1);
	});
	QUnit.test("should give error message when save category and get oData service error ", function (assert) {
		//Arrangment  
		var oStub = this.stub(this.oIncidentDetail,"showErrorMessage");
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(new sap.m.Button()); 
		this.oIncidentDetail.objectId = '0010252522';
		this.byId.withArgs("idCategorySelect1").returns(this.oControl);
		this.Fsc2Update.yieldsTo("error", "");
		this.stub(this.oIncidentDetail,"loadReqeustData");
		//Action
		this.oIncidentDetail.onSaveCategoryButtonPress(oEvent);
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("Nav to create Request page when click 'Escalation' button and CIM_ID is null", function (assert) {
		//Arrangment  
		this.oComponent.getModel("incidentDetail").setData({"CIM_ID":""});
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oIncidentDetail, "getRouter").returns(router);
		//Action
		this.oIncidentDetail.onEscalateIncident();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
	
	QUnit.test("should give information to notify user when click 'Escalation' button and a CIM request already exists", function (assert) {
		//Arrangment  
		this.oComponent.getModel("incidentDetail").setData({"CIM_ID":"123456"});
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oIncidentDetail, "getRouter").returns(router);
		this.oStubMsgBoxInfo.yieldsTo("onClose","");
		//Action
		this.oIncidentDetail.onEscalateIncident();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
	
	QUnit.test("Nav to add notes page when click 'add' button on CIM request detail", function (assert) {
		//Arrangment  
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oIncidentDetail, "getRouter").returns(router);
		//Action
		this.oIncidentDetail.onAddNotes();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});

	QUnit.test("should nav to homepage when run function onNavHomeCreate", function (assert) {
		//Arrangment  
		var oStub1 = this.stub(this.oIncidentDetail, "onNavHome");
		var oStub2 = this.stub(this.oIncidentDetail, "onGiveUpCreateCritical");
		//Action
		this.oIncidentDetail.onNavHomeCreate();
		//Assertion
		assert.equal(oStub1.callCount, 1);
		assert.equal(oStub2.callCount, 1);
	});

	QUnit.test("should change upload url for upload collection and trigger upload when select a file from control Collection", function (assert) {
		//Arrangment  
		var oCtrl = {
			setUploadUrl: function(){},
			upload:function(){}
		};
		var oEvent = {
			getSource: function(){
				return oCtrl;
			}
		};
		this.oIncidentDetail.objectId = "XXXXX";
		var oStub1 = sinon.stub(oCtrl, "setUploadUrl");
		var oStub2 = sinon.stub(oCtrl, "upload");
		//Action
		this.oIncidentDetail.onChange(oEvent);
		//Assertion
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});
	
	QUnit.test("should addHeaderParameter when before upload a file from upload collection", function (assert) {
		//Arrangment  
		var oCtrl = {
			addHeaderParameter:function(){}
		};
		var oEvent = {
			getParameters: function(){
				return oCtrl;
			},
			getParameter: function(){
				return "fileName";
			}
		};
		var oPara = oEvent.getParameters();
		var oStub = sinon.stub(oPara, "addHeaderParameter");
		this.oIncidentDetail.objectId = "XXXXX";
		//Action
		this.oIncidentDetail.onBeforeUploadStarts(oEvent);
		//Assertion
		assert.equal(oStub.called, true);
	});


QUnit.test("should run function  loadReqeustData when upload a file completed", function (assert) {
		//Arrangment  
		var oStub = this.stub(this.oIncidentDetail, "loadReqeustData");
		//Action
		this.oIncidentDetail.onUploadComplete();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("should give warning message when upload a file  bigger than max size", function (assert) {
		//Action
		this.oIncidentDetail.onFileSizeExceed();
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});
	QUnit.test("should give warning message when upload a file that name is too long", function (assert) {
		//Action
		this.oIncidentDetail.onFileNameExceed();
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});
	QUnit.test("should navigate to SaM detail page when call function onNavToSaM", function (assert) {
		//Action
		this.oIncidentDetail.sID = "22222222222";
		var oStubRouter = this.stub(this.oIncidentDetail, "getRouter").returns({
				navTo: function () {}
			});
		this.oIncidentDetail.onNavToSaM();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
	
	QUnit.test("should open a url to download calendar file when call function onAddToCalendar", function (assert) {
		//Action
		this.oIncidentDetail.sID = "22222222222";
		var oStub = this.stub(window, "open");
		this.oIncidentDetail.onAddToCalendar();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	QUnit.test("should switch the SaM detail page from display to edit mode when call function onEditSAMContact", function (assert) {
		//Action
		var oStub = this.stub(this.oComponent.getModel("SaMDetail"), "setProperty");
		this.oIncidentDetail.onEditSAMContact();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	QUnit.test("should update changed SaM details when call function onSaveSaMContact", function (assert) {
		//Action
		var oData = {};
		var sResponse = {
			"headers":{
				"sap-message":"{\"code\":\"\",\"message\":\"No SaM booking found - cannot update it\",\"severity\":\"\",\"target\":\"\",\"details\":[]}"
			}
		};
		this.SaMModelUpdate.yieldsTo("success",oData,sResponse);
		this.oIncidentDetail.onSaveSaMContact();
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});
	QUnit.test("should switch the SaM detail page from edit to display mode when call function onCancelSaMContact", function (assert) {
		//Action
		var oStub = this.stub(this.oComponent.getModel("SaMDetail"), "setProperty");
		this.oIncidentDetail.onCancelSaMContact();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("should updatethe SaM data to delete status when call function onCancelSamSession", function (assert) {
		//Action
		this.oStubMsgBoxWarn.yieldsTo("onClose","YES");
		var oData ={};
		var sResponse = {
			"headers":{
				"sap-message":"{\"code\":\"\",\"message\":\"No SaM booking found - cannot update it\",\"severity\":\"\",\"target\":\"\",\"details\":[]}"
			}
		};
		this.SaMModelUpdate.yieldsTo("success",oData,sResponse);
		this.oIncidentDetail.onCancelSamSession();
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});
	QUnit.test("should format business impact according to the incident from when call function formatSNow_BusImpact", function (assert) {
		//Action
		var sMsg1 = this.oIncidentDetail.formatSNow_BusImpact("<p>business impact description</p>","CS222222222");
		var sMsg2 = this.oIncidentDetail.formatSNow_BusImpact("business impact description","");
		//Assertion
		assert.equal(sMsg1, "<p>business impact description</p>");
		assert.equal(sMsg2, "<div></div>");
	});
});
sap.ui.require([
	"sap/support/fsc2/controller/MCCDetail.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (MCCDetail, models, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";
	QUnit.module("MCCDetailPage", {
		beforeEach: function () {
			this.oMCCDetail = new MCCDetail();
			this.oComponent = new ManagedObject();
			this.oComponent.setModel(new JSONModel({
				"display": true,
				"edit": false,
				"_bFavorite": false,
				"_bShowCaseIcon": false
			}), "MCCPageConfig");
			this.MCCDetailModel = new JSONModel();
			this.MCCDetailModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/FSC2ActivitySet.json"), {}, false);
			this.oComponent.setModel(this.MCCDetailModel, "MCCDetail");

			this.NoteListModel = new JSONModel();
			this.NoteListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/NotesSet.json"), {}, false);
			this.oComponent.setModel(this.NoteListModel, "NoteList");

			this.RegionListModel = new JSONModel();
			this.RegionListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SettingSet_SERVICETEAM.json"), {}, false);
			this.oComponent.setModel(this.RegionListModel, "RegionList");

			this.StatusListModel = new JSONModel();
			this.StatusListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SettingSet_STATUS.json"), {}, false);
			this.oComponent.setModel(this.StatusListModel, "StatusList");

			this.CategoryListModel = new JSONModel();
			this.CategoryListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SettingSet_CATEGORY.json"), {}, false);
			this.oComponent.setModel(this.CategoryListModel, "CategoryList");

			this.RatingListModel = new JSONModel();
			this.RatingListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SettingSet_RATING.json"), {}, false);
			this.oComponent.setModel(this.RatingListModel, "RatingList");

			this.PriorityListModel = new JSONModel();
			this.PriorityListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SettingSet_PRIORITY.json"), {}, false);
			this.oComponent.setModel(this.PriorityListModel, "PriorityList");

			this.oComponent.setModel(new JSONModel({
				"RegionList": {},
				"StatusList": {},
				"CategoryList": {},
				"RatingList": {},
				"PriorityList": {}
			}), "MCCSettings");
			this.oComponent.setModel(new JSONModel(), "DetailEdit");

			this.oComponent.setModel(new JSONModel({
				"isPhone": false
			}), "device");

			sinon.stub(this.oMCCDetail, "getOwnerComponent").returns(this.oComponent);
			var oView = {
				setBusy: function () {},
				byId: function (sId) {},
				setModel: function () {},
				getModel: function () {},
				addDependent :function () {}
			};
			this.oControl = {
				setVisible: function () {},
				scrollToSection: function () {},
				getValue: function () {},
				getId: function () {},
				setSelectedKey: function () {},
				setEnabled: function () {},
				setPlaceholder: function () {},
				getModel: function (sModel) {},
				removeAllItems: function () {},
				addItem: function () {},
				getData: function () {},
				setValue: function () {},
				setSrc: function () {},
				back:  function () {}
			};
			this.oView = sinon.stub(this.oMCCDetail, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);

			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV",
				defaultUpdateMethod: "Put"
			});
			this.Fsc2Read = sinon.stub(sap.support.fsc2.FSC2Model, "read");
			this.Fsc2Update = sinon.stub(sap.support.fsc2.FSC2Model, "update");

			sap.support.fsc2.UserProfileModel = new ODataModel({
				json: true,
				useBatch: true,
				serviceUrl:"sap/opu/odata/SVT/USER_PROFILE_SRV"
			});
			this.UserProfileModelCreate = sinon.stub(sap.support.fsc2.UserProfileModel, "create");
			this.UserProfileModelRemove = sinon.stub(sap.support.fsc2.UserProfileModel, "remove");

			var oEventBus = {
				publish: function () {},
				subscribe: function () {}
			};
			sinon.stub(this.oMCCDetail, "getEventBus").returns(oEventBus);
			sinon.stub(this.oMCCDetail, "getResourceBundle").returns({
				getText:function(){
					return "i18n text";
				}
			});

			this.oComponent.bFlag1 = false;
			this.oComponent.bFlag2 = false;
			sinon.stub(this.oMCCDetail, "eventUsage");
			this.oStubMsgBoxError = sinon.stub(sap.m.MessageBox,"error");
			this.oStubMsgBoxCfm = sinon.stub(sap.m.MessageBox,"confirm");
			this.oStubMsgShow = sinon.stub(sap.m.MessageToast,"show");
		},
		afterEach: function () {
			// sap.ui.xmlfragment.prototype.openBy.restore();
			sap.m.MessageBox.error.restore();
			sap.m.MessageBox.confirm.restore();
			sap.m.MessageToast.show.restore();
			this.NoteListModel.destroy();
			this.MCCDetailModel.destroy();
			this.RegionListModel.destroy();
			this.StatusListModel.destroy();
			this.CategoryListModel.destroy();
			this.RatingListModel.destroy();
			this.PriorityListModel.destroy();
			sap.support.fsc2.UserProfileModel.destroy();
			sap.support.fsc2.FSC2Model.destroy();
			this.oMCCDetail.getOwnerComponent.restore();
			this.oMCCDetail.destroy();
			this.oComponent.destroy();
		}
	});
	QUnit.test("Init model when entering MCC Activity detail page", function (assert) {
		var sAttach = {
			attachPatternMatched: function () {}
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "getRoute").returns(sAttach);
		var oStubRouter = this.stub(this.oMCCDetail, "getRouter").returns(router);
		sinon.stub(this.oMCCDetail, "_setImageSRC");
		sinon.stub(this.oMCCDetail, "loadSettingsData");
		//Action
		this.oMCCDetail.onInit();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});

	QUnit.test("Display mcc activity detail when pattern is mccDetail", function (assert) {
		//Arrangment
		var oEvent = new sap.ui.base.Event();
		this.byId.withArgs("idMCCNav").returns(new sap.m.NavContainer());
		this.byId.withArgs("idNotePage").returns(new sap.m.Page());
		this.stub(oEvent, "getParameter").returns({
			"activity_id": "230559"
		});
		var oStub1 = sinon.stub(this.oMCCDetail, "loadDetailData");
		var oStub2 = sinon.stub(this.oMCCDetail, "loadNoteData");
		//Action
		this.oMCCDetail._onRouteMatched(oEvent);

		//Assertion
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});
	
	QUnit.test("should give error message when load mcc activity detail and get some error message from back end ", function (assert) {
		//Arrangment
		var oData = this.MCCDetailModel.getData();
		oData.results[0].activity_change_date = new Date(1550793600000);
		oData.results[0].activity_create_date = new Date(1550793600000);
		var oResopnse = {
			"headers": {
				"sap-message": '{"message":"error message"}'
			}
		};
		// sinon.stub(this.oMCCDetail, "_setImageSRC");
		this.Fsc2Read.withArgs("/FSC2ActivitySet").yieldsTo("success", oData, oResopnse);

		//Action
		this.oMCCDetail.loadDetailData();

		//Assertion
		assert.equal(this.oStubMsgBoxError.callCount, 1);
	});
	
	QUnit.test("should give error message when load mcc activity detail and get oData service error ", function (assert) {
		//Arrangment
		this.oMCCDetail.bFlag2 =true;
		this.Fsc2Read.withArgs("/FSC2ActivitySet").yieldsTo("error", "");
		//Action
		this.oMCCDetail.loadDetailData();
		//Assertion
		assert.equal(this.oStubMsgShow.called, true);
	});
	
	QUnit.test("Load MCC detail data when click a mcc activity ", function (assert) {
		//Arrangment
		this.oMCCDetail.bFlag2 =true;
		var oData = this.MCCDetailModel.getData();
		oData.results[0].activity_change_date = new Date(1550793600000);
		oData.results[0].activity_create_date = new Date(1550793600000);
		var oResopnse = {
			"headers": {
				"sap-message": undefined
			}
		};
		// sinon.stub(this.oMCCDetail, "_setImageSRC");
		this.Fsc2Read.withArgs("/FSC2ActivitySet").yieldsTo("success", oData, oResopnse);

		//Action
		this.oMCCDetail.loadDetailData();

		//Assertion
		assert.propEqual(this.oComponent.getModel("MCCPageConfig").getProperty("/_bFavorite"), true);
	});
	QUnit.test("Redirect to case when case link was clicked", function (assert) {
		//Arrangment   
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(new sap.m.Link({
			"text": "123456"
		}));
		this.stub(this.oMCCDetail, "getSystem");
		var oStub = this.stub(sap.m.URLHelper, "redirect");
		//Action
		this.oMCCDetail.onLinkCaseId(oEvent);

		//Assertion
		assert.deepEqual(oStub.called, true);
	});
	QUnit.test("Redirect to activity when activity link was clicked", function (assert) {
		//Arrangment   
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(new sap.m.Link({
			"text": "123456"
		}));
		this.stub(this.oMCCDetail, "getSystem");
		var oStub = this.stub(sap.m.URLHelper, "redirect");
		//Action
		this.oMCCDetail.onLinkActivityId(oEvent);

		//Assertion
		assert.deepEqual(oStub.called, true);
	});
	QUnit.test("Set image src", function (assert) {
		//Arrangment   
		var oView = this.oMCCDetail.getView();
		var oStub = this.stub(oView,"setModel");
		//Action
		this.oMCCDetail._setImageSRC();
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("Load Notes data when click a mcc activity ", function (assert) {
		//Arrangment  
		this.oMCCDetail.bFlag2 = true;
		var oData = this.NoteListModel.getData();
		this.Fsc2Read.withArgs("/NotesSet").yieldsTo("success", oData);

		//Action
		this.oMCCDetail.loadNoteData();
		//Assertion
		assert.deepEqual(this.oComponent.getModel("NoteList").getData(), oData);
	});
	
	QUnit.test("should give error message when load Notes data for a mcc activity and get oData service error", function (assert) {
		//Arrangment  
		this.oMCCDetail.bFlag2 = true;
		this.Fsc2Read.withArgs("/NotesSet").yieldsTo("error", {});
		//Action
		this.oMCCDetail.loadNoteData();
		//Assertion
		assert.equal(this.oStubMsgShow.called, true);
	});

	QUnit.test("Load region data when click a mcc activity ", function (assert) {
		//Arrangment   
		var oData = this.RegionListModel.getData();
		var oStub = this.Fsc2Read.withArgs("/SettingSet").yieldsTo("success", oData);
		sinon.stub(this.oMCCDetail, "groupServiceTeam");

		//Action
		this.oMCCDetail.loadSettingsData();

		//Assertion
		assert.equal(oStub.callCount, 5);
	});
	// QUnit.test("Load status data when click a mcc activity ", function (assert) {
	// 	//Arrangment   
	// 	var oData = this.StatusListModel.getData();
	// 	this.Fsc2Read.withArgs("/SettingSet").yieldsTo("success", oData);

	// 	//Action
	// 	this.oMCCDetail.loadSettingsData();

	// 	//Assertion
	// 	assert.deepEqual(this.Fsc2Read.called, true);
	// });
	// QUnit.test("Load category data when click a mcc activity ", function (assert) {
	// 	//Arrangment   
	// 	var oData = this.CategoryListModel.getData();
	// 	this.Fsc2Read.withArgs("/SettingSet").yieldsTo("success", oData);

	// 	//Action
	// 	this.oMCCDetail.loadSettingsData();

	// 	//Assertion
	// 	assert.deepEqual(this.oComponent.getModel("MCCSettings").getProperty("/CategoryList"), oData.results);
	// });
	// QUnit.test("Load rating data when click a mcc activity ", function (assert) {
	// 	//Arrangment   
	// 	var oData = this.RatingListModel.getData();
	// 	this.Fsc2Read.withArgs("/SettingSet").yieldsTo("success", oData);

	// 	//Action
	// 	this.oMCCDetail.loadSettingsData();

	// 	//Assertion
	// 	assert.deepEqual(this.oComponent.getModel("MCCSettings").getProperty("/RatingList"), oData.results);
	// });
	// QUnit.test("Load priority data when click a mcc activity ", function (assert) {
	// 	//Arrangment   
	// 	var oData = this.PriorityListModel.getData();
	// 	this.Fsc2Read.withArgs("/SettingSet").yieldsTo("success", oData);

	// 	//Action
	// 	this.oMCCDetail.loadSettingsData();

	// 	//Assertion
	// 	assert.deepEqual(this.oComponent.getModel("MCCSettings").getProperty("/RatingList"), oData.results);
	// });
	
	QUnit.test("should give error message when load rating data and get oData service error ", function (assert) {
		//Arrangment   
		this.Fsc2Read.withArgs("/SettingSet").yieldsTo("error", "");
		//Action
		this.oMCCDetail.loadSettingsData();

		//Assertion
		assert.deepEqual(this.oStubMsgShow.called, true);
	});
	
	QUnit.test("Nav to add note page when click add button", function (assert) {
		//Arrangment  
		this.oMCCDetail.oTextArea = new sap.m.TextArea({
			"id": "idTextArea",
			"value": "test"
		});
		// this.stub(this.oMCCDetail.oTextArea, "setValue");
		this.byId.withArgs("idMCCNav").returns(new sap.m.NavContainer());
		var oCtrl =this.byId("idMCCNav");
		this.byId.withArgs("idNotePage").returns(new sap.m.Page());
		var oStub = this.stub(oCtrl,"to");

		//Action
		this.oMCCDetail.onAddNotes();

		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("should enable / disable save and send to mcc button when note is non empty/empty", function (assert) {
		//Arrangment  
		var oEvent = {
			getSource:function(){
				return new sap.m.TextArea({value:"note test"});
			}
		};
		var oCtrl  = this.byId("saveNoteBtn");
		var oStub = this.stub(oCtrl,"setEnabled");
		//Action
		this.oMCCDetail.onNoteChange(oEvent);

		//Assertion
		assert.equal(oStub.called, true);
	});
	
	QUnit.test("should nav back to MCC detail page when cancel add note", function (assert) {
		//Arrangment  
		var oCtrl  = this.byId("idMCCNav");
		var oStub = this.stub(oCtrl,"back");
		//Action
		this.oMCCDetail.onCancelNote();

		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("should save note and sent to mcc when click save and send to mcc button", function (assert) {
		//Arrangment  
		this.oMCCDetail.oTextArea = new sap.m.TextArea({
			"value": "test"
		});
		//Action
		this.oMCCDetail.onSaveNoteAndSendMCC();

		//Assertion
		assert.equal(this.Fsc2Update.callCount, 1);
	});
	
	QUnit.test("should save note when click save button", function (assert) {
		//Arrangment  
		this.oMCCDetail.oTextArea = new sap.m.TextArea({
			"value": "test"
		});
		var oStub = this.stub(this.oMCCDetail,"updateActivityNote");
		//Action
		this.oMCCDetail.onSaveNote();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("should save note and close the activity when click close button on note dialog", function (assert) {
		//Arrangment  
		this.oMCCDetail.oTextArea = new sap.m.TextArea({
			"value": "test"
		});
		this.oStubMsgBoxCfm.yieldsTo("onClose","OK");
		this.oMCCDetail.oTextArea = new sap.m.TextArea({value:"note test"});
		var oStub = this.stub(this.oMCCDetail,"updateActivityNote");
		//Action
		this.oMCCDetail.onSaveNoteAndClose();
		//Assertion
		assert.equal(oStub.called,true);
	});

	QUnit.test("should update activity data when run function updateActivityNote", function (assert) {
		//Arrangment  
		this.oMCCDetail.oTextArea = new sap.m.TextArea({
			"value": "test"
		});
		this.oMCCDetail.ID = "1111222";
		this.oMCCDetail.oNav = {
			back:function(){}
		};
		var oStub1 = this.stub(this.oMCCDetail,"loadNoteData");
		var oStub2 = this.stub(this.oMCCDetail,"loadDetailData");
		this.oStubMsgBoxCfm.yieldsTo("onClose","OK");
		this.Fsc2Update.yieldsTo("success","");
		this.oMCCDetail.oTextArea = new sap.m.TextArea({value:"note test"});
		//Action
		this.oMCCDetail.updateActivityNote({},true);
		//Assertion
		assert.equal(oStub1.callCount, 1);
		assert.equal(oStub2.callCount, 1);
	});
	
	QUnit.test("should open Quick View when click the image on top oc MCC activity detail page", function (assert) {
		//Arrangment  
		var oView = this.oMCCDetail.getView();
		var oStub = this.stub(oView,"addDependent");
		var oEvent = {
			getSource:function(){
				return new sap.m.Button();
			}
		};
		//Action
		this.oMCCDetail.openQuickView(oEvent);
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("Save note and nav to mcc detail page", function (assert) {
		//Arrangment  
		var oRejectModel = {
			"Notes": "test",
			"activity_status": "E0011",
			"activity_person_user_id": "",
			"activity_process_type": "ZS46"
		};
		// this.Fsc2Update.withArgs("/FSC2ActivitySet('0000343492')").yieldsTo("success", "undefined");

		this.oMCCDetail.oTextArea = new sap.m.TextArea();
		this.oMCCDetail.oNav = new sap.m.NavContainer();

		//Action
		this.oMCCDetail.updateActivityNote(oRejectModel, true);

		//Assertion
		assert.equal(this.Fsc2Update.callCount, 1);
	});

	// function formatTimeTestCase(oOptions) {
	// 	var sState = this.oMCCDetail.formatTime(oOptions.sTime);
	// 	oOptions.assert.propEqual(sState, oOptions.expected, "The result was correct");
	// }

	// QUnit.test("Should return exact time", function (assert) {
	// 	formatTimeTestCase.call(this, {
	// 		assert: assert,
	// 		sTime: "13.12.2018.13 10:36:53",
	// 		expected: new Date(1544697413000)
	// 	});
	// });

	function groupServiceTeamTestCase(oOptions) {
		var sState = this.oMCCDetail.groupServiceTeam(oOptions.aServiceTeam);
		oOptions.assert.propEqual(sState, oOptions.expected, "The result was correct");
	}

	QUnit.test("Should return exact service team", function (assert) {
		groupServiceTeamTestCase.call(this, {
			assert: assert,
			aServiceTeam: this.RegionListModel.getData().results,
			expected: [{
				"Region": "APJ",
				"Topic": [{
					"name": "Engagement Support APJ-ANZ",
					"service_team_id": "16122383"
				}, {
					"name": "Engagement Support APJ-IN",
					"service_team_id": "14722020"
				}, {
					"name": "Engagement Support APJ-JP",
					"service_team_id": "16122385"
				}, {
					"name": "Engagement Support APJ-KOR",
					"service_team_id": "22163161"
				}, {
					"name": "Engagement Support APJ-NA",
					"service_team_id": "14217680"
				}, {
					"name": "Engagement Support APJ-SEA",
					"service_team_id": "16122387"
				}, {
					"name": "HANA",
					"service_team_id": "14235363"
				}, {
					"name": "Cloud",
					"service_team_id": "19093065"
				}, {
					"name": "Hybrid",
					"service_team_id": "25978270"
				}, {
					"name": "Innovation Adopt & Hybrid Ops",
					"service_team_id": "29788190"
				}, {
					"name": "S/4 HANA",
					"service_team_id": "25970641"
				}]
			}, {
				"Region": "EMEA",
				"Topic": [{
					"name": "Engagement Support",
					"service_team_id": "16539820"
				}, {
					"name": "HANA",
					"service_team_id": "14217791"
				}, {
					"name": "Cloud",
					"service_team_id": "17877275"
				}, {
					"name": "Hybrid",
					"service_team_id": "25674544"
				}, {
					"name": "Innovation Adopt & Hybrid Ops",
					"service_team_id": "29765610"
				}, {
					"name": "S/4 HANA",
					"service_team_id": "16673868"
				}]
			}, {
				"Region": "GLOBAL",
				"Topic": [{
					"name": "MCC",
					"service_team_id": "20672944"
				}, {
					"name": "HANA",
					"service_team_id": "13732949"
				}, {
					"name": "Cloud",
					"service_team_id": "19568810"
				}, {
					"name": "Innovation Adopt & Hybrid Ops",
					"service_team_id": "28054858"
				}]
			}, {
				"Region": "LAC",
				"Topic": [{
					"name": "Engagement Support",
					"service_team_id": "15966792"
				}, {
					"name": "HANA",
					"service_team_id": "14235365"
				}, {
					"name": "Cloud",
					"service_team_id": "17403528"
				}, {
					"name": "Hybrid",
					"service_team_id": "25978266"
				}, {
					"name": "Innovation Adopt & Hybrid Ops",
					"service_team_id": "29788192"
				}, {
					"name": "S/4 HANA",
					"service_team_id": "25970643"
				}]
			}, {
				"Region": "NA",
				"Topic": [{
					"name": "Engagement Support",
					"service_team_id": "21710213"
				}, {
					"name": "HANA",
					"service_team_id": "14235364"
				}, {
					"name": "Cloud",
					"service_team_id": "16755384"
				}, {
					"name": "Hybrid",
					"service_team_id": "25978264"
				}, {
					"name": "Innovation Adopt & Hybrid Ops",
					"service_team_id": "29788191"
				}, {
					"name": "S/4 HANA",
					"service_team_id": "25970644"
				}]
			}]
		});
	});
	QUnit.test("Flag an activity favorite when 'Set Favorite' button was pressed", function (assert) {
		//Arrangment  
		this.UserProfileModelCreate.withArgs("/Entries").yieldsTo("success", "");
		this.stub(this.oMCCDetail, "loadDetailData");
		this.stub(this.oMCCDetail, "loadFavCustData");
		//Action
		this.oMCCDetail.onSetFavorite();
		//Assertion
		var sValue = this.oComponent.getModel("MCCPageConfig").getProperty("/_bFavorite");
		assert.equal(sValue, true);
	});
	QUnit.test("Flag an activity unfavorite when 'Remove Favorite' button was pressed", function (assert) {
		//Arrangment  
		this.UserProfileModelRemove.withArgs("/Entries(Username='',Attribute='FAVORITE_ACTIVITIES',Field='')").yieldsTo("success",
			{});
		var oStub1 = this.stub(this.oMCCDetail, "loadDetailData");
		var oStub2 = this.stub(this.oMCCDetail, "loadFavCustData");
		//Action
		this.oMCCDetail.onRemoveFavorite();
		//Assertion
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});

	QUnit.test("Show edit detail page when edit button was pressed and service team is not null", function (assert) {
		//Arrangment  
		this.byId.withArgs("idMCCObjectPageLayout").returns(this.oControl);
		this.byId.withArgs("idDetail").returns(this.oControl);
		this.byId.withArgs("status").returns(this.oControl);
		this.byId.withArgs("category").returns(this.oControl);
		this.byId.withArgs("rating").returns(this.oControl);
		this.byId.withArgs("priority").returns(this.oControl);
		this.byId.withArgs("inServiceTeam").returns(this.oControl);
		this.byId.withArgs("region").returns(this.oControl);
		this.byId.withArgs("topic").returns(this.oControl);
		var oStub = this.stub(this.oMCCDetail, "copyDetailModelToEditModel");

		//Action
		this.oMCCDetail.onEdit();
		//Assertion
		assert.equal(oStub.called, true);
	});
	QUnit.test("Show edit detail page when 'edit' button was pressed and service team is empty", function (assert) {
		//Arrangment  
		this.byId.withArgs("idMCCObjectPageLayout").returns(this.oControl);
		this.byId.withArgs("idDetail").returns(this.oControl);
		this.byId.withArgs("status").returns(this.oControl);
		this.byId.withArgs("category").returns(this.oControl);
		this.byId.withArgs("rating").returns(this.oControl);
		this.byId.withArgs("priority").returns(this.oControl);
		this.byId.withArgs("inServiceTeam").returns(new sap.m.Input());
		this.byId.withArgs("region").returns(this.oControl);
		this.byId.withArgs("topic").returns(this.oControl);
		var oStub = this.stub(this.oMCCDetail, "copyDetailModelToEditModel");

		//Action
		this.oMCCDetail.onEdit();
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("Change edit property after editing when save button was pressed", function (assert) {
		//Arrangment  
		var oStub = this.stub(this.oMCCDetail, "saveActivity");
		//Action
		this.oMCCDetail.onSave();
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("should get changed data before data save when run function getChangeData", function (assert) {
		//Arrangment  
		this.byId.withArgs("inPersonUserID").returns(new sap.m.Input());
		this.byId.withArgs("idMatnrInputCaseID").returns(new sap.m.Input());
		this.byId.withArgs("inServiceTeam").returns(new sap.m.Input());
		this.byId.withArgs("status").returns(new sap.m.Select({
			"selectedKey": "E0011",
			"items": [
				new sap.ui.core.Item({
					"key": "E0011",
					"text": ""
				})
			]
		}));
		this.byId.withArgs("category").returns(new sap.m.Select({
			"selectedKey": "ZZR",
			"items": [
				new sap.ui.core.Item({
					"key": "ZZR",
					"text": ""
				})
			]
		}));
		this.byId.withArgs("rating").returns(new sap.m.Select({
			"selectedKey": "G",
			"items": [
				new sap.ui.core.Item({
					"key": "G",
					"text": "red"
				})
			]
		}));
		this.byId.withArgs("priority").returns(new sap.m.Select({
			"selectedKey": "5",
			"items": [
				new sap.ui.core.Item({
					"key": "5",
					"text": "Hign"
				})
			]
		}));
		this.byId.withArgs("inPlannedDateTo").returns(new sap.m.Input({
			"value": "04 July 2019 00:12:00 UTC"
		}));
		//Action
		var oEntity = this.oMCCDetail.getChangeData();
		var oChangedData = {
				userId: "",
				caseid: "",
				serviceTeam: "",
				status: "E0011",
				category: "ZZR",
				rating: "G",
				priority: "5",
				planned_date_to: "/Date(1562199120000)/"
		};
		//Assertion
		assert.deepEqual(oEntity, oChangedData);
	});

	QUnit.test("should save edit data after editing when 'save' button was pressed", function (assert) {
	this.stub(this.oMCCDetail,"getChangeData").returns(
			{
				userId: "",
				caseid: "",
				serviceTeam: "",
				status: "E0011",
				category: "ZZR",
				rating: "G",
				priority: "5",
				planned_date_to: "/Date(1562199120000)/"
			}
		);
		this.Fsc2Update.yieldsTo("success",{});
		var oStub1 = this.stub(this.oMCCDetail, "loadDetailData");
		var oStub2 = this.stub(this.oMCCDetail, "onCancel");
		//Action
		this.oMCCDetail.saveActivity();

		//Assertion
		// assert.equal(this.Fsc2Update.callCount, 1);
		assert.equal(oStub1.callCount, 1);
		assert.equal(oStub2.callCount, 1);
	});
	
	QUnit.test("should give error message when save data and get oData service error", function (assert) {
		this.stub(this.oMCCDetail,"getChangeData").returns(
			{
				userId: "",
				caseid: "0",
				serviceTeam: "0",
				status: "0",
				category: "0",
				rating: "0",
				priority: "0",
				planned_date_to: "/Date(1562199120000)/"
			}
		);
		this.Fsc2Update.yieldsTo("error",{});
		var oStub1 = this.oStubMsgShow;
		var oStub2 = this.stub(this.oMCCDetail, "onCancel");
		//Action
		this.oMCCDetail.saveActivity();

		//Assertion
		assert.equal(this.Fsc2Update.callCount, 1);
		assert.equal(oStub1.callCount, 1);
		assert.equal(oStub2.callCount, 1);
	});

	QUnit.test("Should change the region", function (assert) {
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(new sap.ui.core.Item({
			"key": "0",
			"text": "APJ"
		}));
		var oRegion = {
			"results": [{
				"Region": "APJ",
				"Topic": [{
					"name": "Engagement Support APJ-ANZ",
					"service_team_id": "16122383"
				}, {
					"name": "Engagement Support APJ-IN",
					"service_team_id": "14722020"
				}]
			}, {
				"Region": "EMEA",
				"Topic": [{
					"name": "Engagement Support",
					"service_team_id": "16539820"
				}, {
					"name": "HANA",
					"service_team_id": "14217791"
				}]
			}]
		};
		this.oComponent.getModel("MCCSettings").setProperty("/RegionList", oRegion.results);
		this.byId.withArgs("topic").returns(this.oControl);
		//Action
		this.oMCCDetail.onRegionChange(oEvent);
		var sValue1 = this.oComponent.getModel("MCCSettings").getProperty("/RegionList")[0]["Topic"];
		var sValue2 = oRegion.results[0]["Topic"];
		//Assertion
		assert.deepEqual(sValue1, sValue2);
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
		var oStub = this.stub(oPara, "addHeaderParameter");
		this.oMCCDetail.sID = "XXXXX";
		//Action
		this.oMCCDetail.onBeforeUploadStarts(oEvent);
		//Assertion
		assert.equal(oStub.called, true);
	});
	QUnit.test("should run function  loadDetailData when upload a file completed", function (assert) {
		//Arrangment  
		var oStub = this.stub(this.oMCCDetail, "loadDetailData");
		//Action
		this.oMCCDetail.onUploadComplete();
		//Assertion
		assert.equal(oStub.callCount, 1);
	});
	
	QUnit.test("should give warning message when upload a file  bigger than max size", function (assert) {
		//Action
		this.oMCCDetail.onFileSizeExceed();
		//Assertion
		assert.equal(this.oStubMsgShow.callCount, 1);
	});
	// QUnit.test("should give warning message when upload a file that name is too long", function (assert) {
	// 	//Action
	// 	this.oMCCDetail.onFileNameExceed();
	// 	//Assertion
	// 	assert.equal(this.oStubMsgShow.called, true);
	// });

	QUnit.test("Copy detail model to edit model when 'edit' button was pressed", function (assert) {
		//Arrangment  
		var oData = this.MCCDetailModel.getData();
		this.oComponent.getModel("MCCDetail").setData(oData);
		//Action
		this.oMCCDetail.copyDetailModelToEditModel();
		//Assertion
		assert.deepEqual(this.oComponent.getModel("DetailEdit").getData(), oData);
	});

	QUnit.test("Cancel edit when 'cancel' button was pressed", function (assert) {
		//Arrangment  
		var oStub = this.stub(this.oMCCDetail, "copyDetailModelToEditModel");
		//Action
		this.oMCCDetail.onCancel();
		//Assertion
		assert.equal(oStub.called, true);
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
		this.oMCCDetail.sID = "XXXXX";
		var oStub1 = sinon.stub(oCtrl, "setUploadUrl");
		var oStub2 = sinon.stub(oCtrl, "upload");
		//Action
		this.oMCCDetail.onChange(oEvent);
		//Assertion
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});
	QUnit.test("Mail to person responsible when Send Email to Person Responsible button was pressed", function (assert) {
		//Arrangment  
		var oData = this.MCCDetailModel.getData();
		this.oComponent.getModel("MCCDetail").setData(oData);
		this.oComponent.getModel("device").setProperty("/isPhone", false);
		var oStub = this.stub(this.oMCCDetail, "MailTo");
		//Action
		this.oMCCDetail.onMailToPersonResponsible();
		//Assertion
		assert.equal(oStub.called, true);
	});

	QUnit.test("Mail to Last Changer when 'Send Email to last editor' button was pressed", function (assert) {
		//Arrangment  
		var oData = this.MCCDetailModel.getData();
		this.oComponent.getModel("MCCDetail").setData(oData);
		this.oComponent.getModel("device").setProperty("/isPhone", false);
		this.stub(this.oMCCDetail, "MailTo");
		//Action
		this.oMCCDetail.onMailToLastChanger();

		//Assertion
		assert.equal(this.oComponent.getModel("MCCDetail").getProperty("/ChangedBy"), oData.results.ChangedBy);
	});

	QUnit.test("Mail to Last Changer when 'Send Email to last editor' button was pressed", function (assert) {
		//Arrangment  
		var oData = this.MCCDetailModel.getData();
		this.oComponent.getModel("MCCDetail").setData(oData);
		this.oComponent.getModel("device").setProperty("/isPhone", false);
		this.stub(this.oMCCDetail, "MailTo");
		//Action
		this.oMCCDetail.onMailToLastChanger();

		//Assertion
		assert.equal(this.oComponent.getModel("MCCDetail").getProperty("/ChangedBy"), oData.results.ChangedBy);
	});
	
	QUnit.test("should open action button on page header when press overflow button", function (assert) {
		//Arrangment  
		var oEvent = {
			getSource:function(){
				return new sap.m.Button();
			}
		};
		//Action
		this.oMCCDetail.onOverflow(oEvent);
		//Assertion
		assert.equal(!this.oMCCDetail._actionSheet, false);
	});
	
	QUnit.test("Mail to creator when 'Send Email to creator' button was pressed", function (assert) {
		//Arrangment  
		var oData = this.MCCDetailModel.getData();
		this.oComponent.getModel("MCCDetail").setData(oData);
		this.oComponent.getModel("device").setProperty("/isPhone", false);
		this.stub(this.oMCCDetail, "MailTo");
		//Action
		this.oMCCDetail.onMailToCreator();

		//Assertion
		assert.equal(this.oComponent.getModel("MCCDetail").getProperty("/activity_created_by"), oData.results.activity_created_by);
	});

	function _checkValidEmailToTestCase(oOptions) {
		// Act
		var sState = this.oMCCDetail._checkValidEmailTo(oOptions.oStr);

		// Assert
		oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
	}

	QUnit.test("Should return true when input is 'Ixxxxxx'", function (assert) {
		_checkValidEmailToTestCase.call(this, {
			assert: assert,
			oStr: "I111111",
			expected: true
		});
	});

	QUnit.test("Should return false when input is 'Cxxxxxx'", function (assert) {
		_checkValidEmailToTestCase.call(this, {
			assert: assert,
			oStr: "C111111",
			expected: false
		});
	});

	QUnit.test("Should return false when input is ''", function (assert) {
		_checkValidEmailToTestCase.call(this, {
			assert: assert,
			oStr: "",
			expected: false
		});
	});
	
	QUnit.test("Should return false when input start with other character except I, C, D", function (assert) {
		_checkValidEmailToTestCase.call(this, {
			assert: assert,
			oStr: "XXXXXX",
			expected: false
		});
	});

});
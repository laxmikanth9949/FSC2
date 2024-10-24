sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/support/fsc2/model/models'
], function (BaseController,models) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.App", {
		onInit: function () {
			this.setModel(new sap.ui.model.json.JSONModel({
				"expertMode": false,
				"enableNotification": false,
				"enableDefaultCase": false,
				"enableSaM":false,
				"defaultCase": "",
				"defaultCustNo": "",
				"defaultCustName":"",
				"createType": ""
			}), "homePageConfig");
			this.setModel(new sap.ui.model.json.JSONModel({
				"myRequests": 0,
				"myFavorites": 0,
				"myActivities": 0
			}), "homePageCount");
			this.setModel(new sap.ui.model.json.JSONModel({
				bEnable:true
			}),"EnableSnowCase");
			// var sEnableSnowCase = this.getModel("EnableSnowCase").getProperty("/bEnable");
			this.setModel(new sap.ui.model.json.JSONModel(),"subscribeSetting");
			this.setModel(new sap.ui.model.json.JSONModel(),"CurrentUserInfo");
			var oFavModel = models.createFavoriteModel();
			this.setModel(oFavModel, "favorite");
			this.refreshFavoriteIncidentsModel();
			this.loadSettingData();
			this.loadFavCustData();
			this.loadCurrentTimeZone();
			this.getUserInfo(); 
		}
	});

});
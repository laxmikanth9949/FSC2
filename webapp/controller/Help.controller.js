sap.ui.define([
	'sap/support/fsc2/controller/BaseController'
], function (Controller) {
	"use strict";
	return Controller.extend("sap.support.fsc2.controller.Help", {
		onInit: function () {
			var oImageSRC = jQuery.sap.getModulePath("sap.support.fsc2") + "/image/icon.png";
			this.getView().byId("iMainImage").setSrc(oImageSRC);
			this.getRouter().getRoute("help").attachPatternMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function () {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
		},
		getAccount: function () {
			var sReturnValue = "br339jmc4c.dispatcher.int.sap.eu2";
			var sUrl = window.location.href;
			if (sUrl.indexOf("br339jmc4c") > -1) {
				sReturnValue = "br339jmc4c.dispatcher.int.sap.eu2";
			} else if (sUrl.indexOf("sapitcloudt") > -1) {
				sReturnValue = "sapitcloudt.dispatcher";
			} else if (sUrl.indexOf("sapitcloud.dispatcher") > -1) {
				sReturnValue = "sapitcloud.dispatcher";
			} else if (sUrl.indexOf("fiorilaunchpad.sap") > -1) {
				sReturnValue = "sapitcloud.dispatcher";
			}
			return sReturnValue;
		},

		onNews: function () {
			sap.m.URLHelper.redirect("ht" + "tps://jam4.sapjam.com/wiki/show/Z7okBVeUZ4tuqM4R75gmPq?_lightbox=true", true);
		},

		onJam: function () {
			var sLink = "ht" + "tps://jam4.sapjam.com/groups/Uit0yfV4hybEaihDxSX6LD/overview_page/ov5uDE4nFsvveQUa5ZylgV?";
			sap.m.URLHelper.redirect(sLink, true);
		},

		onHelp: function () {
			sap.m.URLHelper.redirect("ht" + "tps://jam4.sapjam.com/groups/Uit0yfV4hybEaihDxSX6LD/forums?folder_id=I3X47nSiHzyU8xsChDDlg7", true);
		},

		onShare: function () {
			var subject = "MCC SOS App";
			var shareEmailText = "Dear colleague,\n\nPlease have a look at the MCC SOS App" +
				"\n\nTo access the MCC SOS App please use the link below." +
				"\n\nLink to UI5 App:\nht" +
				"tps://mccsos-" + this.getAccount() + ".hana" + ".ondemand.com/" + //"\n\nLink to app installation on iOS from SAP Mobile Place:\nht" +"tps://sap.sapmobileplace.com/?ID=996b6cdf34cc2d2399e36cb42c6f2274#ApplicationDetails" +
				"\n\nDirect Link to app on Fiori Launchpad:\nht" +
				"tps://fiorilaunchpad-sapitcloud.dispatcher.hana.ondemand.com/sites#mccsos-Display" +
				"\n\n\n\n------------------------------------------------------------------------------------------------------------------\n" +
				"DISCLAIMER: This document is confidential and should only be used internally.\n" +
				"------------------------------------------------------------------------------------------------------------------" +
				"\n\nCreated by MCC SOS App";
			sap.m.URLHelper.triggerEmail("", subject, shareEmailText);
		},

		onReportIssue: function () {
			var sLink = "";
			switch (sap.support.fsc2.Landscape) {
			case 'p':
				sLink =
					'https://itsupportportal.services.sap/itsupport?id=itsm_sc_cat_item&sys_id=b1982b441bb1c1105039a6c8bb4bcbc3&sysparm_variables={"business_service":"21af9c6f1ba564905039a6c8bb4bcb61","service_offering":"10c283dd1b8e259036ac10e69b4bcb28","assignment_group":"e5818b511b8e259036ac10e69b4bcbd4","short_description":"Issue with MCC SOS App"}'
				break;
			case 't':
				sLink =
					'https://sapexttest.service-now.com/itsupport?id=itsm_sc_cat_item&sys_id=b1982b441bb1c1105039a6c8bb4bcbc3&sysparm_variables={"business_service":"21af9c6f1ba564905039a6c8bb4bcb61","service_offering":"10c283dd1b8e259036ac10e69b4bcb28","assignment_group":"e5818b511b8e259036ac10e69b4bcbd4","short_description":"Issue with MCC SOS App"}';
				break;
			default:
				sLink = "";
			}
			sap.m.URLHelper.redirect(sLink, true);
		},

		// onGuideline: function() {
		// 	var sLink = "ht" + "tps://mccguidline-d060917trial.dispatcher.hanatrial.ondemand.com/index.html";
		// 	sap.m.URLHelper.redirect(sLink, true);
		// }
	});
});
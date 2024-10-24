sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/ui/core/IconPool",
	"sap/ui/model/json/JSONModel",
	'sap/ui/model/odata/v2/ODataModel',
	"sap/support/fsc2/model/models",
	'sap/ui/model/Filter',
	'sap/m/MessageBox',
	"sap/base/util/UriParameters",
	"sap/f/library",
	"sap/f/FlexibleColumnLayoutSemanticHelper",
	"sap/support/fsc2/util/Intercept",
	"sap/support/fsc2/model/formatter"
], function (UIComponent, Device, IconPool, JSONModel, ODataModel, models, Filter, MessageBox, UriParameters,
	library, FlexibleColumnLayoutSemanticHelper, Intercept, formatter) {
	"use strict";
	var LayoutType = library.LayoutType;

	return UIComponent.extend("sap.support.fsc2.Component", {
		metadata: {
			manifest: "json",
			version: "1.0"
		},
		config: {
			reportingId: "MCC SOS",
			fullWidth: true
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this method, the FLP and device models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init: function () {
			this.setModel(new sap.ui.model.json.JSONModel({
				"channel": "mccSOS"
			}), "QualtricsData");
			var oModel = new JSONModel();
			this.setModel(oModel);
			/******comment: Set the language of app to English: ******/
			sap.ui.getCore().getConfiguration().setLanguage("en");

			//this._checkEnvironment();
			//get Backend host
			this.getBackendHost();
			this._mobileReporting();
			this.initODataModel();
			// call the base component's init function and create the App view
			UIComponent.prototype.init.apply(this, arguments);

			// Add push notification event (Device push notification register)
			/******comment:Add push notification and refresh notification listener event when log on app successfully (Only valid when registering as a mobile app)******/
			document.addEventListener("onSapLogonSuccess", this.registerForPush.bind(this), false);
			document.addEventListener("onSapResumeSuccess", this.refreshNotification.bind(this), false);

			// register TNT icon font
			IconPool.registerFont({
				fontFamily: "SAP-icons-TNT",
				fontURI: jQuery.sap.getModulePath("sap.tnt.themes.base.fonts")
			});

			// register BusinessSuiteInAppSymbols icon font
			IconPool.registerFont({
				fontFamily: "BusinessSuiteInAppSymbols",
				fontURI: jQuery.sap.getModulePath("sap.ushell.themes.base.fonts")
			});
			
			var dialog = new sap.m.Dialog({
				title: "MCC SOS App moved to cFLP",
				contentWidth: "700px",
				contentHeight: "100px",
				titleAlignment: "Center",
				icon: "sap-icon://message-warning",
				state: "Warning",
				escapeHandler:function( ){},
				content: [new sap.m.Text({
					text: "The MCC SOS app has moved to Cloud Foundry, please bookmark the new URL:"
				}), new sap.m.Link({
					text: formatter.formatEnvironmentURL(),
					href: formatter.formatEnvironmentURL()
				})]
			}).addStyleClass("sapUiContentPadding");
			//this.getView().addDependent(dialog);
			dialog.open();
			// create the views based on the url/hash
			this.getRouter().initialize();
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			/**************sort array in ios system****************/
			// (function (w) {
			// 	// if (/msie|applewebkit.+safari/i.test(w.navigator.userAgent)) {
			// 	if(/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)){
			// 		var _sort = Array.prototype.sort;
			// 		Array.prototype.sort = function (fn) {
			// 			if (!!fn && typeof fn === 'function') {
			// 				if (this.length < 2) return this;
			// 				var i = 0,
			// 					j = i + 1,
			// 					l = this.length,
			// 					tmp, r = false,
			// 					t = 0;
			// 				for (; i < l; i++) {
			// 					for (j = i + 1; j < l; j++) {
			// 						t = fn.call(this, this[i], this[j]);
			// 						r = (typeof t === 'number' ? t : !!t ? 1 : 0) > 0 ? true : false;
			// 						if (r) {
			// 							tmp = this[i];
			// 							this[i] = this[j];
			// 							this[j] = tmp;
			// 						}
			// 					}
			// 				}
			// 				return this;
			// 			} else {
			// 				return _sort.call(this);
			// 			}
			// 		};
			// 	}
			// })(window);
			/******************************/
		},
		getHelper: function () {
			var oFCL = this.getRootControl().byId("fcl"),
				oParams = UriParameters.fromQuery(location.search),
				oSettings = {
					defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
					defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
					mode: oParams.get("mode"),
					maxColumnsCount: oParams.get("max")
				};

			return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
		},
		initODataModel: function () { /******comment: define 3 services  ******/
			var that = this;
			var bMobileApp = location.host.indexOf("mobile") > -1;
			var bFailoverApp = location.host.indexOf("flpnwc-sapitcloud") > -1;
			if (bMobileApp) {
				this.sBCIncidentDest = "intbc";
				this.sICDest = "intic";
				this.sICUserProfDest = "intic/SVT";
				this.sHCSMDest = "servicenow";
				this.sFSC2Activity = "intic";
				if (!this.oNewsDialog) {
					this.oNewsDialog = new sap.m.Dialog({
						title: "IMPORTANT: We migrated mobile app to the MCC SOS Web",
						content: new sap.m.FormattedText({
							htmlText: `<p>&nbsp;&nbsp;&nbsp;Dear MCC SOS Apple users,</p>
<p>&nbsp;&nbsp;&nbsp;Important updates for the iOS MCC SOS App:</p>
<ul>
<li>Starting Feb 12, 2024, find the new 'MCC SOS Web' icon in Self Service. It uses Single Sign-on. It may require double certificate confirmation using Safari as the default browser – select the last entry with your I-user or D-user.
</li>
<li>On Feb 26, 2024, the app will auto-install for all current users.</li>
<li>Both 'MCC SOS' and 'MCC SOS Web' icons work until March 14, 2024, when 'MCC SOS' will be discontinued.</li>
</ul>
<p>&nbsp;&nbsp;&nbsp;Start using 'MCC SOS Web' and report issues on <a href="https://workzone.one.int.sap/site#workzone-viewAll?sap-app-origin-hint=&/groups/Uit0yfV4hybEaihDxSX6LD/overview_page/ov5uDE4nFsvveQUa5ZylgV">MCC SOS Workzone</a> or <a href="https://itsupportportal.services.sap/itsupport?id=itsm_sc_cat_item&sys_id=b1982b441bb1c1105039a6c8bb4bcbc3&sysparm_variables=%7B%22business_service%22:%2221af9c6f1ba564905039a6c8bb4bcb61%22,%22service_offering%22:%2210c283dd1b8e259036ac10e69b4bcb28%22,%22assignment_group%22:%22e5818b511b8e259036ac10e69b4bcbd4%22,%22short_description%22:%22Issue%20with%20MCC%20SOS%20App%22%7D">Submit a Support Ticket</a> in case of any issues.</p>`
						}),
						beginButton: new sap.m.Button({
							type: sap.m.ButtonType.Emphasized,
							text: "OK",
							press: function () {
								this.oNewsDialog.close();
							}.bind(this)
						})
					});
				}
				this.oNewsDialog.open();
			} else if (bFailoverApp) {
				this.sBCIncidentDest = "/intbc";
				this.sICDest = "/intic";
				this.sICUserProfDest = "/intic/SVT";
				this.sHCSMDest = "/servicenow";
				this.sFSC2Activity = "/intic";
			} else {
				this.sBCIncidentDest = "/intbc/sap/opu/odata";
				this.sICDest = "/apim/ic/sap/opu/odata";
				this.sFSC2Activity = "/apim/ic";
				this.sICUserProfDest = "/apim/ic/sap/opu/odata/svt";
				this.sHCSMDest = "/apim/hcsm-tu";
			}
			// sap.ui.core.BusyIndicator.show();
			this.setModel(new JSONModel(), "user");
			this.setModel(new JSONModel(), "favoriteIncidents");
			sap.support.fsc2.AppUrl = "/";
			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: this.sICDest + "/sap/ZS_AGS_FSC2_SRV",
				defaultUpdateMethod: "Put",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				}
			});
			sap.support.fsc2.FSC2ModelUrl = this.sICDest + "/sap/ZS_AGS_FSC2_SRV";
			sap.support.fsc2.CXCSSModelUrl = this.sICDest + "/sap/ZS_CX_CCS_SRV";
			sap.support.fsc2.FSC2Model.attachMetadataFailed(function (error) {
				that.getErrorBox(error);
			});
			sap.support.fsc2.UserProfileModel = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: this.sICUserProfDest + "/USER_PROFILE_SRV",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				}
			});
			sap.support.fsc2.UserProfileModel.attachMetadataFailed(function (error) {
				that.getErrorBox(error);
			});
			sap.support.fsc2.oDataIcdList = new ODataModel(this.sBCIncidentDest + "/SVC/SID_GATEWAY_SRV", {
				json: true,
				useBatch: false,
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				}
			});
			sap.support.fsc2.oDataIcdListPut = new ODataModel(this.sBCIncidentDest + "/SVC/SID_GATEWAY_SRV", {
				json: true,
				useBatch: false,
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				defaultUpdateMethod: "Put"
			});
			//--------------cimRequest
			//--------service now
			sap.support.fsc2.servicenowEscalationUrl = this.sHCSMDest + "/api/now/table/sn_customerservice_escalation";
			sap.support.fsc2.servicenowEscalationUrlCreateApi = this.sHCSMDest + "/api/now/import/u_sap_escalation_api_inbound";
			sap.support.fsc2.servicenowEscalationNotesUrl = this.sHCSMDest + "/api/sapda/sap_escalation_activity";
			sap.support.fsc2.servicenowEscalationByCustomerUrl = this.sHCSMDest + "/api/now/table/sn_customerservice_escalation_case_account";

			sap.support.fsc2.servicenowUrl = this.sHCSMDest + "/api/now/table/sn_customerservice_case";
			sap.support.fsc2.snowBusImpUrl = this.sHCSMDest + "/api/x_sapda_case_api/case_detail";
			sap.support.fsc2.postServicenowUrl = this.sHCSMDest + "/api/now/import/x_sapda_sap_icp_ap_task_update";

			sap.support.fsc2.servicenowTableUrl = this.sHCSMDest + "/api/now/table";

			//--------service now
			sap.support.fsc2.IncidentModel = new ODataModel({
				json: true,
				useBatch: false,
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				serviceUrl: this.sBCIncidentDest + "/SVC/SID_GATEWAY_SRV"
			});
			sap.support.fsc2.BcIncidentModel = new ODataModel({
				json: true,
				useBatch: false,
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				serviceUrl: this.sBCIncidentDest + "/sid/sc2_critsit_dashboard_srv"
			});

			sap.support.fsc2.IncidentModel.attachMetadataFailed(function (error) {
				that.getErrorBox(error);
			});
			//after init apply
			sap.support.fsc2.FSC2Model.read("/UserSet(Userid='')", {
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				success: function (oData) {
					that.getModel("user").setData(oData);
				},
				error: function (oError) {
					sap.m.MessageToast.show("FSC2 Service Unavailable!");
				}
			});
		},

		getErrorBox: function (oError) {
			var sText = "Service exception on " + location.host + ": " + oError.getParameter("response").requestUri +
				"\nYou can click 'Retry' to try to connect again.";
			if (oError.getParameter("response").requestUri.indexOf(this.sBCIncidentDest) > -1) {
				sText = "Service exception on " + location.host + ": Connection to BCP failed.\nYou can click 'Retry' to try to connect again. \n" +
					location.host + oError
					.getParameter("response").requestUri;
			} else if (oError.getParameter("response").requestUri.indexOf(this.sICDest) > -1) {
				sText = "Service exception on " + location.host + ": Connection to ICP failed.\nYou can click 'Retry' to try to connect again. \n" +
					location.host + oError
					.getParameter("response").requestUri;
			}
			MessageBox.error(sText, {
				title: oError.getParameter("message"),
				styleClass: "sapUiSizeCompact",
				actions: [sap.m.MessageBox.Action.RETRY],
				onClose: function (oAction) {
					/*****comment: when anyone of the upper service has any exception, the app will reload homepage.******/
					// location.assign(location);
				}
			});
		},
		getBackendHost: function () {
			var sHost = location.host;
			var sNewHost = "",
				sNewHost2 = "",
				sEnvr = "d";
			if (sHost.indexOf("br339jmc4c") !== -1 || sHost.indexOf("mallard") !== -1) {
				sEnvr = "d";
				sNewHost = "pgdmain.wdf.sap.corp"; //Dev.
				sNewHost2 = "icd.wdf.sap.corp"; //Dev.
			} else if (sHost.indexOf("sapitcloudt") !== -1 || sHost.indexOf("kinkajou") !== -1) {
				sEnvr = "t";
				sNewHost = "pgtmain.wdf.sap.corp"; // demo or test version
				sNewHost2 = "ict.wdf.sap.corp";
			} else {
				sEnvr = "p";
				sNewHost = "pgpmain.wdf.sap.corp";
				sNewHost2 = "icp.wdf.sap.corp";
			}
			sap.support.fsc2.BackendHost = sNewHost;
			sap.support.fsc2.BackendHost2 = sNewHost2;
			sap.support.fsc2.Landscape = sEnvr;
		},
		/******comment:check the environment of the app running on, e.g. local webide, Phone,launchpad,etc******/
		// _checkEnvironment: function () {
		// 	var url = document.location.toString();
		// 	var arrUrl = url.split("//");
		// 	var start = arrUrl[1].indexOf("/");
		// 	var relUrl = arrUrl[1].substring(start);
		// 	if (relUrl.indexOf("?") !== -1) {
		// 		relUrl = relUrl.split("?")[0];
		// 	}
		// 	/******comment: current path containing '/webapp/' means application is running in local web IDE 
		// 	       !window["sap-fiori-ui5-bootstrap"] = false means application is running in the launchpad.
		// 	******/
		// 	var bLocalWebIde = relUrl.indexOf("/webapp/") > -1;
		// 	var bFLP = url.indexOf("launchpad") > -1;
		// 	this.sFirstSlash = bLocalWebIde ? "/" : "";
		// 	this.sFioriLaunchpad = bFLP ? "sap/fiori/mccsos/" : "";
		// 	//this.sFioriLaunchpad = !window["sap-fiori-ui5-bootstrap"] ? "" : "sap/fiori/mccsos/";
		// },
		registerForPush: function () {
			//MessageToast.show("sap.Push: " + JSON.stringify(sap.Push));
			if (sap.Push) {
				//sap.m.MessageToast.show("try to register");
				var nTypes = sap.Push.notificationType.SOUNDS | sap.Push.notificationType.ALERT | sap.Push.notificationType.BADGE;
				sap.Push.registerForNotificationTypes(nTypes, this.regSuccess.bind(this), this.regFailure.bind(this),
					this.processNotificationFrontend.bind(this), ""); //GCM Sender ID, null for APNS
				//{}, ""); //GCM Sender ID, null for APNS
			}
		},
		regSuccess: function (result) {
			//sap.m.MessageToast.show("Successfully registered:" + JSON.stringify(result));
			//console.log("Successfully registered:" + JSON.stringify(result));
		},

		regFailure: function (errorInfo) {
			sap.m.MessageToast.show("Error while registering:" + JSON.stringify(errorInfo));
		},

		refreshNotification: function () {
			//sap.m.MessageToast.show("sap.Push: " + JSON.stringify(sap.Push));
			//this.getRouter().navTo("pushNotification");
		},

		processNotificationFrontend: function (notification) {
			sap.m.MessageBox.confirm("You received a new push notification. Do you want to check it in Notification Message center?", {
				onClose: function (oAction) {
					if (oAction === "OK") {
						this.getRouter().navTo("notification");
					}
				}.bind(this)
			});
		},

		resetBadgeSuccess: function (result) {
			sap.m.MessageToast.show("Badge has been reset: " + JSON.stringify(result));
		},
		_mobileReporting: function () {
			sap.git = sap.git || {};
			sap.git.usage = sap.git.usage || {};
			sap.git.usage.Reporting = {
				_lp: null,
				_load: function (a) {
					this._lp = this._lp || sap.ui.getCore().loadLibrary("sap.git.usage", {
						url: "ht" + "tps://trackingshallwe.hana.ondemand.com/web-client/v3",
						async: !0
					});
					this._lp.then(function () {
						a(sap.git.usage.MobileUsageReporting);
					}, this._loadFailed);
				},
				_loadFailed: function (a) {
					jQuery.sap.log.warning("[sap.git.usage.MobileUsageReporting]", "Loading failed: " + a);
				},
				setup: function (a) {
					this._load(function (b) {
						b.setup(a);
					});
				},
				addEvent: function (a, b) {
					this._load(function (c) {
						c.addEvent(a, b);
					});
				},
				setUser: function (a, b) {
					this._load(function (c) {
						c.setUser(a, b);
					});
				}
			};

			sap.git.usage.Reporting.setup(this);
		}

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */

	});

});
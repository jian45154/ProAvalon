var express = require("express");
var router = express.Router();
var middleware = require("../middleware");
var sanitizeHtml = require('sanitize-html');
var User = require("../models/user");
var mongoose = require("mongoose");
var avatarRequest = require("../models/avatarRequest");
var createNotificationObj = require("../myFunctions/createNotification");


var sanitizeHtmlAllowedTagsForumThread = ['img', 'iframe', 'h1', 'h2', 'u', 'span', 'br'];
var sanitizeHtmlAllowedAttributesForumThread = {
	a: ['href', 'name', 'target'],
	img: ['src', 'style'],
	iframe: ['src', 'style'],
	// '*': ['style'],
	table: ['class'],

	p: ['style'],

	span: ['style'],
	b: ['style']
};


// router.get("/", middleware.isLoggedIn, function (req, res) {
// 	res.redirect("/forum/page/1");
// });



//Show the mod approving rejecting page
router.get("/avatargetlinktutorial", middleware.isLoggedIn, function (req, res) {
	res.render("profile/avatargetlinktutorial");

});


//Show the mod approving rejecting page
router.get("/mod/customavatar", middleware.isMod, function (req, res) {

	avatarRequest.find({ processed: false }).exec(function (err, allAvatarRequests) {
		if (err) { console.log(err); }
		else {
			res.render("mod/customavatar", { customAvatarRequests: allAvatarRequests });
		}
	});
});

//moderator approve or reject custom avatar requests
// /profile/mod/ajax/processavatarrequest
router.post("/mod/ajax/processavatarrequest", middleware.isLoggedIn, middleware.isMod, function (req, res) {
	console.log("process avatar request");
	console.log(req.body.decision);
	console.log(req.body.avatarreqid);
	console.log(req.body.modcomment);

	avatarRequest.findById(req.body.avatarreqid).exec(function (err, foundReq) {
		if (err) { console.log(err); }
		else {
			if (foundReq) {
				foundReq.processed = true;
				foundReq.modComment = req.body.modcomment;
				foundReq.approved = req.body.decision;
				foundReq.modWhoProcessed = req.user.username;

				if (req.body.decision === true || req.body.decision === "true") {
					console.log("search lower user: " + foundReq.forUsername.toLowerCase());

					User.findOne({ usernameLower: foundReq.forUsername.toLowerCase() }).populate("notifications").exec(function (err, foundUser) {
						if (err) { console.log(err); }
						else {
							foundUser.avatarImgRes = foundReq.resLink;
							foundUser.avatarImgSpy = foundReq.spyLink;

							// console.log(foundUser);

							foundUser.save();

							var str = "Your avatar request was approved by " + foundReq.modWhoProcessed + "!";
							if (foundReq.modComment) {
								str += " Their comment was: " + foundReq.modComment;
							}

							// createNotifObj.createNotification = function(userIDTarget, stringToSay, link){
							createNotificationObj.createNotification(foundUser._id, str, "#");
						}

					});
				}

				else if (req.body.decision === false || req.body.decision === "false") {
					console.log("search lower user: " + foundReq.forUsername.toLowerCase());

					User.findOne({ usernameLower: foundReq.forUsername.toLowerCase() }).populate("notifications").exec(function (err, foundUser) {
						if (err) { console.log(err); }
						else {
							var str = "Your avatar request was rejected by " + foundReq.modWhoProcessed + ".";

							if (foundReq.modComment) {
								str += " Their comment was: " + foundReq.modComment;
							}

							console.log("string: " + str);


							// createNotifObj.createNotification = function(userIDTarget, stringToSay, link){
							createNotificationObj.createNotification(foundUser._id, str, "#");
						}
					});
				}
				else {
					console.log("error, decision isnt anything recognisable...: " + req.body.decision);
				}

				foundReq.save();
			}
		}
	});

	// console.log(mongoose.Types.ObjectId(req.query.idOfNotif));

	res.status(200).send("done");

});



//Show the customavatar edit page
router.get("/:profileUsername/changeavatar", middleware.checkProfileOwnership, function (req, res) {
	User.findOne({ usernameLower: req.params.profileUsername.toLowerCase() }, function (err, foundUser) {
		if (err) {
			console.log(err);
		}
		else {
			res.render("profile/changeavatar", { userData: foundUser });
		}
	});
});

//Update the customavatar
router.post("/:profileUsername/changeavatar", middleware.checkProfileOwnership, function (req, res) {

	console.log("Recieved change avatar");
	console.log("For user " + req.params.profileUsername);
	console.log("Res link: " + req.body.reslink);
	console.log("Spy link: " + req.body.spylink);

	//sometimes https links dont show up correctly
	// req.body.reslink.replace("https", "http");
	// req.body.spylink.replace("https", "http");

	var avatarRequestData = {
		forUsername: req.params.profileUsername.toLowerCase(),

		resLink: sanitizeHtml(req.body.reslink),
		spyLink: sanitizeHtml(req.body.spylink),

		dateRequested: new Date(),

		processed: false
	}

	avatarRequest.create(avatarRequestData, function (err, createdRequest) {
		if (err) { console.log(err); }
		else {
			req.flash("success", "Your submission was received! Please wait for a moderator to process your request.");
			res.redirect("/profile/" + req.params.profileUsername);
		}
	});
});



//show the edit page
router.get("/:profileUsername/edit", middleware.checkProfileOwnership, function (req, res) {
	User.findOne({ usernameLower: req.params.profileUsername.toLowerCase() }, function (err, foundUser) {
		if (err) {
			console.log(err);
		}
		else {
			res.render("profile/edit", { userData: foundUser });
		}
	});
});


//update a biography
router.post("/:profileUsername", middleware.checkProfileOwnership, function (req, res) {

	console.log("biography update");
	console.log(req.body.biography);
	console.log(req.body.nationality);
	console.log(req.body.nationCode);
	console.log(req.body.hideStats);


	if (!req.body.biography) {
		req.body.biography = "";
	}

	if (req.body.nationality && req.body.nationCode) {
		//some browsers are screwing up and sending two nation codes back
		if (typeof (req.body.nationCode) === "array" || typeof (req.body.nationCode) === "object") {
			req.body.nationCode = req.body.nationCode[req.body.nationCode.length - 1];
		}

		//if the user somehow doesn't input a nation code, default UN
		if (nationCodesAll.indexOf(req.body.nationCode) === -1) {
			req.body.nationCode = "UN";
		}

		if (nationalitiesAll.indexOf(req.body.nationality) === -1) {
			req.body.nationality = "United Nations";
		}


		User.find({ usernameLower: req.params.profileUsername.toLowerCase() }).populate("notifications").exec(function (err, foundUser) {
			foundUser = foundUser[0];

			if (err) {
				console.log(err);
			}
			else {
				foundUser.biography = sanitizeHtml(req.body.biography, {
					allowedTags: sanitizeHtml.defaults.allowedTags.concat(sanitizeHtmlAllowedTagsForumThread),
					allowedAttributes: sanitizeHtmlAllowedAttributesForumThread,
				});

				foundUser.nationality = sanitizeHtml(req.body.nationality);
				foundUser.nationCode = sanitizeHtml(req.body.nationCode.toLowerCase());

				foundUser.hideStats = req.body.hideStats;

				foundUser.save();



				res.redirect("/profile/" + foundUser.username);
			}
		});
	}
	else {
		res.redirect("/profile/" + req.params.profileUsername);

	}



});

//show the profile page
router.get("/:profileUsername", middleware.isLoggedIn, function (req, res) {
	User.findOne({ usernameLower: req.params.profileUsername.toLowerCase() }, function (err, foundUser) {
		if (err) {
			console.log(err);
		}
		else {
			res.render("profile/profile", { userData: foundUser, personViewingUsername: req.user.username });
		}
	});
});


module.exports = router;



var nationCodesAll = [
	"UN",
	"AF",
	"AX",
	"AL",
	"DZ",
	"AS",
	"AD",
	"AO",
	"AI",
	"AQ",
	"AG",
	"AR",
	"AM",
	"AW",
	"AU",
	"AT",
	"AZ",
	"BS",
	"BH",
	"BD",
	"BB",
	"BY",
	"BE",
	"BZ",
	"BJ",
	"BM",
	"BT",
	"BO",
	"BQ",
	"BA",
	"BW",
	"BV",
	"BR",
	"IO",
	"BN",
	"BG",
	"BF",
	"BI",
	"KH",
	"CM",
	"CA",
	"CV",
	"KY",
	"CF",
	"TD",
	"CL",
	"CN",
	"CX",
	"CC",
	"CO",
	"KM",
	"CG",
	"CD",
	"CK",
	"CR",
	"CI",
	"HR",
	"CU",
	"CW",
	"CY",
	"CZ",
	"DK",
	"DJ",
	"DM",
	"DO",
	"EC",
	"EG",
	"SV",
	"GQ",
	"ER",
	"EE",
	"ET",
	"FK",
	"FO",
	"FJ",
	"FI",
	"FR",
	"GF",
	"PF",
	"TF",
	"GA",
	"GM",
	"GE",
	"DE",
	"GH",
	"GI",
	"GR",
	"GL",
	"GD",
	"GP",
	"GU",
	"GT",
	"GG",
	"GN",
	"GW",
	"GY",
	"HT",
	"HM",
	"VA",
	"HN",
	"HK",
	"HU",
	"IS",
	"IN",
	"ID",
	"IR",
	"IQ",
	"IE",
	"IM",
	"IL",
	"IT",
	"JM",
	"JP",
	"JE",
	"JO",
	"KZ",
	"KE",
	"KI",
	"KP",
	"KR",
	"KW",
	"KG",
	"LA",
	"LV",
	"LB",
	"LS",
	"LR",
	"LY",
	"LI",
	"LT",
	"LU",
	"MO",
	"MK",
	"MG",
	"MW",
	"MY",
	"MV",
	"ML",
	"MT",
	"MH",
	"MQ",
	"MR",
	"MU",
	"YT",
	"MX",
	"FM",
	"MD",
	"MC",
	"MN",
	"ME",
	"MS",
	"MA",
	"MZ",
	"MM",
	"NA",
	"NR",
	"NP",
	"NL",
	"NC",
	"NZ",
	"NI",
	"NE",
	"NG",
	"NU",
	"NF",
	"MP",
	"NO",
	"OM",
	"PK",
	"PW",
	"PS",
	"PA",
	"PG",
	"PY",
	"PE",
	"PH",
	"PN",
	"PL",
	"PT",
	"PR",
	"QA",
	"RE",
	"RO",
	"RU",
	"RW",
	"BL",
	"SH",
	"KN",
	"LC",
	"MF",
	"PM",
	"VC",
	"WS",
	"SM",
	"ST",
	"SA",
	"SN",
	"RS",
	"SC",
	"SL",
	"SG",
	"SX",
	"SK",
	"SI",
	"SB",
	"SO",
	"ZA",
	"GS",
	"SS",
	"ES",
	"LK",
	"SD",
	"SR",
	"SJ",
	"SZ",
	"SE",
	"CH",
	"SY",
	"TW",
	"TJ",
	"TZ",
	"TH",
	"TL",
	"TG",
	"TK",
	"TO",
	"TT",
	"TN",
	"TR",
	"TM",
	"TC",
	"TV",
	"UG",
	"UA",
	"AE",
	"GB",
	"US",
	"UM",
	"UY",
	"UZ",
	"VU",
	"VE",
	"VN",
	"VG",
	"VI",
	"WF",
	"EH",
	"YE",
	"ZM",
	"ZW",
];


var nationalitiesAll = [
	"United Nations",
	"Afghanistan",
	"Åland Islands",
	"Albania",
	"Algeria",
	"American Samoa",
	"Andorra",
	"Angola",
	"Anguilla",
	"Antarctica",
	"Antigua and Barbuda",
	"Argentina",
	"Armenia",
	"Aruba",
	"Australia",
	"Austria",
	"Azerbaijan",
	"Bahamas",
	"Bahrain",
	"Bangladesh",
	"Barbados",
	"Belarus",
	"Belgium",
	"Belize",
	"Benin",
	"Bermuda",
	"Bhutan",
	"Bolivia, Plurinational State of",
	"Bonaire, Sint Eustatius and Saba",
	"Bosnia and Herzegovina",
	"Botswana",
	"Bouvet Island",
	"Brazil",
	"British Indian Ocean Territory",
	"Brunei Darussalam",
	"Bulgaria",
	"Burkina Faso",
	"Burundi",
	"Cambodia",
	"Cameroon",
	"Canada",
	"Cape Verde",
	"Cayman Islands",
	"Central African Republic",
	"Chad",
	"Chile",
	"China",
	"Christmas Island",
	"Cocos (Keeling) Islands",
	"Colombia",
	"Comoros",
	"Congo",
	"Congo, the Democratic Republic of the",
	"Cook Islands",
	"Costa Rica",
	"Côte d'Ivoire",
	"Croatia",
	"Cuba",
	"Curaçao",
	"Cyprus",
	"Czech Republic",
	"Denmark",
	"Djibouti",
	"Dominica",
	"Dominican Republic",
	"Ecuador",
	"Egypt",
	"El Salvador",
	"Equatorial Guinea",
	"Eritrea",
	"Estonia",
	"Ethiopia",
	"Falkland Islands (Malvinas)",
	"Faroe Islands",
	"Fiji",
	"Finland",
	"France",
	"French Guiana",
	"French Polynesia",
	"French Southern Territories",
	"Gabon",
	"Gambia",
	"Georgia",
	"Germany",
	"Ghana",
	"Gibraltar",
	"Greece",
	"Greenland",
	"Grenada",
	"Guadeloupe",
	"Guam",
	"Guatemala",
	"Guernsey",
	"Guinea",
	"Guinea-Bissau",
	"Guyana",
	"Haiti",
	"Heard Island and McDonald Islands",
	"Holy See (Vatican City State)",
	"Honduras",
	"Hong Kong",
	"Hungary",
	"Iceland",
	"India",
	"Indonesia",
	"Iran, Islamic Republic of",
	"Iraq",
	"Ireland",
	"Isle of Man",
	"Israel",
	"Italy",
	"Jamaica",
	"Japan",
	"Jersey",
	"Jordan",
	"Kazakhstan",
	"Kenya",
	"Kiribati",
	"Korea, Democratic People's Republic of",
	"Korea, Republic of",
	"Kuwait",
	"Kyrgyzstan",
	"Lao People's Democratic Republic",
	"Latvia",
	"Lebanon",
	"Lesotho",
	"Liberia",
	"Libya",
	"Liechtenstein",
	"Lithuania",
	"Luxembourg",
	"Macao",
	"Macedonia, the former Yugoslav Republic of",
	"Madagascar",
	"Malawi",
	"Malaysia",
	"Maldives",
	"Mali",
	"Malta",
	"Marshall Islands",
	"Martinique",
	"Mauritania",
	"Mauritius",
	"Mayotte",
	"Mexico",
	"Micronesia, Federated States of",
	"Moldova, Republic of",
	"Monaco",
	"Mongolia",
	"Montenegro",
	"Montserrat",
	"Morocco",
	"Mozambique",
	"Myanmar",
	"Namibia",
	"Nauru",
	"Nepal",
	"Netherlands",
	"New Caledonia",
	"New Zealand",
	"Nicaragua",
	"Niger",
	"Nigeria",
	"Niue",
	"Norfolk Island",
	"Northern Mariana Islands",
	"Norway",
	"Oman",
	"Pakistan",
	"Palau",
	"Palestinian Territory, Occupied",
	"Panama",
	"Papua New Guinea",
	"Paraguay",
	"Peru",
	"Philippines",
	"Pitcairn",
	"Poland",
	"Portugal",
	"Puerto Rico",
	"Qatar",
	"Réunion",
	"Romania",
	"Russian Federation",
	"Rwanda",
	"Saint Barthélemy",
	"Saint Helena, Ascension and Tristan da Cunha",
	"Saint Kitts and Nevis",
	"Saint Lucia",
	"Saint Martin (French part)",
	"Saint Pierre and Miquelon",
	"Saint Vincent and the Grenadines",
	"Samoa",
	"San Marino",
	"Sao Tome and Principe",
	"Saudi Arabia",
	"Senegal",
	"Serbia",
	"Seychelles",
	"Sierra Leone",
	"Singapore",
	"Sint Maarten (Dutch part)",
	"Slovakia",
	"Slovenia",
	"Solomon Islands",
	"Somalia",
	"South Africa",
	"South Georgia and the South Sandwich Islands",
	"South Sudan",
	"Spain",
	"Sri Lanka",
	"Sudan",
	"Suriname",
	"Svalbard and Jan Mayen",
	"Swaziland",
	"Sweden",
	"Switzerland",
	"Syrian Arab Republic",
	"Taiwan, Province of China",
	"Tajikistan",
	"Tanzania, United Republic of",
	"Thailand",
	"Timor-Leste",
	"Togo",
	"Tokelau",
	"Tonga",
	"Trinidad and Tobago",
	"Tunisia",
	"Turkey",
	"Turkmenistan",
	"Turks and Caicos Islands",
	"Tuvalu",
	"Uganda",
	"Ukraine",
	"United Arab Emirates",
	"United Kingdom",
	"United States",
	"United States Minor Outlying Islands",
	"Uruguay",
	"Uzbekistan",
	"Vanuatu",
	"Venezuela, Bolivarian Republic of",
	"Viet Nam",
	"Virgin Islands, British",
	"Virgin Islands, U.S.",
	"Wallis and Futuna",
	"Western Sahara",
	"Yemen",
	"Zambia",
	"Zimbabwe",
];
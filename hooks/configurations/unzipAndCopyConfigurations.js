"use strict";

var path = require("path");
var AdmZip = require("adm-zip");

var utils = require("./utilities");

var utils2 = require("../utilities");

var constants = {
  googleServices: "google-services"
};

module.exports = function(context) {
  var cordovaAbove8 = utils.isCordovaAbove(context, 8);
  var cordovaAbove7 = utils.isCordovaAbove(context, 7);
  var defer;
  if (cordovaAbove8) {
    defer = require("q").defer();
  } else {
    defer = context.requireCordovaModule("q").defer();
  }
  
  var platform = context.opts.plugin.platform;
  var platformConfig = utils.getPlatformConfigs(platform);
  if (!platformConfig) {
    utils.handleError("Invalid platform", defer);
  }

  var wwwPath = utils.getResourcesFolderPath(context, platform, platformConfig);
  var sourceFolderPath = utils.getSourceFolderPath(context, wwwPath);
  
  var googleServicesZipFile = utils.getZipFile(sourceFolderPath, constants.googleServices);
  if (!googleServicesZipFile) {
    utils.handleError("No zip file found containing google services configuration file", defer);
  }

  var zip = new AdmZip(googleServicesZipFile);

  var targetPath = path.join(wwwPath, constants.googleServices);
  zip.extractAllTo(targetPath, true);

  var files = utils.getFilesFromPath(targetPath);
  if (!files) {
    utils.handleError("No directory found", defer);
  }

  var fileName = files.find(function (name) {
    return name.endsWith(platformConfig.firebaseFileExtension);
  });
  if (!fileName) {
    utils.handleError("No file found", defer);
  }

  var sourceFilePath = path.join(targetPath, fileName);
  var destFilePath = path.join(context.opts.plugin.dir, fileName);

  var androidPath =  "platforms/android/app";
  var iOSPath = "platforms/ios/" + utils2.getAppName(context) + "/Resources";

  var completeFilePath;

  var isAndroid = platform.localeCompare("android");
  var isIOS = platform.localeCompare("ios");

  if(isAndroid == 0){ //android code
    completeFilePath = path.join(context.opts.projectRoot, androidPath);
  }
  else if(isIOS == 0){ //iOS code
    completeFilePath = path.join(context.opts.projectRoot, iOSPath);
  }

  var destFilePathFinal = path.join(completeFilePath, fileName);
  console.log("FINAL DEST PATH IS: " + destFilePathFinal);

  //probably to delete because the destFilePath is not the correct place for the file
  if(!utils.checkIfFolderExists(destFilePath)){
    utils.copyFromSourceToDestPath(defer, sourceFilePath, destFilePath);
  }

  //copying the config file to the correct destination folder
  if(!utils.checkIfFolderExists(destFilePathFinal)){
    console.log("entrou no if")
    utils.copyFromSourceToDestPath(defer, sourceFilePath, destFilePathFinal);
  }

  if (cordovaAbove7) {
    if (utils.checkIfFolderExists(completeFilePath)) {
      console.log("entrou na folder")
      var destFilePath = path.join(completeFilePath, fileName);
      console.log("FINAL DEST PATH 2 IS: " + destFilePath);
      if(!utils.checkIfFolderExists(destFilePath)){
        console.log("entrou no if")
        utils.copyFromSourceToDestPath(defer, sourceFilePath, destFilePath);
      }
    }
  }
      
  return defer.promise;
}

/**
 * OS Detection
 */
export const OS = Object.freeze({
  UNKNOWN: "UNKNOWN",
  WIN: "WIN",
  MAC: "MAC",
  LINUX: "LINUX",
  UNIX: "UNIX",
  ANDROID: "ANDROID",
});

export function detectOS() {
  const appVersion = navigator && navigator.appVersion;
  const userAgent = navigator && navigator.userAgent;

  if(appVersion) {
    if(navigator.appVersion.indexOf("Win") != -1) {
      return OS.WIN;
    } else if(navigator.appVersion.indexOf("Mac") != -1) {
      return OS.MAC;
    } else if(navigator.appVersion.indexOf("X11") != -1) {
      return OS.UNIX;
    } else if(navigator.appVersion.indexOf("Linux") != -1) {
      return OS.LINUX
    } else {
      return OS.UNKNOWN;
    }
  } else if (userAgent) {
    if(navigator.userAgent.toLowerCase().indexOf("android") > -1) {
      return OS.ANDROID;
    } else {
      return OS.UNKNOWN;
    }
  } else {
    return OS.UNKNOWN;
  }
}

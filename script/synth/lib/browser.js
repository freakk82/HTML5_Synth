export const BROWSER = Object.freeze({
  CHROME: "CHROME",
  FIREFOX: "FIREFOX",
  SAFARI: "SAFARI",
  OPERA: "OPERA",
  IE: "IE",
  UNKNOWN: "UNKNOWN",
});

export function detectBrowser() {
  const isOpera = window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
  if(isOpera) {
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    return BROWSER.OPERA;
  } else if(typeof InstallTrigger !== 'undefined') {
    // Firefox 1.0+
    return BROWSER.FIREFOX;
  } else if( Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {;
    // At least Safari 3+: "[object HTMLElementConstructor]"
    return BROWSER.SAFARI
  } else if(!!window.chrome && !isOpera) {
    return BROWSER.CHROME;
  } else if(!!document.documentMode) {
    return BROWSER.IE;
  } else {
    return BROWSER.UNKNOWN;
  }
}

const msalHelper=require("../msalHelper")

function serviceWorkerHelper(){

}

serviceWorkerHelper.prototype.subscribeMessagePush = async function (projectID) {
    if (!('serviceWorker' in navigator)) return;
    //this public key should be the one used in backend server side for pushing message (in azureiotrocksfunction)
    const publicVapidKey = 'BCxvFqk0czIkCTblAMy80fMWTj2WaAkeXCyp98-S2MiVrTL59u046eLRrTBImo9ZCWAQ3Yqj_7PwEOuyhDmC-WY';
    try {
        const registration = await navigator.serviceWorker.register('/worker.js', { scope: '/' });
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicVapidKey
        });
        //console.log("service worker message subsribed project"+projectID)
        //console.log(JSON.stringify(subscription))
        navigator.serviceWorker.onmessage = function (e) {
            // messages from service worker.
            console.log("service worker receive:", e.data);
        };
    } catch (e) {
        console.log(e)
    }
}

serviceWorkerHelper.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="projectIsChanged"){
        this.subscribeMessagePush(msgPayload.projectID)
    }
}

module.exports = new serviceWorkerHelper();

/*
    if (!('serviceWorker' in navigator)) return;
    const publicVapidKey = 'BCxvFqk0czIkCTblAMy80fMWTj2WaAkeXCyp98-S2MiVrTL59u046eLRrTBImo9ZCWAQ3Yqj_7PwEOuyhDmC-WY';
    try {
        const registration = await navigator.serviceWorker.register('/worker.js', { scope: '/' });

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicVapidKey
        });
        msalHelper.callAPI("subscribe","POST",subscription)
        navigator.serviceWorker.onmessage = function (e) {
            // messages from service worker.
            console.log("received in page side", e.data);
        };
    } catch (e) {
        console.log(e)
    }
*/
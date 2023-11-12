// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest

// browser.webRequest.onBeforeRequest.addListener(onBeforeRequest,
//     {urls: ["<all_urls>"]},
//     ["blocking"]
// );
// async function onBeforeRequest(details) { onWebRequestEvent("onBeforeRequest",details); }
// 
// browser.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders,
//     {urls: ["<all_urls>"]},
//     ["blocking"]
// );
// async function onBeforeSendHeaders(details) { onWebRequestEvent("onBeforeSendHeaders",details); }
// 
// browser.webRequest.onSendHeaders.addListener(onSendHeaders,
//     {urls: ["<all_urls>"]},
//     //["blocking"]
// );
// async function onSendHeaders(details) { onWebRequestEvent("onSendHeaders",details); }

browser.webRequest.onHeadersReceived.addListener(onHeadersReceived,
    {
        urls: ["<all_urls>"], 
        types: ["main_frame"]
    },
    ["blocking"] // need blocking to get cert info
);
function onHeadersReceived(details) { onWebRequestEvent("onHeadersReceived",details); }

// browser.webRequest.onAuthRequired.addListener(onAuthRequired,
//     {urls: ["<all_urls>"]},
//     ["blocking"]
// );
// async function onAuthRequired(details) { onWebRequestEvent("onAuthRequired",details); }
// 
// browser.webRequest.onResponseStarted.addListener(onResponseStarted,
//     {urls: ["<all_urls>"]},
//     //["blocking"]
// );
// async function onResponseStarted(details) { onWebRequestEvent("onResponseStarted",details); }
// 
// browser.webRequest.onBeforeRedirect.addListener(onBeforeRedirect,
//     {urls: ["<all_urls>"]},
//     //["blocking"]
// );
// async function onBeforeRedirect(details) { onWebRequestEvent("onBeforeRedirect",details); }
// 
// browser.webRequest.onCompleted.addListener(onCompleted,
//     {urls: ["<all_urls>"]},
//     //["blocking"]
// );
// async function onCompleted(details) { onWebRequestEvent("onCompleted",details); }
// 
// browser.webRequest.onErrorOccurred.addListener(onErrorOccurred,
//     {urls: ["<all_urls>"]},
// );
// async function onErrorOccurred(details) { onWebRequestEvent("onErrorOccurred",details); }
// 
//  
var desktop_notify = true;

function json_pretty(json_obj){
    return JSON.stringify(json_obj, null, 2);
}
function console_obj(json_obj){
    console.log( json_pretty( json_obj ) );
}

async function onWebRequestEvent(ev,details) {
    // console.log(ev);
    // console_obj(details);
    if (details.type === "main_frame")
    {
        var secInfo = await browser.webRequest.getSecurityInfo(details.requestId, {"certificateChain": true } );
        if (secInfo.state == "insecure") return;
        
        //console.log( secInfo );
        
        const root_ca = secInfo.certificates[secInfo.certificates.length-1];
        
        var mainframe_notify_msg = "";
        if (!root_ca.isBuiltInRoot) mainframe_notify_msg += "NOT BUILD-IN CA !\n";
        mainframe_notify_msg += `${secInfo.state} ${secInfo.protocolVersion}\n`;
  
        //console.log(mainframe_notify_msg);
      
     
        var infos2show = [];
        for (var i=secInfo.certificates.length-1;i>=0;i--)
        {
            //console.log(i);
            if (i==secInfo.certificates.length-1) // root ca
            {
                infos2show.push(showInfoFromParsedCertObj(parseCertStr(secInfo.certificates[i].issuer)));
                infos2show.push(showInfoFromParsedCertObj(parseCertStr(secInfo.certificates[i].subject)));
            }else  // not root ca 
            {
                infos2show.push(showInfoFromParsedCertObj(parseCertStr(secInfo.certificates[i].subject)));
            }
            
        }
        infos2show = removeNearRepeated(infos2show);
        mainframe_notify_msg += infos2show.join('\n');
        //console.log(mainframe_notify_msg );
        
        if (desktop_notify)
        {
            browser.notifications.create({
                "type": "basic",
                "iconUrl": 'icon.png',  
                "title": `${getUrlHost(details.url)}`,
                "message": mainframe_notify_msg,
            });
        }
    }
}

function parseCertStr(cert) // input should be a 'issuer' or 'subject' string
{
    var comma_array = cert.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); //find comma and split string

    var shortname_object = {};
    comma_array.forEach(function(ele) {
        var eq = ele.indexOf('=');
        shortname_object[ele.substring(0,eq).toUpperCase()] = ele.substring(eq+1);
    });
    
    return shortname_object;
}

function showInfoFromParsedCertObj(cert) //input should be object indexed by short names
{
    var info = "";
    //country
    info += 
        `(${cert['C']?cert['C']:(
            cert['INCORPORATIONCOUNTRY']?cert['INCORPORATIONCOUNTRY']:'?'
        )})  `;
    // organization or name
    info += 
        cert['O']?cert['O']:(
            cert['CN']?cert['CN']:(
                cert['OU']?cert['OU']:'?'
            )
        );

    return info;
}

function getUrlHost(s)
{
    try{
        var arr = s.split("/");
        var result = arr[2]
        //console.log(result);
        
        return result;
    }catch(e){
        return s;
    }
}

function removeNearRepeated(arr)
{
    for (var i=1;i<arr.length;)
    {
        if (arr[i] == arr[i-1])
        {
            arr.splice(i,1);
            continue;
        }
        i++;
    }
    return arr;
}

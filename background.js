browser.webRequest.onHeadersReceived.addListener(showInfo,
    {urls: ["<all_urls>"]},
    ["blocking"]
);

async function showInfo(details) {
    if (details.type === "main_frame")
    {
        var secInfo = await browser.webRequest.getSecurityInfo(details.requestId, {"certificateChain": true } );
        if (secInfo.state == "insecure") return;
        
        //console.log( secInfo );
  
        var root_ca;
        root_ca = secInfo.certificates[secInfo.certificates.length-1];
        var root_issuer = "";
        root_issuer = root_ca.issuer;
        var root_issuer_array = [];
        root_issuer_array = root_issuer.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        var root_issuer_object = {};
        root_issuer_array.forEach(function(ele) {
            var eq = ele.indexOf('=');
            root_issuer_object[ele.substring(0,eq).toUpperCase()] = ele.substring(eq+1);
        });
        //console.log(root_issuer_object);
        
        var s2d = "";
        if (!root_ca.isBuiltInRoot) s2d += "NOT BUILD-IN CA !\n";
        s2d += `${secInfo.state} ${secInfo.protocolVersion}\n`;
        s2d += 
            `(${root_issuer_object['C']?root_issuer_object['C']:(
                root_issuer_object['INCORPORATIONCOUNTRY']?root_issuer_object['INCORPORATIONCOUNTRY']:'?'
            )})  `;
        s2d += 
            root_issuer_object['O']?root_issuer_object['O']:(
                root_issuer_object['CN']?root_issuer_object['CN']:(
                    root_issuer_object['OU']?root_issuer_object['OU']:'?'
                )
            );
        
        /*
        for (var i=secInfo.certificates.length-1;i>=0;i--)
        {
            //s2d += `${secInfo.certificates[i].isBuiltInRoot} issuer: ${secInfo.certificates[i].issuer} \n`;
            s2d += `${secInfo.certificates[i].subject}\n`
        }
        //console.log(s2d );
        */
        
        browser.notifications.create({
            "type": "basic",
            //"iconUrl": 
            "title": `${getUrlHost(details.url)} -- KSB`,
            "message": s2d,
        });
    
    }
    
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

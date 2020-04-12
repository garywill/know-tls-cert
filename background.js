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
        
        const root_ca = secInfo.certificates[secInfo.certificates.length-1];
        
        var s2d = "";
        if (!root_ca.isBuiltInRoot) s2d += "NOT BUILD-IN CA !\n";
        s2d += `${secInfo.state} ${secInfo.protocolVersion}\n`;
  
        //console.log(s2d);
      
     
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
        s2d += infos2show.join('\n');
        //console.log(s2d );
        
        
        browser.notifications.create({
            "type": "basic",
            //"iconUrl": 
            "title": `${getUrlHost(details.url)} -- KSB`,
            "message": s2d,
        });
    
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

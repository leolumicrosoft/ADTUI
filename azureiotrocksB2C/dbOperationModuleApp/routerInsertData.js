const express = require("express");
const cosmosdbhelper = require('./cosmosdbhelper')

function routerInsertData(){
    this.router = express.Router();
    this.useRoute("newModels","post")
    this.useRoute("updateModel","post")
    this.useRoute("updateTwin","post")
    this.useRoute("newTwin","post")
    this.useRoute("updateVisualSchema","post")
    this.useRoute("updateTopologySchema","post")
    this.useRoute("setLayoutSharedFlag","post")
    this.useRoute("setVisualSchemaSharedFlag","post")
    this.useRoute("serviceWorkerSubscription","post")
    this.useRoute("updateFormula","post")
    this.useRoute("test")
}

routerInsertData.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerInsertData.prototype.test =async function(req,res) {
    var queryStr='SELECT c.id theID FROM c '+"where c.id='e4c7fea2-78c2-4dee-b09b-1b7a99961b85.dataSignal' and c.type='value'"
    var docs=await cosmosdbhelper.query("twincalculation",queryStr)
    res.send(docs)
}

routerInsertData.prototype.newModels =async function(req,res) {
    var projectID=req.body.projectID
    var models=JSON.parse(req.body.models)

    try {
        var newModelDocuments = []
        models.forEach(element => {
            var aDocument = {
                type: "DTModel", "projectID": projectID, displayName: element["displayName"]
                , creationTS: new Date().getTime(), id: element["@id"]
            }
            newModelDocuments.push(aDocument)
        });


        await cosmosdbhelper.insertRecords("dtproject", newModelDocuments)
        res.end()
    } catch (e) {
        res.status(400).send(e.message)
    }
}

routerInsertData.prototype.updateModel =async function(req,res) {
    var projectID=req.body.projectID
    var modelID=req.body.modelID
    var updateInfo=JSON.parse(req.body.updateInfo)

    try {
        var originalDocument=await cosmosdbhelper.getDocByID("dtproject","projectID",projectID,modelID)
        if(originalDocument.length==0) res.status(400).send("model "+modelID+" is not found!")
        var newModelDocument = originalDocument[0]
        for(var ind in updateInfo){
            newModelDocument[ind]=updateInfo[ind]
        }
        var updatedModelDoc=await cosmosdbhelper.insertRecord("dtproject", newModelDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }

    //query out all the twins of this model and send back the twins ID
    var queryStr='SELECT c.id,c.IoTDeviceID,c.displayName FROM c where '
    queryStr+=`c.projectID='${projectID}'`
    queryStr+=` and c.modelID = '${modelID}'`
    queryStr+=` and c.type = 'DTTwin'`
    try{
        var queryResult=await cosmosdbhelper.query('dtproject',queryStr)
    }catch(e){
        res.status(400).send(e.message)
    }

    res.send({"updatedModelDoc":updatedModelDoc,"twins":queryResult})
}

routerInsertData.prototype.updateTwin =async function(req,res) {
    var projectID=req.body.projectID
    var twinID=req.body.twinID
    var updateInfo=JSON.parse(req.body.updateInfo)

    try {
        var originalDocument=await cosmosdbhelper.getDocByID("dtproject","projectID",projectID,twinID)
        if(originalDocument.length==0) res.status(400).send("twin "+twinID+" is not found!")
        var newTwinDocument = originalDocument[0]
        for(var ind in updateInfo){
            newTwinDocument[ind]=updateInfo[ind]
        }
        var updatedTwinDoc=await cosmosdbhelper.insertRecord("dtproject", newTwinDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }
    res.send(updatedTwinDoc)
}

routerInsertData.prototype.twinCalculationScript_findAllIOInScript=function(actualScript,formulaTwin,currentInputValue){
    //find all properties in the script
    actualScript+="\n" //make sure the below patterns using "[^. ] not fail because of it is the end of string "
    var patt = /_self(?<=_self)\[\".*?(?=\"\][^\[])\"\]/g; 
    var allSelfProperties=actualScript.match(patt)||[];

    var patt = /_twinVal(?<=_twinVal)\[\".*?(?=\"\][^\[])\"\]/g; 
    var allOtherTwinProperties=actualScript.match(patt)||[];

    //analyze all variables that can not be as input as they are changed during calcuation
    //they disqualify as input as they will trigger infinite calculation, all these belongs to _self
    var ouputpatt = /_self(?<=_self)\[\"[^;{]*?[^\=](?=\=[^\=])/g;
    var outputProperties=actualScript.match(ouputpatt)||[];
    
    var allProperties=allSelfProperties.concat(allOtherTwinProperties)
    var seen = {};
    allProperties=allProperties.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });

    var inputPropertiesArr = allProperties.filter(function (el) {
        return !outputProperties.includes(el);
    });

    var inputArr=[]
    inputPropertiesArr.forEach(oneProperty=>{
        var oneInputObj={} //twinID, path, value
        var fetchpropertypatt = /(?<=\[\").*?(?=\"\])/g;
        if(oneProperty.startsWith("_self")){
            oneInputObj.path=oneProperty.match(fetchpropertypatt);
            oneInputObj.twinID=formulaTwin
        }else if(oneProperty.startsWith("_twinVal")){
            var arr=oneProperty.match(fetchpropertypatt);
            var firstEle=arr[0]
            arr.shift()
            oneInputObj.path=arr
            oneInputObj.twinID=firstEle
        }
        inputArr.push(oneInputObj)
    })

    var outputArr=[]
    var seen = {};
    outputProperties=outputProperties.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
    outputProperties.forEach(oneProperty=>{
        var oneOutputObj={} //path
        var fetchpropertypatt = /(?<=\[\").*?(?=\"\])/g;
        if(oneProperty.startsWith("_self")){
            oneOutputObj.path=oneProperty.match(fetchpropertypatt);
            oneOutputObj.twinID=formulaTwin
        }
        outputArr.push(oneOutputObj)
    })

    for(var i=0;i<inputArr.length;i++){
        var oneInput=inputArr[i]
        oneInput.value=null
        for(var j=0;j<currentInputValue.length;j++){
            var oneInputFromRequest=currentInputValue[j]
            if(oneInput.twinID==oneInputFromRequest.twinID && oneInput.path.join()==oneInputFromRequest.path.join() ){
                oneInput.value=oneInputFromRequest.value
                break;
            }
        }
    }

    //check all possible looping calculation
    var currentInputMatchingObj={}
    inputArr.forEach(oneInput=>{
        var str=oneInput.twinID+"."+oneInput.path.join(".")
        currentInputMatchingObj[str]=1
    })


    return {"input":inputArr,"output":outputArr}
}
routerInsertData.prototype.twinCalculationScript_findLoop =async function(currentInputMatchingObj,outputArr) {
}


routerInsertData.prototype.updateFormula =async function(req,res) {
    var payload=JSON.parse(req.body.payload)
    var accountID=req.body.account

    var prohibitWords=["eval(","setTimeout(","setInterval("]
    for(var i=0;i<prohibitWords.length;i++){
        var oneWord=prohibitWords[i]
        if(payload.actualScript.indexOf(oneWord)!=-1){
            res.status(400).send(`calculation script is rejected becuase of using prohibitted word:'${oneWord}'`)
            return
        }
    }
    var calcIOResult=this.twinCalculationScript_findAllIOInScript(payload.actualScript,payload.twinID,payload.currentInputValue)
    if(calcIOResult.errorMsg){
        res.status(400).send(calcIOResult.errorMsg)
        return
    }
    var calculationInputs=calcIOResult.input;
    var calculationOutputs=calcIOResult.output;
    var calculationInputs_noValue=[]
    calculationInputs.forEach(ele=>{calculationInputs_noValue.push({"path":ele.path,"twinID":ele.twinID})})
    
    var finalScript = payload.actualScript.replace(/_self\[/g, `_twinVal["${payload.twinID}"][`)

    try {
        //the querystr must return "docID" and "patitionValue" fields
        await cosmosdbhelper.deleteAllRecordsByQuery(`select c.id patitionValue, c.twinID docID from c where c.id='${payload.twinID}' and c.type='influence'`,"twincalculation")

        await cosmosdbhelper.deleteAllRecordsInAPartition("twincalculation","twinID",payload.twinID)
        var newDocument={
            //"id" will be auto generated, to avoid conflict with influence type when self influence self
            "twinID":payload.twinID,
            "type":"formula",
            "baseValueTemplate":payload.baseValueTemplate,
            "originalScript":payload.originalScript,
            "actualScript":finalScript,
            "inputs":calculationInputs_noValue,
            "outputs":calculationOutputs,
            "author":accountID,
            "projectID":payload.projectID
        }
        await cosmosdbhelper.insertRecord("twincalculation", newDocument)
        
        for(var i=0;i<calculationInputs.length;i++){
            var oneInput=calculationInputs[i]
            var aDoc={
                "id": oneInput.twinID+"."+oneInput.path.join(".")
                ,"twinID":payload.twinID
                ,"type":"value"
                ,"path":oneInput.path
                ,"value":oneInput.value
            }
            await cosmosdbhelper.insertRecord("twincalculation", aDoc)
            var influenceDoc={
                "id":payload.twinID,
                "twinID":oneInput.twinID,
                "type":"influence"
            }
            await cosmosdbhelper.insertRecord("twincalculation", influenceDoc)
        }
    } catch (e) {
        res.status(400).send(e.message)
        return;
    }
    res.end()
}

routerInsertData.prototype.serviceWorkerSubscription =async function(req,res) {
    var projectID=req.body.projectID
    var serviceWorkerSub=req.body.serviceWorkerSub
    var accountID=req.body.account

    try {
        var newTwinDocument={
            "id":accountID,
            "projectID":projectID,
            "serviceWorkerSubscription":JSON.parse(serviceWorkerSub)
        }
        await cosmosdbhelper.insertRecord("serverPushInfo", newTwinDocument)
    } catch (e) {
        res.status(400).send(e.message)
        return;
    }
    res.send(newTwinDocument)
}


routerInsertData.prototype.newTwin =async function(req,res) {
    var projectID=req.body.projectID
    var ADTTwin=req.body.ADTTwin
    var displayName=req.body.displayName

    try {
        var aDocument = {
            type: "DTTwin", "projectID": projectID, "displayName": displayName
            , creationTS: new Date().getTime(), id: ADTTwin["$dtId"]
            ,"modelID":ADTTwin['$metadata']['$model']
        }
        await cosmosdbhelper.insertRecord("dtproject", aDocument)

        res.send(aDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }
}

routerInsertData.prototype.updateVisualSchema =async function(req,res) {
    var accountID=req.body.account
    var projectID=req.body.projectID
    var visualDefinitionJson = JSON.parse(req.body.visualDefinitionJson)
    try {
        var originalDocument=await cosmosdbhelper.getDocByID("appuser","accountID",accountID,"VisualSchema."+projectID+".default")
        if(originalDocument.length==0) {
            var aVisualSchema=this.getEmptyVisualSchema(projectID,accountID)
        }else{
            aVisualSchema = originalDocument[0]
        }
        aVisualSchema.detail=visualDefinitionJson

        var re=await cosmosdbhelper.insertRecord("appuser",aVisualSchema)
        res.end()
    } catch (e) {
        res.status(400).send(e.message)
    }
}

routerInsertData.prototype.getEmptyVisualSchema = function(projectID,accountID) {
    return {
        id:"VisualSchema."+projectID+".default"
        ,"type":"visualSchema"
        ,"accountID":accountID
        ,"projectID":projectID
        ,"name":"default"
        ,"detail":{}
    }
}

routerInsertData.prototype.updateTopologySchema =async function(req,res) {
    var accountID=req.body.account
    var projectID=req.body.projectID
    var layouts=req.body.layouts

    try {
        for(var layoutName in layouts){
            var content=JSON.parse(layouts[layoutName])

            var originalDocument=await cosmosdbhelper.getDocByID("appuser","accountID",accountID,"TopoSchema."+projectID+"."+layoutName)
            if(originalDocument.length==0) {
                var newLayoutDocument={
                    id:"TopoSchema."+projectID+"."+layoutName
                    ,"type":"Topology"
                    ,"accountID":accountID
                    ,"projectID":projectID
                    ,"name":layoutName
                    ,"detail":content
                }
            }else{
                var newLayoutDocument = originalDocument[0]
                newLayoutDocument.detail=content
            }

            var re=await cosmosdbhelper.insertRecord("appuser",newLayoutDocument)
        }
        res.end()
    } catch (e) {
        res.status(400).send(e.message)
    }
}

routerInsertData.prototype.strToBool= function(str){
    if(str=="true") return true
    if(str=="false") return false
    return str
}

routerInsertData.prototype.setLayoutSharedFlag= async function(req,res){
    var ownerAccount=req.body.account
    var projectID=req.body.projectID
    var layoutName=req.body.layout
    var isShared=this.strToBool(req.body.isShared)

    try {
        var originalDocument=await cosmosdbhelper.getDocByID("appuser","accountID",ownerAccount,"TopoSchema."+projectID+"."+layoutName)
        if(originalDocument.length==0) res.status(400).send("Layout "+layoutName+" is not found!")
        var newLayoutDocument = originalDocument[0]
        newLayoutDocument["isShared"]=isShared
        await cosmosdbhelper.insertRecord("appuser", newLayoutDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }
    res.end()
}

routerInsertData.prototype.setVisualSchemaSharedFlag= async function(req,res){
    var ownerAccount=req.body.account
    var projectID=req.body.projectID
    var visualSchemaName=req.body.visualSchema
    var isShared=this.strToBool(req.body.isShared)

    try {
        var originalDocument=await cosmosdbhelper.getDocByID("appuser","accountID",ownerAccount,"VisualSchema."+projectID+"."+visualSchemaName)
        if(originalDocument.length==0)  var newDocument=this.getEmptyVisualSchema(projectID,ownerAccount)
        else newDocument = originalDocument[0]
        
        newDocument["isShared"]=isShared
        await cosmosdbhelper.insertRecord("appuser", newDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }
    res.end()
}



module.exports = new routerInsertData().router
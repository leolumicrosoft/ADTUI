(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache = require("./globalCache")

function adtInstanceSelectionDialog() {
    this.filters={}
    this.previousSelectedADT=null
    this.testTwinsInfo=null;

    if(!this.DOM){
        this.DOM = $('<div class="w3-modal" style="display:block;z-index:101"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
    }
}


adtInstanceSelectionDialog.prototype.preparationFunc = async function () {
    return new Promise((resolve, reject) => {
        try{
            $.get("twinsFilter/readStartFilters", (data, status) => {
                if(data!=null && data!="") this.filters=data;
                resolve()
            })
        }catch(e){
            reject(e)
        }
    })
}

adtInstanceSelectionDialog.prototype.popup = function () {
    $.get("queryADT/listADTInstance", (data, status) => {
        if(data=="") data=[]
        var adtArr=data;
        if (adtArr.length == 0) return;

        this.DOM.show()
        this.DOM.empty()
        this.contentDOM=$('<div class="w3-modal-content" style="width:650px"></div>')
        this.DOM.append(this.contentDOM)
        this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Choose Data Set</div></div>'))
        var closeButton=$('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
        this.contentDOM.children(':first').append(closeButton)
        
        this.buttonHolder=$("<div style='height:100%'></div>")
        this.contentDOM.children(':first').append(this.buttonHolder)
        closeButton.on("click",()=>{this.closeDialog()})
    
        var row1=$('<div class="w3-bar" style="padding:2px"></div>')
        this.contentDOM.append(row1)
        var lable=$('<div class="w3-bar-item w3-opacity" style="padding-right:5px;font-size:1.2em;">Azure Digital Twin ID </div>')
        row1.append(lable)
        var switchADTSelector=new simpleSelectMenu(" ",{withBorder:1,fontSize:"1.2em",colorClass:"w3-light-gray",buttonCSS:{"padding":"5px 10px"}})
        row1.append(switchADTSelector.DOM)
        
        adtArr.forEach((adtInstance)=>{
            var str = adtInstance.split(".")[0].replace("https://", "")
            switchADTSelector.addOption(str,adtInstance)
            if(this.filters[adtInstance]==null) this.filters[adtInstance]={}
        })

        switchADTSelector.callBack_clickOption=(optionText,optionValue)=>{
            switchADTSelector.changeName(optionText)
            this.setADTInstance(optionValue)
        }

        var row2=$('<div class="w3-cell-row"></div>')
        this.contentDOM.append(row2)
        var leftSpan=$('<div class="w3-cell" style="width:240px;padding-right:5px"></div>')
        
        leftSpan.append($('<div style="height:30px" class="w3-bar w3-red"><div class="w3-bar-item" style="">Filters</div></div>'))

        var filterList=$('<ul class="w3-ul w3-hoverable">')
        filterList.css({"overflow-x":"hidden","overflow-y":"auto","height":"340px", "border":"solid 1px lightgray"})
        leftSpan.append(filterList)

        this.filterList=filterList;
        row2.append(leftSpan)
        
        var rightSpan=$('<div class="w3-container w3-cell"></div>')
        row2.append(rightSpan) 

        var panelCard=$('<div class="w3-card-2 w3-white" style="padding:10px"></div>')
        rightSpan.append(panelCard)
        var querySpan=$("<span/>")
        panelCard.append(querySpan)
        

        var nameInput=$('<input type="text" style="outline:none"  placeholder="Choose a filter or fill in new filter name..."/>').addClass("w3-input w3-border");
        this.queryNameInput=nameInput;
        var queryLbl=$('<div class="w3-bar w3-red" style="padding-left:5px;margin-top:2px;width:50%">Query Sentence</div>')
        var queryInput=$('<textarea style="resize:none;height:80px;outline:none;margin-bottom:2px"  placeholder="Sample: SELECT * FROM digitaltwins where IS_OF_MODEL(\'modelID\')"/>').addClass("w3-input w3-border");
        this.queryInput=queryInput;

        var saveBtn=$('<button class="w3-button w3-hover-light-green w3-border-right">Save Filter</button>')
        var testBtn=$('<button class="w3-button w3-hover-amber w3-border-right">Test Query</button>')
        var delBtn=$('<button class="w3-button w3-hover-pink w3-border-right">Delete Filter</button>')


        testBtn.on("click",()=>{this.testQuery()})
        saveBtn.on("click",()=>{this.saveQuery()})
        delBtn.on("click",()=>{this.delQuery()})
        querySpan.append(nameInput,queryLbl,queryInput,saveBtn,testBtn,delBtn)

        var testResultSpan=$("<div class='w3-border'></div>")
        var testResultTable=$("<table></table>")
        this.testResultTable=testResultTable
        testResultSpan.css({"margin-top":"2px",overflow:"auto",height:"175px",width:"400px"})
        testResultTable.css({"border-collapse":"collapse"})
        panelCard.append(testResultSpan)
        testResultSpan.append(testResultTable)

        this.bottomBar=$('<div class="w3-bar"></div>')
        this.contentDOM.append(this.bottomBar)

        if(this.previousSelectedADT!=null){
            switchADTSelector.triggerOptionValue(this.previousSelectedADT)
        }else{
            switchADTSelector.triggerOptionIndex(0)
        }

    });
}

adtInstanceSelectionDialog.prototype.setADTInstance=function(selectedADT){
    this.bottomBar.empty()
    this.buttonHolder.empty()
    if(this.previousSelectedADT==null || this.previousSelectedADT == selectedADT){
        var replaceButton=$('<button class="w3-button w3-card w3-deep-orange w3-hover-green" style="height:100%; margin-right:8px">Replace All Data</button>')
        var appendButton=$('<button class="w3-button w3-card w3-deep-orange w3-hover-green" style="height:100%">Append Data</button>')

        replaceButton.on("click",()=> { this.useFilterToReplace()  }  )
        appendButton.on("click", ()=> { this.useFilterToAppend()  }  )
        this.buttonHolder.append(replaceButton,appendButton)
    }else{
        var replaceButton=$('<button class="w3-button w3-green w3-border-right" style="height:100%">Replace All Data</button>')
        replaceButton.on("click",()=> { this.useFilterToReplace()  }  )
        this.buttonHolder.append(replaceButton)
    }
    globalCache.selectedADT = selectedADT
    if (!globalCache.visualDefinition[globalCache.selectedADT])
            globalCache.visualDefinition[globalCache.selectedADT] = {}
    this.listFilters(selectedADT)
    this.chooseOneFilter("","")
    $.ajaxSetup({
        headers: {
            'adtInstance': globalCache.selectedADT
        }
    });
}


adtInstanceSelectionDialog.prototype.delQuery=function(){
    var queryName=this.queryNameInput.val()
    if(queryName=="ALL" || queryName=="")return;
    var confirmDialogDiv=new simpleConfirmDialog()

    confirmDialogDiv.show(
        { width: "250px" },
        {
            title: "Confirm"
            , content: "Please confirm deleting filter \""+queryName+"\"?"
            , buttons:[
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        this.queryNameInput.val("")
                        this.queryInput.val("")
                        this.testResultTable.empty()
                        delete this.filters[globalCache.selectedADT][queryName]
                        this.listFilters(globalCache.selectedADT)
                        this.chooseOneFilter("", "")
                        $.post("twinsFilter/saveStartFilters", { filters: this.filters })
                        confirmDialogDiv.close();
                }},
                {
                    colorClass: "w3-gray",text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                }}
            ]
        }
    )
}

adtInstanceSelectionDialog.prototype.saveQuery=function(){
    var queryName=this.queryNameInput.val()
    var queryStr=this.queryInput.val()
    if(queryName==""){
        alert("Please fill in query name")
        return
    }

    this.filters[globalCache.selectedADT][queryName]=queryStr
    this.listFilters(globalCache.selectedADT)

    this.filterList.children().each((index,ele)=>{
        if($(ele).data("filterName")==queryName) {
            $(ele).trigger("click")
        }
    })

    //store filters to server side as a file
    $.post("twinsFilter/saveStartFilters",{filters:this.filters})
}

adtInstanceSelectionDialog.prototype.testQuery=function(){
    this.testResultTable.empty()
    var queryStr= this.queryInput.val()
    if(queryStr=="") return;
    $.post("queryADT/allTwinsInfo",{query:queryStr}, (data)=> {
        if(data=="") data=[]
        if(!Array.isArray(data)) {
            alert("Query is not correct!")
            return;
        }
        this.testTwinsInfo=data
        if(data.length==0){
            var tr=$('<tr><td style="color:gray">zero record</td><td style="border-bottom:solid 1px lightgrey"></td></tr>')
            this.testResultTable.append(tr)
        }else{
            var tr=$('<tr><td style="border-right:solid 1px lightgrey;border-bottom:solid 1px lightgrey;font-weight:bold">ID</td><td style="border-bottom:solid 1px lightgrey;font-weight:bold">MODEL</td></tr>')
            this.testResultTable.append(tr)
            data.forEach((oneNode)=>{
                globalCache.storedTwins[oneNode["$dtId"]] = oneNode;
                var tr=$('<tr><td style="border-right:solid 1px lightgrey;border-bottom:solid 1px lightgrey">'+oneNode["$dtId"]+'</td><td style="border-bottom:solid 1px lightgrey">'+oneNode['$metadata']['$model']+'</td></tr>')
                this.testResultTable.append(tr)
            })    
        }
    });
}

adtInstanceSelectionDialog.prototype.listFilters=function(adtInstanceName){
    var availableFilters=this.filters[adtInstanceName]
    availableFilters["ALL"]="SELECT * FROM digitaltwins"

    var filterList=this.filterList;
    filterList.empty()

    for(var filterName in availableFilters){
        var oneFilter=$('<li style="font-size:1em">'+filterName+'</li>')
        oneFilter.css("cursor","default")
        oneFilter.data("filterName", filterName)
        oneFilter.data("filterQuery", availableFilters[filterName])
        if(filterName=="ALL") filterList.prepend(oneFilter)
        else filterList.append(oneFilter)
        this.assignEventToOneFilter(oneFilter)
        
        oneFilter.on("dblclick",(e)=>{
            if(this.previousSelectedADT == globalCache.selectedADT) this.useFilterToAppend();
            else this.useFilterToReplace();
        })
    }
}

adtInstanceSelectionDialog.prototype.assignEventToOneFilter=function(oneFilter){
    oneFilter.on("click",(e)=>{
        this.filterList.children().each((index,ele)=>{
            $(ele).removeClass("w3-amber")
        })
        oneFilter.addClass("w3-amber")
        var filterName=oneFilter.data('filterName')
        var queryStr=oneFilter.data('filterQuery')
        this.chooseOneFilter(filterName,queryStr)
    })
}

adtInstanceSelectionDialog.prototype.useFilterToAppend=function(){
    if(this.queryInput.val()==""){
        alert("Please fill in query to fetch data from digital twin service..")
        return;
    }
    if(this.previousSelectedADT==null){
        this.broadcastMessage({ "message": "ADTDatasourceChange_replace", "query": this.queryInput.val(), "twins":this.testTwinsInfo })
    }else{
        this.previousSelectedADT=globalCache.selectedADT
        this.broadcastMessage({ "message": "ADTDatasourceChange_append", "query": this.queryInput.val(), "twins":this.testTwinsInfo })
    }
    this.closeDialog()
}

adtInstanceSelectionDialog.prototype.closeDialog=function(){
    this.DOM.hide()
    this.broadcastMessage({ "message": "ADTDatasourceDialog_closed"})
}

adtInstanceSelectionDialog.prototype.useFilterToReplace=function(){
    if(this.queryInput.val()==""){
        alert("Please fill in query to fetch data from digital twin service..")
        return;
    }
    var ADTInstanceDoesNotChange=true
    if(this.previousSelectedADT!=globalCache.selectedADT){
        for(var ind in globalCache.storedOutboundRelationships) delete globalCache.storedOutboundRelationships[ind]
        for(var ind in globalCache.storedTwins) delete globalCache.storedTwins[ind]
        ADTInstanceDoesNotChange=false
    }
    this.previousSelectedADT=globalCache.selectedADT
    this.broadcastMessage({ "message": "ADTDatasourceChange_replace", "query": this.queryInput.val()
    , "twins":this.testTwinsInfo, "ADTInstanceDoesNotChange":ADTInstanceDoesNotChange })
    
    this.closeDialog()
}

adtInstanceSelectionDialog.prototype.chooseOneFilter=function(queryName,queryStr){
    this.queryNameInput.val(queryName)
    this.queryInput.val(queryStr)
    this.testResultTable.empty()
    this.testTwinsInfo=null
}

module.exports = new adtInstanceSelectionDialog();
},{"./globalCache":3,"./simpleConfirmDialog":11,"./simpleSelectMenu":12}],2:[function(require,module,exports){
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache = require("./globalCache")

function editLayoutDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

editLayoutDialog.prototype.getCurADTName=function(){
    var adtName = globalCache.selectedADT
    var str = adtName.replace("https://", "")
    return str
}

editLayoutDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTDatasourceChange_replace") {
        try{
            $.post("layout/readLayouts",{adtName:this.getCurADTName()}, (data, status) => {
                if(data!="" && typeof(data)==="object") globalCache.layoutJSON=data;
                else globalCache.layoutJSON={};
                this.broadcastMessage({ "message": "layoutsUpdated"})
            })
        }catch(e){
            console.log(e)
        }
    
    }
}

editLayoutDialog.prototype.refillOptions = function () {
    this.switchLayoutSelector.clearOptions()
    
    for(var ind in globalCache.layoutJSON){
        this.switchLayoutSelector.addOption(ind)
    }
}

editLayoutDialog.prototype.popup = function () {
    this.DOM.show()
    this.DOM.empty()

    this.DOM.css({"width":"320px","padding-bottom":"3px"})
    this.DOM.append($('<div style="height:40px;margin-bottom:2px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">Layout</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var nameInput=$('<input type="text" style="outline:none; width:180px; display:inline;margin-left:2px;margin-right:2px"  placeholder="Fill in a new layout name..."/>').addClass("w3-input w3-border");   
    this.DOM.append(nameInput)
    var saveAsNewBtn=$('<button class="w3-button w3-green w3-hover-light-green">Save As New</button>')
    this.DOM.append(saveAsNewBtn)
    saveAsNewBtn.on("click",()=>{this.saveIntoLayout(nameInput.val())})


    if(!jQuery.isEmptyObject(globalCache.layoutJSON)){
        var lbl=$('<div class="w3-bar w3-padding-16" style="text-align:center;">- OR -</div>')
        this.DOM.append(lbl) 
        var switchLayoutSelector=new simpleSelectMenu("",{fontSize:"1em",colorClass:"w3-light-gray",width:"120px"})
        this.switchLayoutSelector=switchLayoutSelector
        this.refillOptions()
        this.switchLayoutSelector.callBack_clickOption=(optionText,optionValue)=>{
            if(optionText==null) this.switchLayoutSelector.changeName(" ")
            else this.switchLayoutSelector.changeName(optionText)
        }
            
        var saveAsBtn=$('<button class="w3-button w3-green w3-hover-light-green" style="margin-left:2px;margin-right:5px">Save As</button>')
        var deleteBtn=$('<button class="w3-button w3-red w3-hover-pink" style="margin-left:5px">Delete Layout</button>')
        this.DOM.append(saveAsBtn,switchLayoutSelector.DOM,deleteBtn)
        saveAsBtn.on("click",()=>{this.saveIntoLayout(switchLayoutSelector.curSelectVal)})
        deleteBtn.on("click",()=>{this.deleteLayout(switchLayoutSelector.curSelectVal)})

        if(globalCache.currentLayoutName!=null){
            switchLayoutSelector.triggerOptionValue(globalCache.currentLayoutName)
        }else{
            switchLayoutSelector.triggerOptionIndex(0)
        }
    }
}

editLayoutDialog.prototype.saveIntoLayout = function (layoutName) {
    if(layoutName=="" || layoutName==null){
        alert("Please choose target layout Name")
        return
    }
    this.broadcastMessage({ "message": "saveLayout", "layoutName": layoutName, "adtName":this.getCurADTName() })
    this.DOM.hide()
}


editLayoutDialog.prototype.deleteLayout = function (layoutName) {
    if(layoutName=="" || layoutName==null){
        alert("Please choose target layout Name")
        return;
    }

    var confirmDialogDiv=new simpleConfirmDialog()

    confirmDialogDiv.show(
        { width: "250px" },
        {
            title: "Confirm"
            , content: "Please confirm deleting layout \"" + layoutName + "\"?"
            , buttons:[
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        delete globalCache.layoutJSON[layoutName]
                        if (layoutName == globalCache.currentLayoutName) globalCache.currentLayoutName = null
                        this.broadcastMessage({ "message": "layoutsUpdated" })
                        $.post("layout/saveLayouts", { "adtName": this.getCurADTName(), "layouts": JSON.stringify(globalCache.layoutJSON) })
                        confirmDialogDiv.close();
                        this.refillOptions()
                        this.switchLayoutSelector.triggerOptionIndex(0)
                    }
                },
                {
                    colorClass: "w3-gray",text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                }}
            ]
        }
    )

}

module.exports = new editLayoutDialog();
},{"./globalCache":3,"./simpleConfirmDialog":11,"./simpleSelectMenu":12}],3:[function(require,module,exports){
function globalCache(){
    this.storedOutboundRelationships = {}
    this.storedTwins = {}

    this.currentLayoutName=null
    this.layoutJSON={}

    this.selectedADT=null;

    this.visualDefinition={}
}

globalCache.prototype.storeTwinRelationships=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        var twinID=oneRelationship['$sourceId']
        this.storedOutboundRelationships[twinID]=[]
    })

    relationsData.forEach((oneRelationship)=>{
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

globalCache.prototype.storeTwinRelationships_append=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        if(!this.storedOutboundRelationships[oneRelationship['$sourceId']])
            this.storedOutboundRelationships[oneRelationship['$sourceId']]=[]
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

globalCache.prototype.storeTwinRelationships_remove=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        var srcID=oneRelationship["srcID"]
        if(this.storedOutboundRelationships[srcID]){
            var arr=this.storedOutboundRelationships[srcID]
            for(var i=0;i<arr.length;i++){
                if(arr[i]['$relationshipId']==oneRelationship["relID"]){
                    arr.splice(i,1)
                    break;
                }
            }
        }
    })
}

module.exports = new globalCache();
},{}],4:[function(require,module,exports){
const modelAnalyzer = require("./modelAnalyzer");
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache = require("./globalCache")

function infoPanel() {
    this.continerDOM=$('<div class="w3-card" style="position:absolute;z-index:90;right:0px;top:50%;height:70%;width:300px;transform: translateY(-50%);"></div>')
    this.continerDOM.hide()
    this.continerDOM.append($('<div style="height:50px" class="w3-bar w3-red"></div>'))

    this.closeButton1=$('<button style="height:100%" class="w3-bar-item w3-button"><i class="fa fa-info-circle fa-2x" style="padding:2px"></i></button>')
    this.closeButton2=$('<button class="w3-bar-item w3-button w3-right" style="font-size:2em">×</button>')
    this.continerDOM.children(':first').append(this.closeButton1,this.closeButton2) 

    this.isMinimized=false;
    var buttonAnim=()=>{
        if(!this.isMinimized){
            this.continerDOM.animate({
                right: "-250px",
                height:"50px"
            })
            this.isMinimized=true;
        }else{
            this.continerDOM.animate({
                right: "0px",
                height: "70%"
            })
            this.isMinimized=false;
        }
    }
    this.closeButton1.on("click",buttonAnim)
    this.closeButton2.on("click",buttonAnim)

    this.DOM=$('<div class="w3-container" style="postion:absolute;top:50px;height:calc(100% - 50px);overflow:auto"></div>')
    this.continerDOM.css("background-color","rgba(255, 255, 255, 0.8)")
    this.continerDOM.hover(() => {
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 1)")
    }, () => {
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
    });
    this.continerDOM.append(this.DOM)
    $('body').append(this.continerDOM)
    this.DOM.html("<a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to select multiple in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press ctrl key to select multiple in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:5px'>Import twins data by clicking button below</a>")

    this.drawButtons(null)

    this.selectedObjects=null;
}

infoPanel.prototype.rxMessage=function(msgPayload){   
    if(msgPayload.message=="ADTDatasourceDialog_closed"){
        if(!this.continerDOM.is(":visible")) {
            this.continerDOM.show()
            this.continerDOM.addClass("w3-animate-right")
        }
    }else if(msgPayload.message=="selectNodes"){
        this.DOM.empty()
        var arr=msgPayload.info;

        if(arr==null || arr.length==0){
            this.drawButtons(null)
            this.selectedObjects=[];
            return;
        }

        this.selectedObjects=arr;
        if(arr.length==1){
            var singleElementInfo=arr[0];
            
            if(singleElementInfo["$dtId"]){// select a node
                this.drawButtons("singleNode")
                this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
                var modelName=singleElementInfo['$metadata']['$model']
                
                if(modelAnalyzer.DTDLModels[modelName]){
                    this.drawEditable(this.DOM,modelAnalyzer.DTDLModels[modelName].editableProperties,singleElementInfo,[])
                }
                this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px")
            }else if(singleElementInfo["$sourceId"]){
                this.drawButtons("singleRelationship")
                this.drawStaticInfo(this.DOM,{
                    "$sourceId":singleElementInfo["$sourceId"],
                    "$targetId":singleElementInfo["$targetId"],
                    "$relationshipName":singleElementInfo["$relationshipName"],
                    "$relationshipId":singleElementInfo["$relationshipId"]
                },"1em","13px")
                var relationshipName=singleElementInfo["$relationshipName"]
                var sourceModel=singleElementInfo["sourceModel"]
                
                this.drawEditable(this.DOM,this.getRelationShipEditableProperties(relationshipName,sourceModel),singleElementInfo,[])
                this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
            }
        }else if(arr.length>1){
            this.drawButtons("multiple")
            this.drawMultipleObj()
        }
    }else if(msgPayload.message=="selectGroupNode"){
        this.DOM.empty()
        var modelID = msgPayload.info["@id"]
        if(!modelAnalyzer.DTDLModels[modelID]) return;
        var twinJson = {
            "$metadata": {
                "$model": modelID
            }
        }
        var addBtn =$('<button class="w3-button w3-green w3-hover-light-green w3-margin">Add Twin</button>')
        this.DOM.append(addBtn)

        addBtn.on("click",(e) => {
            if(!twinJson["$dtId"]||twinJson["$dtId"]==""){
                alert("Please fill in name for the new digital twin")
                return;
            }

            var componentsNameArr=modelAnalyzer.DTDLModels[modelID].includedComponents
            componentsNameArr.forEach(oneComponentName=>{ //adt service requesting all component appear by mandatory
                if(twinJson[oneComponentName]==null)twinJson[oneComponentName]={}
                twinJson[oneComponentName]["$metadata"]= {}
            })
            $.post("editADT/upsertDigitalTwin", {"newTwinJson":JSON.stringify(twinJson)}
                , (data) => {
                    if (data != "") {//not successful editing
                        alert(data)
                    } else {
                        //successful editing, update the node original info
                        var keyLabel=this.DOM.find('#NEWTWIN_IDLabel')
                        var IDInput=keyLabel.find("input")
                        if(IDInput) IDInput.val("")
                        $.post("queryADT/oneTwinInfo",{twinID:twinJson["$dtId"]}, (data)=> {
                            if(data=="") return;
                            globalCache.storedTwins[data["$dtId"]] = data;
                            this.broadcastMessage({ "message": "addNewTwin",twinInfo:data})
                        })                        
                    }
                });
        })

        this.drawStaticInfo(this.DOM,{
            "Model":modelID
        })

        addBtn.data("twinJson",twinJson)
        var copyProperty=JSON.parse(JSON.stringify(modelAnalyzer.DTDLModels[modelID].editableProperties))
        copyProperty['$dtId']="string"
        this.drawEditable(this.DOM,copyProperty,twinJson,[],"newTwin")
        //console.log(modelAnalyzer.DTDLModels[modelID]) 
    }
}

infoPanel.prototype.getRelationShipEditableProperties=function(relationshipName,sourceModel){
    if(!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
    return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
}

infoPanel.prototype.drawButtons=function(selectType){
    var impBtn=$('<button class="w3-bar-item w3-button w3-blue"><i class="fa fa-arrow-circle-o-down"></i></button>')
    var actualImportTwinsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    if(selectType!=null){
        var refreshBtn=$('<button class="w3-bar-item w3-button w3-black"><i class="fa fa-refresh"></i></button>')
        var expBtn=$('<button class="w3-bar-item w3-button w3-green"><i class="fa fa-arrow-circle-o-up"></i></button>')    
        this.DOM.append(refreshBtn,expBtn,impBtn,actualImportTwinsBtn)
        refreshBtn.on("click",()=>{this.refreshInfomation()})
        expBtn.on("click",()=>{
            //find out the twins in selection and their connections (filter both src and target within the selected twins)
            //and export them
            this.exportSelected()
        })    
    }else{
        this.DOM.append(impBtn,actualImportTwinsBtn)
    }
    
    impBtn.on("click",()=>{actualImportTwinsBtn.trigger('click');})
    actualImportTwinsBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        await this.readTwinsFilesContentAndImport(files)
        actualImportTwinsBtn.val("")
    })
    if(selectType==null) return;

    if(selectType=="singleRelationship"){
        var delBtn =  $('<button style="width:50%" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        this.DOM.append(delBtn)
        delBtn.on("click",()=>{this.deleteSelected()})
    }else if(selectType=="singleNode" || selectType=="multiple"){
        var delBtn = $('<button style="width:50%" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        var connectToBtn =$('<button style="width:45%"  class="w3-button w3-border">Connect to</button>')
        var connectFromBtn = $('<button style="width:45%" class="w3-button w3-border">Connect from</button>')
        var showInboundBtn = $('<button  style="width:45%" class="w3-button w3-border">Query Inbound</button>')
        var showOutBoundBtn = $('<button style="width:45%" class="w3-button w3-border">Query Outbound</button>')
        
        this.DOM.append(delBtn, connectToBtn,connectFromBtn , showInboundBtn, showOutBoundBtn)
    
        showOutBoundBtn.on("click",()=>{this.showOutBound()})
        showInboundBtn.on("click",()=>{this.showInBound()})  
        connectToBtn.on("click",()=>{this.broadcastMessage({ "message": "connectTo"}) })
        connectFromBtn.on("click",()=>{this.broadcastMessage({ "message": "connectFrom"}) })

        delBtn.on("click",()=>{this.deleteSelected()})
    }
    
    var numOfNode = 0;
    var arr=this.selectedObjects;
    arr.forEach(element => {
        if (element['$dtId']) numOfNode++
    });
    if(numOfNode>0){
        var selectInboundBtn = $('<button class="w3-button w3-border">+Select Inbound</button>')
        var selectOutBoundBtn = $('<button class="w3-button w3-border">+Select Outbound</button>')
        var coseLayoutBtn= $('<button class="w3-button w3-border">COSE View</button>')
        var hideBtn= $('<button class="w3-button w3-border">Hide</button>')
        this.DOM.append(selectInboundBtn, selectOutBoundBtn,coseLayoutBtn,hideBtn)

        selectInboundBtn.on("click",()=>{this.broadcastMessage({"message": "addSelectInbound"})})
        selectOutBoundBtn.on("click",()=>{this.broadcastMessage({"message": "addSelectOutbound"})})
        coseLayoutBtn.on("click",()=>{this.broadcastMessage({"message": "COSESelectedNodes"})})
        hideBtn.on("click",()=>{this.broadcastMessage({"message": "hideSelectedNodes"})})
    }
}

infoPanel.prototype.exportSelected=async function(){
    var arr=this.selectedObjects;
    if(arr.length==0) return;
    var twinIDArr=[]
    var twinToBeStored=[]
    var twinIDs={}
    arr.forEach(element => {
        if (element['$sourceId']) return
        twinIDArr.push(element['$dtId'])
        var anExpTwin={}
        anExpTwin["$metadata"]={"$model":element["$metadata"]["$model"]}
        for(var ind in element){
            if(ind=="$metadata" || ind=="$etag") continue 
            else anExpTwin[ind]=element[ind]
        }
        twinToBeStored.push(anExpTwin)
        twinIDs[element['$dtId']]=1
    });
    var relationsToBeStored=[]
    twinIDArr.forEach(oneID=>{
        var relations=globalCache.storedOutboundRelationships[oneID]
        if(!relations) return;
        relations.forEach(oneRelation=>{
            var targetID=oneRelation["$targetId"]
            if(twinIDs[targetID]) {
                var obj={}
                for(var ind in oneRelation){
                    if(ind =="$etag"||ind =="$relationshipId"||ind =="$sourceId"||ind =="sourceModel") continue
                    obj[ind]=oneRelation[ind]
                }
                var oneAction={"$srcId":oneID,
                                "$relationshipId":oneRelation["$relationshipId"],
                                "obj":obj}
                relationsToBeStored.push(oneAction)
            }
        })
    })
    var finalJSON={"twins":twinToBeStored,"relations":relationsToBeStored}
    var pom = $("<a></a>")
    pom.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(finalJSON)));
    pom.attr('download', "exportTwinsData.json");
    pom[0].click()
}

infoPanel.prototype.readOneFile= async function(aFile){
    return new Promise((resolve, reject) => {
        try{
            var reader = new FileReader();
            reader.onload = ()=> {
                resolve(reader.result)
            };
            reader.readAsText(aFile);
        }catch(e){
            reject(e)
        }
    })
}
infoPanel.prototype.readTwinsFilesContentAndImport=async function(files){
    var importTwins=[]
    var importRelations=[]
    for (var i = 0, f; f = files[i]; i++) {
        // Only process json files.
        if (f.type!="application/json") continue;
        try{
            var str= await this.readOneFile(f)
            var obj=JSON.parse(str)
            if(obj.twins) importTwins=importTwins.concat(obj.twins)
            if(obj.relations) importRelations=importRelations.concat(obj.relations)
        }catch(err){
            alert(err)
        }
    }

    var twinsImportResult= await this.batchImportTwins(importTwins)
    twinsImportResult.forEach(data=>{
        globalCache.storedTwins[data["$dtId"]] = data;
    })
    this.broadcastMessage({ "message": "addNewTwins",twinsInfo:twinsImportResult})

    var relationsImportResult=await this.batchImportRelations(importRelations)
    globalCache.storeTwinRelationships_append(relationsImportResult)
    this.broadcastMessage({ "message": "drawAllRelations",info:relationsImportResult})

    var numOfTwins=twinsImportResult.length
    var numOfRelations=relationsImportResult.length
    var str="Add "+numOfTwins+ " node"+((numOfTwins<=1)?"":"s")+", "+numOfRelations+" relationship"+((numOfRelations<=1)?"":"s")
    str+=`. (Raw twin records:${importTwins.length}); Raw relations records:${importRelations.length})`
    var confirmDialogDiv = new simpleConfirmDialog()
    confirmDialogDiv.show(
        { width: "200px" },
        {
            title: "Import Result"
            , content:str
            , buttons: [
                {
                    colorClass: "w3-gray", text: "Ok", "clickFunc": () => {
                        confirmDialogDiv.close()
                    }
                }
            ]
        }
    )
}

infoPanel.prototype.batchImportTwins=async function(twins){
    return new Promise((resolve, reject) => {
        if(twins.length==0) resolve([])
        try{
            $.post("editADT/batchImportTwins",{"twins":JSON.stringify(twins)}, (data)=> {
                if (data == "") data=[]
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
}

infoPanel.prototype.batchImportRelations=async function(relations){
    return new Promise((resolve, reject) => {
        if(relations.length==0) resolve([])
        try{
            $.post("editADT/createRelations",{"actions":JSON.stringify(relations)}, (data)=> {
                if (data == "") data=[]
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
}


infoPanel.prototype.refreshInfomation=async function(){
    var arr=this.selectedObjects;
    var queryArr=[]
    arr.forEach(oneItem=>{
        if(oneItem['$relationshipId']) queryArr.push({'$sourceId':oneItem['$sourceId'],'$relationshipId':oneItem['$relationshipId']})
        else queryArr.push({'$dtId':oneItem['$dtId']})
    })

    $.post("queryADT/fetchInfomation",{"elements":queryArr},  (data)=> {
        if(data=="") return;
        data.forEach(oneRe=>{
            if(oneRe["$relationshipId"]){//update storedOutboundRelationships
                var srcID= oneRe['$sourceId']
                var relationshipId= oneRe['$relationshipId']
                if(globalCache.storedOutboundRelationships[srcID]!=null){
                    var relations=globalCache.storedOutboundRelationships[srcID]
                    relations.forEach(oneStoredRelation=>{
                        if(oneStoredRelation['$relationshipId']==relationshipId){
                            //update all content
                            for(var ind in oneRe){ oneStoredRelation[ind]=oneRe[ind] }
                        }
                    })
                }
            }else{//update storedTwins
                var twinID= oneRe['$dtId']
                if(globalCache.storedTwins[twinID]!=null){
                    for(var ind in oneRe){ globalCache.storedTwins[twinID][ind]=oneRe[ind] }
                }
            }
        })
        
        //redraw infopanel if needed
        if(this.selectedObjects.length==1) this.rxMessage({ "message": "selectNodes", info: this.selectedObjects })
    });
}


infoPanel.prototype.deleteSelected=async function(){
    var arr=this.selectedObjects;
    if(arr.length==0) return;
    var relationsArr=[]
    var twinIDArr=[]
    var twinIDs={}
    arr.forEach(element => {
        if (element['$sourceId']) relationsArr.push(element);
        else{
            twinIDArr.push(element['$dtId'])
            twinIDs[element['$dtId']]=1
        }
    });
    for(var i=relationsArr.length-1;i>=0;i--){ //clear those relationships that are going to be deleted after twins deleting
        var srcId=  relationsArr[i]['$sourceId']
        var targetId = relationsArr[i]['$targetId']
        if(twinIDs[srcId]!=null || twinIDs[targetId]!=null){
            relationsArr.splice(i,1)
        }
    }

    var confirmDialogDiv = new simpleConfirmDialog()
    var dialogStr=""
    var twinNumber=twinIDArr.length;
    var relationsNumber = relationsArr.length;
    if(twinNumber>0) dialogStr =  twinNumber+" twin"+((twinNumber>1)?"s":"") + " (with connected relations)"
    if(twinNumber>0 && relationsNumber>0) dialogStr+=" and additional "
    if(relationsNumber>0) dialogStr +=  relationsNumber+" relation"+((relationsNumber>1)?"s":"" )
    dialogStr+=" will be deleted. Please confirm"
    confirmDialogDiv.show(
        { width: "350px" },
        {
            title: "Confirm"
            , content:dialogStr
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        if (twinIDArr.length > 0) this.deleteTwins(twinIDArr)
                        if (relationsArr.length > 0) this.deleteRelations(relationsArr)
                        confirmDialogDiv.close()
                        this.DOM.empty()
                        this.drawButtons(null)
                    }
                },
                {
                    colorClass: "w3-gray", text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                    }
                }
            ]
        }
    )
}

infoPanel.prototype.deleteTwins=async function(twinIDArr){   
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        var result=await this.deletePartialTwins(smallArr)

        result.forEach((oneID)=>{
            delete globalCache.storedTwins[oneID]
            delete globalCache.storedOutboundRelationships[oneID]
        });

        this.broadcastMessage({ "message": "twinsDeleted",twinIDArr:result})
    }
}

infoPanel.prototype.deletePartialTwins= async function(IDArr){
    return new Promise((resolve, reject) => {
        try{
            $.post("editADT/deleteTwins",{arr:IDArr}, function (data) {
                if(data=="") data=[]
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
}


infoPanel.prototype.deleteRelations=async function(relationsArr){
    var arr=[]
    relationsArr.forEach(oneRelation=>{
        arr.push({srcID:oneRelation['$sourceId'],relID:oneRelation['$relationshipId']})
    })
    $.post("editADT/deleteRelations",{"relations":arr},  (data)=> { 
        if(data=="") data=[];
        globalCache.storeTwinRelationships_remove(data)
        this.broadcastMessage({ "message": "relationsDeleted","relations":data})
    });
    
}

infoPanel.prototype.showOutBound=async function(){
    var arr=this.selectedObjects;
    var twinIDArr=[]
    arr.forEach(element => {
        if (element['$sourceId']) return;
        twinIDArr.push(element['$dtId'])
    });
    
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        var data=await this.fetchPartialOutbounds(smallArr)
        if(data=="") continue;
        //new twin's relationship should be stored as well
        globalCache.storeTwinRelationships(data.newTwinRelations)
        
        data.childTwinsAndRelations.forEach(oneSet=>{
            for(var ind in oneSet.childTwins){
                var oneTwin=oneSet.childTwins[ind]
                globalCache.storedTwins[ind]=oneTwin
            }
        })
        this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
        

    }
}

infoPanel.prototype.showInBound=async function(){
    var arr=this.selectedObjects;
    var twinIDArr=[]
    arr.forEach(element => {
        if (element['$sourceId']) return;
        twinIDArr.push(element['$dtId'])
    });
    
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        var data=await this.fetchPartialInbounds(smallArr)
        if(data=="") continue;
        //new twin's relationship should be stored as well
        globalCache.storeTwinRelationships(data.newTwinRelations)
        
        //data.newTwinRelations.forEach(oneRelation=>{console.log(oneRelation['$sourceId']+"->"+oneRelation['$targetId'])})
        //console.log(globalCache.storedOutboundRelationships["default"])

        data.childTwinsAndRelations.forEach(oneSet=>{
            for(var ind in oneSet.childTwins){
                var oneTwin=oneSet.childTwins[ind]
                globalCache.storedTwins[ind]=oneTwin
            }
        })
        this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
    }
}

infoPanel.prototype.fetchPartialOutbounds= async function(IDArr){
    return new Promise((resolve, reject) => {
        try{
            //find out those existed outbound with known target Twins so they can be excluded from query
            var knownTargetTwins={}
            IDArr.forEach(oneID=>{
                knownTargetTwins[oneID]=1 //itself also is known
                var outBoundRelation=globalCache.storedOutboundRelationships[oneID]
                if(outBoundRelation){
                    outBoundRelation.forEach(oneRelation=>{
                        var targetID=oneRelation["$targetId"]
                        if(globalCache.storedTwins[targetID]!=null) knownTargetTwins[targetID]=1
                    })
                }
            })

            $.post("queryADT/showOutBound",{arr:IDArr,"knownTargets":knownTargetTwins}, function (data) {
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
}

infoPanel.prototype.fetchPartialInbounds= async function(IDArr){
    return new Promise((resolve, reject) => {
        try{
            //find out those existed inbound with known source Twins so they can be excluded from query
            var knownSourceTwins={}
            var IDDict={}
            IDArr.forEach(oneID=>{
                IDDict[oneID]=1
                knownSourceTwins[oneID]=1 //itself also is known
            })
            for(var twinID in globalCache.storedOutboundRelationships){
                var relations=globalCache.storedOutboundRelationships[twinID]
                relations.forEach(oneRelation=>{
                    var targetID=oneRelation['$targetId']
                    var srcID=oneRelation['$sourceId']
                    if(IDDict[targetID]!=null){
                        if(globalCache.storedTwins[srcID]!=null) knownSourceTwins[srcID]=1
                    }
                })
            }

            $.post("queryADT/showInBound",{arr:IDArr,"knownSources":knownSourceTwins}, function (data) {
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
}

infoPanel.prototype.drawMultipleObj=function(){
    var numOfEdge = 0;
    var numOfNode = 0;
    var arr=this.selectedObjects;
    if(arr==null) return;
    arr.forEach(element => {
        if (element['$sourceId']) numOfEdge++
        else numOfNode++
    });
    var textDiv=$("<label style='display:block;margin-top:10px'></label>")
    textDiv.text(numOfNode+ " node"+((numOfNode<=1)?"":"s")+", "+numOfEdge+" relationship"+((numOfEdge<=1)?"":"s"))
    this.DOM.append(textDiv)
}

infoPanel.prototype.drawStaticInfo=function(parent,jsonInfo,paddingTop,fontSize){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div class='w3-border' style='background-color:#f6f6f6;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</div></label>")
        keyDiv.css({"fontSize":fontSize,"color":"darkGray"})
        parent.append(keyDiv)
        keyDiv.css("padding-top",paddingTop)

        var contentDOM=$("<label></label>")
        if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawStaticInfo(contentDOM,jsonInfo[ind],".5em",fontSize)
        }else {
            contentDOM.css("padding-top",".2em")
            contentDOM.text(jsonInfo[ind])
        }
        contentDOM.css({"fontSize":fontSize,"color":"black"})
        keyDiv.append(contentDOM)
    }
}

infoPanel.prototype.drawEditable=function(parent,jsonInfo,originElementInfo,pathArr,isNewTwin){
    if(jsonInfo==null) return;
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; font-weight:bold;color:black'>"+ind+"</div></label>")
        if(isNewTwin){
            if(ind=="$dtId") {
                parent.prepend(keyDiv)
                keyDiv.attr('id','NEWTWIN_IDLabel');
            }
            else parent.append(keyDiv)
        }else{
            parent.append(keyDiv)
        }
        
        keyDiv.css("padding-top",".3em") 

        var contentDOM=$("<label style='padding-top:.2em'></label>")
        var newPath=pathArr.concat([ind])
        if(Array.isArray(jsonInfo[ind])){
            this.drawDropdownOption(contentDOM,newPath,jsonInfo[ind],isNewTwin,originElementInfo)
        }else if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath,isNewTwin)
        }else {
            var aInput=$('<input type="text" style="padding:2px;width:50%;outline:none;display:inline" placeholder="type: '+jsonInfo[ind]+'"/>').addClass("w3-input w3-border");  
            contentDOM.append(aInput)
            var val=this.searchValue(originElementInfo,newPath)
            if(val!=null) aInput.val(val)
            aInput.data("path", newPath)
            aInput.data("dataType", jsonInfo[ind])
            aInput.change((e)=>{
                this.editDTProperty(originElementInfo,$(e.target).data("path"),$(e.target).val(),$(e.target).data("dataType"),isNewTwin)
            })
        }
        keyDiv.append(contentDOM)
    }
}

infoPanel.prototype.drawDropdownOption=function(contentDOM,newPath,valueArr,isNewTwin,originElementInfo){
    var aSelectMenu=new simpleSelectMenu("",{buttonCSS:{"padding":"4px 16px"}})
    contentDOM.append(aSelectMenu.DOM)
    aSelectMenu.DOM.data("path", newPath)
    valueArr.forEach((oneOption)=>{
        var str =oneOption["displayName"]  || oneOption["enumValue"] 
        aSelectMenu.addOption(str)
    })
    aSelectMenu.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
        aSelectMenu.changeName(optionText)
        if(realMouseClick) this.editDTProperty(originElementInfo,aSelectMenu.DOM.data("path"),optionValue,"string",isNewTwin)
    }
    var val=this.searchValue(originElementInfo,newPath)
    if(val!=null){
        aSelectMenu.triggerOptionValue(val)
    }    
}

infoPanel.prototype.editDTProperty=function(originElementInfo,path,newVal,dataType,isNewTwin){
    if(["double","boolean","float","integer","long"].includes(dataType)) newVal=Number(newVal)

    //{ "op": "add", "path": "/x", "value": 30 }
    if(isNewTwin){
        this.updateOriginObjectValue(originElementInfo,path,newVal)
        return;
    }
    if(path.length==1){
        var str=""
        path.forEach(segment=>{str+="/"+segment})
        var jsonPatch=[ { "op": "add", "path": str, "value": newVal} ]
    }else{
        //it is a property inside a object type of root property,update the whole root property
        var rootProperty=path[0]
        var patchValue= originElementInfo[rootProperty]
        if(patchValue==null) patchValue={}
        else patchValue=JSON.parse(JSON.stringify(patchValue)) //make a copy
        this.updateOriginObjectValue(patchValue,path.slice(1),newVal)
        
        var jsonPatch=[ { "op": "add", "path": "/"+rootProperty, "value": patchValue} ]
    }

    if(originElementInfo["$dtId"]){ //edit a node property
        var twinID = originElementInfo["$dtId"]
        var payLoad={"jsonPatch":JSON.stringify(jsonPatch),"twinID":twinID}
    }else if(originElementInfo["$relationshipId"]){ //edit a relationship property
        var twinID = originElementInfo["$sourceId"]
        var relationshipID = originElementInfo["$relationshipId"]
        var payLoad={"jsonPatch":JSON.stringify(jsonPatch),"twinID":twinID,"relationshipID":relationshipID}
    }
    
    $.post("editADT/changeAttribute",payLoad
        ,  (data)=> {
            if(data!="") {
                //not successful editing
                alert(data)
            }else{
                //successful editing, update the node original info
                this.updateOriginObjectValue(originElementInfo,path,newVal)
            }
        });
}

infoPanel.prototype.updateOriginObjectValue=function(nodeInfo,pathArr,newVal){
    if(pathArr.length==0) return;
    var theJson=nodeInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]

        if(i==pathArr.length-1){
            theJson[key]=newVal
            break
        }
        if(theJson[key]==null) theJson[key]={}
        theJson=theJson[key]
    }
    return
}

infoPanel.prototype.searchValue=function(originElementInfo,pathArr){
    if(pathArr.length==0) return null;
    var theJson=originElementInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]
        theJson=theJson[key]
        if(theJson==null) return null;
    }
    return theJson //it should be the final value
}

module.exports = new infoPanel();
},{"./globalCache":3,"./modelAnalyzer":8,"./simpleConfirmDialog":11,"./simpleSelectMenu":12}],5:[function(require,module,exports){
$('document').ready(function(){
    const mainUI=require("./mainUI.js")    
});
},{"./mainUI.js":7}],6:[function(require,module,exports){
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")
const editLayoutDialog= require("./editLayoutDialog")
const simpleSelectMenu= require("./simpleSelectMenu")
const globalCache = require("./globalCache")

function mainToolbar() {
}

mainToolbar.prototype.render = function () {
    $("#mainToolBar").addClass("w3-bar w3-red")
    $("#mainToolBar").css({"z-index":100,"overflow":"visible"})

    this.switchADTInstanceBtn=$('<a class="w3-bar-item w3-button" href="#">Source</a>')
    this.modelIOBtn=$('<a class="w3-bar-item w3-button" href="#">Models</a>')
    this.showForgeViewBtn=$('<a class="w3-bar-item w3-button w3-hover-none w3-text-light-grey w3-hover-text-light-grey" style="opacity:.35" href="#">ForgeView</a>')
    this.showGISViewBtn=$('<a class="w3-bar-item w3-button w3-hover-none w3-text-light-grey w3-hover-text-light-grey" style="opacity:.35" href="#">GISView</a>')
    this.editLayoutBtn=$('<a class="w3-bar-item w3-button" href="#"><i class="fa fa-edit"></i></a>')


    this.switchLayoutSelector=new simpleSelectMenu("Layout")

    $("#mainToolBar").empty()
    $("#mainToolBar").append(this.switchADTInstanceBtn,this.modelIOBtn,this.showForgeViewBtn,this.showGISViewBtn
        ,this.switchLayoutSelector.DOM,this.editLayoutBtn)

    this.switchADTInstanceBtn.on("click",()=>{ adtInstanceSelectionDialog.popup() })
    this.modelIOBtn.on("click",()=>{ modelManagerDialog.popup() })
    this.editLayoutBtn.on("click",()=>{ editLayoutDialog.popup() })


    this.switchLayoutSelector.callBack_clickOption=(optionText,optionValue)=>{
        globalCache.currentLayoutName=optionValue
        this.broadcastMessage({ "message": "layoutChange"})
        if(optionValue=="[NA]") this.switchLayoutSelector.changeName("Layout","")
        else this.switchLayoutSelector.changeName("Layout:",optionText)
    }
}

mainToolbar.prototype.updateLayoutSelector = function () {
    var curSelect=this.switchLayoutSelector.curSelectVal
    this.switchLayoutSelector.clearOptions()
    this.switchLayoutSelector.addOption('[No Layout Specified]','[NA]')

    for (var ind in globalCache.layoutJSON) {
        this.switchLayoutSelector.addOption(ind)
    }

    if(curSelect!=null && this.switchLayoutSelector.findOption(curSelect)==null) this.switchLayoutSelector.changeName("Layout","")
}

mainToolbar.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="layoutsUpdated") {
        this.updateLayoutSelector()
    }
}

module.exports = new mainToolbar();
},{"./adtInstanceSelectionDialog":1,"./editLayoutDialog":2,"./globalCache":3,"./modelManagerDialog":10,"./simpleSelectMenu":12}],7:[function(require,module,exports){
'use strict';
const topologyDOM=require("./topologyDOM.js")
const twinsTree=require("./twinsTree")
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")
const modelEditorDialog = require("./modelEditorDialog")
const editLayoutDialog = require("./editLayoutDialog")
const mainToolbar = require("./mainToolbar")
const infoPanel= require("./infoPanel")

function mainUI() {
    this.initUILayout()

    this.twinsTree= new twinsTree($("#treeHolder"),$("#treeSearch"))
    
    this.mainToolbar=mainToolbar
    mainToolbar.render()
    this.topologyInstance=new topologyDOM($('#canvas'))
    this.topologyInstance.init()
    this.infoPanel= infoPanel

    this.broadcastMessage() //initialize all ui components to have the broadcast capability
    this.prepareData()
}

mainUI.prototype.prepareData=async function(){
    var promiseArr=[
        modelManagerDialog.preparationFunc(),
        adtInstanceSelectionDialog.preparationFunc()
    ]
    await Promise.allSettled(promiseArr);
    adtInstanceSelectionDialog.popup()
}


mainUI.prototype.assignBroadcastMessage=function(uiComponent){
    uiComponent.broadcastMessage=(msgObj)=>{this.broadcastMessage(uiComponent,msgObj)}
}

mainUI.prototype.broadcastMessage=function(source,msgPayload){
    var componentsArr=[this.twinsTree,adtInstanceSelectionDialog,modelManagerDialog,modelEditorDialog,editLayoutDialog,
         this.mainToolbar,this.topologyInstance,this.infoPanel]

    if(source==null){
        for(var i=0;i<componentsArr.length;i++){
            var theComponent=componentsArr[i]
            this.assignBroadcastMessage(theComponent)
        }
    }else{
        for(var i=0;i<componentsArr.length;i++){
            var theComponent=componentsArr[i]
            if(theComponent.rxMessage && theComponent!=source) theComponent.rxMessage(msgPayload)
        }
    }
}

mainUI.prototype.initUILayout = function () {
    var myLayout = $('body').layout({
        //	reference only - these options are NOT required because 'true' is the default
        closable: true	// pane can open & close
        , resizable: true	// when open, pane can be resized 
        , slidable: true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
        , livePaneResizing: true

        //	some resizing/toggling settings
        , north__slidable: false	// OVERRIDE the pane-default of 'slidable=true'
        //, north__togglerLength_closed: '100%'	// toggle-button is full-width of resizer-bar
        , north__spacing_closed: 6		// big resizer-bar when open (zero height)
        , north__spacing_open:0
        , north__resizable: false	// OVERRIDE the pane-default of 'resizable=true'
        , north__closable: false
        , west__closable: false
        , east__closable: false
        

        //	some pane-size settings
        , west__minSize: 100
        , east__size: 300
        , east__minSize: 200
        , east__maxSize: .5 // 50% of layout width
        , center__minWidth: 100
        ,east__closable: false
        ,west__closable: false
        ,east__initClosed:	true
    });


    /*
     *	DISABLE TEXT-SELECTION WHEN DRAGGING (or even _trying_ to drag!)
     *	this functionality will be included in RC30.80
     */
    $.layout.disableTextSelection = function () {
        var $d = $(document)
            , s = 'textSelectionDisabled'
            , x = 'textSelectionInitialized'
            ;
        if ($.fn.disableSelection) {
            if (!$d.data(x)) // document hasn't been initialized yet
                $d.on('mouseup', $.layout.enableTextSelection).data(x, true);
            if (!$d.data(s))
                $d.disableSelection().data(s, true);
        }
        //console.log('$.layout.disableTextSelection');
    };
    $.layout.enableTextSelection = function () {
        var $d = $(document)
            , s = 'textSelectionDisabled';
        if ($.fn.enableSelection && $d.data(s))
            $d.enableSelection().data(s, false);
        //console.log('$.layout.enableTextSelection');
    };
    $(".ui-layout-resizer-north").hide()
    $(".ui-layout-west").css("border-right","solid 1px lightGray")
    $(".ui-layout-west").addClass("w3-card")

}


module.exports = new mainUI();
},{"./adtInstanceSelectionDialog":1,"./editLayoutDialog":2,"./infoPanel":4,"./mainToolbar":6,"./modelEditorDialog":9,"./modelManagerDialog":10,"./topologyDOM.js":14,"./twinsTree":15}],8:[function(require,module,exports){
//This is a singleton class

function modelAnalyzer(){
    this.DTDLModels={}
    this.relationshipTypes={}
}

modelAnalyzer.prototype.clearAllModels=function(){
    console.log("clear all model info")
    for(var id in this.DTDLModels) delete this.DTDLModels[id]
}

modelAnalyzer.prototype.resetAllModels=function(arr){
    for(var modelID in this.DTDLModels){
        var jsonStr=this.DTDLModels[modelID]["original"]
        this.DTDLModels[modelID]=JSON.parse(jsonStr)
        this.DTDLModels[modelID]["original"]=jsonStr
    }
}


modelAnalyzer.prototype.addModels=function(arr){
    arr.forEach((ele)=>{
        var modelID= ele["@id"]
        ele["original"]=JSON.stringify(ele)
        this.DTDLModels[modelID]=ele
    })
}


modelAnalyzer.prototype.recordAllBaseClasses= function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;

    parentObj[baseClassID]=1

    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.recordAllBaseClasses(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandEditablePropertiesFromBaseClass = function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;
    if (baseClass.editableProperties) {
        for (var ind in baseClass.editableProperties) parentObj[ind] = baseClass.editableProperties[ind]
    }
    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.expandEditablePropertiesFromBaseClass(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandValidRelationshipTypesFromBaseClass = function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;
    if (baseClass.validRelationships) {
        for (var ind in baseClass.validRelationships) {
            if(parentObj[ind]==null) parentObj[ind] = this.relationshipTypes[ind][baseClassID]
        }
    }
    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.expandValidRelationshipTypesFromBaseClass(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandEditableProperties=function(parentObj,dataInfo,embeddedSchema){
    dataInfo.forEach((oneContent)=>{
        if(oneContent["@type"]=="Relationship") return;
        if(oneContent["@type"]=="Property"
        ||(Array.isArray(oneContent["@type"]) && oneContent["@type"].includes("Property"))
        || oneContent["@type"]==null) {
            if(typeof(oneContent["schema"]) != 'object' && embeddedSchema[oneContent["schema"]]!=null) oneContent["schema"]=embeddedSchema[oneContent["schema"]]

            if(typeof(oneContent["schema"]) === 'object' && oneContent["schema"]["@type"]=="Object"){
                var newParent={}
                parentObj[oneContent["name"]]=newParent
                this.expandEditableProperties(newParent,oneContent["schema"]["fields"],embeddedSchema)
            }else if(typeof(oneContent["schema"]) === 'object' && oneContent["schema"]["@type"]=="Enum"){
                parentObj[oneContent["name"]]=oneContent["schema"]["enumValues"]
            }else{
                parentObj[oneContent["name"]]=oneContent["schema"]
            }           
        }
    })
}


modelAnalyzer.prototype.analyze=function(){
    console.log("analyze model info")
    //analyze all relationship types
    for (var id in this.relationshipTypes) delete this.relationshipTypes[id]
    for (var modelID in this.DTDLModels) {
        var ele = this.DTDLModels[modelID]
        var embeddedSchema = {}
        if (ele.schemas) {
            var tempArr;
            if (Array.isArray(ele.schemas)) tempArr = ele.schemas
            else tempArr = [ele.schemas]
            tempArr.forEach((ele) => {
                embeddedSchema[ele["@id"]] = ele
            })
        }

        var contentArr = ele.contents
        if (!contentArr) continue;
        contentArr.forEach((oneContent) => {
            if (oneContent["@type"] == "Relationship") {
                if(!this.relationshipTypes[oneContent["name"]]) this.relationshipTypes[oneContent["name"]]= {}
                this.relationshipTypes[oneContent["name"]][modelID] = oneContent
                oneContent.editableRelationshipProperties = {}
                if (Array.isArray(oneContent.properties)) {
                    this.expandEditableProperties(oneContent.editableRelationshipProperties, oneContent.properties, embeddedSchema)
                }
            }
        })
    }

    //analyze each model's property that can be edited
    for(var modelID in this.DTDLModels){ //expand possible embedded schema to editableProperties, also extract possible relationship types for this model
        var ele=this.DTDLModels[modelID]
        var embeddedSchema={}
        if(ele.schemas){
            var tempArr;
            if(Array.isArray(ele.schemas)) tempArr=ele.schemas
            else tempArr=[ele.schemas]
            tempArr.forEach((ele)=>{
                embeddedSchema[ele["@id"]]=ele
            })
        }
        ele.editableProperties={}
        ele.validRelationships={}
        ele.includedComponents=[]
        ele.allBaseClasses={}
        if(Array.isArray(ele.contents)){
            this.expandEditableProperties(ele.editableProperties,ele.contents,embeddedSchema)

            ele.contents.forEach((oneContent)=>{
                if(oneContent["@type"]=="Relationship") {
                    ele.validRelationships[oneContent["name"]]=this.relationshipTypes[oneContent["name"]][modelID]
                }
            })
        }
    }

    for(var modelID in this.DTDLModels){//expand component properties
        var ele=this.DTDLModels[modelID]
        if(Array.isArray(ele.contents)){
            ele.contents.forEach(oneContent=>{
                if(oneContent["@type"]=="Component"){
                    var componentName=oneContent["name"]
                    var componentClass=oneContent["schema"]
                    ele.editableProperties[componentName]={}
                    this.expandEditablePropertiesFromBaseClass(ele.editableProperties[componentName],componentClass)
                    ele.includedComponents.push(componentName)
                } 
            })
        }
    }

    for(var modelID in this.DTDLModels){//expand base class properties to editableProperties and valid relationship types to validRelationships
        var ele=this.DTDLModels[modelID]
        var baseClassIDs=ele.extends;
        if(baseClassIDs==null) continue;
        if(Array.isArray(baseClassIDs)) var tmpArr=baseClassIDs
        else tmpArr=[baseClassIDs]
        tmpArr.forEach((eachBase)=>{
            this.recordAllBaseClasses(ele.allBaseClasses,eachBase)
            this.expandEditablePropertiesFromBaseClass(ele.editableProperties,eachBase)
            this.expandValidRelationshipTypesFromBaseClass(ele.validRelationships,eachBase)
        })
    }

    //console.log(this.DTDLModels)
    //console.log(this.relationshipTypes)
}


module.exports = new modelAnalyzer();
},{}],9:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")

function modelEditorDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

modelEditorDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:665px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Model Editor</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var buttonRow=$('<div  style="height:40px" class="w3-bar"></div>')
    this.contentDOM.append(buttonRow)
    var importButton =$('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green w3-right" style="height:100%">Import</button>')
    buttonRow.append(importButton)

    importButton.on("click", () => {
        var modelToBeImported = [this.dtdlobj]
        $.post("editADT/importModels", { "models": JSON.stringify(modelToBeImported) }, (data) => {
            if (data == "") {//successful
                alert("Model "+ this.dtdlobj["displayName"]+" is created!")
                this.broadcastMessage({ "message": "ADTModelEdited"})
                modelAnalyzer.addModels(modelToBeImported)
                this.popup() //refresh content
            } else { //error happens
                alert(data)
            }
        });
    })

    var lable=$('<div class="w3-bar-item w3-opacity" style="padding-right:5px;font-size:1.2em;">Model Template</div>')
    buttonRow.append(lable)
    var modelTemplateSelector=new simpleSelectMenu(" ",{withBorder:1,fontSize:"1.2em",colorClass:"w3-light-gray",buttonCSS:{"padding":"5px 10px"},"optionListHeight":300})
    buttonRow.append(modelTemplateSelector.DOM)
    modelTemplateSelector.callBack_clickOption=(optionText,optionValue)=>{
        modelTemplateSelector.changeName(optionText)
        this.chooseTemplate(optionValue)
    }
    modelTemplateSelector.addOption("New Model...","New")
    for(var modelName in modelAnalyzer.DTDLModels){
        modelTemplateSelector.addOption(modelName)
    }

    var panelHeight="450px"
    var row2=$('<div class="w3-cell-row" style="margin:2px"></div>')
    this.contentDOM.append(row2)
    var leftSpan=$('<div class="w3-card" style="padding:5px;width:330px;padding-right:5px;height:'+panelHeight+';overflow:auto"></div>')
    row2.append(leftSpan)
    this.leftSpan=leftSpan

    var rightSpan=$('<div class="w3-container w3-cell"></div>')
    row2.append(rightSpan) 
    var dtdlScriptPanel=$('<div class="w3-card-2 w3-white" style="overflow:auto;margin-top:2px;width:310px;height:'+panelHeight+'"></div>')
    rightSpan.append(dtdlScriptPanel)
    this.dtdlScriptPanel=dtdlScriptPanel

    modelTemplateSelector.triggerOptionIndex(0)
}

modelEditorDialog.prototype.chooseTemplate=function(tempalteName){
    if(tempalteName!="New"){
        this.dtdlobj=JSON.parse(modelAnalyzer.DTDLModels[tempalteName]["original"])
    }else{
        this.dtdlobj = {
            "@id": "dtmi:aNameSpace:aModelID;1",
            "@context": ["dtmi:dtdl:context;2"],
            "@type": "Interface",
            "displayName": "New Model",
            "contents": [
                {
                    "@type": "Property",
                    "name": "attribute1",
                    "schema": "double"
                },{
                    "@type": "Relationship",
                    "name": "link"
                }
            ]
        }
    }
    this.leftSpan.empty()

    this.refreshDTDL()
    this.leftSpan.append($('<div class="w3-bar"><div class="w3-bar-item w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Model ID & Name<p style="position:absolute;text-align:left;font-weight:normal;top:-10px;width:200px" class="w3-text w3-tag w3-tiny">model ID contains namespace, a model string and a version number</p></div></div>'))
    new idRow(this.dtdlobj,this.leftSpan,()=>{this.refreshDTDL()})
    new displayNameRow(this.dtdlobj,this.leftSpan,()=>{this.refreshDTDL()})

    if(!this.dtdlobj["contents"])this.dtdlobj["contents"]=[]
    new parametersRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()},this.DOM.offset())
    new relationsRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()},this.DOM.offset())
    new componentsRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()})

    if(!this.dtdlobj["extends"])this.dtdlobj["extends"]=[]
    new baseClassesRow(this.dtdlobj["extends"],this.leftSpan,()=>{this.refreshDTDL()})
}

modelEditorDialog.prototype.refreshDTDL=function(){
    this.dtdlScriptPanel.empty()
    this.dtdlScriptPanel.append($('<div style="height:20px;width:100px" class="w3-bar w3-gray">Generated DTDL</div>'))
    this.dtdlScriptPanel.append($('<pre style="color:gray">'+JSON.stringify(this.dtdlobj,null,2)+'</pre>'))
}

module.exports = new modelEditorDialog();


function baseClassesRow(dtdlObj,parentDOM,refreshDTDLF){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item  w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Base Classes<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Base class model\'s parameters and relationship type are inherited</p></div></div>')

    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)
    addButton.on("click",()=>{
        var newObj = "unknown"
        dtdlObj.push(newObj)
        new singleBaseclassRow(newObj,contentDOM,refreshDTDLF,dtdlObj)
        refreshDTDLF()
    })
    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        new singleBaseclassRow(element,contentDOM,refreshDTDLF,dtdlObj)
    });
}

function singleBaseclassRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj){
    var DOM = $('<div class="w3-cell-row"></div>')
    var baseClassNameInput=$('<input type="text" style="outline:none;display:inline;width:220px;padding:4px"  placeholder="base model id"/>').addClass("w3-bar-item w3-input w3-border");
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(baseClassNameInput,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] == dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    parentDOM.append(DOM)

    baseClassNameInput.val(dtdlObj)
    baseClassNameInput.on("change",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] == dtdlObj) {
                parentDtdlObj[i]=baseClassNameInput.val()
                break;
            }
        }
        refreshDTDLF()
    })
}

function componentsRow(dtdlObj,parentDOM,refreshDTDLF){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item  w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Components<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Component model\'s parameters are embedded under a name</p></div></div>')

    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)

    addButton.on("click",()=>{
        var newObj = {
            "@type": "Component",
            "name": "SomeComponent",
            "schema":"dtmi:someComponentModel;1"
        }
        dtdlObj.push(newObj)
        new singleComponentRow(newObj,contentDOM,refreshDTDLF,dtdlObj)
        refreshDTDLF()
    })
    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Component") return
        new singleComponentRow(element,contentDOM,refreshDTDLF,dtdlObj)
    });
}

function singleComponentRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj){
    var DOM = $('<div class="w3-cell-row"></div>')
    var componentNameInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="component name"/>').addClass("w3-bar-item w3-input w3-border");
    var schemaInput=$('<input type="text" style="outline:none;display:inline;width:160px;padding:4px"  placeholder="component model id..."/>').addClass("w3-bar-item w3-input w3-border");
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(componentNameInput,schemaInput,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    parentDOM.append(DOM)

    componentNameInput.val(dtdlObj["name"])
    schemaInput.val(dtdlObj["schema"]||"")

    componentNameInput.on("change",()=>{
        dtdlObj["name"]=componentNameInput.val()
        refreshDTDLF()
    })
    schemaInput.on("change",()=>{
        dtdlObj["schema"]=schemaInput.val()
        refreshDTDLF()
    })
}

function relationsRow(dtdlObj,parentDOM,refreshDTDLF,dialogOffset){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Relationship Types<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Relationship can have its own parameters</p></div></div>')


    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)

    addButton.on("click",()=>{
        var newObj = {
            "@type": "Relationship",
            "name": "relation1",
        }
        dtdlObj.push(newObj)
        new singleRelationTypeRow(newObj,contentDOM,refreshDTDLF,dtdlObj,dialogOffset)
        refreshDTDLF()
    })

    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Relationship") return
        new singleRelationTypeRow(element,contentDOM,refreshDTDLF,dtdlObj,dialogOffset)
    });
}

function singleRelationTypeRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj,dialogOffset){
    var DOM = $('<div class="w3-cell-row"></div>')
    var relationNameInput=$('<input type="text" style="outline:none;display:inline;width:90px;padding:4px"  placeholder="relation name"/>').addClass("w3-bar-item w3-input w3-border");
    var targetModelID=$('<input type="text" style="outline:none;display:inline;width:140px;padding:4px"  placeholder="(optional)target model"/>').addClass("w3-bar-item w3-input w3-border");
    var addButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-cog fa-lg"></i></button>')
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(relationNameInput,targetModelID,addButton,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    var contentDOM=$('<div style="padding-left:10px"></div>')
    DOM.append(contentDOM)
    parentDOM.append(DOM)

    relationNameInput.val(dtdlObj["name"])
    targetModelID.val(dtdlObj["target"]||"")

    addButton.on("click",()=>{
        if(! dtdlObj["properties"]) dtdlObj["properties"]=[]
        var newObj = {
            "name": "newP",
            "schema": "double"
        }
        dtdlObj["properties"].push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj["properties"],null,dialogOffset)
        refreshDTDLF()
    })

    relationNameInput.on("change",()=>{
        dtdlObj["name"]=relationNameInput.val()
        refreshDTDLF()
    })
    targetModelID.on("change",()=>{
        if(targetModelID.val()=="") delete dtdlObj["target"]
        else dtdlObj["target"]=targetModelID.val()
        refreshDTDLF()
    })
    if(dtdlObj["properties"] && dtdlObj["properties"].length>0){
        var properties=dtdlObj["properties"]
        properties.forEach(oneProperty=>{
            new singleParameterRow(oneProperty,contentDOM,refreshDTDLF,dtdlObj["properties"],null,dialogOffset)
        })
    }
}

function parametersRow(dtdlObj,parentDOM,refreshDTDLF,dialogOffset){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Parameters</div></div>')
    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)
    addButton.on("click",()=>{
        var newObj = {
            "@type": "Property",
            "name": "newP",
            "schema": "double"
        }
        dtdlObj.push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj,"topLevel",dialogOffset)
        refreshDTDLF()
    })

    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Property") return
        new singleParameterRow(element,contentDOM,refreshDTDLF,dtdlObj,"topLevel",dialogOffset)
    });
}

function singleParameterRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj,topLevel,dialogOffset){
    var DOM = $('<div class="w3-cell-row"></div>')
    var parameterNameInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="parameter name"/>').addClass("w3-bar-item w3-input w3-border");
    var enumValueInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="str1,str2,..."/>').addClass("w3-bar-item w3-input w3-border");
    var addButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-plus fa-lg"></i></button>')
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    var ptypeSelector=new simpleSelectMenu(" ",{withBorder:1,fontSize:"1em",colorClass:"w3-light-gray w3-bar-item",buttonCSS:{"padding":"4px 5px"},"optionListHeight":300,"isClickable":1
    ,"optionListMarginTop":-150,"optionListMarginLeft":60,"adjustPositionAnchor":dialogOffset})
    

    ptypeSelector.addOptionArr(["Enum","Object","boolean","date","dateTime","double","duration","float","integer","long","string","time"])
    DOM.append(parameterNameInput,ptypeSelector.DOM,enumValueInput,addButton,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })
    
    var contentDOM=$('<div style="padding-left:10px"></div>')
    DOM.append(contentDOM)
    parentDOM.append(DOM)

    parameterNameInput.val(dtdlObj["name"])
    ptypeSelector.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
        ptypeSelector.changeName(optionText)
        contentDOM.empty()//clear all content dom content
        if(realMouseClick){
            for(var ind in dtdlObj) delete dtdlObj[ind]    //clear all object content
            if(topLevel) dtdlObj["@type"]="Property"
            dtdlObj["name"]=parameterNameInput.val()
        } 
        if(optionText=="Enum"){
            enumValueInput.val("")
            enumValueInput.show();
            addButton.hide()
            if(realMouseClick) dtdlObj["schema"]={"@type": "Enum","valueSchema": "string"}
        }else if(optionText=="Object"){
            enumValueInput.hide();
            addButton.show()
            if(realMouseClick) dtdlObj["schema"]={"@type": "Object"}
        }else{
            if(realMouseClick) dtdlObj["schema"]=optionText
            enumValueInput.hide();
            addButton.hide()
        }
        refreshDTDLF()
    }
    addButton.on("click",()=>{
        if(! dtdlObj["schema"]["fields"]) dtdlObj["schema"]["fields"]=[]
        var newObj = {
            "name": "newP",
            "schema": "double"
        }
        dtdlObj["schema"]["fields"].push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj["schema"]["fields"],null,dialogOffset)
        refreshDTDLF()
    })

    parameterNameInput.on("change",()=>{
        dtdlObj["name"]=parameterNameInput.val()
        refreshDTDLF()
    })
    enumValueInput.on("change",()=>{
        var valueArr=enumValueInput.val().split(",")
        dtdlObj["schema"]["enumValues"]=[]
        valueArr.forEach(aVal=>{
            dtdlObj["schema"]["enumValues"].push({
                "name": aVal,
                "enumValue": aVal
              })
        })
        refreshDTDLF()
    })
    if(typeof(dtdlObj["schema"]) != 'object') var schema=dtdlObj["schema"]
    else schema=dtdlObj["schema"]["@type"]
    ptypeSelector.triggerOptionValue(schema)
    if(schema=="Enum"){
        var enumArr=dtdlObj["schema"]["enumValues"]
        if(enumArr!=null){
            var inputStr=""
            enumArr.forEach(oneEnumValue=>{inputStr+=oneEnumValue.enumValue+","})
            inputStr=inputStr.slice(0, -1)//remove the last ","
            enumValueInput.val(inputStr)
        }
    }else if(schema=="Object"){
        var fields=dtdlObj["schema"]["fields"]
        fields.forEach(oneField=>{
            new singleParameterRow(oneField,contentDOM,refreshDTDLF,dtdlObj["schema"]["fields"],null,dialogOffset)
        })
    }
}


function idRow(dtdlObj,parentDOM,refreshDTDLF){
    var DOM = $('<div class="w3-cell-row"></div>')
    var label1=$('<div class="w3-opacity" style="display:inline">dtmi:</div>')
    var domainInput=$('<input type="text" style="outline:none;display:inline;width:80px;padding:4px"  placeholder="Namespace"/>').addClass("w3-input w3-border");
    var modelIDInput=$('<input type="text" style="outline:none;display:inline;width:140px;padding:4px"  placeholder="ModelID"/>').addClass("w3-input w3-border");
    var versionInput=$('<input type="text" style="outline:none;display:inline;width:60px;padding:4px"  placeholder="version"/>').addClass("w3-input w3-border");
    DOM.append(label1,domainInput,$('<div class="w3-opacity" style="display:inline">:</div>'),modelIDInput,$('<div class="w3-opacity" style="display:inline">;</div>'),versionInput)
    parentDOM.append(DOM)

    var valueChange=()=>{
        var str=`dtmi:${domainInput.val()}:${modelIDInput.val()};${versionInput.val()}`
        dtdlObj["@id"]=str
        refreshDTDLF()
    }
    domainInput.on("change",valueChange)
    modelIDInput.on("change",valueChange)
    versionInput.on("change",valueChange)

    var str=dtdlObj["@id"]
    if(str!="" && str!=null){
        var arr1=str.split(";")
        if(arr1.length!=2) return;
        versionInput.val(arr1[1])
        var arr2=arr1[0].split(":")
        domainInput.val(arr2[1])
        arr2.shift(); arr2.shift()
        modelIDInput.val(arr2.join(":"))
    }
}

function displayNameRow(dtdlObj,parentDOM,refreshDTDLF){
    var DOM = $('<div class="w3-cell-row"></div>')
    var label1=$('<div class="w3-opacity" style="display:inline">Display Name:</div>')
    var nameInput=$('<input type="text" style="outline:none;display:inline;width:150px;padding:4px"  placeholder="ModelID"/>').addClass("w3-input w3-border");
    DOM.append(label1,nameInput)
    parentDOM.append(DOM)
    var valueChange=()=>{
        dtdlObj["displayName"]=nameInput.val()
        refreshDTDLF()
    }
    nameInput.on("change",valueChange)
    var str=dtdlObj["displayName"]
    if(str!="" && str!=null) nameInput.val(str)
}
},{"./modelAnalyzer":8,"./simpleSelectMenu":12}],10:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const simpleTree= require("./simpleTree")
const modelEditorDialog = require("./modelEditorDialog")
const globalCache = require("./globalCache")

function modelManagerDialog() {
    this.models={}
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

modelManagerDialog.prototype.preparationFunc = async function () {
    return new Promise((resolve, reject) => {
        try{
            $.get("visualDefinition/readVisualDefinition", (data, status) => {
                if(data!="" && typeof(data)==="object") globalCache.visualDefinition=data;
                resolve()
            })
        }catch(e){
            reject(e)
        }
    })
}

modelManagerDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:650px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Models</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var importModelsBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Import</button>')
    var actualImportModelsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    var modelEditorBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Create Model</button>')
    var exportModelBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Download Models</button>')
    this.contentDOM.children(':first').append(importModelsBtn,actualImportModelsBtn, modelEditorBtn,exportModelBtn)
    importModelsBtn.on("click", ()=>{
        actualImportModelsBtn.trigger('click');
    });
    actualImportModelsBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        await this.readModelFilesContentAndImport(files)
        actualImportModelsBtn.val("")
    })
    modelEditorBtn.on("click",()=>{
        this.DOM.hide()
        modelEditorDialog.popup()
    })

    exportModelBtn.on("click", () => {
        var modelArr=[]
        for(var modelName in this.models) modelArr.push(this.models[modelName])
        var pom = $("<a></a>")
        pom.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(modelArr)));
        pom.attr('download', "exportModels.json");
        pom[0].click()
    })


    var row2=$('<div class="w3-cell-row" style="margin-top:2px"></div>')
    this.contentDOM.append(row2)
    var leftSpan=$('<div class="w3-cell" style="width:240px;padding-right:5px"></div>')
    row2.append(leftSpan)
    leftSpan.append($('<div style="height:30px" class="w3-bar w3-red"><div class="w3-bar-item" style="">Models</div></div>'))
    
    var modelList = $('<ul class="w3-ul w3-hoverable">')
    modelList.css({"overflow-x":"hidden","overflow-y":"auto","height":"420px", "border":"solid 1px lightgray"})
    leftSpan.append(modelList)
    this.modelList = modelList;
    
    var rightSpan=$('<div class="w3-container w3-cell"></div>')
    row2.append(rightSpan) 
    var panelCardOut=$('<div class="w3-card-2 w3-white" style="margin-top:2px"></div>')

    this.modelButtonBar=$('<div class="w3-bar" style="height:35px"></div>')
    panelCardOut.append(this.modelButtonBar)

    rightSpan.append(panelCardOut)
    var panelCard=$('<div style="width:400px;height:405px;overflow:auto;margin-top:2px"></div>')
    panelCardOut.append(panelCard)
    this.panelCard=panelCard;

    this.modelButtonBar.empty()
    panelCard.html("<a style='display:block;font-style:italic;color:gray;padding-left:5px'>Choose a model to view infomration</a>")

    this.listModels()
}

modelManagerDialog.prototype.resizeImgFile = async function(theFile,max_size) {
    return new Promise((resolve, reject) => {
        try {
            var reader = new FileReader();
            var tmpImg = new Image();
            reader.onload = () => {
                tmpImg.onload =  ()=> {
                    var canvas = document.createElement('canvas')
                    var width = tmpImg.width
                    var height = tmpImg.height;
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(tmpImg, 0, 0, width, height);
                    var dataUrl = canvas.toDataURL('image/png');
                    resolve(dataUrl)
                }
                tmpImg.src = reader.result;
            }
            reader.readAsDataURL(theFile);
        } catch (e) {
            reject(e)
        }
    })
}

modelManagerDialog.prototype.fillRightSpan=async function(modelName){
    this.panelCard.empty()
    this.modelButtonBar.empty()
    var modelID=this.models[modelName]['@id']

    var delBtn = $('<button style="margin-bottom:2px" class="w3-button w3-light-gray w3-hover-pink w3-border-right">Delete Model</button>')
    var importPicBtn = $('<button class="w3-button w3-light-gray w3-hover-amber w3-border-right">Upload Avarta</button>')
    var actualImportPicBtn =$('<input type="file" name="img" style="display:none"></input>')
    var clearAvartaBtn = $('<button class="w3-button w3-light-gray w3-hover-pink w3-border-right">Clear Avarta</button>')
    this.modelButtonBar.append(delBtn,importPicBtn,actualImportPicBtn,clearAvartaBtn)

    importPicBtn.on("click", ()=>{
        actualImportPicBtn.trigger('click');
    });

    actualImportPicBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        var theFile=files[0]
        
        if(theFile.type=="image/svg+xml"){
            var str= await this.readOneFile(theFile)
            var dataUrl='data:image/svg+xml;utf8,' + encodeURIComponent(str);
        }else if(theFile.type.match('image.*')){
            var dataUrl= await this.resizeImgFile(theFile,70)
        } else {
            var confirmDialogDiv=new simpleConfirmDialog()
            confirmDialogDiv.show({ width: "200px" },
                {
                    title: "Note"
                    , content: "Please import image file (png,jpg,svg and so on)"
                    , buttons: [{colorClass:"w3-gray",text:"Ok","clickFunc":()=>{confirmDialogDiv.close()}}]
                }
            )
        }
        if(this.avartaImg) this.avartaImg.attr("src",dataUrl)
        var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
        if(!visualJson[modelID]) visualJson[modelID]={}
        visualJson[modelID].avarta=dataUrl
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"avarta":dataUrl })
        actualImportPicBtn.val("")
    })

    clearAvartaBtn.on("click", ()=>{
        var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
        if(visualJson[modelID]) delete visualJson[modelID].avarta 
        if(this.avartaImg) this.avartaImg.removeAttr('src');
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"noAvarta":true })
    });


    delBtn.on("click",()=>{
        var confirmDialogDiv = new simpleConfirmDialog()

        confirmDialogDiv.show(
            { width: "250px" },
            {
                title: "Warning"
                , content: "This will DELETE model \"" + modelID + "\""
                , buttons: [
                    {
                        colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                            confirmDialogDiv.close();
                            $.post("editADT/deleteModel",{"model":modelID}, (data)=> {
                                if(data==""){//successful
                                    delete modelAnalyzer.DTDLModels[modelID]
                                    delete this.models[modelName]
                                    this.tree.deleteLeafNode(modelName)
                                    this.broadcastMessage({ "message": "ADTModelsChange", "models":this.models})
                                    this.panelCard.empty()
                                    if(globalCache.visualDefinition[globalCache.selectedADT] && globalCache.visualDefinition[globalCache.selectedADT][modelID] ){
                                        delete globalCache.visualDefinition[globalCache.selectedADT][modelID]
                                        this.saveVisualDefinition()
                                    }
                                }else{ //error happens
                                    alert(data)
                                }
                            });
                        }
                    },
                    {
                        colorClass: "w3-gray", text: "Cancel", "clickFunc": () => {
                            confirmDialogDiv.close()
                        }
                    }
                ]
            }
        )
        
    })
    
    var VisualizationDOM=this.addAPartInRightSpan("Visualization")
    var editablePropertiesDOM=this.addAPartInRightSpan("Editable Properties And Relationships")
    var baseClassesDOM=this.addAPartInRightSpan("Base Classes")
    var originalDefinitionDOM=this.addAPartInRightSpan("Original Definition")

    var str=JSON.stringify(this.models[modelName],null,2)
    originalDefinitionDOM.append($('<pre id="json">'+str+'</pre>'))

    var edittableProperties=modelAnalyzer.DTDLModels[modelID].editableProperties
    this.fillEditableProperties(edittableProperties,editablePropertiesDOM)
    var validRelationships=modelAnalyzer.DTDLModels[modelID].validRelationships
    this.fillRelationshipInfo(validRelationships,editablePropertiesDOM)

    this.fillVisualization(modelID,VisualizationDOM)

    this.fillBaseClasses(modelAnalyzer.DTDLModels[modelID].allBaseClasses,baseClassesDOM) 
}

modelManagerDialog.prototype.fillBaseClasses=function(baseClasses,parentDom){
    for(var ind in baseClasses){
        var keyDiv= $("<label style='display:block;padding:.1em'>"+ind+"</label>")
        parentDom.append(keyDiv)
    }
}

modelManagerDialog.prototype.fillVisualization=function(modelID,parentDom){
    var modelJson=modelAnalyzer.DTDLModels[modelID];
    var aTable=$("<table style='width:100%'></table>")
    aTable.html('<tr><td></td><td></td></tr>')
    parentDom.append(aTable) 

    var leftPart=aTable.find("td:first")
    var rightPart=aTable.find("td:nth-child(2)")
    rightPart.css({"width":"50px","height":"50px","border":"solid 1px lightGray"})
    
    var avartaImg=$("<img style='height:45px'></img>")
    rightPart.append(avartaImg)
    var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
    if(visualJson && visualJson[modelID] && visualJson[modelID].avarta) avartaImg.attr('src',visualJson[modelID].avarta)
    this.avartaImg=avartaImg;

    
    this.addOneVisualizationRow(modelID,leftPart)
    for(var ind in modelJson.validRelationships){
        this.addOneVisualizationRow(modelID,leftPart,ind)
    }
}
modelManagerDialog.prototype.addOneVisualizationRow=function(modelID,parentDom,relatinshipName){
    if(relatinshipName==null) var nameStr="◯" //visual for node
    else nameStr="⟜ "+relatinshipName
    var containerDiv=$("<div style='padding-bottom:8px'></div>")
    parentDom.append(containerDiv)
    var contentDOM=$("<label style='margin-right:10px'>"+nameStr+"</label>")
    containerDiv.append(contentDOM)

    var definedColor=null
    var definedShape=null
    var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
    if(relatinshipName==null){
        if(visualJson && visualJson[modelID] && visualJson[modelID].color) definedColor=visualJson[modelID].color
        if(visualJson && visualJson[modelID] && visualJson[modelID].shape) definedShape=visualJson[modelID].shape
    }else{
        if(visualJson && visualJson[modelID]
             && visualJson[modelID]["rels"]
              && visualJson[modelID]["rels"][relatinshipName]){
                  if(visualJson[modelID]["rels"][relatinshipName].color) definedColor=visualJson[modelID]["rels"][relatinshipName].color
                  if(visualJson[modelID]["rels"][relatinshipName].shape) definedShape=visualJson[modelID]["rels"][relatinshipName].shape
              }
    }

    var colorSelector=$('<select class="w3-border" style="outline:none"></select>')
    containerDiv.append(colorSelector)
    var colorArr=["Black","LightGray","Red","Green","Blue","Bisque","Brown","Coral","Crimson","DodgerBlue","Gold"]
    colorArr.forEach((oneColorCode)=>{
        var anOption=$("<option value='"+oneColorCode+"'>"+oneColorCode+"▧</option>")
        colorSelector.append(anOption)
        anOption.css("color",oneColorCode)
    })
    if(definedColor!=null) {
        colorSelector.val(definedColor)
        colorSelector.css("color",definedColor)
    }
    colorSelector.change((eve)=>{
        var selectColorCode=eve.target.value
        colorSelector.css("color", selectColorCode)
        if (!globalCache.visualDefinition[globalCache.selectedADT])
            globalCache.visualDefinition[globalCache.selectedADT] = {}
        var visualJson = globalCache.visualDefinition[globalCache.selectedADT]

        if(!visualJson[modelID]) visualJson[modelID]={}
        if(!relatinshipName) {
            visualJson[modelID].color=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"color":selectColorCode })
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].color=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"color":selectColorCode })
        }
        this.saveVisualDefinition()
    })

    var shapeSelector = $('<select class="w3-border" style="outline:none"></select>')
    containerDiv.append(shapeSelector)
    if(relatinshipName==null){
        shapeSelector.append($("<option value='ellipse'>◯</option>"))
        shapeSelector.append($("<option value='round-rectangle' style='font-size:120%'>▢</option>"))
        shapeSelector.append($("<option value='hexagon' style='font-size:130%'>⬡</option>"))
    }else{
        shapeSelector.append($("<option value='solid'>→</option>"))
        shapeSelector.append($("<option value='dotted'>⇢</option>"))
    }
    if(definedShape!=null) {
        shapeSelector.val(definedShape)
    }
    shapeSelector.change((eve)=>{
        var selectShape=eve.target.value
        if (!globalCache.visualDefinition[globalCache.selectedADT])
            globalCache.visualDefinition[globalCache.selectedADT] = {}
        var visualJson = globalCache.visualDefinition[globalCache.selectedADT]

        if(!visualJson[modelID]) visualJson[modelID]={}
        if(!relatinshipName) {
            visualJson[modelID].shape=selectShape
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"shape":selectShape })
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].shape=selectShape
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"shape":selectShape })
        }
        this.saveVisualDefinition()
    })
}

modelManagerDialog.prototype.saveVisualDefinition=function(){
    $.post("visualDefinition/saveVisualDefinition",{visualDefinitionJson:globalCache.visualDefinition})
}

modelManagerDialog.prototype.fillRelationshipInfo=function(validRelationships,parentDom){
    for(var ind in validRelationships){
        var keyDiv= $("<label style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</label>")
        parentDom.append(keyDiv)
        keyDiv.css("padding-top",".1em")
        var label=$("<label style='display:inline;background-color:yellowgreen;color:white;font-size:9px;padding:2px'>Relationship type</label>")
        parentDom.append(label)
        var contentDOM=$("<label></label>")
        contentDOM.css("display","block")
        contentDOM.css("padding-left","1em")
        parentDom.append(contentDOM)
        this.fillEditableProperties(validRelationships[ind].editableRelationshipProperties, contentDOM)
    }
}

modelManagerDialog.prototype.fillEditableProperties=function(jsonInfo,parentDom){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</div></label>")
        parentDom.append(keyDiv)
        keyDiv.css("padding-top",".1em")

        var contentDOM=$("<label></label>")
        if(Array.isArray(jsonInfo[ind])){
            contentDOM.text("enum")
            contentDOM.css({"background-color":"darkGray","color":"white","fontSize":"9px","padding":'2px'})
        }else if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.fillEditableProperties(jsonInfo[ind],contentDOM)
        }else {
            contentDOM.text(jsonInfo[ind])
            contentDOM.css({"background-color":"darkGray","color":"white","fontSize":"9px","padding":'2px'})
        }
        keyDiv.append(contentDOM)
    }
}


modelManagerDialog.prototype.addAPartInRightSpan=function(partName){
    var headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align" style="font-weight:bold"></button>')
    headerDOM.text(partName)
    var listDOM=$('<div class="w3-container w3-hide w3-border w3-show" style="background-color:white"></div>')
    this.panelCard.append(headerDOM,listDOM)

    headerDOM.on("click",(evt)=> {
        if(listDOM.hasClass("w3-show")) listDOM.removeClass("w3-show")
        else listDOM.addClass("w3-show")
 
        return false;
    });
    
    return listDOM;
}

modelManagerDialog.prototype.readModelFilesContentAndImport=async function(files){
    // files is a FileList of File objects. List some properties.
    var fileContentArr=[]
    for (var i = 0, f; f = files[i]; i++) {
        // Only process json files.
        if (f.type!="application/json") continue;
        try{
            var str= await this.readOneFile(f)
            var obj=JSON.parse(str)
            if(Array.isArray(obj)) fileContentArr=fileContentArr.concat(obj)
            else fileContentArr.push(obj)
        }catch(err){
            alert(err)
        }
    }
    if(fileContentArr.length==0) return;
    
    $.post("editADT/importModels",{"models":JSON.stringify(fileContentArr)}, (data)=> {
        if (data == "") {//successful
            this.listModels("shouldBroadCast")
        } else { //error happens
            alert(data)
        }
    });
    
}

modelManagerDialog.prototype.readOneFile= async function(aFile){
    return new Promise((resolve, reject) => {
        try{
            var reader = new FileReader();
            reader.onload = ()=> {
                resolve(reader.result)
            };
            reader.readAsText(aFile);
        }catch(e){
            reject(e)
        }
    })
}


modelManagerDialog.prototype.listModels=function(shouldBroadcast){
    this.modelList.empty()
    for(var ind in this.models) delete this.models[ind]

    $.get("queryADT/listModels", (data, status) => {
        if(data=="") data=[]
        data.forEach(oneItem=>{
            if(oneItem["displayName"]==null) oneItem["displayName"]=oneItem["@id"]
            if($.isPlainObject(oneItem["displayName"])){
                if(oneItem["displayName"]["en"]) oneItem["displayName"]=oneItem["displayName"]["en"]
                else oneItem["displayName"]=JSON.stringify(oneItem["displayName"])
            }
            if(this.models[oneItem["displayName"]]!=null){
                //repeated model display name
                oneItem["displayName"]=oneItem["@id"]
            }  
            this.models[oneItem["displayName"]] = oneItem
        })
        if(shouldBroadcast){
            modelAnalyzer.clearAllModels();
            modelAnalyzer.addModels(data)
            modelAnalyzer.analyze();
        }
        
        if(data.length==0){
            var zeroModelItem=$('<li style="font-size:0.9em">zero model record. Please import...</li>')
            this.modelList.append(zeroModelItem)
            zeroModelItem.css("cursor","default")
        }else{
            this.tree=new simpleTree(this.modelList,{"leafNameProperty":"displayName","noMultipleSelectAllowed":true,"hideEmptyGroup":true})

            this.tree.callback_afterSelectNodes=(nodesArr,mouseClickDetail)=>{
                var theNode=nodesArr[0]
                this.fillRightSpan(theNode.leafInfo["displayName"])
            }

            var groupNameList={}
            for(var modelName in this.models)  {
                var modelID= this.models[modelName]["@id"]
                groupNameList[this.modelNameToGroupName(modelID)]=1
            }
            var modelgroupSortArr=Object.keys(groupNameList)
            modelgroupSortArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
            modelgroupSortArr.forEach(oneGroupName=>{
                var gn=this.tree.addGroupNode({ displayName: oneGroupName })
                gn.expand()
            })

            for(var modelName in this.models){
                var modelID= this.models[modelName]["@id"]
                var gn=this.modelNameToGroupName(modelID)
                this.tree.addLeafnodeToGroup(gn,this.models[modelName])
            }

            this.tree.sortAllLeaves()
        }
        
        if(shouldBroadcast) this.broadcastMessage({ "message": "ADTModelsChange", "models":this.models })
    })


    
    //var g1 = this.tree.addGroupNode({displayName:"test"})
    //this.tree.addLeafnodeToGroup("test",{"displayName":"haha"},"skipRepeat")
    //return;
}

modelManagerDialog.prototype.modelNameToGroupName=function(modelName){
    var nameParts=modelName.split(":")
    if(nameParts.length>=2)  return nameParts[1]
    else return "Others"
}

modelManagerDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTModelEdited") this.listModels("shouldBroadcast")
}


module.exports = new modelManagerDialog();
},{"./globalCache":3,"./modelAnalyzer":8,"./modelEditorDialog":9,"./simpleConfirmDialog":11,"./simpleTree":13}],11:[function(require,module,exports){
function simpleConfirmDialog(){
    this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:102" class="w3-card-4"></div>')
    //this.DOM.css("overflow","hidden")
}

simpleConfirmDialog.prototype.show=function(cssOptions,otherOptions){
    this.DOM.css(cssOptions)
    this.DOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">' + otherOptions.title + '</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.close() })

    var dialogDiv=$('<div class="w3-container" style="margin-top:10px;margin-bottom:10px"></div>')
    dialogDiv.text(otherOptions.content)
    this.DOM.append(dialogDiv)
    this.dialogDiv=dialogDiv

    this.bottomBar=$('<div class="w3-bar"></div>')
    this.DOM.append(this.bottomBar)

    otherOptions.buttons.forEach(btn=>{
        var aButton=$('<button class="w3-button w3-right '+(btn.colorClass||"")+'" style="margin-right:2px;margin-left:2px">'+btn.text+'</button>')
        aButton.on("click",()=> { btn.clickFunc()  }  )
        this.bottomBar.append(aButton)    
    })
    $("body").append(this.DOM)
}

simpleConfirmDialog.prototype.close=function(){
    this.DOM.remove()
}

module.exports = simpleConfirmDialog;
},{}],12:[function(require,module,exports){
function simpleSelectMenu(buttonName,options){
    options=options||{} //{isClickable:1,withBorder:1,fontSize:"",colorClass:"",buttonCSS:""}
    if(options.isClickable){
        this.isClickable=true
        this.DOM=$('<div class="w3-dropdown-click"></div>')
    }else{
        this.DOM=$('<div class="w3-dropdown-hover "></div>')
        this.DOM.on("mouseover",(e)=>{
            this.adjustDropDownPosition()
        })
    }
    
    this.button=$('<button class="w3-button" style="outline: none;"><a>'+buttonName+'</a><a style="font-weight:bold;padding-left:2px"></a><i class="fa fa-caret-down" style="padding-left:3px"></i></button>')
    if(options.withBorder) this.button.addClass("w3-border")
    if(options.fontSize) this.DOM.css("font-size",options.fontSize)
    if(options.colorClass) this.button.addClass(options.colorClass)
    if(options.width) this.button.css("width",options.width)
    if(options.buttonCSS) this.button.css(options.buttonCSS)
    if(options.adjustPositionAnchor) this.adjustPositionAnchor=options.adjustPositionAnchor

    this.optionContentDOM=$('<div class="w3-dropdown-content w3-bar-block w3-card-4"></div>')
    if(options.optionListHeight) this.optionContentDOM.css({height:options.optionListHeight+"px","overflow-y":"auto","overflow-x":"visible"})
    if(options.optionListMarginTop) this.optionContentDOM.css({"margin-top":options.optionListMarginTop+"px"})
    if(options.optionListMarginLeft) this.optionContentDOM.css({"margin-left":options.optionListMarginLeft+"px"})
    
    this.DOM.append(this.button,this.optionContentDOM)
    this.curSelectVal=null;

    if(options.isClickable){
        this.button.on("click",(e)=>{
            this.adjustDropDownPosition()
            if(this.optionContentDOM.hasClass("w3-show"))  this.optionContentDOM.removeClass("w3-show")
            else this.optionContentDOM.addClass("w3-show")
        })    
    }
}

simpleSelectMenu.prototype.adjustDropDownPosition=function(){
    if(!this.adjustPositionAnchor) return;
    var offset=this.DOM.offset()
    var newTop=offset.top-this.adjustPositionAnchor.top
    var newLeft=offset.left-this.adjustPositionAnchor.left
    this.optionContentDOM.css({"top":newTop+"px","left":newLeft+"px"})
}

simpleSelectMenu.prototype.findOption=function(optionValue){
    var options=this.optionContentDOM.children()
    for(var i=0;i<options.length;i++){
        var anOption=$(options[i])
        if(optionValue==anOption.data("optionValue")){
            return {"text":anOption.text(),"value":anOption.data("optionValue")}
        }
    }
}

simpleSelectMenu.prototype.addOptionArr=function(arr){
    arr.forEach(element => {
        this.addOption(element)
    });
}

simpleSelectMenu.prototype.addOption=function(optionText,optionValue){
    var optionItem=$('<a href="#" class="w3-bar-item w3-button">'+optionText+'</a>')
    this.optionContentDOM.append(optionItem)
    optionItem.data("optionValue",optionValue||optionText)
    optionItem.on('click',(e)=>{
        this.curSelectVal=optionItem.data("optionValue")
        if(this.isClickable){
            this.optionContentDOM.removeClass("w3-show")
        }else{
            this.DOM.removeClass('w3-dropdown-hover')
            this.DOM.addClass('w3-dropdown-click')
            setTimeout(() => { //this is to hide the drop down menu after click
                this.DOM.addClass('w3-dropdown-hover')
                this.DOM.removeClass('w3-dropdown-click')
            }, 100);
        }
        this.callBack_clickOption(optionText,optionItem.data("optionValue"),"realMouseClick")
    })
}

simpleSelectMenu.prototype.changeName=function(nameStr1,nameStr2){
    this.button.children(":first").text(nameStr1)
    this.button.children().eq(1).text(nameStr2)
}

simpleSelectMenu.prototype.triggerOptionIndex=function(optionIndex){
    var theOption=this.optionContentDOM.children().eq(optionIndex)
    if(theOption.length==0) {
        this.curSelectVal=null;
        this.callBack_clickOption(null,null)
        return;
    }
    this.curSelectVal=theOption.data("optionValue")
    this.callBack_clickOption(theOption.text(),theOption.data("optionValue"))
}
simpleSelectMenu.prototype.triggerOptionValue=function(optionValue){
    var re=this.findOption(optionValue)
    if(re==null){
        this.curSelectVal=null
        this.callBack_clickOption(null,null)
    }else{
        this.curSelectVal=re.value
        this.callBack_clickOption(re.text,re.value)
    }
}


simpleSelectMenu.prototype.clearOptions=function(optionText,optionValue){
    this.optionContentDOM.empty()
    this.curSelectVal=null;
}

simpleSelectMenu.prototype.callBack_clickOption=function(optiontext,optionValue,realMouseClick){

}

module.exports = simpleSelectMenu;
},{}],13:[function(require,module,exports){
'use strict';
function simpleTree(DOM,options){
    this.DOM=DOM
    this.groupNodes=[] //each group header is one node
    this.selectedNodes=[];
    this.options=options || {}
}

simpleTree.prototype.scrollToLeafNode=function(aNode){
    var scrollTop=this.DOM.scrollTop()
    var treeHeight=this.DOM.height()
    var nodePosition=aNode.DOM.position().top //which does not consider parent DOM's scroll height
    //console.log(scrollTop,treeHeight,nodePosition)
    if(treeHeight-50<nodePosition){
        this.DOM.scrollTop(scrollTop + nodePosition-(treeHeight-50)) 
    }else if(nodePosition<50){
        this.DOM.scrollTop(scrollTop + (nodePosition-50)) 
    }
}

simpleTree.prototype.clearAllLeafNodes=function(){
    this.groupNodes.forEach((gNode)=>{
        gNode.listDOM.empty()
        gNode.childLeafNodes.length=0
        gNode.refreshName()
    })
}

simpleTree.prototype.firstLeafNode=function(){
    if(this.groupNodes.length==0) return null;
    var firstLeafNode=null;
    this.groupNodes.forEach(aGroupNode=>{
        if(firstLeafNode!=null) return;
        if(aGroupNode.childLeafNodes.length>0) firstLeafNode=aGroupNode.childLeafNodes[0]
    })

    return firstLeafNode
}

simpleTree.prototype.nextGroupNode=function(aGroupNode){
    if(aGroupNode==null) return;
    var index=this.groupNodes.indexOf(aGroupNode)
    if(this.groupNodes.length-1>index){
        return this.groupNodes[index+1]
    }else{ //rotate backward to first group node
        return this.groupNodes[0] 
    }
}

simpleTree.prototype.nextLeafNode=function(aLeafNode){
    if(aLeafNode==null) return;
    var aGroupNode=aLeafNode.parentGroupNode
    var index=aGroupNode.childLeafNodes.indexOf(aLeafNode)
    if(aGroupNode.childLeafNodes.length-1>index){
        //next node is in same group
        return aGroupNode.childLeafNodes[index+1]
    }else{
        //find next group first node
        while(true){
            var nextGroupNode = this.nextGroupNode(aGroupNode)
            if(nextGroupNode.childLeafNodes.length==0){
                aGroupNode=nextGroupNode
            }else{
                return nextGroupNode.childLeafNodes[0]
            }
        }
    }
}

simpleTree.prototype.searchText=function(str){
    if(str=="") return null;
    //search from current select item the next leaf item contains the text
    var regex = new RegExp(str, 'i');
    var startNode
    if(this.selectedNodes.length==0) {
        startNode=this.firstLeafNode()
        if(startNode==null) return;
        var theStr=startNode.name;
        if(theStr.match(regex)!=null){
            //find target node 
            return startNode
        }
    }else startNode=this.selectedNodes[0]

    if(startNode==null) return null;
    
    var fromNode=startNode;
    while(true){
        var nextNode=this.nextLeafNode(fromNode)
        if(nextNode==startNode) return null;
        var nextNodeStr=nextNode.name;
        if(nextNodeStr.match(regex)!=null){
            //find target node
            return nextNode
        }else{
            fromNode=nextNode;
        }
    }    
}


simpleTree.prototype.addLeafnodeToGroup=function(groupName,obj,skipRepeat){
    var aGroupNode=this.findGroupNode(groupName)
    if(aGroupNode == null) return;
    aGroupNode.addNode(obj,skipRepeat)
}

simpleTree.prototype.removeAllNodes=function(){
    this.groupNodes.length=0;
    this.selectedNodes.length=0;
    this.DOM.empty()
}

simpleTree.prototype.findGroupNode=function(groupName){
    var foundGroupNode=null
    this.groupNodes.forEach(aGroupNode=>{
        if(aGroupNode.name==groupName){
            foundGroupNode=aGroupNode
            return;
        }
    })
    return foundGroupNode;
}

simpleTree.prototype.delGroupNode=function(gnode){
    gnode.deleteSelf()
}

simpleTree.prototype.deleteLeafNode=function(nodeName){
    var findLeafNode=null
    this.groupNodes.forEach((gNode)=>{
        if(findLeafNode!=null) return;
        gNode.childLeafNodes.forEach((aLeaf)=>{
            if(aLeaf.name==nodeName){
                findLeafNode=aLeaf
                return;
            }
        })
    })
    if(findLeafNode==null) return;
    findLeafNode.deleteSelf()
}


simpleTree.prototype.insertGroupNode=function(obj,index){
    var aNewGroupNode = new simpleTreeGroupNode(this,obj)
    var existGroupNode= this.findGroupNode(aNewGroupNode.name)
    if(existGroupNode!=null) return;
    this.groupNodes.splice(index, 0, aNewGroupNode);

    if(index==0){
        this.DOM.append(aNewGroupNode.headerDOM)
        this.DOM.append(aNewGroupNode.listDOM)
    }else{
        var prevGroupNode=this.groupNodes[index-1]
        aNewGroupNode.headerDOM.insertAfter(prevGroupNode.listDOM)
        aNewGroupNode.listDOM.insertAfter(aNewGroupNode.headerDOM)
    }

    return aNewGroupNode;
}

simpleTree.prototype.addGroupNode=function(obj){
    var aNewGroupNode = new simpleTreeGroupNode(this,obj)
    var existGroupNode= this.findGroupNode(aNewGroupNode.name)
    if(existGroupNode!=null) return existGroupNode;
    this.groupNodes.push(aNewGroupNode);
    this.DOM.append(aNewGroupNode.headerDOM)
    this.DOM.append(aNewGroupNode.listDOM)
    return aNewGroupNode;
}

simpleTree.prototype.selectLeafNode=function(leafNode,mouseClickDetail){
    this.selectLeafNodeArr([leafNode],mouseClickDetail)
}
simpleTree.prototype.appendLeafNodeToSelection=function(leafNode){
    if(this.options.noMultipleSelectAllowed){
        this.selectLeafNode(leafNode)
        return;
    } 
    var newArr=[].concat(this.selectedNodes)
    newArr.push(leafNode)
    this.selectLeafNodeArr(newArr)
}

simpleTree.prototype.selectGroupNode=function(groupNode){
    if(this.callback_afterSelectGroupNode) this.callback_afterSelectGroupNode(groupNode.info)
}

simpleTree.prototype.selectLeafNodeArr=function(leafNodeArr,mouseClickDetail){
    for(var i=0;i<this.selectedNodes.length;i++){
        this.selectedNodes[i].dim()
    }
    this.selectedNodes.length=0;
    this.selectedNodes=this.selectedNodes.concat(leafNodeArr)
    for(var i=0;i<this.selectedNodes.length;i++){
        this.selectedNodes[i].highlight()
    }

    if(this.callback_afterSelectNodes) this.callback_afterSelectNodes(this.selectedNodes,mouseClickDetail)
}

simpleTree.prototype.dblClickNode=function(theNode){
    if(this.callback_afterDblclickNode) this.callback_afterDblclickNode(theNode)
}

simpleTree.prototype.sortAllLeaves=function(){
    this.groupNodes.forEach(oneGroupNode=>{oneGroupNode.sortNodesByName()})
}

//----------------------------------tree group node---------------
function simpleTreeGroupNode(parentTree,obj){
    this.parentTree=parentTree
    this.info=obj
    this.childLeafNodes=[] //it's child leaf nodes array
    this.name=obj.displayName;
    this.createDOM()
}

simpleTreeGroupNode.prototype.refreshName=function(){ //⬢▉⚫
    this.headerDOM.empty()
    var nameDiv=$("<div style='display:inline;padding-right:3px'></div>")
    nameDiv.text(this.name)
    var lblColor="gray"
    if(this.childLeafNodes.length>0) {
        lblColor="yellowgreen"
        this.headerDOM.css("font-weight","bold")
    }else{
        this.headerDOM.css("font-weight","normal")
    } 

    if(this.parentTree.options.groupNodeIconFunc){
        var iconLabel=this.parentTree.options.groupNodeIconFunc(this)
        this.headerDOM.append(iconLabel)
    }
    
    var numberlabel=$("<label style='display:inline;background-color:"+lblColor
        +";color:white;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>"+this.childLeafNodes.length+"</label>")
    this.headerDOM.append(nameDiv,numberlabel) 
    
    this.checkOptionHideEmptyGroup()
}

simpleTreeGroupNode.prototype.checkOptionHideEmptyGroup=function(){
    if (this.parentTree.options.hideEmptyGroup && this.childLeafNodes.length == 0) {
        this.headerDOM.hide()
        if (this.listDOM) this.listDOM.hide()
    } else {
        this.headerDOM.show()
        if (this.listDOM) this.listDOM.show()
    }

}

simpleTreeGroupNode.prototype.deleteSelf = function () {
    this.headerDOM.remove()
    this.listDOM.remove()
    var parentArr = this.parentTree.groupNodes
    const index = parentArr.indexOf(this);
    if (index > -1) parentArr.splice(index, 1);
}

simpleTreeGroupNode.prototype.createDOM=function(){
    this.headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align"></button>')
    this.refreshName()
    this.listDOM=$('<div class="w3-container w3-hide w3-border"></div>')

    this.headerDOM.on("click",(evt)=> {
        if(this.listDOM.hasClass("w3-show")) this.listDOM.removeClass("w3-show")
        else this.listDOM.addClass("w3-show")

        this.parentTree.selectGroupNode(this)    
        return false;
    });
}

simpleTreeGroupNode.prototype.isOpen=function(){
    return  this.listDOM.hasClass("w3-show")
}


simpleTreeGroupNode.prototype.expand=function(){
    this.listDOM.addClass("w3-show")
}

simpleTreeGroupNode.prototype.shrink=function(){
    this.listDOM.removeClass("w3-show")
}

simpleTreeGroupNode.prototype.sortNodesByName=function(){
    var treeOptions=this.parentTree.options
    if(treeOptions.leafNameProperty) var leafNameProperty=treeOptions.leafNameProperty
    else leafNameProperty="$dtId"
    this.childLeafNodes.sort(function (a, b) { 
        var aName=a.name.toLowerCase()
        var bName=b.name.toLowerCase()
        return aName.localeCompare(bName) 
    });
    //this.listDOM.empty() //NOTE: Can not delete those leaf node otherwise the event handle is lost
    this.childLeafNodes.forEach(oneLeaf=>{this.listDOM.append(oneLeaf.DOM)})
}

simpleTreeGroupNode.prototype.addNode=function(obj,skipRepeat){
    var treeOptions=this.parentTree.options
    if(treeOptions.leafNameProperty) var leafNameProperty=treeOptions.leafNameProperty
    else leafNameProperty="$dtId"

    if(skipRepeat){
        var foundRepeat=false;
        this.childLeafNodes.forEach(aNode=>{
            if(aNode.name==obj[leafNameProperty]) {
                foundRepeat=true
                return;
            }
        })
        if(foundRepeat) return;
    }

    var aNewNode = new simpleTreeLeafNode(this,obj)
    this.childLeafNodes.push(aNewNode)
    this.refreshName()
    this.listDOM.append(aNewNode.DOM)
}

//----------------------------------tree leaf node------------------
function simpleTreeLeafNode(parentGroupNode,obj){
    this.parentGroupNode=parentGroupNode
    this.leafInfo=obj;

    var treeOptions=this.parentGroupNode.parentTree.options
    if(treeOptions.leafNameProperty) this.name=this.leafInfo[treeOptions.leafNameProperty]
    else this.name=this.leafInfo["$dtId"]

    this.createLeafNodeDOM()
}

simpleTreeLeafNode.prototype.deleteSelf = function () {
    this.DOM.remove()
    var gNode = this.parentGroupNode
    const index = gNode.childLeafNodes.indexOf(this);
    if (index > -1) gNode.childLeafNodes.splice(index, 1);
    gNode.refreshName()
}

simpleTreeLeafNode.prototype.createLeafNodeDOM=function(){
    this.DOM=$('<button class="w3-button w3-white" style="display:block;text-align:left;width:98%">'+this.name+'</button>')
    var clickF=(e)=>{
        this.highlight();
        var clickDetail=e.detail
        if (e.ctrlKey) {
            this.parentGroupNode.parentTree.appendLeafNodeToSelection(this)
        }else{
            this.parentGroupNode.parentTree.selectLeafNode(this,e.detail)
        }
    }
    this.DOM.on("click",(e)=>{clickF(e)})

    this.DOM.on("dblclick",(e)=>{
        this.parentGroupNode.parentTree.dblClickNode(this)
    })
}
simpleTreeLeafNode.prototype.highlight=function(){
    this.DOM.addClass("w3-orange")
    this.DOM.addClass("w3-hover-amber")
    this.DOM.removeClass("w3-white")
}
simpleTreeLeafNode.prototype.dim=function(){
    this.DOM.removeClass("w3-orange")
    this.DOM.removeClass("w3-hover-amber")
    this.DOM.addClass("w3-white")
}


module.exports = simpleTree;
},{}],14:[function(require,module,exports){
'use strict';

const modelAnalyzer = require("./modelAnalyzer");
const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
});
const simpleSelectMenu = require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache = require("./globalCache")


function topologyDOM(DOM){
    this.DOM=DOM
    this.defaultNodeSize=30
}

topologyDOM.prototype.init=function(){
    cytoscape.warnings(false)  
    this.core = cytoscape({
        container:  this.DOM[0], // container to render in

        // initial viewport state:
        zoom: 1,
        pan: { x: 0, y: 0 },

        // interaction options:
        minZoom: 0.1,
        maxZoom: 10,
        zoomingEnabled: true,
        userZoomingEnabled: true,
        panningEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: true,
        selectionType: 'single',
        touchTapThreshold: 8,
        desktopTapThreshold: 4,
        autolock: false,
        autoungrabify: false,
        autounselectify: false,

        // rendering options:
        headless: false,
        styleEnabled: true,
        hideEdgesOnViewport: false,
        textureOnViewport: false,
        motionBlur: false,
        motionBlurOpacity: 0.2,
        wheelSensitivity: 0.3,
        pixelRatio: 'auto',

        elements: [], // list of graph elements to start with

        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    "width":this.defaultNodeSize,"height":this.defaultNodeSize,
                    'label': 'data(id)',
                    'opacity':0.9,
                    'font-size':"12px",
                    'font-family':'Geneva, Arial, Helvetica, sans-serif'
                    //,'background-image': function(ele){ return "images/cat.png"; }
                    //,'background-fit':'contain' //cover
                    ,'background-width':'70%'
                    ,'background-height':'70%'
                    //'background-color': function( ele ){ return ele.data('bg') }
                }
            },
            {
                selector: 'edge',
                style: {
                    'width':2,
                    'line-color': '#888',
                    'target-arrow-color': '#555',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'arrow-scale':0.6
                }
            },
            {selector: 'edge:selected',
            style: {
                'width': 3,
                'line-color': 'red',
                'target-arrow-color': 'red',
                'source-arrow-color': 'red'
            }},
            {selector: 'node:selected',
            style: {
                'border-color':"red",
                'border-width':2,
                'background-color': 'Gray'
            }},
            {selector: 'node.hover',
            style: {
                'background-blacken':0.5
            }},{selector: 'edge.hover',
            style: {
                'width':5
            }}
            
        ]
    });

    //cytoscape edge editing plug-in
    this.core.edgeEditing({
        undoable: true,
        bendRemovalSensitivity: 16,
        enableMultipleAnchorRemovalOption: true,
        stickyAnchorTolerence: 20,
        anchorShapeSizeFactor: 5,
        enableAnchorSizeNotImpactByZoom:true,
        enableRemoveAnchorMidOfNearLine:false,
        enableCreateAnchorOnDrag:false
    });

    
    this.core.boxSelectionEnabled(true)


    this.core.on('tapselect', ()=>{this.selectFunction()});
    this.core.on('tapunselect', ()=>{this.selectFunction()});

    this.core.on('boxend',(e)=>{//put inside boxend event to trigger only one time, and repleatly after each box select
        this.core.one('boxselect',()=>{this.selectFunction()})
    })

    this.core.on('cxttap',(e)=>{
        this.cancelTargetNodeMode()
    })

    this.core.on('mouseover',e=>{

        this.mouseOverFunction(e)
    })
    this.core.on('mouseout',e=>{
        this.mouseOutFunction(e)
    })
    
    this.core.on('zoom',(e)=>{
        var fs=this.getFontSizeInCurrentZoom();
        var dimension=this.getNodeSizeInCurrentZoom();
        this.core.style()
                .selector('node')
                .style({ 'font-size': fs, width:dimension ,height:dimension })
                .update()
        this.core.style()
                .selector('node:selected')
                .style({ 'border-width': Math.ceil(dimension/15) })
                .update()
    })

    var instance = this.core.edgeEditing('get');
    var tapdragHandler=(e) => {
        instance.keepAnchorsAbsolutePositionDuringMoving()
        if(e.target.isNode && e.target.isNode()) this.draggingNode=e.target
        this.smartPositionNode(e.position)
    }
    var setOneTimeGrab = () => {
        this.core.once("grab", (e) => {
            var draggingNodes = this.core.collection()
            if (e.target.isNode()) draggingNodes.merge(e.target)
            var arr = this.core.$(":selected")
            arr.forEach((ele) => {
                if (ele.isNode()) draggingNodes.merge(ele)
            })
            instance.storeAnchorsAbsolutePosition(draggingNodes)
            this.core.on("tapdrag",tapdragHandler )
            setOneTimeFree()
        })
    }
    var setOneTimeFree = () => {
        this.core.once("free", (e) => {
            var instance = this.core.edgeEditing('get');
            instance.resetAnchorsAbsolutePosition()
            this.draggingNode=null
            setOneTimeGrab()
            this.core.removeListener("tapdrag",tapdragHandler)
        })
    }
    setOneTimeGrab()
}

topologyDOM.prototype.smartPositionNode = function (mousePosition) {
    var zoomLevel=this.core.zoom()
    if(!this.draggingNode) return
    //comparing nodes set: its connectfrom nodes and their connectto nodes, its connectto nodes and their connectfrom nodes
    var incomers=this.draggingNode.incomers()
    var outerFromIncom= incomers.outgoers()
    var outer=this.draggingNode.outgoers()
    var incomFromOuter=outer.incomers()
    var monitorSet=incomers.union(outerFromIncom).union(outer).union(incomFromOuter).filter('node').unmerge(this.draggingNode)

    var returnExpectedPos=(diffArr,posArr)=>{
        var minDistance=Math.min(...diffArr)
        if(minDistance*zoomLevel < 10)  return posArr[diffArr.indexOf(minDistance)]
        else return null;
    }

    var xDiff=[]
    var xPos=[]
    var yDiff=[]
    var yPos=[]
    monitorSet.forEach((ele)=>{
        xDiff.push(Math.abs(ele.position().x-mousePosition.x))
        xPos.push(ele.position().x)
        yDiff.push(Math.abs(ele.position().y-mousePosition.y))
        yPos.push(ele.position().y)
    })
    var prefX=returnExpectedPos(xDiff,xPos)
    var prefY=returnExpectedPos(yDiff,yPos)
    if(prefX!=null) {
        this.draggingNode.position('x', prefX);
    }
    if(prefY!=null) {
        this.draggingNode.position('y', prefY);
    }
    //console.log("----")
    //monitorSet.forEach((ele)=>{console.log(ele.id())})
    //console.log(monitorSet.size())
}

topologyDOM.prototype.mouseOverFunction= function (e) {
    if(!e.target.data) return
    var info=e.target.data().originalInfo
    if(info==null) return;
    if(this.lastHoverTarget) this.lastHoverTarget.removeClass("hover")
    this.lastHoverTarget=e.target
    e.target.addClass("hover")
    this.broadcastMessage({ "message": "selectNodes", "info": [info] })
}

topologyDOM.prototype.mouseOutFunction= function (e) {
    this.selectFunction()
    if(this.lastHoverTarget){
        this.lastHoverTarget.removeClass("hover")
        this.lastHoverTarget=null;
    } 

}


topologyDOM.prototype.selectFunction = function () {
    var arr = this.core.$(":selected")
    var re = []
    arr.forEach((ele) => { re.push(ele.data().originalInfo) })
    this.broadcastMessage({ "message": "selectNodes", info: re })

    //for debugging purpose
    //arr.forEach((ele)=>{
    //  console.log("")
    //})
}

topologyDOM.prototype.getFontSizeInCurrentZoom=function(){
    var curZoom=this.core.zoom()
    if(curZoom>1){
        var maxFS=12
        var minFS=5
        var ratio= (maxFS/minFS-1)/9*(curZoom-1)+1
        var fs=Math.ceil(maxFS/ratio)
    }else{
        var maxFS=120
        var minFS=12
        var ratio= (maxFS/minFS-1)/9*(1/curZoom-1)+1
        var fs=Math.ceil(minFS*ratio)
    }
    return fs;
}

topologyDOM.prototype.getNodeSizeInCurrentZoom=function(){
    var curZoom=this.core.zoom()
    if(curZoom>1){//scale up but not too much
        var ratio= (curZoom-1)*(2-1)/9+1
        return Math.ceil(this.defaultNodeSize/ratio)
    }else{
        var ratio= (1/curZoom-1)*(4-1)/9+1
        return Math.ceil(this.defaultNodeSize*ratio)
    }
}


topologyDOM.prototype.updateModelAvarta=function(modelID,dataUrl){
    try{
        this.core.style() 
        .selector('node[modelID = "'+modelID+'"]')
        .style({'background-image': dataUrl})
        .update()   
    }catch(e){
        
    }
    
}
topologyDOM.prototype.updateModelTwinColor=function(modelID,colorCode){
    this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'background-color': colorCode})
        .update()   
}
topologyDOM.prototype.updateModelTwinShape=function(modelID,shape){
    this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'shape': shape})
        .update()   
}


topologyDOM.prototype.updateRelationshipColor=function(srcModelID,relationshipName,colorCode){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'line-color': colorCode})
        .update()   
}
topologyDOM.prototype.updateRelationshipShape=function(srcModelID,relationshipName,shape){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'line-style': shape})
        .update()   
}

topologyDOM.prototype.deleteRelations=function(relations){
    relations.forEach(oneRelation=>{
        var srcID=oneRelation["srcID"]
        var relationID=oneRelation["relID"]
        var theNode=this.core.filter('[id = "'+srcID+'"]');
        var edges=theNode.connectedEdges().toArray()
        for(var i=0;i<edges.length;i++){
            var anEdge=edges[i]
            if(anEdge.data("originalInfo")["$relationshipId"]==relationID){
                anEdge.remove()
                break
            }
        }
    })   
}


topologyDOM.prototype.deleteTwins=function(twinIDArr){
    twinIDArr.forEach(twinID=>{
        this.core.$('[id = "'+twinID+'"]').remove()
    })   
}

topologyDOM.prototype.animateANode=function(twin){
    var curDimension= this.getNodeSizeInCurrentZoom()
    twin.animate({
        style: { 'height': curDimension*2,'width': curDimension*2 },
        duration: 200
    });

    setTimeout(()=>{
        twin.animate({
            style: { 'height': curDimension,'width': curDimension },
            duration: 200
            ,complete:()=>{
                twin.removeStyle() //must remove the style after animation, otherwise they will have their own style
            }
        });
    },200)
}

topologyDOM.prototype.drawTwins=function(twinsData,animation){
    var arr=[]
    for(var i=0;i<twinsData.length;i++){
        var originalInfo=twinsData[i];
        var newNode={data:{},group:"nodes"}
        newNode.data["originalInfo"]= originalInfo;
        newNode.data["id"]=originalInfo['$dtId']
        var modelID=originalInfo['$metadata']['$model']
        newNode.data["modelID"]=modelID
        arr.push(newNode)
    }
    var eles = this.core.add(arr)
    if(eles.size()==0) return eles
    this.noPosition_grid(eles)
    if(animation){
        eles.forEach((ele)=>{ this.animateANode(ele) })
    }

    //if there is currently a layout there, apply it
    this.applyNewLayout()

    return eles
}

topologyDOM.prototype.drawRelations=function(relationsData){
    var relationInfoArr=[]
    for(var i=0;i<relationsData.length;i++){
        var originalInfo=relationsData[i];
        
        var theID=originalInfo['$relationshipName']+"_"+originalInfo['$relationshipId']
        var aRelation={data:{},group:"edges"}
        aRelation.data["originalInfo"]=originalInfo
        aRelation.data["id"]=theID
        aRelation.data["source"]=originalInfo['$sourceId']
        aRelation.data["target"]=originalInfo['$targetId']
        if(this.core.$("#"+aRelation.data["source"]).length==0 || this.core.$("#"+aRelation.data["target"]).length==0) continue
        var sourceNode=this.core.$("#"+aRelation.data["source"])
        var sourceModel=sourceNode[0].data("originalInfo")['$metadata']['$model']
        
        //add additional source node information to the original relationship information
        originalInfo['sourceModel']=sourceModel
        aRelation.data["sourceModel"]=sourceModel
        aRelation.data["relationshipName"]=originalInfo['$relationshipName']

        var existEdge=this.core.$('edge[id = "'+theID+'"]')
        if(existEdge.size()>0) {
            existEdge.data("originalInfo",originalInfo)
            continue;  //no need to draw it
        }

        relationInfoArr.push(aRelation)
    }
    if(relationInfoArr.length==0) return null;

    var edges=this.core.add(relationInfoArr)
    return edges
}

topologyDOM.prototype.reviewStoredRelationshipsToDraw=function(){
    //check the storedOutboundRelationships again and maybe some of them can be drawn now since targetNode is available
    var storedRelationArr=[]
    for(var twinID in globalCache.storedOutboundRelationships){
        storedRelationArr=storedRelationArr.concat(globalCache.storedOutboundRelationships[twinID])
    }
    this.drawRelations(storedRelationArr)
}

topologyDOM.prototype.drawTwinsAndRelations=function(data){
    var twinsAndRelations=data.childTwinsAndRelations

    //draw those new twins first
    twinsAndRelations.forEach(oneSet=>{
        var twinInfoArr=[]
        for(var ind in oneSet.childTwins) twinInfoArr.push(oneSet.childTwins[ind])
        this.drawTwins(twinInfoArr,"animation")
    })

    //draw those known twins from the relationships
    var twinsInfo={}
    twinsAndRelations.forEach(oneSet=>{
        var relationsInfo=oneSet["relationships"]
        relationsInfo.forEach((oneRelation)=>{
            var srcID=oneRelation['$sourceId']
            var targetID=oneRelation['$targetId']
            if(globalCache.storedTwins[srcID])
                twinsInfo[srcID] = globalCache.storedTwins[srcID]
            if(globalCache.storedTwins[targetID])
                twinsInfo[targetID] = globalCache.storedTwins[targetID]    
        })
    })
    var tmpArr=[]
    for(var twinID in twinsInfo) tmpArr.push(twinsInfo[twinID])
    this.drawTwins(tmpArr)

    //then check all stored relationships and draw if it can be drawn
    this.reviewStoredRelationshipsToDraw()
}

topologyDOM.prototype.applyVisualDefinition=function(){
    var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
    if(visualJson==null) return;
    for(var modelID in visualJson){
        if(visualJson[modelID].color) this.updateModelTwinColor(modelID,visualJson[modelID].color)
        if(visualJson[modelID].shape) this.updateModelTwinShape(modelID,visualJson[modelID].shape)
        if(visualJson[modelID].avarta) this.updateModelAvarta(modelID,visualJson[modelID].avarta)
        if(visualJson[modelID].rels){
            for(var relationshipName in visualJson[modelID].rels)
                if(visualJson[modelID]["rels"][relationshipName].color){
                    this.updateRelationshipColor(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].color)
                }
                if(visualJson[modelID]["rels"][relationshipName].shape){
                    this.updateRelationshipShape(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].shape)
                }
        }
    }
}

topologyDOM.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTDatasourceChange_replace"){
        this.core.nodes().remove()
        this.applyVisualDefinition()
    }else if(msgPayload.message=="replaceAllTwins") {
        this.core.nodes().remove()
        var eles= this.drawTwins(msgPayload.info)
        this.core.center(eles)
    }else if(msgPayload.message=="appendAllTwins") {
        var eles= this.drawTwins(msgPayload.info,"animate")
        this.core.center(eles)
        this.reviewStoredRelationshipsToDraw()
    }else if(msgPayload.message=="drawAllRelations"){
        var edges= this.drawRelations(msgPayload.info)
        if(edges!=null) {
            if(globalCache.currentLayoutName==null)  this.noPosition_cose()
        }
    }else if(msgPayload.message=="addNewTwin") {
        this.drawTwins([msgPayload.twinInfo],"animation")
    }else if(msgPayload.message=="addNewTwins") {
        this.drawTwins(msgPayload.twinsInfo,"animation")
    }else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="selectNodes"){
        this.core.nodes().unselect()
        this.core.edges().unselect()
        var arr=msgPayload.info;
        var mouseClickDetail=msgPayload.mouseClickDetail;
        arr.forEach(element => {
            var aTwin= this.core.nodes("#"+element['$dtId'])
            aTwin.select()
            if(mouseClickDetail!=2) this.animateANode(aTwin) //ignore double click second click
        });
    }else if(msgPayload.message=="PanToNode"){
        var nodeInfo= msgPayload.info;
        var topoNode= this.core.nodes("#"+nodeInfo["$dtId"])
        if(topoNode){
            this.core.center(topoNode)
        }
    }else if(msgPayload.message=="visualDefinitionChange"){
        if(msgPayload.srcModelID){
            if(msgPayload.color) this.updateRelationshipColor(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.color)
            else if(msgPayload.shape) this.updateRelationshipShape(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.shape)
        } 
        else{
            if(msgPayload.color) this.updateModelTwinColor(msgPayload.modelID,msgPayload.color)
            else if(msgPayload.shape) this.updateModelTwinShape(msgPayload.modelID,msgPayload.shape)
            else if(msgPayload.avarta) this.updateModelAvarta(msgPayload.modelID,msgPayload.avarta)
            else if(msgPayload.noAvarta)  this.updateModelAvarta(msgPayload.modelID,null)
        } 
    }else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="relationsDeleted") this.deleteRelations(msgPayload.relations)
    else if(msgPayload.message=="connectTo"){ this.startTargetNodeMode("connectTo")   }
    else if(msgPayload.message=="connectFrom"){ this.startTargetNodeMode("connectFrom")   }
    else if(msgPayload.message=="addSelectOutbound"){ this.selectOutboundNodes()   }
    else if(msgPayload.message=="addSelectInbound"){ this.selectInboundNodes()   }
    else if(msgPayload.message=="hideSelectedNodes"){ this.hideSelectedNodes()   }
    else if(msgPayload.message=="COSESelectedNodes"){ this.COSESelectedNodes()   }
    else if(msgPayload.message=="saveLayout"){ this.saveLayout(msgPayload.layoutName,msgPayload.adtName)   }
    else if(msgPayload.message=="layoutChange"){ this.applyNewLayout()   }
}

topologyDOM.prototype.applyNewLayout = function () {
    var layoutName=globalCache.currentLayoutName
    
    var layoutDetail= globalCache.layoutJSON[layoutName]
    
    //remove all bending edge 
    this.core.edges().forEach(oneEdge=>{
        oneEdge.removeClass('edgebendediting-hasbendpoints')
        oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
    })
    
    if(layoutDetail==null) return;
    
    var storedPositions={}
    for(var ind in layoutDetail){
        storedPositions[ind]={
            x:layoutDetail[ind][0]
            ,y:layoutDetail[ind][1]
        }
    }
    var newLayout=this.core.layout({
        name: 'preset',
        positions:storedPositions,
        fit:false,
        animate: true,
        animationDuration: 300,
    })
    newLayout.run()

    //restore edges bending or control points
    var edgePointsDict=layoutDetail["edges"]
    if(edgePointsDict==null)return;
    for(var srcID in edgePointsDict){
        for(var relationshipID in edgePointsDict[srcID]){
            var obj=edgePointsDict[srcID][relationshipID]
            this.applyEdgeBendcontrolPoints(srcID,relationshipID,obj["cyedgebendeditingWeights"]
            ,obj["cyedgebendeditingDistances"],obj["cyedgecontroleditingWeights"],obj["cyedgecontroleditingDistances"])
        }
    }
}

topologyDOM.prototype.applyEdgeBendcontrolPoints = function (srcID,relationshipID
    ,cyedgebendeditingWeights,cyedgebendeditingDistances,cyedgecontroleditingWeights,cyedgecontroleditingDistances) {
        var theNode=this.core.filter('[id = "'+srcID+'"]');
        var edges=theNode.connectedEdges().toArray()
        for(var i=0;i<edges.length;i++){
            var anEdge=edges[i]
            if(anEdge.data("originalInfo")["$relationshipId"]==relationshipID){
                if(cyedgebendeditingWeights){
                    anEdge.data("cyedgebendeditingWeights",cyedgebendeditingWeights)
                    anEdge.data("cyedgebendeditingDistances",cyedgebendeditingDistances)
                    anEdge.addClass('edgebendediting-hasbendpoints');
                }
                if(cyedgecontroleditingWeights){
                    anEdge.data("cyedgecontroleditingWeights",cyedgecontroleditingWeights)
                    anEdge.data("cyedgecontroleditingDistances",cyedgecontroleditingDistances)
                    anEdge.addClass('edgecontrolediting-hascontrolpoints');
                }
                
                break
            }
        }
}



topologyDOM.prototype.saveLayout = function (layoutName,adtName) {
    var layoutDict=globalCache.layoutJSON[layoutName]
    if(!layoutDict){
        layoutDict=globalCache.layoutJSON[layoutName]={}
    }
    
    if(this.core.nodes().size()==0) return;

    //store nodes position
    this.core.nodes().forEach(oneNode=>{
        var position=oneNode.position()
        layoutDict[oneNode.id()]=[this.numberPrecision(position['x']),this.numberPrecision(position['y'])]
    })

    //store any edge bending points or controling points

    if(layoutDict.edges==null) layoutDict.edges={}
    var edgeEditInstance= this.core.edgeEditing('get');
    this.core.edges().forEach(oneEdge=>{
        var srcID=oneEdge.data("originalInfo")["$sourceId"]
        var relationshipID=oneEdge.data("originalInfo")["$relationshipId"]
        var cyedgebendeditingWeights=oneEdge.data('cyedgebendeditingWeights')
        var cyedgebendeditingDistances=oneEdge.data('cyedgebendeditingDistances')
        var cyedgecontroleditingWeights=oneEdge.data('cyedgecontroleditingWeights')
        var cyedgecontroleditingDistances=oneEdge.data('cyedgecontroleditingDistances')
        if(!cyedgebendeditingWeights && !cyedgecontroleditingWeights) return;

        if(layoutDict.edges[srcID]==null)layoutDict.edges[srcID]={}
        layoutDict.edges[srcID][relationshipID]={}
        if(cyedgebendeditingWeights && cyedgebendeditingWeights.length>0) {
            layoutDict.edges[srcID][relationshipID]["cyedgebendeditingWeights"]=this.numberPrecision(cyedgebendeditingWeights)
            layoutDict.edges[srcID][relationshipID]["cyedgebendeditingDistances"]=this.numberPrecision(cyedgebendeditingDistances)
        }
        if(cyedgecontroleditingWeights && cyedgecontroleditingWeights.length>0) {
            layoutDict.edges[srcID][relationshipID]["cyedgecontroleditingWeights"]=this.numberPrecision(cyedgecontroleditingWeights)
            layoutDict.edges[srcID][relationshipID]["cyedgecontroleditingDistances"]=this.numberPrecision(cyedgecontroleditingDistances)
        }
    })

    $.post("layout/saveLayouts",{"adtName":adtName,"layouts":JSON.stringify(globalCache.layoutJSON)})
    this.broadcastMessage({ "message": "layoutsUpdated"})
}

topologyDOM.prototype.numberPrecision = function (number) {
    if(Array.isArray(number)){
        for(var i=0;i<number.length;i++){
            number[i] = this.numberPrecision(number[i])
        }
        return number
    }else
    return parseFloat(formatter.format(number))
}

topologyDOM.prototype.COSESelectedNodes = function () {
    var selected=this.core.$(':selected')
    this.noPosition_cose(selected)
}

topologyDOM.prototype.hideSelectedNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    selectedNodes.remove()
}

topologyDOM.prototype.selectInboundNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    var eles=this.core.nodes().edgesTo(selectedNodes).sources()
    eles.forEach((ele)=>{ this.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.selectOutboundNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    var eles=selectedNodes.edgesTo(this.core.nodes()).targets()
    eles.forEach((ele)=>{ this.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.addConnections = function (targetNode) {
    var theConnectMode=this.targetNodeMode
    var srcNodeArr=this.core.nodes(":selected")

    var preparationInfo=[]

    srcNodeArr.forEach(theNode=>{
        var connectionTypes
        if(theConnectMode=="connectTo") {
            connectionTypes=this.checkAvailableConnectionType(theNode.data("modelID"),targetNode.data("modelID"))
            preparationInfo.push({from:theNode,to:targetNode,connect:connectionTypes})
        }else if(theConnectMode=="connectFrom") {
            connectionTypes=this.checkAvailableConnectionType(targetNode.data("modelID"),theNode.data("modelID"))
            preparationInfo.push({to:theNode,from:targetNode,connect:connectionTypes})
        }
    })
    //TODO: check if it is needed to popup dialog, if all connection is doable and only one type to use, no need to show dialog
    this.showConnectionDialog(preparationInfo)
}

topologyDOM.prototype.showConnectionDialog = function (preparationInfo) {
    var confirmDialogDiv = new simpleConfirmDialog()
    var resultActions=[]
    confirmDialogDiv.show(
        { width: "450px" },
        {
            title: "Add connections"
            , content: ""
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        confirmDialogDiv.close();
                        this.createConnections(resultActions)
                    }
                },
                {
                    colorClass: "w3-gray", text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                    }
                }
            ]
        }
    )
    confirmDialogDiv.dialogDiv.empty()
    preparationInfo.forEach((oneRow,index)=>{
        var fromNode=oneRow.from
        var toNode=oneRow.to
        var connectionTypes=oneRow.connect
        var label=$('<label style="display:block;margin-bottom:2px"></label>')
        if(connectionTypes.length==0){
            label.css("color","red")
            label.html("No usable connection type from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>")
        }else if(connectionTypes.length>1){ 
            label.html("From <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
            var switchTypeSelector=new simpleSelectMenu(" ")
            label.prepend(switchTypeSelector.DOM)
            connectionTypes.forEach(oneType=>{
                switchTypeSelector.addOption(oneType)
            })
            resultActions.push({from:fromNode.id(),to:toNode.id(),connect:connectionTypes[0]})
            switchTypeSelector.callBack_clickOption=(optionText,optionValue)=>{
                resultActions[index][2]=optionText
                switchTypeSelector.changeName(optionText)
            }
            switchTypeSelector.triggerOptionIndex(0)
        }else if(connectionTypes.length==1){
            resultActions.push({from:fromNode.id(),to:toNode.id(),connect:connectionTypes[0]})
            label.css("color","green")
            label.html("Add <b>"+connectionTypes[0]+"</b> connection from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
        }
        confirmDialogDiv.dialogDiv.append(label)
    })
}

topologyDOM.prototype.createConnections = function (resultActions) {
    // for each resultActions, calculate the appendix index, to avoid same ID is used for existed connections
    resultActions.forEach(oneAction=>{
        var maxExistedConnectionNumber=0
        var existedRelations=globalCache.storedOutboundRelationships[oneAction.from]
        if(existedRelations==null) existedRelations=[]
        existedRelations.forEach(oneRelation=>{
            var oneRelationID=oneRelation['$relationshipId']
            if(oneRelation["$targetId"]!=oneAction.to) return
            var lastIndex= oneRelationID.split(";").pop()
            lastIndex=parseInt(lastIndex)
            if(maxExistedConnectionNumber<=lastIndex) maxExistedConnectionNumber=lastIndex+1
        })
        oneAction.IDindex=maxExistedConnectionNumber
    })
    var finalActions=[]
    resultActions.forEach(oneAction=>{
        var oneFinalAction={}
        oneFinalAction["$srcId"]=oneAction["from"]
        oneFinalAction["$relationshipId"]=oneAction["from"]+";"+oneAction["to"]+";"+oneAction["connect"]+";"+oneAction["IDindex"]
        oneFinalAction["obj"]={
            "$targetId": oneAction["to"],
            "$relationshipName": oneAction["connect"]
        }
        finalActions.push(oneFinalAction)
    })

    $.post("editADT/createRelations",{actions:JSON.stringify(finalActions)}, (data, status) => {
        if(data=="") return;
        globalCache.storeTwinRelationships_append(data)
        this.drawRelations(data)
    })
}



topologyDOM.prototype.checkAvailableConnectionType = function (fromNodeModel,toNodeModel) {
    var re=[]
    var validRelationships=modelAnalyzer.DTDLModels[fromNodeModel].validRelationships
    var toNodeBaseClasses=modelAnalyzer.DTDLModels[toNodeModel].allBaseClasses
    if(validRelationships){
        for(var relationName in validRelationships){
            var theRelationType=validRelationships[relationName]
            if(theRelationType.target==null
                 || theRelationType.target==toNodeModel
                 ||toNodeBaseClasses[theRelationType.target]!=null) re.push(relationName)
        }
    }
    return re
}


topologyDOM.prototype.startTargetNodeMode = function (mode) {
    this.core.autounselectify( true );
    this.core.container().style.cursor = 'crosshair';
    this.targetNodeMode=mode;
    $(document).keydown((event) => {
        if (event.keyCode == 27) this.cancelTargetNodeMode()
    });

    this.core.nodes().on('click', (e)=>{
        var clickedNode = e.target;
        this.addConnections(clickedNode)
        //delay a short while so node selection will not be changed to the clicked target node
        setTimeout(()=>{this.cancelTargetNodeMode()},50)

    });
}

topologyDOM.prototype.cancelTargetNodeMode=function(){
    this.targetNodeMode=null;
    this.core.container().style.cursor = 'default';
    $(document).off('keydown');
    this.core.nodes().off("click")
    this.core.autounselectify( false );
}


topologyDOM.prototype.noPosition_grid=function(eles){
    var newLayout = eles.layout({
        name: 'grid',
        animate: false,
        fit:false
    }) 
    newLayout.run()
}

topologyDOM.prototype.noPosition_cose=function(eles){
    if(eles==null) eles=this.core.elements()

    var newLayout =eles.layout({
        name: 'cose',
        animate: true,
        gravity:1,
        animate: false
        ,fit:false
    }) 
    newLayout.run()
    this.core.center(eles)
}

topologyDOM.prototype.noPosition_concentric=function(eles,box){
    if(eles==null) eles=this.core.elements()
    var newLayout =eles.layout({
        name: 'concentric',
        animate: false,
        fit:false,
        minNodeSpacing:60,
        gravity:1,
        boundingBox:box
    }) 
    newLayout.run()
}

topologyDOM.prototype.layoutWithNodePosition=function(nodePosition){
    var newLayout = this.core.layout({
        name: 'preset',
        positions: nodePosition,
        animate: false, // whether to transition the node positions
        animationDuration: 500, // duration of animation in ms if enabled
    })
    newLayout.run()
}



module.exports = topologyDOM;
},{"./globalCache":3,"./modelAnalyzer":8,"./simpleConfirmDialog":11,"./simpleSelectMenu":12}],15:[function(require,module,exports){
const simpleTree=require("./simpleTree")
const modelAnalyzer=require("./modelAnalyzer")
const globalCache = require("./globalCache")


function twinsTree(DOM, searchDOM) {
    this.tree=new simpleTree(DOM)
    this.modelIDMapToName={}

    this.tree.options.groupNodeIconFunc=(gn)=>{
        var modelClass=gn.info["@id"]
        var colorCode="gray"
        var shape="ellipse"
        var avatar=null
        if(globalCache.visualDefinition[globalCache.selectedADT] && globalCache.visualDefinition[globalCache.selectedADT][modelClass]){
            var visualJson =globalCache.visualDefinition[globalCache.selectedADT][modelClass]
            var colorCode= visualJson.color || "gray"
            var shape=  visualJson.shape || "ellipse"
            var avarta= visualJson.avarta 
        }
        var fontsize={"ellipse":"130%","round-rectangle":"90%","hexagon":"120%"}[shape]
        shape={"ellipse":"●","round-rectangle":"▉","hexagon":"⬢"}[shape]
        
        var lblHTML="<label style='display:inline;color:"+colorCode+";font-size:"+fontsize+";font-weight:normal;border-radius: 2px;'>"+shape+"</label>"

        if(avarta) lblHTML+="<img src='"+avarta+"' style='height:20px'/>"

        return $(lblHTML)
    }

    this.tree.callback_afterSelectNodes=(nodesArr,mouseClickDetail)=>{
        var infoArr=[]
        nodesArr.forEach((item, index) =>{
            infoArr.push(item.leafInfo)
        });
        this.broadcastMessage({ "message": "selectNodes", info:infoArr, "mouseClickDetail":mouseClickDetail})
    }

    this.tree.callback_afterDblclickNode=(theNode)=>{
        this.broadcastMessage({ "message": "PanToNode", info:theNode.leafInfo})
    }

    this.tree.callback_afterSelectGroupNode=(nodeInfo)=>{
        this.broadcastMessage({"message":"selectGroupNode",info:nodeInfo})
    }

    this.searchBox=$('<input type="text"  placeholder="search..."/>').addClass("w3-input");
    this.searchBox.css({"outline":"none","height":"100%","width":"100%"}) 
    searchDOM.append(this.searchBox)

    var hideOrShowEmptyGroup=$('<button style="height:20px;border:none;padding-left:2px" class="w3-block w3-tiny w3-hover-red w3-amber">Hide Empty Models</button>')
    searchDOM.append(hideOrShowEmptyGroup)
    DOM.css("top","50px")
    hideOrShowEmptyGroup.attr("status","show")
    hideOrShowEmptyGroup.on("click",()=>{
        if(hideOrShowEmptyGroup.attr("status")=="show"){
            hideOrShowEmptyGroup.attr("status","hide")
            hideOrShowEmptyGroup.text("Show Empty Models")
            this.tree.options.hideEmptyGroup=true
        }else{
            hideOrShowEmptyGroup.attr("status","show")
            hideOrShowEmptyGroup.text("Hide Empty Models")
            delete this.tree.options.hideEmptyGroup
        }
        this.tree.groupNodes.forEach(oneGroupNode=>{oneGroupNode.checkOptionHideEmptyGroup()})
    })


    this.searchBox.keyup((e)=>{
        if(e.keyCode == 13)
        {
            var aNode = this.tree.searchText($(e.target).val())
            if(aNode!=null){
                aNode.parentGroupNode.expand()
                this.tree.selectLeafNode(aNode)
                this.tree.scrollToLeafNode(aNode)
            }
        }
    });
}

twinsTree.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTDatasourceChange_replace") this.ADTDatasourceChange_replace(msgPayload.query, msgPayload.twins,msgPayload.ADTInstanceDoesNotChange)
    else if(msgPayload.message=="ADTDatasourceChange_append") this.ADTDatasourceChange_append(msgPayload.query, msgPayload.twins)
    else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="ADTModelsChange") this.refreshModels(msgPayload.models)
    else if(msgPayload.message=="addNewTwin") this.drawOneTwin(msgPayload.twinInfo)
    else if(msgPayload.message=="addNewTwins") {
        msgPayload.twinsInfo.forEach(oneTwinInfo=>{this.drawOneTwin(oneTwinInfo)})
    }
    else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="visualDefinitionChange"){
        if(!msgPayload.srcModelID){ // change model class visualization
            this.tree.groupNodes.forEach(gn=>{gn.refreshName()})
        } 
    }
}

twinsTree.prototype.deleteTwins=function(twinIDArr){
    twinIDArr.forEach(twinID=>{
        this.tree.deleteLeafNode(twinID)
    })
}

twinsTree.prototype.refreshModels=function(modelsData){
    //delete all group nodes of deleted models
    this.tree.groupNodes.forEach((gnode)=>{
        if(modelsData[gnode.name]==null){
            //delete this group node
            gnode.deleteSelf()
        }
    })

    //then add all group nodes that to be added
    var currentModelNameArr=[]
    this.tree.groupNodes.forEach((gnode)=>{currentModelNameArr.push(gnode.name)})

    var actualModelNameArr=[]
    for(var ind in modelsData) actualModelNameArr.push(ind)
    actualModelNameArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });

    for(var i=0;i<actualModelNameArr.length;i++){
        if(i<currentModelNameArr.length && currentModelNameArr[i]==actualModelNameArr[i]) continue
        //otherwise add this group to the tree
        var newGroup=this.tree.insertGroupNode(modelsData[actualModelNameArr[i]],i)
        newGroup.shrink()
        currentModelNameArr.splice(i, 0, actualModelNameArr[i]);
    }
}


twinsTree.prototype.ADTDatasourceChange_append=function(twinQueryStr,twinsData){
    if (twinsData != null) this.appendAllTwins(twinsData)
    else {
        $.post("queryADT/allTwinsInfo", { query: twinQueryStr }, (data) => {
            if(data=="") return;
            data.forEach((oneNode)=>{globalCache.storedTwins[oneNode["$dtId"]] = oneNode});
            this.appendAllTwins(data)
        })
    }
}

twinsTree.prototype.ADTDatasourceChange_replace=function(twinQueryStr,twinsData,ADTInstanceDoesNotChange){
    var theTree= this.tree;

    if (ADTInstanceDoesNotChange) {
        //keep all group node as model is the same, only fetch all leaf node again
        //remove all leaf nodes
        this.tree.clearAllLeafNodes()
        if (twinsData != null) this.replaceAllTwins(twinsData)
        else {
            $.post("queryADT/allTwinsInfo", { query: twinQueryStr }, (data) => {
                if(data=="") data=[];
                data.forEach((oneNode)=>{globalCache.storedTwins[oneNode["$dtId"]] = oneNode});
                this.replaceAllTwins(data)
            })
        }
    }else{
        theTree.removeAllNodes()
        for (var id in this.modelIDMapToName) delete this.modelIDMapToName[id]
        //query to get all models
        $.get("queryADT/listModels", (data, status) => {
            if(data=="") data=[]
            var tmpNameArr = []
            var tmpNameToObj = {}
            for (var i = 0; i < data.length; i++) {
                if(data[i]["displayName"]==null) data[i]["displayName"]=data[i]["@id"]
                if($.isPlainObject(data[i]["displayName"])){
                    if(data[i]["displayName"]["en"]) data[i]["displayName"]=data[i]["displayName"]["en"]
                    else data[i]["displayName"]=JSON.stringify(data[i]["displayName"])
                }
                if(tmpNameToObj[data[i]["displayName"]]!=null){
                    //repeated model display name
                    data[i]["displayName"]=data[i]["@id"]
                }  
                this.modelIDMapToName[data[i]["@id"]] = data[i]["displayName"]
                
                tmpNameArr.push(data[i]["displayName"])
                tmpNameToObj[data[i]["displayName"]] = data[i]
            }
            tmpNameArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
            tmpNameArr.forEach(modelName => {
                var newGroup = theTree.addGroupNode(tmpNameToObj[modelName])
                newGroup.shrink()
            })
            modelAnalyzer.clearAllModels();
            modelAnalyzer.addModels(data)
            modelAnalyzer.analyze();

            if (twinsData != null) this.replaceAllTwins(twinsData)
            else {
                $.post("queryADT/allTwinsInfo", { query: twinQueryStr }, (data) => {
                    if(data=="") data=[];
                    data.forEach((oneNode)=>{globalCache.storedTwins[oneNode["$dtId"]] = oneNode});
                    this.replaceAllTwins(data)
                })
            }
        })
    }
}

twinsTree.prototype.drawTwinsAndRelations= function(data){
    data.childTwinsAndRelations.forEach(oneSet=>{
        for(var ind in oneSet.childTwins){
            var oneTwin=oneSet.childTwins[ind]
            this.drawOneTwin(oneTwin)
        }
    })

    //draw those known twins from the relationships
    var twinsInfo={}
    data.childTwinsAndRelations.forEach(oneSet=>{
        var relationsInfo=oneSet["relationships"]
        relationsInfo.forEach((oneRelation)=>{
            var srcID=oneRelation['$sourceId']
            var targetID=oneRelation['$targetId']
            if(globalCache.storedTwins[srcID])
                twinsInfo[srcID] = globalCache.storedTwins[srcID]
            if(globalCache.storedTwins[targetID])
                twinsInfo[targetID] = globalCache.storedTwins[targetID]    
        })
    })
    var tmpArr=[]
    for(var twinID in twinsInfo) tmpArr.push(twinsInfo[twinID])
    tmpArr.forEach(oneTwin=>{this.drawOneTwin(oneTwin)})
}

twinsTree.prototype.drawOneTwin= function(twinInfo){
    var groupName=this.modelIDMapToName[twinInfo["$metadata"]["$model"]]
    this.tree.addLeafnodeToGroup(groupName,twinInfo,"skipRepeat")
}

twinsTree.prototype.appendAllTwins= function(data){
    var twinIDArr=[]
    //check if any current leaf node does not have stored outbound relationship data yet
    this.tree.groupNodes.forEach((gNode)=>{
        gNode.childLeafNodes.forEach(leafNode=>{
            var nodeId=leafNode.leafInfo["$dtId"]
            if(globalCache.storedOutboundRelationships[nodeId]==null) twinIDArr.push(nodeId)
        })
    })

    this.broadcastMessage({ "message": "appendAllTwins",info:data})
    for(var i=0;i<data.length;i++){
        var groupName=this.modelIDMapToName[data[i]["$metadata"]["$model"]]
        this.tree.addLeafnodeToGroup(groupName,data[i],"skipRepeat")
        twinIDArr.push(data[i]["$dtId"])
    }

    this.fetchAllRelationships(twinIDArr)
}

twinsTree.prototype.replaceAllTwins= function(data){
    var twinIDArr=[]
    this.broadcastMessage({ "message": "replaceAllTwins",info:data})
    for(var i=0;i<data.length;i++){
        var groupName=this.modelIDMapToName[data[i]["$metadata"]["$model"]]
        this.tree.addLeafnodeToGroup(groupName,data[i])
        twinIDArr.push(data[i]["$dtId"])
    }
    this.fetchAllRelationships(twinIDArr)
}

twinsTree.prototype.fetchAllRelationships= async function(twinIDArr){
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        var data=await this.fetchPartialRelationships(smallArr)
        if(data=="") continue;
        globalCache.storeTwinRelationships(data) //store them in global available array
        this.broadcastMessage({ "message": "drawAllRelations",info:data})
    }
}

twinsTree.prototype.fetchPartialRelationships= async function(IDArr){
    return new Promise((resolve, reject) => {
        try{
            $.post("queryADT/allRelationships",{arr:IDArr}, function (data) {
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
}

module.exports = twinsTree;
},{"./globalCache":3,"./modelAnalyzer":8,"./simpleTree":13}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwb3J0YWxTb3VyY2VDb2RlL2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9lZGl0TGF5b3V0RGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9nbG9iYWxDYWNoZS5qcyIsInBvcnRhbFNvdXJjZUNvZGUvaW5mb1BhbmVsLmpzIiwicG9ydGFsU291cmNlQ29kZS9tYWluLmpzIiwicG9ydGFsU291cmNlQ29kZS9tYWluVG9vbGJhci5qcyIsInBvcnRhbFNvdXJjZUNvZGUvbWFpblVJLmpzIiwicG9ydGFsU291cmNlQ29kZS9tb2RlbEFuYWx5emVyLmpzIiwicG9ydGFsU291cmNlQ29kZS9tb2RlbEVkaXRvckRpYWxvZy5qcyIsInBvcnRhbFNvdXJjZUNvZGUvbW9kZWxNYW5hZ2VyRGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9zaW1wbGVDb25maXJtRGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9zaW1wbGVTZWxlY3RNZW51LmpzIiwicG9ydGFsU291cmNlQ29kZS9zaW1wbGVUcmVlLmpzIiwicG9ydGFsU291cmNlQ29kZS90b3BvbG9neURPTS5qcyIsInBvcnRhbFNvdXJjZUNvZGUvdHdpbnNUcmVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNydkJBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDemhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2coKSB7XHJcbiAgICB0aGlzLmZpbHRlcnM9e31cclxuICAgIHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVD1udWxsXHJcbiAgICB0aGlzLnRlc3RUd2luc0luZm89bnVsbDtcclxuXHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLW1vZGFsXCIgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO3otaW5kZXg6MTAxXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnByZXBhcmF0aW9uRnVuYyA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLmdldChcInR3aW5zRmlsdGVyL3JlYWRTdGFydEZpbHRlcnNcIiwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YSE9bnVsbCAmJiBkYXRhIT1cIlwiKSB0aGlzLmZpbHRlcnM9ZGF0YTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJC5nZXQoXCJxdWVyeUFEVC9saXN0QURUSW5zdGFuY2VcIiwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W11cclxuICAgICAgICB2YXIgYWR0QXJyPWRhdGE7XHJcbiAgICAgICAgaWYgKGFkdEFyci5sZW5ndGggPT0gMCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLkRPTS5zaG93KClcclxuICAgICAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICAgICAgdGhpcy5jb250ZW50RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1tb2RhbC1jb250ZW50XCIgc3R5bGU9XCJ3aWR0aDo2NTBweFwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgICAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+Q2hvb3NlIERhdGEgU2V0PC9kaXY+PC9kaXY+JykpXHJcbiAgICAgICAgdmFyIGNsb3NlQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuYnV0dG9uSG9sZGVyPSQoXCI8ZGl2IHN0eWxlPSdoZWlnaHQ6MTAwJSc+PC9kaXY+XCIpXHJcbiAgICAgICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQodGhpcy5idXR0b25Ib2xkZXIpXHJcbiAgICAgICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCgpPT57dGhpcy5jbG9zZURpYWxvZygpfSlcclxuICAgIFxyXG4gICAgICAgIHZhciByb3cxPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzEpXHJcbiAgICAgICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtmb250LXNpemU6MS4yZW07XCI+QXp1cmUgRGlnaXRhbCBUd2luIElEIDwvZGl2PicpXHJcbiAgICAgICAgcm93MS5hcHBlbmQobGFibGUpXHJcbiAgICAgICAgdmFyIHN3aXRjaEFEVFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiLHt3aXRoQm9yZGVyOjEsZm9udFNpemU6XCIxLjJlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5XCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjVweCAxMHB4XCJ9fSlcclxuICAgICAgICByb3cxLmFwcGVuZChzd2l0Y2hBRFRTZWxlY3Rvci5ET00pXHJcbiAgICAgICAgXHJcbiAgICAgICAgYWR0QXJyLmZvckVhY2goKGFkdEluc3RhbmNlKT0+e1xyXG4gICAgICAgICAgICB2YXIgc3RyID0gYWR0SW5zdGFuY2Uuc3BsaXQoXCIuXCIpWzBdLnJlcGxhY2UoXCJodHRwczovL1wiLCBcIlwiKVxyXG4gICAgICAgICAgICBzd2l0Y2hBRFRTZWxlY3Rvci5hZGRPcHRpb24oc3RyLGFkdEluc3RhbmNlKVxyXG4gICAgICAgICAgICBpZih0aGlzLmZpbHRlcnNbYWR0SW5zdGFuY2VdPT1udWxsKSB0aGlzLmZpbHRlcnNbYWR0SW5zdGFuY2VdPXt9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgc3dpdGNoQURUU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgIHN3aXRjaEFEVFNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICAgICAgdGhpcy5zZXRBRFRJbnN0YW5jZShvcHRpb25WYWx1ZSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgICAgIHZhciBsZWZ0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbFwiIHN0eWxlPVwid2lkdGg6MjQwcHg7cGFkZGluZy1yaWdodDo1cHhcIj48L2Rpdj4nKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjMwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cIlwiPkZpbHRlcnM8L2Rpdj48L2Rpdj4nKSlcclxuXHJcbiAgICAgICAgdmFyIGZpbHRlckxpc3Q9JCgnPHVsIGNsYXNzPVwidzMtdWwgdzMtaG92ZXJhYmxlXCI+JylcclxuICAgICAgICBmaWx0ZXJMaXN0LmNzcyh7XCJvdmVyZmxvdy14XCI6XCJoaWRkZW5cIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcImhlaWdodFwiOlwiMzQwcHhcIiwgXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodGdyYXlcIn0pXHJcbiAgICAgICAgbGVmdFNwYW4uYXBwZW5kKGZpbHRlckxpc3QpXHJcblxyXG4gICAgICAgIHRoaXMuZmlsdGVyTGlzdD1maWx0ZXJMaXN0O1xyXG4gICAgICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCI+PC9kaXY+JylcclxuICAgICAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG5cclxuICAgICAgICB2YXIgcGFuZWxDYXJkPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkLTIgdzMtd2hpdGVcIiBzdHlsZT1cInBhZGRpbmc6MTBweFwiPjwvZGl2PicpXHJcbiAgICAgICAgcmlnaHRTcGFuLmFwcGVuZChwYW5lbENhcmQpXHJcbiAgICAgICAgdmFyIHF1ZXJ5U3Bhbj0kKFwiPHNwYW4vPlwiKVxyXG4gICAgICAgIHBhbmVsQ2FyZC5hcHBlbmQocXVlcnlTcGFuKVxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICB2YXIgbmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lXCIgIHBsYWNlaG9sZGVyPVwiQ2hvb3NlIGEgZmlsdGVyIG9yIGZpbGwgaW4gbmV3IGZpbHRlciBuYW1lLi4uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgICAgIHRoaXMucXVlcnlOYW1lSW5wdXQ9bmFtZUlucHV0O1xyXG4gICAgICAgIHZhciBxdWVyeUxibD0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyIHczLXJlZFwiIHN0eWxlPVwicGFkZGluZy1sZWZ0OjVweDttYXJnaW4tdG9wOjJweDt3aWR0aDo1MCVcIj5RdWVyeSBTZW50ZW5jZTwvZGl2PicpXHJcbiAgICAgICAgdmFyIHF1ZXJ5SW5wdXQ9JCgnPHRleHRhcmVhIHN0eWxlPVwicmVzaXplOm5vbmU7aGVpZ2h0OjgwcHg7b3V0bGluZTpub25lO21hcmdpbi1ib3R0b206MnB4XCIgIHBsYWNlaG9sZGVyPVwiU2FtcGxlOiBTRUxFQ1QgKiBGUk9NIGRpZ2l0YWx0d2lucyB3aGVyZSBJU19PRl9NT0RFTChcXCdtb2RlbElEXFwnKVwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgICAgICB0aGlzLnF1ZXJ5SW5wdXQ9cXVlcnlJbnB1dDtcclxuXHJcbiAgICAgICAgdmFyIHNhdmVCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1saWdodC1ncmVlbiB3My1ib3JkZXItcmlnaHRcIj5TYXZlIEZpbHRlcjwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHRlc3RCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1hbWJlciB3My1ib3JkZXItcmlnaHRcIj5UZXN0IFF1ZXJ5PC9idXR0b24+JylcclxuICAgICAgICB2YXIgZGVsQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5EZWxldGUgRmlsdGVyPC9idXR0b24+JylcclxuXHJcblxyXG4gICAgICAgIHRlc3RCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy50ZXN0UXVlcnkoKX0pXHJcbiAgICAgICAgc2F2ZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVRdWVyeSgpfSlcclxuICAgICAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5kZWxRdWVyeSgpfSlcclxuICAgICAgICBxdWVyeVNwYW4uYXBwZW5kKG5hbWVJbnB1dCxxdWVyeUxibCxxdWVyeUlucHV0LHNhdmVCdG4sdGVzdEJ0bixkZWxCdG4pXHJcblxyXG4gICAgICAgIHZhciB0ZXN0UmVzdWx0U3Bhbj0kKFwiPGRpdiBjbGFzcz0ndzMtYm9yZGVyJz48L2Rpdj5cIilcclxuICAgICAgICB2YXIgdGVzdFJlc3VsdFRhYmxlPSQoXCI8dGFibGU+PC90YWJsZT5cIilcclxuICAgICAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZT10ZXN0UmVzdWx0VGFibGVcclxuICAgICAgICB0ZXN0UmVzdWx0U3Bhbi5jc3Moe1wibWFyZ2luLXRvcFwiOlwiMnB4XCIsb3ZlcmZsb3c6XCJhdXRvXCIsaGVpZ2h0OlwiMTc1cHhcIix3aWR0aDpcIjQwMHB4XCJ9KVxyXG4gICAgICAgIHRlc3RSZXN1bHRUYWJsZS5jc3Moe1wiYm9yZGVyLWNvbGxhcHNlXCI6XCJjb2xsYXBzZVwifSlcclxuICAgICAgICBwYW5lbENhcmQuYXBwZW5kKHRlc3RSZXN1bHRTcGFuKVxyXG4gICAgICAgIHRlc3RSZXN1bHRTcGFuLmFwcGVuZCh0ZXN0UmVzdWx0VGFibGUpXHJcblxyXG4gICAgICAgIHRoaXMuYm90dG9tQmFyPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQodGhpcy5ib3R0b21CYXIpXHJcblxyXG4gICAgICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVCE9bnVsbCl7XHJcbiAgICAgICAgICAgIHN3aXRjaEFEVFNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZSh0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN3aXRjaEFEVFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnNldEFEVEluc3RhbmNlPWZ1bmN0aW9uKHNlbGVjdGVkQURUKXtcclxuICAgIHRoaXMuYm90dG9tQmFyLmVtcHR5KClcclxuICAgIHRoaXMuYnV0dG9uSG9sZGVyLmVtcHR5KClcclxuICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVD09bnVsbCB8fCB0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQgPT0gc2VsZWN0ZWRBRFQpe1xyXG4gICAgICAgIHZhciByZXBsYWNlQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCU7IG1hcmdpbi1yaWdodDo4cHhcIj5SZXBsYWNlIEFsbCBEYXRhPC9idXR0b24+JylcclxuICAgICAgICB2YXIgYXBwZW5kQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5BcHBlbmQgRGF0YTwvYnV0dG9uPicpXHJcblxyXG4gICAgICAgIHJlcGxhY2VCdXR0b24ub24oXCJjbGlja1wiLCgpPT4geyB0aGlzLnVzZUZpbHRlclRvUmVwbGFjZSgpICB9ICApXHJcbiAgICAgICAgYXBwZW5kQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCk9PiB7IHRoaXMudXNlRmlsdGVyVG9BcHBlbmQoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYnV0dG9uSG9sZGVyLmFwcGVuZChyZXBsYWNlQnV0dG9uLGFwcGVuZEJ1dHRvbilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciByZXBsYWNlQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtYm9yZGVyLXJpZ2h0XCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPlJlcGxhY2UgQWxsIERhdGE8L2J1dHRvbj4nKVxyXG4gICAgICAgIHJlcGxhY2VCdXR0b24ub24oXCJjbGlja1wiLCgpPT4geyB0aGlzLnVzZUZpbHRlclRvUmVwbGFjZSgpICB9ICApXHJcbiAgICAgICAgdGhpcy5idXR0b25Ib2xkZXIuYXBwZW5kKHJlcGxhY2VCdXR0b24pXHJcbiAgICB9XHJcbiAgICBnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVCA9IHNlbGVjdGVkQURUXHJcbiAgICBpZiAoIWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdKVxyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSA9IHt9XHJcbiAgICB0aGlzLmxpc3RGaWx0ZXJzKHNlbGVjdGVkQURUKVxyXG4gICAgdGhpcy5jaG9vc2VPbmVGaWx0ZXIoXCJcIixcIlwiKVxyXG4gICAgJC5hamF4U2V0dXAoe1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgJ2FkdEluc3RhbmNlJzogZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5kZWxRdWVyeT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHF1ZXJ5TmFtZT10aGlzLnF1ZXJ5TmFtZUlucHV0LnZhbCgpXHJcbiAgICBpZihxdWVyeU5hbWU9PVwiQUxMXCIgfHwgcXVlcnlOYW1lPT1cIlwiKXJldHVybjtcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIyNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIlBsZWFzZSBjb25maXJtIGRlbGV0aW5nIGZpbHRlciBcXFwiXCIrcXVlcnlOYW1lK1wiXFxcIj9cIlxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6W1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeU5hbWVJbnB1dC52YWwoXCJcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeUlucHV0LnZhbChcIlwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZS5lbXB0eSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbHRlcnNbZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdW3F1ZXJ5TmFtZV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5saXN0RmlsdGVycyhnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaG9vc2VPbmVGaWx0ZXIoXCJcIiwgXCJcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5wb3N0KFwidHdpbnNGaWx0ZXIvc2F2ZVN0YXJ0RmlsdGVyc1wiLCB7IGZpbHRlcnM6IHRoaXMuZmlsdGVycyB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIix0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnNhdmVRdWVyeT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHF1ZXJ5TmFtZT10aGlzLnF1ZXJ5TmFtZUlucHV0LnZhbCgpXHJcbiAgICB2YXIgcXVlcnlTdHI9dGhpcy5xdWVyeUlucHV0LnZhbCgpXHJcbiAgICBpZihxdWVyeU5hbWU9PVwiXCIpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gcXVlcnkgbmFtZVwiKVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZmlsdGVyc1tnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bcXVlcnlOYW1lXT1xdWVyeVN0clxyXG4gICAgdGhpcy5saXN0RmlsdGVycyhnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVClcclxuXHJcbiAgICB0aGlzLmZpbHRlckxpc3QuY2hpbGRyZW4oKS5lYWNoKChpbmRleCxlbGUpPT57XHJcbiAgICAgICAgaWYoJChlbGUpLmRhdGEoXCJmaWx0ZXJOYW1lXCIpPT1xdWVyeU5hbWUpIHtcclxuICAgICAgICAgICAgJChlbGUpLnRyaWdnZXIoXCJjbGlja1wiKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy9zdG9yZSBmaWx0ZXJzIHRvIHNlcnZlciBzaWRlIGFzIGEgZmlsZVxyXG4gICAgJC5wb3N0KFwidHdpbnNGaWx0ZXIvc2F2ZVN0YXJ0RmlsdGVyc1wiLHtmaWx0ZXJzOnRoaXMuZmlsdGVyc30pXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS50ZXN0UXVlcnk9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmVtcHR5KClcclxuICAgIHZhciBxdWVyeVN0cj0gdGhpcy5xdWVyeUlucHV0LnZhbCgpXHJcbiAgICBpZihxdWVyeVN0cj09XCJcIikgcmV0dXJuO1xyXG4gICAgJC5wb3N0KFwicXVlcnlBRFQvYWxsVHdpbnNJbmZvXCIse3F1ZXJ5OnF1ZXJ5U3RyfSwgKGRhdGEpPT4ge1xyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W11cclxuICAgICAgICBpZighQXJyYXkuaXNBcnJheShkYXRhKSkge1xyXG4gICAgICAgICAgICBhbGVydChcIlF1ZXJ5IGlzIG5vdCBjb3JyZWN0IVwiKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudGVzdFR3aW5zSW5mbz1kYXRhXHJcbiAgICAgICAgaWYoZGF0YS5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImNvbG9yOmdyYXlcIj56ZXJvIHJlY29yZDwvdGQ+PHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5XCI+PC90ZD48L3RyPicpXHJcbiAgICAgICAgICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmFwcGVuZCh0cilcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJib3JkZXItcmlnaHQ6c29saWQgMXB4IGxpZ2h0Z3JleTtib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXk7Zm9udC13ZWlnaHQ6Ym9sZFwiPklEPC90ZD48dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXk7Zm9udC13ZWlnaHQ6Ym9sZFwiPk1PREVMPC90ZD48L3RyPicpXHJcbiAgICAgICAgICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmFwcGVuZCh0cilcclxuICAgICAgICAgICAgZGF0YS5mb3JFYWNoKChvbmVOb2RlKT0+e1xyXG4gICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbb25lTm9kZVtcIiRkdElkXCJdXSA9IG9uZU5vZGU7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImJvcmRlci1yaWdodDpzb2xpZCAxcHggbGlnaHRncmV5O2JvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrb25lTm9kZVtcIiRkdElkXCJdKyc8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrb25lTm9kZVsnJG1ldGFkYXRhJ11bJyRtb2RlbCddKyc8L3RkPjwvdHI+JylcclxuICAgICAgICAgICAgICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmFwcGVuZCh0cilcclxuICAgICAgICAgICAgfSkgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5saXN0RmlsdGVycz1mdW5jdGlvbihhZHRJbnN0YW5jZU5hbWUpe1xyXG4gICAgdmFyIGF2YWlsYWJsZUZpbHRlcnM9dGhpcy5maWx0ZXJzW2FkdEluc3RhbmNlTmFtZV1cclxuICAgIGF2YWlsYWJsZUZpbHRlcnNbXCJBTExcIl09XCJTRUxFQ1QgKiBGUk9NIGRpZ2l0YWx0d2luc1wiXHJcblxyXG4gICAgdmFyIGZpbHRlckxpc3Q9dGhpcy5maWx0ZXJMaXN0O1xyXG4gICAgZmlsdGVyTGlzdC5lbXB0eSgpXHJcblxyXG4gICAgZm9yKHZhciBmaWx0ZXJOYW1lIGluIGF2YWlsYWJsZUZpbHRlcnMpe1xyXG4gICAgICAgIHZhciBvbmVGaWx0ZXI9JCgnPGxpIHN0eWxlPVwiZm9udC1zaXplOjFlbVwiPicrZmlsdGVyTmFtZSsnPC9saT4nKVxyXG4gICAgICAgIG9uZUZpbHRlci5jc3MoXCJjdXJzb3JcIixcImRlZmF1bHRcIilcclxuICAgICAgICBvbmVGaWx0ZXIuZGF0YShcImZpbHRlck5hbWVcIiwgZmlsdGVyTmFtZSlcclxuICAgICAgICBvbmVGaWx0ZXIuZGF0YShcImZpbHRlclF1ZXJ5XCIsIGF2YWlsYWJsZUZpbHRlcnNbZmlsdGVyTmFtZV0pXHJcbiAgICAgICAgaWYoZmlsdGVyTmFtZT09XCJBTExcIikgZmlsdGVyTGlzdC5wcmVwZW5kKG9uZUZpbHRlcilcclxuICAgICAgICBlbHNlIGZpbHRlckxpc3QuYXBwZW5kKG9uZUZpbHRlcilcclxuICAgICAgICB0aGlzLmFzc2lnbkV2ZW50VG9PbmVGaWx0ZXIob25lRmlsdGVyKVxyXG4gICAgICAgIFxyXG4gICAgICAgIG9uZUZpbHRlci5vbihcImRibGNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVCA9PSBnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVCkgdGhpcy51c2VGaWx0ZXJUb0FwcGVuZCgpO1xyXG4gICAgICAgICAgICBlbHNlIHRoaXMudXNlRmlsdGVyVG9SZXBsYWNlKCk7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmFzc2lnbkV2ZW50VG9PbmVGaWx0ZXI9ZnVuY3Rpb24ob25lRmlsdGVyKXtcclxuICAgIG9uZUZpbHRlci5vbihcImNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgdGhpcy5maWx0ZXJMaXN0LmNoaWxkcmVuKCkuZWFjaCgoaW5kZXgsZWxlKT0+e1xyXG4gICAgICAgICAgICAkKGVsZSkucmVtb3ZlQ2xhc3MoXCJ3My1hbWJlclwiKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgb25lRmlsdGVyLmFkZENsYXNzKFwidzMtYW1iZXJcIilcclxuICAgICAgICB2YXIgZmlsdGVyTmFtZT1vbmVGaWx0ZXIuZGF0YSgnZmlsdGVyTmFtZScpXHJcbiAgICAgICAgdmFyIHF1ZXJ5U3RyPW9uZUZpbHRlci5kYXRhKCdmaWx0ZXJRdWVyeScpXHJcbiAgICAgICAgdGhpcy5jaG9vc2VPbmVGaWx0ZXIoZmlsdGVyTmFtZSxxdWVyeVN0cilcclxuICAgIH0pXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS51c2VGaWx0ZXJUb0FwcGVuZD1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5xdWVyeUlucHV0LnZhbCgpPT1cIlwiKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBmaWxsIGluIHF1ZXJ5IHRvIGZldGNoIGRhdGEgZnJvbSBkaWdpdGFsIHR3aW4gc2VydmljZS4uXCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkQURUPT1udWxsKXtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFREYXRhc291cmNlQ2hhbmdlX3JlcGxhY2VcIiwgXCJxdWVyeVwiOiB0aGlzLnF1ZXJ5SW5wdXQudmFsKCksIFwidHdpbnNcIjp0aGlzLnRlc3RUd2luc0luZm8gfSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVD1nbG9iYWxDYWNoZS5zZWxlY3RlZEFEVFxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVERhdGFzb3VyY2VDaGFuZ2VfYXBwZW5kXCIsIFwicXVlcnlcIjogdGhpcy5xdWVyeUlucHV0LnZhbCgpLCBcInR3aW5zXCI6dGhpcy50ZXN0VHdpbnNJbmZvIH0pXHJcbiAgICB9XHJcbiAgICB0aGlzLmNsb3NlRGlhbG9nKClcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmNsb3NlRGlhbG9nPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVERhdGFzb3VyY2VEaWFsb2dfY2xvc2VkXCJ9KVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUudXNlRmlsdGVyVG9SZXBsYWNlPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnF1ZXJ5SW5wdXQudmFsKCk9PVwiXCIpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gcXVlcnkgdG8gZmV0Y2ggZGF0YSBmcm9tIGRpZ2l0YWwgdHdpbiBzZXJ2aWNlLi5cIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgQURUSW5zdGFuY2VEb2VzTm90Q2hhbmdlPXRydWVcclxuICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVCE9Z2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFQpe1xyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcykgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tpbmRdXHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnMpIGRlbGV0ZSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tpbmRdXHJcbiAgICAgICAgQURUSW5zdGFuY2VEb2VzTm90Q2hhbmdlPWZhbHNlXHJcbiAgICB9XHJcbiAgICB0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQ9Z2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVERhdGFzb3VyY2VDaGFuZ2VfcmVwbGFjZVwiLCBcInF1ZXJ5XCI6IHRoaXMucXVlcnlJbnB1dC52YWwoKVxyXG4gICAgLCBcInR3aW5zXCI6dGhpcy50ZXN0VHdpbnNJbmZvLCBcIkFEVEluc3RhbmNlRG9lc05vdENoYW5nZVwiOkFEVEluc3RhbmNlRG9lc05vdENoYW5nZSB9KVxyXG4gICAgXHJcbiAgICB0aGlzLmNsb3NlRGlhbG9nKClcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmNob29zZU9uZUZpbHRlcj1mdW5jdGlvbihxdWVyeU5hbWUscXVlcnlTdHIpe1xyXG4gICAgdGhpcy5xdWVyeU5hbWVJbnB1dC52YWwocXVlcnlOYW1lKVxyXG4gICAgdGhpcy5xdWVyeUlucHV0LnZhbChxdWVyeVN0cilcclxuICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmVtcHR5KClcclxuICAgIHRoaXMudGVzdFR3aW5zSW5mbz1udWxsXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nKCk7IiwiY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBlZGl0TGF5b3V0RGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDFcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5nZXRDdXJBRFROYW1lPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYWR0TmFtZSA9IGdsb2JhbENhY2hlLnNlbGVjdGVkQURUXHJcbiAgICB2YXIgc3RyID0gYWR0TmFtZS5yZXBsYWNlKFwiaHR0cHM6Ly9cIiwgXCJcIilcclxuICAgIHJldHVybiBzdHJcclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVERhdGFzb3VyY2VDaGFuZ2VfcmVwbGFjZVwiKSB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLnBvc3QoXCJsYXlvdXQvcmVhZExheW91dHNcIix7YWR0TmFtZTp0aGlzLmdldEN1ckFEVE5hbWUoKX0sIChkYXRhLCBzdGF0dXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGEhPVwiXCIgJiYgdHlwZW9mKGRhdGEpPT09XCJvYmplY3RcIikgZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTj1kYXRhO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OPXt9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIn0pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5yZWZpbGxPcHRpb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgXHJcbiAgICBmb3IodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKXtcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmFkZE9wdGlvbihpbmQpXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcblxyXG4gICAgdGhpcy5ET00uY3NzKHtcIndpZHRoXCI6XCIzMjBweFwiLFwicGFkZGluZy1ib3R0b21cIjpcIjNweFwifSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHg7bWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbVwiPkxheW91dDwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7IHdpZHRoOjE4MHB4OyBkaXNwbGF5OmlubGluZTttYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjJweFwiICBwbGFjZWhvbGRlcj1cIkZpbGwgaW4gYSBuZXcgbGF5b3V0IG5hbWUuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICAgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQobmFtZUlucHV0KVxyXG4gICAgdmFyIHNhdmVBc05ld0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCI+U2F2ZSBBcyBOZXc8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc05ld0J0bilcclxuICAgIHNhdmVBc05ld0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KG5hbWVJbnB1dC52YWwoKSl9KVxyXG5cclxuXHJcbiAgICBpZighalF1ZXJ5LmlzRW1wdHlPYmplY3QoZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikpe1xyXG4gICAgICAgIHZhciBsYmw9JCgnPGRpdiBjbGFzcz1cInczLWJhciB3My1wYWRkaW5nLTE2XCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4tIE9SIC08L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChsYmwpIFxyXG4gICAgICAgIHZhciBzd2l0Y2hMYXlvdXRTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiLHtmb250U2l6ZTpcIjFlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5XCIsd2lkdGg6XCIxMjBweFwifSlcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yPXN3aXRjaExheW91dFNlbGVjdG9yXHJcbiAgICAgICAgdGhpcy5yZWZpbGxPcHRpb25zKClcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgICAgICBpZihvcHRpb25UZXh0PT1udWxsKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCIgXCIpXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB2YXIgc2F2ZUFzQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6NXB4XCI+U2F2ZSBBczwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGRlbGV0ZUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDo1cHhcIj5EZWxldGUgTGF5b3V0PC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoc2F2ZUFzQnRuLHN3aXRjaExheW91dFNlbGVjdG9yLkRPTSxkZWxldGVCdG4pXHJcbiAgICAgICAgc2F2ZUFzQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2F2ZUludG9MYXlvdXQoc3dpdGNoTGF5b3V0U2VsZWN0b3IuY3VyU2VsZWN0VmFsKX0pXHJcbiAgICAgICAgZGVsZXRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsZXRlTGF5b3V0KHN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbCl9KVxyXG5cclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgc3dpdGNoTGF5b3V0U2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5zYXZlSW50b0xheW91dCA9IGZ1bmN0aW9uIChsYXlvdXROYW1lKSB7XHJcbiAgICBpZihsYXlvdXROYW1lPT1cIlwiIHx8IGxheW91dE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGNob29zZSB0YXJnZXQgbGF5b3V0IE5hbWVcIilcclxuICAgICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNhdmVMYXlvdXRcIiwgXCJsYXlvdXROYW1lXCI6IGxheW91dE5hbWUsIFwiYWR0TmFtZVwiOnRoaXMuZ2V0Q3VyQURUTmFtZSgpIH0pXHJcbiAgICB0aGlzLkRPTS5oaWRlKClcclxufVxyXG5cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLmRlbGV0ZUxheW91dCA9IGZ1bmN0aW9uIChsYXlvdXROYW1lKSB7XHJcbiAgICBpZihsYXlvdXROYW1lPT1cIlwiIHx8IGxheW91dE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGNob29zZSB0YXJnZXQgbGF5b3V0IE5hbWVcIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXY9bmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG5cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjI1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkNvbmZpcm1cIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6IFwiUGxlYXNlIGNvbmZpcm0gZGVsZXRpbmcgbGF5b3V0IFxcXCJcIiArIGxheW91dE5hbWUgKyBcIlxcXCI/XCJcclxuICAgICAgICAgICAgLCBidXR0b25zOltcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXlvdXROYW1lID09IGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lKSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIiB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLnBvc3QoXCJsYXlvdXQvc2F2ZUxheW91dHNcIiwgeyBcImFkdE5hbWVcIjogdGhpcy5nZXRDdXJBRFROYW1lKCksIFwibGF5b3V0c1wiOiBKU09OLnN0cmluZ2lmeShnbG9iYWxDYWNoZS5sYXlvdXRKU09OKSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmaWxsT3B0aW9ucygpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIix0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGVkaXRMYXlvdXREaWFsb2coKTsiLCJmdW5jdGlvbiBnbG9iYWxDYWNoZSgpe1xyXG4gICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMgPSB7fVxyXG4gICAgdGhpcy5zdG9yZWRUd2lucyA9IHt9XHJcblxyXG4gICAgdGhpcy5jdXJyZW50TGF5b3V0TmFtZT1udWxsXHJcbiAgICB0aGlzLmxheW91dEpTT049e31cclxuXHJcbiAgICB0aGlzLnNlbGVjdGVkQURUPW51bGw7XHJcblxyXG4gICAgdGhpcy52aXN1YWxEZWZpbml0aW9uPXt9XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHR3aW5JRD1vbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXT1bXVxyXG4gICAgfSlcclxuXHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZD1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIGlmKCF0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXSlcclxuICAgICAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV09W11cclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX3JlbW92ZT1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbnNoaXBbXCJzcmNJRFwiXVxyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY0lEXSl7XHJcbiAgICAgICAgICAgIHZhciBhcnI9dGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdXHJcbiAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8YXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgaWYoYXJyW2ldWyckcmVsYXRpb25zaGlwSWQnXT09b25lUmVsYXRpb25zaGlwW1wicmVsSURcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIGFyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZ2xvYmFsQ2FjaGUoKTsiLCJjb25zdCBtb2RlbEFuYWx5emVyID0gcmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKTtcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBpbmZvUGFuZWwoKSB7XHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjkwO3JpZ2h0OjBweDt0b3A6NTAlO2hlaWdodDo3MCU7d2lkdGg6MzAwcHg7dHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpO1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo1MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PC9kaXY+JykpXHJcblxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjE9JCgnPGJ1dHRvbiBzdHlsZT1cImhlaWdodDoxMDAlXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIj48aSBjbGFzcz1cImZhIGZhLWluZm8tY2lyY2xlIGZhLTJ4XCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjI9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbVwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGluZXJET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmNsb3NlQnV0dG9uMSx0aGlzLmNsb3NlQnV0dG9uMikgXHJcblxyXG4gICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgIHZhciBidXR0b25BbmltPSgpPT57XHJcbiAgICAgICAgaWYoIXRoaXMuaXNNaW5pbWl6ZWQpe1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiLTI1MHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6XCI1MHB4XCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD10cnVlO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiMHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IFwiNzAlXCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMS5vbihcImNsaWNrXCIsYnV0dG9uQW5pbSlcclxuICAgIHRoaXMuY2xvc2VCdXR0b24yLm9uKFwiY2xpY2tcIixidXR0b25BbmltKVxyXG5cclxuICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cInBvc3Rpb246YWJzb2x1dGU7dG9wOjUwcHg7aGVpZ2h0OmNhbGMoMTAwJSAtIDUwcHgpO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIHRoaXMuY29udGluZXJET00uaG92ZXIoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMSlcIilcclxuICAgIH0sICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIH0pO1xyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAkKCdib2R5JykuYXBwZW5kKHRoaXMuY29udGluZXJET00pXHJcbiAgICB0aGlzLkRPTS5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheSc+Q2hvb3NlIHR3aW5zIG9yIHJlbGF0aW9uc2hpcHMgdG8gdmlldyBpbmZvbXJhdGlvbjwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHgnPlByZXNzIHNoaWZ0IGtleSB0byBzZWxlY3QgbXVsdGlwbGUgaW4gdG9wb2xvZ3kgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHg7cGFkZGluZy1ib3R0b206MjBweCc+UHJlc3MgY3RybCBrZXkgdG8gc2VsZWN0IG11bHRpcGxlIGluIHRyZWUgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHg7cGFkZGluZy1ib3R0b206NXB4Jz5JbXBvcnQgdHdpbnMgZGF0YSBieSBjbGlja2luZyBidXR0b24gYmVsb3c8L2E+XCIpXHJcblxyXG4gICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG5cclxuICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzPW51bGw7XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpeyAgIFxyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVERhdGFzb3VyY2VEaWFsb2dfY2xvc2VkXCIpe1xyXG4gICAgICAgIGlmKCF0aGlzLmNvbnRpbmVyRE9NLmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5zaG93KClcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hZGRDbGFzcyhcInczLWFuaW1hdGUtcmlnaHRcIilcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2VsZWN0Tm9kZXNcIil7XHJcbiAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgIHZhciBhcnI9bXNnUGF5bG9hZC5pbmZvO1xyXG5cclxuICAgICAgICBpZihhcnI9PW51bGwgfHwgYXJyLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMobnVsbClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9W107XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzPWFycjtcclxuICAgICAgICBpZihhcnIubGVuZ3RoPT0xKXtcclxuICAgICAgICAgICAgdmFyIHNpbmdsZUVsZW1lbnRJbmZvPWFyclswXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKHNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl0pey8vIHNlbGVjdCBhIG5vZGVcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMoXCJzaW5nbGVOb2RlXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRkdElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXX0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbE5hbWU9c2luZ2xlRWxlbWVudEluZm9bJyRtZXRhZGF0YSddWyckbW9kZWwnXVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZihtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sbW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsTmFtZV0uZWRpdGFibGVQcm9wZXJ0aWVzLHNpbmdsZUVsZW1lbnRJbmZvLFtdKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZXRhZ1wiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGV0YWdcIl0sXCIkbWV0YWRhdGFcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXX0sXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgfWVsc2UgaWYoc2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl0pe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcInNpbmdsZVJlbGF0aW9uc2hpcFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgICAgICAgICAgXCIkc291cmNlSWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSxcclxuICAgICAgICAgICAgICAgICAgICBcIiR0YXJnZXRJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHRhcmdldElkXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcE5hbWVcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBOYW1lXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICAgICAgICAgIH0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnNoaXBOYW1lPXNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl1cclxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VNb2RlbD1zaW5nbGVFbGVtZW50SW5mb1tcInNvdXJjZU1vZGVsXCJdXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLHRoaXMuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpLHNpbmdsZUVsZW1lbnRJbmZvLFtdKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZXRhZ1wiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGV0YWdcIl19LFwiMWVtXCIsXCIxMHB4XCIsXCJEYXJrR3JheVwiKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2UgaWYoYXJyLmxlbmd0aD4xKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcIm11bHRpcGxlXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd011bHRpcGxlT2JqKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2VsZWN0R3JvdXBOb2RlXCIpe1xyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICB2YXIgbW9kZWxJRCA9IG1zZ1BheWxvYWQuaW5mb1tcIkBpZFwiXVxyXG4gICAgICAgIGlmKCFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0pIHJldHVybjtcclxuICAgICAgICB2YXIgdHdpbkpzb24gPSB7XHJcbiAgICAgICAgICAgIFwiJG1ldGFkYXRhXCI6IHtcclxuICAgICAgICAgICAgICAgIFwiJG1vZGVsXCI6IG1vZGVsSURcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYWRkQnRuID0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuIHczLW1hcmdpblwiPkFkZCBUd2luPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYWRkQnRuKVxyXG5cclxuICAgICAgICBhZGRCdG4ub24oXCJjbGlja1wiLChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKCF0d2luSnNvbltcIiRkdElkXCJdfHx0d2luSnNvbltcIiRkdElkXCJdPT1cIlwiKXtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gbmFtZSBmb3IgdGhlIG5ldyBkaWdpdGFsIHR3aW5cIilcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGNvbXBvbmVudHNOYW1lQXJyPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5pbmNsdWRlZENvbXBvbmVudHNcclxuICAgICAgICAgICAgY29tcG9uZW50c05hbWVBcnIuZm9yRWFjaChvbmVDb21wb25lbnROYW1lPT57IC8vYWR0IHNlcnZpY2UgcmVxdWVzdGluZyBhbGwgY29tcG9uZW50IGFwcGVhciBieSBtYW5kYXRvcnlcclxuICAgICAgICAgICAgICAgIGlmKHR3aW5Kc29uW29uZUNvbXBvbmVudE5hbWVdPT1udWxsKXR3aW5Kc29uW29uZUNvbXBvbmVudE5hbWVdPXt9XHJcbiAgICAgICAgICAgICAgICB0d2luSnNvbltvbmVDb21wb25lbnROYW1lXVtcIiRtZXRhZGF0YVwiXT0ge31cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgJC5wb3N0KFwiZWRpdEFEVC91cHNlcnREaWdpdGFsVHdpblwiLCB7XCJuZXdUd2luSnNvblwiOkpTT04uc3RyaW5naWZ5KHR3aW5Kc29uKX1cclxuICAgICAgICAgICAgICAgICwgKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAhPSBcIlwiKSB7Ly9ub3Qgc3VjY2Vzc2Z1bCBlZGl0aW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KGRhdGEpXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9zdWNjZXNzZnVsIGVkaXRpbmcsIHVwZGF0ZSB0aGUgbm9kZSBvcmlnaW5hbCBpbmZvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXlMYWJlbD10aGlzLkRPTS5maW5kKCcjTkVXVFdJTl9JRExhYmVsJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIElESW5wdXQ9a2V5TGFiZWwuZmluZChcImlucHV0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKElESW5wdXQpIElESW5wdXQudmFsKFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL29uZVR3aW5JbmZvXCIse3R3aW5JRDp0d2luSnNvbltcIiRkdElkXCJdfSwgKGRhdGEpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZGF0YT09XCJcIikgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbZGF0YVtcIiRkdElkXCJdXSA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhZGROZXdUd2luXCIsdHdpbkluZm86ZGF0YX0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgIFwiTW9kZWxcIjptb2RlbElEXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgYWRkQnRuLmRhdGEoXCJ0d2luSnNvblwiLHR3aW5Kc29uKVxyXG4gICAgICAgIHZhciBjb3B5UHJvcGVydHk9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uZWRpdGFibGVQcm9wZXJ0aWVzKSlcclxuICAgICAgICBjb3B5UHJvcGVydHlbJyRkdElkJ109XCJzdHJpbmdcIlxyXG4gICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLGNvcHlQcm9wZXJ0eSx0d2luSnNvbixbXSxcIm5ld1R3aW5cIilcclxuICAgICAgICAvL2NvbnNvbGUubG9nKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXSkgXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpe1xyXG4gICAgaWYoIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0gfHwgIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdKSByZXR1cm5cclxuICAgIHJldHVybiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXNcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3QnV0dG9ucz1mdW5jdGlvbihzZWxlY3RUeXBlKXtcclxuICAgIHZhciBpbXBCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibHVlXCI+PGkgY2xhc3M9XCJmYSBmYS1hcnJvdy1jaXJjbGUtby1kb3duXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0VHdpbnNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJtb2RlbEZpbGVzXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgaWYoc2VsZWN0VHlwZSE9bnVsbCl7XHJcbiAgICAgICAgdmFyIHJlZnJlc2hCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibGFja1wiPjxpIGNsYXNzPVwiZmEgZmEtcmVmcmVzaFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBleHBCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ncmVlblwiPjxpIGNsYXNzPVwiZmEgZmEtYXJyb3ctY2lyY2xlLW8tdXBcIj48L2k+PC9idXR0b24+JykgICAgXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHJlZnJlc2hCdG4sZXhwQnRuLGltcEJ0bixhY3R1YWxJbXBvcnRUd2luc0J0bilcclxuICAgICAgICByZWZyZXNoQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMucmVmcmVzaEluZm9tYXRpb24oKX0pXHJcbiAgICAgICAgZXhwQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICAvL2ZpbmQgb3V0IHRoZSB0d2lucyBpbiBzZWxlY3Rpb24gYW5kIHRoZWlyIGNvbm5lY3Rpb25zIChmaWx0ZXIgYm90aCBzcmMgYW5kIHRhcmdldCB3aXRoaW4gdGhlIHNlbGVjdGVkIHR3aW5zKVxyXG4gICAgICAgICAgICAvL2FuZCBleHBvcnQgdGhlbVxyXG4gICAgICAgICAgICB0aGlzLmV4cG9ydFNlbGVjdGVkKClcclxuICAgICAgICB9KSAgICBcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChpbXBCdG4sYWN0dWFsSW1wb3J0VHdpbnNCdG4pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGltcEJ0bi5vbihcImNsaWNrXCIsKCk9PnthY3R1YWxJbXBvcnRUd2luc0J0bi50cmlnZ2VyKCdjbGljaycpO30pXHJcbiAgICBhY3R1YWxJbXBvcnRUd2luc0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCk9PntcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICBhd2FpdCB0aGlzLnJlYWRUd2luc0ZpbGVzQ29udGVudEFuZEltcG9ydChmaWxlcylcclxuICAgICAgICBhY3R1YWxJbXBvcnRUd2luc0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcbiAgICBpZihzZWxlY3RUeXBlPT1udWxsKSByZXR1cm47XHJcblxyXG4gICAgaWYoc2VsZWN0VHlwZT09XCJzaW5nbGVSZWxhdGlvbnNoaXBcIil7XHJcbiAgICAgICAgdmFyIGRlbEJ0biA9ICAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NTAlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyXCI+RGVsZXRlIEFsbDwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGRlbEJ0bilcclxuICAgICAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5kZWxldGVTZWxlY3RlZCgpfSlcclxuICAgIH1lbHNlIGlmKHNlbGVjdFR5cGU9PVwic2luZ2xlTm9kZVwiIHx8IHNlbGVjdFR5cGU9PVwibXVsdGlwbGVcIil7XHJcbiAgICAgICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo1MCVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGluayB3My1ib3JkZXJcIj5EZWxldGUgQWxsPC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29ubmVjdFRvQnRuID0kKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkNvbm5lY3QgdG88L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBjb25uZWN0RnJvbUJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5Db25uZWN0IGZyb208L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBzaG93SW5ib3VuZEJ0biA9ICQoJzxidXR0b24gIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+UXVlcnkgSW5ib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHNob3dPdXRCb3VuZEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5RdWVyeSBPdXRib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGRlbEJ0biwgY29ubmVjdFRvQnRuLGNvbm5lY3RGcm9tQnRuICwgc2hvd0luYm91bmRCdG4sIHNob3dPdXRCb3VuZEJ0bilcclxuICAgIFxyXG4gICAgICAgIHNob3dPdXRCb3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNob3dPdXRCb3VuZCgpfSlcclxuICAgICAgICBzaG93SW5ib3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNob3dJbkJvdW5kKCl9KSAgXHJcbiAgICAgICAgY29ubmVjdFRvQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImNvbm5lY3RUb1wifSkgfSlcclxuICAgICAgICBjb25uZWN0RnJvbUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJjb25uZWN0RnJvbVwifSkgfSlcclxuXHJcbiAgICAgICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsZXRlU2VsZWN0ZWQoKX0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBudW1PZk5vZGUgPSAwO1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50WyckZHRJZCddKSBudW1PZk5vZGUrK1xyXG4gICAgfSk7XHJcbiAgICBpZihudW1PZk5vZGU+MCl7XHJcbiAgICAgICAgdmFyIHNlbGVjdEluYm91bmRCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPitTZWxlY3QgSW5ib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHNlbGVjdE91dEJvdW5kQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj4rU2VsZWN0IE91dGJvdW5kPC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29zZUxheW91dEJ0bj0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5DT1NFIFZpZXc8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBoaWRlQnRuPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkhpZGU8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChzZWxlY3RJbmJvdW5kQnRuLCBzZWxlY3RPdXRCb3VuZEJ0bixjb3NlTGF5b3V0QnRuLGhpZGVCdG4pXHJcblxyXG4gICAgICAgIHNlbGVjdEluYm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJhZGRTZWxlY3RJbmJvdW5kXCJ9KX0pXHJcbiAgICAgICAgc2VsZWN0T3V0Qm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJhZGRTZWxlY3RPdXRib3VuZFwifSl9KVxyXG4gICAgICAgIGNvc2VMYXlvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJDT1NFU2VsZWN0ZWROb2Rlc1wifSl9KVxyXG4gICAgICAgIGhpZGVCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJoaWRlU2VsZWN0ZWROb2Rlc1wifSl9KVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmV4cG9ydFNlbGVjdGVkPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgdmFyIHR3aW5Ub0JlU3RvcmVkPVtdXHJcbiAgICB2YXIgdHdpbklEcz17fVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm5cclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgICAgIHZhciBhbkV4cFR3aW49e31cclxuICAgICAgICBhbkV4cFR3aW5bXCIkbWV0YWRhdGFcIl09e1wiJG1vZGVsXCI6ZWxlbWVudFtcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXX1cclxuICAgICAgICBmb3IodmFyIGluZCBpbiBlbGVtZW50KXtcclxuICAgICAgICAgICAgaWYoaW5kPT1cIiRtZXRhZGF0YVwiIHx8IGluZD09XCIkZXRhZ1wiKSBjb250aW51ZSBcclxuICAgICAgICAgICAgZWxzZSBhbkV4cFR3aW5baW5kXT1lbGVtZW50W2luZF1cclxuICAgICAgICB9XHJcbiAgICAgICAgdHdpblRvQmVTdG9yZWQucHVzaChhbkV4cFR3aW4pXHJcbiAgICAgICAgdHdpbklEc1tlbGVtZW50WyckZHRJZCddXT0xXHJcbiAgICB9KTtcclxuICAgIHZhciByZWxhdGlvbnNUb0JlU3RvcmVkPVtdXHJcbiAgICB0d2luSURBcnIuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnM9Z2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgIGlmKCFyZWxhdGlvbnMpIHJldHVybjtcclxuICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bXCIkdGFyZ2V0SWRcIl1cclxuICAgICAgICAgICAgaWYodHdpbklEc1t0YXJnZXRJRF0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmo9e31cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVJlbGF0aW9uKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihpbmQgPT1cIiRldGFnXCJ8fGluZCA9PVwiJHJlbGF0aW9uc2hpcElkXCJ8fGluZCA9PVwiJHNvdXJjZUlkXCJ8fGluZCA9PVwic291cmNlTW9kZWxcIikgY29udGludWVcclxuICAgICAgICAgICAgICAgICAgICBvYmpbaW5kXT1vbmVSZWxhdGlvbltpbmRdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgb25lQWN0aW9uPXtcIiRzcmNJZFwiOm9uZUlELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcElkXCI6b25lUmVsYXRpb25bXCIkcmVsYXRpb25zaGlwSWRcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvYmpcIjpvYmp9XHJcbiAgICAgICAgICAgICAgICByZWxhdGlvbnNUb0JlU3RvcmVkLnB1c2gob25lQWN0aW9uKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgZmluYWxKU09OPXtcInR3aW5zXCI6dHdpblRvQmVTdG9yZWQsXCJyZWxhdGlvbnNcIjpyZWxhdGlvbnNUb0JlU3RvcmVkfVxyXG4gICAgdmFyIHBvbSA9ICQoXCI8YT48L2E+XCIpXHJcbiAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGZpbmFsSlNPTikpKTtcclxuICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0VHdpbnNEYXRhLmpzb25cIik7XHJcbiAgICBwb21bMF0uY2xpY2soKVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlYWRPbmVGaWxlPSBhc3luYyBmdW5jdGlvbihhRmlsZSl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSAoKT0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoYUZpbGUpO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlYWRUd2luc0ZpbGVzQ29udGVudEFuZEltcG9ydD1hc3luYyBmdW5jdGlvbihmaWxlcyl7XHJcbiAgICB2YXIgaW1wb3J0VHdpbnM9W11cclxuICAgIHZhciBpbXBvcnRSZWxhdGlvbnM9W11cclxuICAgIGZvciAodmFyIGkgPSAwLCBmOyBmID0gZmlsZXNbaV07IGkrKykge1xyXG4gICAgICAgIC8vIE9ubHkgcHJvY2VzcyBqc29uIGZpbGVzLlxyXG4gICAgICAgIGlmIChmLnR5cGUhPVwiYXBwbGljYXRpb24vanNvblwiKSBjb250aW51ZTtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBzdHI9IGF3YWl0IHRoaXMucmVhZE9uZUZpbGUoZilcclxuICAgICAgICAgICAgdmFyIG9iaj1KU09OLnBhcnNlKHN0cilcclxuICAgICAgICAgICAgaWYob2JqLnR3aW5zKSBpbXBvcnRUd2lucz1pbXBvcnRUd2lucy5jb25jYXQob2JqLnR3aW5zKVxyXG4gICAgICAgICAgICBpZihvYmoucmVsYXRpb25zKSBpbXBvcnRSZWxhdGlvbnM9aW1wb3J0UmVsYXRpb25zLmNvbmNhdChvYmoucmVsYXRpb25zKVxyXG4gICAgICAgIH1jYXRjaChlcnIpe1xyXG4gICAgICAgICAgICBhbGVydChlcnIpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciB0d2luc0ltcG9ydFJlc3VsdD0gYXdhaXQgdGhpcy5iYXRjaEltcG9ydFR3aW5zKGltcG9ydFR3aW5zKVxyXG4gICAgdHdpbnNJbXBvcnRSZXN1bHQuZm9yRWFjaChkYXRhPT57XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbZGF0YVtcIiRkdElkXCJdXSA9IGRhdGE7XHJcbiAgICB9KVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWRkTmV3VHdpbnNcIix0d2luc0luZm86dHdpbnNJbXBvcnRSZXN1bHR9KVxyXG5cclxuICAgIHZhciByZWxhdGlvbnNJbXBvcnRSZXN1bHQ9YXdhaXQgdGhpcy5iYXRjaEltcG9ydFJlbGF0aW9ucyhpbXBvcnRSZWxhdGlvbnMpXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZChyZWxhdGlvbnNJbXBvcnRSZXN1bHQpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsaW5mbzpyZWxhdGlvbnNJbXBvcnRSZXN1bHR9KVxyXG5cclxuICAgIHZhciBudW1PZlR3aW5zPXR3aW5zSW1wb3J0UmVzdWx0Lmxlbmd0aFxyXG4gICAgdmFyIG51bU9mUmVsYXRpb25zPXJlbGF0aW9uc0ltcG9ydFJlc3VsdC5sZW5ndGhcclxuICAgIHZhciBzdHI9XCJBZGQgXCIrbnVtT2ZUd2lucysgXCIgbm9kZVwiKygobnVtT2ZUd2luczw9MSk/XCJcIjpcInNcIikrXCIsIFwiK251bU9mUmVsYXRpb25zK1wiIHJlbGF0aW9uc2hpcFwiKygobnVtT2ZSZWxhdGlvbnM8PTEpP1wiXCI6XCJzXCIpXHJcbiAgICBzdHIrPWAuIChSYXcgdHdpbiByZWNvcmRzOiR7aW1wb3J0VHdpbnMubGVuZ3RofSk7IFJhdyByZWxhdGlvbnMgcmVjb3Jkczoke2ltcG9ydFJlbGF0aW9ucy5sZW5ndGh9KWBcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMjAwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiSW1wb3J0IFJlc3VsdFwiXHJcbiAgICAgICAgICAgICwgY29udGVudDpzdHJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiT2tcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuYmF0Y2hJbXBvcnRUd2lucz1hc3luYyBmdW5jdGlvbih0d2lucyl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGlmKHR3aW5zLmxlbmd0aD09MCkgcmVzb2x2ZShbXSlcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQucG9zdChcImVkaXRBRFQvYmF0Y2hJbXBvcnRUd2luc1wiLHtcInR3aW5zXCI6SlNPTi5zdHJpbmdpZnkodHdpbnMpfSwgKGRhdGEpPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgPT0gXCJcIikgZGF0YT1bXVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuYmF0Y2hJbXBvcnRSZWxhdGlvbnM9YXN5bmMgZnVuY3Rpb24ocmVsYXRpb25zKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgaWYocmVsYXRpb25zLmxlbmd0aD09MCkgcmVzb2x2ZShbXSlcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQucG9zdChcImVkaXRBRFQvY3JlYXRlUmVsYXRpb25zXCIse1wiYWN0aW9uc1wiOkpTT04uc3RyaW5naWZ5KHJlbGF0aW9ucyl9LCAoZGF0YSk9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSBkYXRhPVtdXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucmVmcmVzaEluZm9tYXRpb249YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICB2YXIgcXVlcnlBcnI9W11cclxuICAgIGFyci5mb3JFYWNoKG9uZUl0ZW09PntcclxuICAgICAgICBpZihvbmVJdGVtWyckcmVsYXRpb25zaGlwSWQnXSkgcXVlcnlBcnIucHVzaCh7JyRzb3VyY2VJZCc6b25lSXRlbVsnJHNvdXJjZUlkJ10sJyRyZWxhdGlvbnNoaXBJZCc6b25lSXRlbVsnJHJlbGF0aW9uc2hpcElkJ119KVxyXG4gICAgICAgIGVsc2UgcXVlcnlBcnIucHVzaCh7JyRkdElkJzpvbmVJdGVtWyckZHRJZCddfSlcclxuICAgIH0pXHJcblxyXG4gICAgJC5wb3N0KFwicXVlcnlBRFQvZmV0Y2hJbmZvbWF0aW9uXCIse1wiZWxlbWVudHNcIjpxdWVyeUFycn0sICAoZGF0YSk9PiB7XHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgcmV0dXJuO1xyXG4gICAgICAgIGRhdGEuZm9yRWFjaChvbmVSZT0+e1xyXG4gICAgICAgICAgICBpZihvbmVSZVtcIiRyZWxhdGlvbnNoaXBJZFwiXSl7Ly91cGRhdGUgc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzXHJcbiAgICAgICAgICAgICAgICB2YXIgc3JjSUQ9IG9uZVJlWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICAgICAgdmFyIHJlbGF0aW9uc2hpcElkPSBvbmVSZVsnJHJlbGF0aW9uc2hpcElkJ11cclxuICAgICAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF0hPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnM9Z2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY0lEXVxyXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVN0b3JlZFJlbGF0aW9uPT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKG9uZVN0b3JlZFJlbGF0aW9uWyckcmVsYXRpb25zaGlwSWQnXT09cmVsYXRpb25zaGlwSWQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy91cGRhdGUgYWxsIGNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVJlKXsgb25lU3RvcmVkUmVsYXRpb25baW5kXT1vbmVSZVtpbmRdIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1lbHNley8vdXBkYXRlIHN0b3JlZFR3aW5zXHJcbiAgICAgICAgICAgICAgICB2YXIgdHdpbklEPSBvbmVSZVsnJGR0SWQnXVxyXG4gICAgICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdHdpbklEXSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lUmUpeyBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0d2luSURdW2luZF09b25lUmVbaW5kXSB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vcmVkcmF3IGluZm9wYW5lbCBpZiBuZWVkZWRcclxuICAgICAgICBpZih0aGlzLnNlbGVjdGVkT2JqZWN0cy5sZW5ndGg9PTEpIHRoaXMucnhNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2VsZWN0Tm9kZXNcIiwgaW5mbzogdGhpcy5zZWxlY3RlZE9iamVjdHMgfSlcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVTZWxlY3RlZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGlmKGFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciByZWxhdGlvbnNBcnI9W11cclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIHZhciB0d2luSURzPXt9XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJlbGF0aW9uc0Fyci5wdXNoKGVsZW1lbnQpO1xyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICAgICAgICAgIHR3aW5JRHNbZWxlbWVudFsnJGR0SWQnXV09MVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgZm9yKHZhciBpPXJlbGF0aW9uc0Fyci5sZW5ndGgtMTtpPj0wO2ktLSl7IC8vY2xlYXIgdGhvc2UgcmVsYXRpb25zaGlwcyB0aGF0IGFyZSBnb2luZyB0byBiZSBkZWxldGVkIGFmdGVyIHR3aW5zIGRlbGV0aW5nXHJcbiAgICAgICAgdmFyIHNyY0lkPSAgcmVsYXRpb25zQXJyW2ldWyckc291cmNlSWQnXVxyXG4gICAgICAgIHZhciB0YXJnZXRJZCA9IHJlbGF0aW9uc0FycltpXVsnJHRhcmdldElkJ11cclxuICAgICAgICBpZih0d2luSURzW3NyY0lkXSE9bnVsbCB8fCB0d2luSURzW3RhcmdldElkXSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHJlbGF0aW9uc0Fyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIHZhciBkaWFsb2dTdHI9XCJcIlxyXG4gICAgdmFyIHR3aW5OdW1iZXI9dHdpbklEQXJyLmxlbmd0aDtcclxuICAgIHZhciByZWxhdGlvbnNOdW1iZXIgPSByZWxhdGlvbnNBcnIubGVuZ3RoO1xyXG4gICAgaWYodHdpbk51bWJlcj4wKSBkaWFsb2dTdHIgPSAgdHdpbk51bWJlcitcIiB0d2luXCIrKCh0d2luTnVtYmVyPjEpP1wic1wiOlwiXCIpICsgXCIgKHdpdGggY29ubmVjdGVkIHJlbGF0aW9ucylcIlxyXG4gICAgaWYodHdpbk51bWJlcj4wICYmIHJlbGF0aW9uc051bWJlcj4wKSBkaWFsb2dTdHIrPVwiIGFuZCBhZGRpdGlvbmFsIFwiXHJcbiAgICBpZihyZWxhdGlvbnNOdW1iZXI+MCkgZGlhbG9nU3RyICs9ICByZWxhdGlvbnNOdW1iZXIrXCIgcmVsYXRpb25cIisoKHJlbGF0aW9uc051bWJlcj4xKT9cInNcIjpcIlwiIClcclxuICAgIGRpYWxvZ1N0cis9XCIgd2lsbCBiZSBkZWxldGVkLiBQbGVhc2UgY29uZmlybVwiXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIzNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OmRpYWxvZ1N0clxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0d2luSURBcnIubGVuZ3RoID4gMCkgdGhpcy5kZWxldGVUd2lucyh0d2luSURBcnIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGlvbnNBcnIubGVuZ3RoID4gMCkgdGhpcy5kZWxldGVSZWxhdGlvbnMocmVsYXRpb25zQXJyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlVHdpbnM9YXN5bmMgZnVuY3Rpb24odHdpbklEQXJyKXsgICBcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdmFyIHJlc3VsdD1hd2FpdCB0aGlzLmRlbGV0ZVBhcnRpYWxUd2lucyhzbWFsbEFycilcclxuXHJcbiAgICAgICAgcmVzdWx0LmZvckVhY2goKG9uZUlEKT0+e1xyXG4gICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbb25lSURdXHJcbiAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInR3aW5zRGVsZXRlZFwiLHR3aW5JREFycjpyZXN1bHR9KVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVBhcnRpYWxUd2lucz0gYXN5bmMgZnVuY3Rpb24oSURBcnIpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQucG9zdChcImVkaXRBRFQvZGVsZXRlVHdpbnNcIix7YXJyOklEQXJyfSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W11cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVSZWxhdGlvbnM9YXN5bmMgZnVuY3Rpb24ocmVsYXRpb25zQXJyKXtcclxuICAgIHZhciBhcnI9W11cclxuICAgIHJlbGF0aW9uc0Fyci5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgYXJyLnB1c2goe3NyY0lEOm9uZVJlbGF0aW9uWyckc291cmNlSWQnXSxyZWxJRDpvbmVSZWxhdGlvblsnJHJlbGF0aW9uc2hpcElkJ119KVxyXG4gICAgfSlcclxuICAgICQucG9zdChcImVkaXRBRFQvZGVsZXRlUmVsYXRpb25zXCIse1wicmVsYXRpb25zXCI6YXJyfSwgIChkYXRhKT0+IHsgXHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXTtcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX3JlbW92ZShkYXRhKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJlbGF0aW9uc0RlbGV0ZWRcIixcInJlbGF0aW9uc1wiOmRhdGF9KVxyXG4gICAgfSk7XHJcbiAgICBcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5zaG93T3V0Qm91bmQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVybjtcclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdmFyIGRhdGE9YXdhaXQgdGhpcy5mZXRjaFBhcnRpYWxPdXRib3VuZHMoc21hbGxBcnIpXHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgY29udGludWU7XHJcbiAgICAgICAgLy9uZXcgdHdpbidzIHJlbGF0aW9uc2hpcCBzaG91bGQgYmUgc3RvcmVkIGFzIHdlbGxcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEubmV3VHdpblJlbGF0aW9ucylcclxuICAgICAgICBcclxuICAgICAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICAgICAgdmFyIG9uZVR3aW49b25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbaW5kXT1vbmVUd2luXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiLGluZm86ZGF0YX0pXHJcbiAgICAgICAgXHJcblxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNob3dJbkJvdW5kPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm47XHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHZhciBkYXRhPWF3YWl0IHRoaXMuZmV0Y2hQYXJ0aWFsSW5ib3VuZHMoc21hbGxBcnIpXHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgY29udGludWU7XHJcbiAgICAgICAgLy9uZXcgdHdpbidzIHJlbGF0aW9uc2hpcCBzaG91bGQgYmUgc3RvcmVkIGFzIHdlbGxcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEubmV3VHdpblJlbGF0aW9ucylcclxuICAgICAgICBcclxuICAgICAgICAvL2RhdGEubmV3VHdpblJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57Y29uc29sZS5sb2cob25lUmVsYXRpb25bJyRzb3VyY2VJZCddK1wiLT5cIitvbmVSZWxhdGlvblsnJHRhcmdldElkJ10pfSlcclxuICAgICAgICAvL2NvbnNvbGUubG9nKGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tcImRlZmF1bHRcIl0pXHJcblxyXG4gICAgICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tpbmRdPW9uZVR3aW5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIsaW5mbzpkYXRhfSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5mZXRjaFBhcnRpYWxPdXRib3VuZHM9IGFzeW5jIGZ1bmN0aW9uKElEQXJyKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAvL2ZpbmQgb3V0IHRob3NlIGV4aXN0ZWQgb3V0Ym91bmQgd2l0aCBrbm93biB0YXJnZXQgVHdpbnMgc28gdGhleSBjYW4gYmUgZXhjbHVkZWQgZnJvbSBxdWVyeVxyXG4gICAgICAgICAgICB2YXIga25vd25UYXJnZXRUd2lucz17fVxyXG4gICAgICAgICAgICBJREFyci5mb3JFYWNoKG9uZUlEPT57XHJcbiAgICAgICAgICAgICAgICBrbm93blRhcmdldFR3aW5zW29uZUlEXT0xIC8vaXRzZWxmIGFsc28gaXMga25vd25cclxuICAgICAgICAgICAgICAgIHZhciBvdXRCb3VuZFJlbGF0aW9uPWdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICAgICAgICAgIGlmKG91dEJvdW5kUmVsYXRpb24pe1xyXG4gICAgICAgICAgICAgICAgICAgIG91dEJvdW5kUmVsYXRpb24uZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bXCIkdGFyZ2V0SWRcIl1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdIT1udWxsKSBrbm93blRhcmdldFR3aW5zW3RhcmdldElEXT0xXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL3Nob3dPdXRCb3VuZFwiLHthcnI6SURBcnIsXCJrbm93blRhcmdldHNcIjprbm93blRhcmdldFR3aW5zfSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmZldGNoUGFydGlhbEluYm91bmRzPSBhc3luYyBmdW5jdGlvbihJREFycil7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgLy9maW5kIG91dCB0aG9zZSBleGlzdGVkIGluYm91bmQgd2l0aCBrbm93biBzb3VyY2UgVHdpbnMgc28gdGhleSBjYW4gYmUgZXhjbHVkZWQgZnJvbSBxdWVyeVxyXG4gICAgICAgICAgICB2YXIga25vd25Tb3VyY2VUd2lucz17fVxyXG4gICAgICAgICAgICB2YXIgSUREaWN0PXt9XHJcbiAgICAgICAgICAgIElEQXJyLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICAgICAgICAgIElERGljdFtvbmVJRF09MVxyXG4gICAgICAgICAgICAgICAga25vd25Tb3VyY2VUd2luc1tvbmVJRF09MSAvL2l0c2VsZiBhbHNvIGlzIGtub3duXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGZvcih2YXIgdHdpbklEIGluIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVsYXRpb25zPWdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdXHJcbiAgICAgICAgICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvblsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoSUREaWN0W3RhcmdldElEXSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSE9bnVsbCkga25vd25Tb3VyY2VUd2luc1tzcmNJRF09MVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL3Nob3dJbkJvdW5kXCIse2FycjpJREFycixcImtub3duU291cmNlc1wiOmtub3duU291cmNlVHdpbnN9LCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd011bHRpcGxlT2JqPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgbnVtT2ZFZGdlID0gMDtcclxuICAgIHZhciBudW1PZk5vZGUgPSAwO1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGlmKGFycj09bnVsbCkgcmV0dXJuO1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSBudW1PZkVkZ2UrK1xyXG4gICAgICAgIGVsc2UgbnVtT2ZOb2RlKytcclxuICAgIH0pO1xyXG4gICAgdmFyIHRleHREaXY9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jazttYXJnaW4tdG9wOjEwcHgnPjwvbGFiZWw+XCIpXHJcbiAgICB0ZXh0RGl2LnRleHQobnVtT2ZOb2RlKyBcIiBub2RlXCIrKChudW1PZk5vZGU8PTEpP1wiXCI6XCJzXCIpK1wiLCBcIitudW1PZkVkZ2UrXCIgcmVsYXRpb25zaGlwXCIrKChudW1PZkVkZ2U8PTEpP1wiXCI6XCJzXCIpKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRleHREaXYpXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd1N0YXRpY0luZm89ZnVuY3Rpb24ocGFyZW50LGpzb25JbmZvLHBhZGRpbmdUb3AsZm9udFNpemUpe1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgY2xhc3M9J3czLWJvcmRlcicgc3R5bGU9J2JhY2tncm91bmQtY29sb3I6I2Y2ZjZmNjtkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW0nPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAga2V5RGl2LmNzcyh7XCJmb250U2l6ZVwiOmZvbnRTaXplLFwiY29sb3JcIjpcImRhcmtHcmF5XCJ9KVxyXG4gICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLHBhZGRpbmdUb3ApXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxcIi41ZW1cIixmb250U2l6ZSlcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy10b3BcIixcIi4yZW1cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6Zm9udFNpemUsXCJjb2xvclwiOlwiYmxhY2tcIn0pXHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdFZGl0YWJsZT1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8sb3JpZ2luRWxlbWVudEluZm8scGF0aEFycixpc05ld1R3aW4pe1xyXG4gICAgaWYoanNvbkluZm89PW51bGwpIHJldHVybjtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07IGZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6YmxhY2snPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgaWYoaXNOZXdUd2luKXtcclxuICAgICAgICAgICAgaWYoaW5kPT1cIiRkdElkXCIpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5wcmVwZW5kKGtleURpdilcclxuICAgICAgICAgICAgICAgIGtleURpdi5hdHRyKCdpZCcsJ05FV1RXSU5fSURMYWJlbCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4zZW1cIikgXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgc3R5bGU9J3BhZGRpbmctdG9wOi4yZW0nPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgdmFyIG5ld1BhdGg9cGF0aEFyci5jb25jYXQoW2luZF0pXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSl7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0Ryb3Bkb3duT3B0aW9uKGNvbnRlbnRET00sbmV3UGF0aCxqc29uSW5mb1tpbmRdLGlzTmV3VHdpbixvcmlnaW5FbGVtZW50SW5mbylcclxuICAgICAgICB9ZWxzZSBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZShjb250ZW50RE9NLGpzb25JbmZvW2luZF0sb3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aCxpc05ld1R3aW4pXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwicGFkZGluZzoycHg7d2lkdGg6NTAlO291dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZVwiIHBsYWNlaG9sZGVyPVwidHlwZTogJytqc29uSW5mb1tpbmRdKydcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICBcclxuICAgICAgICAgICAgY29udGVudERPTS5hcHBlbmQoYUlucHV0KVxyXG4gICAgICAgICAgICB2YXIgdmFsPXRoaXMuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgICAgICAgICAgaWYodmFsIT1udWxsKSBhSW5wdXQudmFsKHZhbClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICAgICAgICAgIGFJbnB1dC5kYXRhKFwiZGF0YVR5cGVcIiwganNvbkluZm9baW5kXSlcclxuICAgICAgICAgICAgYUlucHV0LmNoYW5nZSgoZSk9PntcclxuICAgICAgICAgICAgICAgIHRoaXMuZWRpdERUUHJvcGVydHkob3JpZ2luRWxlbWVudEluZm8sJChlLnRhcmdldCkuZGF0YShcInBhdGhcIiksJChlLnRhcmdldCkudmFsKCksJChlLnRhcmdldCkuZGF0YShcImRhdGFUeXBlXCIpLGlzTmV3VHdpbilcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdEcm9wZG93bk9wdGlvbj1mdW5jdGlvbihjb250ZW50RE9NLG5ld1BhdGgsdmFsdWVBcnIsaXNOZXdUd2luLG9yaWdpbkVsZW1lbnRJbmZvKXtcclxuICAgIHZhciBhU2VsZWN0TWVudT1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiLHtidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNHB4IDE2cHhcIn19KVxyXG4gICAgY29udGVudERPTS5hcHBlbmQoYVNlbGVjdE1lbnUuRE9NKVxyXG4gICAgYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICB2YWx1ZUFyci5mb3JFYWNoKChvbmVPcHRpb24pPT57XHJcbiAgICAgICAgdmFyIHN0ciA9b25lT3B0aW9uW1wiZGlzcGxheU5hbWVcIl0gIHx8IG9uZU9wdGlvbltcImVudW1WYWx1ZVwiXSBcclxuICAgICAgICBhU2VsZWN0TWVudS5hZGRPcHRpb24oc3RyKVxyXG4gICAgfSlcclxuICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgIGFTZWxlY3RNZW51LmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBpZihyZWFsTW91c2VDbGljaykgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbyxhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiksb3B0aW9uVmFsdWUsXCJzdHJpbmdcIixpc05ld1R3aW4pXHJcbiAgICB9XHJcbiAgICB2YXIgdmFsPXRoaXMuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgIGlmKHZhbCE9bnVsbCl7XHJcbiAgICAgICAgYVNlbGVjdE1lbnUudHJpZ2dlck9wdGlvblZhbHVlKHZhbClcclxuICAgIH0gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZWRpdERUUHJvcGVydHk9ZnVuY3Rpb24ob3JpZ2luRWxlbWVudEluZm8scGF0aCxuZXdWYWwsZGF0YVR5cGUsaXNOZXdUd2luKXtcclxuICAgIGlmKFtcImRvdWJsZVwiLFwiYm9vbGVhblwiLFwiZmxvYXRcIixcImludGVnZXJcIixcImxvbmdcIl0uaW5jbHVkZXMoZGF0YVR5cGUpKSBuZXdWYWw9TnVtYmVyKG5ld1ZhbClcclxuXHJcbiAgICAvL3sgXCJvcFwiOiBcImFkZFwiLCBcInBhdGhcIjogXCIveFwiLCBcInZhbHVlXCI6IDMwIH1cclxuICAgIGlmKGlzTmV3VHdpbil7XHJcbiAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxwYXRoLG5ld1ZhbClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZihwYXRoLmxlbmd0aD09MSl7XHJcbiAgICAgICAgdmFyIHN0cj1cIlwiXHJcbiAgICAgICAgcGF0aC5mb3JFYWNoKHNlZ21lbnQ9PntzdHIrPVwiL1wiK3NlZ21lbnR9KVxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IHN0ciwgXCJ2YWx1ZVwiOiBuZXdWYWx9IF1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vaXQgaXMgYSBwcm9wZXJ0eSBpbnNpZGUgYSBvYmplY3QgdHlwZSBvZiByb290IHByb3BlcnR5LHVwZGF0ZSB0aGUgd2hvbGUgcm9vdCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciByb290UHJvcGVydHk9cGF0aFswXVxyXG4gICAgICAgIHZhciBwYXRjaFZhbHVlPSBvcmlnaW5FbGVtZW50SW5mb1tyb290UHJvcGVydHldXHJcbiAgICAgICAgaWYocGF0Y2hWYWx1ZT09bnVsbCkgcGF0Y2hWYWx1ZT17fVxyXG4gICAgICAgIGVsc2UgcGF0Y2hWYWx1ZT1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHBhdGNoVmFsdWUpKSAvL21ha2UgYSBjb3B5XHJcbiAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShwYXRjaFZhbHVlLHBhdGguc2xpY2UoMSksbmV3VmFsKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL1wiK3Jvb3RQcm9wZXJ0eSwgXCJ2YWx1ZVwiOiBwYXRjaFZhbHVlfSBdXHJcbiAgICB9XHJcblxyXG4gICAgaWYob3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7IC8vZWRpdCBhIG5vZGUgcHJvcGVydHlcclxuICAgICAgICB2YXIgdHdpbklEID0gb3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHZhciBwYXlMb2FkPXtcImpzb25QYXRjaFwiOkpTT04uc3RyaW5naWZ5KGpzb25QYXRjaCksXCJ0d2luSURcIjp0d2luSUR9XHJcbiAgICB9ZWxzZSBpZihvcmlnaW5FbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXSl7IC8vZWRpdCBhIHJlbGF0aW9uc2hpcCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciB0d2luSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgdmFyIHBheUxvYWQ9e1wianNvblBhdGNoXCI6SlNPTi5zdHJpbmdpZnkoanNvblBhdGNoKSxcInR3aW5JRFwiOnR3aW5JRCxcInJlbGF0aW9uc2hpcElEXCI6cmVsYXRpb25zaGlwSUR9XHJcbiAgICB9XHJcbiAgICBcclxuICAgICQucG9zdChcImVkaXRBRFQvY2hhbmdlQXR0cmlidXRlXCIscGF5TG9hZFxyXG4gICAgICAgICwgIChkYXRhKT0+IHtcclxuICAgICAgICAgICAgaWYoZGF0YSE9XCJcIikge1xyXG4gICAgICAgICAgICAgICAgLy9ub3Qgc3VjY2Vzc2Z1bCBlZGl0aW5nXHJcbiAgICAgICAgICAgICAgICBhbGVydChkYXRhKVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIC8vc3VjY2Vzc2Z1bCBlZGl0aW5nLCB1cGRhdGUgdGhlIG5vZGUgb3JpZ2luYWwgaW5mb1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxwYXRoLG5ld1ZhbClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlPWZ1bmN0aW9uKG5vZGVJbmZvLHBhdGhBcnIsbmV3VmFsKXtcclxuICAgIGlmKHBhdGhBcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB2YXIgdGhlSnNvbj1ub2RlSW5mb1xyXG4gICAgZm9yKHZhciBpPTA7aTxwYXRoQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBrZXk9cGF0aEFycltpXVxyXG5cclxuICAgICAgICBpZihpPT1wYXRoQXJyLmxlbmd0aC0xKXtcclxuICAgICAgICAgICAgdGhlSnNvbltrZXldPW5ld1ZhbFxyXG4gICAgICAgICAgICBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGVKc29uW2tleV09PW51bGwpIHRoZUpzb25ba2V5XT17fVxyXG4gICAgICAgIHRoZUpzb249dGhlSnNvbltrZXldXHJcbiAgICB9XHJcbiAgICByZXR1cm5cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5zZWFyY2hWYWx1ZT1mdW5jdGlvbihvcmlnaW5FbGVtZW50SW5mbyxwYXRoQXJyKXtcclxuICAgIGlmKHBhdGhBcnIubGVuZ3RoPT0wKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciB0aGVKc29uPW9yaWdpbkVsZW1lbnRJbmZvXHJcbiAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGtleT1wYXRoQXJyW2ldXHJcbiAgICAgICAgdGhlSnNvbj10aGVKc29uW2tleV1cclxuICAgICAgICBpZih0aGVKc29uPT1udWxsKSByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGVKc29uIC8vaXQgc2hvdWxkIGJlIHRoZSBmaW5hbCB2YWx1ZVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBpbmZvUGFuZWwoKTsiLCIkKCdkb2N1bWVudCcpLnJlYWR5KGZ1bmN0aW9uKCl7XHJcbiAgICBjb25zdCBtYWluVUk9cmVxdWlyZShcIi4vbWFpblVJLmpzXCIpICAgIFxyXG59KTsiLCJjb25zdCBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZyA9IHJlcXVpcmUoXCIuL2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsTWFuYWdlckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBlZGl0TGF5b3V0RGlhbG9nPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gbWFpblRvb2xiYXIoKSB7XHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFkZENsYXNzKFwidzMtYmFyIHczLXJlZFwiKVxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5jc3Moe1wiei1pbmRleFwiOjEwMCxcIm92ZXJmbG93XCI6XCJ2aXNpYmxlXCJ9KVxyXG5cclxuICAgIHRoaXMuc3dpdGNoQURUSW5zdGFuY2VCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPlNvdXJjZTwvYT4nKVxyXG4gICAgdGhpcy5tb2RlbElPQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5Nb2RlbHM8L2E+JylcclxuICAgIHRoaXMuc2hvd0ZvcmdlVmlld0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1ub25lIHczLXRleHQtbGlnaHQtZ3JleSB3My1ob3Zlci10ZXh0LWxpZ2h0LWdyZXlcIiBzdHlsZT1cIm9wYWNpdHk6LjM1XCIgaHJlZj1cIiNcIj5Gb3JnZVZpZXc8L2E+JylcclxuICAgIHRoaXMuc2hvd0dJU1ZpZXdCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItbm9uZSB3My10ZXh0LWxpZ2h0LWdyZXkgdzMtaG92ZXItdGV4dC1saWdodC1ncmV5XCIgc3R5bGU9XCJvcGFjaXR5Oi4zNVwiIGhyZWY9XCIjXCI+R0lTVmlldzwvYT4nKVxyXG4gICAgdGhpcy5lZGl0TGF5b3V0QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLWVkaXRcIj48L2k+PC9hPicpXHJcblxyXG5cclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJMYXlvdXRcIilcclxuXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmVtcHR5KClcclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuYXBwZW5kKHRoaXMuc3dpdGNoQURUSW5zdGFuY2VCdG4sdGhpcy5tb2RlbElPQnRuLHRoaXMuc2hvd0ZvcmdlVmlld0J0bix0aGlzLnNob3dHSVNWaWV3QnRuXHJcbiAgICAgICAgLHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuRE9NLHRoaXMuZWRpdExheW91dEJ0bilcclxuXHJcbiAgICB0aGlzLnN3aXRjaEFEVEluc3RhbmNlQnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLm1vZGVsSU9CdG4ub24oXCJjbGlja1wiLCgpPT57IG1vZGVsTWFuYWdlckRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLmVkaXRMYXlvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57IGVkaXRMYXlvdXREaWFsb2cucG9wdXAoKSB9KVxyXG5cclxuXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgIGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lPW9wdGlvblZhbHVlXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0Q2hhbmdlXCJ9KVxyXG4gICAgICAgIGlmKG9wdGlvblZhbHVlPT1cIltOQV1cIikgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0XCIsXCJcIilcclxuICAgICAgICBlbHNlIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dDpcIixvcHRpb25UZXh0KVxyXG4gICAgfVxyXG59XHJcblxyXG5tYWluVG9vbGJhci5wcm90b3R5cGUudXBkYXRlTGF5b3V0U2VsZWN0b3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgY3VyU2VsZWN0PXRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY3VyU2VsZWN0VmFsXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNsZWFyT3B0aW9ucygpXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmFkZE9wdGlvbignW05vIExheW91dCBTcGVjaWZpZWRdJywnW05BXScpXHJcblxyXG4gICAgZm9yICh2YXIgaW5kIGluIGdsb2JhbENhY2hlLmxheW91dEpTT04pIHtcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmFkZE9wdGlvbihpbmQpXHJcbiAgICB9XHJcblxyXG4gICAgaWYoY3VyU2VsZWN0IT1udWxsICYmIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuZmluZE9wdGlvbihjdXJTZWxlY3QpPT1udWxsKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXRcIixcIlwiKVxyXG59XHJcblxyXG5tYWluVG9vbGJhci5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImxheW91dHNVcGRhdGVkXCIpIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dFNlbGVjdG9yKClcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbWFpblRvb2xiYXIoKTsiLCIndXNlIHN0cmljdCc7XHJcbmNvbnN0IHRvcG9sb2d5RE9NPXJlcXVpcmUoXCIuL3RvcG9sb2d5RE9NLmpzXCIpXHJcbmNvbnN0IHR3aW5zVHJlZT1yZXF1aXJlKFwiLi90d2luc1RyZWVcIilcclxuY29uc3QgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cgPSByZXF1aXJlKFwiLi9hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbE1hbmFnZXJEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbE1hbmFnZXJEaWFsb2dcIilcclxuY29uc3QgbW9kZWxFZGl0b3JEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbEVkaXRvckRpYWxvZ1wiKVxyXG5jb25zdCBlZGl0TGF5b3V0RGlhbG9nID0gcmVxdWlyZShcIi4vZWRpdExheW91dERpYWxvZ1wiKVxyXG5jb25zdCBtYWluVG9vbGJhciA9IHJlcXVpcmUoXCIuL21haW5Ub29sYmFyXCIpXHJcbmNvbnN0IGluZm9QYW5lbD0gcmVxdWlyZShcIi4vaW5mb1BhbmVsXCIpXHJcblxyXG5mdW5jdGlvbiBtYWluVUkoKSB7XHJcbiAgICB0aGlzLmluaXRVSUxheW91dCgpXHJcblxyXG4gICAgdGhpcy50d2luc1RyZWU9IG5ldyB0d2luc1RyZWUoJChcIiN0cmVlSG9sZGVyXCIpLCQoXCIjdHJlZVNlYXJjaFwiKSlcclxuICAgIFxyXG4gICAgdGhpcy5tYWluVG9vbGJhcj1tYWluVG9vbGJhclxyXG4gICAgbWFpblRvb2xiYXIucmVuZGVyKClcclxuICAgIHRoaXMudG9wb2xvZ3lJbnN0YW5jZT1uZXcgdG9wb2xvZ3lET00oJCgnI2NhbnZhcycpKVxyXG4gICAgdGhpcy50b3BvbG9neUluc3RhbmNlLmluaXQoKVxyXG4gICAgdGhpcy5pbmZvUGFuZWw9IGluZm9QYW5lbFxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSgpIC8vaW5pdGlhbGl6ZSBhbGwgdWkgY29tcG9uZW50cyB0byBoYXZlIHRoZSBicm9hZGNhc3QgY2FwYWJpbGl0eVxyXG4gICAgdGhpcy5wcmVwYXJlRGF0YSgpXHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUucHJlcGFyZURhdGE9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBwcm9taXNlQXJyPVtcclxuICAgICAgICBtb2RlbE1hbmFnZXJEaWFsb2cucHJlcGFyYXRpb25GdW5jKCksXHJcbiAgICAgICAgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJlcGFyYXRpb25GdW5jKClcclxuICAgIF1cclxuICAgIGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChwcm9taXNlQXJyKTtcclxuICAgIGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnBvcHVwKClcclxufVxyXG5cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuYXNzaWduQnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbih1aUNvbXBvbmVudCl7XHJcbiAgICB1aUNvbXBvbmVudC5icm9hZGNhc3RNZXNzYWdlPShtc2dPYmopPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHVpQ29tcG9uZW50LG1zZ09iail9XHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuYnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbihzb3VyY2UsbXNnUGF5bG9hZCl7XHJcbiAgICB2YXIgY29tcG9uZW50c0Fycj1bdGhpcy50d2luc1RyZWUsYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2csbW9kZWxNYW5hZ2VyRGlhbG9nLG1vZGVsRWRpdG9yRGlhbG9nLGVkaXRMYXlvdXREaWFsb2csXHJcbiAgICAgICAgIHRoaXMubWFpblRvb2xiYXIsdGhpcy50b3BvbG9neUluc3RhbmNlLHRoaXMuaW5mb1BhbmVsXVxyXG5cclxuICAgIGlmKHNvdXJjZT09bnVsbCl7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxjb21wb25lbnRzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgdGhlQ29tcG9uZW50PWNvbXBvbmVudHNBcnJbaV1cclxuICAgICAgICAgICAgdGhpcy5hc3NpZ25Ccm9hZGNhc3RNZXNzYWdlKHRoZUNvbXBvbmVudClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGNvbXBvbmVudHNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciB0aGVDb21wb25lbnQ9Y29tcG9uZW50c0FycltpXVxyXG4gICAgICAgICAgICBpZih0aGVDb21wb25lbnQucnhNZXNzYWdlICYmIHRoZUNvbXBvbmVudCE9c291cmNlKSB0aGVDb21wb25lbnQucnhNZXNzYWdlKG1zZ1BheWxvYWQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5tYWluVUkucHJvdG90eXBlLmluaXRVSUxheW91dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBteUxheW91dCA9ICQoJ2JvZHknKS5sYXlvdXQoe1xyXG4gICAgICAgIC8vXHRyZWZlcmVuY2Ugb25seSAtIHRoZXNlIG9wdGlvbnMgYXJlIE5PVCByZXF1aXJlZCBiZWNhdXNlICd0cnVlJyBpcyB0aGUgZGVmYXVsdFxyXG4gICAgICAgIGNsb3NhYmxlOiB0cnVlXHQvLyBwYW5lIGNhbiBvcGVuICYgY2xvc2VcclxuICAgICAgICAsIHJlc2l6YWJsZTogdHJ1ZVx0Ly8gd2hlbiBvcGVuLCBwYW5lIGNhbiBiZSByZXNpemVkIFxyXG4gICAgICAgICwgc2xpZGFibGU6IHRydWVcdC8vIHdoZW4gY2xvc2VkLCBwYW5lIGNhbiAnc2xpZGUnIG9wZW4gb3ZlciBvdGhlciBwYW5lcyAtIGNsb3NlcyBvbiBtb3VzZS1vdXRcclxuICAgICAgICAsIGxpdmVQYW5lUmVzaXppbmc6IHRydWVcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcmVzaXppbmcvdG9nZ2xpbmcgc2V0dGluZ3NcclxuICAgICAgICAsIG5vcnRoX19zbGlkYWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3NsaWRhYmxlPXRydWUnXHJcbiAgICAgICAgLy8sIG5vcnRoX190b2dnbGVyTGVuZ3RoX2Nsb3NlZDogJzEwMCUnXHQvLyB0b2dnbGUtYnV0dG9uIGlzIGZ1bGwtd2lkdGggb2YgcmVzaXplci1iYXJcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX2Nsb3NlZDogNlx0XHQvLyBiaWcgcmVzaXplci1iYXIgd2hlbiBvcGVuICh6ZXJvIGhlaWdodClcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX29wZW46MFxyXG4gICAgICAgICwgbm9ydGhfX3Jlc2l6YWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3Jlc2l6YWJsZT10cnVlJ1xyXG4gICAgICAgICwgbm9ydGhfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgd2VzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLCBlYXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcGFuZS1zaXplIHNldHRpbmdzXHJcbiAgICAgICAgLCB3ZXN0X19taW5TaXplOiAxMDBcclxuICAgICAgICAsIGVhc3RfX3NpemU6IDMwMFxyXG4gICAgICAgICwgZWFzdF9fbWluU2l6ZTogMjAwXHJcbiAgICAgICAgLCBlYXN0X19tYXhTaXplOiAuNSAvLyA1MCUgb2YgbGF5b3V0IHdpZHRoXHJcbiAgICAgICAgLCBjZW50ZXJfX21pbldpZHRoOiAxMDBcclxuICAgICAgICAsZWFzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLHdlc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICxlYXN0X19pbml0Q2xvc2VkOlx0dHJ1ZVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKlx0RElTQUJMRSBURVhULVNFTEVDVElPTiBXSEVOIERSQUdHSU5HIChvciBldmVuIF90cnlpbmdfIHRvIGRyYWchKVxyXG4gICAgICpcdHRoaXMgZnVuY3Rpb25hbGl0eSB3aWxsIGJlIGluY2x1ZGVkIGluIFJDMzAuODBcclxuICAgICAqL1xyXG4gICAgJC5sYXlvdXQuZGlzYWJsZVRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRkID0gJChkb2N1bWVudClcclxuICAgICAgICAgICAgLCBzID0gJ3RleHRTZWxlY3Rpb25EaXNhYmxlZCdcclxuICAgICAgICAgICAgLCB4ID0gJ3RleHRTZWxlY3Rpb25Jbml0aWFsaXplZCdcclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIGlmICgkLmZuLmRpc2FibGVTZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHgpKSAvLyBkb2N1bWVudCBoYXNuJ3QgYmVlbiBpbml0aWFsaXplZCB5ZXRcclxuICAgICAgICAgICAgICAgICRkLm9uKCdtb3VzZXVwJywgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbikuZGF0YSh4LCB0cnVlKTtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHMpKVxyXG4gICAgICAgICAgICAgICAgJGQuZGlzYWJsZVNlbGVjdGlvbigpLmRhdGEocywgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyQubGF5b3V0LmRpc2FibGVUZXh0U2VsZWN0aW9uJyk7XHJcbiAgICB9O1xyXG4gICAgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJGQgPSAkKGRvY3VtZW50KVxyXG4gICAgICAgICAgICAsIHMgPSAndGV4dFNlbGVjdGlvbkRpc2FibGVkJztcclxuICAgICAgICBpZiAoJC5mbi5lbmFibGVTZWxlY3Rpb24gJiYgJGQuZGF0YShzKSlcclxuICAgICAgICAgICAgJGQuZW5hYmxlU2VsZWN0aW9uKCkuZGF0YShzLCBmYWxzZSk7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbicpO1xyXG4gICAgfTtcclxuICAgICQoXCIudWktbGF5b3V0LXJlc2l6ZXItbm9ydGhcIikuaGlkZSgpXHJcbiAgICAkKFwiLnVpLWxheW91dC13ZXN0XCIpLmNzcyhcImJvcmRlci1yaWdodFwiLFwic29saWQgMXB4IGxpZ2h0R3JheVwiKVxyXG4gICAgJChcIi51aS1sYXlvdXQtd2VzdFwiKS5hZGRDbGFzcyhcInczLWNhcmRcIilcclxuXHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtYWluVUkoKTsiLCIvL1RoaXMgaXMgYSBzaW5nbGV0b24gY2xhc3NcclxuXHJcbmZ1bmN0aW9uIG1vZGVsQW5hbHl6ZXIoKXtcclxuICAgIHRoaXMuRFRETE1vZGVscz17fVxyXG4gICAgdGhpcy5yZWxhdGlvbnNoaXBUeXBlcz17fVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5jbGVhckFsbE1vZGVscz1mdW5jdGlvbigpe1xyXG4gICAgY29uc29sZS5sb2coXCJjbGVhciBhbGwgbW9kZWwgaW5mb1wiKVxyXG4gICAgZm9yKHZhciBpZCBpbiB0aGlzLkRURExNb2RlbHMpIGRlbGV0ZSB0aGlzLkRURExNb2RlbHNbaWRdXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlc2V0QWxsTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXtcclxuICAgICAgICB2YXIganNvblN0cj10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXT1KU09OLnBhcnNlKGpzb25TdHIpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl09anNvblN0clxyXG4gICAgfVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuYWRkTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBhcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgIHZhciBtb2RlbElEPSBlbGVbXCJAaWRcIl1cclxuICAgICAgICBlbGVbXCJvcmlnaW5hbFwiXT1KU09OLnN0cmluZ2lmeShlbGUpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdPWVsZVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlY29yZEFsbEJhc2VDbGFzc2VzPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgIHBhcmVudE9ialtiYXNlQ2xhc3NJRF09MVxyXG5cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMucmVjb3JkQWxsQmFzZUNsYXNzZXMocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyA9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZiAoYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllcykge1xyXG4gICAgICAgIGZvciAodmFyIGluZCBpbiBiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzKSBwYXJlbnRPYmpbaW5kXSA9IGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXNbaW5kXVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzID0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmIChiYXNlQ2xhc3MudmFsaWRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaW5kIGluIGJhc2VDbGFzcy52YWxpZFJlbGF0aW9uc2hpcHMpIHtcclxuICAgICAgICAgICAgaWYocGFyZW50T2JqW2luZF09PW51bGwpIHBhcmVudE9ialtpbmRdID0gdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tpbmRdW2Jhc2VDbGFzc0lEXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHBhcmVudE9iaixkYXRhSW5mbyxlbWJlZGRlZFNjaGVtYSl7XHJcbiAgICBkYXRhSW5mby5mb3JFYWNoKChvbmVDb250ZW50KT0+e1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJSZWxhdGlvbnNoaXBcIikgcmV0dXJuO1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJQcm9wZXJ0eVwiXHJcbiAgICAgICAgfHwoQXJyYXkuaXNBcnJheShvbmVDb250ZW50W1wiQHR5cGVcIl0pICYmIG9uZUNvbnRlbnRbXCJAdHlwZVwiXS5pbmNsdWRlcyhcIlByb3BlcnR5XCIpKVxyXG4gICAgICAgIHx8IG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09bnVsbCkge1xyXG4gICAgICAgICAgICBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcgJiYgZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV0hPW51bGwpIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl09ZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV1cclxuXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSA9PT0gJ29iamVjdCcgJiYgb25lQ29udGVudFtcInNjaGVtYVwiXVtcIkB0eXBlXCJdPT1cIk9iamVjdFwiKXtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdQYXJlbnQ9e31cclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09bmV3UGFyZW50XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhuZXdQYXJlbnQsb25lQ29udGVudFtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxlbWJlZGRlZFNjaGVtYSlcclxuICAgICAgICAgICAgfWVsc2UgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pID09PSAnb2JqZWN0JyAmJiBvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiQHR5cGVcIl09PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09b25lQ29udGVudFtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl1cclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1cclxuICAgICAgICAgICAgfSAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmFuYWx5emU9ZnVuY3Rpb24oKXtcclxuICAgIGNvbnNvbGUubG9nKFwiYW5hbHl6ZSBtb2RlbCBpbmZvXCIpXHJcbiAgICAvL2FuYWx5emUgYWxsIHJlbGF0aW9uc2hpcCB0eXBlc1xyXG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5yZWxhdGlvbnNoaXBUeXBlcykgZGVsZXRlIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbaWRdXHJcbiAgICBmb3IgKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscykge1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgZW1iZWRkZWRTY2hlbWEgPSB7fVxyXG4gICAgICAgIGlmIChlbGUuc2NoZW1hcykge1xyXG4gICAgICAgICAgICB2YXIgdGVtcEFycjtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZWxlLnNjaGVtYXMpKSB0ZW1wQXJyID0gZWxlLnNjaGVtYXNcclxuICAgICAgICAgICAgZWxzZSB0ZW1wQXJyID0gW2VsZS5zY2hlbWFzXVxyXG4gICAgICAgICAgICB0ZW1wQXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRTY2hlbWFbZWxlW1wiQGlkXCJdXSA9IGVsZVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRBcnIgPSBlbGUuY29udGVudHNcclxuICAgICAgICBpZiAoIWNvbnRlbnRBcnIpIGNvbnRpbnVlO1xyXG4gICAgICAgIGNvbnRlbnRBcnIuZm9yRWFjaCgob25lQ29udGVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAob25lQ29udGVudFtcIkB0eXBlXCJdID09IFwiUmVsYXRpb25zaGlwXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmKCF0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXSkgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV09IHt9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXVttb2RlbElEXSA9IG9uZUNvbnRlbnRcclxuICAgICAgICAgICAgICAgIG9uZUNvbnRlbnQuZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzID0ge31cclxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9uZUNvbnRlbnQucHJvcGVydGllcykpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhvbmVDb250ZW50LmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcywgb25lQ29udGVudC5wcm9wZXJ0aWVzLCBlbWJlZGRlZFNjaGVtYSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9hbmFseXplIGVhY2ggbW9kZWwncyBwcm9wZXJ0eSB0aGF0IGNhbiBiZSBlZGl0ZWRcclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpeyAvL2V4cGFuZCBwb3NzaWJsZSBlbWJlZGRlZCBzY2hlbWEgdG8gZWRpdGFibGVQcm9wZXJ0aWVzLCBhbHNvIGV4dHJhY3QgcG9zc2libGUgcmVsYXRpb25zaGlwIHR5cGVzIGZvciB0aGlzIG1vZGVsXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgZW1iZWRkZWRTY2hlbWE9e31cclxuICAgICAgICBpZihlbGUuc2NoZW1hcyl7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQXJyO1xyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5zY2hlbWFzKSkgdGVtcEFycj1lbGUuc2NoZW1hc1xyXG4gICAgICAgICAgICBlbHNlIHRlbXBBcnI9W2VsZS5zY2hlbWFzXVxyXG4gICAgICAgICAgICB0ZW1wQXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICAgICAgICAgIGVtYmVkZGVkU2NoZW1hW2VsZVtcIkBpZFwiXV09ZWxlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsZS5lZGl0YWJsZVByb3BlcnRpZXM9e31cclxuICAgICAgICBlbGUudmFsaWRSZWxhdGlvbnNoaXBzPXt9XHJcbiAgICAgICAgZWxlLmluY2x1ZGVkQ29tcG9uZW50cz1bXVxyXG4gICAgICAgIGVsZS5hbGxCYXNlQ2xhc3Nlcz17fVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLmNvbnRlbnRzKSl7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXMsZWxlLmNvbnRlbnRzLGVtYmVkZGVkU2NoZW1hKVxyXG5cclxuICAgICAgICAgICAgZWxlLmNvbnRlbnRzLmZvckVhY2goKG9uZUNvbnRlbnQpPT57XHJcbiAgICAgICAgICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUmVsYXRpb25zaGlwXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGUudmFsaWRSZWxhdGlvbnNoaXBzW29uZUNvbnRlbnRbXCJuYW1lXCJdXT10aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXVttb2RlbElEXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsvL2V4cGFuZCBjb21wb25lbnQgcHJvcGVydGllc1xyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuY29udGVudHMpKXtcclxuICAgICAgICAgICAgZWxlLmNvbnRlbnRzLmZvckVhY2gob25lQ29udGVudD0+e1xyXG4gICAgICAgICAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIkNvbXBvbmVudFwiKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50TmFtZT1vbmVDb250ZW50W1wibmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnRDbGFzcz1vbmVDb250ZW50W1wic2NoZW1hXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLmVkaXRhYmxlUHJvcGVydGllc1tjb21wb25lbnROYW1lXT17fVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzW2NvbXBvbmVudE5hbWVdLGNvbXBvbmVudENsYXNzKVxyXG4gICAgICAgICAgICAgICAgICAgIGVsZS5pbmNsdWRlZENvbXBvbmVudHMucHVzaChjb21wb25lbnROYW1lKVxyXG4gICAgICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7Ly9leHBhbmQgYmFzZSBjbGFzcyBwcm9wZXJ0aWVzIHRvIGVkaXRhYmxlUHJvcGVydGllcyBhbmQgdmFsaWQgcmVsYXRpb25zaGlwIHR5cGVzIHRvIHZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGJhc2VDbGFzc0lEcz1lbGUuZXh0ZW5kcztcclxuICAgICAgICBpZihiYXNlQ2xhc3NJRHM9PW51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1iYXNlQ2xhc3NJRHNcclxuICAgICAgICBlbHNlIHRtcEFycj1bYmFzZUNsYXNzSURzXVxyXG4gICAgICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSk9PntcclxuICAgICAgICAgICAgdGhpcy5yZWNvcmRBbGxCYXNlQ2xhc3NlcyhlbGUuYWxsQmFzZUNsYXNzZXMsZWFjaEJhc2UpXHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzLGVhY2hCYXNlKVxyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzKGVsZS52YWxpZFJlbGF0aW9uc2hpcHMsZWFjaEJhc2UpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMuRFRETE1vZGVscylcclxuICAgIC8vY29uc29sZS5sb2codGhpcy5yZWxhdGlvbnNoaXBUeXBlcylcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsQW5hbHl6ZXIoKTsiLCJjb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5cclxuZnVuY3Rpb24gbW9kZWxFZGl0b3JEaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4Ojk5XCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo2NjVweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPkRpZ2l0YWwgVHdpbiBNb2RlbCBFZGl0b3I8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIGJ1dHRvblJvdz0kKCc8ZGl2ICBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXJcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChidXR0b25Sb3cpXHJcbiAgICB2YXIgaW1wb3J0QnV0dG9uID0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW4gdzMtcmlnaHRcIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+SW1wb3J0PC9idXR0b24+JylcclxuICAgIGJ1dHRvblJvdy5hcHBlbmQoaW1wb3J0QnV0dG9uKVxyXG5cclxuICAgIGltcG9ydEJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB2YXIgbW9kZWxUb0JlSW1wb3J0ZWQgPSBbdGhpcy5kdGRsb2JqXVxyXG4gICAgICAgICQucG9zdChcImVkaXRBRFQvaW1wb3J0TW9kZWxzXCIsIHsgXCJtb2RlbHNcIjogSlNPTi5zdHJpbmdpZnkobW9kZWxUb0JlSW1wb3J0ZWQpIH0sIChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhID09IFwiXCIpIHsvL3N1Y2Nlc3NmdWxcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiTW9kZWwgXCIrIHRoaXMuZHRkbG9ialtcImRpc3BsYXlOYW1lXCJdK1wiIGlzIGNyZWF0ZWQhXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbEVkaXRlZFwifSlcclxuICAgICAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuYWRkTW9kZWxzKG1vZGVsVG9CZUltcG9ydGVkKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cCgpIC8vcmVmcmVzaCBjb250ZW50XHJcbiAgICAgICAgICAgIH0gZWxzZSB7IC8vZXJyb3IgaGFwcGVuc1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoZGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgbGFibGU9JCgnPGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmctcmlnaHQ6NXB4O2ZvbnQtc2l6ZToxLjJlbTtcIj5Nb2RlbCBUZW1wbGF0ZTwvZGl2PicpXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKGxhYmxlKVxyXG4gICAgdmFyIG1vZGVsVGVtcGxhdGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiMS4yZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI1cHggMTBweFwifSxcIm9wdGlvbkxpc3RIZWlnaHRcIjozMDB9KVxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChtb2RlbFRlbXBsYXRlU2VsZWN0b3IuRE9NKVxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgdGhpcy5jaG9vc2VUZW1wbGF0ZShvcHRpb25WYWx1ZSlcclxuICAgIH1cclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5hZGRPcHRpb24oXCJOZXcgTW9kZWwuLi5cIixcIk5ld1wiKVxyXG4gICAgZm9yKHZhciBtb2RlbE5hbWUgaW4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzKXtcclxuICAgICAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuYWRkT3B0aW9uKG1vZGVsTmFtZSlcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcGFuZWxIZWlnaHQ9XCI0NTBweFwiXHJcbiAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIiBzdHlsZT1cIm1hcmdpbjoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwYWRkaW5nOjVweDt3aWR0aDozMzBweDtwYWRkaW5nLXJpZ2h0OjVweDtoZWlnaHQ6JytwYW5lbEhlaWdodCsnO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQobGVmdFNwYW4pXHJcbiAgICB0aGlzLmxlZnRTcGFuPWxlZnRTcGFuXHJcblxyXG4gICAgdmFyIHJpZ2h0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHZhciBkdGRsU2NyaXB0UGFuZWw9JCgnPGRpdiBjbGFzcz1cInczLWNhcmQtMiB3My13aGl0ZVwiIHN0eWxlPVwib3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweDt3aWR0aDozMTBweDtoZWlnaHQ6JytwYW5lbEhlaWdodCsnXCI+PC9kaXY+JylcclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQoZHRkbFNjcmlwdFBhbmVsKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWw9ZHRkbFNjcmlwdFBhbmVsXHJcblxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUuY2hvb3NlVGVtcGxhdGU9ZnVuY3Rpb24odGVtcGFsdGVOYW1lKXtcclxuICAgIGlmKHRlbXBhbHRlTmFtZSE9XCJOZXdcIil7XHJcbiAgICAgICAgdGhpcy5kdGRsb2JqPUpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW3RlbXBhbHRlTmFtZV1bXCJvcmlnaW5hbFwiXSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuZHRkbG9iaiA9IHtcclxuICAgICAgICAgICAgXCJAaWRcIjogXCJkdG1pOmFOYW1lU3BhY2U6YU1vZGVsSUQ7MVwiLFxyXG4gICAgICAgICAgICBcIkBjb250ZXh0XCI6IFtcImR0bWk6ZHRkbDpjb250ZXh0OzJcIl0sXHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJJbnRlcmZhY2VcIixcclxuICAgICAgICAgICAgXCJkaXNwbGF5TmFtZVwiOiBcIk5ldyBNb2RlbFwiLFxyXG4gICAgICAgICAgICBcImNvbnRlbnRzXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcIkB0eXBlXCI6IFwiUHJvcGVydHlcIixcclxuICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJhdHRyaWJ1dGUxXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgICAgICAgICAgfSx7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlJlbGF0aW9uc2hpcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcImxpbmtcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5lbXB0eSgpXHJcblxyXG4gICAgdGhpcy5yZWZyZXNoRFRETCgpXHJcbiAgICB0aGlzLmxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPk1vZGVsIElEICYgTmFtZTxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O2ZvbnQtd2VpZ2h0Om5vcm1hbDt0b3A6LTEwcHg7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5tb2RlbCBJRCBjb250YWlucyBuYW1lc3BhY2UsIGEgbW9kZWwgc3RyaW5nIGFuZCBhIHZlcnNpb24gbnVtYmVyPC9wPjwvZGl2PjwvZGl2PicpKVxyXG4gICAgbmV3IGlkUm93KHRoaXMuZHRkbG9iaix0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuICAgIG5ldyBkaXNwbGF5TmFtZVJvdyh0aGlzLmR0ZGxvYmosdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcblxyXG4gICAgaWYoIXRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdKXRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdPVtdXHJcbiAgICBuZXcgcGFyYW1ldGVyc1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSx0aGlzLkRPTS5vZmZzZXQoKSlcclxuICAgIG5ldyByZWxhdGlvbnNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0sdGhpcy5ET00ub2Zmc2V0KCkpXHJcbiAgICBuZXcgY29tcG9uZW50c1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuXHJcbiAgICBpZighdGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXSl0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdPVtdXHJcbiAgICBuZXcgYmFzZUNsYXNzZXNSb3codGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLnJlZnJlc2hEVERMPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5lbXB0eSgpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDoyMHB4O3dpZHRoOjEwMHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtZ3JheVwiPkdlbmVyYXRlZCBEVERMPC9kaXY+JykpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPHByZSBzdHlsZT1cImNvbG9yOmdyYXlcIj4nK0pTT04uc3RyaW5naWZ5KHRoaXMuZHRkbG9iaixudWxsLDIpKyc8L3ByZT4nKSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxFZGl0b3JEaWFsb2coKTtcclxuXHJcblxyXG5mdW5jdGlvbiBiYXNlQ2xhc3Nlc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtICB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5CYXNlIENsYXNzZXM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+QmFzZSBjbGFzcyBtb2RlbFxcJ3MgcGFyYW1ldGVycyBhbmQgcmVsYXRpb25zaGlwIHR5cGUgYXJlIGluaGVyaXRlZDwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0gXCJ1bmtub3duXCJcclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVCYXNlY2xhc3NSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgbmV3IHNpbmdsZUJhc2VjbGFzc1JvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQmFzZWNsYXNzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGJhc2VDbGFzc05hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoyMjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImJhc2UgbW9kZWwgaWRcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgRE9NLmFwcGVuZChiYXNlQ2xhc3NOYW1lSW5wdXQscmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICBiYXNlQ2xhc3NOYW1lSW5wdXQudmFsKGR0ZGxPYmopXHJcbiAgICBiYXNlQ2xhc3NOYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqW2ldPWJhc2VDbGFzc05hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbXBvbmVudHNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSAgdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+Q29tcG9uZW50czxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5Db21wb25lbnQgbW9kZWxcXCdzIHBhcmFtZXRlcnMgYXJlIGVtYmVkZGVkIHVuZGVyIGEgbmFtZTwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkNvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJTb21lQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6XCJkdG1pOnNvbWVDb21wb25lbnRNb2RlbDsxXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQ29tcG9uZW50Um93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJDb21wb25lbnRcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZUNvbXBvbmVudFJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQ29tcG9uZW50Um93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGNvbXBvbmVudE5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImNvbXBvbmVudCBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHNjaGVtYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiY29tcG9uZW50IG1vZGVsIGlkLi4uXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoY29tcG9uZW50TmFtZUlucHV0LHNjaGVtYUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICBzY2hlbWFJbnB1dC52YWwoZHRkbE9ialtcInNjaGVtYVwiXXx8XCJcIilcclxuXHJcbiAgICBjb21wb25lbnROYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPWNvbXBvbmVudE5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgc2NoZW1hSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl09c2NoZW1hSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsYXRpb25zUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlJlbGF0aW9uc2hpcCBUeXBlczxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5SZWxhdGlvbnNoaXAgY2FuIGhhdmUgaXRzIG93biBwYXJhbWV0ZXJzPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlJlbGF0aW9uc2hpcFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJyZWxhdGlvbjFcIixcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIlJlbGF0aW9uc2hpcFwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixkaWFsb2dPZmZzZXQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlUmVsYXRpb25UeXBlUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciByZWxhdGlvbk5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo5MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwicmVsYXRpb24gbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB0YXJnZXRNb2RlbElEPSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE0MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiKG9wdGlvbmFsKXRhcmdldCBtb2RlbFwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLWNvZyBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQocmVsYXRpb25OYW1lSW5wdXQsdGFyZ2V0TW9kZWxJRCxhZGRCdXR0b24scmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIERPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHRhcmdldE1vZGVsSUQudmFsKGR0ZGxPYmpbXCJ0YXJnZXRcIl18fFwiXCIpXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInByb3BlcnRpZXNcIl0pIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdPVtdXHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1yZWxhdGlvbk5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgdGFyZ2V0TW9kZWxJRC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgaWYodGFyZ2V0TW9kZWxJRC52YWwoKT09XCJcIikgZGVsZXRlIGR0ZGxPYmpbXCJ0YXJnZXRcIl1cclxuICAgICAgICBlbHNlIGR0ZGxPYmpbXCJ0YXJnZXRcIl09dGFyZ2V0TW9kZWxJRC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgaWYoZHRkbE9ialtcInByb3BlcnRpZXNcIl0gJiYgZHRkbE9ialtcInByb3BlcnRpZXNcIl0ubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzPWR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdXHJcbiAgICAgICAgcHJvcGVydGllcy5mb3JFYWNoKG9uZVByb3BlcnR5PT57XHJcbiAgICAgICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cob25lUHJvcGVydHksY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInByb3BlcnRpZXNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyYW1ldGVyc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+UGFyYW1ldGVyczwvZGl2PjwvZGl2PicpXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlByb3BlcnR5XCIsXHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosXCJ0b3BMZXZlbFwiLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIlByb3BlcnR5XCIpIHJldHVyblxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLFwidG9wTGV2ZWxcIixkaWFsb2dPZmZzZXQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlUGFyYW1ldGVyUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqLHRvcExldmVsLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBwYXJhbWV0ZXJOYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTAwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJwYXJhbWV0ZXIgbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBlbnVtVmFsdWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInN0cjEsc3RyMiwuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS1wbHVzIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHB0eXBlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxmb250U2l6ZTpcIjFlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5IHczLWJhci1pdGVtXCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjRweCA1cHhcIn0sXCJvcHRpb25MaXN0SGVpZ2h0XCI6MzAwLFwiaXNDbGlja2FibGVcIjoxXHJcbiAgICAsXCJvcHRpb25MaXN0TWFyZ2luVG9wXCI6LTE1MCxcIm9wdGlvbkxpc3RNYXJnaW5MZWZ0XCI6NjAsXCJhZGp1c3RQb3NpdGlvbkFuY2hvclwiOmRpYWxvZ09mZnNldH0pXHJcbiAgICBcclxuXHJcbiAgICBwdHlwZVNlbGVjdG9yLmFkZE9wdGlvbkFycihbXCJFbnVtXCIsXCJPYmplY3RcIixcImJvb2xlYW5cIixcImRhdGVcIixcImRhdGVUaW1lXCIsXCJkb3VibGVcIixcImR1cmF0aW9uXCIsXCJmbG9hdFwiLFwiaW50ZWdlclwiLFwibG9uZ1wiLFwic3RyaW5nXCIsXCJ0aW1lXCJdKVxyXG4gICAgRE9NLmFwcGVuZChwYXJhbWV0ZXJOYW1lSW5wdXQscHR5cGVTZWxlY3Rvci5ET00sZW51bVZhbHVlSW5wdXQsYWRkQnV0dG9uLHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgRE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHB0eXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spPT57XHJcbiAgICAgICAgcHR5cGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgY29udGVudERPTS5lbXB0eSgpLy9jbGVhciBhbGwgY29udGVudCBkb20gY29udGVudFxyXG4gICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKXtcclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gZHRkbE9iaikgZGVsZXRlIGR0ZGxPYmpbaW5kXSAgICAvL2NsZWFyIGFsbCBvYmplY3QgY29udGVudFxyXG4gICAgICAgICAgICBpZih0b3BMZXZlbCkgZHRkbE9ialtcIkB0eXBlXCJdPVwiUHJvcGVydHlcIlxyXG4gICAgICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICB9IFxyXG4gICAgICAgIGlmKG9wdGlvblRleHQ9PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQudmFsKFwiXCIpXHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnNob3coKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIkVudW1cIixcInZhbHVlU2NoZW1hXCI6IFwic3RyaW5nXCJ9XHJcbiAgICAgICAgfWVsc2UgaWYob3B0aW9uVGV4dD09XCJPYmplY3RcIil7XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLnNob3coKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIk9iamVjdFwifVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT1vcHRpb25UZXh0XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSkgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXT1bXVxyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGVudW1WYWx1ZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICB2YXIgdmFsdWVBcnI9ZW51bVZhbHVlSW5wdXQudmFsKCkuc3BsaXQoXCIsXCIpXHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl09W11cclxuICAgICAgICB2YWx1ZUFyci5mb3JFYWNoKGFWYWw9PntcclxuICAgICAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl0ucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogYVZhbCxcclxuICAgICAgICAgICAgICAgIFwiZW51bVZhbHVlXCI6IGFWYWxcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBpZih0eXBlb2YoZHRkbE9ialtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcpIHZhciBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVxyXG4gICAgZWxzZSBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVtcIkB0eXBlXCJdXHJcbiAgICBwdHlwZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShzY2hlbWEpXHJcbiAgICBpZihzY2hlbWE9PVwiRW51bVwiKXtcclxuICAgICAgICB2YXIgZW51bUFycj1kdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXVxyXG4gICAgICAgIGlmKGVudW1BcnIhPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgaW5wdXRTdHI9XCJcIlxyXG4gICAgICAgICAgICBlbnVtQXJyLmZvckVhY2gob25lRW51bVZhbHVlPT57aW5wdXRTdHIrPW9uZUVudW1WYWx1ZS5lbnVtVmFsdWUrXCIsXCJ9KVxyXG4gICAgICAgICAgICBpbnB1dFN0cj1pbnB1dFN0ci5zbGljZSgwLCAtMSkvL3JlbW92ZSB0aGUgbGFzdCBcIixcIlxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC52YWwoaW5wdXRTdHIpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYoc2NoZW1hPT1cIk9iamVjdFwiKXtcclxuICAgICAgICB2YXIgZmllbGRzPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl1cclxuICAgICAgICBmaWVsZHMuZm9yRWFjaChvbmVGaWVsZD0+e1xyXG4gICAgICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG9uZUZpZWxkLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGlkUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBsYWJlbDE9JCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+ZHRtaTo8L2Rpdj4nKVxyXG4gICAgdmFyIGRvbWFpbklucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjgwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJOYW1lc3BhY2VcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgbW9kZWxJRElucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE0MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTW9kZWxJRFwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB2ZXJzaW9uSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6NjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInZlcnNpb25cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICBET00uYXBwZW5kKGxhYmVsMSxkb21haW5JbnB1dCwkKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj46PC9kaXY+JyksbW9kZWxJRElucHV0LCQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPjs8L2Rpdj4nKSx2ZXJzaW9uSW5wdXQpXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICB2YXIgc3RyPWBkdG1pOiR7ZG9tYWluSW5wdXQudmFsKCl9OiR7bW9kZWxJRElucHV0LnZhbCgpfTske3ZlcnNpb25JbnB1dC52YWwoKX1gXHJcbiAgICAgICAgZHRkbE9ialtcIkBpZFwiXT1zdHJcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgZG9tYWluSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIG1vZGVsSURJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmVyc2lvbklucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcblxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiQGlkXCJdXHJcbiAgICBpZihzdHIhPVwiXCIgJiYgc3RyIT1udWxsKXtcclxuICAgICAgICB2YXIgYXJyMT1zdHIuc3BsaXQoXCI7XCIpXHJcbiAgICAgICAgaWYoYXJyMS5sZW5ndGghPTIpIHJldHVybjtcclxuICAgICAgICB2ZXJzaW9uSW5wdXQudmFsKGFycjFbMV0pXHJcbiAgICAgICAgdmFyIGFycjI9YXJyMVswXS5zcGxpdChcIjpcIilcclxuICAgICAgICBkb21haW5JbnB1dC52YWwoYXJyMlsxXSlcclxuICAgICAgICBhcnIyLnNoaWZ0KCk7IGFycjIuc2hpZnQoKVxyXG4gICAgICAgIG1vZGVsSURJbnB1dC52YWwoYXJyMi5qb2luKFwiOlwiKSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGlzcGxheU5hbWVSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGxhYmVsMT0kKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj5EaXNwbGF5IE5hbWU6PC9kaXY+JylcclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTUwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJNb2RlbElEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgRE9NLmFwcGVuZChsYWJlbDEsbmFtZUlucHV0KVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICBkdGRsT2JqW1wiZGlzcGxheU5hbWVcIl09bmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIG5hbWVJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiZGlzcGxheU5hbWVcIl1cclxuICAgIGlmKHN0ciE9XCJcIiAmJiBzdHIhPW51bGwpIG5hbWVJbnB1dC52YWwoc3RyKVxyXG59IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IHNpbXBsZVRyZWU9IHJlcXVpcmUoXCIuL3NpbXBsZVRyZWVcIilcclxuY29uc3QgbW9kZWxFZGl0b3JEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbEVkaXRvckRpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBtb2RlbE1hbmFnZXJEaWFsb2coKSB7XHJcbiAgICB0aGlzLm1vZGVscz17fVxyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnByZXBhcmF0aW9uRnVuYyA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLmdldChcInZpc3VhbERlZmluaXRpb24vcmVhZFZpc3VhbERlZmluaXRpb25cIiwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YSE9XCJcIiAmJiB0eXBlb2YoZGF0YSk9PT1cIm9iamVjdFwiKSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uPWRhdGE7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY1MHB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgaW1wb3J0TW9kZWxzQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkltcG9ydDwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0TW9kZWxzQnRuID0kKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwibW9kZWxGaWxlc1wiIG11bHRpcGxlPVwibXVsdGlwbGVcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHZhciBtb2RlbEVkaXRvckJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5DcmVhdGUgTW9kZWw8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGV4cG9ydE1vZGVsQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkRvd25sb2FkIE1vZGVsczwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChpbXBvcnRNb2RlbHNCdG4sYWN0dWFsSW1wb3J0TW9kZWxzQnRuLCBtb2RlbEVkaXRvckJ0bixleHBvcnRNb2RlbEJ0bilcclxuICAgIGltcG9ydE1vZGVsc0J0bi5vbihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICB9KTtcclxuICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCk9PntcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICBhd2FpdCB0aGlzLnJlYWRNb2RlbEZpbGVzQ29udGVudEFuZEltcG9ydChmaWxlcylcclxuICAgICAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4udmFsKFwiXCIpXHJcbiAgICB9KVxyXG4gICAgbW9kZWxFZGl0b3JCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICAgICAgbW9kZWxFZGl0b3JEaWFsb2cucG9wdXAoKVxyXG4gICAgfSlcclxuXHJcbiAgICBleHBvcnRNb2RlbEJ0bi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB2YXIgbW9kZWxBcnI9W11cclxuICAgICAgICBmb3IodmFyIG1vZGVsTmFtZSBpbiB0aGlzLm1vZGVscykgbW9kZWxBcnIucHVzaCh0aGlzLm1vZGVsc1ttb2RlbE5hbWVdKVxyXG4gICAgICAgIHZhciBwb20gPSAkKFwiPGE+PC9hPlwiKVxyXG4gICAgICAgIHBvbS5hdHRyKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkobW9kZWxBcnIpKSk7XHJcbiAgICAgICAgcG9tLmF0dHIoJ2Rvd25sb2FkJywgXCJleHBvcnRNb2RlbHMuanNvblwiKTtcclxuICAgICAgICBwb21bMF0uY2xpY2soKVxyXG4gICAgfSlcclxuXHJcblxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNlbGxcIiBzdHlsZT1cIndpZHRoOjI0MHB4O3BhZGRpbmctcmlnaHQ6NXB4XCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MzBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiXCI+TW9kZWxzPC9kaXY+PC9kaXY+JykpXHJcbiAgICBcclxuICAgIHZhciBtb2RlbExpc3QgPSAkKCc8dWwgY2xhc3M9XCJ3My11bCB3My1ob3ZlcmFibGVcIj4nKVxyXG4gICAgbW9kZWxMaXN0LmNzcyh7XCJvdmVyZmxvdy14XCI6XCJoaWRkZW5cIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcImhlaWdodFwiOlwiNDIwcHhcIiwgXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodGdyYXlcIn0pXHJcbiAgICBsZWZ0U3Bhbi5hcHBlbmQobW9kZWxMaXN0KVxyXG4gICAgdGhpcy5tb2RlbExpc3QgPSBtb2RlbExpc3Q7XHJcbiAgICBcclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKHJpZ2h0U3BhbikgXHJcbiAgICB2YXIgcGFuZWxDYXJkT3V0PSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkLTIgdzMtd2hpdGVcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4XCI+PC9kaXY+JylcclxuXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cImhlaWdodDozNXB4XCI+PC9kaXY+JylcclxuICAgIHBhbmVsQ2FyZE91dC5hcHBlbmQodGhpcy5tb2RlbEJ1dHRvbkJhcilcclxuXHJcbiAgICByaWdodFNwYW4uYXBwZW5kKHBhbmVsQ2FyZE91dClcclxuICAgIHZhciBwYW5lbENhcmQ9JCgnPGRpdiBzdHlsZT1cIndpZHRoOjQwMHB4O2hlaWdodDo0MDVweDtvdmVyZmxvdzphdXRvO21hcmdpbi10b3A6MnB4XCI+PC9kaXY+JylcclxuICAgIHBhbmVsQ2FyZE91dC5hcHBlbmQocGFuZWxDYXJkKVxyXG4gICAgdGhpcy5wYW5lbENhcmQ9cGFuZWxDYXJkO1xyXG5cclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuZW1wdHkoKVxyXG4gICAgcGFuZWxDYXJkLmh0bWwoXCI8YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctbGVmdDo1cHgnPkNob29zZSBhIG1vZGVsIHRvIHZpZXcgaW5mb21yYXRpb248L2E+XCIpXHJcblxyXG4gICAgdGhpcy5saXN0TW9kZWxzKClcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZXNpemVJbWdGaWxlID0gYXN5bmMgZnVuY3Rpb24odGhlRmlsZSxtYXhfc2l6ZSkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgdmFyIHRtcEltZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG1wSW1nLm9ubG9hZCA9ICAoKT0+IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgICAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSB0bXBJbWcud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gdG1wSW1nLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPiBoZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoID4gbWF4X3NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCAqPSBtYXhfc2l6ZSAvIHdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBtYXhfc2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPiBtYXhfc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggKj0gbWF4X3NpemUgLyBoZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBtYXhfc2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLmRyYXdJbWFnZSh0bXBJbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhVXJsID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhVXJsKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdG1wSW1nLnNyYyA9IHJlYWRlci5yZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwodGhlRmlsZSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxSaWdodFNwYW49YXN5bmMgZnVuY3Rpb24obW9kZWxOYW1lKXtcclxuICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuZW1wdHkoKVxyXG4gICAgdmFyIG1vZGVsSUQ9dGhpcy5tb2RlbHNbbW9kZWxOYW1lXVsnQGlkJ11cclxuXHJcbiAgICB2YXIgZGVsQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIm1hcmdpbi1ib3R0b206MnB4XCIgY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1waW5rIHczLWJvcmRlci1yaWdodFwiPkRlbGV0ZSBNb2RlbDwvYnV0dG9uPicpXHJcbiAgICB2YXIgaW1wb3J0UGljQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLWFtYmVyIHczLWJvcmRlci1yaWdodFwiPlVwbG9hZCBBdmFydGE8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFjdHVhbEltcG9ydFBpY0J0biA9JCgnPGlucHV0IHR5cGU9XCJmaWxlXCIgbmFtZT1cImltZ1wiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgdmFyIGNsZWFyQXZhcnRhQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+Q2xlYXIgQXZhcnRhPC9idXR0b24+JylcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuYXBwZW5kKGRlbEJ0bixpbXBvcnRQaWNCdG4sYWN0dWFsSW1wb3J0UGljQnRuLGNsZWFyQXZhcnRhQnRuKVxyXG5cclxuICAgIGltcG9ydFBpY0J0bi5vbihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBhY3R1YWxJbXBvcnRQaWNCdG4uY2hhbmdlKGFzeW5jIChldnQpPT57XHJcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XHJcbiAgICAgICAgdmFyIHRoZUZpbGU9ZmlsZXNbMF1cclxuICAgICAgICBcclxuICAgICAgICBpZih0aGVGaWxlLnR5cGU9PVwiaW1hZ2Uvc3ZnK3htbFwiKXtcclxuICAgICAgICAgICAgdmFyIHN0cj0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZSh0aGVGaWxlKVxyXG4gICAgICAgICAgICB2YXIgZGF0YVVybD0nZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsJyArIGVuY29kZVVSSUNvbXBvbmVudChzdHIpO1xyXG4gICAgICAgIH1lbHNlIGlmKHRoZUZpbGUudHlwZS5tYXRjaCgnaW1hZ2UuKicpKXtcclxuICAgICAgICAgICAgdmFyIGRhdGFVcmw9IGF3YWl0IHRoaXMucmVzaXplSW1nRmlsZSh0aGVGaWxlLDcwKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KHsgd2lkdGg6IFwiMjAwcHhcIiB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIk5vdGVcIlxyXG4gICAgICAgICAgICAgICAgICAgICwgY29udGVudDogXCJQbGVhc2UgaW1wb3J0IGltYWdlIGZpbGUgKHBuZyxqcGcsc3ZnIGFuZCBzbyBvbilcIlxyXG4gICAgICAgICAgICAgICAgICAgICwgYnV0dG9uczogW3tjb2xvckNsYXNzOlwidzMtZ3JheVwiLHRleHQ6XCJPa1wiLFwiY2xpY2tGdW5jXCI6KCk9Pntjb25maXJtRGlhbG9nRGl2LmNsb3NlKCl9fV1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGlzLmF2YXJ0YUltZykgdGhpcy5hdmFydGFJbWcuYXR0cihcInNyY1wiLGRhdGFVcmwpXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1cclxuICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhPWRhdGFVcmxcclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJhdmFydGFcIjpkYXRhVXJsIH0pXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuXHJcbiAgICBjbGVhckF2YXJ0YUJ0bi5vbihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1cclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdKSBkZWxldGUgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEgXHJcbiAgICAgICAgaWYodGhpcy5hdmFydGFJbWcpIHRoaXMuYXZhcnRhSW1nLnJlbW92ZUF0dHIoJ3NyYycpO1xyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcIm5vQXZhcnRhXCI6dHJ1ZSB9KVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgICAgICB7IHdpZHRoOiBcIjI1MHB4XCIgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiV2FybmluZ1wiXHJcbiAgICAgICAgICAgICAgICAsIGNvbnRlbnQ6IFwiVGhpcyB3aWxsIERFTEVURSBtb2RlbCBcXFwiXCIgKyBtb2RlbElEICsgXCJcXFwiXCJcclxuICAgICAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5wb3N0KFwiZWRpdEFEVC9kZWxldGVNb2RlbFwiLHtcIm1vZGVsXCI6bW9kZWxJRH0sIChkYXRhKT0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihkYXRhPT1cIlwiKXsvL3N1Y2Nlc3NmdWxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5tb2RlbHNbbW9kZWxOYW1lXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyZWUuZGVsZXRlTGVhZk5vZGUobW9kZWxOYW1lKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbHNDaGFuZ2VcIiwgXCJtb2RlbHNcIjp0aGlzLm1vZGVsc30pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0gJiYgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bbW9kZWxJRF0gKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVttb2RlbElEXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ZWxzZXsgLy9lcnJvciBoYXBwZW5zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KGRhdGEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIFxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdmFyIFZpc3VhbGl6YXRpb25ET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiVmlzdWFsaXphdGlvblwiKVxyXG4gICAgdmFyIGVkaXRhYmxlUHJvcGVydGllc0RPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJFZGl0YWJsZSBQcm9wZXJ0aWVzIEFuZCBSZWxhdGlvbnNoaXBzXCIpXHJcbiAgICB2YXIgYmFzZUNsYXNzZXNET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiQmFzZSBDbGFzc2VzXCIpXHJcbiAgICB2YXIgb3JpZ2luYWxEZWZpbml0aW9uRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIk9yaWdpbmFsIERlZmluaXRpb25cIilcclxuXHJcbiAgICB2YXIgc3RyPUpTT04uc3RyaW5naWZ5KHRoaXMubW9kZWxzW21vZGVsTmFtZV0sbnVsbCwyKVxyXG4gICAgb3JpZ2luYWxEZWZpbml0aW9uRE9NLmFwcGVuZCgkKCc8cHJlIGlkPVwianNvblwiPicrc3RyKyc8L3ByZT4nKSlcclxuXHJcbiAgICB2YXIgZWRpdHRhYmxlUHJvcGVydGllcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uZWRpdGFibGVQcm9wZXJ0aWVzXHJcbiAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXMoZWRpdHRhYmxlUHJvcGVydGllcyxlZGl0YWJsZVByb3BlcnRpZXNET00pXHJcbiAgICB2YXIgdmFsaWRSZWxhdGlvbnNoaXBzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS52YWxpZFJlbGF0aW9uc2hpcHNcclxuICAgIHRoaXMuZmlsbFJlbGF0aW9uc2hpcEluZm8odmFsaWRSZWxhdGlvbnNoaXBzLGVkaXRhYmxlUHJvcGVydGllc0RPTSlcclxuXHJcbiAgICB0aGlzLmZpbGxWaXN1YWxpemF0aW9uKG1vZGVsSUQsVmlzdWFsaXphdGlvbkRPTSlcclxuXHJcbiAgICB0aGlzLmZpbGxCYXNlQ2xhc3Nlcyhtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uYWxsQmFzZUNsYXNzZXMsYmFzZUNsYXNzZXNET00pIFxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxCYXNlQ2xhc3Nlcz1mdW5jdGlvbihiYXNlQ2xhc3NlcyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4gYmFzZUNsYXNzZXMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7cGFkZGluZzouMWVtJz5cIitpbmQrXCI8L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoa2V5RGl2KVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxWaXN1YWxpemF0aW9uPWZ1bmN0aW9uKG1vZGVsSUQscGFyZW50RG9tKXtcclxuICAgIHZhciBtb2RlbEpzb249bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdO1xyXG4gICAgdmFyIGFUYWJsZT0kKFwiPHRhYmxlIHN0eWxlPSd3aWR0aDoxMDAlJz48L3RhYmxlPlwiKVxyXG4gICAgYVRhYmxlLmh0bWwoJzx0cj48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPicpXHJcbiAgICBwYXJlbnREb20uYXBwZW5kKGFUYWJsZSkgXHJcblxyXG4gICAgdmFyIGxlZnRQYXJ0PWFUYWJsZS5maW5kKFwidGQ6Zmlyc3RcIilcclxuICAgIHZhciByaWdodFBhcnQ9YVRhYmxlLmZpbmQoXCJ0ZDpudGgtY2hpbGQoMilcIilcclxuICAgIHJpZ2h0UGFydC5jc3Moe1wid2lkdGhcIjpcIjUwcHhcIixcImhlaWdodFwiOlwiNTBweFwiLFwiYm9yZGVyXCI6XCJzb2xpZCAxcHggbGlnaHRHcmF5XCJ9KVxyXG4gICAgXHJcbiAgICB2YXIgYXZhcnRhSW1nPSQoXCI8aW1nIHN0eWxlPSdoZWlnaHQ6NDVweCc+PC9pbWc+XCIpXHJcbiAgICByaWdodFBhcnQuYXBwZW5kKGF2YXJ0YUltZylcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdXHJcbiAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpIGF2YXJ0YUltZy5hdHRyKCdzcmMnLHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKVxyXG4gICAgdGhpcy5hdmFydGFJbWc9YXZhcnRhSW1nO1xyXG5cclxuICAgIFxyXG4gICAgdGhpcy5hZGRPbmVWaXN1YWxpemF0aW9uUm93KG1vZGVsSUQsbGVmdFBhcnQpXHJcbiAgICBmb3IodmFyIGluZCBpbiBtb2RlbEpzb24udmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICB0aGlzLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3cobW9kZWxJRCxsZWZ0UGFydCxpbmQpXHJcbiAgICB9XHJcbn1cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5hZGRPbmVWaXN1YWxpemF0aW9uUm93PWZ1bmN0aW9uKG1vZGVsSUQscGFyZW50RG9tLHJlbGF0aW5zaGlwTmFtZSl7XHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpIHZhciBuYW1lU3RyPVwi4pevXCIgLy92aXN1YWwgZm9yIG5vZGVcclxuICAgIGVsc2UgbmFtZVN0cj1cIuKfnCBcIityZWxhdGluc2hpcE5hbWVcclxuICAgIHZhciBjb250YWluZXJEaXY9JChcIjxkaXYgc3R5bGU9J3BhZGRpbmctYm90dG9tOjhweCc+PC9kaXY+XCIpXHJcbiAgICBwYXJlbnREb20uYXBwZW5kKGNvbnRhaW5lckRpdilcclxuICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgc3R5bGU9J21hcmdpbi1yaWdodDoxMHB4Jz5cIituYW1lU3RyK1wiPC9sYWJlbD5cIilcclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICB2YXIgZGVmaW5lZENvbG9yPW51bGxcclxuICAgIHZhciBkZWZpbmVkU2hhcGU9bnVsbFxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1cclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCl7XHJcbiAgICAgICAgaWYodmlzdWFsSnNvbiAmJiB2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpIGRlZmluZWRDb2xvcj12aXN1YWxKc29uW21vZGVsSURdLmNvbG9yXHJcbiAgICAgICAgaWYodmlzdWFsSnNvbiAmJiB2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIGRlZmluZWRTaGFwZT12aXN1YWxKc29uW21vZGVsSURdLnNoYXBlXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF1cclxuICAgICAgICAgICAgICYmIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdXHJcbiAgICAgICAgICAgICAgJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSl7XHJcbiAgICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uY29sb3IpIGRlZmluZWRDb2xvcj12aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yXHJcbiAgICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGUpIGRlZmluZWRTaGFwZT12aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb2xvclNlbGVjdG9yPSQoJzxzZWxlY3QgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cIm91dGxpbmU6bm9uZVwiPjwvc2VsZWN0PicpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbG9yU2VsZWN0b3IpXHJcbiAgICB2YXIgY29sb3JBcnI9W1wiQmxhY2tcIixcIkxpZ2h0R3JheVwiLFwiUmVkXCIsXCJHcmVlblwiLFwiQmx1ZVwiLFwiQmlzcXVlXCIsXCJCcm93blwiLFwiQ29yYWxcIixcIkNyaW1zb25cIixcIkRvZGdlckJsdWVcIixcIkdvbGRcIl1cclxuICAgIGNvbG9yQXJyLmZvckVhY2goKG9uZUNvbG9yQ29kZSk9PntcclxuICAgICAgICB2YXIgYW5PcHRpb249JChcIjxvcHRpb24gdmFsdWU9J1wiK29uZUNvbG9yQ29kZStcIic+XCIrb25lQ29sb3JDb2RlK1wi4panPC9vcHRpb24+XCIpXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5hcHBlbmQoYW5PcHRpb24pXHJcbiAgICAgICAgYW5PcHRpb24uY3NzKFwiY29sb3JcIixvbmVDb2xvckNvZGUpXHJcbiAgICB9KVxyXG4gICAgaWYoZGVmaW5lZENvbG9yIT1udWxsKSB7XHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci52YWwoZGVmaW5lZENvbG9yKVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixkZWZpbmVkQ29sb3IpXHJcbiAgICB9XHJcbiAgICBjb2xvclNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBzZWxlY3RDb2xvckNvZGU9ZXZlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIiwgc2VsZWN0Q29sb3JDb2RlKVxyXG4gICAgICAgIGlmICghZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0pXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdID0ge31cclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdXHJcblxyXG4gICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yPXNlbGVjdENvbG9yQ29kZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJjb2xvclwiOnNlbGVjdENvbG9yQ29kZSB9KVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uY29sb3I9c2VsZWN0Q29sb3JDb2RlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJzcmNNb2RlbElEXCI6bW9kZWxJRCxcInJlbGF0aW9uc2hpcE5hbWVcIjpyZWxhdGluc2hpcE5hbWUsXCJjb2xvclwiOnNlbGVjdENvbG9yQ29kZSB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHNoYXBlU2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmVcIj48L3NlbGVjdD4nKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChzaGFwZVNlbGVjdG9yKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nZWxsaXBzZSc+4pevPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdyb3VuZC1yZWN0YW5nbGUnIHN0eWxlPSdmb250LXNpemU6MTIwJSc+4paiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdoZXhhZ29uJyBzdHlsZT0nZm9udC1zaXplOjEzMCUnPuKsoTwvb3B0aW9uPlwiKSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdzb2xpZCc+4oaSPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdkb3R0ZWQnPuKHojwvb3B0aW9uPlwiKSlcclxuICAgIH1cclxuICAgIGlmKGRlZmluZWRTaGFwZSE9bnVsbCkge1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IudmFsKGRlZmluZWRTaGFwZSlcclxuICAgIH1cclxuICAgIHNoYXBlU2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIHNlbGVjdFNoYXBlPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICBpZiAoIWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdKVxyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSA9IHt9XHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVxyXG5cclxuICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5zaGFwZT1zZWxlY3RTaGFwZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJzaGFwZVwiOnNlbGVjdFNoYXBlIH0pXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl09e31cclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZT1zZWxlY3RTaGFwZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwic2hhcGVcIjpzZWxlY3RTaGFwZSB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuc2F2ZVZpc3VhbERlZmluaXRpb249ZnVuY3Rpb24oKXtcclxuICAgICQucG9zdChcInZpc3VhbERlZmluaXRpb24vc2F2ZVZpc3VhbERlZmluaXRpb25cIix7dmlzdWFsRGVmaW5pdGlvbkpzb246Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbn0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJlbGF0aW9uc2hpcEluZm89ZnVuY3Rpb24odmFsaWRSZWxhdGlvbnNoaXBzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuICAgICAgICB2YXIgbGFiZWw9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7YmFja2dyb3VuZC1jb2xvcjp5ZWxsb3dncmVlbjtjb2xvcjp3aGl0ZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4Jz5SZWxhdGlvbnNoaXAgdHlwZTwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChsYWJlbClcclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcywgY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKGpzb25JbmZvLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtJz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjFlbVwiKVxyXG5cclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSl7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChcImVudW1cIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3Moe1wiYmFja2dyb3VuZC1jb2xvclwiOlwiZGFya0dyYXlcIixcImNvbG9yXCI6XCJ3aGl0ZVwiLFwiZm9udFNpemVcIjpcIjlweFwiLFwicGFkZGluZ1wiOicycHgnfSlcclxuICAgICAgICB9ZWxzZSBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXMoanNvbkluZm9baW5kXSxjb250ZW50RE9NKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImJhY2tncm91bmQtY29sb3JcIjpcImRhcmtHcmF5XCIsXCJjb2xvclwiOlwid2hpdGVcIixcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkQVBhcnRJblJpZ2h0U3Bhbj1mdW5jdGlvbihwYXJ0TmFtZSl7XHJcbiAgICB2YXIgaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduXCIgc3R5bGU9XCJmb250LXdlaWdodDpib2xkXCI+PC9idXR0b24+JylcclxuICAgIGhlYWRlckRPTS50ZXh0KHBhcnROYW1lKVxyXG4gICAgdmFyIGxpc3RET009JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1oaWRlIHczLWJvcmRlciB3My1zaG93XCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOndoaXRlXCI+PC9kaXY+JylcclxuICAgIHRoaXMucGFuZWxDYXJkLmFwcGVuZChoZWFkZXJET00sbGlzdERPTSlcclxuXHJcbiAgICBoZWFkZXJET00ub24oXCJjbGlja1wiLChldnQpPT4ge1xyXG4gICAgICAgIGlmKGxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSBsaXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIGVsc2UgbGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuIFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm4gbGlzdERPTTtcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkTW9kZWxGaWxlc0NvbnRlbnRBbmRJbXBvcnQ9YXN5bmMgZnVuY3Rpb24oZmlsZXMpe1xyXG4gICAgLy8gZmlsZXMgaXMgYSBGaWxlTGlzdCBvZiBGaWxlIG9iamVjdHMuIExpc3Qgc29tZSBwcm9wZXJ0aWVzLlxyXG4gICAgdmFyIGZpbGVDb250ZW50QXJyPVtdXHJcbiAgICBmb3IgKHZhciBpID0gMCwgZjsgZiA9IGZpbGVzW2ldOyBpKyspIHtcclxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICBpZiAoZi50eXBlIT1cImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgc3RyPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKGYpXHJcbiAgICAgICAgICAgIHZhciBvYmo9SlNPTi5wYXJzZShzdHIpXHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkob2JqKSkgZmlsZUNvbnRlbnRBcnI9ZmlsZUNvbnRlbnRBcnIuY29uY2F0KG9iailcclxuICAgICAgICAgICAgZWxzZSBmaWxlQ29udGVudEFyci5wdXNoKG9iailcclxuICAgICAgICB9Y2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgYWxlcnQoZXJyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKGZpbGVDb250ZW50QXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgXHJcbiAgICAkLnBvc3QoXCJlZGl0QURUL2ltcG9ydE1vZGVsc1wiLHtcIm1vZGVsc1wiOkpTT04uc3RyaW5naWZ5KGZpbGVDb250ZW50QXJyKX0sIChkYXRhKT0+IHtcclxuICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSB7Ly9zdWNjZXNzZnVsXHJcbiAgICAgICAgICAgIHRoaXMubGlzdE1vZGVscyhcInNob3VsZEJyb2FkQ2FzdFwiKVxyXG4gICAgICAgIH0gZWxzZSB7IC8vZXJyb3IgaGFwcGVuc1xyXG4gICAgICAgICAgICBhbGVydChkYXRhKVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE9uZUZpbGU9IGFzeW5jIGZ1bmN0aW9uKGFGaWxlKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5saXN0TW9kZWxzPWZ1bmN0aW9uKHNob3VsZEJyb2FkY2FzdCl7XHJcbiAgICB0aGlzLm1vZGVsTGlzdC5lbXB0eSgpXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLm1vZGVscykgZGVsZXRlIHRoaXMubW9kZWxzW2luZF1cclxuXHJcbiAgICAkLmdldChcInF1ZXJ5QURUL2xpc3RNb2RlbHNcIiwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W11cclxuICAgICAgICBkYXRhLmZvckVhY2gob25lSXRlbT0+e1xyXG4gICAgICAgICAgICBpZihvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl09PW51bGwpIG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXT1vbmVJdGVtW1wiQGlkXCJdXHJcbiAgICAgICAgICAgIGlmKCQuaXNQbGFpbk9iamVjdChvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl0pKXtcclxuICAgICAgICAgICAgICAgIGlmKG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdKSBvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl09b25lSXRlbVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl1cclxuICAgICAgICAgICAgICAgIGVsc2Ugb25lSXRlbVtcImRpc3BsYXlOYW1lXCJdPUpTT04uc3RyaW5naWZ5KG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZih0aGlzLm1vZGVsc1tvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl1dIT1udWxsKXtcclxuICAgICAgICAgICAgICAgIC8vcmVwZWF0ZWQgbW9kZWwgZGlzcGxheSBuYW1lXHJcbiAgICAgICAgICAgICAgICBvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl09b25lSXRlbVtcIkBpZFwiXVxyXG4gICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgdGhpcy5tb2RlbHNbb25lSXRlbVtcImRpc3BsYXlOYW1lXCJdXSA9IG9uZUl0ZW1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGlmKHNob3VsZEJyb2FkY2FzdCl7XHJcbiAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuY2xlYXJBbGxNb2RlbHMoKTtcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMoZGF0YSlcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hbmFseXplKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGRhdGEubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgdmFyIHplcm9Nb2RlbEl0ZW09JCgnPGxpIHN0eWxlPVwiZm9udC1zaXplOjAuOWVtXCI+emVybyBtb2RlbCByZWNvcmQuIFBsZWFzZSBpbXBvcnQuLi48L2xpPicpXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxMaXN0LmFwcGVuZCh6ZXJvTW9kZWxJdGVtKVxyXG4gICAgICAgICAgICB6ZXJvTW9kZWxJdGVtLmNzcyhcImN1cnNvclwiLFwiZGVmYXVsdFwiKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLnRyZWU9bmV3IHNpbXBsZVRyZWUodGhpcy5tb2RlbExpc3Qse1wibGVhZk5hbWVQcm9wZXJ0eVwiOlwiZGlzcGxheU5hbWVcIixcIm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkXCI6dHJ1ZSxcImhpZGVFbXB0eUdyb3VwXCI6dHJ1ZX0pXHJcblxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2Rlcz0obm9kZXNBcnIsbW91c2VDbGlja0RldGFpbCk9PntcclxuICAgICAgICAgICAgICAgIHZhciB0aGVOb2RlPW5vZGVzQXJyWzBdXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGxSaWdodFNwYW4odGhlTm9kZS5sZWFmSW5mb1tcImRpc3BsYXlOYW1lXCJdKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgZ3JvdXBOYW1lTGlzdD17fVxyXG4gICAgICAgICAgICBmb3IodmFyIG1vZGVsTmFtZSBpbiB0aGlzLm1vZGVscykgIHtcclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbElEPSB0aGlzLm1vZGVsc1ttb2RlbE5hbWVdW1wiQGlkXCJdXHJcbiAgICAgICAgICAgICAgICBncm91cE5hbWVMaXN0W3RoaXMubW9kZWxOYW1lVG9Hcm91cE5hbWUobW9kZWxJRCldPTFcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgbW9kZWxncm91cFNvcnRBcnI9T2JqZWN0LmtleXMoZ3JvdXBOYW1lTGlzdClcclxuICAgICAgICAgICAgbW9kZWxncm91cFNvcnRBcnIuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS50b0xvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi50b0xvd2VyQ2FzZSgpKSB9KTtcclxuICAgICAgICAgICAgbW9kZWxncm91cFNvcnRBcnIuZm9yRWFjaChvbmVHcm91cE5hbWU9PntcclxuICAgICAgICAgICAgICAgIHZhciBnbj10aGlzLnRyZWUuYWRkR3JvdXBOb2RlKHsgZGlzcGxheU5hbWU6IG9uZUdyb3VwTmFtZSB9KVxyXG4gICAgICAgICAgICAgICAgZ24uZXhwYW5kKClcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIGZvcih2YXIgbW9kZWxOYW1lIGluIHRoaXMubW9kZWxzKXtcclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbElEPSB0aGlzLm1vZGVsc1ttb2RlbE5hbWVdW1wiQGlkXCJdXHJcbiAgICAgICAgICAgICAgICB2YXIgZ249dGhpcy5tb2RlbE5hbWVUb0dyb3VwTmFtZShtb2RlbElEKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChnbix0aGlzLm1vZGVsc1ttb2RlbE5hbWVdKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuc29ydEFsbExlYXZlcygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKHNob3VsZEJyb2FkY2FzdCkgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURUTW9kZWxzQ2hhbmdlXCIsIFwibW9kZWxzXCI6dGhpcy5tb2RlbHMgfSlcclxuICAgIH0pXHJcblxyXG5cclxuICAgIFxyXG4gICAgLy92YXIgZzEgPSB0aGlzLnRyZWUuYWRkR3JvdXBOb2RlKHtkaXNwbGF5TmFtZTpcInRlc3RcIn0pXHJcbiAgICAvL3RoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoXCJ0ZXN0XCIse1wiZGlzcGxheU5hbWVcIjpcImhhaGFcIn0sXCJza2lwUmVwZWF0XCIpXHJcbiAgICAvL3JldHVybjtcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5tb2RlbE5hbWVUb0dyb3VwTmFtZT1mdW5jdGlvbihtb2RlbE5hbWUpe1xyXG4gICAgdmFyIG5hbWVQYXJ0cz1tb2RlbE5hbWUuc3BsaXQoXCI6XCIpXHJcbiAgICBpZihuYW1lUGFydHMubGVuZ3RoPj0yKSAgcmV0dXJuIG5hbWVQYXJ0c1sxXVxyXG4gICAgZWxzZSByZXR1cm4gXCJPdGhlcnNcIlxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbEVkaXRlZFwiKSB0aGlzLmxpc3RNb2RlbHMoXCJzaG91bGRCcm9hZGNhc3RcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsTWFuYWdlckRpYWxvZygpOyIsImZ1bmN0aW9uIHNpbXBsZUNvbmZpcm1EaWFsb2coKXtcclxuICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMlwiIGNsYXNzPVwidzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIC8vdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG59XHJcblxyXG5zaW1wbGVDb25maXJtRGlhbG9nLnByb3RvdHlwZS5zaG93PWZ1bmN0aW9uKGNzc09wdGlvbnMsb3RoZXJPcHRpb25zKXtcclxuICAgIHRoaXMuRE9NLmNzcyhjc3NPcHRpb25zKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+JyArIG90aGVyT3B0aW9ucy50aXRsZSArICc8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmNsb3NlKCkgfSlcclxuXHJcbiAgICB2YXIgZGlhbG9nRGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MTBweDttYXJnaW4tYm90dG9tOjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgZGlhbG9nRGl2LnRleHQob3RoZXJPcHRpb25zLmNvbnRlbnQpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoZGlhbG9nRGl2KVxyXG4gICAgdGhpcy5kaWFsb2dEaXY9ZGlhbG9nRGl2XHJcblxyXG4gICAgdGhpcy5ib3R0b21CYXI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5ib3R0b21CYXIpXHJcblxyXG4gICAgb3RoZXJPcHRpb25zLmJ1dHRvbnMuZm9yRWFjaChidG49PntcclxuICAgICAgICB2YXIgYUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXJpZ2h0ICcrKGJ0bi5jb2xvckNsYXNzfHxcIlwiKSsnXCIgc3R5bGU9XCJtYXJnaW4tcmlnaHQ6MnB4O21hcmdpbi1sZWZ0OjJweFwiPicrYnRuLnRleHQrJzwvYnV0dG9uPicpXHJcbiAgICAgICAgYUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PiB7IGJ0bi5jbGlja0Z1bmMoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYm90dG9tQmFyLmFwcGVuZChhQnV0dG9uKSAgICBcclxuICAgIH0pXHJcbiAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbn1cclxuXHJcbnNpbXBsZUNvbmZpcm1EaWFsb2cucHJvdG90eXBlLmNsb3NlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZUNvbmZpcm1EaWFsb2c7IiwiZnVuY3Rpb24gc2ltcGxlU2VsZWN0TWVudShidXR0b25OYW1lLG9wdGlvbnMpe1xyXG4gICAgb3B0aW9ucz1vcHRpb25zfHx7fSAvL3tpc0NsaWNrYWJsZToxLHdpdGhCb3JkZXI6MSxmb250U2l6ZTpcIlwiLGNvbG9yQ2xhc3M6XCJcIixidXR0b25DU1M6XCJcIn1cclxuICAgIGlmKG9wdGlvbnMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgIHRoaXMuaXNDbGlja2FibGU9dHJ1ZVxyXG4gICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jbGlja1wiPjwvZGl2PicpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24taG92ZXIgXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5vbihcIm1vdXNlb3ZlclwiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMuYnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b25cIiBzdHlsZT1cIm91dGxpbmU6IG5vbmU7XCI+PGE+JytidXR0b25OYW1lKyc8L2E+PGEgc3R5bGU9XCJmb250LXdlaWdodDpib2xkO3BhZGRpbmctbGVmdDoycHhcIj48L2E+PGkgY2xhc3M9XCJmYSBmYS1jYXJldC1kb3duXCIgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6M3B4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBpZihvcHRpb25zLndpdGhCb3JkZXIpIHRoaXMuYnV0dG9uLmFkZENsYXNzKFwidzMtYm9yZGVyXCIpXHJcbiAgICBpZihvcHRpb25zLmZvbnRTaXplKSB0aGlzLkRPTS5jc3MoXCJmb250LXNpemVcIixvcHRpb25zLmZvbnRTaXplKVxyXG4gICAgaWYob3B0aW9ucy5jb2xvckNsYXNzKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhvcHRpb25zLmNvbG9yQ2xhc3MpXHJcbiAgICBpZihvcHRpb25zLndpZHRoKSB0aGlzLmJ1dHRvbi5jc3MoXCJ3aWR0aFwiLG9wdGlvbnMud2lkdGgpXHJcbiAgICBpZihvcHRpb25zLmJ1dHRvbkNTUykgdGhpcy5idXR0b24uY3NzKG9wdGlvbnMuYnV0dG9uQ1NTKVxyXG4gICAgaWYob3B0aW9ucy5hZGp1c3RQb3NpdGlvbkFuY2hvcikgdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvcj1vcHRpb25zLmFkanVzdFBvc2l0aW9uQW5jaG9yXHJcblxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jb250ZW50IHczLWJhci1ibG9jayB3My1jYXJkLTRcIj48L2Rpdj4nKVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0KSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtoZWlnaHQ6b3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0K1wicHhcIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcIm92ZXJmbG93LXhcIjpcInZpc2libGVcIn0pXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5Ub3ApIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1wibWFyZ2luLXRvcFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpblRvcCtcInB4XCJ9KVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luTGVmdCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJtYXJnaW4tbGVmdFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpbkxlZnQrXCJweFwifSlcclxuICAgIFxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuYnV0dG9uLHRoaXMub3B0aW9uQ29udGVudERPTSlcclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcblxyXG4gICAgaWYob3B0aW9ucy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgdGhpcy5idXR0b24ub24oXCJjbGlja1wiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbkNvbnRlbnRET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMub3B0aW9uQ29udGVudERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICB9KSAgICBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRqdXN0RHJvcERvd25Qb3NpdGlvbj1mdW5jdGlvbigpe1xyXG4gICAgaWYoIXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IpIHJldHVybjtcclxuICAgIHZhciBvZmZzZXQ9dGhpcy5ET00ub2Zmc2V0KClcclxuICAgIHZhciBuZXdUb3A9b2Zmc2V0LnRvcC10aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yLnRvcFxyXG4gICAgdmFyIG5ld0xlZnQ9b2Zmc2V0LmxlZnQtdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvci5sZWZ0XHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcInRvcFwiOm5ld1RvcCtcInB4XCIsXCJsZWZ0XCI6bmV3TGVmdCtcInB4XCJ9KVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5maW5kT3B0aW9uPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciBvcHRpb25zPXRoaXMub3B0aW9uQ29udGVudERPTS5jaGlsZHJlbigpXHJcbiAgICBmb3IodmFyIGk9MDtpPG9wdGlvbnMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQob3B0aW9uc1tpXSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09YW5PcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHtcInRleHRcIjphbk9wdGlvbi50ZXh0KCksXCJ2YWx1ZVwiOmFuT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKX1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkZE9wdGlvbkFycj1mdW5jdGlvbihhcnIpe1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgdGhpcy5hZGRPcHRpb24oZWxlbWVudClcclxuICAgIH0pO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGRPcHRpb249ZnVuY3Rpb24ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSl7XHJcbiAgICB2YXIgb3B0aW9uSXRlbT0kKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCI+JytvcHRpb25UZXh0Kyc8L2E+JylcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5hcHBlbmQob3B0aW9uSXRlbSlcclxuICAgIG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIsb3B0aW9uVmFsdWV8fG9wdGlvblRleHQpXHJcbiAgICBvcHRpb25JdGVtLm9uKCdjbGljaycsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9b3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIilcclxuICAgICAgICBpZih0aGlzLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24tY2xpY2snKVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgLy90aGlzIGlzIHRvIGhpZGUgdGhlIGRyb3AgZG93biBtZW51IGFmdGVyIGNsaWNrXHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoJ3czLWRyb3Bkb3duLWNsaWNrJylcclxuICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihvcHRpb25UZXh0LG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIpLFwicmVhbE1vdXNlQ2xpY2tcIilcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNoYW5nZU5hbWU9ZnVuY3Rpb24obmFtZVN0cjEsbmFtZVN0cjIpe1xyXG4gICAgdGhpcy5idXR0b24uY2hpbGRyZW4oXCI6Zmlyc3RcIikudGV4dChuYW1lU3RyMSlcclxuICAgIHRoaXMuYnV0dG9uLmNoaWxkcmVuKCkuZXEoMSkudGV4dChuYW1lU3RyMilcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvbkluZGV4PWZ1bmN0aW9uKG9wdGlvbkluZGV4KXtcclxuICAgIHZhciB0aGVPcHRpb249dGhpcy5vcHRpb25Db250ZW50RE9NLmNoaWxkcmVuKCkuZXEob3B0aW9uSW5kZXgpXHJcbiAgICBpZih0aGVPcHRpb24ubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG51bGwsbnVsbClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD10aGVPcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHRoZU9wdGlvbi50ZXh0KCksdGhlT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSlcclxufVxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS50cmlnZ2VyT3B0aW9uVmFsdWU9ZnVuY3Rpb24ob3B0aW9uVmFsdWUpe1xyXG4gICAgdmFyIHJlPXRoaXMuZmluZE9wdGlvbihvcHRpb25WYWx1ZSlcclxuICAgIGlmKHJlPT1udWxsKXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsXHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihudWxsLG51bGwpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1yZS52YWx1ZVxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24ocmUudGV4dCxyZS52YWx1ZSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNsZWFyT3B0aW9ucz1mdW5jdGlvbihvcHRpb25UZXh0LG9wdGlvblZhbHVlKXtcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jYWxsQmFja19jbGlja09wdGlvbj1mdW5jdGlvbihvcHRpb250ZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKXtcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlU2VsZWN0TWVudTsiLCIndXNlIHN0cmljdCc7XHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWUoRE9NLG9wdGlvbnMpe1xyXG4gICAgdGhpcy5ET009RE9NXHJcbiAgICB0aGlzLmdyb3VwTm9kZXM9W10gLy9lYWNoIGdyb3VwIGhlYWRlciBpcyBvbmUgbm9kZVxyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzPVtdO1xyXG4gICAgdGhpcy5vcHRpb25zPW9wdGlvbnMgfHwge31cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2Nyb2xsVG9MZWFmTm9kZT1mdW5jdGlvbihhTm9kZSl7XHJcbiAgICB2YXIgc2Nyb2xsVG9wPXRoaXMuRE9NLnNjcm9sbFRvcCgpXHJcbiAgICB2YXIgdHJlZUhlaWdodD10aGlzLkRPTS5oZWlnaHQoKVxyXG4gICAgdmFyIG5vZGVQb3NpdGlvbj1hTm9kZS5ET00ucG9zaXRpb24oKS50b3AgLy93aGljaCBkb2VzIG5vdCBjb25zaWRlciBwYXJlbnQgRE9NJ3Mgc2Nyb2xsIGhlaWdodFxyXG4gICAgLy9jb25zb2xlLmxvZyhzY3JvbGxUb3AsdHJlZUhlaWdodCxub2RlUG9zaXRpb24pXHJcbiAgICBpZih0cmVlSGVpZ2h0LTUwPG5vZGVQb3NpdGlvbil7XHJcbiAgICAgICAgdGhpcy5ET00uc2Nyb2xsVG9wKHNjcm9sbFRvcCArIG5vZGVQb3NpdGlvbi0odHJlZUhlaWdodC01MCkpIFxyXG4gICAgfWVsc2UgaWYobm9kZVBvc2l0aW9uPDUwKXtcclxuICAgICAgICB0aGlzLkRPTS5zY3JvbGxUb3Aoc2Nyb2xsVG9wICsgKG5vZGVQb3NpdGlvbi01MCkpIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5jbGVhckFsbExlYWZOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKT0+e1xyXG4gICAgICAgIGdOb2RlLmxpc3RET00uZW1wdHkoKVxyXG4gICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD0wXHJcbiAgICAgICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZmlyc3RMZWFmTm9kZT1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5ncm91cE5vZGVzLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgZmlyc3RMZWFmTm9kZT1udWxsO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGZpcnN0TGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBpZihhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD4wKSBmaXJzdExlYWZOb2RlPWFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbMF1cclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIGZpcnN0TGVhZk5vZGVcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUubmV4dEdyb3VwTm9kZT1mdW5jdGlvbihhR3JvdXBOb2RlKXtcclxuICAgIGlmKGFHcm91cE5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIHZhciBpbmRleD10aGlzLmdyb3VwTm9kZXMuaW5kZXhPZihhR3JvdXBOb2RlKVxyXG4gICAgaWYodGhpcy5ncm91cE5vZGVzLmxlbmd0aC0xPmluZGV4KXtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncm91cE5vZGVzW2luZGV4KzFdXHJcbiAgICB9ZWxzZXsgLy9yb3RhdGUgYmFja3dhcmQgdG8gZmlyc3QgZ3JvdXAgbm9kZVxyXG4gICAgICAgIHJldHVybiB0aGlzLmdyb3VwTm9kZXNbMF0gXHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLm5leHRMZWFmTm9kZT1mdW5jdGlvbihhTGVhZk5vZGUpe1xyXG4gICAgaWYoYUxlYWZOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgYUdyb3VwTm9kZT1hTGVhZk5vZGUucGFyZW50R3JvdXBOb2RlXHJcbiAgICB2YXIgaW5kZXg9YUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5pbmRleE9mKGFMZWFmTm9kZSlcclxuICAgIGlmKGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoLTE+aW5kZXgpe1xyXG4gICAgICAgIC8vbmV4dCBub2RlIGlzIGluIHNhbWUgZ3JvdXBcclxuICAgICAgICByZXR1cm4gYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1tpbmRleCsxXVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgLy9maW5kIG5leHQgZ3JvdXAgZmlyc3Qgbm9kZVxyXG4gICAgICAgIHdoaWxlKHRydWUpe1xyXG4gICAgICAgICAgICB2YXIgbmV4dEdyb3VwTm9kZSA9IHRoaXMubmV4dEdyb3VwTm9kZShhR3JvdXBOb2RlKVxyXG4gICAgICAgICAgICBpZihuZXh0R3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgICAgICBhR3JvdXBOb2RlPW5leHRHcm91cE5vZGVcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dEdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1swXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWFyY2hUZXh0PWZ1bmN0aW9uKHN0cil7XHJcbiAgICBpZihzdHI9PVwiXCIpIHJldHVybiBudWxsO1xyXG4gICAgLy9zZWFyY2ggZnJvbSBjdXJyZW50IHNlbGVjdCBpdGVtIHRoZSBuZXh0IGxlYWYgaXRlbSBjb250YWlucyB0aGUgdGV4dFxyXG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChzdHIsICdpJyk7XHJcbiAgICB2YXIgc3RhcnROb2RlXHJcbiAgICBpZih0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgc3RhcnROb2RlPXRoaXMuZmlyc3RMZWFmTm9kZSgpXHJcbiAgICAgICAgaWYoc3RhcnROb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHRoZVN0cj1zdGFydE5vZGUubmFtZTtcclxuICAgICAgICBpZih0aGVTdHIubWF0Y2gocmVnZXgpIT1udWxsKXtcclxuICAgICAgICAgICAgLy9maW5kIHRhcmdldCBub2RlIFxyXG4gICAgICAgICAgICByZXR1cm4gc3RhcnROb2RlXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2Ugc3RhcnROb2RlPXRoaXMuc2VsZWN0ZWROb2Rlc1swXVxyXG5cclxuICAgIGlmKHN0YXJ0Tm9kZT09bnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICBcclxuICAgIHZhciBmcm9tTm9kZT1zdGFydE5vZGU7XHJcbiAgICB3aGlsZSh0cnVlKXtcclxuICAgICAgICB2YXIgbmV4dE5vZGU9dGhpcy5uZXh0TGVhZk5vZGUoZnJvbU5vZGUpXHJcbiAgICAgICAgaWYobmV4dE5vZGU9PXN0YXJ0Tm9kZSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgdmFyIG5leHROb2RlU3RyPW5leHROb2RlLm5hbWU7XHJcbiAgICAgICAgaWYobmV4dE5vZGVTdHIubWF0Y2gocmVnZXgpIT1udWxsKXtcclxuICAgICAgICAgICAgLy9maW5kIHRhcmdldCBub2RlXHJcbiAgICAgICAgICAgIHJldHVybiBuZXh0Tm9kZVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBmcm9tTm9kZT1uZXh0Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICB9ICAgIFxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYWRkTGVhZm5vZGVUb0dyb3VwPWZ1bmN0aW9uKGdyb3VwTmFtZSxvYmosc2tpcFJlcGVhdCl7XHJcbiAgICB2YXIgYUdyb3VwTm9kZT10aGlzLmZpbmRHcm91cE5vZGUoZ3JvdXBOYW1lKVxyXG4gICAgaWYoYUdyb3VwTm9kZSA9PSBudWxsKSByZXR1cm47XHJcbiAgICBhR3JvdXBOb2RlLmFkZE5vZGUob2JqLHNraXBSZXBlYXQpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnJlbW92ZUFsbE5vZGVzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMubGVuZ3RoPTA7XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPTA7XHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmZpbmRHcm91cE5vZGU9ZnVuY3Rpb24oZ3JvdXBOYW1lKXtcclxuICAgIHZhciBmb3VuZEdyb3VwTm9kZT1udWxsXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChhR3JvdXBOb2RlPT57XHJcbiAgICAgICAgaWYoYUdyb3VwTm9kZS5uYW1lPT1ncm91cE5hbWUpe1xyXG4gICAgICAgICAgICBmb3VuZEdyb3VwTm9kZT1hR3JvdXBOb2RlXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIGZvdW5kR3JvdXBOb2RlO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kZWxHcm91cE5vZGU9ZnVuY3Rpb24oZ25vZGUpe1xyXG4gICAgZ25vZGUuZGVsZXRlU2VsZigpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmRlbGV0ZUxlYWZOb2RlPWZ1bmN0aW9uKG5vZGVOYW1lKXtcclxuICAgIHZhciBmaW5kTGVhZk5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKT0+e1xyXG4gICAgICAgIGlmKGZpbmRMZWFmTm9kZSE9bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmZvckVhY2goKGFMZWFmKT0+e1xyXG4gICAgICAgICAgICBpZihhTGVhZi5uYW1lPT1ub2RlTmFtZSl7XHJcbiAgICAgICAgICAgICAgICBmaW5kTGVhZk5vZGU9YUxlYWZcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgaWYoZmluZExlYWZOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICBmaW5kTGVhZk5vZGUuZGVsZXRlU2VsZigpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5pbnNlcnRHcm91cE5vZGU9ZnVuY3Rpb24ob2JqLGluZGV4KXtcclxuICAgIHZhciBhTmV3R3JvdXBOb2RlID0gbmV3IHNpbXBsZVRyZWVHcm91cE5vZGUodGhpcyxvYmopXHJcbiAgICB2YXIgZXhpc3RHcm91cE5vZGU9IHRoaXMuZmluZEdyb3VwTm9kZShhTmV3R3JvdXBOb2RlLm5hbWUpXHJcbiAgICBpZihleGlzdEdyb3VwTm9kZSE9bnVsbCkgcmV0dXJuO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLnNwbGljZShpbmRleCwgMCwgYU5ld0dyb3VwTm9kZSk7XHJcblxyXG4gICAgaWYoaW5kZXg9PTApe1xyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5saXN0RE9NKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHByZXZHcm91cE5vZGU9dGhpcy5ncm91cE5vZGVzW2luZGV4LTFdXHJcbiAgICAgICAgYU5ld0dyb3VwTm9kZS5oZWFkZXJET00uaW5zZXJ0QWZ0ZXIocHJldkdyb3VwTm9kZS5saXN0RE9NKVxyXG4gICAgICAgIGFOZXdHcm91cE5vZGUubGlzdERPTS5pbnNlcnRBZnRlcihhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYU5ld0dyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYWRkR3JvdXBOb2RlPWZ1bmN0aW9uKG9iail7XHJcbiAgICB2YXIgYU5ld0dyb3VwTm9kZSA9IG5ldyBzaW1wbGVUcmVlR3JvdXBOb2RlKHRoaXMsb2JqKVxyXG4gICAgdmFyIGV4aXN0R3JvdXBOb2RlPSB0aGlzLmZpbmRHcm91cE5vZGUoYU5ld0dyb3VwTm9kZS5uYW1lKVxyXG4gICAgaWYoZXhpc3RHcm91cE5vZGUhPW51bGwpIHJldHVybiBleGlzdEdyb3VwTm9kZTtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5wdXNoKGFOZXdHcm91cE5vZGUpO1xyXG4gICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUubGlzdERPTSlcclxuICAgIHJldHVybiBhTmV3R3JvdXBOb2RlO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RMZWFmTm9kZT1mdW5jdGlvbihsZWFmTm9kZSxtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIHRoaXMuc2VsZWN0TGVhZk5vZGVBcnIoW2xlYWZOb2RlXSxtb3VzZUNsaWNrRGV0YWlsKVxyXG59XHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFwcGVuZExlYWZOb2RlVG9TZWxlY3Rpb249ZnVuY3Rpb24obGVhZk5vZGUpe1xyXG4gICAgaWYodGhpcy5vcHRpb25zLm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkKXtcclxuICAgICAgICB0aGlzLnNlbGVjdExlYWZOb2RlKGxlYWZOb2RlKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH0gXHJcbiAgICB2YXIgbmV3QXJyPVtdLmNvbmNhdCh0aGlzLnNlbGVjdGVkTm9kZXMpXHJcbiAgICBuZXdBcnIucHVzaChsZWFmTm9kZSlcclxuICAgIHRoaXMuc2VsZWN0TGVhZk5vZGVBcnIobmV3QXJyKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RHcm91cE5vZGU9ZnVuY3Rpb24oZ3JvdXBOb2RlKXtcclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGUpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGUoZ3JvdXBOb2RlLmluZm8pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdExlYWZOb2RlQXJyPWZ1bmN0aW9uKGxlYWZOb2RlQXJyLG1vdXNlQ2xpY2tEZXRhaWwpe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVzW2ldLmRpbSgpXHJcbiAgICB9XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPTA7XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXM9dGhpcy5zZWxlY3RlZE5vZGVzLmNvbmNhdChsZWFmTm9kZUFycilcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2Rlc1tpXS5oaWdobGlnaHQoKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2RlcykgdGhpcy5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzKHRoaXMuc2VsZWN0ZWROb2Rlcyxtb3VzZUNsaWNrRGV0YWlsKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kYmxDbGlja05vZGU9ZnVuY3Rpb24odGhlTm9kZSl7XHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlKSB0aGlzLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlKHRoZU5vZGUpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNvcnRBbGxMZWF2ZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKG9uZUdyb3VwTm9kZT0+e29uZUdyb3VwTm9kZS5zb3J0Tm9kZXNCeU5hbWUoKX0pXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXRyZWUgZ3JvdXAgbm9kZS0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlR3JvdXBOb2RlKHBhcmVudFRyZWUsb2JqKXtcclxuICAgIHRoaXMucGFyZW50VHJlZT1wYXJlbnRUcmVlXHJcbiAgICB0aGlzLmluZm89b2JqXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzPVtdIC8vaXQncyBjaGlsZCBsZWFmIG5vZGVzIGFycmF5XHJcbiAgICB0aGlzLm5hbWU9b2JqLmRpc3BsYXlOYW1lO1xyXG4gICAgdGhpcy5jcmVhdGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5yZWZyZXNoTmFtZT1mdW5jdGlvbigpeyAvL+KsouKWieKaq1xyXG4gICAgdGhpcy5oZWFkZXJET00uZW1wdHkoKVxyXG4gICAgdmFyIG5hbWVEaXY9JChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmctcmlnaHQ6M3B4Jz48L2Rpdj5cIilcclxuICAgIG5hbWVEaXYudGV4dCh0aGlzLm5hbWUpXHJcbiAgICB2YXIgbGJsQ29sb3I9XCJncmF5XCJcclxuICAgIGlmKHRoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPjApIHtcclxuICAgICAgICBsYmxDb2xvcj1cInllbGxvd2dyZWVuXCJcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5jc3MoXCJmb250LXdlaWdodFwiLFwiYm9sZFwiKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5oZWFkZXJET00uY3NzKFwiZm9udC13ZWlnaHRcIixcIm5vcm1hbFwiKVxyXG4gICAgfSBcclxuXHJcbiAgICBpZih0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYyl7XHJcbiAgICAgICAgdmFyIGljb25MYWJlbD10aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYyh0aGlzKVxyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChpY29uTGFiZWwpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBudW1iZXJsYWJlbD0kKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmlubGluZTtiYWNrZ3JvdW5kLWNvbG9yOlwiK2xibENvbG9yXHJcbiAgICAgICAgK1wiO2NvbG9yOndoaXRlO2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHggNHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDtib3JkZXItcmFkaXVzOiAycHg7Jz5cIit0aGlzLmNoaWxkTGVhZk5vZGVzLmxlbmd0aCtcIjwvbGFiZWw+XCIpXHJcbiAgICB0aGlzLmhlYWRlckRPTS5hcHBlbmQobmFtZURpdixudW1iZXJsYWJlbCkgXHJcbiAgICBcclxuICAgIHRoaXMuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cCgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXA9ZnVuY3Rpb24oKXtcclxuICAgIGlmICh0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cCAmJiB0aGlzLmNoaWxkTGVhZk5vZGVzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgdGhpcy5oZWFkZXJET00uaGlkZSgpXHJcbiAgICAgICAgaWYgKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLmhpZGUoKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5zaG93KClcclxuICAgICAgICBpZiAodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uc2hvdygpXHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5kZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5oZWFkZXJET00ucmVtb3ZlKClcclxuICAgIHRoaXMubGlzdERPTS5yZW1vdmUoKVxyXG4gICAgdmFyIHBhcmVudEFyciA9IHRoaXMucGFyZW50VHJlZS5ncm91cE5vZGVzXHJcbiAgICBjb25zdCBpbmRleCA9IHBhcmVudEFyci5pbmRleE9mKHRoaXMpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIHBhcmVudEFyci5zcGxpY2UoaW5kZXgsIDEpO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5jcmVhdGVET009ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduXCI+PC9idXR0b24+JylcclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG4gICAgdGhpcy5saXN0RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtaGlkZSB3My1ib3JkZXJcIj48L2Rpdj4nKVxyXG5cclxuICAgIHRoaXMuaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZih0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcblxyXG4gICAgICAgIHRoaXMucGFyZW50VHJlZS5zZWxlY3RHcm91cE5vZGUodGhpcykgICAgXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmlzT3Blbj1mdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuICB0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5leHBhbmQ9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuc2hyaW5rPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNvcnROb2Rlc0J5TmFtZT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50VHJlZS5vcHRpb25zXHJcbiAgICBpZih0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5KSB2YXIgbGVhZk5hbWVQcm9wZXJ0eT10cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5XHJcbiAgICBlbHNlIGxlYWZOYW1lUHJvcGVydHk9XCIkZHRJZFwiXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgXHJcbiAgICAgICAgdmFyIGFOYW1lPWEubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgdmFyIGJOYW1lPWIubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgcmV0dXJuIGFOYW1lLmxvY2FsZUNvbXBhcmUoYk5hbWUpIFxyXG4gICAgfSk7XHJcbiAgICAvL3RoaXMubGlzdERPTS5lbXB0eSgpIC8vTk9URTogQ2FuIG5vdCBkZWxldGUgdGhvc2UgbGVhZiBub2RlIG90aGVyd2lzZSB0aGUgZXZlbnQgaGFuZGxlIGlzIGxvc3RcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChvbmVMZWFmPT57dGhpcy5saXN0RE9NLmFwcGVuZChvbmVMZWFmLkRPTSl9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5hZGROb2RlPWZ1bmN0aW9uKG9iaixza2lwUmVwZWF0KXtcclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdmFyIGxlYWZOYW1lUHJvcGVydHk9dHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eVxyXG4gICAgZWxzZSBsZWFmTmFtZVByb3BlcnR5PVwiJGR0SWRcIlxyXG5cclxuICAgIGlmKHNraXBSZXBlYXQpe1xyXG4gICAgICAgIHZhciBmb3VuZFJlcGVhdD1mYWxzZTtcclxuICAgICAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2goYU5vZGU9PntcclxuICAgICAgICAgICAgaWYoYU5vZGUubmFtZT09b2JqW2xlYWZOYW1lUHJvcGVydHldKSB7XHJcbiAgICAgICAgICAgICAgICBmb3VuZFJlcGVhdD10cnVlXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGlmKGZvdW5kUmVwZWF0KSByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFOZXdOb2RlID0gbmV3IHNpbXBsZVRyZWVMZWFmTm9kZSh0aGlzLG9iailcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMucHVzaChhTmV3Tm9kZSlcclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG4gICAgdGhpcy5saXN0RE9NLmFwcGVuZChhTmV3Tm9kZS5ET00pXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXRyZWUgbGVhZiBub2RlLS0tLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWVMZWFmTm9kZShwYXJlbnRHcm91cE5vZGUsb2JqKXtcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlPXBhcmVudEdyb3VwTm9kZVxyXG4gICAgdGhpcy5sZWFmSW5mbz1vYmo7XHJcblxyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bdHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eV1cclxuICAgIGVsc2UgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bXCIkZHRJZFwiXVxyXG5cclxuICAgIHRoaXMuY3JlYXRlTGVhZk5vZGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRlbGV0ZVNlbGYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG4gICAgdmFyIGdOb2RlID0gdGhpcy5wYXJlbnRHcm91cE5vZGVcclxuICAgIGNvbnN0IGluZGV4ID0gZ05vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBnTm9kZS5jaGlsZExlYWZOb2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmNyZWF0ZUxlYWZOb2RlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXdoaXRlXCIgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO3RleHQtYWxpZ246bGVmdDt3aWR0aDo5OCVcIj4nK3RoaXMubmFtZSsnPC9idXR0b24+JylcclxuICAgIHZhciBjbGlja0Y9KGUpPT57XHJcbiAgICAgICAgdGhpcy5oaWdobGlnaHQoKTtcclxuICAgICAgICB2YXIgY2xpY2tEZXRhaWw9ZS5kZXRhaWxcclxuICAgICAgICBpZiAoZS5jdHJsS2V5KSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuYXBwZW5kTGVhZk5vZGVUb1NlbGVjdGlvbih0aGlzKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLnNlbGVjdExlYWZOb2RlKHRoaXMsZS5kZXRhaWwpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5ET00ub24oXCJjbGlja1wiLChlKT0+e2NsaWNrRihlKX0pXHJcblxyXG4gICAgdGhpcy5ET00ub24oXCJkYmxjbGlja1wiLChlKT0+e1xyXG4gICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuZGJsQ2xpY2tOb2RlKHRoaXMpXHJcbiAgICB9KVxyXG59XHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuaGlnaGxpZ2h0PWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5hZGRDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuZGltPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaW1wbGVUcmVlOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IG1vZGVsQW5hbHl6ZXIgPSByZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBmb3JtYXR0ZXIgPSBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ2VuLVVTJywge1xyXG4gICAgbWluaW11bUZyYWN0aW9uRGlnaXRzOiAzLFxyXG4gICAgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAzLFxyXG59KTtcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudSA9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuXHJcbmZ1bmN0aW9uIHRvcG9sb2d5RE9NKERPTSl7XHJcbiAgICB0aGlzLkRPTT1ET01cclxuICAgIHRoaXMuZGVmYXVsdE5vZGVTaXplPTMwXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5pbml0PWZ1bmN0aW9uKCl7XHJcbiAgICBjeXRvc2NhcGUud2FybmluZ3MoZmFsc2UpICBcclxuICAgIHRoaXMuY29yZSA9IGN5dG9zY2FwZSh7XHJcbiAgICAgICAgY29udGFpbmVyOiAgdGhpcy5ET01bMF0sIC8vIGNvbnRhaW5lciB0byByZW5kZXIgaW5cclxuXHJcbiAgICAgICAgLy8gaW5pdGlhbCB2aWV3cG9ydCBzdGF0ZTpcclxuICAgICAgICB6b29tOiAxLFxyXG4gICAgICAgIHBhbjogeyB4OiAwLCB5OiAwIH0sXHJcblxyXG4gICAgICAgIC8vIGludGVyYWN0aW9uIG9wdGlvbnM6XHJcbiAgICAgICAgbWluWm9vbTogMC4xLFxyXG4gICAgICAgIG1heFpvb206IDEwLFxyXG4gICAgICAgIHpvb21pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHVzZXJab29taW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBwYW5uaW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICB1c2VyUGFubmluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgYm94U2VsZWN0aW9uRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBzZWxlY3Rpb25UeXBlOiAnc2luZ2xlJyxcclxuICAgICAgICB0b3VjaFRhcFRocmVzaG9sZDogOCxcclxuICAgICAgICBkZXNrdG9wVGFwVGhyZXNob2xkOiA0LFxyXG4gICAgICAgIGF1dG9sb2NrOiBmYWxzZSxcclxuICAgICAgICBhdXRvdW5ncmFiaWZ5OiBmYWxzZSxcclxuICAgICAgICBhdXRvdW5zZWxlY3RpZnk6IGZhbHNlLFxyXG5cclxuICAgICAgICAvLyByZW5kZXJpbmcgb3B0aW9uczpcclxuICAgICAgICBoZWFkbGVzczogZmFsc2UsXHJcbiAgICAgICAgc3R5bGVFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIGhpZGVFZGdlc09uVmlld3BvcnQ6IGZhbHNlLFxyXG4gICAgICAgIHRleHR1cmVPblZpZXdwb3J0OiBmYWxzZSxcclxuICAgICAgICBtb3Rpb25CbHVyOiBmYWxzZSxcclxuICAgICAgICBtb3Rpb25CbHVyT3BhY2l0eTogMC4yLFxyXG4gICAgICAgIHdoZWVsU2Vuc2l0aXZpdHk6IDAuMyxcclxuICAgICAgICBwaXhlbFJhdGlvOiAnYXV0bycsXHJcblxyXG4gICAgICAgIGVsZW1lbnRzOiBbXSwgLy8gbGlzdCBvZiBncmFwaCBlbGVtZW50cyB0byBzdGFydCB3aXRoXHJcblxyXG4gICAgICAgIHN0eWxlOiBbIC8vIHRoZSBzdHlsZXNoZWV0IGZvciB0aGUgZ3JhcGhcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6ICdub2RlJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiOnRoaXMuZGVmYXVsdE5vZGVTaXplLFwiaGVpZ2h0XCI6dGhpcy5kZWZhdWx0Tm9kZVNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJzogJ2RhdGEoaWQpJyxcclxuICAgICAgICAgICAgICAgICAgICAnb3BhY2l0eSc6MC45LFxyXG4gICAgICAgICAgICAgICAgICAgICdmb250LXNpemUnOlwiMTJweFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICdmb250LWZhbWlseSc6J0dlbmV2YSwgQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZidcclxuICAgICAgICAgICAgICAgICAgICAvLywnYmFja2dyb3VuZC1pbWFnZSc6IGZ1bmN0aW9uKGVsZSl7IHJldHVybiBcImltYWdlcy9jYXQucG5nXCI7IH1cclxuICAgICAgICAgICAgICAgICAgICAvLywnYmFja2dyb3VuZC1maXQnOidjb250YWluJyAvL2NvdmVyXHJcbiAgICAgICAgICAgICAgICAgICAgLCdiYWNrZ3JvdW5kLXdpZHRoJzonNzAlJ1xyXG4gICAgICAgICAgICAgICAgICAgICwnYmFja2dyb3VuZC1oZWlnaHQnOic3MCUnXHJcbiAgICAgICAgICAgICAgICAgICAgLy8nYmFja2dyb3VuZC1jb2xvcic6IGZ1bmN0aW9uKCBlbGUgKXsgcmV0dXJuIGVsZS5kYXRhKCdiZycpIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6ICdlZGdlJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ3dpZHRoJzoyLFxyXG4gICAgICAgICAgICAgICAgICAgICdsaW5lLWNvbG9yJzogJyM4ODgnLFxyXG4gICAgICAgICAgICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnIzU1NScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1zaGFwZSc6ICd0cmlhbmdsZScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2N1cnZlLXN0eWxlJzogJ2JlemllcicsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2Fycm93LXNjYWxlJzowLjZcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnZWRnZTpzZWxlY3RlZCcsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAzLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtY29sb3InOiAncmVkJyxcclxuICAgICAgICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAncmVkJyxcclxuICAgICAgICAgICAgICAgICdzb3VyY2UtYXJyb3ctY29sb3InOiAncmVkJ1xyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnbm9kZTpzZWxlY3RlZCcsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLWNvbG9yJzpcInJlZFwiLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlci13aWR0aCc6MixcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ0dyYXknXHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdub2RlLmhvdmVyJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJsYWNrZW4nOjAuNVxyXG4gICAgICAgICAgICB9fSx7c2VsZWN0b3I6ICdlZGdlLmhvdmVyJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6NVxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBcclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL2N5dG9zY2FwZSBlZGdlIGVkaXRpbmcgcGx1Zy1pblxyXG4gICAgdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKHtcclxuICAgICAgICB1bmRvYWJsZTogdHJ1ZSxcclxuICAgICAgICBiZW5kUmVtb3ZhbFNlbnNpdGl2aXR5OiAxNixcclxuICAgICAgICBlbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb246IHRydWUsXHJcbiAgICAgICAgc3RpY2t5QW5jaG9yVG9sZXJlbmNlOiAyMCxcclxuICAgICAgICBhbmNob3JTaGFwZVNpemVGYWN0b3I6IDUsXHJcbiAgICAgICAgZW5hYmxlQW5jaG9yU2l6ZU5vdEltcGFjdEJ5Wm9vbTp0cnVlLFxyXG4gICAgICAgIGVuYWJsZVJlbW92ZUFuY2hvck1pZE9mTmVhckxpbmU6ZmFsc2UsXHJcbiAgICAgICAgZW5hYmxlQ3JlYXRlQW5jaG9yT25EcmFnOmZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuICAgIHRoaXMuY29yZS5ib3hTZWxlY3Rpb25FbmFibGVkKHRydWUpXHJcblxyXG5cclxuICAgIHRoaXMuY29yZS5vbigndGFwc2VsZWN0JywgKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KTtcclxuICAgIHRoaXMuY29yZS5vbigndGFwdW5zZWxlY3QnLCAoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pO1xyXG5cclxuICAgIHRoaXMuY29yZS5vbignYm94ZW5kJywoZSk9PnsvL3B1dCBpbnNpZGUgYm94ZW5kIGV2ZW50IHRvIHRyaWdnZXIgb25seSBvbmUgdGltZSwgYW5kIHJlcGxlYXRseSBhZnRlciBlYWNoIGJveCBzZWxlY3RcclxuICAgICAgICB0aGlzLmNvcmUub25lKCdib3hzZWxlY3QnLCgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdjeHR0YXAnLChlKT0+e1xyXG4gICAgICAgIHRoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ21vdXNlb3ZlcicsZT0+e1xyXG5cclxuICAgICAgICB0aGlzLm1vdXNlT3ZlckZ1bmN0aW9uKGUpXHJcbiAgICB9KVxyXG4gICAgdGhpcy5jb3JlLm9uKCdtb3VzZW91dCcsZT0+e1xyXG4gICAgICAgIHRoaXMubW91c2VPdXRGdW5jdGlvbihlKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdGhpcy5jb3JlLm9uKCd6b29tJywoZSk9PntcclxuICAgICAgICB2YXIgZnM9dGhpcy5nZXRGb250U2l6ZUluQ3VycmVudFpvb20oKTtcclxuICAgICAgICB2YXIgZGltZW5zaW9uPXRoaXMuZ2V0Tm9kZVNpemVJbkN1cnJlbnRab29tKCk7XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAgICAgICAgIC5zZWxlY3Rvcignbm9kZScpXHJcbiAgICAgICAgICAgICAgICAuc3R5bGUoeyAnZm9udC1zaXplJzogZnMsIHdpZHRoOmRpbWVuc2lvbiAsaGVpZ2h0OmRpbWVuc2lvbiB9KVxyXG4gICAgICAgICAgICAgICAgLnVwZGF0ZSgpXHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAgICAgICAgIC5zZWxlY3Rvcignbm9kZTpzZWxlY3RlZCcpXHJcbiAgICAgICAgICAgICAgICAuc3R5bGUoeyAnYm9yZGVyLXdpZHRoJzogTWF0aC5jZWlsKGRpbWVuc2lvbi8xNSkgfSlcclxuICAgICAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgdmFyIHRhcGRyYWdIYW5kbGVyPShlKSA9PiB7XHJcbiAgICAgICAgaW5zdGFuY2Uua2VlcEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uRHVyaW5nTW92aW5nKClcclxuICAgICAgICBpZihlLnRhcmdldC5pc05vZGUgJiYgZS50YXJnZXQuaXNOb2RlKCkpIHRoaXMuZHJhZ2dpbmdOb2RlPWUudGFyZ2V0XHJcbiAgICAgICAgdGhpcy5zbWFydFBvc2l0aW9uTm9kZShlLnBvc2l0aW9uKVxyXG4gICAgfVxyXG4gICAgdmFyIHNldE9uZVRpbWVHcmFiID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29yZS5vbmNlKFwiZ3JhYlwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZHJhZ2dpbmdOb2RlcyA9IHRoaXMuY29yZS5jb2xsZWN0aW9uKClcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmlzTm9kZSgpKSBkcmFnZ2luZ05vZGVzLm1lcmdlKGUudGFyZ2V0KVxyXG4gICAgICAgICAgICB2YXIgYXJyID0gdGhpcy5jb3JlLiQoXCI6c2VsZWN0ZWRcIilcclxuICAgICAgICAgICAgYXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZS5pc05vZGUoKSkgZHJhZ2dpbmdOb2Rlcy5tZXJnZShlbGUpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGluc3RhbmNlLnN0b3JlQW5jaG9yc0Fic29sdXRlUG9zaXRpb24oZHJhZ2dpbmdOb2RlcylcclxuICAgICAgICAgICAgdGhpcy5jb3JlLm9uKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyIClcclxuICAgICAgICAgICAgc2V0T25lVGltZUZyZWUoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICB2YXIgc2V0T25lVGltZUZyZWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uY2UoXCJmcmVlXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICAgICAgICAgIGluc3RhbmNlLnJlc2V0QW5jaG9yc0Fic29sdXRlUG9zaXRpb24oKVxyXG4gICAgICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZT1udWxsXHJcbiAgICAgICAgICAgIHNldE9uZVRpbWVHcmFiKClcclxuICAgICAgICAgICAgdGhpcy5jb3JlLnJlbW92ZUxpc3RlbmVyKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBzZXRPbmVUaW1lR3JhYigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zbWFydFBvc2l0aW9uTm9kZSA9IGZ1bmN0aW9uIChtb3VzZVBvc2l0aW9uKSB7XHJcbiAgICB2YXIgem9vbUxldmVsPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKCF0aGlzLmRyYWdnaW5nTm9kZSkgcmV0dXJuXHJcbiAgICAvL2NvbXBhcmluZyBub2RlcyBzZXQ6IGl0cyBjb25uZWN0ZnJvbSBub2RlcyBhbmQgdGhlaXIgY29ubmVjdHRvIG5vZGVzLCBpdHMgY29ubmVjdHRvIG5vZGVzIGFuZCB0aGVpciBjb25uZWN0ZnJvbSBub2Rlc1xyXG4gICAgdmFyIGluY29tZXJzPXRoaXMuZHJhZ2dpbmdOb2RlLmluY29tZXJzKClcclxuICAgIHZhciBvdXRlckZyb21JbmNvbT0gaW5jb21lcnMub3V0Z29lcnMoKVxyXG4gICAgdmFyIG91dGVyPXRoaXMuZHJhZ2dpbmdOb2RlLm91dGdvZXJzKClcclxuICAgIHZhciBpbmNvbUZyb21PdXRlcj1vdXRlci5pbmNvbWVycygpXHJcbiAgICB2YXIgbW9uaXRvclNldD1pbmNvbWVycy51bmlvbihvdXRlckZyb21JbmNvbSkudW5pb24ob3V0ZXIpLnVuaW9uKGluY29tRnJvbU91dGVyKS5maWx0ZXIoJ25vZGUnKS51bm1lcmdlKHRoaXMuZHJhZ2dpbmdOb2RlKVxyXG5cclxuICAgIHZhciByZXR1cm5FeHBlY3RlZFBvcz0oZGlmZkFycixwb3NBcnIpPT57XHJcbiAgICAgICAgdmFyIG1pbkRpc3RhbmNlPU1hdGgubWluKC4uLmRpZmZBcnIpXHJcbiAgICAgICAgaWYobWluRGlzdGFuY2Uqem9vbUxldmVsIDwgMTApICByZXR1cm4gcG9zQXJyW2RpZmZBcnIuaW5kZXhPZihtaW5EaXN0YW5jZSldXHJcbiAgICAgICAgZWxzZSByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgeERpZmY9W11cclxuICAgIHZhciB4UG9zPVtdXHJcbiAgICB2YXIgeURpZmY9W11cclxuICAgIHZhciB5UG9zPVtdXHJcbiAgICBtb25pdG9yU2V0LmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICB4RGlmZi5wdXNoKE1hdGguYWJzKGVsZS5wb3NpdGlvbigpLngtbW91c2VQb3NpdGlvbi54KSlcclxuICAgICAgICB4UG9zLnB1c2goZWxlLnBvc2l0aW9uKCkueClcclxuICAgICAgICB5RGlmZi5wdXNoKE1hdGguYWJzKGVsZS5wb3NpdGlvbigpLnktbW91c2VQb3NpdGlvbi55KSlcclxuICAgICAgICB5UG9zLnB1c2goZWxlLnBvc2l0aW9uKCkueSlcclxuICAgIH0pXHJcbiAgICB2YXIgcHJlZlg9cmV0dXJuRXhwZWN0ZWRQb3MoeERpZmYseFBvcylcclxuICAgIHZhciBwcmVmWT1yZXR1cm5FeHBlY3RlZFBvcyh5RGlmZix5UG9zKVxyXG4gICAgaWYocHJlZlghPW51bGwpIHtcclxuICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZS5wb3NpdGlvbigneCcsIHByZWZYKTtcclxuICAgIH1cclxuICAgIGlmKHByZWZZIT1udWxsKSB7XHJcbiAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGUucG9zaXRpb24oJ3knLCBwcmVmWSk7XHJcbiAgICB9XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiLS0tLVwiKVxyXG4gICAgLy9tb25pdG9yU2V0LmZvckVhY2goKGVsZSk9Pntjb25zb2xlLmxvZyhlbGUuaWQoKSl9KVxyXG4gICAgLy9jb25zb2xlLmxvZyhtb25pdG9yU2V0LnNpemUoKSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm1vdXNlT3ZlckZ1bmN0aW9uPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYoIWUudGFyZ2V0LmRhdGEpIHJldHVyblxyXG4gICAgdmFyIGluZm89ZS50YXJnZXQuZGF0YSgpLm9yaWdpbmFsSW5mb1xyXG4gICAgaWYoaW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgaWYodGhpcy5sYXN0SG92ZXJUYXJnZXQpIHRoaXMubGFzdEhvdmVyVGFyZ2V0LnJlbW92ZUNsYXNzKFwiaG92ZXJcIilcclxuICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0PWUudGFyZ2V0XHJcbiAgICBlLnRhcmdldC5hZGRDbGFzcyhcImhvdmVyXCIpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzZWxlY3ROb2Rlc1wiLCBcImluZm9cIjogW2luZm9dIH0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5tb3VzZU91dEZ1bmN0aW9uPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbiAgICBpZih0aGlzLmxhc3RIb3ZlclRhcmdldCl7XHJcbiAgICAgICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQucmVtb3ZlQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0PW51bGw7XHJcbiAgICB9IFxyXG5cclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RGdW5jdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhcnIgPSB0aGlzLmNvcmUuJChcIjpzZWxlY3RlZFwiKVxyXG4gICAgdmFyIHJlID0gW11cclxuICAgIGFyci5mb3JFYWNoKChlbGUpID0+IHsgcmUucHVzaChlbGUuZGF0YSgpLm9yaWdpbmFsSW5mbykgfSlcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNlbGVjdE5vZGVzXCIsIGluZm86IHJlIH0pXHJcblxyXG4gICAgLy9mb3IgZGVidWdnaW5nIHB1cnBvc2VcclxuICAgIC8vYXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgIC8vICBjb25zb2xlLmxvZyhcIlwiKVxyXG4gICAgLy99KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Rm9udFNpemVJbkN1cnJlbnRab29tPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgY3VyWm9vbT10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZihjdXJab29tPjEpe1xyXG4gICAgICAgIHZhciBtYXhGUz0xMlxyXG4gICAgICAgIHZhciBtaW5GUz01XHJcbiAgICAgICAgdmFyIHJhdGlvPSAobWF4RlMvbWluRlMtMSkvOSooY3VyWm9vbS0xKSsxXHJcbiAgICAgICAgdmFyIGZzPU1hdGguY2VpbChtYXhGUy9yYXRpbylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBtYXhGUz0xMjBcclxuICAgICAgICB2YXIgbWluRlM9MTJcclxuICAgICAgICB2YXIgcmF0aW89IChtYXhGUy9taW5GUy0xKS85KigxL2N1clpvb20tMSkrMVxyXG4gICAgICAgIHZhciBmcz1NYXRoLmNlaWwobWluRlMqcmF0aW8pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZnM7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5nZXROb2RlU2l6ZUluQ3VycmVudFpvb209ZnVuY3Rpb24oKXtcclxuICAgIHZhciBjdXJab29tPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKGN1clpvb20+MSl7Ly9zY2FsZSB1cCBidXQgbm90IHRvbyBtdWNoXHJcbiAgICAgICAgdmFyIHJhdGlvPSAoY3VyWm9vbS0xKSooMi0xKS85KzFcclxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMuZGVmYXVsdE5vZGVTaXplL3JhdGlvKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHJhdGlvPSAoMS9jdXJab29tLTEpKig0LTEpLzkrMVxyXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwodGhpcy5kZWZhdWx0Tm9kZVNpemUqcmF0aW8pXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxBdmFydGE9ZnVuY3Rpb24obW9kZWxJRCxkYXRhVXJsKXtcclxuICAgIHRyeXtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKSBcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2JhY2tncm91bmQtaW1hZ2UnOiBkYXRhVXJsfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbFR3aW5Db2xvcj1mdW5jdGlvbihtb2RlbElELGNvbG9yQ29kZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnYmFja2dyb3VuZC1jb2xvcic6IGNvbG9yQ29kZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsVHdpblNoYXBlPWZ1bmN0aW9uKG1vZGVsSUQsc2hhcGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J3NoYXBlJzogc2hhcGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxjb2xvckNvZGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydsaW5lLWNvbG9yJzogY29sb3JDb2RlfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlUmVsYXRpb25zaGlwU2hhcGU9ZnVuY3Rpb24oc3JjTW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHNoYXBlKXtcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnbGluZS1zdHlsZSc6IHNoYXBlfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRlbGV0ZVJlbGF0aW9ucz1mdW5jdGlvbihyZWxhdGlvbnMpe1xyXG4gICAgcmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bXCJzcmNJRFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbklEPW9uZVJlbGF0aW9uW1wicmVsSURcIl1cclxuICAgICAgICB2YXIgdGhlTm9kZT10aGlzLmNvcmUuZmlsdGVyKCdbaWQgPSBcIicrc3JjSUQrJ1wiXScpO1xyXG4gICAgICAgIHZhciBlZGdlcz10aGVOb2RlLmNvbm5lY3RlZEVkZ2VzKCkudG9BcnJheSgpXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxlZGdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIGFuRWRnZT1lZGdlc1tpXVxyXG4gICAgICAgICAgICBpZihhbkVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXT09cmVsYXRpb25JRCl7XHJcbiAgICAgICAgICAgICAgICBhbkVkZ2UucmVtb3ZlKClcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KSAgIFxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB0d2luSURBcnIuZm9yRWFjaCh0d2luSUQ9PntcclxuICAgICAgICB0aGlzLmNvcmUuJCgnW2lkID0gXCInK3R3aW5JRCsnXCJdJykucmVtb3ZlKClcclxuICAgIH0pICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hbmltYXRlQU5vZGU9ZnVuY3Rpb24odHdpbil7XHJcbiAgICB2YXIgY3VyRGltZW5zaW9uPSB0aGlzLmdldE5vZGVTaXplSW5DdXJyZW50Wm9vbSgpXHJcbiAgICB0d2luLmFuaW1hdGUoe1xyXG4gICAgICAgIHN0eWxlOiB7ICdoZWlnaHQnOiBjdXJEaW1lbnNpb24qMiwnd2lkdGgnOiBjdXJEaW1lbnNpb24qMiB9LFxyXG4gICAgICAgIGR1cmF0aW9uOiAyMDBcclxuICAgIH0pO1xyXG5cclxuICAgIHNldFRpbWVvdXQoKCk9PntcclxuICAgICAgICB0d2luLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICBzdHlsZTogeyAnaGVpZ2h0JzogY3VyRGltZW5zaW9uLCd3aWR0aCc6IGN1ckRpbWVuc2lvbiB9LFxyXG4gICAgICAgICAgICBkdXJhdGlvbjogMjAwXHJcbiAgICAgICAgICAgICxjb21wbGV0ZTooKT0+e1xyXG4gICAgICAgICAgICAgICAgdHdpbi5yZW1vdmVTdHlsZSgpIC8vbXVzdCByZW1vdmUgdGhlIHN0eWxlIGFmdGVyIGFuaW1hdGlvbiwgb3RoZXJ3aXNlIHRoZXkgd2lsbCBoYXZlIHRoZWlyIG93biBzdHlsZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LDIwMClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdUd2lucz1mdW5jdGlvbih0d2luc0RhdGEsYW5pbWF0aW9uKXtcclxuICAgIHZhciBhcnI9W11cclxuICAgIGZvcih2YXIgaT0wO2k8dHdpbnNEYXRhLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm89dHdpbnNEYXRhW2ldO1xyXG4gICAgICAgIHZhciBuZXdOb2RlPXtkYXRhOnt9LGdyb3VwOlwibm9kZXNcIn1cclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJvcmlnaW5hbEluZm9cIl09IG9yaWdpbmFsSW5mbztcclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJpZFwiXT1vcmlnaW5hbEluZm9bJyRkdElkJ11cclxuICAgICAgICB2YXIgbW9kZWxJRD1vcmlnaW5hbEluZm9bJyRtZXRhZGF0YSddWyckbW9kZWwnXVxyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcIm1vZGVsSURcIl09bW9kZWxJRFxyXG4gICAgICAgIGFyci5wdXNoKG5ld05vZGUpXHJcbiAgICB9XHJcbiAgICB2YXIgZWxlcyA9IHRoaXMuY29yZS5hZGQoYXJyKVxyXG4gICAgaWYoZWxlcy5zaXplKCk9PTApIHJldHVybiBlbGVzXHJcbiAgICB0aGlzLm5vUG9zaXRpb25fZ3JpZChlbGVzKVxyXG4gICAgaWYoYW5pbWF0aW9uKXtcclxuICAgICAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vaWYgdGhlcmUgaXMgY3VycmVudGx5IGEgbGF5b3V0IHRoZXJlLCBhcHBseSBpdFxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dCgpXHJcblxyXG4gICAgcmV0dXJuIGVsZXNcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdSZWxhdGlvbnM9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICB2YXIgcmVsYXRpb25JbmZvQXJyPVtdXHJcbiAgICBmb3IodmFyIGk9MDtpPHJlbGF0aW9uc0RhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9yaWdpbmFsSW5mbz1yZWxhdGlvbnNEYXRhW2ldO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB0aGVJRD1vcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBOYW1lJ10rXCJfXCIrb3JpZ2luYWxJbmZvWyckcmVsYXRpb25zaGlwSWQnXVxyXG4gICAgICAgIHZhciBhUmVsYXRpb249e2RhdGE6e30sZ3JvdXA6XCJlZGdlc1wifVxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wib3JpZ2luYWxJbmZvXCJdPW9yaWdpbmFsSW5mb1xyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wiaWRcIl09dGhlSURcclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXT1vcmlnaW5hbEluZm9bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJ0YXJnZXRcIl09b3JpZ2luYWxJbmZvWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgIGlmKHRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdKS5sZW5ndGg9PTAgfHwgdGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJ0YXJnZXRcIl0pLmxlbmd0aD09MCkgY29udGludWVcclxuICAgICAgICB2YXIgc291cmNlTm9kZT10aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXSlcclxuICAgICAgICB2YXIgc291cmNlTW9kZWw9c291cmNlTm9kZVswXS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICBcclxuICAgICAgICAvL2FkZCBhZGRpdGlvbmFsIHNvdXJjZSBub2RlIGluZm9ybWF0aW9uIHRvIHRoZSBvcmlnaW5hbCByZWxhdGlvbnNoaXAgaW5mb3JtYXRpb25cclxuICAgICAgICBvcmlnaW5hbEluZm9bJ3NvdXJjZU1vZGVsJ109c291cmNlTW9kZWxcclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInNvdXJjZU1vZGVsXCJdPXNvdXJjZU1vZGVsXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJyZWxhdGlvbnNoaXBOYW1lXCJdPW9yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcE5hbWUnXVxyXG5cclxuICAgICAgICB2YXIgZXhpc3RFZGdlPXRoaXMuY29yZS4kKCdlZGdlW2lkID0gXCInK3RoZUlEKydcIl0nKVxyXG4gICAgICAgIGlmKGV4aXN0RWRnZS5zaXplKCk+MCkge1xyXG4gICAgICAgICAgICBleGlzdEVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiLG9yaWdpbmFsSW5mbylcclxuICAgICAgICAgICAgY29udGludWU7ICAvL25vIG5lZWQgdG8gZHJhdyBpdFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVsYXRpb25JbmZvQXJyLnB1c2goYVJlbGF0aW9uKVxyXG4gICAgfVxyXG4gICAgaWYocmVsYXRpb25JbmZvQXJyLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgdmFyIGVkZ2VzPXRoaXMuY29yZS5hZGQocmVsYXRpb25JbmZvQXJyKVxyXG4gICAgcmV0dXJuIGVkZ2VzXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3PWZ1bmN0aW9uKCl7XHJcbiAgICAvL2NoZWNrIHRoZSBzdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMgYWdhaW4gYW5kIG1heWJlIHNvbWUgb2YgdGhlbSBjYW4gYmUgZHJhd24gbm93IHNpbmNlIHRhcmdldE5vZGUgaXMgYXZhaWxhYmxlXHJcbiAgICB2YXIgc3RvcmVkUmVsYXRpb25BcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgc3RvcmVkUmVsYXRpb25BcnI9c3RvcmVkUmVsYXRpb25BcnIuY29uY2F0KGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdKVxyXG4gICAgfVxyXG4gICAgdGhpcy5kcmF3UmVsYXRpb25zKHN0b3JlZFJlbGF0aW9uQXJyKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1R3aW5zQW5kUmVsYXRpb25zPWZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHR3aW5zQW5kUmVsYXRpb25zPWRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9uc1xyXG5cclxuICAgIC8vZHJhdyB0aG9zZSBuZXcgdHdpbnMgZmlyc3RcclxuICAgIHR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHR3aW5JbmZvQXJyPVtdXHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpIHR3aW5JbmZvQXJyLnB1c2gob25lU2V0LmNoaWxkVHdpbnNbaW5kXSlcclxuICAgICAgICB0aGlzLmRyYXdUd2lucyh0d2luSW5mb0FycixcImFuaW1hdGlvblwiKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2RyYXcgdGhvc2Uga25vd24gdHdpbnMgZnJvbSB0aGUgcmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHR3aW5zSW5mbz17fVxyXG4gICAgdHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zSW5mbz1vbmVTZXRbXCJyZWxhdGlvbnNoaXBzXCJdXHJcbiAgICAgICAgcmVsYXRpb25zSW5mby5mb3JFYWNoKChvbmVSZWxhdGlvbik9PntcclxuICAgICAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1tzcmNJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF1cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3RhcmdldElEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSAgICBcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciB0bXBBcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIHR3aW5zSW5mbykgdG1wQXJyLnB1c2godHdpbnNJbmZvW3R3aW5JRF0pXHJcbiAgICB0aGlzLmRyYXdUd2lucyh0bXBBcnIpXHJcblxyXG4gICAgLy90aGVuIGNoZWNrIGFsbCBzdG9yZWQgcmVsYXRpb25zaGlwcyBhbmQgZHJhdyBpZiBpdCBjYW4gYmUgZHJhd25cclxuICAgIHRoaXMucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdygpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseVZpc3VhbERlZmluaXRpb249ZnVuY3Rpb24oKXtcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdXHJcbiAgICBpZih2aXN1YWxKc29uPT1udWxsKSByZXR1cm47XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdmlzdWFsSnNvbil7XHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5jb2xvcikgdGhpcy51cGRhdGVNb2RlbFR3aW5Db2xvcihtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5zaGFwZSkgdGhpcy51cGRhdGVNb2RlbFR3aW5TaGFwZShtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSlcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLnJlbHMpe1xyXG4gICAgICAgICAgICBmb3IodmFyIHJlbGF0aW9uc2hpcE5hbWUgaW4gdmlzdWFsSnNvblttb2RlbElEXS5yZWxzKVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uY29sb3Ipe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmNvbG9yKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uc2hhcGUpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwU2hhcGUobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLnNoYXBlKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFREYXRhc291cmNlQ2hhbmdlX3JlcGxhY2VcIil7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkucmVtb3ZlKClcclxuICAgICAgICB0aGlzLmFwcGx5VmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicmVwbGFjZUFsbFR3aW5zXCIpIHtcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS5yZW1vdmUoKVxyXG4gICAgICAgIHZhciBlbGVzPSB0aGlzLmRyYXdUd2lucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICAgICAgdGhpcy5jb3JlLmNlbnRlcihlbGVzKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFwcGVuZEFsbFR3aW5zXCIpIHtcclxuICAgICAgICB2YXIgZWxlcz0gdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC5pbmZvLFwiYW5pbWF0ZVwiKVxyXG4gICAgICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxuICAgICAgICB0aGlzLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXcoKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRyYXdBbGxSZWxhdGlvbnNcIil7XHJcbiAgICAgICAgdmFyIGVkZ2VzPSB0aGlzLmRyYXdSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgICAgIGlmKGVkZ2VzIT1udWxsKSB7XHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lPT1udWxsKSAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2UoKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luXCIpIHtcclxuICAgICAgICB0aGlzLmRyYXdUd2lucyhbbXNnUGF5bG9hZC50d2luSW5mb10sXCJhbmltYXRpb25cIilcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luc1wiKSB7XHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC50d2luc0luZm8sXCJhbmltYXRpb25cIilcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIikgdGhpcy5kcmF3VHdpbnNBbmRSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2VsZWN0Tm9kZXNcIil7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHRoaXMuY29yZS5lZGdlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB2YXIgYXJyPW1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICB2YXIgbW91c2VDbGlja0RldGFpbD1tc2dQYXlsb2FkLm1vdXNlQ2xpY2tEZXRhaWw7XHJcbiAgICAgICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgICAgIHZhciBhVHdpbj0gdGhpcy5jb3JlLm5vZGVzKFwiI1wiK2VsZW1lbnRbJyRkdElkJ10pXHJcbiAgICAgICAgICAgIGFUd2luLnNlbGVjdCgpXHJcbiAgICAgICAgICAgIGlmKG1vdXNlQ2xpY2tEZXRhaWwhPTIpIHRoaXMuYW5pbWF0ZUFOb2RlKGFUd2luKSAvL2lnbm9yZSBkb3VibGUgY2xpY2sgc2Vjb25kIGNsaWNrXHJcbiAgICAgICAgfSk7XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiUGFuVG9Ob2RlXCIpe1xyXG4gICAgICAgIHZhciBub2RlSW5mbz0gbXNnUGF5bG9hZC5pbmZvO1xyXG4gICAgICAgIHZhciB0b3BvTm9kZT0gdGhpcy5jb3JlLm5vZGVzKFwiI1wiK25vZGVJbmZvW1wiJGR0SWRcIl0pXHJcbiAgICAgICAgaWYodG9wb05vZGUpe1xyXG4gICAgICAgICAgICB0aGlzLmNvcmUuY2VudGVyKHRvcG9Ob2RlKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCl7XHJcbiAgICAgICAgICAgIGlmKG1zZ1BheWxvYWQuY29sb3IpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLmNvbG9yKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuc2hhcGUpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwU2hhcGUobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLnNoYXBlKVxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgaWYobXNnUGF5bG9hZC5jb2xvcikgdGhpcy51cGRhdGVNb2RlbFR3aW5Db2xvcihtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5jb2xvcilcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLnNoYXBlKSB0aGlzLnVwZGF0ZU1vZGVsVHdpblNoYXBlKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLnNoYXBlKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuYXZhcnRhKSB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmF2YXJ0YSlcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLm5vQXZhcnRhKSAgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtc2dQYXlsb2FkLm1vZGVsSUQsbnVsbClcclxuICAgICAgICB9IFxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInR3aW5zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVR3aW5zKG1zZ1BheWxvYWQudHdpbklEQXJyKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicmVsYXRpb25zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVJlbGF0aW9ucyhtc2dQYXlsb2FkLnJlbGF0aW9ucylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImNvbm5lY3RUb1wiKXsgdGhpcy5zdGFydFRhcmdldE5vZGVNb2RlKFwiY29ubmVjdFRvXCIpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiY29ubmVjdEZyb21cIil7IHRoaXMuc3RhcnRUYXJnZXROb2RlTW9kZShcImNvbm5lY3RGcm9tXCIpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkU2VsZWN0T3V0Ym91bmRcIil7IHRoaXMuc2VsZWN0T3V0Ym91bmROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkU2VsZWN0SW5ib3VuZFwiKXsgdGhpcy5zZWxlY3RJbmJvdW5kTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImhpZGVTZWxlY3RlZE5vZGVzXCIpeyB0aGlzLmhpZGVTZWxlY3RlZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJDT1NFU2VsZWN0ZWROb2Rlc1wiKXsgdGhpcy5DT1NFU2VsZWN0ZWROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2F2ZUxheW91dFwiKXsgdGhpcy5zYXZlTGF5b3V0KG1zZ1BheWxvYWQubGF5b3V0TmFtZSxtc2dQYXlsb2FkLmFkdE5hbWUpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwibGF5b3V0Q2hhbmdlXCIpeyB0aGlzLmFwcGx5TmV3TGF5b3V0KCkgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseU5ld0xheW91dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBsYXlvdXROYW1lPWdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lXHJcbiAgICBcclxuICAgIHZhciBsYXlvdXREZXRhaWw9IGdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgIFxyXG4gICAgLy9yZW1vdmUgYWxsIGJlbmRpbmcgZWRnZSBcclxuICAgIHRoaXMuY29yZS5lZGdlcygpLmZvckVhY2gob25lRWRnZT0+e1xyXG4gICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJylcclxuICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICBpZihsYXlvdXREZXRhaWw9PW51bGwpIHJldHVybjtcclxuICAgIFxyXG4gICAgdmFyIHN0b3JlZFBvc2l0aW9ucz17fVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbGF5b3V0RGV0YWlsKXtcclxuICAgICAgICBzdG9yZWRQb3NpdGlvbnNbaW5kXT17XHJcbiAgICAgICAgICAgIHg6bGF5b3V0RGV0YWlsW2luZF1bMF1cclxuICAgICAgICAgICAgLHk6bGF5b3V0RGV0YWlsW2luZF1bMV1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgbmV3TGF5b3V0PXRoaXMuY29yZS5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdwcmVzZXQnLFxyXG4gICAgICAgIHBvc2l0aW9uczpzdG9yZWRQb3NpdGlvbnMsXHJcbiAgICAgICAgZml0OmZhbHNlLFxyXG4gICAgICAgIGFuaW1hdGU6IHRydWUsXHJcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246IDMwMCxcclxuICAgIH0pXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxuXHJcbiAgICAvL3Jlc3RvcmUgZWRnZXMgYmVuZGluZyBvciBjb250cm9sIHBvaW50c1xyXG4gICAgdmFyIGVkZ2VQb2ludHNEaWN0PWxheW91dERldGFpbFtcImVkZ2VzXCJdXHJcbiAgICBpZihlZGdlUG9pbnRzRGljdD09bnVsbClyZXR1cm47XHJcbiAgICBmb3IodmFyIHNyY0lEIGluIGVkZ2VQb2ludHNEaWN0KXtcclxuICAgICAgICBmb3IodmFyIHJlbGF0aW9uc2hpcElEIGluIGVkZ2VQb2ludHNEaWN0W3NyY0lEXSl7XHJcbiAgICAgICAgICAgIHZhciBvYmo9ZWRnZVBvaW50c0RpY3Rbc3JjSURdW3JlbGF0aW9uc2hpcElEXVxyXG4gICAgICAgICAgICB0aGlzLmFwcGx5RWRnZUJlbmRjb250cm9sUG9pbnRzKHNyY0lELHJlbGF0aW9uc2hpcElELG9ialtcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiXVxyXG4gICAgICAgICAgICAsb2JqW1wiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIl0sb2JqW1wiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCJdLG9ialtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCJdKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5RWRnZUJlbmRjb250cm9sUG9pbnRzID0gZnVuY3Rpb24gKHNyY0lELHJlbGF0aW9uc2hpcElEXHJcbiAgICAsY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzLGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzLGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyxjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcykge1xyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJytzcmNJRCsnXCJdJyk7XHJcbiAgICAgICAgdmFyIGVkZ2VzPXRoZU5vZGUuY29ubmVjdGVkRWRnZXMoKS50b0FycmF5KClcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGVkZ2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgYW5FZGdlPWVkZ2VzW2ldXHJcbiAgICAgICAgICAgIGlmKGFuRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdPT1yZWxhdGlvbnNoaXBJRCl7XHJcbiAgICAgICAgICAgICAgICBpZihjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCIsY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuYWRkQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCIsY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIixjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuYWRkQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbn1cclxuXHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNhdmVMYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSxhZHROYW1lKSB7XHJcbiAgICB2YXIgbGF5b3V0RGljdD1nbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICBpZighbGF5b3V0RGljdCl7XHJcbiAgICAgICAgbGF5b3V0RGljdD1nbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdPXt9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmKHRoaXMuY29yZS5ub2RlcygpLnNpemUoKT09MCkgcmV0dXJuO1xyXG5cclxuICAgIC8vc3RvcmUgbm9kZXMgcG9zaXRpb25cclxuICAgIHRoaXMuY29yZS5ub2RlcygpLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBwb3NpdGlvbj1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICBsYXlvdXREaWN0W29uZU5vZGUuaWQoKV09W3RoaXMubnVtYmVyUHJlY2lzaW9uKHBvc2l0aW9uWyd4J10pLHRoaXMubnVtYmVyUHJlY2lzaW9uKHBvc2l0aW9uWyd5J10pXVxyXG4gICAgfSlcclxuXHJcbiAgICAvL3N0b3JlIGFueSBlZGdlIGJlbmRpbmcgcG9pbnRzIG9yIGNvbnRyb2xpbmcgcG9pbnRzXHJcblxyXG4gICAgaWYobGF5b3V0RGljdC5lZGdlcz09bnVsbCkgbGF5b3V0RGljdC5lZGdlcz17fVxyXG4gICAgdmFyIGVkZ2VFZGl0SW5zdGFuY2U9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICB2YXIgc3JjSUQ9b25lRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHNvdXJjZUlkXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc2hpcElEPW9uZUVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgIHZhciBjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHM9b25lRWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMnKVxyXG4gICAgICAgIHZhciBjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzJylcclxuICAgICAgICB2YXIgY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzPW9uZUVkZ2UuZGF0YSgnY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzJylcclxuICAgICAgICB2YXIgY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXM9b25lRWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcycpXHJcbiAgICAgICAgaWYoIWN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyAmJiAhY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmKGxheW91dERpY3QuZWRnZXNbc3JjSURdPT1udWxsKWxheW91dERpY3QuZWRnZXNbc3JjSURdPXt9XHJcbiAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdPXt9XHJcbiAgICAgICAgaWYoY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzICYmIGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cy5sZW5ndGg+MCkge1xyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzICYmIGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cy5sZW5ndGg+MCkge1xyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgICQucG9zdChcImxheW91dC9zYXZlTGF5b3V0c1wiLHtcImFkdE5hbWVcIjphZHROYW1lLFwibGF5b3V0c1wiOkpTT04uc3RyaW5naWZ5KGdsb2JhbENhY2hlLmxheW91dEpTT04pfSlcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCJ9KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubnVtYmVyUHJlY2lzaW9uID0gZnVuY3Rpb24gKG51bWJlcikge1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShudW1iZXIpKXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPG51bWJlci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgbnVtYmVyW2ldID0gdGhpcy5udW1iZXJQcmVjaXNpb24obnVtYmVyW2ldKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVtYmVyXHJcbiAgICB9ZWxzZVxyXG4gICAgcmV0dXJuIHBhcnNlRmxvYXQoZm9ybWF0dGVyLmZvcm1hdChudW1iZXIpKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuQ09TRVNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWQ9dGhpcy5jb3JlLiQoJzpzZWxlY3RlZCcpXHJcbiAgICB0aGlzLm5vUG9zaXRpb25fY29zZShzZWxlY3RlZClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmhpZGVTZWxlY3RlZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5yZW1vdmUoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0SW5ib3VuZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgdmFyIGVsZXM9dGhpcy5jb3JlLm5vZGVzKCkuZWRnZXNUbyhzZWxlY3RlZE5vZGVzKS5zb3VyY2VzKClcclxuICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICBlbGVzLnNlbGVjdCgpXHJcbiAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdE91dGJvdW5kTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICB2YXIgZWxlcz1zZWxlY3RlZE5vZGVzLmVkZ2VzVG8odGhpcy5jb3JlLm5vZGVzKCkpLnRhcmdldHMoKVxyXG4gICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIGVsZXMuc2VsZWN0KClcclxuICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYWRkQ29ubmVjdGlvbnMgPSBmdW5jdGlvbiAodGFyZ2V0Tm9kZSkge1xyXG4gICAgdmFyIHRoZUNvbm5lY3RNb2RlPXRoaXMudGFyZ2V0Tm9kZU1vZGVcclxuICAgIHZhciBzcmNOb2RlQXJyPXRoaXMuY29yZS5ub2RlcyhcIjpzZWxlY3RlZFwiKVxyXG5cclxuICAgIHZhciBwcmVwYXJhdGlvbkluZm89W11cclxuXHJcbiAgICBzcmNOb2RlQXJyLmZvckVhY2godGhlTm9kZT0+e1xyXG4gICAgICAgIHZhciBjb25uZWN0aW9uVHlwZXNcclxuICAgICAgICBpZih0aGVDb25uZWN0TW9kZT09XCJjb25uZWN0VG9cIikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZXM9dGhpcy5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlKHRoZU5vZGUuZGF0YShcIm1vZGVsSURcIiksdGFyZ2V0Tm9kZS5kYXRhKFwibW9kZWxJRFwiKSlcclxuICAgICAgICAgICAgcHJlcGFyYXRpb25JbmZvLnB1c2goe2Zyb206dGhlTm9kZSx0bzp0YXJnZXROb2RlLGNvbm5lY3Q6Y29ubmVjdGlvblR5cGVzfSlcclxuICAgICAgICB9ZWxzZSBpZih0aGVDb25uZWN0TW9kZT09XCJjb25uZWN0RnJvbVwiKSB7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25UeXBlcz10aGlzLmNoZWNrQXZhaWxhYmxlQ29ubmVjdGlvblR5cGUodGFyZ2V0Tm9kZS5kYXRhKFwibW9kZWxJRFwiKSx0aGVOb2RlLmRhdGEoXCJtb2RlbElEXCIpKVxyXG4gICAgICAgICAgICBwcmVwYXJhdGlvbkluZm8ucHVzaCh7dG86dGhlTm9kZSxmcm9tOnRhcmdldE5vZGUsY29ubmVjdDpjb25uZWN0aW9uVHlwZXN9KVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAvL1RPRE86IGNoZWNrIGlmIGl0IGlzIG5lZWRlZCB0byBwb3B1cCBkaWFsb2csIGlmIGFsbCBjb25uZWN0aW9uIGlzIGRvYWJsZSBhbmQgb25seSBvbmUgdHlwZSB0byB1c2UsIG5vIG5lZWQgdG8gc2hvdyBkaWFsb2dcclxuICAgIHRoaXMuc2hvd0Nvbm5lY3Rpb25EaWFsb2cocHJlcGFyYXRpb25JbmZvKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2hvd0Nvbm5lY3Rpb25EaWFsb2cgPSBmdW5jdGlvbiAocHJlcGFyYXRpb25JbmZvKSB7XHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIHZhciByZXN1bHRBY3Rpb25zPVtdXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCI0NTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJBZGQgY29ubmVjdGlvbnNcIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6IFwiXCJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlQ29ubmVjdGlvbnMocmVzdWx0QWN0aW9ucylcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuZGlhbG9nRGl2LmVtcHR5KClcclxuICAgIHByZXBhcmF0aW9uSW5mby5mb3JFYWNoKChvbmVSb3csaW5kZXgpPT57XHJcbiAgICAgICAgdmFyIGZyb21Ob2RlPW9uZVJvdy5mcm9tXHJcbiAgICAgICAgdmFyIHRvTm9kZT1vbmVSb3cudG9cclxuICAgICAgICB2YXIgY29ubmVjdGlvblR5cGVzPW9uZVJvdy5jb25uZWN0XHJcbiAgICAgICAgdmFyIGxhYmVsPSQoJzxsYWJlbCBzdHlsZT1cImRpc3BsYXk6YmxvY2s7bWFyZ2luLWJvdHRvbToycHhcIj48L2xhYmVsPicpXHJcbiAgICAgICAgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgIGxhYmVsLmNzcyhcImNvbG9yXCIsXCJyZWRcIilcclxuICAgICAgICAgICAgbGFiZWwuaHRtbChcIk5vIHVzYWJsZSBjb25uZWN0aW9uIHR5cGUgZnJvbSA8Yj5cIitmcm9tTm9kZS5pZCgpK1wiPC9iPiB0byA8Yj5cIit0b05vZGUuaWQoKStcIjwvYj5cIilcclxuICAgICAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPjEpeyBcclxuICAgICAgICAgICAgbGFiZWwuaHRtbChcIkZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpIFxyXG4gICAgICAgICAgICB2YXIgc3dpdGNoVHlwZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiKVxyXG4gICAgICAgICAgICBsYWJlbC5wcmVwZW5kKHN3aXRjaFR5cGVTZWxlY3Rvci5ET00pXHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25UeXBlcy5mb3JFYWNoKG9uZVR5cGU9PntcclxuICAgICAgICAgICAgICAgIHN3aXRjaFR5cGVTZWxlY3Rvci5hZGRPcHRpb24ob25lVHlwZSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgcmVzdWx0QWN0aW9ucy5wdXNoKHtmcm9tOmZyb21Ob2RlLmlkKCksdG86dG9Ob2RlLmlkKCksY29ubmVjdDpjb25uZWN0aW9uVHlwZXNbMF19KVxyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgICAgICByZXN1bHRBY3Rpb25zW2luZGV4XVsyXT1vcHRpb25UZXh0XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN3aXRjaFR5cGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPT0xKXtcclxuICAgICAgICAgICAgcmVzdWx0QWN0aW9ucy5wdXNoKHtmcm9tOmZyb21Ob2RlLmlkKCksdG86dG9Ob2RlLmlkKCksY29ubmVjdDpjb25uZWN0aW9uVHlwZXNbMF19KVxyXG4gICAgICAgICAgICBsYWJlbC5jc3MoXCJjb2xvclwiLFwiZ3JlZW5cIilcclxuICAgICAgICAgICAgbGFiZWwuaHRtbChcIkFkZCA8Yj5cIitjb25uZWN0aW9uVHlwZXNbMF0rXCI8L2I+IGNvbm5lY3Rpb24gZnJvbSA8Yj5cIitmcm9tTm9kZS5pZCgpK1wiPC9iPiB0byA8Yj5cIit0b05vZGUuaWQoKStcIjwvYj5cIikgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuZGlhbG9nRGl2LmFwcGVuZChsYWJlbClcclxuICAgIH0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jcmVhdGVDb25uZWN0aW9ucyA9IGZ1bmN0aW9uIChyZXN1bHRBY3Rpb25zKSB7XHJcbiAgICAvLyBmb3IgZWFjaCByZXN1bHRBY3Rpb25zLCBjYWxjdWxhdGUgdGhlIGFwcGVuZGl4IGluZGV4LCB0byBhdm9pZCBzYW1lIElEIGlzIHVzZWQgZm9yIGV4aXN0ZWQgY29ubmVjdGlvbnNcclxuICAgIHJlc3VsdEFjdGlvbnMuZm9yRWFjaChvbmVBY3Rpb249PntcclxuICAgICAgICB2YXIgbWF4RXhpc3RlZENvbm5lY3Rpb25OdW1iZXI9MFxyXG4gICAgICAgIHZhciBleGlzdGVkUmVsYXRpb25zPWdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVBY3Rpb24uZnJvbV1cclxuICAgICAgICBpZihleGlzdGVkUmVsYXRpb25zPT1udWxsKSBleGlzdGVkUmVsYXRpb25zPVtdXHJcbiAgICAgICAgZXhpc3RlZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgICAgIHZhciBvbmVSZWxhdGlvbklEPW9uZVJlbGF0aW9uWyckcmVsYXRpb25zaGlwSWQnXVxyXG4gICAgICAgICAgICBpZihvbmVSZWxhdGlvbltcIiR0YXJnZXRJZFwiXSE9b25lQWN0aW9uLnRvKSByZXR1cm5cclxuICAgICAgICAgICAgdmFyIGxhc3RJbmRleD0gb25lUmVsYXRpb25JRC5zcGxpdChcIjtcIikucG9wKClcclxuICAgICAgICAgICAgbGFzdEluZGV4PXBhcnNlSW50KGxhc3RJbmRleClcclxuICAgICAgICAgICAgaWYobWF4RXhpc3RlZENvbm5lY3Rpb25OdW1iZXI8PWxhc3RJbmRleCkgbWF4RXhpc3RlZENvbm5lY3Rpb25OdW1iZXI9bGFzdEluZGV4KzFcclxuICAgICAgICB9KVxyXG4gICAgICAgIG9uZUFjdGlvbi5JRGluZGV4PW1heEV4aXN0ZWRDb25uZWN0aW9uTnVtYmVyXHJcbiAgICB9KVxyXG4gICAgdmFyIGZpbmFsQWN0aW9ucz1bXVxyXG4gICAgcmVzdWx0QWN0aW9ucy5mb3JFYWNoKG9uZUFjdGlvbj0+e1xyXG4gICAgICAgIHZhciBvbmVGaW5hbEFjdGlvbj17fVxyXG4gICAgICAgIG9uZUZpbmFsQWN0aW9uW1wiJHNyY0lkXCJdPW9uZUFjdGlvbltcImZyb21cIl1cclxuICAgICAgICBvbmVGaW5hbEFjdGlvbltcIiRyZWxhdGlvbnNoaXBJZFwiXT1vbmVBY3Rpb25bXCJmcm9tXCJdK1wiO1wiK29uZUFjdGlvbltcInRvXCJdK1wiO1wiK29uZUFjdGlvbltcImNvbm5lY3RcIl0rXCI7XCIrb25lQWN0aW9uW1wiSURpbmRleFwiXVxyXG4gICAgICAgIG9uZUZpbmFsQWN0aW9uW1wib2JqXCJdPXtcclxuICAgICAgICAgICAgXCIkdGFyZ2V0SWRcIjogb25lQWN0aW9uW1widG9cIl0sXHJcbiAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcE5hbWVcIjogb25lQWN0aW9uW1wiY29ubmVjdFwiXVxyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbEFjdGlvbnMucHVzaChvbmVGaW5hbEFjdGlvbilcclxuICAgIH0pXHJcblxyXG4gICAgJC5wb3N0KFwiZWRpdEFEVC9jcmVhdGVSZWxhdGlvbnNcIix7YWN0aW9uczpKU09OLnN0cmluZ2lmeShmaW5hbEFjdGlvbnMpfSwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIHJldHVybjtcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZChkYXRhKVxyXG4gICAgICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhkYXRhKVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSA9IGZ1bmN0aW9uIChmcm9tTm9kZU1vZGVsLHRvTm9kZU1vZGVsKSB7XHJcbiAgICB2YXIgcmU9W11cclxuICAgIHZhciB2YWxpZFJlbGF0aW9uc2hpcHM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW2Zyb21Ob2RlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHRvTm9kZUJhc2VDbGFzc2VzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1t0b05vZGVNb2RlbF0uYWxsQmFzZUNsYXNzZXNcclxuICAgIGlmKHZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgZm9yKHZhciByZWxhdGlvbk5hbWUgaW4gdmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICAgICAgdmFyIHRoZVJlbGF0aW9uVHlwZT12YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25OYW1lXVxyXG4gICAgICAgICAgICBpZih0aGVSZWxhdGlvblR5cGUudGFyZ2V0PT1udWxsXHJcbiAgICAgICAgICAgICAgICAgfHwgdGhlUmVsYXRpb25UeXBlLnRhcmdldD09dG9Ob2RlTW9kZWxcclxuICAgICAgICAgICAgICAgICB8fHRvTm9kZUJhc2VDbGFzc2VzW3RoZVJlbGF0aW9uVHlwZS50YXJnZXRdIT1udWxsKSByZS5wdXNoKHJlbGF0aW9uTmFtZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zdGFydFRhcmdldE5vZGVNb2RlID0gZnVuY3Rpb24gKG1vZGUpIHtcclxuICAgIHRoaXMuY29yZS5hdXRvdW5zZWxlY3RpZnkoIHRydWUgKTtcclxuICAgIHRoaXMuY29yZS5jb250YWluZXIoKS5zdHlsZS5jdXJzb3IgPSAnY3Jvc3NoYWlyJztcclxuICAgIHRoaXMudGFyZ2V0Tm9kZU1vZGU9bW9kZTtcclxuICAgICQoZG9jdW1lbnQpLmtleWRvd24oKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT0gMjcpIHRoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkub24oJ2NsaWNrJywgKGUpPT57XHJcbiAgICAgICAgdmFyIGNsaWNrZWROb2RlID0gZS50YXJnZXQ7XHJcbiAgICAgICAgdGhpcy5hZGRDb25uZWN0aW9ucyhjbGlja2VkTm9kZSlcclxuICAgICAgICAvL2RlbGF5IGEgc2hvcnQgd2hpbGUgc28gbm9kZSBzZWxlY3Rpb24gd2lsbCBub3QgYmUgY2hhbmdlZCB0byB0aGUgY2xpY2tlZCB0YXJnZXQgbm9kZVxyXG4gICAgICAgIHNldFRpbWVvdXQoKCk9Pnt0aGlzLmNhbmNlbFRhcmdldE5vZGVNb2RlKCl9LDUwKVxyXG5cclxuICAgIH0pO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY2FuY2VsVGFyZ2V0Tm9kZU1vZGU9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMudGFyZ2V0Tm9kZU1vZGU9bnVsbDtcclxuICAgIHRoaXMuY29yZS5jb250YWluZXIoKS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XHJcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2tleWRvd24nKTtcclxuICAgIHRoaXMuY29yZS5ub2RlcygpLm9mZihcImNsaWNrXCIpXHJcbiAgICB0aGlzLmNvcmUuYXV0b3Vuc2VsZWN0aWZ5KCBmYWxzZSApO1xyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fZ3JpZD1mdW5jdGlvbihlbGVzKXtcclxuICAgIHZhciBuZXdMYXlvdXQgPSBlbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2dyaWQnLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLFxyXG4gICAgICAgIGZpdDpmYWxzZVxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fY29zZT1mdW5jdGlvbihlbGVzKXtcclxuICAgIGlmKGVsZXM9PW51bGwpIGVsZXM9dGhpcy5jb3JlLmVsZW1lbnRzKClcclxuXHJcbiAgICB2YXIgbmV3TGF5b3V0ID1lbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2Nvc2UnLFxyXG4gICAgICAgIGFuaW1hdGU6IHRydWUsXHJcbiAgICAgICAgZ3Jhdml0eToxLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlXHJcbiAgICAgICAgLGZpdDpmYWxzZVxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxuICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fY29uY2VudHJpYz1mdW5jdGlvbihlbGVzLGJveCl7XHJcbiAgICBpZihlbGVzPT1udWxsKSBlbGVzPXRoaXMuY29yZS5lbGVtZW50cygpXHJcbiAgICB2YXIgbmV3TGF5b3V0ID1lbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2NvbmNlbnRyaWMnLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLFxyXG4gICAgICAgIGZpdDpmYWxzZSxcclxuICAgICAgICBtaW5Ob2RlU3BhY2luZzo2MCxcclxuICAgICAgICBncmF2aXR5OjEsXHJcbiAgICAgICAgYm91bmRpbmdCb3g6Ym94XHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubGF5b3V0V2l0aE5vZGVQb3NpdGlvbj1mdW5jdGlvbihub2RlUG9zaXRpb24pe1xyXG4gICAgdmFyIG5ld0xheW91dCA9IHRoaXMuY29yZS5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdwcmVzZXQnLFxyXG4gICAgICAgIHBvc2l0aW9uczogbm9kZVBvc2l0aW9uLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLCAvLyB3aGV0aGVyIHRvIHRyYW5zaXRpb24gdGhlIG5vZGUgcG9zaXRpb25zXHJcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246IDUwMCwgLy8gZHVyYXRpb24gb2YgYW5pbWF0aW9uIGluIG1zIGlmIGVuYWJsZWRcclxuICAgIH0pXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHRvcG9sb2d5RE9NOyIsImNvbnN0IHNpbXBsZVRyZWU9cmVxdWlyZShcIi4vc2ltcGxlVHJlZVwiKVxyXG5jb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuXHJcbmZ1bmN0aW9uIHR3aW5zVHJlZShET00sIHNlYXJjaERPTSkge1xyXG4gICAgdGhpcy50cmVlPW5ldyBzaW1wbGVUcmVlKERPTSlcclxuICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZT17fVxyXG5cclxuICAgIHRoaXMudHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jPShnbik9PntcclxuICAgICAgICB2YXIgbW9kZWxDbGFzcz1nbi5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgdmFyIGNvbG9yQ29kZT1cImdyYXlcIlxyXG4gICAgICAgIHZhciBzaGFwZT1cImVsbGlwc2VcIlxyXG4gICAgICAgIHZhciBhdmF0YXI9bnVsbFxyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdICYmIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdW21vZGVsQ2xhc3NdKXtcclxuICAgICAgICAgICAgdmFyIHZpc3VhbEpzb24gPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdW21vZGVsQ2xhc3NdXHJcbiAgICAgICAgICAgIHZhciBjb2xvckNvZGU9IHZpc3VhbEpzb24uY29sb3IgfHwgXCJncmF5XCJcclxuICAgICAgICAgICAgdmFyIHNoYXBlPSAgdmlzdWFsSnNvbi5zaGFwZSB8fCBcImVsbGlwc2VcIlxyXG4gICAgICAgICAgICB2YXIgYXZhcnRhPSB2aXN1YWxKc29uLmF2YXJ0YSBcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGZvbnRzaXplPXtcImVsbGlwc2VcIjpcIjEzMCVcIixcInJvdW5kLXJlY3RhbmdsZVwiOlwiOTAlXCIsXCJoZXhhZ29uXCI6XCIxMjAlXCJ9W3NoYXBlXVxyXG4gICAgICAgIHNoYXBlPXtcImVsbGlwc2VcIjpcIuKXj1wiLFwicm91bmQtcmVjdGFuZ2xlXCI6XCLilolcIixcImhleGFnb25cIjpcIuKsolwifVtzaGFwZV1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgbGJsSFRNTD1cIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7Y29sb3I6XCIrY29sb3JDb2RlK1wiO2ZvbnQtc2l6ZTpcIitmb250c2l6ZStcIjtmb250LXdlaWdodDpub3JtYWw7Ym9yZGVyLXJhZGl1czogMnB4Oyc+XCIrc2hhcGUrXCI8L2xhYmVsPlwiXHJcblxyXG4gICAgICAgIGlmKGF2YXJ0YSkgbGJsSFRNTCs9XCI8aW1nIHNyYz0nXCIrYXZhcnRhK1wiJyBzdHlsZT0naGVpZ2h0OjIwcHgnLz5cIlxyXG5cclxuICAgICAgICByZXR1cm4gJChsYmxIVE1MKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzPShub2Rlc0Fycixtb3VzZUNsaWNrRGV0YWlsKT0+e1xyXG4gICAgICAgIHZhciBpbmZvQXJyPVtdXHJcbiAgICAgICAgbm9kZXNBcnIuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+e1xyXG4gICAgICAgICAgICBpbmZvQXJyLnB1c2goaXRlbS5sZWFmSW5mbylcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzZWxlY3ROb2Rlc1wiLCBpbmZvOmluZm9BcnIsIFwibW91c2VDbGlja0RldGFpbFwiOm1vdXNlQ2xpY2tEZXRhaWx9KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZT0odGhlTm9kZSk9PntcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJQYW5Ub05vZGVcIiwgaW5mbzp0aGVOb2RlLmxlYWZJbmZvfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGU9KG5vZGVJbmZvKT0+e1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6XCJzZWxlY3RHcm91cE5vZGVcIixpbmZvOm5vZGVJbmZvfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNlYXJjaEJveD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiAgcGxhY2Vob2xkZXI9XCJzZWFyY2guLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dFwiKTtcclxuICAgIHRoaXMuc2VhcmNoQm94LmNzcyh7XCJvdXRsaW5lXCI6XCJub25lXCIsXCJoZWlnaHRcIjpcIjEwMCVcIixcIndpZHRoXCI6XCIxMDAlXCJ9KSBcclxuICAgIHNlYXJjaERPTS5hcHBlbmQodGhpcy5zZWFyY2hCb3gpXHJcblxyXG4gICAgdmFyIGhpZGVPclNob3dFbXB0eUdyb3VwPSQoJzxidXR0b24gc3R5bGU9XCJoZWlnaHQ6MjBweDtib3JkZXI6bm9uZTtwYWRkaW5nLWxlZnQ6MnB4XCIgY2xhc3M9XCJ3My1ibG9jayB3My10aW55IHczLWhvdmVyLXJlZCB3My1hbWJlclwiPkhpZGUgRW1wdHkgTW9kZWxzPC9idXR0b24+JylcclxuICAgIHNlYXJjaERPTS5hcHBlbmQoaGlkZU9yU2hvd0VtcHR5R3JvdXApXHJcbiAgICBET00uY3NzKFwidG9wXCIsXCI1MHB4XCIpXHJcbiAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJzaG93XCIpXHJcbiAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZihoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIpPT1cInNob3dcIil7XHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcImhpZGVcIilcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAudGV4dChcIlNob3cgRW1wdHkgTW9kZWxzXCIpXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5vcHRpb25zLmhpZGVFbXB0eUdyb3VwPXRydWVcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwic2hvd1wiKVxyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC50ZXh0KFwiSGlkZSBFbXB0eSBNb2RlbHNcIilcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMudHJlZS5vcHRpb25zLmhpZGVFbXB0eUdyb3VwXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2gob25lR3JvdXBOb2RlPT57b25lR3JvdXBOb2RlLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXAoKX0pXHJcbiAgICB9KVxyXG5cclxuXHJcbiAgICB0aGlzLnNlYXJjaEJveC5rZXl1cCgoZSk9PntcclxuICAgICAgICBpZihlLmtleUNvZGUgPT0gMTMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgYU5vZGUgPSB0aGlzLnRyZWUuc2VhcmNoVGV4dCgkKGUudGFyZ2V0KS52YWwoKSlcclxuICAgICAgICAgICAgaWYoYU5vZGUhPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgYU5vZGUucGFyZW50R3JvdXBOb2RlLmV4cGFuZCgpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUuc2VsZWN0TGVhZk5vZGUoYU5vZGUpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUuc2Nyb2xsVG9MZWFmTm9kZShhTm9kZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFREYXRhc291cmNlQ2hhbmdlX3JlcGxhY2VcIikgdGhpcy5BRFREYXRhc291cmNlQ2hhbmdlX3JlcGxhY2UobXNnUGF5bG9hZC5xdWVyeSwgbXNnUGF5bG9hZC50d2lucyxtc2dQYXlsb2FkLkFEVEluc3RhbmNlRG9lc05vdENoYW5nZSlcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVERhdGFzb3VyY2VDaGFuZ2VfYXBwZW5kXCIpIHRoaXMuQURURGF0YXNvdXJjZUNoYW5nZV9hcHBlbmQobXNnUGF5bG9hZC5xdWVyeSwgbXNnUGF5bG9hZC50d2lucylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiKSB0aGlzLmRyYXdUd2luc0FuZFJlbGF0aW9ucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbHNDaGFuZ2VcIikgdGhpcy5yZWZyZXNoTW9kZWxzKG1zZ1BheWxvYWQubW9kZWxzKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpblwiKSB0aGlzLmRyYXdPbmVUd2luKG1zZ1BheWxvYWQudHdpbkluZm8pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luc1wiKSB7XHJcbiAgICAgICAgbXNnUGF5bG9hZC50d2luc0luZm8uZm9yRWFjaChvbmVUd2luSW5mbz0+e3RoaXMuZHJhd09uZVR3aW4ob25lVHdpbkluZm8pfSlcclxuICAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInR3aW5zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVR3aW5zKG1zZ1BheWxvYWQudHdpbklEQXJyKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiKXtcclxuICAgICAgICBpZighbXNnUGF5bG9hZC5zcmNNb2RlbElEKXsgLy8gY2hhbmdlIG1vZGVsIGNsYXNzIHZpc3VhbGl6YXRpb25cclxuICAgICAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaChnbj0+e2duLnJlZnJlc2hOYW1lKCl9KVxyXG4gICAgICAgIH0gXHJcbiAgICB9XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZGVsZXRlVHdpbnM9ZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHR3aW5JREFyci5mb3JFYWNoKHR3aW5JRD0+e1xyXG4gICAgICAgIHRoaXMudHJlZS5kZWxldGVMZWFmTm9kZSh0d2luSUQpXHJcbiAgICB9KVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnJlZnJlc2hNb2RlbHM9ZnVuY3Rpb24obW9kZWxzRGF0YSl7XHJcbiAgICAvL2RlbGV0ZSBhbGwgZ3JvdXAgbm9kZXMgb2YgZGVsZXRlZCBtb2RlbHNcclxuICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goKGdub2RlKT0+e1xyXG4gICAgICAgIGlmKG1vZGVsc0RhdGFbZ25vZGUubmFtZV09PW51bGwpe1xyXG4gICAgICAgICAgICAvL2RlbGV0ZSB0aGlzIGdyb3VwIG5vZGVcclxuICAgICAgICAgICAgZ25vZGUuZGVsZXRlU2VsZigpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAvL3RoZW4gYWRkIGFsbCBncm91cCBub2RlcyB0aGF0IHRvIGJlIGFkZGVkXHJcbiAgICB2YXIgY3VycmVudE1vZGVsTmFtZUFycj1bXVxyXG4gICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ25vZGUpPT57Y3VycmVudE1vZGVsTmFtZUFyci5wdXNoKGdub2RlLm5hbWUpfSlcclxuXHJcbiAgICB2YXIgYWN0dWFsTW9kZWxOYW1lQXJyPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiBtb2RlbHNEYXRhKSBhY3R1YWxNb2RlbE5hbWVBcnIucHVzaChpbmQpXHJcbiAgICBhY3R1YWxNb2RlbE5hbWVBcnIuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS50b0xvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi50b0xvd2VyQ2FzZSgpKSB9KTtcclxuXHJcbiAgICBmb3IodmFyIGk9MDtpPGFjdHVhbE1vZGVsTmFtZUFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICBpZihpPGN1cnJlbnRNb2RlbE5hbWVBcnIubGVuZ3RoICYmIGN1cnJlbnRNb2RlbE5hbWVBcnJbaV09PWFjdHVhbE1vZGVsTmFtZUFycltpXSkgY29udGludWVcclxuICAgICAgICAvL290aGVyd2lzZSBhZGQgdGhpcyBncm91cCB0byB0aGUgdHJlZVxyXG4gICAgICAgIHZhciBuZXdHcm91cD10aGlzLnRyZWUuaW5zZXJ0R3JvdXBOb2RlKG1vZGVsc0RhdGFbYWN0dWFsTW9kZWxOYW1lQXJyW2ldXSxpKVxyXG4gICAgICAgIG5ld0dyb3VwLnNocmluaygpXHJcbiAgICAgICAgY3VycmVudE1vZGVsTmFtZUFyci5zcGxpY2UoaSwgMCwgYWN0dWFsTW9kZWxOYW1lQXJyW2ldKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuQURURGF0YXNvdXJjZUNoYW5nZV9hcHBlbmQ9ZnVuY3Rpb24odHdpblF1ZXJ5U3RyLHR3aW5zRGF0YSl7XHJcbiAgICBpZiAodHdpbnNEYXRhICE9IG51bGwpIHRoaXMuYXBwZW5kQWxsVHdpbnModHdpbnNEYXRhKVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvYWxsVHdpbnNJbmZvXCIsIHsgcXVlcnk6IHR3aW5RdWVyeVN0ciB9LCAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICBpZihkYXRhPT1cIlwiKSByZXR1cm47XHJcbiAgICAgICAgICAgIGRhdGEuZm9yRWFjaCgob25lTm9kZSk9PntnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tvbmVOb2RlW1wiJGR0SWRcIl1dID0gb25lTm9kZX0pO1xyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZEFsbFR3aW5zKGRhdGEpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5BRFREYXRhc291cmNlQ2hhbmdlX3JlcGxhY2U9ZnVuY3Rpb24odHdpblF1ZXJ5U3RyLHR3aW5zRGF0YSxBRFRJbnN0YW5jZURvZXNOb3RDaGFuZ2Upe1xyXG4gICAgdmFyIHRoZVRyZWU9IHRoaXMudHJlZTtcclxuXHJcbiAgICBpZiAoQURUSW5zdGFuY2VEb2VzTm90Q2hhbmdlKSB7XHJcbiAgICAgICAgLy9rZWVwIGFsbCBncm91cCBub2RlIGFzIG1vZGVsIGlzIHRoZSBzYW1lLCBvbmx5IGZldGNoIGFsbCBsZWFmIG5vZGUgYWdhaW5cclxuICAgICAgICAvL3JlbW92ZSBhbGwgbGVhZiBub2Rlc1xyXG4gICAgICAgIHRoaXMudHJlZS5jbGVhckFsbExlYWZOb2RlcygpXHJcbiAgICAgICAgaWYgKHR3aW5zRGF0YSAhPSBudWxsKSB0aGlzLnJlcGxhY2VBbGxUd2lucyh0d2luc0RhdGEpXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL2FsbFR3aW5zSW5mb1wiLCB7IHF1ZXJ5OiB0d2luUXVlcnlTdHIgfSwgKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W107XHJcbiAgICAgICAgICAgICAgICBkYXRhLmZvckVhY2goKG9uZU5vZGUpPT57Z2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbb25lTm9kZVtcIiRkdElkXCJdXSA9IG9uZU5vZGV9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVwbGFjZUFsbFR3aW5zKGRhdGEpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhlVHJlZS5yZW1vdmVBbGxOb2RlcygpXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5tb2RlbElETWFwVG9OYW1lKSBkZWxldGUgdGhpcy5tb2RlbElETWFwVG9OYW1lW2lkXVxyXG4gICAgICAgIC8vcXVlcnkgdG8gZ2V0IGFsbCBtb2RlbHNcclxuICAgICAgICAkLmdldChcInF1ZXJ5QURUL2xpc3RNb2RlbHNcIiwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdXHJcbiAgICAgICAgICAgIHZhciB0bXBOYW1lQXJyID0gW11cclxuICAgICAgICAgICAgdmFyIHRtcE5hbWVUb09iaiA9IHt9XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdPT1udWxsKSBkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl09ZGF0YVtpXVtcIkBpZFwiXVxyXG4gICAgICAgICAgICAgICAgaWYoJC5pc1BsYWluT2JqZWN0KGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdKSBkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl09ZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXT1KU09OLnN0cmluZ2lmeShkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZih0bXBOYW1lVG9PYmpbZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdXSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9yZXBlYXRlZCBtb2RlbCBkaXNwbGF5IG5hbWVcclxuICAgICAgICAgICAgICAgICAgICBkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl09ZGF0YVtpXVtcIkBpZFwiXVxyXG4gICAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGVsSURNYXBUb05hbWVbZGF0YVtpXVtcIkBpZFwiXV0gPSBkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdG1wTmFtZUFyci5wdXNoKGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICAgICAgICAgIHRtcE5hbWVUb09ialtkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1dID0gZGF0YVtpXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRtcE5hbWVBcnIuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS50b0xvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi50b0xvd2VyQ2FzZSgpKSB9KTtcclxuICAgICAgICAgICAgdG1wTmFtZUFyci5mb3JFYWNoKG1vZGVsTmFtZSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3R3JvdXAgPSB0aGVUcmVlLmFkZEdyb3VwTm9kZSh0bXBOYW1lVG9PYmpbbW9kZWxOYW1lXSlcclxuICAgICAgICAgICAgICAgIG5ld0dyb3VwLnNocmluaygpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuY2xlYXJBbGxNb2RlbHMoKTtcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMoZGF0YSlcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hbmFseXplKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHdpbnNEYXRhICE9IG51bGwpIHRoaXMucmVwbGFjZUFsbFR3aW5zKHR3aW5zRGF0YSlcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkLnBvc3QoXCJxdWVyeUFEVC9hbGxUd2luc0luZm9cIiwgeyBxdWVyeTogdHdpblF1ZXJ5U3RyIH0sIChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLmZvckVhY2goKG9uZU5vZGUpPT57Z2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbb25lTm9kZVtcIiRkdElkXCJdXSA9IG9uZU5vZGV9KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcGxhY2VBbGxUd2lucyhkYXRhKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZHJhd1R3aW5zQW5kUmVsYXRpb25zPSBmdW5jdGlvbihkYXRhKXtcclxuICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKXtcclxuICAgICAgICAgICAgdmFyIG9uZVR3aW49b25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2RyYXcgdGhvc2Uga25vd24gdHdpbnMgZnJvbSB0aGUgcmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHR3aW5zSW5mbz17fVxyXG4gICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0luZm89b25lU2V0W1wicmVsYXRpb25zaGlwc1wiXVxyXG4gICAgICAgIHJlbGF0aW9uc0luZm8uZm9yRWFjaCgob25lUmVsYXRpb24pPT57XHJcbiAgICAgICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bc3JjSURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1t0YXJnZXRJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0gICAgXHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgdG1wQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiB0d2luc0luZm8pIHRtcEFyci5wdXNoKHR3aW5zSW5mb1t0d2luSURdKVxyXG4gICAgdG1wQXJyLmZvckVhY2gob25lVHdpbj0+e3RoaXMuZHJhd09uZVR3aW4ob25lVHdpbil9KVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmRyYXdPbmVUd2luPSBmdW5jdGlvbih0d2luSW5mbyl7XHJcbiAgICB2YXIgZ3JvdXBOYW1lPXRoaXMubW9kZWxJRE1hcFRvTmFtZVt0d2luSW5mb1tcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXV1cclxuICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLHR3aW5JbmZvLFwic2tpcFJlcGVhdFwiKVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmFwcGVuZEFsbFR3aW5zPSBmdW5jdGlvbihkYXRhKXtcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIC8vY2hlY2sgaWYgYW55IGN1cnJlbnQgbGVhZiBub2RlIGRvZXMgbm90IGhhdmUgc3RvcmVkIG91dGJvdW5kIHJlbGF0aW9uc2hpcCBkYXRhIHlldFxyXG4gICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ05vZGUpPT57XHJcbiAgICAgICAgZ05vZGUuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChsZWFmTm9kZT0+e1xyXG4gICAgICAgICAgICB2YXIgbm9kZUlkPWxlYWZOb2RlLmxlYWZJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW25vZGVJZF09PW51bGwpIHR3aW5JREFyci5wdXNoKG5vZGVJZClcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhcHBlbmRBbGxUd2luc1wiLGluZm86ZGF0YX0pXHJcbiAgICBmb3IodmFyIGk9MDtpPGRhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGdyb3VwTmFtZT10aGlzLm1vZGVsSURNYXBUb05hbWVbZGF0YVtpXVtcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXV1cclxuICAgICAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGdyb3VwTmFtZSxkYXRhW2ldLFwic2tpcFJlcGVhdFwiKVxyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGRhdGFbaV1bXCIkZHRJZFwiXSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmZldGNoQWxsUmVsYXRpb25zaGlwcyh0d2luSURBcnIpXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUucmVwbGFjZUFsbFR3aW5zPSBmdW5jdGlvbihkYXRhKXtcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJlcGxhY2VBbGxUd2luc1wiLGluZm86ZGF0YX0pXHJcbiAgICBmb3IodmFyIGk9MDtpPGRhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGdyb3VwTmFtZT10aGlzLm1vZGVsSURNYXBUb05hbWVbZGF0YVtpXVtcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXV1cclxuICAgICAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGdyb3VwTmFtZSxkYXRhW2ldKVxyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGRhdGFbaV1bXCIkZHRJZFwiXSlcclxuICAgIH1cclxuICAgIHRoaXMuZmV0Y2hBbGxSZWxhdGlvbnNoaXBzKHR3aW5JREFycilcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5mZXRjaEFsbFJlbGF0aW9uc2hpcHM9IGFzeW5jIGZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHZhciBkYXRhPWF3YWl0IHRoaXMuZmV0Y2hQYXJ0aWFsUmVsYXRpb25zaGlwcyhzbWFsbEFycilcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSBjb250aW51ZTtcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEpIC8vc3RvcmUgdGhlbSBpbiBnbG9iYWwgYXZhaWxhYmxlIGFycmF5XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd0FsbFJlbGF0aW9uc1wiLGluZm86ZGF0YX0pXHJcbiAgICB9XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZmV0Y2hQYXJ0aWFsUmVsYXRpb25zaGlwcz0gYXN5bmMgZnVuY3Rpb24oSURBcnIpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL2FsbFJlbGF0aW9uc2hpcHNcIix7YXJyOklEQXJyfSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHR3aW5zVHJlZTsiXX0=

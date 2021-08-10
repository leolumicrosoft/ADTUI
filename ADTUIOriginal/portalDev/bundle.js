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
        closeButton.on("click",()=>{
            if(this.previousSelectedADT==null) this.useFilterToReplace()
            this.closeDialog()
        })
    
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
        filterList.css({"overflow-x":"hidden","overflow-y":"auto","height":"340px", "border-right":"solid 1px lightgray"})
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


        if(this.previousSelectedADT!=null){
            switchADTSelector.triggerOptionValue(this.previousSelectedADT)
        }else{
            switchADTSelector.triggerOptionIndex(0)
        }

    });
}

adtInstanceSelectionDialog.prototype.setADTInstance=function(selectedADT){
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
        if(filterName=="ALL") oneFilter.trigger("click")
        
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
},{"./globalCache":4,"./simpleConfirmDialog":12,"./simpleSelectMenu":13}],2:[function(require,module,exports){
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
    var saveAsNewBtn=$('<button class="w3-button w3-green w3-hover-light-green">Save New Layout</button>')
    this.DOM.append(saveAsNewBtn)
    saveAsNewBtn.on("click",()=>{this.saveIntoLayout(nameInput.val())})


    if(!$.isEmptyObject(globalCache.layoutJSON)){
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
},{"./globalCache":4,"./simpleConfirmDialog":12,"./simpleSelectMenu":13}],3:[function(require,module,exports){
const modelAnalyzer = require("./modelAnalyzer");
const globalCache = require("./globalCache")

function floatInfoWindow() {
    if(!this.DOM){
        this.DOM=$('<div class="w3-card" style="padding:10px; position:absolute;z-index:101;min-height:120px"></div>')
        this.hideSelf()
        this.DOM.css("background-color","rgba(255, 255, 255, 0.9)")
        $('body').append(this.DOM)
    }
}

floatInfoWindow.prototype.hideSelf=function(msgPayload){
    this.DOM.hide()
    this.DOM.css("width","0px") 
}
floatInfoWindow.prototype.showSelf=function(msgPayload){
    this.DOM.css("width","295px")
    this.DOM.show()
}

floatInfoWindow.prototype.rxMessage=function(msgPayload){   
    if(msgPayload.message=="topologyMouseOut"){
        this.hideSelf()
    }else if(msgPayload.message=="showInfoHoveredEle"){
        if(!globalCache.showFloatInfoPanel) return;
        this.DOM.empty()
        
        var arr=msgPayload.info;
        if(arr==null || arr.length==0)  return;
        this.DOM.css("left","-2000px") //it is always outside of browser so it wont block mouse and cause mouse out
        this.showSelf()
        
        var documentBodyWidth=$('body').width()

        var singleElementInfo=arr[0];
        if(singleElementInfo["$dtId"]){// select a node
            this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
            var modelName=singleElementInfo['$metadata']['$model']
            
            if(modelAnalyzer.DTDLModels[modelName]){
                this.drawEditable(this.DOM,modelAnalyzer.DTDLModels[modelName].editableProperties,singleElementInfo,[])
            }
            this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px")
        }else if(singleElementInfo["$sourceId"]){
            this.drawStaticInfo(this.DOM,{
                "$sourceId":singleElementInfo["$sourceId"],
                "$targetId":singleElementInfo["$targetId"],
                "$relationshipName":singleElementInfo["$relationshipName"]
            },"1em","13px")
            this.drawStaticInfo(this.DOM,{
                "$relationshipId":singleElementInfo["$relationshipId"]
            },"1em","10px")
            var relationshipName=singleElementInfo["$relationshipName"]
            var sourceModel=singleElementInfo["sourceModel"]
            
            this.drawEditable(this.DOM,this.getRelationShipEditableProperties(relationshipName,sourceModel),singleElementInfo,[])
            this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
        }

        var screenXY= msgPayload.screenXY
        var windowLeft=screenXY.x+50

        if(windowLeft+this.DOM.outerWidth()+10>documentBodyWidth) {
            windowLeft=documentBodyWidth-this.DOM.outerWidth()-10
        }
        var windowTop = screenXY.y-this.DOM.outerHeight()-50
        if(windowTop<5) windowTop=5
        this.DOM.css({"left":windowLeft+"px", "top":windowTop+"px"})
    }
}

floatInfoWindow.prototype.getRelationShipEditableProperties=function(relationshipName,sourceModel){
    if(!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
    return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
}

floatInfoWindow.prototype.drawStaticInfo=function(parent,jsonInfo,paddingTop,fontSize){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div class='w3-dark-gray' style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em;font-size:10px'>"+ind+"</div></label>")
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

floatInfoWindow.prototype.drawEditable=function(parent,jsonInfo,originElementInfo,pathArr){
    if(jsonInfo==null) return;
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; margin-right:5px'>"+ind+"</div></label>")
        parent.append(keyDiv)
        
        keyDiv.css("padding-top",".3em") 

        var contentDOM=$("<label style='padding-top:.2em'></label>")
        var newPath=pathArr.concat([ind])
        if(typeof(jsonInfo[ind])==="object" && !Array.isArray(jsonInfo[ind])) {
            keyDiv.children(":first").css("font-weight","bold")
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath)
        }else {
            keyDiv.children(":first").addClass("w3-lime")
            var val=this.searchValue(originElementInfo,newPath)
            if(val==null){
                contentDOM.css({"color":"gray","font-size":"9px"})
                contentDOM.text("[empty]")
            }else contentDOM.text(val)
        }
        keyDiv.append(contentDOM)
    }
}

floatInfoWindow.prototype.searchValue=function(originElementInfo,pathArr){
    if(pathArr.length==0) return null;
    var theJson=originElementInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]
        theJson=theJson[key]
        if(theJson==null) return null;
    }
    return theJson //it should be the final value
}



module.exports = new floatInfoWindow();
},{"./globalCache":4,"./modelAnalyzer":9}],4:[function(require,module,exports){
function globalCache(){
    this.storedOutboundRelationships = {}
    this.storedTwins = {}

    this.currentLayoutName=null
    this.layoutJSON={}

    this.selectedADT=null;

    this.visualDefinition={}

    this.showFloatInfoPanel=true
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
},{}],5:[function(require,module,exports){
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
    

    this.drawButtons(null)

    this.selectedObjects=null;
}

infoPanel.prototype.rxMessage=function(msgPayload){   
    if(msgPayload.message=="ADTDatasourceDialog_closed"){
        if(!this.continerDOM.is(":visible")) {
            this.continerDOM.show()
            this.continerDOM.addClass("w3-animate-right")
        }
    }else if(msgPayload.message=="showInfoSelectedNodes" || msgPayload.message=="showInfoHoveredEle"){
        if (globalCache.showFloatInfoPanel && msgPayload.message=="showInfoHoveredEle") return; //the floating info window will show mouse over element information, do not change info panel content in this case
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
                singleElementInfo=globalCache.storedTwins[singleElementInfo["$dtId"]]
                this.drawButtons("singleNode")
                this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
                var modelName=singleElementInfo['$metadata']['$model']
                
                if(modelAnalyzer.DTDLModels[modelName]){
                    this.drawEditable(this.DOM,modelAnalyzer.DTDLModels[modelName].editableProperties,singleElementInfo,[])
                }
                this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px")
            }else if(singleElementInfo["$sourceId"]){
                var arr=globalCache.storedOutboundRelationships[singleElementInfo["$sourceId"]]
                for(var i=0;i<arr.length;i++){
                    if(arr[i]['$relationshipId']==singleElementInfo["$relationshipId"]){
                        singleElementInfo=arr[i]
                        break;
                    }
                }
                this.drawButtons("singleRelationship")
                this.drawStaticInfo(this.DOM,{
                    "$sourceId":singleElementInfo["$sourceId"],
                    "$targetId":singleElementInfo["$targetId"],
                    "$relationshipName":singleElementInfo["$relationshipName"]
                },"1em","13px")
                this.drawStaticInfo(this.DOM,{
                    "$relationshipId":singleElementInfo["$relationshipId"]
                },"1em","10px")
                
                var relationshipName=singleElementInfo["$relationshipName"]
                var sourceModel=singleElementInfo["sourceModel"]
                
                this.drawEditable(this.DOM,this.getRelationShipEditableProperties(relationshipName,sourceModel),singleElementInfo,[])
                this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
            }
        }else if(arr.length>1){
            this.drawButtons("multiple")
            this.drawMultipleObj()
        }
    }else if(msgPayload.message=="showInfoGroupNode"){
        this.DOM.empty()
        var modelID = msgPayload.info["@id"]
        globalCache.showingCreateTwinModelID=modelID
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
    var impBtn=$('<button class="w3-bar-item w3-button w3-blue"><i class="fas fa-cloud-upload-alt"></i></button>')
    var actualImportTwinsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    if(selectType!=null){
        var refreshBtn=$('<button class="w3-bar-item w3-button w3-black"><i class="fas fa-sync-alt"></i></button>')
        var expBtn=$('<button class="w3-bar-item w3-button w3-green"><i class="fas fa-cloud-download-alt"></i></button>')  
        this.DOM.append(refreshBtn,expBtn,impBtn,actualImportTwinsBtn)
        refreshBtn.on("click",()=>{this.refreshInfomation()})
        expBtn.on("click",()=>{
            //find out the twins in selection and their connections (filter both src and target within the selected twins)
            //and export them
            this.exportSelected()
        })    
    } else {
        this.DOM.html("<a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to draw box and select multiple twins in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press ctrl+z and ctrl+y to undo/redo in topology view; ctrl+s to save layout</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press shift or ctrl key to select multiple twins in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:12px;padding-bottom:5px'>Import twins data by clicking button below</a>")
        this.DOM.append(impBtn, actualImportTwinsBtn)
    }
    
    impBtn.on("click",()=>{actualImportTwinsBtn.trigger('click');})
    actualImportTwinsBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        await this.readTwinsFilesContentAndImport(files)
        actualImportTwinsBtn.val("")
    })
    if(selectType==null) return;

    if(selectType=="singleRelationship"){
        var delBtn =  $('<button style="width:104px" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        this.DOM.append(delBtn)
        delBtn.on("click",()=>{this.deleteSelected()})
    }else if(selectType=="singleNode" || selectType=="multiple"){
        var delBtn = $('<button style="width:104px" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
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
        hideBtn.on("click",()=>{
            var twinIDArr=[]
            this.selectedObjects.forEach(ele=>{if(ele['$dtId']) twinIDArr.push(ele['$dtId'])})
            this.broadcastMessage({"message": "hideSelectedNodes","twinIDArr":twinIDArr})
        })
    }
    if (numOfNode > 1) {
        //some additional buttons when select multiple items
        this.drawAdvanceAlignmentButtons()
    }
}

infoPanel.prototype.drawAdvanceAlignmentButtons=async function(){
    var label=$("<label class='w3-gray' style='display:block;margin-top:5px;width:20%;text-align:center;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>Arrange</label>") 
    this.DOM.append(label) 
    var alignButtonsTable=$("<table style='margin:0 auto'><tr><td></td><td></td><td></td></tr><tr><td></td><td style='text-align:center;font-weight:bold;color:darkGray'>ALIGN</td><td></td></tr><tr><td></td><td></td><td></td></tr></table>")
    this.DOM.append(alignButtonsTable)
    var alignTopButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-up"></i></button>')
    var alignLeftButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-left"></i></button>')
    var alignRightButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-right"></i></button>')
    var alignBottomButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-down"></i></button>')
    alignButtonsTable.find("td").eq(1).append(alignTopButton)
    alignButtonsTable.find("td").eq(3).append(alignLeftButton)
    alignButtonsTable.find("td").eq(5).append(alignRightButton)
    alignButtonsTable.find("td").eq(7).append(alignBottomButton)


    var arrangeTable=$("<table style='margin:0 auto'><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></table>")
    this.DOM.append(arrangeTable)

    var distributeHButton = $('<button class="w3-button w3-border"><i class="fas fa-ellipsis-h fa-lg"></i></button>') 
    var distributeVButton = $('<button class="w3-button w3-border"><i class="fas fa-ellipsis-v fa-lg"></i></button>') 
    var leftRotateButton = $('<button class="w3-button w3-border"><i class="fas fa-undo-alt fa-lg"></i></button>') 
    var rightRotateButton = $('<button class="w3-button w3-border"><i class="fas fa-redo-alt fa-lg"></i></button>') 
    var mirrorHButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-arrows-alt-h"></i></button>') 
    var mirrorVButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-arrows-alt-v"></i></button>')
    var expandButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-expand-arrows-alt"></i></button>') 
    var compressButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-compress-arrows-alt"></i></button>')
    
    arrangeTable.find("td").eq(0).append(distributeHButton)
    arrangeTable.find("td").eq(1).append(distributeVButton)
    arrangeTable.find("td").eq(2).append(leftRotateButton)
    arrangeTable.find("td").eq(3).append(rightRotateButton)
    arrangeTable.find("td").eq(4).append(mirrorHButton)
    arrangeTable.find("td").eq(5).append(mirrorVButton)
    arrangeTable.find("td").eq(6).append(expandButton)
    arrangeTable.find("td").eq(7).append(compressButton)


    alignTopButton.on("click", (e) => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "top" })
        $(document.activeElement).blur()
    })
    alignLeftButton.on("click", () => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "left" })
        $(document.activeElement).blur()
    })
    alignRightButton.on("click", () => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "right" })
        $(document.activeElement).blur()
    })
    alignBottomButton.on("click", () => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "bottom" })
        $(document.activeElement).blur()
    })

    distributeHButton.on("click", () => {
        this.broadcastMessage({ "message": "distributeSelectedNode", direction: "horizontal" })
        $(document.activeElement).blur()
    })
    distributeVButton.on("click", () => {
        this.broadcastMessage({ "message": "distributeSelectedNode", direction: "vertical" })
        $(document.activeElement).blur()
    })
    leftRotateButton.on("click", () => {
        this.broadcastMessage({ "message": "rotateSelectedNode", direction: "left" })
        $(document.activeElement).blur()
    })
    rightRotateButton.on("click", () => {
        this.broadcastMessage({ "message": "rotateSelectedNode", direction: "right" })
        $(document.activeElement).blur()
    })
    mirrorHButton.on("click", () => {
        this.broadcastMessage({ "message": "mirrorSelectedNode", direction: "horizontal" })
        $(document.activeElement).blur()
    })
    mirrorVButton.on("click", () => {
        this.broadcastMessage({ "message": "mirrorSelectedNode", direction: "vertical" })
        $(document.activeElement).blur()
    })
    expandButton.on("click", () => {
        this.broadcastMessage({ "message": "dimensionSelectedNode", direction: "expand" })
        $(document.activeElement).blur()
    })
    compressButton.on("click", () => {
        this.broadcastMessage({ "message": "dimensionSelectedNode", direction: "compress" })
        $(document.activeElement).blur()
    })
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
    for (var i = 0; i< files.length; i++) {
        var f=files[i]
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

    //for ADT UI standalone tool, translate all twin ID by its displayName
    var IDtoName={}
    importTwins.forEach(oneTwin=>{
        var displayName=oneTwin["displayName"] || oneTwin["$dtId"]
        IDtoName[oneTwin["$dtId"]]=displayName
        oneTwin["$dtId"]=displayName
        delete oneTwin["displayName"]
    })
    importRelations.forEach(oneRelation=>{
        oneRelation["$srcId"]=IDtoName[oneRelation["$srcId"]]||oneRelation["$srcId"]
        oneRelation["obj"]["$targetId"]=IDtoName[oneRelation["obj"]["$targetId"]]||oneRelation["obj"]["$targetId"]
    })


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
        { width: "400px" },
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
        if(this.selectedObjects.length==1) this.rxMessage({ "message": "showInfoSelectedNodes", info: this.selectedObjects })
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
        var keyDiv= $("<label style='display:block'><div class='w3-dark-gray' style='background-color:#f6f6f6;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em;font-size:10px'>"+ind+"</div></label>")
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
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; margin-right:5px'>"+ind+"</div></label>")
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
            keyDiv.children(":first").addClass("w3-lime")
            this.drawDropdownOption(contentDOM,newPath,jsonInfo[ind],isNewTwin,originElementInfo)
        }else if(typeof(jsonInfo[ind])==="object") {
            keyDiv.children(":first").css("font-weight","bold")
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath,isNewTwin)
        }else {
            keyDiv.children(":first").addClass("w3-lime")
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
    if (["double", "float", "integer", "long"].includes(dataType)) newVal = Number(newVal)
    if (dataType == "boolean") {
        if (newVal == "true") newVal = true
        else newVal = false
    }

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
},{"./globalCache":4,"./modelAnalyzer":9,"./simpleConfirmDialog":12,"./simpleSelectMenu":13}],6:[function(require,module,exports){
$('document').ready(function(){
    const mainUI=require("./mainUI.js")    
});
},{"./mainUI.js":8}],7:[function(require,module,exports){
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

    this.floatInfoBtn=$('<a class="w3-bar-item w3-button w3-amber" style="height:100%;font-size:80%" href="#"><span class="fa-stack fa-xs"><i class="fas fa-circle fa-stack-2x fa-inverse"></i><i class="fas fa-info fa-stack-1x w3-text-amber"></i></span></a>')

    this.switchLayoutSelector=new simpleSelectMenu("Layout")

    $("#mainToolBar").empty()
    $("#mainToolBar").append(this.switchADTInstanceBtn,this.modelIOBtn,this.showForgeViewBtn,this.showGISViewBtn
        ,this.switchLayoutSelector.DOM,this.editLayoutBtn,this.floatInfoBtn)

    this.switchADTInstanceBtn.on("click",()=>{ adtInstanceSelectionDialog.popup() })
    this.modelIOBtn.on("click",()=>{ modelManagerDialog.popup() })
    this.editLayoutBtn.on("click",()=>{ editLayoutDialog.popup() })

    this.floatInfoBtn.on("click",()=>{
        if(globalCache.showFloatInfoPanel) globalCache.showFloatInfoPanel=false
        else globalCache.showFloatInfoPanel=true
        if(!globalCache.showFloatInfoPanel){
            this.floatInfoBtn.removeClass("w3-amber")
            this.floatInfoBtn.html('<span class="fa-stack fa-xs"><i class="fas fa-ban fa-stack-2x fa-inverse"></i><i class="fas fa-info fa-stack-1x fa-inverse"></i></span>')
        }else{
            this.floatInfoBtn.addClass("w3-amber")
            this.floatInfoBtn.html('<span class="fa-stack fa-xs"><i class="fas fa-circle fa-stack-2x fa-inverse"></i><i class="fas fa-info fa-stack-1x w3-text-amber"></i></span>')
        }
    })


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
    }else if(msgPayload.message=="popupLayoutEditing"){
        editLayoutDialog.popup()
    }
}

module.exports = new mainToolbar();
},{"./adtInstanceSelectionDialog":1,"./editLayoutDialog":2,"./globalCache":4,"./modelManagerDialog":11,"./simpleSelectMenu":13}],8:[function(require,module,exports){
'use strict';
const topologyDOM=require("./topologyDOM.js")
const twinsTree=require("./twinsTree")
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")
const modelEditorDialog = require("./modelEditorDialog")
const editLayoutDialog = require("./editLayoutDialog")
const mainToolbar = require("./mainToolbar")
const infoPanel= require("./infoPanel")
const floatInfoWindow=require("./floatInfoWindow")

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
         this.mainToolbar,this.topologyInstance,this.infoPanel,floatInfoWindow]

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
        , east__maxSize: 0.5 // 50% of layout width
        , center__minWidth: 100
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
},{"./adtInstanceSelectionDialog":1,"./editLayoutDialog":2,"./floatInfoWindow":3,"./infoPanel":5,"./mainToolbar":7,"./modelEditorDialog":10,"./modelManagerDialog":11,"./topologyDOM.js":15,"./twinsTree":16}],9:[function(require,module,exports){
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


modelAnalyzer.prototype.listModelsForDeleteModel=function(modelID){
    var childModelIDs=[]
    for(var aID in this.DTDLModels){
        var aModel=this.DTDLModels[aID]
        if(aModel.allBaseClasses && aModel.allBaseClasses[modelID]) childModelIDs.push(aModel["@id"])
    }
    return childModelIDs
}

modelAnalyzer.prototype.deleteModel_notBaseClassOfAny=function(modelID){
    return new Promise((resolve, reject) => {
        $.post("editADT/deleteModel",{"model":modelID}, (data)=> {
            if(data==""){//successful
                resolve()
            }else{ //error happens
                reject(data)
            }
        });
    })
}

modelAnalyzer.prototype.deleteModel=async function(modelID,funcAfterEachSuccessDelete,funcAfterFail,completeFunc){
    var relatedModelIDs=this.listModelsForDeleteModel(modelID)
    var modelLevel=[]
    relatedModelIDs.forEach(oneID=>{
        var checkModel=this.DTDLModels[oneID]
        modelLevel.push({"modelID":oneID,"level":Object.keys(checkModel.allBaseClasses).length})
    })
    modelLevel.push({"modelID":modelID,"level":0})
    modelLevel.sort(function (a, b) {return b["level"]-a["level"] });
    
    for(var i=0;i<modelLevel.length;i++){
        var aModelID=modelLevel[i].modelID
        try{
            await this.deleteModel_notBaseClassOfAny(aModelID)
            var modelName=this.DTDLModels[aModelID].displayName
            delete this.DTDLModels[aModelID]
            if(funcAfterEachSuccessDelete) funcAfterEachSuccessDelete(aModelID,modelName)
        }catch(e){
            var deletedModels=[]
            var alertStr="Delete model is incomplete. Deleted Model:"
            for(var j=0;j<i;j++){
                alertStr+= modelLevel[j].modelID+" "
                deletedModels.push(modelLevel[j].modelID)
            } 
            alertStr+=". Fail to delete "+aModelID+". Error is "+e
            if(funcAfterFail) funcAfterFail(deletedModels)
            alert(e)
        }
    }
    if(completeFunc) completeFunc()
}

module.exports = new modelAnalyzer();
},{}],10:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog=require("./simpleConfirmDialog")

function modelEditorDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:100" class="w3-card-2"></div>')
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
    this.importButton=importButton
    buttonRow.append(importButton)

    importButton.on("click", () => {
        var currentModelID=this.dtdlobj["@id"]
        if(modelAnalyzer.DTDLModels[currentModelID]==null) this.importModelArr([this.dtdlobj])
        else this.replaceModel()
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

modelEditorDialog.prototype.replaceModel=function(){
    //delete the old same name model, then create it again
    var currentModelID=this.dtdlobj["@id"]

    var relatedModelIDs=modelAnalyzer.listModelsForDeleteModel(currentModelID)

    var dialogStr = (relatedModelIDs.length == 0) ? ("Twins will be impact under model \"" + currentModelID + "\"") :
        (currentModelID + " is base model of " + relatedModelIDs.join(", ") + ". Twins under these models will be impact.")
    var confirmDialogDiv = new simpleConfirmDialog()
    confirmDialogDiv.show(
        { width: "350px" },
        {
            title: "Warning"
            , content: dialogStr
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        confirmDialogDiv.close();
                        this.confirmReplaceModel(currentModelID)
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

modelEditorDialog.prototype.importModelArr=function(modelToBeImported,forReplacing,afterFailure){
    $.post("editADT/importModels", { "models": JSON.stringify(modelToBeImported) }, (data) => {
        if (data == "") {//successful
            if(forReplacing) alert("Model " + this.dtdlobj["displayName"] + " is modified successfully!")
            else {
                alert("Model " + this.dtdlobj["displayName"] + " is created!")
            }
            this.broadcastMessage({ "message": "ADTModelEdited" })
            modelAnalyzer.addModels(modelToBeImported)//add so immediatley the list can show the new models
            this.popup() //refresh content
        } else { //error happens
            if(afterFailure) afterFailure()
            alert(data)
        }
    });
}

modelEditorDialog.prototype.confirmReplaceModel=function(modelID){
    var relatedModelIDs=modelAnalyzer.listModelsForDeleteModel(modelID)
    var backupModels=[]
    relatedModelIDs.forEach(oneID=>{
        backupModels.push(JSON.parse(modelAnalyzer.DTDLModels[oneID]["original"]))
    })
    backupModels.push(this.dtdlobj)
    var backupModelsStr=encodeURIComponent(JSON.stringify(backupModels))

    var funcAfterFail=(deletedModelIDs)=>{
        var pom = $("<a></a>")
        pom.attr('href', 'data:text/plain;charset=utf-8,' + backupModelsStr);
        pom.attr('download', "exportModelsAfterFailedOperation.json");
        pom[0].click()
    }
    var funcAfterEachSuccessDelete = (eachDeletedModelID,eachModelName) => {}
    
    var completeFunc=()=>{ 
        //import all the models again
        this.importModelArr(backupModels,"forReplacing",funcAfterFail)
    }

    //not complete delete will still invoke completeFunc
    modelAnalyzer.deleteModel(modelID,funcAfterEachSuccessDelete,funcAfterFail,completeFunc)
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
    //it will refresh the generated DTDL sample, it will also change the import button to show "Create" or "Modify"
    var currentModelID=this.dtdlobj["@id"]
    if(modelAnalyzer.DTDLModels[currentModelID]==null) this.importButton.text("Create")
    else this.importButton.text("Modify")


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
    

    ptypeSelector.addOptionArr(["string","float","integer","Enum","Object","double","boolean","date","dateTime","duration","long","time"])
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
                "name": aVal.replace(" ",""), //remove all the space in name
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
    var domainInput=$('<input type="text" style="outline:none;display:inline;width:88px;padding:4px"  placeholder="Namespace"/>').addClass("w3-input w3-border");
    var modelIDInput=$('<input type="text" style="outline:none;display:inline;width:132px;padding:4px"  placeholder="ModelID"/>').addClass("w3-input w3-border");
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
},{"./modelAnalyzer":9,"./simpleConfirmDialog":12,"./simpleSelectMenu":13}],11:[function(require,module,exports){
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
    var modelEditorBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Create/Modify Model</button>')
    var exportModelBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Export All Models</button>')
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
        modelEditorDialog.popup()
    })

    exportModelBtn.on("click", () => {
        var modelArr=[]
        for(var modelID in modelAnalyzer.DTDLModels) modelArr.push(JSON.parse(modelAnalyzer.DTDLModels[modelID]["original"]))
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
        this.refreshModelTreeLabel()
        actualImportPicBtn.val("")
    })

    clearAvartaBtn.on("click", ()=>{
        var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
        if(visualJson[modelID]) delete visualJson[modelID].avarta 
        if(this.avartaImg) this.avartaImg.removeAttr('src');
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"noAvarta":true })
        this.refreshModelTreeLabel()
    });


    delBtn.on("click",()=>{
        var relatedModelIDs =modelAnalyzer.listModelsForDeleteModel(modelID)
        var dialogStr=(relatedModelIDs.length==0)? ("This will DELETE model \"" + modelID + "\""): 
            (modelID + " is base model of "+relatedModelIDs.join(", ")+". Delete all of them?")
        var confirmDialogDiv = new simpleConfirmDialog()
        confirmDialogDiv.show(
            { width: "350px" },
            {
                title: "Warning"
                , content: dialogStr
                , buttons: [
                    {
                        colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                            confirmDialogDiv.close();
                            this.confirmDeleteModel(modelID)
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

modelManagerDialog.prototype.confirmDeleteModel=function(modelID){
    var funcAfterEachSuccessDelete = (eachDeletedModelID,eachModelName) => {
        delete this.models[eachModelName]
        this.tree.deleteLeafNode(eachModelName)
        if (globalCache.visualDefinition[globalCache.selectedADT] && globalCache.visualDefinition[globalCache.selectedADT][eachDeletedModelID]) {
            delete globalCache.visualDefinition[globalCache.selectedADT][eachDeletedModelID]
        }
    }
    var completeFunc=()=>{ 
        this.broadcastMessage({ "message": "ADTModelsChange", "models":this.models})
        this.panelCard.empty()
        this.saveVisualDefinition()
    }

    //even not completely successful deleting, it will still invoke completeFunc
    modelAnalyzer.deleteModel(modelID,funcAfterEachSuccessDelete,completeFunc,completeFunc)
}

modelManagerDialog.prototype.refreshModelTreeLabel=function(){
    if(this.tree.selectedNodes.length>0) this.tree.selectedNodes[0].redrawLabel()
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
    var definedDimensionRatio=null
    var definedEdgeWidth=null
    var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
    if(relatinshipName==null){
        if(visualJson && visualJson[modelID] && visualJson[modelID].color) definedColor=visualJson[modelID].color
        if(visualJson && visualJson[modelID] && visualJson[modelID].shape) definedShape=visualJson[modelID].shape
        if(visualJson && visualJson[modelID] && visualJson[modelID].dimensionRatio) definedDimensionRatio=visualJson[modelID].dimensionRatio
    }else{
        if(visualJson && visualJson[modelID]
             && visualJson[modelID]["rels"]
              && visualJson[modelID]["rels"][relatinshipName]){
                  if(visualJson[modelID]["rels"][relatinshipName].color) definedColor=visualJson[modelID]["rels"][relatinshipName].color
                  if(visualJson[modelID]["rels"][relatinshipName].shape) definedShape=visualJson[modelID]["rels"][relatinshipName].shape
                  if(visualJson[modelID]["rels"][relatinshipName].edgeWidth) definedEdgeWidth=visualJson[modelID]["rels"][relatinshipName].edgeWidth
              }
    }

    var colorSelector=$('<select class="w3-border" style="outline:none;width:85px"></select>')
    containerDiv.append(colorSelector)
    var colorArr=["darkGray","Black","LightGray","Red","Green","Blue","Bisque","Brown","Coral","Crimson","DodgerBlue","Gold"]
    colorArr.forEach((oneColorCode)=>{
        var anOption=$("<option value='"+oneColorCode+"'>"+oneColorCode+"▧</option>")
        colorSelector.append(anOption)
        anOption.css("color",oneColorCode)
    })
    if(definedColor!=null) {
        colorSelector.val(definedColor)
        colorSelector.css("color",definedColor)
    }else{
        colorSelector.css("color","darkGray")
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
            this.refreshModelTreeLabel()
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
    if(definedShape!=null) shapeSelector.val(definedShape)
    
    shapeSelector.change((eve)=>{
        var selectShape=eve.target.value
        if (!globalCache.visualDefinition[globalCache.selectedADT])
            globalCache.visualDefinition[globalCache.selectedADT] = {}
        var visualJson = globalCache.visualDefinition[globalCache.selectedADT]

        if(!visualJson[modelID]) visualJson[modelID]={}
        if(!relatinshipName) {
            visualJson[modelID].shape=selectShape
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"shape":selectShape })
            this.refreshModelTreeLabel()
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].shape=selectShape
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"shape":selectShape })
        }
        this.saveVisualDefinition()
    })


    var sizeAdjustSelector = $('<select class="w3-border" style="outline:none;width:110px"></select>')
    if(relatinshipName==null){
        for(var f=0.2;f<2;f+=0.2){
            var val=f.toFixed(1)+""
            sizeAdjustSelector.append($("<option value="+val+">dimension*"+val+"</option>"))
        }
        if(definedDimensionRatio!=null) sizeAdjustSelector.val(definedDimensionRatio)
        else sizeAdjustSelector.val("1.0")
    }else{
        sizeAdjustSelector.css("width","80px")
        for(var f=0.5;f<=4;f+=0.5){
            var val=f.toFixed(1)+""
            sizeAdjustSelector.append($("<option value="+val+">width *"+val+"</option>"))
        }
        if(definedEdgeWidth!=null) sizeAdjustSelector.val(definedEdgeWidth)
        else sizeAdjustSelector.val("2.0")
    }
    containerDiv.append(sizeAdjustSelector)

    
    sizeAdjustSelector.change((eve)=>{
        var chooseVal=eve.target.value
        if (!globalCache.visualDefinition[globalCache.selectedADT])
            globalCache.visualDefinition[globalCache.selectedADT] = {}
        var visualJson = globalCache.visualDefinition[globalCache.selectedADT]

        if(!relatinshipName) {
            if(!visualJson[modelID]) visualJson[modelID]={}
            visualJson[modelID].dimensionRatio=chooseVal
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"dimensionRatio":chooseVal })
            this.saveVisualDefinition()
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].edgeWidth=chooseVal
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"edgeWidth":chooseVal })
            this.saveVisualDefinition()
        }
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

        var label=$("<label class='w3-lime' style='display:inline;font-size:9px;padding:2px'></label>")
        label.text("Relationship")
        parentDom.append(label)
        if(validRelationships[ind].target){
            var label1=$("<label class='w3-lime' style='display:inline;font-size:9px;padding:2px;margin-left:2px'></label>")
            label1.text(validRelationships[ind].target)
            parentDom.append(label1)
        }

        
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

        if(Array.isArray(jsonInfo[ind])){
            var contentDOM=$("<label class='w3-dark-gray' ></label>")
            contentDOM.text("enum")
            contentDOM.css({"fontSize":"9px","padding":'2px'})
            keyDiv.append(contentDOM)

            var valueArr=[]
            jsonInfo[ind].forEach(ele=>{valueArr.push(ele.enumValue)})
            var label1=$("<label class='w3-dark-gray' ></label>")
            label1.css({"fontSize":"9px","padding":'2px',"margin-left":"2px"})
            label1.text(valueArr.join())
            keyDiv.append(label1)
        }else if(typeof(jsonInfo[ind])==="object") {
            var contentDOM=$("<label></label>")
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.fillEditableProperties(jsonInfo[ind],contentDOM)
            keyDiv.append(contentDOM)
        }else {
            var contentDOM=$("<label class='w3-dark-gray' ></label>")
            contentDOM.text(jsonInfo[ind])
            contentDOM.css({"fontSize":"9px","padding":'2px'})
            keyDiv.append(contentDOM)
        }
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
    for (var i = 0; i< files.length; i++) {
        var f=files[i]
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
    this.panelCard.empty()
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

            this.tree.options.leafNodeIconFunc=(ln)=>{
                var modelClass=ln.leafInfo["@id"]
                var colorCode="darkGray"
                var shape="ellipse"
                var avarta = null
                var dimension=20;
                if(globalCache.visualDefinition[globalCache.selectedADT] && globalCache.visualDefinition[globalCache.selectedADT][modelClass]){
                    var visualJson =globalCache.visualDefinition[globalCache.selectedADT][modelClass]
                    var colorCode= visualJson.color || "darkGray"
                    var shape=  visualJson.shape || "ellipse"
                    var avarta = visualJson.avarta
                    if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
                }
                var iconDOM = $("<div style='width:"+dimension+"px;height:"+dimension+"px;float:left;position:relative'></div>")
                var imgSrc = encodeURIComponent(this.shapeSvg(shape, colorCode))
                iconDOM.append($("<img src='data:image/svg+xml;utf8," + imgSrc + "'></img>"))
                if (avarta) {
                    var avartaimg = $("<img style='position:absolute;left:0px;width:60%;margin:20%' src='" + avarta + "'></img>")
                    iconDOM.append(avartaimg)
                }
                return iconDOM
            }

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

modelManagerDialog.prototype.shapeSvg=function(shape,color){
    if(shape=="ellipse"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><circle cx="50" cy="50" r="50"  fill="'+color+'"/></svg>'
    }else if(shape=="hexagon"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"  fill="'+color+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+color+'" /></svg>'
    }
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
},{"./globalCache":4,"./modelAnalyzer":9,"./modelEditorDialog":10,"./simpleConfirmDialog":12,"./simpleTree":14}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
'use strict';
function simpleTree(DOM,options){
    this.DOM=DOM
    this.groupNodes=[] //each group header is one node
    this.selectedNodes=[];
    this.options=options || {}
    this.lastClickedNode=null;
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
    this.lastClickedNode=null
    this.groupNodes.forEach((gNode)=>{
        gNode.listDOM.empty()
        gNode.childLeafNodes.length=0
        gNode.refreshName()
    })
}

simpleTree.prototype.getAllLeafNodeArr=function(){
    var allLeaf=[]
    this.groupNodes.forEach(gn=>{
        allLeaf=allLeaf.concat(gn.childLeafNodes)
    })
    return allLeaf;
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
    this.lastClickedNode=null
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
    this.lastClickedNode=null
    gnode.deleteSelf()
}

simpleTree.prototype.deleteLeafNode=function(nodeName){
    this.lastClickedNode=null
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
    var newArr=[].concat(this.selectedNodes)
    newArr.push(leafNode)
    this.selectLeafNodeArr(newArr)
}
simpleTree.prototype.addNodeArrayToSelection=function(arr){
    var newArr = this.selectedNodes
    var filterArr=arr.filter((item) => newArr.indexOf(item) < 0)
    newArr = newArr.concat(filterArr)
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
    var nameDiv=$("<div style='display:inline;padding-left:5px;padding-right:3px;vertical-align:middle'></div>")
    nameDiv.text(this.name)
    
    if(this.childLeafNodes.length>0) lblColor="yellowgreen"
    else var lblColor="darkGray" 
    this.headerDOM.css("font-weight","bold")

    if(this.parentTree.options.groupNodeIconFunc){
        var iconLabel=this.parentTree.options.groupNodeIconFunc(this)
        this.headerDOM.append(iconLabel)
        var rowHeight=iconLabel.height()
        nameDiv.css("line-height",rowHeight+"px")
    }
    
    var numberlabel=$("<label style='display:inline;background-color:"+lblColor
        +";color:white;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>"+this.childLeafNodes.length+"</label>")
    this.headerDOM.append(nameDiv,numberlabel) 
    
    this.checkOptionHideEmptyGroup()
}

simpleTreeGroupNode.prototype.checkOptionHideEmptyGroup=function(){
    if (this.parentTree.options.hideEmptyGroup && this.childLeafNodes.length == 0) {
        this.shrink()
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
    this.headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align w3-border-bottom"></button>')
    this.refreshName()
    this.listDOM=$('<div class="w3-container w3-hide w3-border w3-padding-16"></div>')

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
    if(this.listDOM) this.listDOM.addClass("w3-show")
}

simpleTreeGroupNode.prototype.shrink=function(){
    if(this.listDOM) this.listDOM.removeClass("w3-show")
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

simpleTreeLeafNode.prototype.clickSelf=function(mouseClickDetail){
    this.parentGroupNode.parentTree.lastClickedNode=this;
    this.parentGroupNode.parentTree.selectLeafNode(this,mouseClickDetail)
}


simpleTreeLeafNode.prototype.createLeafNodeDOM=function(){
    this.DOM=$('<button class="w3-button w3-white" style="display:block;text-align:left;width:98%"></button>')
    this.redrawLabel()
    var clickF=(e)=>{
        this.highlight();
        var clickDetail=e.detail
        if (e.ctrlKey) {
            if(this.parentGroupNode.parentTree.options.noMultipleSelectAllowed){
                this.clickSelf()
                return;
            }
            this.parentGroupNode.parentTree.appendLeafNodeToSelection(this)
            this.parentGroupNode.parentTree.lastClickedNode=this;
        }else if(e.shiftKey){
            if(this.parentGroupNode.parentTree.options.noMultipleSelectAllowed){
                this.clickSelf()
                return;
            }
            if(this.parentGroupNode.parentTree.lastClickedNode==null){
                this.clickSelf()
            }else{
                var allLeafNodeArr=this.parentGroupNode.parentTree.getAllLeafNodeArr()
                var index1 = allLeafNodeArr.indexOf(this.parentGroupNode.parentTree.lastClickedNode)
                var index2 = allLeafNodeArr.indexOf(this)
                if(index1==-1 || index2==-1){
                    this.clickSelf()
                }else{
                    //select all leaf between
                    var lowerI= Math.min(index1,index2)
                    var higherI= Math.max(index1,index2)
                    
                    var middleArr=allLeafNodeArr.slice(lowerI,higherI)                  
                    middleArr.push(allLeafNodeArr[higherI])
                    this.parentGroupNode.parentTree.addNodeArrayToSelection(middleArr)
                }
            }
        }else{
            this.clickSelf(clickDetail)
        }
    }
    this.DOM.on("click",(e)=>{clickF(e)})

    this.DOM.on("dblclick",(e)=>{
        this.parentGroupNode.parentTree.dblClickNode(this)
    })
}

simpleTreeLeafNode.prototype.redrawLabel=function(){
    this.DOM.empty()
    var nameDiv=$("<div style='display:inline;padding-left:5px;padding-right:3px;vertical-align:middle'></div>")
    if(this.parentGroupNode.parentTree.options.leafNodeIconFunc){
        var iconLabel=this.parentGroupNode.parentTree.options.leafNodeIconFunc(this)
        this.DOM.append(iconLabel)
        var rowHeight=iconLabel.height()
        nameDiv.css("line-height",rowHeight+"px")
    }
    nameDiv.text(this.name)
    this.DOM.append(nameDiv)
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
},{}],15:[function(require,module,exports){
'use strict';

const modelAnalyzer = require("./modelAnalyzer");
const simpleSelectMenu = require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache = require("./globalCache")


function topologyDOM(DOM){
    this.DOM=DOM
    this.defaultNodeSize=30
    this.nodeSizeModelAdjustmentRatio={}
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
                'source-arrow-color': 'red',
                'line-fill':"linear-gradient",
                'line-gradient-stop-colors':['cyan', 'magenta', 'yellow'],
                'line-gradient-stop-positions':['0%','70%','100%']
            }},
            {selector: 'node:selected',
            style: {
                'border-color':"red",
                'border-width':2,
                'background-fill':'radial-gradient',
                'background-gradient-stop-colors':['cyan', 'magenta', 'yellow'],
                'background-gradient-stop-positions':['0%','50%','60%']
            }},
            {selector: 'node.hover',
            style: {
                'background-blacken':0.5
            }}
            ,{selector: 'edge.hover',
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

        for (var modelID in this.nodeSizeModelAdjustmentRatio) {
            var newDimension=Math.ceil(this.nodeSizeModelAdjustmentRatio[modelID]*dimension)
            this.core.style()
                .selector('node[modelID = "' + modelID + '"]')
                .style({ width:newDimension ,height:newDimension })
                .update()
        }

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

    var ur = this.core.undoRedo({isDebug: false});
    this.ur=ur    
    this.core.trigger("zoom")
    this.setKeyDownFunc()
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
    this.broadcastMessage({ "message": "showInfoHoveredEle", "info": [info],"screenXY":this.convertPosition(e.position.x,e.position.y) })
}

topologyDOM.prototype.convertPosition=function(x,y){
    var vpExtent=this.core.extent()
    var screenW=this.DOM.width()
    var screenH=this.DOM.height()
    var screenX = (x-vpExtent.x1)/(vpExtent.w)*screenW + this.DOM.offset().left
    var screenY=(y-vpExtent.y1)/(vpExtent.h)*screenH+ this.DOM.offset().top
    return {x:screenX,y:screenY}
}

topologyDOM.prototype.mouseOutFunction= function (e) {
    if(!globalCache.showFloatInfoPanel){ //since floating window is used for mouse hover element info, so info panel never chagne before, that is why there is no need to restore back the info panel information at mouseout
        if(globalCache.showingCreateTwinModelID){
            this.broadcastMessage({ "message": "showInfoGroupNode", "info": {"@id":globalCache.showingCreateTwinModelID} })
        }else{
            this.selectFunction()
        }
    }
    
    this.broadcastMessage({ "message": "topologyMouseOut"})

    if(this.lastHoverTarget){
        this.lastHoverTarget.removeClass("hover")
        this.lastHoverTarget=null;
    } 

}

topologyDOM.prototype.selectFunction = function () {
    var arr = this.core.$(":selected")
    var re = []
    arr.forEach((ele) => { re.push(ele.data().originalInfo) })
    globalCache.showingCreateTwinModelID=null; 
    this.broadcastMessage({ "message": "showInfoSelectedNodes", info: re })

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

topologyDOM.prototype.updateModelTwinDimension=function(modelID,dimensionRatio){
    this.nodeSizeModelAdjustmentRatio[modelID]=parseFloat(dimensionRatio)
    this.core.trigger("zoom")
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
topologyDOM.prototype.updateRelationshipWidth=function(srcModelID,relationshipName,edgeWidth){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)})
        .update()   
    this.core.style()
        .selector('edge:selected[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)+1,'line-color': 'red'})
        .update()   
    this.core.style()
        .selector('edge.hover[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)+2})
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
    var curDimension= twin.width()
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
    var layoutName=globalCache.currentLayoutName
    if(layoutName!=null){
        var layoutDetail= globalCache.layoutJSON[layoutName]
        if(layoutDetail) this.applyNewLayoutWithUndo(layoutDetail,this.getCurrentLayoutDetail())
    }

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
        if(visualJson[modelID].dimensionRatio) this.updateModelTwinDimension(modelID,visualJson[modelID].dimensionRatio)
        if(visualJson[modelID].rels){
            for(var relationshipName in visualJson[modelID].rels){
                if(visualJson[modelID]["rels"][relationshipName].color){
                    this.updateRelationshipColor(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].color)
                }
                if(visualJson[modelID]["rels"][relationshipName].shape){
                    this.updateRelationshipShape(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].shape)
                }
                if(visualJson[modelID]["rels"][relationshipName].edgeWidth){
                    this.updateRelationshipWidth(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].edgeWidth)
                }
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
        this.core.nodes().unselect()
        this.core.edges().unselect()
        this.drawTwins([msgPayload.twinInfo],"animation")
        var nodeInfo= msgPayload.twinInfo;
        var nodeName= nodeInfo["$dtId"]
        var topoNode= this.core.nodes("#"+nodeName)
        if(topoNode){
            var position=topoNode.renderedPosition()
            this.core.panBy({x:-position.x+200,y:-position.y+200})
            topoNode.select()
            this.selectFunction()
        }
    }else if(msgPayload.message=="addNewTwins") {
        this.drawTwins(msgPayload.twinsInfo,"animation")
    }else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="showInfoSelectedNodes"){ //from selecting twins in the twintree
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
            else if(msgPayload.edgeWidth) this.updateRelationshipWidth(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.edgeWidth)
        } 
        else{
            if(msgPayload.color) this.updateModelTwinColor(msgPayload.modelID,msgPayload.color)
            else if(msgPayload.shape) this.updateModelTwinShape(msgPayload.modelID,msgPayload.shape)
            else if(msgPayload.avarta) this.updateModelAvarta(msgPayload.modelID,msgPayload.avarta)
            else if(msgPayload.noAvarta)  this.updateModelAvarta(msgPayload.modelID,null)
            else if(msgPayload.dimensionRatio)  this.updateModelTwinDimension(msgPayload.modelID,msgPayload.dimensionRatio)
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
    else if (msgPayload.message == "layoutChange") {
        var layoutName = globalCache.currentLayoutName
        if(layoutName=="[NA]"){
            //select all visible nodes and do a COSE layout, clean all bend edge line as well
            this.core.edges().forEach(oneEdge=>{
                oneEdge.removeClass('edgebendediting-hasbendpoints')
                oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
                oneEdge.data("cyedgebendeditingWeights",[])
                oneEdge.data("cyedgebendeditingDistances",[])
                oneEdge.data("cyedgecontroleditingWeights",[])
                oneEdge.data("cyedgecontroleditingDistances",[])
            })
            this.noPosition_cose()
        }else if (layoutName != null) {
            var layoutDetail = globalCache.layoutJSON[layoutName]
            if (layoutDetail) this.applyNewLayoutWithUndo(layoutDetail, this.getCurrentLayoutDetail())
        }
    }else if(msgPayload.message=="alignSelectedNode") this.alignSelectedNodes(msgPayload.direction)
    else if(msgPayload.message=="distributeSelectedNode") this.distributeSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="rotateSelectedNode") this.rotateSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="mirrorSelectedNode") this.mirrorSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="dimensionSelectedNode") this.dimensionSelectedNode(msgPayload.direction)
}

topologyDOM.prototype.dimensionSelectedNode = function (direction) {
    var ratio=1.2
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var boundary= selectedNodes.boundingBox({includeLabels :false,includeOverlays :false })
    var centerX=boundary["x1"]+boundary["w"]/2
    var centerY=boundary["y1"]+boundary["h"]/2
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        var xoffcenter=curPos["x"]-centerX
        var yoffcenter=curPos["y"]-centerY
        if(direction=="expand") newLayout[nodeID]=[centerX+xoffcenter*ratio,centerY+yoffcenter*ratio]
        else if(direction=="compress") newLayout[nodeID]=[centerX+xoffcenter/ratio,centerY+yoffcenter/ratio]
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.mirrorSelectedNode = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var boundary= selectedNodes.boundingBox({includeLabels :false,includeOverlays :false })
    var centerX=boundary["x1"]+boundary["w"]/2
    var centerY=boundary["y1"]+boundary["h"]/2
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        var xoffcenter=curPos["x"]-centerX
        var yoffcenter=curPos["y"]-centerY
        if(direction=="horizontal") newLayout[nodeID]=[centerX-xoffcenter,curPos['y']]
        else if(direction=="vertical") newLayout[nodeID]=[curPos['x'],centerY-yoffcenter]
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.rotateSelectedNode = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var boundary= selectedNodes.boundingBox({includeLabels :false,includeOverlays :false })
    var centerX=boundary["x1"]+boundary["w"]/2
    var centerY=boundary["y1"]+boundary["h"]/2
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        var xoffcenter=curPos["x"]-centerX
        var yoffcenter=curPos["y"]-centerY
        if(direction=="left") newLayout[nodeID]=[centerX+yoffcenter,centerY-xoffcenter]
        else if(direction=="right") newLayout[nodeID]=[centerX-yoffcenter,centerY+xoffcenter]
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.distributeSelectedNode = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<3) return;
    var numArr=[]
    var oldLayout={}
    var layoutForSort=[]
    selectedNodes.forEach(oneNode=>{
        var position=oneNode.position()
        if(direction=="vertical") numArr.push(position['y'])
        else if(direction=="horizontal") numArr.push(position['x'])
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        layoutForSort.push({id:nodeID,x:curPos['x'],y:curPos['y']})
    })

    if(direction=="vertical") layoutForSort.sort(function (a, b) {return a["y"]-b["y"] })
    else if(direction=="horizontal") layoutForSort.sort(function (a, b) {return a["x"]-b["x"] })
    
    var minV=Math.min(...numArr)
    var maxV=Math.max(...numArr)
    if(minV==maxV) return;
    var gap=(maxV-minV)/(selectedNodes.size()-1)
    var newLayout={}
    if(direction=="vertical") var curV=layoutForSort[0]["y"]
    else if(direction=="horizontal") curV=layoutForSort[0]["x"]
    for(var i=0;i<layoutForSort.length;i++){
        var oneNodeInfo=layoutForSort[i]
        if(i==0|| i==layoutForSort.length-1){
            newLayout[oneNodeInfo.id]=[oneNodeInfo['x'],oneNodeInfo['y']]
            continue
        }
        curV+=gap;
        if(direction=="vertical") newLayout[oneNodeInfo.id]=[oneNodeInfo['x'],curV]
        else if(direction=="horizontal") newLayout[oneNodeInfo.id]=[curV,oneNodeInfo['y']]
    }
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.alignSelectedNodes = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var numArr=[]
    selectedNodes.forEach(oneNode=>{
        var position=oneNode.position()
        if(direction=="top"|| direction=="bottom") numArr.push(position['y'])
        else if(direction=="left"|| direction=="right") numArr.push(position['x'])
    })
    var targetX=null
    var targetY=null
    if(direction=="top") var targetY= Math.min(...numArr)
    else if(direction=="bottom") var targetY= Math.max(...numArr)
    if(direction=="left") var targetX= Math.min(...numArr)
    else if(direction=="right") var targetX= Math.max(...numArr)
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        newLayout[nodeID]=[curPos['x'],curPos['y']]
        if(targetX!=null) newLayout[nodeID][0]=targetX
        if(targetY!=null) newLayout[nodeID][1]=targetY
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.redrawBasedOnLayoutDetail = function (layoutDetail,onlyAdjustNodePosition) {
    //remove all bending edge 
    if(!onlyAdjustNodePosition){
        this.core.edges().forEach(oneEdge=>{
            oneEdge.removeClass('edgebendediting-hasbendpoints')
            oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
            oneEdge.data("cyedgebendeditingWeights",[])
            oneEdge.data("cyedgebendeditingDistances",[])
            oneEdge.data("cyedgecontroleditingWeights",[])
            oneEdge.data("cyedgecontroleditingDistances",[])
        })
    }
    
    
    if(layoutDetail==null) return;
    
    var storedPositions={}
    for(var ind in layoutDetail){
        if(ind == "edges") continue
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

topologyDOM.prototype.applyNewLayoutWithUndo = function (newLayoutDetail,oldLayoutDetail,onlyAdjustNodePosition) {
    //store current layout for undo operation
    this.ur.action( "changeLayout"
        , (arg)=>{
            this.redrawBasedOnLayoutDetail(arg.newLayoutDetail,arg.onlyAdjustNodePosition)        
            return arg
        }
        , (arg)=>{
            this.redrawBasedOnLayoutDetail(arg.oldLayoutDetail,arg.onlyAdjustNodePosition)
            return arg
        }
    )
    this.ur.do("changeLayout"
        , { firstTime: true, "newLayoutDetail": newLayoutDetail, "oldLayoutDetail": oldLayoutDetail,"onlyAdjustNodePosition":onlyAdjustNodePosition}
    )
}

topologyDOM.prototype.applyEdgeBendcontrolPoints = function (srcID,relationshipID
    ,cyedgebendeditingWeights,cyedgebendeditingDistances,cyedgecontroleditingWeights,cyedgecontroleditingDistances) {
        var theNode=this.core.filter('[id = "'+srcID+'"]');
        if(theNode.length==0) return;
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



topologyDOM.prototype.getCurrentLayoutDetail = function () {
    var layoutDict={"edges":{}}
    if(this.core.nodes().size()==0) return layoutDict;
    //store nodes position
    this.core.nodes().forEach(oneNode=>{
        var position=oneNode.position()
        layoutDict[oneNode.id()]=[this.numberPrecision(position['x']),this.numberPrecision(position['y'])]
    })

    //store any edge bending points or controling points
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
    return layoutDict;
}

topologyDOM.prototype.saveLayout = async function (layoutName,adtName) {
    var layoutDict=globalCache.layoutJSON[layoutName]
    if(!layoutDict){
        layoutDict=globalCache.layoutJSON[layoutName]={}
    }
    if(layoutDict["edges"]==null) layoutDict["edges"]={}
    
    var showingLayout=this.getCurrentLayoutDetail()
    var showingEdgesLayout= showingLayout["edges"]
    delete showingLayout["edges"]
    for(var ind in showingLayout) layoutDict[ind]=showingLayout[ind]
    for(var ind in showingEdgesLayout) layoutDict["edges"][ind]=showingEdgesLayout[ind]

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
    return parseFloat(number.toFixed(3))
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
        resultActions.push(this.createOneConnectionAdjustRow(oneRow,confirmDialogDiv))
    })
}

topologyDOM.prototype.createOneConnectionAdjustRow = function (oneRow,confirmDialogDiv) {
    var returnObj={}
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
        returnObj["from"]=fromNode.id()
        returnObj["to"]=toNode.id()
        returnObj["connect"]=connectionTypes[0]
        switchTypeSelector.callBack_clickOption=(optionText,optionValue)=>{
            returnObj["connect"]=optionText
            switchTypeSelector.changeName(optionText)
        }
        switchTypeSelector.triggerOptionIndex(0)
    }else if(connectionTypes.length==1){
        returnObj["from"]=fromNode.id()
        returnObj["to"]=toNode.id()
        returnObj["connect"]=connectionTypes[0]
        label.css("color","green")
        label.html("Add <b>"+connectionTypes[0]+"</b> connection from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
    }
    confirmDialogDiv.dialogDiv.append(label)
    return returnObj;
}


topologyDOM.prototype.createConnections = function (resultActions) {
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    var finalActions=[]
    resultActions.forEach(oneAction=>{
        var oneFinalAction={}
        oneFinalAction["$srcId"]=oneAction["from"]
        oneFinalAction["$relationshipId"]=uuidv4();
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

topologyDOM.prototype.setKeyDownFunc=function(includeCancelConnectOperation){
    $(document).on("keydown",  (e)=>{
        if (e.ctrlKey && e.target.nodeName === 'BODY'){
            if (e.which === 90)   this.ur.undo();
            else if (e.which === 89)    this.ur.redo();
            else if(e.which===83){
                this.broadcastMessage({"message":"popupLayoutEditing"})
                return false
            }
        }
        if (e.keyCode == 27) this.cancelTargetNodeMode()    
    });
}


topologyDOM.prototype.startTargetNodeMode = function (mode) {
    this.core.autounselectify( true );
    this.core.container().style.cursor = 'crosshair';
    this.targetNodeMode=mode;
    this.setKeyDownFunc("includeCancelConnectOperation")

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
    this.setKeyDownFunc()
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


module.exports = topologyDOM;
},{"./globalCache":4,"./modelAnalyzer":9,"./simpleConfirmDialog":12,"./simpleSelectMenu":13}],16:[function(require,module,exports){
const simpleTree=require("./simpleTree")
const modelAnalyzer=require("./modelAnalyzer")
const globalCache = require("./globalCache")


function twinsTree(DOM, searchDOM) {
    this.tree=new simpleTree(DOM)
    this.modelIDMapToName={}

    this.tree.options.groupNodeIconFunc=(gn)=>{
        var modelClass=gn.info["@id"]
        var colorCode="darkGray"
        var shape="ellipse"
        var avarta=null
        var dimension=20;
        if(globalCache.visualDefinition[globalCache.selectedADT] && globalCache.visualDefinition[globalCache.selectedADT][modelClass]){
            var visualJson =globalCache.visualDefinition[globalCache.selectedADT][modelClass]
            var colorCode= visualJson.color || "darkGray"
            var shape=  visualJson.shape || "ellipse"
            var avarta= visualJson.avarta 
            if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
        }

        var iconDOM=$("<div style='width:"+dimension+"px;height:"+dimension+"px;float:left;position:relative'></div>")
        var imgSrc=encodeURIComponent(this.shapeSvg(shape,colorCode))
        iconDOM.append($("<img src='data:image/svg+xml;utf8,"+imgSrc+"'></img>"))
        if(avarta){
            var avartaimg=$("<img style='position:absolute;left:0px;width:60%;margin:20%' src='"+avarta+"'></img>")
            iconDOM.append(avartaimg)
        }
        return iconDOM
    }

    this.tree.callback_afterSelectNodes=(nodesArr,mouseClickDetail)=>{
        var infoArr=[]
        nodesArr.forEach((item, index) =>{
            infoArr.push(item.leafInfo)
        });
        globalCache.showingCreateTwinModelID=null; 
        this.broadcastMessage({ "message": "showInfoSelectedNodes", info:infoArr, "mouseClickDetail":mouseClickDetail})
    }

    this.tree.callback_afterDblclickNode=(theNode)=>{
        this.broadcastMessage({ "message": "PanToNode", info:theNode.leafInfo})
    }

    this.tree.callback_afterSelectGroupNode=(nodeInfo)=>{
        this.broadcastMessage({"message":"showInfoGroupNode",info:nodeInfo})
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

twinsTree.prototype.shapeSvg=function(shape,color){
    if(shape=="ellipse"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><circle cx="50" cy="50" r="50"  fill="'+color+'"/></svg>'
    }else if(shape=="hexagon"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"  fill="'+color+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+color+'" /></svg>'
    }
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
    else if(msgPayload.message=="hideSelectedNodes") this.deleteTwins(msgPayload.twinIDArr)
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
    var arr=[].concat(this.tree.groupNodes)
    arr.forEach((gnode)=>{
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
},{"./globalCache":4,"./modelAnalyzer":9,"./simpleTree":14}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwb3J0YWxTb3VyY2VDb2RlL2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9lZGl0TGF5b3V0RGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9mbG9hdEluZm9XaW5kb3cuanMiLCJwb3J0YWxTb3VyY2VDb2RlL2dsb2JhbENhY2hlLmpzIiwicG9ydGFsU291cmNlQ29kZS9pbmZvUGFuZWwuanMiLCJwb3J0YWxTb3VyY2VDb2RlL21haW4uanMiLCJwb3J0YWxTb3VyY2VDb2RlL21haW5Ub29sYmFyLmpzIiwicG9ydGFsU291cmNlQ29kZS9tYWluVUkuanMiLCJwb3J0YWxTb3VyY2VDb2RlL21vZGVsQW5hbHl6ZXIuanMiLCJwb3J0YWxTb3VyY2VDb2RlL21vZGVsRWRpdG9yRGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9tb2RlbE1hbmFnZXJEaWFsb2cuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3NpbXBsZUNvbmZpcm1EaWFsb2cuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3NpbXBsZVNlbGVjdE1lbnUuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3NpbXBsZVRyZWUuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3RvcG9sb2d5RE9NLmpzIiwicG9ydGFsU291cmNlQ29kZS90d2luc1RyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3gzQkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzb0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2coKSB7XHJcbiAgICB0aGlzLmZpbHRlcnM9e31cclxuICAgIHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVD1udWxsXHJcbiAgICB0aGlzLnRlc3RUd2luc0luZm89bnVsbDtcclxuXHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLW1vZGFsXCIgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO3otaW5kZXg6MTAxXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnByZXBhcmF0aW9uRnVuYyA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLmdldChcInR3aW5zRmlsdGVyL3JlYWRTdGFydEZpbHRlcnNcIiwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YSE9bnVsbCAmJiBkYXRhIT1cIlwiKSB0aGlzLmZpbHRlcnM9ZGF0YTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJC5nZXQoXCJxdWVyeUFEVC9saXN0QURUSW5zdGFuY2VcIiwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W11cclxuICAgICAgICB2YXIgYWR0QXJyPWRhdGE7XHJcbiAgICAgICAgaWYgKGFkdEFyci5sZW5ndGggPT0gMCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLkRPTS5zaG93KClcclxuICAgICAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICAgICAgdGhpcy5jb250ZW50RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1tb2RhbC1jb250ZW50XCIgc3R5bGU9XCJ3aWR0aDo2NTBweFwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgICAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+Q2hvb3NlIERhdGEgU2V0PC9kaXY+PC9kaXY+JykpXHJcbiAgICAgICAgdmFyIGNsb3NlQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuYnV0dG9uSG9sZGVyPSQoXCI8ZGl2IHN0eWxlPSdoZWlnaHQ6MTAwJSc+PC9kaXY+XCIpXHJcbiAgICAgICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQodGhpcy5idXR0b25Ib2xkZXIpXHJcbiAgICAgICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVD09bnVsbCkgdGhpcy51c2VGaWx0ZXJUb1JlcGxhY2UoKVxyXG4gICAgICAgICAgICB0aGlzLmNsb3NlRGlhbG9nKClcclxuICAgICAgICB9KVxyXG4gICAgXHJcbiAgICAgICAgdmFyIHJvdzE9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwicGFkZGluZzoycHhcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MSlcclxuICAgICAgICB2YXIgbGFibGU9JCgnPGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmctcmlnaHQ6NXB4O2ZvbnQtc2l6ZToxLjJlbTtcIj5BenVyZSBEaWdpdGFsIFR3aW4gSUQgPC9kaXY+JylcclxuICAgICAgICByb3cxLmFwcGVuZChsYWJsZSlcclxuICAgICAgICB2YXIgc3dpdGNoQURUU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxmb250U2l6ZTpcIjEuMmVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXlcIixidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNXB4IDEwcHhcIn19KVxyXG4gICAgICAgIHJvdzEuYXBwZW5kKHN3aXRjaEFEVFNlbGVjdG9yLkRPTSlcclxuICAgICAgICBcclxuICAgICAgICBhZHRBcnIuZm9yRWFjaCgoYWR0SW5zdGFuY2UpPT57XHJcbiAgICAgICAgICAgIHZhciBzdHIgPSBhZHRJbnN0YW5jZS5zcGxpdChcIi5cIilbMF0ucmVwbGFjZShcImh0dHBzOi8vXCIsIFwiXCIpXHJcbiAgICAgICAgICAgIHN3aXRjaEFEVFNlbGVjdG9yLmFkZE9wdGlvbihzdHIsYWR0SW5zdGFuY2UpXHJcbiAgICAgICAgICAgIGlmKHRoaXMuZmlsdGVyc1thZHRJbnN0YW5jZV09PW51bGwpIHRoaXMuZmlsdGVyc1thZHRJbnN0YW5jZV09e31cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBzd2l0Y2hBRFRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICAgICAgc3dpdGNoQURUU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgICAgICB0aGlzLnNldEFEVEluc3RhbmNlKG9wdGlvblZhbHVlKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICAgICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsXCIgc3R5bGU9XCJ3aWR0aDoyNDBweDtwYWRkaW5nLXJpZ2h0OjVweFwiPjwvZGl2PicpXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MzBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiXCI+RmlsdGVyczwvZGl2PjwvZGl2PicpKVxyXG5cclxuICAgICAgICB2YXIgZmlsdGVyTGlzdD0kKCc8dWwgY2xhc3M9XCJ3My11bCB3My1ob3ZlcmFibGVcIj4nKVxyXG4gICAgICAgIGZpbHRlckxpc3QuY3NzKHtcIm92ZXJmbG93LXhcIjpcImhpZGRlblwiLFwib3ZlcmZsb3cteVwiOlwiYXV0b1wiLFwiaGVpZ2h0XCI6XCIzNDBweFwiLCBcImJvcmRlci1yaWdodFwiOlwic29saWQgMXB4IGxpZ2h0Z3JheVwifSlcclxuICAgICAgICBsZWZ0U3Bhbi5hcHBlbmQoZmlsdGVyTGlzdClcclxuXHJcbiAgICAgICAgdGhpcy5maWx0ZXJMaXN0PWZpbHRlckxpc3Q7XHJcbiAgICAgICAgcm93Mi5hcHBlbmQobGVmdFNwYW4pXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHJpZ2h0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIj48L2Rpdj4nKVxyXG4gICAgICAgIHJvdzIuYXBwZW5kKHJpZ2h0U3BhbikgXHJcblxyXG4gICAgICAgIHZhciBwYW5lbENhcmQ9JCgnPGRpdiBjbGFzcz1cInczLWNhcmQtMiB3My13aGl0ZVwiIHN0eWxlPVwicGFkZGluZzoxMHB4XCI+PC9kaXY+JylcclxuICAgICAgICByaWdodFNwYW4uYXBwZW5kKHBhbmVsQ2FyZClcclxuICAgICAgICB2YXIgcXVlcnlTcGFuPSQoXCI8c3Bhbi8+XCIpXHJcbiAgICAgICAgcGFuZWxDYXJkLmFwcGVuZChxdWVyeVNwYW4pXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmVcIiAgcGxhY2Vob2xkZXI9XCJDaG9vc2UgYSBmaWx0ZXIgb3IgZmlsbCBpbiBuZXcgZmlsdGVyIG5hbWUuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICAgICAgdGhpcy5xdWVyeU5hbWVJbnB1dD1uYW1lSW5wdXQ7XHJcbiAgICAgICAgdmFyIHF1ZXJ5TGJsPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCIgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6NXB4O21hcmdpbi10b3A6MnB4O3dpZHRoOjUwJVwiPlF1ZXJ5IFNlbnRlbmNlPC9kaXY+JylcclxuICAgICAgICB2YXIgcXVlcnlJbnB1dD0kKCc8dGV4dGFyZWEgc3R5bGU9XCJyZXNpemU6bm9uZTtoZWlnaHQ6ODBweDtvdXRsaW5lOm5vbmU7bWFyZ2luLWJvdHRvbToycHhcIiAgcGxhY2Vob2xkZXI9XCJTYW1wbGU6IFNFTEVDVCAqIEZST00gZGlnaXRhbHR3aW5zIHdoZXJlIElTX09GX01PREVMKFxcJ21vZGVsSURcXCcpXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgICAgIHRoaXMucXVlcnlJbnB1dD1xdWVyeUlucHV0O1xyXG5cclxuICAgICAgICB2YXIgc2F2ZUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWhvdmVyLWxpZ2h0LWdyZWVuIHczLWJvcmRlci1yaWdodFwiPlNhdmUgRmlsdGVyPC9idXR0b24+JylcclxuICAgICAgICB2YXIgdGVzdEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyIHczLWJvcmRlci1yaWdodFwiPlRlc3QgUXVlcnk8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBkZWxCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1waW5rIHczLWJvcmRlci1yaWdodFwiPkRlbGV0ZSBGaWx0ZXI8L2J1dHRvbj4nKVxyXG5cclxuXHJcbiAgICAgICAgdGVzdEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnRlc3RRdWVyeSgpfSlcclxuICAgICAgICBzYXZlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2F2ZVF1ZXJ5KCl9KVxyXG4gICAgICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbFF1ZXJ5KCl9KVxyXG4gICAgICAgIHF1ZXJ5U3Bhbi5hcHBlbmQobmFtZUlucHV0LHF1ZXJ5TGJsLHF1ZXJ5SW5wdXQsc2F2ZUJ0bix0ZXN0QnRuLGRlbEJ0bilcclxuXHJcbiAgICAgICAgdmFyIHRlc3RSZXN1bHRTcGFuPSQoXCI8ZGl2IGNsYXNzPSd3My1ib3JkZXInPjwvZGl2PlwiKVxyXG4gICAgICAgIHZhciB0ZXN0UmVzdWx0VGFibGU9JChcIjx0YWJsZT48L3RhYmxlPlwiKVxyXG4gICAgICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlPXRlc3RSZXN1bHRUYWJsZVxyXG4gICAgICAgIHRlc3RSZXN1bHRTcGFuLmNzcyh7XCJtYXJnaW4tdG9wXCI6XCIycHhcIixvdmVyZmxvdzpcImF1dG9cIixoZWlnaHQ6XCIxNzVweFwiLHdpZHRoOlwiNDAwcHhcIn0pXHJcbiAgICAgICAgdGVzdFJlc3VsdFRhYmxlLmNzcyh7XCJib3JkZXItY29sbGFwc2VcIjpcImNvbGxhcHNlXCJ9KVxyXG4gICAgICAgIHBhbmVsQ2FyZC5hcHBlbmQodGVzdFJlc3VsdFNwYW4pXHJcbiAgICAgICAgdGVzdFJlc3VsdFNwYW4uYXBwZW5kKHRlc3RSZXN1bHRUYWJsZSlcclxuXHJcblxyXG4gICAgICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVCE9bnVsbCl7XHJcbiAgICAgICAgICAgIHN3aXRjaEFEVFNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZSh0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN3aXRjaEFEVFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnNldEFEVEluc3RhbmNlPWZ1bmN0aW9uKHNlbGVjdGVkQURUKXtcclxuICAgIHRoaXMuYnV0dG9uSG9sZGVyLmVtcHR5KClcclxuICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVD09bnVsbCB8fCB0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQgPT0gc2VsZWN0ZWRBRFQpe1xyXG4gICAgICAgIHZhciByZXBsYWNlQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCU7IG1hcmdpbi1yaWdodDo4cHhcIj5SZXBsYWNlIEFsbCBEYXRhPC9idXR0b24+JylcclxuICAgICAgICB2YXIgYXBwZW5kQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5BcHBlbmQgRGF0YTwvYnV0dG9uPicpXHJcblxyXG4gICAgICAgIHJlcGxhY2VCdXR0b24ub24oXCJjbGlja1wiLCgpPT4geyB0aGlzLnVzZUZpbHRlclRvUmVwbGFjZSgpICB9ICApXHJcbiAgICAgICAgYXBwZW5kQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCk9PiB7IHRoaXMudXNlRmlsdGVyVG9BcHBlbmQoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYnV0dG9uSG9sZGVyLmFwcGVuZChyZXBsYWNlQnV0dG9uLGFwcGVuZEJ1dHRvbilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciByZXBsYWNlQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtYm9yZGVyLXJpZ2h0XCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPlJlcGxhY2UgQWxsIERhdGE8L2J1dHRvbj4nKVxyXG4gICAgICAgIHJlcGxhY2VCdXR0b24ub24oXCJjbGlja1wiLCgpPT4geyB0aGlzLnVzZUZpbHRlclRvUmVwbGFjZSgpICB9ICApXHJcbiAgICAgICAgdGhpcy5idXR0b25Ib2xkZXIuYXBwZW5kKHJlcGxhY2VCdXR0b24pXHJcbiAgICB9XHJcbiAgICBnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVCA9IHNlbGVjdGVkQURUXHJcbiAgICBpZiAoIWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdKVxyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSA9IHt9XHJcbiAgICB0aGlzLmxpc3RGaWx0ZXJzKHNlbGVjdGVkQURUKVxyXG4gICAgJC5hamF4U2V0dXAoe1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgJ2FkdEluc3RhbmNlJzogZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5kZWxRdWVyeT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHF1ZXJ5TmFtZT10aGlzLnF1ZXJ5TmFtZUlucHV0LnZhbCgpXHJcbiAgICBpZihxdWVyeU5hbWU9PVwiQUxMXCIgfHwgcXVlcnlOYW1lPT1cIlwiKXJldHVybjtcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIyNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIlBsZWFzZSBjb25maXJtIGRlbGV0aW5nIGZpbHRlciBcXFwiXCIrcXVlcnlOYW1lK1wiXFxcIj9cIlxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6W1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeU5hbWVJbnB1dC52YWwoXCJcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeUlucHV0LnZhbChcIlwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZS5lbXB0eSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbHRlcnNbZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdW3F1ZXJ5TmFtZV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5saXN0RmlsdGVycyhnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaG9vc2VPbmVGaWx0ZXIoXCJcIiwgXCJcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5wb3N0KFwidHdpbnNGaWx0ZXIvc2F2ZVN0YXJ0RmlsdGVyc1wiLCB7IGZpbHRlcnM6IHRoaXMuZmlsdGVycyB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIix0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnNhdmVRdWVyeT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHF1ZXJ5TmFtZT10aGlzLnF1ZXJ5TmFtZUlucHV0LnZhbCgpXHJcbiAgICB2YXIgcXVlcnlTdHI9dGhpcy5xdWVyeUlucHV0LnZhbCgpXHJcbiAgICBpZihxdWVyeU5hbWU9PVwiXCIpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gcXVlcnkgbmFtZVwiKVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZmlsdGVyc1tnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bcXVlcnlOYW1lXT1xdWVyeVN0clxyXG4gICAgdGhpcy5saXN0RmlsdGVycyhnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVClcclxuXHJcbiAgICB0aGlzLmZpbHRlckxpc3QuY2hpbGRyZW4oKS5lYWNoKChpbmRleCxlbGUpPT57XHJcbiAgICAgICAgaWYoJChlbGUpLmRhdGEoXCJmaWx0ZXJOYW1lXCIpPT1xdWVyeU5hbWUpIHtcclxuICAgICAgICAgICAgJChlbGUpLnRyaWdnZXIoXCJjbGlja1wiKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy9zdG9yZSBmaWx0ZXJzIHRvIHNlcnZlciBzaWRlIGFzIGEgZmlsZVxyXG4gICAgJC5wb3N0KFwidHdpbnNGaWx0ZXIvc2F2ZVN0YXJ0RmlsdGVyc1wiLHtmaWx0ZXJzOnRoaXMuZmlsdGVyc30pXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS50ZXN0UXVlcnk9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmVtcHR5KClcclxuICAgIHZhciBxdWVyeVN0cj0gdGhpcy5xdWVyeUlucHV0LnZhbCgpXHJcbiAgICBpZihxdWVyeVN0cj09XCJcIikgcmV0dXJuO1xyXG4gICAgJC5wb3N0KFwicXVlcnlBRFQvYWxsVHdpbnNJbmZvXCIse3F1ZXJ5OnF1ZXJ5U3RyfSwgKGRhdGEpPT4ge1xyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W11cclxuICAgICAgICBpZighQXJyYXkuaXNBcnJheShkYXRhKSkge1xyXG4gICAgICAgICAgICBhbGVydChcIlF1ZXJ5IGlzIG5vdCBjb3JyZWN0IVwiKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudGVzdFR3aW5zSW5mbz1kYXRhXHJcbiAgICAgICAgaWYoZGF0YS5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImNvbG9yOmdyYXlcIj56ZXJvIHJlY29yZDwvdGQ+PHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5XCI+PC90ZD48L3RyPicpXHJcbiAgICAgICAgICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmFwcGVuZCh0cilcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJib3JkZXItcmlnaHQ6c29saWQgMXB4IGxpZ2h0Z3JleTtib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXk7Zm9udC13ZWlnaHQ6Ym9sZFwiPklEPC90ZD48dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXk7Zm9udC13ZWlnaHQ6Ym9sZFwiPk1PREVMPC90ZD48L3RyPicpXHJcbiAgICAgICAgICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmFwcGVuZCh0cilcclxuICAgICAgICAgICAgZGF0YS5mb3JFYWNoKChvbmVOb2RlKT0+e1xyXG4gICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbb25lTm9kZVtcIiRkdElkXCJdXSA9IG9uZU5vZGU7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImJvcmRlci1yaWdodDpzb2xpZCAxcHggbGlnaHRncmV5O2JvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrb25lTm9kZVtcIiRkdElkXCJdKyc8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrb25lTm9kZVsnJG1ldGFkYXRhJ11bJyRtb2RlbCddKyc8L3RkPjwvdHI+JylcclxuICAgICAgICAgICAgICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmFwcGVuZCh0cilcclxuICAgICAgICAgICAgfSkgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5saXN0RmlsdGVycz1mdW5jdGlvbihhZHRJbnN0YW5jZU5hbWUpe1xyXG4gICAgdmFyIGF2YWlsYWJsZUZpbHRlcnM9dGhpcy5maWx0ZXJzW2FkdEluc3RhbmNlTmFtZV1cclxuICAgIGF2YWlsYWJsZUZpbHRlcnNbXCJBTExcIl09XCJTRUxFQ1QgKiBGUk9NIGRpZ2l0YWx0d2luc1wiXHJcblxyXG4gICAgdmFyIGZpbHRlckxpc3Q9dGhpcy5maWx0ZXJMaXN0O1xyXG4gICAgZmlsdGVyTGlzdC5lbXB0eSgpXHJcblxyXG4gICAgZm9yKHZhciBmaWx0ZXJOYW1lIGluIGF2YWlsYWJsZUZpbHRlcnMpe1xyXG4gICAgICAgIHZhciBvbmVGaWx0ZXI9JCgnPGxpIHN0eWxlPVwiZm9udC1zaXplOjFlbVwiPicrZmlsdGVyTmFtZSsnPC9saT4nKVxyXG4gICAgICAgIG9uZUZpbHRlci5jc3MoXCJjdXJzb3JcIixcImRlZmF1bHRcIilcclxuICAgICAgICBvbmVGaWx0ZXIuZGF0YShcImZpbHRlck5hbWVcIiwgZmlsdGVyTmFtZSlcclxuICAgICAgICBvbmVGaWx0ZXIuZGF0YShcImZpbHRlclF1ZXJ5XCIsIGF2YWlsYWJsZUZpbHRlcnNbZmlsdGVyTmFtZV0pXHJcbiAgICAgICAgaWYoZmlsdGVyTmFtZT09XCJBTExcIikgZmlsdGVyTGlzdC5wcmVwZW5kKG9uZUZpbHRlcilcclxuICAgICAgICBlbHNlIGZpbHRlckxpc3QuYXBwZW5kKG9uZUZpbHRlcilcclxuICAgICAgICB0aGlzLmFzc2lnbkV2ZW50VG9PbmVGaWx0ZXIob25lRmlsdGVyKVxyXG4gICAgICAgIGlmKGZpbHRlck5hbWU9PVwiQUxMXCIpIG9uZUZpbHRlci50cmlnZ2VyKFwiY2xpY2tcIilcclxuICAgICAgICBcclxuICAgICAgICBvbmVGaWx0ZXIub24oXCJkYmxjbGlja1wiLChlKT0+e1xyXG4gICAgICAgICAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQgPT0gZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFQpIHRoaXMudXNlRmlsdGVyVG9BcHBlbmQoKTtcclxuICAgICAgICAgICAgZWxzZSB0aGlzLnVzZUZpbHRlclRvUmVwbGFjZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuYXNzaWduRXZlbnRUb09uZUZpbHRlcj1mdW5jdGlvbihvbmVGaWx0ZXIpe1xyXG4gICAgb25lRmlsdGVyLm9uKFwiY2xpY2tcIiwoZSk9PntcclxuICAgICAgICB0aGlzLmZpbHRlckxpc3QuY2hpbGRyZW4oKS5lYWNoKChpbmRleCxlbGUpPT57XHJcbiAgICAgICAgICAgICQoZWxlKS5yZW1vdmVDbGFzcyhcInczLWFtYmVyXCIpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBvbmVGaWx0ZXIuYWRkQ2xhc3MoXCJ3My1hbWJlclwiKVxyXG4gICAgICAgIHZhciBmaWx0ZXJOYW1lPW9uZUZpbHRlci5kYXRhKCdmaWx0ZXJOYW1lJylcclxuICAgICAgICB2YXIgcXVlcnlTdHI9b25lRmlsdGVyLmRhdGEoJ2ZpbHRlclF1ZXJ5JylcclxuICAgICAgICB0aGlzLmNob29zZU9uZUZpbHRlcihmaWx0ZXJOYW1lLHF1ZXJ5U3RyKVxyXG4gICAgfSlcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnVzZUZpbHRlclRvQXBwZW5kPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnF1ZXJ5SW5wdXQudmFsKCk9PVwiXCIpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gcXVlcnkgdG8gZmV0Y2ggZGF0YSBmcm9tIGRpZ2l0YWwgdHdpbiBzZXJ2aWNlLi5cIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQ9PW51bGwpe1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVERhdGFzb3VyY2VDaGFuZ2VfcmVwbGFjZVwiLCBcInF1ZXJ5XCI6IHRoaXMucXVlcnlJbnB1dC52YWwoKSwgXCJ0d2luc1wiOnRoaXMudGVzdFR3aW5zSW5mbyB9KVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5wcmV2aW91c1NlbGVjdGVkQURUPWdsb2JhbENhY2hlLnNlbGVjdGVkQURUXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURURGF0YXNvdXJjZUNoYW5nZV9hcHBlbmRcIiwgXCJxdWVyeVwiOiB0aGlzLnF1ZXJ5SW5wdXQudmFsKCksIFwidHdpbnNcIjp0aGlzLnRlc3RUd2luc0luZm8gfSlcclxuICAgIH1cclxuICAgIHRoaXMuY2xvc2VEaWFsb2coKVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuY2xvc2VEaWFsb2c9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURURGF0YXNvdXJjZURpYWxvZ19jbG9zZWRcIn0pXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS51c2VGaWx0ZXJUb1JlcGxhY2U9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMucXVlcnlJbnB1dC52YWwoKT09XCJcIil7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgZmlsbCBpbiBxdWVyeSB0byBmZXRjaCBkYXRhIGZyb20gZGlnaXRhbCB0d2luIHNlcnZpY2UuLlwiKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBBRFRJbnN0YW5jZURvZXNOb3RDaGFuZ2U9dHJ1ZVxyXG4gICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkQURUIT1nbG9iYWxDYWNoZS5zZWxlY3RlZEFEVCl7XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzKSBkZWxldGUgZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW2luZF1cclxuICAgICAgICBmb3IodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5zdG9yZWRUd2lucykgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW2luZF1cclxuICAgICAgICBBRFRJbnN0YW5jZURvZXNOb3RDaGFuZ2U9ZmFsc2VcclxuICAgIH1cclxuICAgIHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVD1nbG9iYWxDYWNoZS5zZWxlY3RlZEFEVFxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlXCIsIFwicXVlcnlcIjogdGhpcy5xdWVyeUlucHV0LnZhbCgpXHJcbiAgICAsIFwidHdpbnNcIjp0aGlzLnRlc3RUd2luc0luZm8sIFwiQURUSW5zdGFuY2VEb2VzTm90Q2hhbmdlXCI6QURUSW5zdGFuY2VEb2VzTm90Q2hhbmdlIH0pXHJcbiAgICBcclxuICAgIHRoaXMuY2xvc2VEaWFsb2coKVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuY2hvb3NlT25lRmlsdGVyPWZ1bmN0aW9uKHF1ZXJ5TmFtZSxxdWVyeVN0cil7XHJcbiAgICB0aGlzLnF1ZXJ5TmFtZUlucHV0LnZhbChxdWVyeU5hbWUpXHJcbiAgICB0aGlzLnF1ZXJ5SW5wdXQudmFsKHF1ZXJ5U3RyKVxyXG4gICAgdGhpcy50ZXN0UmVzdWx0VGFibGUuZW1wdHkoKVxyXG4gICAgdGhpcy50ZXN0VHdpbnNJbmZvPW51bGxcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2coKTsiLCJjb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIGVkaXRMYXlvdXREaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLmdldEN1ckFEVE5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBhZHROYW1lID0gZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRcclxuICAgIHZhciBzdHIgPSBhZHROYW1lLnJlcGxhY2UoXCJodHRwczovL1wiLCBcIlwiKVxyXG4gICAgcmV0dXJuIHN0clxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlXCIpIHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQucG9zdChcImxheW91dC9yZWFkTGF5b3V0c1wiLHthZHROYW1lOnRoaXMuZ2V0Q3VyQURUTmFtZSgpfSwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YSE9XCJcIiAmJiB0eXBlb2YoZGF0YSk9PT1cIm9iamVjdFwiKSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OPWRhdGE7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGdsb2JhbENhY2hlLmxheW91dEpTT049e307XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwifSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnJlZmlsbE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNsZWFyT3B0aW9ucygpXHJcbiAgICBcclxuICAgIGZvcih2YXIgaW5kIGluIGdsb2JhbENhY2hlLmxheW91dEpTT04pe1xyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKGluZClcclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuXHJcbiAgICB0aGlzLkRPTS5jc3Moe1wid2lkdGhcIjpcIjMyMHB4XCIsXCJwYWRkaW5nLWJvdHRvbVwiOlwiM3B4XCJ9KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweDttYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+TGF5b3V0PC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTsgd2lkdGg6MTgwcHg7IGRpc3BsYXk6aW5saW5lO21hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6MnB4XCIgIHBsYWNlaG9sZGVyPVwiRmlsbCBpbiBhIG5ldyBsYXlvdXQgbmFtZS4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZChuYW1lSW5wdXQpXHJcbiAgICB2YXIgc2F2ZUFzTmV3QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIj5TYXZlIE5ldyBMYXlvdXQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc05ld0J0bilcclxuICAgIHNhdmVBc05ld0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KG5hbWVJbnB1dC52YWwoKSl9KVxyXG5cclxuXHJcbiAgICBpZighJC5pc0VtcHR5T2JqZWN0KGdsb2JhbENhY2hlLmxheW91dEpTT04pKXtcclxuICAgICAgICB2YXIgbGJsPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXIgdzMtcGFkZGluZy0xNlwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+LSBPUiAtPC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQobGJsKSBcclxuICAgICAgICB2YXIgc3dpdGNoTGF5b3V0U2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJcIix7Zm9udFNpemU6XCIxZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLHdpZHRoOlwiMTIwcHhcIn0pXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvcj1zd2l0Y2hMYXlvdXRTZWxlY3RvclxyXG4gICAgICAgIHRoaXMucmVmaWxsT3B0aW9ucygpXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICAgICAgaWYob3B0aW9uVGV4dD09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiIFwiKVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgdmFyIHNhdmVBc0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjVweFwiPlNhdmUgQXM8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBkZWxldGVCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGlua1wiIHN0eWxlPVwibWFyZ2luLWxlZnQ6NXB4XCI+RGVsZXRlIExheW91dDwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc0J0bixzd2l0Y2hMYXlvdXRTZWxlY3Rvci5ET00sZGVsZXRlQnRuKVxyXG4gICAgICAgIHNhdmVBc0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KHN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbCl9KVxyXG4gICAgICAgIGRlbGV0ZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZUxheW91dChzd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWwpfSlcclxuXHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUhPW51bGwpe1xyXG4gICAgICAgICAgICBzd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUuc2F2ZUludG9MYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzYXZlTGF5b3V0XCIsIFwibGF5b3V0TmFtZVwiOiBsYXlvdXROYW1lLCBcImFkdE5hbWVcIjp0aGlzLmdldEN1ckFEVE5hbWUoKSB9KVxyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcbn1cclxuXHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5kZWxldGVMYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIyNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIlBsZWFzZSBjb25maXJtIGRlbGV0aW5nIGxheW91dCBcXFwiXCIgKyBsYXlvdXROYW1lICsgXCJcXFwiP1wiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczpbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGF5b3V0TmFtZSA9PSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSkgZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCIgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5wb3N0KFwibGF5b3V0L3NhdmVMYXlvdXRzXCIsIHsgXCJhZHROYW1lXCI6IHRoaXMuZ2V0Q3VyQURUTmFtZSgpLCBcImxheW91dHNcIjogSlNPTi5zdHJpbmdpZnkoZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZmlsbE9wdGlvbnMoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBlZGl0TGF5b3V0RGlhbG9nKCk7IiwiY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIik7XHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIGZsb2F0SW5mb1dpbmRvdygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWNhcmRcIiBzdHlsZT1cInBhZGRpbmc6MTBweDsgcG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDoxMDE7bWluLWhlaWdodDoxMjBweFwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5oaWRlU2VsZigpXHJcbiAgICAgICAgdGhpcy5ET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjkpXCIpXHJcbiAgICAgICAgJCgnYm9keScpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgIH1cclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5oaWRlU2VsZj1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5ET00uY3NzKFwid2lkdGhcIixcIjBweFwiKSBcclxufVxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLnNob3dTZWxmPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgdGhpcy5ET00uY3NzKFwid2lkdGhcIixcIjI5NXB4XCIpXHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7ICAgXHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidG9wb2xvZ3lNb3VzZU91dFwiKXtcclxuICAgICAgICB0aGlzLmhpZGVTZWxmKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzaG93SW5mb0hvdmVyZWRFbGVcIil7XHJcbiAgICAgICAgaWYoIWdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICBcclxuICAgICAgICB2YXIgYXJyPW1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICBpZihhcnI9PW51bGwgfHwgYXJyLmxlbmd0aD09MCkgIHJldHVybjtcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJsZWZ0XCIsXCItMjAwMHB4XCIpIC8vaXQgaXMgYWx3YXlzIG91dHNpZGUgb2YgYnJvd3NlciBzbyBpdCB3b250IGJsb2NrIG1vdXNlIGFuZCBjYXVzZSBtb3VzZSBvdXRcclxuICAgICAgICB0aGlzLnNob3dTZWxmKClcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZG9jdW1lbnRCb2R5V2lkdGg9JCgnYm9keScpLndpZHRoKClcclxuXHJcbiAgICAgICAgdmFyIHNpbmdsZUVsZW1lbnRJbmZvPWFyclswXTtcclxuICAgICAgICBpZihzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdKXsvLyBzZWxlY3QgYSBub2RlXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGR0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICB2YXIgbW9kZWxOYW1lPXNpbmdsZUVsZW1lbnRJbmZvWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdLmVkaXRhYmxlUHJvcGVydGllcyxzaW5nbGVFbGVtZW50SW5mbyxbXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXSxcIiRtZXRhZGF0YVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgIH1lbHNlIGlmKHNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgICAgICBcIiRzb3VyY2VJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdLFxyXG4gICAgICAgICAgICAgICAgXCIkdGFyZ2V0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiR0YXJnZXRJZFwiXSxcclxuICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcE5hbWVcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBOYW1lXCJdXHJcbiAgICAgICAgICAgIH0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgICAgIH0sXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgdmFyIHJlbGF0aW9uc2hpcE5hbWU9c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICB2YXIgc291cmNlTW9kZWw9c2luZ2xlRWxlbWVudEluZm9bXCJzb3VyY2VNb2RlbFwiXVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sdGhpcy5nZXRSZWxhdGlvblNoaXBFZGl0YWJsZVByb3BlcnRpZXMocmVsYXRpb25zaGlwTmFtZSxzb3VyY2VNb2RlbCksc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGV0YWdcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRldGFnXCJdfSxcIjFlbVwiLFwiMTBweFwiLFwiRGFya0dyYXlcIilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzY3JlZW5YWT0gbXNnUGF5bG9hZC5zY3JlZW5YWVxyXG4gICAgICAgIHZhciB3aW5kb3dMZWZ0PXNjcmVlblhZLngrNTBcclxuXHJcbiAgICAgICAgaWYod2luZG93TGVmdCt0aGlzLkRPTS5vdXRlcldpZHRoKCkrMTA+ZG9jdW1lbnRCb2R5V2lkdGgpIHtcclxuICAgICAgICAgICAgd2luZG93TGVmdD1kb2N1bWVudEJvZHlXaWR0aC10aGlzLkRPTS5vdXRlcldpZHRoKCktMTBcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHdpbmRvd1RvcCA9IHNjcmVlblhZLnktdGhpcy5ET00ub3V0ZXJIZWlnaHQoKS01MFxyXG4gICAgICAgIGlmKHdpbmRvd1RvcDw1KSB3aW5kb3dUb3A9NVxyXG4gICAgICAgIHRoaXMuRE9NLmNzcyh7XCJsZWZ0XCI6d2luZG93TGVmdCtcInB4XCIsIFwidG9wXCI6d2luZG93VG9wK1wicHhcIn0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmZsb2F0SW5mb1dpbmRvdy5wcm90b3R5cGUuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpe1xyXG4gICAgaWYoIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0gfHwgIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdKSByZXR1cm5cclxuICAgIHJldHVybiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXNcclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5kcmF3U3RhdGljSW5mbz1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8scGFkZGluZ1RvcCxmb250U2l6ZSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBjbGFzcz0ndzMtZGFyay1ncmF5JyBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtO2ZvbnQtc2l6ZToxMHB4Jz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLHBhZGRpbmdUb3ApXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxcIi41ZW1cIixmb250U2l6ZSlcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy10b3BcIixcIi4yZW1cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6Zm9udFNpemUsXCJjb2xvclwiOlwiYmxhY2tcIn0pXHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLmRyYXdFZGl0YWJsZT1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8sb3JpZ2luRWxlbWVudEluZm8scGF0aEFycil7XHJcbiAgICBpZihqc29uSW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTsgbWFyZ2luLXJpZ2h0OjVweCc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICBcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4zZW1cIikgXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgc3R5bGU9J3BhZGRpbmctdG9wOi4yZW0nPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgdmFyIG5ld1BhdGg9cGF0aEFyci5jb25jYXQoW2luZF0pXHJcbiAgICAgICAgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSkge1xyXG4gICAgICAgICAgICBrZXlEaXYuY2hpbGRyZW4oXCI6Zmlyc3RcIikuY3NzKFwiZm9udC13ZWlnaHRcIixcImJvbGRcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAga2V5RGl2LmNoaWxkcmVuKFwiOmZpcnN0XCIpLmFkZENsYXNzKFwidzMtbGltZVwiKVxyXG4gICAgICAgICAgICB2YXIgdmFsPXRoaXMuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgICAgICAgICAgaWYodmFsPT1udWxsKXtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImNvbG9yXCI6XCJncmF5XCIsXCJmb250LXNpemVcIjpcIjlweFwifSlcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChcIltlbXB0eV1cIilcclxuICAgICAgICAgICAgfWVsc2UgY29udGVudERPTS50ZXh0KHZhbClcclxuICAgICAgICB9XHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLnNlYXJjaFZhbHVlPWZ1bmN0aW9uKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIHRoZUpzb249b3JpZ2luRWxlbWVudEluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgICAgIGlmKHRoZUpzb249PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoZUpzb24gLy9pdCBzaG91bGQgYmUgdGhlIGZpbmFsIHZhbHVlXHJcbn1cclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZmxvYXRJbmZvV2luZG93KCk7IiwiZnVuY3Rpb24gZ2xvYmFsQ2FjaGUoKXtcclxuICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzID0ge31cclxuICAgIHRoaXMuc3RvcmVkVHdpbnMgPSB7fVxyXG5cclxuICAgIHRoaXMuY3VycmVudExheW91dE5hbWU9bnVsbFxyXG4gICAgdGhpcy5sYXlvdXRKU09OPXt9XHJcblxyXG4gICAgdGhpcy5zZWxlY3RlZEFEVD1udWxsO1xyXG5cclxuICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvbj17fVxyXG5cclxuICAgIHRoaXMuc2hvd0Zsb2F0SW5mb1BhbmVsPXRydWVcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHM9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB2YXIgdHdpbklEPW9uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11cclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdPVtdXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dLnB1c2gob25lUmVsYXRpb25zaGlwKVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgaWYoIXRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dKVxyXG4gICAgICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXT1bXVxyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dLnB1c2gob25lUmVsYXRpb25zaGlwKVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfcmVtb3ZlPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uc2hpcFtcInNyY0lEXCJdXHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdKXtcclxuICAgICAgICAgICAgdmFyIGFycj10aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF1cclxuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTxhcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICBpZihhcnJbaV1bJyRyZWxhdGlvbnNoaXBJZCddPT1vbmVSZWxhdGlvbnNoaXBbXCJyZWxJRFwiXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBnbG9iYWxDYWNoZSgpOyIsImNvbnN0IG1vZGVsQW5hbHl6ZXIgPSByZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIGluZm9QYW5lbCgpIHtcclxuICAgIHRoaXMuY29udGluZXJET009JCgnPGRpdiBjbGFzcz1cInczLWNhcmRcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6OTA7cmlnaHQ6MHB4O3RvcDo1MCU7aGVpZ2h0OjcwJTt3aWR0aDozMDBweDt0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSk7XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGluZXJET00uaGlkZSgpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjUwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48L2Rpdj4nKSlcclxuXHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMT0kKCc8YnV0dG9uIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiPjxpIGNsYXNzPVwiZmEgZmEtaW5mby1jaXJjbGUgZmEtMnhcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtXCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKHRoaXMuY2xvc2VCdXR0b24xLHRoaXMuY2xvc2VCdXR0b24yKSBcclxuXHJcbiAgICB0aGlzLmlzTWluaW1pemVkPWZhbHNlO1xyXG4gICAgdmFyIGJ1dHRvbkFuaW09KCk9PntcclxuICAgICAgICBpZighdGhpcy5pc01pbmltaXplZCl7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGluZXJET00uYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgICAgICByaWdodDogXCItMjUwcHhcIixcclxuICAgICAgICAgICAgICAgIGhlaWdodDpcIjUwcHhcIlxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB0aGlzLmlzTWluaW1pemVkPXRydWU7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGluZXJET00uYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgICAgICByaWdodDogXCIwcHhcIixcclxuICAgICAgICAgICAgICAgIGhlaWdodDogXCI3MCVcIlxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB0aGlzLmlzTWluaW1pemVkPWZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuY2xvc2VCdXR0b24xLm9uKFwiY2xpY2tcIixidXR0b25BbmltKVxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjIub24oXCJjbGlja1wiLGJ1dHRvbkFuaW0pXHJcblxyXG4gICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiIHN0eWxlPVwicG9zdGlvbjphYnNvbHV0ZTt0b3A6NTBweDtoZWlnaHQ6Y2FsYygxMDAlIC0gNTBweCk7b3ZlcmZsb3c6YXV0b1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIixcInJnYmEoMjU1LCAyNTUsIDI1NSwgMC44KVwiKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5ob3ZlcigoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiYSgyNTUsIDI1NSwgMjU1LCAxKVwiKVxyXG4gICAgfSwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMC44KVwiKVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICQoJ2JvZHknKS5hcHBlbmQodGhpcy5jb250aW5lckRPTSlcclxuICAgIFxyXG5cclxuICAgIHRoaXMuZHJhd0J1dHRvbnMobnVsbClcclxuXHJcbiAgICB0aGlzLnNlbGVjdGVkT2JqZWN0cz1udWxsO1xyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXsgICBcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFREYXRhc291cmNlRGlhbG9nX2Nsb3NlZFwiKXtcclxuICAgICAgICBpZighdGhpcy5jb250aW5lckRPTS5pcyhcIjp2aXNpYmxlXCIpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGluZXJET00uc2hvdygpXHJcbiAgICAgICAgICAgIHRoaXMuY29udGluZXJET00uYWRkQ2xhc3MoXCJ3My1hbmltYXRlLXJpZ2h0XCIpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiIHx8IG1zZ1BheWxvYWQubWVzc2FnZT09XCJzaG93SW5mb0hvdmVyZWRFbGVcIil7XHJcbiAgICAgICAgaWYgKGdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCAmJiBtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9Ib3ZlcmVkRWxlXCIpIHJldHVybjsgLy90aGUgZmxvYXRpbmcgaW5mbyB3aW5kb3cgd2lsbCBzaG93IG1vdXNlIG92ZXIgZWxlbWVudCBpbmZvcm1hdGlvbiwgZG8gbm90IGNoYW5nZSBpbmZvIHBhbmVsIGNvbnRlbnQgaW4gdGhpcyBjYXNlXHJcbiAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgIHZhciBhcnI9bXNnUGF5bG9hZC5pbmZvO1xyXG5cclxuICAgICAgICBpZihhcnI9PW51bGwgfHwgYXJyLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMobnVsbClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9W107XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzPWFycjtcclxuICAgICAgICBpZihhcnIubGVuZ3RoPT0xKXtcclxuICAgICAgICAgICAgdmFyIHNpbmdsZUVsZW1lbnRJbmZvPWFyclswXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKHNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl0pey8vIHNlbGVjdCBhIG5vZGVcclxuICAgICAgICAgICAgICAgIHNpbmdsZUVsZW1lbnRJbmZvPWdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl1dXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKFwic2luZ2xlTm9kZVwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZHRJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl19LFwiMWVtXCIsXCIxM3B4XCIpXHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWxOYW1lPXNpbmdsZUVsZW1lbnRJbmZvWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsTmFtZV0pe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdLmVkaXRhYmxlUHJvcGVydGllcyxzaW5nbGVFbGVtZW50SW5mbyxbXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGV0YWdcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRldGFnXCJdLFwiJG1ldGFkYXRhXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl19LFwiMWVtXCIsXCIxMHB4XCIpXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKHNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdKXtcclxuICAgICAgICAgICAgICAgIHZhciBhcnI9Z2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdXVxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpPTA7aTxhcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoYXJyW2ldWyckcmVsYXRpb25zaGlwSWQnXT09c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVFbGVtZW50SW5mbz1hcnJbaV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcInNpbmdsZVJlbGF0aW9uc2hpcFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgICAgICAgICAgXCIkc291cmNlSWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSxcclxuICAgICAgICAgICAgICAgICAgICBcIiR0YXJnZXRJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHRhcmdldElkXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcE5hbWVcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBOYW1lXCJdXHJcbiAgICAgICAgICAgICAgICB9LFwiMWVtXCIsXCIxM3B4XCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcclxuICAgICAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgICAgICAgICB9LFwiMWVtXCIsXCIxMHB4XCIpXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnNoaXBOYW1lPXNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl1cclxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VNb2RlbD1zaW5nbGVFbGVtZW50SW5mb1tcInNvdXJjZU1vZGVsXCJdXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLHRoaXMuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpLHNpbmdsZUVsZW1lbnRJbmZvLFtdKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZXRhZ1wiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGV0YWdcIl19LFwiMWVtXCIsXCIxMHB4XCIsXCJEYXJrR3JheVwiKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2UgaWYoYXJyLmxlbmd0aD4xKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcIm11bHRpcGxlXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd011bHRpcGxlT2JqKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9Hcm91cE5vZGVcIil7XHJcbiAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgIHZhciBtb2RlbElEID0gbXNnUGF5bG9hZC5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc2hvd2luZ0NyZWF0ZVR3aW5Nb2RlbElEPW1vZGVsSURcclxuICAgICAgICBpZighbW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHR3aW5Kc29uID0ge1xyXG4gICAgICAgICAgICBcIiRtZXRhZGF0YVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcIiRtb2RlbFwiOiBtb2RlbElEXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGFkZEJ0biA9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ncmVlbiB3My1ob3Zlci1saWdodC1ncmVlbiB3My1tYXJnaW5cIj5BZGQgVHdpbjwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFkZEJ0bilcclxuXHJcbiAgICAgICAgYWRkQnRuLm9uKFwiY2xpY2tcIiwoZSkgPT4ge1xyXG4gICAgICAgICAgICBpZighdHdpbkpzb25bXCIkZHRJZFwiXXx8dHdpbkpzb25bXCIkZHRJZFwiXT09XCJcIil7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIlBsZWFzZSBmaWxsIGluIG5hbWUgZm9yIHRoZSBuZXcgZGlnaXRhbCB0d2luXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBjb21wb25lbnRzTmFtZUFycj1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uaW5jbHVkZWRDb21wb25lbnRzXHJcbiAgICAgICAgICAgIGNvbXBvbmVudHNOYW1lQXJyLmZvckVhY2gob25lQ29tcG9uZW50TmFtZT0+eyAvL2FkdCBzZXJ2aWNlIHJlcXVlc3RpbmcgYWxsIGNvbXBvbmVudCBhcHBlYXIgYnkgbWFuZGF0b3J5XHJcbiAgICAgICAgICAgICAgICBpZih0d2luSnNvbltvbmVDb21wb25lbnROYW1lXT09bnVsbCl0d2luSnNvbltvbmVDb21wb25lbnROYW1lXT17fVxyXG4gICAgICAgICAgICAgICAgdHdpbkpzb25bb25lQ29tcG9uZW50TmFtZV1bXCIkbWV0YWRhdGFcIl09IHt9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICQucG9zdChcImVkaXRBRFQvdXBzZXJ0RGlnaXRhbFR3aW5cIiwge1wibmV3VHdpbkpzb25cIjpKU09OLnN0cmluZ2lmeSh0d2luSnNvbil9XHJcbiAgICAgICAgICAgICAgICAsIChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgIT0gXCJcIikgey8vbm90IHN1Y2Nlc3NmdWwgZWRpdGluZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydChkYXRhKVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vc3VjY2Vzc2Z1bCBlZGl0aW5nLCB1cGRhdGUgdGhlIG5vZGUgb3JpZ2luYWwgaW5mb1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIga2V5TGFiZWw9dGhpcy5ET00uZmluZCgnI05FV1RXSU5fSURMYWJlbCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBJRElucHV0PWtleUxhYmVsLmZpbmQoXCJpbnB1dFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihJRElucHV0KSBJRElucHV0LnZhbChcIlwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLnBvc3QoXCJxdWVyeUFEVC9vbmVUd2luSW5mb1wiLHt0d2luSUQ6dHdpbkpzb25bXCIkZHRJZFwiXX0sIChkYXRhKT0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGRhdGE9PVwiXCIpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW2RhdGFbXCIkZHRJZFwiXV0gPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWRkTmV3VHdpblwiLHR3aW5JbmZvOmRhdGF9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1xyXG4gICAgICAgICAgICBcIk1vZGVsXCI6bW9kZWxJRFxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGFkZEJ0bi5kYXRhKFwidHdpbkpzb25cIix0d2luSnNvbilcclxuICAgICAgICB2YXIgY29weVByb3BlcnR5PUpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmVkaXRhYmxlUHJvcGVydGllcykpXHJcbiAgICAgICAgY29weVByb3BlcnR5WyckZHRJZCddPVwic3RyaW5nXCJcclxuICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZSh0aGlzLkRPTSxjb3B5UHJvcGVydHksdHdpbkpzb24sW10sXCJuZXdUd2luXCIpXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0pIFxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmdldFJlbGF0aW9uU2hpcEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihyZWxhdGlvbnNoaXBOYW1lLHNvdXJjZU1vZGVsKXtcclxuICAgIGlmKCFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdIHx8ICFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXSkgcmV0dXJuXHJcbiAgICByZXR1cm4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwTmFtZV0uZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0J1dHRvbnM9ZnVuY3Rpb24oc2VsZWN0VHlwZSl7XHJcbiAgICB2YXIgaW1wQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtYmx1ZVwiPjxpIGNsYXNzPVwiZmFzIGZhLWNsb3VkLXVwbG9hZC1hbHRcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRUd2luc0J0biA9JCgnPGlucHV0IHR5cGU9XCJmaWxlXCIgbmFtZT1cIm1vZGVsRmlsZXNcIiBtdWx0aXBsZT1cIm11bHRpcGxlXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICBpZihzZWxlY3RUeXBlIT1udWxsKXtcclxuICAgICAgICB2YXIgcmVmcmVzaEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWJsYWNrXCI+PGkgY2xhc3M9XCJmYXMgZmEtc3luYy1hbHRcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICB2YXIgZXhwQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtZ3JlZW5cIj48aSBjbGFzcz1cImZhcyBmYS1jbG91ZC1kb3dubG9hZC1hbHRcIj48L2k+PC9idXR0b24+JykgIFxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChyZWZyZXNoQnRuLGV4cEJ0bixpbXBCdG4sYWN0dWFsSW1wb3J0VHdpbnNCdG4pXHJcbiAgICAgICAgcmVmcmVzaEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnJlZnJlc2hJbmZvbWF0aW9uKCl9KVxyXG4gICAgICAgIGV4cEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgLy9maW5kIG91dCB0aGUgdHdpbnMgaW4gc2VsZWN0aW9uIGFuZCB0aGVpciBjb25uZWN0aW9ucyAoZmlsdGVyIGJvdGggc3JjIGFuZCB0YXJnZXQgd2l0aGluIHRoZSBzZWxlY3RlZCB0d2lucylcclxuICAgICAgICAgICAgLy9hbmQgZXhwb3J0IHRoZW1cclxuICAgICAgICAgICAgdGhpcy5leHBvcnRTZWxlY3RlZCgpXHJcbiAgICAgICAgfSkgICAgXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuRE9NLmh0bWwoXCI8YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5Jz5DaG9vc2UgdHdpbnMgb3IgcmVsYXRpb25zaGlwcyB0byB2aWV3IGluZm9tcmF0aW9uPC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweCc+UHJlc3Mgc2hpZnQga2V5IHRvIGRyYXcgYm94IGFuZCBzZWxlY3QgbXVsdGlwbGUgdHdpbnMgaW4gdG9wb2xvZ3kgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHgnPlByZXNzIGN0cmwreiBhbmQgY3RybCt5IHRvIHVuZG8vcmVkbyBpbiB0b3BvbG9neSB2aWV3OyBjdHJsK3MgdG8gc2F2ZSBsYXlvdXQ8L2E+PGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLXRvcDoyMHB4O3BhZGRpbmctYm90dG9tOjIwcHgnPlByZXNzIHNoaWZ0IG9yIGN0cmwga2V5IHRvIHNlbGVjdCBtdWx0aXBsZSB0d2lucyBpbiB0cmVlIHZpZXc8L2E+PGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLXRvcDoxMnB4O3BhZGRpbmctYm90dG9tOjVweCc+SW1wb3J0IHR3aW5zIGRhdGEgYnkgY2xpY2tpbmcgYnV0dG9uIGJlbG93PC9hPlwiKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChpbXBCdG4sIGFjdHVhbEltcG9ydFR3aW5zQnRuKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpbXBCdG4ub24oXCJjbGlja1wiLCgpPT57YWN0dWFsSW1wb3J0VHdpbnNCdG4udHJpZ2dlcignY2xpY2snKTt9KVxyXG4gICAgYWN0dWFsSW1wb3J0VHdpbnNCdG4uY2hhbmdlKGFzeW5jIChldnQpPT57XHJcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XHJcbiAgICAgICAgYXdhaXQgdGhpcy5yZWFkVHdpbnNGaWxlc0NvbnRlbnRBbmRJbXBvcnQoZmlsZXMpXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0VHdpbnNCdG4udmFsKFwiXCIpXHJcbiAgICB9KVxyXG4gICAgaWYoc2VsZWN0VHlwZT09bnVsbCkgcmV0dXJuO1xyXG5cclxuICAgIGlmKHNlbGVjdFR5cGU9PVwic2luZ2xlUmVsYXRpb25zaGlwXCIpe1xyXG4gICAgICAgIHZhciBkZWxCdG4gPSAgJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjEwNHB4XCIgY2xhc3M9XCJ3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyXCI+RGVsZXRlIEFsbDwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGRlbEJ0bilcclxuICAgICAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5kZWxldGVTZWxlY3RlZCgpfSlcclxuICAgIH1lbHNlIGlmKHNlbGVjdFR5cGU9PVwic2luZ2xlTm9kZVwiIHx8IHNlbGVjdFR5cGU9PVwibXVsdGlwbGVcIil7XHJcbiAgICAgICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDoxMDRweFwiIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rIHczLWJvcmRlclwiPkRlbGV0ZSBBbGw8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBjb25uZWN0VG9CdG4gPSQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo0NSVcIiAgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q29ubmVjdCB0bzwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvbm5lY3RGcm9tQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkNvbm5lY3QgZnJvbTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHNob3dJbmJvdW5kQnRuID0gJCgnPGJ1dHRvbiAgc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5RdWVyeSBJbmJvdW5kPC9idXR0b24+JylcclxuICAgICAgICB2YXIgc2hvd091dEJvdW5kQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPlF1ZXJ5IE91dGJvdW5kPC9idXR0b24+JylcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoZGVsQnRuLCBjb25uZWN0VG9CdG4sY29ubmVjdEZyb21CdG4gLCBzaG93SW5ib3VuZEJ0biwgc2hvd091dEJvdW5kQnRuKVxyXG4gICAgXHJcbiAgICAgICAgc2hvd091dEJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2hvd091dEJvdW5kKCl9KVxyXG4gICAgICAgIHNob3dJbmJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2hvd0luQm91bmQoKX0pICBcclxuICAgICAgICBjb25uZWN0VG9CdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiY29ubmVjdFRvXCJ9KSB9KVxyXG4gICAgICAgIGNvbm5lY3RGcm9tQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImNvbm5lY3RGcm9tXCJ9KSB9KVxyXG5cclxuICAgICAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5kZWxldGVTZWxlY3RlZCgpfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG51bU9mTm9kZSA9IDA7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRkdElkJ10pIG51bU9mTm9kZSsrXHJcbiAgICB9KTtcclxuICAgIGlmKG51bU9mTm9kZT4wKXtcclxuICAgICAgICB2YXIgc2VsZWN0SW5ib3VuZEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+K1NlbGVjdCBJbmJvdW5kPC9idXR0b24+JylcclxuICAgICAgICB2YXIgc2VsZWN0T3V0Qm91bmRCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPitTZWxlY3QgT3V0Ym91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBjb3NlTGF5b3V0QnRuPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkNPU0UgVmlldzwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGhpZGVCdG49ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+SGlkZTwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHNlbGVjdEluYm91bmRCdG4sIHNlbGVjdE91dEJvdW5kQnRuLGNvc2VMYXlvdXRCdG4saGlkZUJ0bilcclxuXHJcbiAgICAgICAgc2VsZWN0SW5ib3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcImFkZFNlbGVjdEluYm91bmRcIn0pfSlcclxuICAgICAgICBzZWxlY3RPdXRCb3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcImFkZFNlbGVjdE91dGJvdW5kXCJ9KX0pXHJcbiAgICAgICAgY29zZUxheW91dEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcIkNPU0VTZWxlY3RlZE5vZGVzXCJ9KX0pXHJcbiAgICAgICAgaGlkZUJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkT2JqZWN0cy5mb3JFYWNoKGVsZT0+e2lmKGVsZVsnJGR0SWQnXSkgdHdpbklEQXJyLnB1c2goZWxlWyckZHRJZCddKX0pXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiaGlkZVNlbGVjdGVkTm9kZXNcIixcInR3aW5JREFyclwiOnR3aW5JREFycn0pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGlmIChudW1PZk5vZGUgPiAxKSB7XHJcbiAgICAgICAgLy9zb21lIGFkZGl0aW9uYWwgYnV0dG9ucyB3aGVuIHNlbGVjdCBtdWx0aXBsZSBpdGVtc1xyXG4gICAgICAgIHRoaXMuZHJhd0FkdmFuY2VBbGlnbm1lbnRCdXR0b25zKClcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3QWR2YW5jZUFsaWdubWVudEJ1dHRvbnM9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBsYWJlbD0kKFwiPGxhYmVsIGNsYXNzPSd3My1ncmF5JyBzdHlsZT0nZGlzcGxheTpibG9jazttYXJnaW4tdG9wOjVweDt3aWR0aDoyMCU7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPkFycmFuZ2U8L2xhYmVsPlwiKSBcclxuICAgIHRoaXMuRE9NLmFwcGVuZChsYWJlbCkgXHJcbiAgICB2YXIgYWxpZ25CdXR0b25zVGFibGU9JChcIjx0YWJsZSBzdHlsZT0nbWFyZ2luOjAgYXV0byc+PHRyPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+PHRyPjx0ZD48L3RkPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpjZW50ZXI7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpkYXJrR3JheSc+QUxJR048L3RkPjx0ZD48L3RkPjwvdHI+PHRyPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+PC90YWJsZT5cIilcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhbGlnbkJ1dHRvbnNUYWJsZSlcclxuICAgIHZhciBhbGlnblRvcEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2hldnJvbi11cFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFsaWduTGVmdEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2hldnJvbi1sZWZ0XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWxpZ25SaWdodEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2hldnJvbi1yaWdodFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFsaWduQm90dG9tQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1jaGV2cm9uLWRvd25cIj48L2k+PC9idXR0b24+JylcclxuICAgIGFsaWduQnV0dG9uc1RhYmxlLmZpbmQoXCJ0ZFwiKS5lcSgxKS5hcHBlbmQoYWxpZ25Ub3BCdXR0b24pXHJcbiAgICBhbGlnbkJ1dHRvbnNUYWJsZS5maW5kKFwidGRcIikuZXEoMykuYXBwZW5kKGFsaWduTGVmdEJ1dHRvbilcclxuICAgIGFsaWduQnV0dG9uc1RhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg1KS5hcHBlbmQoYWxpZ25SaWdodEJ1dHRvbilcclxuICAgIGFsaWduQnV0dG9uc1RhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg3KS5hcHBlbmQoYWxpZ25Cb3R0b21CdXR0b24pXHJcblxyXG5cclxuICAgIHZhciBhcnJhbmdlVGFibGU9JChcIjx0YWJsZSBzdHlsZT0nbWFyZ2luOjAgYXV0byc+PHRyPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+PHRyPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+PC90YWJsZT5cIilcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhcnJhbmdlVGFibGUpXHJcblxyXG4gICAgdmFyIGRpc3RyaWJ1dGVIQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1lbGxpcHNpcy1oIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpIFxyXG4gICAgdmFyIGRpc3RyaWJ1dGVWQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1lbGxpcHNpcy12IGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpIFxyXG4gICAgdmFyIGxlZnRSb3RhdGVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPjxpIGNsYXNzPVwiZmFzIGZhLXVuZG8tYWx0IGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpIFxyXG4gICAgdmFyIHJpZ2h0Um90YXRlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1yZWRvLWFsdCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKSBcclxuICAgIHZhciBtaXJyb3JIQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj48aSBjbGFzcz1cImZhcyBmYS1hcnJvd3MtYWx0LWhcIj48L2k+PC9idXR0b24+JykgXHJcbiAgICB2YXIgbWlycm9yVkJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCIgc3R5bGU9XCJ3aWR0aDoxMDAlXCI+PGkgY2xhc3M9XCJmYXMgZmEtYXJyb3dzLWFsdC12XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgZXhwYW5kQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj48aSBjbGFzcz1cImZhcyBmYS1leHBhbmQtYXJyb3dzLWFsdFwiPjwvaT48L2J1dHRvbj4nKSBcclxuICAgIHZhciBjb21wcmVzc0J1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCIgc3R5bGU9XCJ3aWR0aDoxMDAlXCI+PGkgY2xhc3M9XCJmYXMgZmEtY29tcHJlc3MtYXJyb3dzLWFsdFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgXHJcbiAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDApLmFwcGVuZChkaXN0cmlidXRlSEJ1dHRvbilcclxuICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMSkuYXBwZW5kKGRpc3RyaWJ1dGVWQnV0dG9uKVxyXG4gICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSgyKS5hcHBlbmQobGVmdFJvdGF0ZUJ1dHRvbilcclxuICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMykuYXBwZW5kKHJpZ2h0Um90YXRlQnV0dG9uKVxyXG4gICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg0KS5hcHBlbmQobWlycm9ySEJ1dHRvbilcclxuICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoNSkuYXBwZW5kKG1pcnJvclZCdXR0b24pXHJcbiAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDYpLmFwcGVuZChleHBhbmRCdXR0b24pXHJcbiAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDcpLmFwcGVuZChjb21wcmVzc0J1dHRvbilcclxuXHJcblxyXG4gICAgYWxpZ25Ub3BCdXR0b24ub24oXCJjbGlja1wiLCAoZSkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFsaWduU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJ0b3BcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgYWxpZ25MZWZ0QnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFsaWduU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJsZWZ0XCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIGFsaWduUmlnaHRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWxpZ25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcInJpZ2h0XCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIGFsaWduQm90dG9tQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFsaWduU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJib3R0b21cIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG5cclxuICAgIGRpc3RyaWJ1dGVIQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpc3RyaWJ1dGVTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImhvcml6b250YWxcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgZGlzdHJpYnV0ZVZCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZGlzdHJpYnV0ZVNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwidmVydGljYWxcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgbGVmdFJvdGF0ZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJyb3RhdGVTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImxlZnRcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgcmlnaHRSb3RhdGVCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicm90YXRlU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJyaWdodFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICBtaXJyb3JIQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIm1pcnJvclNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwiaG9yaXpvbnRhbFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICBtaXJyb3JWQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIm1pcnJvclNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwidmVydGljYWxcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgZXhwYW5kQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpbWVuc2lvblNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwiZXhwYW5kXCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIGNvbXByZXNzQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpbWVuc2lvblNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwiY29tcHJlc3NcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmV4cG9ydFNlbGVjdGVkPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgdmFyIHR3aW5Ub0JlU3RvcmVkPVtdXHJcbiAgICB2YXIgdHdpbklEcz17fVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm5cclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgICAgIHZhciBhbkV4cFR3aW49e31cclxuICAgICAgICBhbkV4cFR3aW5bXCIkbWV0YWRhdGFcIl09e1wiJG1vZGVsXCI6ZWxlbWVudFtcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXX1cclxuICAgICAgICBmb3IodmFyIGluZCBpbiBlbGVtZW50KXtcclxuICAgICAgICAgICAgaWYoaW5kPT1cIiRtZXRhZGF0YVwiIHx8IGluZD09XCIkZXRhZ1wiKSBjb250aW51ZSBcclxuICAgICAgICAgICAgZWxzZSBhbkV4cFR3aW5baW5kXT1lbGVtZW50W2luZF1cclxuICAgICAgICB9XHJcbiAgICAgICAgdHdpblRvQmVTdG9yZWQucHVzaChhbkV4cFR3aW4pXHJcbiAgICAgICAgdHdpbklEc1tlbGVtZW50WyckZHRJZCddXT0xXHJcbiAgICB9KTtcclxuICAgIHZhciByZWxhdGlvbnNUb0JlU3RvcmVkPVtdXHJcbiAgICB0d2luSURBcnIuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnM9Z2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgIGlmKCFyZWxhdGlvbnMpIHJldHVybjtcclxuICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bXCIkdGFyZ2V0SWRcIl1cclxuICAgICAgICAgICAgaWYodHdpbklEc1t0YXJnZXRJRF0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmo9e31cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVJlbGF0aW9uKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihpbmQgPT1cIiRldGFnXCJ8fGluZCA9PVwiJHJlbGF0aW9uc2hpcElkXCJ8fGluZCA9PVwiJHNvdXJjZUlkXCJ8fGluZCA9PVwic291cmNlTW9kZWxcIikgY29udGludWVcclxuICAgICAgICAgICAgICAgICAgICBvYmpbaW5kXT1vbmVSZWxhdGlvbltpbmRdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgb25lQWN0aW9uPXtcIiRzcmNJZFwiOm9uZUlELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcElkXCI6b25lUmVsYXRpb25bXCIkcmVsYXRpb25zaGlwSWRcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvYmpcIjpvYmp9XHJcbiAgICAgICAgICAgICAgICByZWxhdGlvbnNUb0JlU3RvcmVkLnB1c2gob25lQWN0aW9uKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgZmluYWxKU09OPXtcInR3aW5zXCI6dHdpblRvQmVTdG9yZWQsXCJyZWxhdGlvbnNcIjpyZWxhdGlvbnNUb0JlU3RvcmVkfVxyXG4gICAgdmFyIHBvbSA9ICQoXCI8YT48L2E+XCIpXHJcbiAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGZpbmFsSlNPTikpKTtcclxuICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0VHdpbnNEYXRhLmpzb25cIik7XHJcbiAgICBwb21bMF0uY2xpY2soKVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlYWRPbmVGaWxlPSBhc3luYyBmdW5jdGlvbihhRmlsZSl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSAoKT0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoYUZpbGUpO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlYWRUd2luc0ZpbGVzQ29udGVudEFuZEltcG9ydD1hc3luYyBmdW5jdGlvbihmaWxlcyl7XHJcbiAgICB2YXIgaW1wb3J0VHdpbnM9W11cclxuICAgIHZhciBpbXBvcnRSZWxhdGlvbnM9W11cclxuICAgIGZvciAodmFyIGkgPSAwOyBpPCBmaWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBmPWZpbGVzW2ldXHJcbiAgICAgICAgLy8gT25seSBwcm9jZXNzIGpzb24gZmlsZXMuXHJcbiAgICAgICAgaWYgKGYudHlwZSE9XCJhcHBsaWNhdGlvbi9qc29uXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHN0cj0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZShmKVxyXG4gICAgICAgICAgICB2YXIgb2JqPUpTT04ucGFyc2Uoc3RyKVxyXG4gICAgICAgICAgICBpZihvYmoudHdpbnMpIGltcG9ydFR3aW5zPWltcG9ydFR3aW5zLmNvbmNhdChvYmoudHdpbnMpXHJcbiAgICAgICAgICAgIGlmKG9iai5yZWxhdGlvbnMpIGltcG9ydFJlbGF0aW9ucz1pbXBvcnRSZWxhdGlvbnMuY29uY2F0KG9iai5yZWxhdGlvbnMpXHJcbiAgICAgICAgfWNhdGNoKGVycil7XHJcbiAgICAgICAgICAgIGFsZXJ0KGVycilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9mb3IgQURUIFVJIHN0YW5kYWxvbmUgdG9vbCwgdHJhbnNsYXRlIGFsbCB0d2luIElEIGJ5IGl0cyBkaXNwbGF5TmFtZVxyXG4gICAgdmFyIElEdG9OYW1lPXt9XHJcbiAgICBpbXBvcnRUd2lucy5mb3JFYWNoKG9uZVR3aW49PntcclxuICAgICAgICB2YXIgZGlzcGxheU5hbWU9b25lVHdpbltcImRpc3BsYXlOYW1lXCJdIHx8IG9uZVR3aW5bXCIkZHRJZFwiXVxyXG4gICAgICAgIElEdG9OYW1lW29uZVR3aW5bXCIkZHRJZFwiXV09ZGlzcGxheU5hbWVcclxuICAgICAgICBvbmVUd2luW1wiJGR0SWRcIl09ZGlzcGxheU5hbWVcclxuICAgICAgICBkZWxldGUgb25lVHdpbltcImRpc3BsYXlOYW1lXCJdXHJcbiAgICB9KVxyXG4gICAgaW1wb3J0UmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICBvbmVSZWxhdGlvbltcIiRzcmNJZFwiXT1JRHRvTmFtZVtvbmVSZWxhdGlvbltcIiRzcmNJZFwiXV18fG9uZVJlbGF0aW9uW1wiJHNyY0lkXCJdXHJcbiAgICAgICAgb25lUmVsYXRpb25bXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl09SUR0b05hbWVbb25lUmVsYXRpb25bXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl1dfHxvbmVSZWxhdGlvbltcIm9ialwiXVtcIiR0YXJnZXRJZFwiXVxyXG4gICAgfSlcclxuXHJcblxyXG4gICAgdmFyIHR3aW5zSW1wb3J0UmVzdWx0PSBhd2FpdCB0aGlzLmJhdGNoSW1wb3J0VHdpbnMoaW1wb3J0VHdpbnMpXHJcbiAgICB0d2luc0ltcG9ydFJlc3VsdC5mb3JFYWNoKGRhdGE9PntcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tkYXRhW1wiJGR0SWRcIl1dID0gZGF0YTtcclxuICAgIH0pXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhZGROZXdUd2luc1wiLHR3aW5zSW5mbzp0d2luc0ltcG9ydFJlc3VsdH0pXHJcblxyXG4gICAgdmFyIHJlbGF0aW9uc0ltcG9ydFJlc3VsdD1hd2FpdCB0aGlzLmJhdGNoSW1wb3J0UmVsYXRpb25zKGltcG9ydFJlbGF0aW9ucylcclxuICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kKHJlbGF0aW9uc0ltcG9ydFJlc3VsdClcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIixpbmZvOnJlbGF0aW9uc0ltcG9ydFJlc3VsdH0pXHJcblxyXG4gICAgdmFyIG51bU9mVHdpbnM9dHdpbnNJbXBvcnRSZXN1bHQubGVuZ3RoXHJcbiAgICB2YXIgbnVtT2ZSZWxhdGlvbnM9cmVsYXRpb25zSW1wb3J0UmVzdWx0Lmxlbmd0aFxyXG4gICAgdmFyIHN0cj1cIkFkZCBcIitudW1PZlR3aW5zKyBcIiBub2RlXCIrKChudW1PZlR3aW5zPD0xKT9cIlwiOlwic1wiKStcIiwgXCIrbnVtT2ZSZWxhdGlvbnMrXCIgcmVsYXRpb25zaGlwXCIrKChudW1PZlJlbGF0aW9uczw9MSk/XCJcIjpcInNcIilcclxuICAgIHN0cis9YC4gKFJhdyB0d2luIHJlY29yZHM6JHtpbXBvcnRUd2lucy5sZW5ndGh9KTsgUmF3IHJlbGF0aW9ucyByZWNvcmRzOiR7aW1wb3J0UmVsYXRpb25zLmxlbmd0aH0pYFxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCI0MDBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJJbXBvcnQgUmVzdWx0XCJcclxuICAgICAgICAgICAgLCBjb250ZW50OnN0clxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJPa1wiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5iYXRjaEltcG9ydFR3aW5zPWFzeW5jIGZ1bmN0aW9uKHR3aW5zKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgaWYodHdpbnMubGVuZ3RoPT0wKSByZXNvbHZlKFtdKVxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgJC5wb3N0KFwiZWRpdEFEVC9iYXRjaEltcG9ydFR3aW5zXCIse1widHdpbnNcIjpKU09OLnN0cmluZ2lmeSh0d2lucyl9LCAoZGF0YSk9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSBkYXRhPVtdXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5iYXRjaEltcG9ydFJlbGF0aW9ucz1hc3luYyBmdW5jdGlvbihyZWxhdGlvbnMpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBpZihyZWxhdGlvbnMubGVuZ3RoPT0wKSByZXNvbHZlKFtdKVxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgJC5wb3N0KFwiZWRpdEFEVC9jcmVhdGVSZWxhdGlvbnNcIix7XCJhY3Rpb25zXCI6SlNPTi5zdHJpbmdpZnkocmVsYXRpb25zKX0sIChkYXRhKT0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhID09IFwiXCIpIGRhdGE9W11cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yZWZyZXNoSW5mb21hdGlvbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIHZhciBxdWVyeUFycj1bXVxyXG4gICAgYXJyLmZvckVhY2gob25lSXRlbT0+e1xyXG4gICAgICAgIGlmKG9uZUl0ZW1bJyRyZWxhdGlvbnNoaXBJZCddKSBxdWVyeUFyci5wdXNoKHsnJHNvdXJjZUlkJzpvbmVJdGVtWyckc291cmNlSWQnXSwnJHJlbGF0aW9uc2hpcElkJzpvbmVJdGVtWyckcmVsYXRpb25zaGlwSWQnXX0pXHJcbiAgICAgICAgZWxzZSBxdWVyeUFyci5wdXNoKHsnJGR0SWQnOm9uZUl0ZW1bJyRkdElkJ119KVxyXG4gICAgfSlcclxuXHJcbiAgICAkLnBvc3QoXCJxdWVyeUFEVC9mZXRjaEluZm9tYXRpb25cIix7XCJlbGVtZW50c1wiOnF1ZXJ5QXJyfSwgIChkYXRhKT0+IHtcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSByZXR1cm47XHJcbiAgICAgICAgZGF0YS5mb3JFYWNoKG9uZVJlPT57XHJcbiAgICAgICAgICAgIGlmKG9uZVJlW1wiJHJlbGF0aW9uc2hpcElkXCJdKXsvL3VwZGF0ZSBzdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNcclxuICAgICAgICAgICAgICAgIHZhciBzcmNJRD0gb25lUmVbJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVsYXRpb25zaGlwSWQ9IG9uZVJlWyckcmVsYXRpb25zaGlwSWQnXVxyXG4gICAgICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY0lEXSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlbGF0aW9ucz1nbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdXHJcbiAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zLmZvckVhY2gob25lU3RvcmVkUmVsYXRpb249PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYob25lU3RvcmVkUmVsYXRpb25bJyRyZWxhdGlvbnNoaXBJZCddPT1yZWxhdGlvbnNoaXBJZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3VwZGF0ZSBhbGwgY29udGVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lUmUpeyBvbmVTdG9yZWRSZWxhdGlvbltpbmRdPW9uZVJlW2luZF0gfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfWVsc2V7Ly91cGRhdGUgc3RvcmVkVHdpbnNcclxuICAgICAgICAgICAgICAgIHZhciB0d2luSUQ9IG9uZVJlWyckZHRJZCddXHJcbiAgICAgICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0d2luSURdIT1udWxsKXtcclxuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVSZSl7IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3R3aW5JRF1baW5kXT1vbmVSZVtpbmRdIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9yZWRyYXcgaW5mb3BhbmVsIGlmIG5lZWRlZFxyXG4gICAgICAgIGlmKHRoaXMuc2VsZWN0ZWRPYmplY3RzLmxlbmd0aD09MSkgdGhpcy5yeE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIiwgaW5mbzogdGhpcy5zZWxlY3RlZE9iamVjdHMgfSlcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVTZWxlY3RlZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGlmKGFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciByZWxhdGlvbnNBcnI9W11cclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIHZhciB0d2luSURzPXt9XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJlbGF0aW9uc0Fyci5wdXNoKGVsZW1lbnQpO1xyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICAgICAgICAgIHR3aW5JRHNbZWxlbWVudFsnJGR0SWQnXV09MVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgZm9yKHZhciBpPXJlbGF0aW9uc0Fyci5sZW5ndGgtMTtpPj0wO2ktLSl7IC8vY2xlYXIgdGhvc2UgcmVsYXRpb25zaGlwcyB0aGF0IGFyZSBnb2luZyB0byBiZSBkZWxldGVkIGFmdGVyIHR3aW5zIGRlbGV0aW5nXHJcbiAgICAgICAgdmFyIHNyY0lkPSAgcmVsYXRpb25zQXJyW2ldWyckc291cmNlSWQnXVxyXG4gICAgICAgIHZhciB0YXJnZXRJZCA9IHJlbGF0aW9uc0FycltpXVsnJHRhcmdldElkJ11cclxuICAgICAgICBpZih0d2luSURzW3NyY0lkXSE9bnVsbCB8fCB0d2luSURzW3RhcmdldElkXSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHJlbGF0aW9uc0Fyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIHZhciBkaWFsb2dTdHI9XCJcIlxyXG4gICAgdmFyIHR3aW5OdW1iZXI9dHdpbklEQXJyLmxlbmd0aDtcclxuICAgIHZhciByZWxhdGlvbnNOdW1iZXIgPSByZWxhdGlvbnNBcnIubGVuZ3RoO1xyXG4gICAgaWYodHdpbk51bWJlcj4wKSBkaWFsb2dTdHIgPSAgdHdpbk51bWJlcitcIiB0d2luXCIrKCh0d2luTnVtYmVyPjEpP1wic1wiOlwiXCIpICsgXCIgKHdpdGggY29ubmVjdGVkIHJlbGF0aW9ucylcIlxyXG4gICAgaWYodHdpbk51bWJlcj4wICYmIHJlbGF0aW9uc051bWJlcj4wKSBkaWFsb2dTdHIrPVwiIGFuZCBhZGRpdGlvbmFsIFwiXHJcbiAgICBpZihyZWxhdGlvbnNOdW1iZXI+MCkgZGlhbG9nU3RyICs9ICByZWxhdGlvbnNOdW1iZXIrXCIgcmVsYXRpb25cIisoKHJlbGF0aW9uc051bWJlcj4xKT9cInNcIjpcIlwiIClcclxuICAgIGRpYWxvZ1N0cis9XCIgd2lsbCBiZSBkZWxldGVkLiBQbGVhc2UgY29uZmlybVwiXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIzNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OmRpYWxvZ1N0clxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0d2luSURBcnIubGVuZ3RoID4gMCkgdGhpcy5kZWxldGVUd2lucyh0d2luSURBcnIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGlvbnNBcnIubGVuZ3RoID4gMCkgdGhpcy5kZWxldGVSZWxhdGlvbnMocmVsYXRpb25zQXJyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlVHdpbnM9YXN5bmMgZnVuY3Rpb24odHdpbklEQXJyKXsgICBcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdmFyIHJlc3VsdD1hd2FpdCB0aGlzLmRlbGV0ZVBhcnRpYWxUd2lucyhzbWFsbEFycilcclxuXHJcbiAgICAgICAgcmVzdWx0LmZvckVhY2goKG9uZUlEKT0+e1xyXG4gICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbb25lSURdXHJcbiAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInR3aW5zRGVsZXRlZFwiLHR3aW5JREFycjpyZXN1bHR9KVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVBhcnRpYWxUd2lucz0gYXN5bmMgZnVuY3Rpb24oSURBcnIpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQucG9zdChcImVkaXRBRFQvZGVsZXRlVHdpbnNcIix7YXJyOklEQXJyfSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W11cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVSZWxhdGlvbnM9YXN5bmMgZnVuY3Rpb24ocmVsYXRpb25zQXJyKXtcclxuICAgIHZhciBhcnI9W11cclxuICAgIHJlbGF0aW9uc0Fyci5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgYXJyLnB1c2goe3NyY0lEOm9uZVJlbGF0aW9uWyckc291cmNlSWQnXSxyZWxJRDpvbmVSZWxhdGlvblsnJHJlbGF0aW9uc2hpcElkJ119KVxyXG4gICAgfSlcclxuICAgICQucG9zdChcImVkaXRBRFQvZGVsZXRlUmVsYXRpb25zXCIse1wicmVsYXRpb25zXCI6YXJyfSwgIChkYXRhKT0+IHsgXHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXTtcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX3JlbW92ZShkYXRhKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJlbGF0aW9uc0RlbGV0ZWRcIixcInJlbGF0aW9uc1wiOmRhdGF9KVxyXG4gICAgfSk7XHJcbiAgICBcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5zaG93T3V0Qm91bmQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVybjtcclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdmFyIGRhdGE9YXdhaXQgdGhpcy5mZXRjaFBhcnRpYWxPdXRib3VuZHMoc21hbGxBcnIpXHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgY29udGludWU7XHJcbiAgICAgICAgLy9uZXcgdHdpbidzIHJlbGF0aW9uc2hpcCBzaG91bGQgYmUgc3RvcmVkIGFzIHdlbGxcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEubmV3VHdpblJlbGF0aW9ucylcclxuICAgICAgICBcclxuICAgICAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICAgICAgdmFyIG9uZVR3aW49b25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbaW5kXT1vbmVUd2luXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiLGluZm86ZGF0YX0pXHJcbiAgICAgICAgXHJcblxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNob3dJbkJvdW5kPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm47XHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHZhciBkYXRhPWF3YWl0IHRoaXMuZmV0Y2hQYXJ0aWFsSW5ib3VuZHMoc21hbGxBcnIpXHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgY29udGludWU7XHJcbiAgICAgICAgLy9uZXcgdHdpbidzIHJlbGF0aW9uc2hpcCBzaG91bGQgYmUgc3RvcmVkIGFzIHdlbGxcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEubmV3VHdpblJlbGF0aW9ucylcclxuICAgICAgICBcclxuICAgICAgICAvL2RhdGEubmV3VHdpblJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57Y29uc29sZS5sb2cob25lUmVsYXRpb25bJyRzb3VyY2VJZCddK1wiLT5cIitvbmVSZWxhdGlvblsnJHRhcmdldElkJ10pfSlcclxuICAgICAgICAvL2NvbnNvbGUubG9nKGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tcImRlZmF1bHRcIl0pXHJcblxyXG4gICAgICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tpbmRdPW9uZVR3aW5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIsaW5mbzpkYXRhfSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5mZXRjaFBhcnRpYWxPdXRib3VuZHM9IGFzeW5jIGZ1bmN0aW9uKElEQXJyKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAvL2ZpbmQgb3V0IHRob3NlIGV4aXN0ZWQgb3V0Ym91bmQgd2l0aCBrbm93biB0YXJnZXQgVHdpbnMgc28gdGhleSBjYW4gYmUgZXhjbHVkZWQgZnJvbSBxdWVyeVxyXG4gICAgICAgICAgICB2YXIga25vd25UYXJnZXRUd2lucz17fVxyXG4gICAgICAgICAgICBJREFyci5mb3JFYWNoKG9uZUlEPT57XHJcbiAgICAgICAgICAgICAgICBrbm93blRhcmdldFR3aW5zW29uZUlEXT0xIC8vaXRzZWxmIGFsc28gaXMga25vd25cclxuICAgICAgICAgICAgICAgIHZhciBvdXRCb3VuZFJlbGF0aW9uPWdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICAgICAgICAgIGlmKG91dEJvdW5kUmVsYXRpb24pe1xyXG4gICAgICAgICAgICAgICAgICAgIG91dEJvdW5kUmVsYXRpb24uZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bXCIkdGFyZ2V0SWRcIl1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdIT1udWxsKSBrbm93blRhcmdldFR3aW5zW3RhcmdldElEXT0xXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL3Nob3dPdXRCb3VuZFwiLHthcnI6SURBcnIsXCJrbm93blRhcmdldHNcIjprbm93blRhcmdldFR3aW5zfSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmZldGNoUGFydGlhbEluYm91bmRzPSBhc3luYyBmdW5jdGlvbihJREFycil7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgLy9maW5kIG91dCB0aG9zZSBleGlzdGVkIGluYm91bmQgd2l0aCBrbm93biBzb3VyY2UgVHdpbnMgc28gdGhleSBjYW4gYmUgZXhjbHVkZWQgZnJvbSBxdWVyeVxyXG4gICAgICAgICAgICB2YXIga25vd25Tb3VyY2VUd2lucz17fVxyXG4gICAgICAgICAgICB2YXIgSUREaWN0PXt9XHJcbiAgICAgICAgICAgIElEQXJyLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICAgICAgICAgIElERGljdFtvbmVJRF09MVxyXG4gICAgICAgICAgICAgICAga25vd25Tb3VyY2VUd2luc1tvbmVJRF09MSAvL2l0c2VsZiBhbHNvIGlzIGtub3duXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGZvcih2YXIgdHdpbklEIGluIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVsYXRpb25zPWdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdXHJcbiAgICAgICAgICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvblsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoSUREaWN0W3RhcmdldElEXSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSE9bnVsbCkga25vd25Tb3VyY2VUd2luc1tzcmNJRF09MVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL3Nob3dJbkJvdW5kXCIse2FycjpJREFycixcImtub3duU291cmNlc1wiOmtub3duU291cmNlVHdpbnN9LCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd011bHRpcGxlT2JqPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgbnVtT2ZFZGdlID0gMDtcclxuICAgIHZhciBudW1PZk5vZGUgPSAwO1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGlmKGFycj09bnVsbCkgcmV0dXJuO1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSBudW1PZkVkZ2UrK1xyXG4gICAgICAgIGVsc2UgbnVtT2ZOb2RlKytcclxuICAgIH0pO1xyXG4gICAgdmFyIHRleHREaXY9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jazttYXJnaW4tdG9wOjEwcHgnPjwvbGFiZWw+XCIpXHJcbiAgICB0ZXh0RGl2LnRleHQobnVtT2ZOb2RlKyBcIiBub2RlXCIrKChudW1PZk5vZGU8PTEpP1wiXCI6XCJzXCIpK1wiLCBcIitudW1PZkVkZ2UrXCIgcmVsYXRpb25zaGlwXCIrKChudW1PZkVkZ2U8PTEpP1wiXCI6XCJzXCIpKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRleHREaXYpXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd1N0YXRpY0luZm89ZnVuY3Rpb24ocGFyZW50LGpzb25JbmZvLHBhZGRpbmdUb3AsZm9udFNpemUpe1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgY2xhc3M9J3czLWRhcmstZ3JheScgc3R5bGU9J2JhY2tncm91bmQtY29sb3I6I2Y2ZjZmNjtkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW07Zm9udC1zaXplOjEwcHgnPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIscGFkZGluZ1RvcClcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8oY29udGVudERPTSxqc29uSW5mb1tpbmRdLFwiLjVlbVwiLGZvbnRTaXplKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjJlbVwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgY29udGVudERPTS5jc3Moe1wiZm9udFNpemVcIjpmb250U2l6ZSxcImNvbG9yXCI6XCJibGFja1wifSlcclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0VkaXRhYmxlPWZ1bmN0aW9uKHBhcmVudCxqc29uSW5mbyxvcmlnaW5FbGVtZW50SW5mbyxwYXRoQXJyLGlzTmV3VHdpbil7XHJcbiAgICBpZihqc29uSW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTsgbWFyZ2luLXJpZ2h0OjVweCc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBpZihpc05ld1R3aW4pe1xyXG4gICAgICAgICAgICBpZihpbmQ9PVwiJGR0SWRcIikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50LnByZXBlbmQoa2V5RGl2KVxyXG4gICAgICAgICAgICAgICAga2V5RGl2LmF0dHIoJ2lkJywnTkVXVFdJTl9JRExhYmVsJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjNlbVwiKSBcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBzdHlsZT0ncGFkZGluZy10b3A6LjJlbSc+PC9sYWJlbD5cIilcclxuICAgICAgICB2YXIgbmV3UGF0aD1wYXRoQXJyLmNvbmNhdChbaW5kXSlcclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGpzb25JbmZvW2luZF0pKXtcclxuICAgICAgICAgICAga2V5RGl2LmNoaWxkcmVuKFwiOmZpcnN0XCIpLmFkZENsYXNzKFwidzMtbGltZVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdEcm9wZG93bk9wdGlvbihjb250ZW50RE9NLG5ld1BhdGgsanNvbkluZm9baW5kXSxpc05ld1R3aW4sb3JpZ2luRWxlbWVudEluZm8pXHJcbiAgICAgICAgfWVsc2UgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICBrZXlEaXYuY2hpbGRyZW4oXCI6Zmlyc3RcIikuY3NzKFwiZm9udC13ZWlnaHRcIixcImJvbGRcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoLGlzTmV3VHdpbilcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIGtleURpdi5jaGlsZHJlbihcIjpmaXJzdFwiKS5hZGRDbGFzcyhcInczLWxpbWVcIilcclxuICAgICAgICAgICAgdmFyIGFJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cInBhZGRpbmc6MnB4O3dpZHRoOjUwJTtvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmVcIiBwbGFjZWhvbGRlcj1cInR5cGU6ICcranNvbkluZm9baW5kXSsnXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpOyAgXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uYXBwZW5kKGFJbnB1dClcclxuICAgICAgICAgICAgdmFyIHZhbD10aGlzLnNlYXJjaFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLG5ld1BhdGgpXHJcbiAgICAgICAgICAgIGlmKHZhbCE9bnVsbCkgYUlucHV0LnZhbCh2YWwpXHJcbiAgICAgICAgICAgIGFJbnB1dC5kYXRhKFwicGF0aFwiLCBuZXdQYXRoKVxyXG4gICAgICAgICAgICBhSW5wdXQuZGF0YShcImRhdGFUeXBlXCIsIGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgIGFJbnB1dC5jaGFuZ2UoKGUpPT57XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXREVFByb3BlcnR5KG9yaWdpbkVsZW1lbnRJbmZvLCQoZS50YXJnZXQpLmRhdGEoXCJwYXRoXCIpLCQoZS50YXJnZXQpLnZhbCgpLCQoZS50YXJnZXQpLmRhdGEoXCJkYXRhVHlwZVwiKSxpc05ld1R3aW4pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3RHJvcGRvd25PcHRpb249ZnVuY3Rpb24oY29udGVudERPTSxuZXdQYXRoLHZhbHVlQXJyLGlzTmV3VHdpbixvcmlnaW5FbGVtZW50SW5mbyl7XHJcbiAgICB2YXIgYVNlbGVjdE1lbnU9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJcIix7YnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjRweCAxNnB4XCJ9fSlcclxuICAgIGNvbnRlbnRET00uYXBwZW5kKGFTZWxlY3RNZW51LkRPTSlcclxuICAgIGFTZWxlY3RNZW51LkRPTS5kYXRhKFwicGF0aFwiLCBuZXdQYXRoKVxyXG4gICAgdmFsdWVBcnIuZm9yRWFjaCgob25lT3B0aW9uKT0+e1xyXG4gICAgICAgIHZhciBzdHIgPW9uZU9wdGlvbltcImRpc3BsYXlOYW1lXCJdICB8fCBvbmVPcHRpb25bXCJlbnVtVmFsdWVcIl0gXHJcbiAgICAgICAgYVNlbGVjdE1lbnUuYWRkT3B0aW9uKHN0cilcclxuICAgIH0pXHJcbiAgICBhU2VsZWN0TWVudS5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSxyZWFsTW91c2VDbGljayk9PntcclxuICAgICAgICBhU2VsZWN0TWVudS5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spIHRoaXMuZWRpdERUUHJvcGVydHkob3JpZ2luRWxlbWVudEluZm8sYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIpLG9wdGlvblZhbHVlLFwic3RyaW5nXCIsaXNOZXdUd2luKVxyXG4gICAgfVxyXG4gICAgdmFyIHZhbD10aGlzLnNlYXJjaFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLG5ld1BhdGgpXHJcbiAgICBpZih2YWwhPW51bGwpe1xyXG4gICAgICAgIGFTZWxlY3RNZW51LnRyaWdnZXJPcHRpb25WYWx1ZSh2YWwpXHJcbiAgICB9ICAgIFxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmVkaXREVFByb3BlcnR5PWZ1bmN0aW9uKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGgsbmV3VmFsLGRhdGFUeXBlLGlzTmV3VHdpbil7XHJcbiAgICBpZiAoW1wiZG91YmxlXCIsIFwiZmxvYXRcIiwgXCJpbnRlZ2VyXCIsIFwibG9uZ1wiXS5pbmNsdWRlcyhkYXRhVHlwZSkpIG5ld1ZhbCA9IE51bWJlcihuZXdWYWwpXHJcbiAgICBpZiAoZGF0YVR5cGUgPT0gXCJib29sZWFuXCIpIHtcclxuICAgICAgICBpZiAobmV3VmFsID09IFwidHJ1ZVwiKSBuZXdWYWwgPSB0cnVlXHJcbiAgICAgICAgZWxzZSBuZXdWYWwgPSBmYWxzZVxyXG4gICAgfVxyXG5cclxuICAgIC8veyBcIm9wXCI6IFwiYWRkXCIsIFwicGF0aFwiOiBcIi94XCIsIFwidmFsdWVcIjogMzAgfVxyXG4gICAgaWYoaXNOZXdUd2luKXtcclxuICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGgsbmV3VmFsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmKHBhdGgubGVuZ3RoPT0xKXtcclxuICAgICAgICB2YXIgc3RyPVwiXCJcclxuICAgICAgICBwYXRoLmZvckVhY2goc2VnbWVudD0+e3N0cis9XCIvXCIrc2VnbWVudH0pXHJcbiAgICAgICAgdmFyIGpzb25QYXRjaD1bIHsgXCJvcFwiOiBcImFkZFwiLCBcInBhdGhcIjogc3RyLCBcInZhbHVlXCI6IG5ld1ZhbH0gXVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgLy9pdCBpcyBhIHByb3BlcnR5IGluc2lkZSBhIG9iamVjdCB0eXBlIG9mIHJvb3QgcHJvcGVydHksdXBkYXRlIHRoZSB3aG9sZSByb290IHByb3BlcnR5XHJcbiAgICAgICAgdmFyIHJvb3RQcm9wZXJ0eT1wYXRoWzBdXHJcbiAgICAgICAgdmFyIHBhdGNoVmFsdWU9IG9yaWdpbkVsZW1lbnRJbmZvW3Jvb3RQcm9wZXJ0eV1cclxuICAgICAgICBpZihwYXRjaFZhbHVlPT1udWxsKSBwYXRjaFZhbHVlPXt9XHJcbiAgICAgICAgZWxzZSBwYXRjaFZhbHVlPUpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkocGF0Y2hWYWx1ZSkpIC8vbWFrZSBhIGNvcHlcclxuICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKHBhdGNoVmFsdWUscGF0aC5zbGljZSgxKSxuZXdWYWwpXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGpzb25QYXRjaD1bIHsgXCJvcFwiOiBcImFkZFwiLCBcInBhdGhcIjogXCIvXCIrcm9vdFByb3BlcnR5LCBcInZhbHVlXCI6IHBhdGNoVmFsdWV9IF1cclxuICAgIH1cclxuXHJcbiAgICBpZihvcmlnaW5FbGVtZW50SW5mb1tcIiRkdElkXCJdKXsgLy9lZGl0IGEgbm9kZSBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciB0d2luSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgdmFyIHBheUxvYWQ9e1wianNvblBhdGNoXCI6SlNPTi5zdHJpbmdpZnkoanNvblBhdGNoKSxcInR3aW5JRFwiOnR3aW5JRH1cclxuICAgIH1lbHNlIGlmKG9yaWdpbkVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdKXsgLy9lZGl0IGEgcmVsYXRpb25zaGlwIHByb3BlcnR5XHJcbiAgICAgICAgdmFyIHR3aW5JRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc2hpcElEID0gb3JpZ2luRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICB2YXIgcGF5TG9hZD17XCJqc29uUGF0Y2hcIjpKU09OLnN0cmluZ2lmeShqc29uUGF0Y2gpLFwidHdpbklEXCI6dHdpbklELFwicmVsYXRpb25zaGlwSURcIjpyZWxhdGlvbnNoaXBJRH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgJC5wb3N0KFwiZWRpdEFEVC9jaGFuZ2VBdHRyaWJ1dGVcIixwYXlMb2FkXHJcbiAgICAgICAgLCAgKGRhdGEpPT4ge1xyXG4gICAgICAgICAgICBpZihkYXRhIT1cIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAvL25vdCBzdWNjZXNzZnVsIGVkaXRpbmdcclxuICAgICAgICAgICAgICAgIGFsZXJ0KGRhdGEpXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgLy9zdWNjZXNzZnVsIGVkaXRpbmcsIHVwZGF0ZSB0aGUgbm9kZSBvcmlnaW5hbCBpbmZvXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGgsbmV3VmFsKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWU9ZnVuY3Rpb24obm9kZUluZm8scGF0aEFycixuZXdWYWwpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciB0aGVKc29uPW5vZGVJbmZvXHJcbiAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGtleT1wYXRoQXJyW2ldXHJcblxyXG4gICAgICAgIGlmKGk9PXBhdGhBcnIubGVuZ3RoLTEpe1xyXG4gICAgICAgICAgICB0aGVKc29uW2tleV09bmV3VmFsXHJcbiAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRoZUpzb25ba2V5XT09bnVsbCkgdGhlSnNvbltrZXldPXt9XHJcbiAgICAgICAgdGhlSnNvbj10aGVKc29uW2tleV1cclxuICAgIH1cclxuICAgIHJldHVyblxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNlYXJjaFZhbHVlPWZ1bmN0aW9uKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIHRoZUpzb249b3JpZ2luRWxlbWVudEluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgICAgIGlmKHRoZUpzb249PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoZUpzb24gLy9pdCBzaG91bGQgYmUgdGhlIGZpbmFsIHZhbHVlXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGluZm9QYW5lbCgpOyIsIiQoJ2RvY3VtZW50JykucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgIGNvbnN0IG1haW5VST1yZXF1aXJlKFwiLi9tYWluVUkuanNcIikgICAgXHJcbn0pOyIsImNvbnN0IGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4vbW9kZWxNYW5hZ2VyRGlhbG9nXCIpXHJcbmNvbnN0IGVkaXRMYXlvdXREaWFsb2c9IHJlcXVpcmUoXCIuL2VkaXRMYXlvdXREaWFsb2dcIilcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBtYWluVG9vbGJhcigpIHtcclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuYWRkQ2xhc3MoXCJ3My1iYXIgdzMtcmVkXCIpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmNzcyh7XCJ6LWluZGV4XCI6MTAwLFwib3ZlcmZsb3dcIjpcInZpc2libGVcIn0pXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hBRFRJbnN0YW5jZUJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+U291cmNlPC9hPicpXHJcbiAgICB0aGlzLm1vZGVsSU9CdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPk1vZGVsczwvYT4nKVxyXG4gICAgdGhpcy5zaG93Rm9yZ2VWaWV3QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLW5vbmUgdzMtdGV4dC1saWdodC1ncmV5IHczLWhvdmVyLXRleHQtbGlnaHQtZ3JleVwiIHN0eWxlPVwib3BhY2l0eTouMzVcIiBocmVmPVwiI1wiPkZvcmdlVmlldzwvYT4nKVxyXG4gICAgdGhpcy5zaG93R0lTVmlld0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1ub25lIHczLXRleHQtbGlnaHQtZ3JleSB3My1ob3Zlci10ZXh0LWxpZ2h0LWdyZXlcIiBzdHlsZT1cIm9wYWNpdHk6LjM1XCIgaHJlZj1cIiNcIj5HSVNWaWV3PC9hPicpXHJcbiAgICB0aGlzLmVkaXRMYXlvdXRCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPjxpIGNsYXNzPVwiZmEgZmEtZWRpdFwiPjwvaT48L2E+JylcclxuXHJcbiAgICB0aGlzLmZsb2F0SW5mb0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1hbWJlclwiIHN0eWxlPVwiaGVpZ2h0OjEwMCU7Zm9udC1zaXplOjgwJVwiIGhyZWY9XCIjXCI+PHNwYW4gY2xhc3M9XCJmYS1zdGFjayBmYS14c1wiPjxpIGNsYXNzPVwiZmFzIGZhLWNpcmNsZSBmYS1zdGFjay0yeCBmYS1pbnZlcnNlXCI+PC9pPjxpIGNsYXNzPVwiZmFzIGZhLWluZm8gZmEtc3RhY2stMXggdzMtdGV4dC1hbWJlclwiPjwvaT48L3NwYW4+PC9hPicpXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIkxheW91dFwiKVxyXG5cclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuZW1wdHkoKVxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5hcHBlbmQodGhpcy5zd2l0Y2hBRFRJbnN0YW5jZUJ0bix0aGlzLm1vZGVsSU9CdG4sdGhpcy5zaG93Rm9yZ2VWaWV3QnRuLHRoaXMuc2hvd0dJU1ZpZXdCdG5cclxuICAgICAgICAsdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5ET00sdGhpcy5lZGl0TGF5b3V0QnRuLHRoaXMuZmxvYXRJbmZvQnRuKVxyXG5cclxuICAgIHRoaXMuc3dpdGNoQURUSW5zdGFuY2VCdG4ub24oXCJjbGlja1wiLCgpPT57IGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnBvcHVwKCkgfSlcclxuICAgIHRoaXMubW9kZWxJT0J0bi5vbihcImNsaWNrXCIsKCk9PnsgbW9kZWxNYW5hZ2VyRGlhbG9nLnBvcHVwKCkgfSlcclxuICAgIHRoaXMuZWRpdExheW91dEJ0bi5vbihcImNsaWNrXCIsKCk9PnsgZWRpdExheW91dERpYWxvZy5wb3B1cCgpIH0pXHJcblxyXG4gICAgdGhpcy5mbG9hdEluZm9CdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsKSBnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWw9ZmFsc2VcclxuICAgICAgICBlbHNlIGdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbD10cnVlXHJcbiAgICAgICAgaWYoIWdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCl7XHJcbiAgICAgICAgICAgIHRoaXMuZmxvYXRJbmZvQnRuLnJlbW92ZUNsYXNzKFwidzMtYW1iZXJcIilcclxuICAgICAgICAgICAgdGhpcy5mbG9hdEluZm9CdG4uaHRtbCgnPHNwYW4gY2xhc3M9XCJmYS1zdGFjayBmYS14c1wiPjxpIGNsYXNzPVwiZmFzIGZhLWJhbiBmYS1zdGFjay0yeCBmYS1pbnZlcnNlXCI+PC9pPjxpIGNsYXNzPVwiZmFzIGZhLWluZm8gZmEtc3RhY2stMXggZmEtaW52ZXJzZVwiPjwvaT48L3NwYW4+JylcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5mbG9hdEluZm9CdG4uYWRkQ2xhc3MoXCJ3My1hbWJlclwiKVxyXG4gICAgICAgICAgICB0aGlzLmZsb2F0SW5mb0J0bi5odG1sKCc8c3BhbiBjbGFzcz1cImZhLXN0YWNrIGZhLXhzXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2lyY2xlIGZhLXN0YWNrLTJ4IGZhLWludmVyc2VcIj48L2k+PGkgY2xhc3M9XCJmYXMgZmEtaW5mbyBmYS1zdGFjay0xeCB3My10ZXh0LWFtYmVyXCI+PC9pPjwvc3Bhbj4nKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG5cclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWU9b3B0aW9uVmFsdWVcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRDaGFuZ2VcIn0pXHJcbiAgICAgICAgaWYob3B0aW9uVmFsdWU9PVwiW05BXVwiKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXRcIixcIlwiKVxyXG4gICAgICAgIGVsc2UgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0OlwiLG9wdGlvblRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS51cGRhdGVMYXlvdXRTZWxlY3RvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBjdXJTZWxlY3Q9dGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWxcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2xlYXJPcHRpb25zKClcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKCdbTm8gTGF5b3V0IFNwZWNpZmllZF0nLCdbTkFdJylcclxuXHJcbiAgICBmb3IgKHZhciBpbmQgaW4gZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikge1xyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKGluZClcclxuICAgIH1cclxuXHJcbiAgICBpZihjdXJTZWxlY3QhPW51bGwgJiYgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5maW5kT3B0aW9uKGN1clNlbGVjdCk9PW51bGwpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dFwiLFwiXCIpXHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwibGF5b3V0c1VwZGF0ZWRcIikge1xyXG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0U2VsZWN0b3IoKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInBvcHVwTGF5b3V0RWRpdGluZ1wiKXtcclxuICAgICAgICBlZGl0TGF5b3V0RGlhbG9nLnBvcHVwKClcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbWFpblRvb2xiYXIoKTsiLCIndXNlIHN0cmljdCc7XHJcbmNvbnN0IHRvcG9sb2d5RE9NPXJlcXVpcmUoXCIuL3RvcG9sb2d5RE9NLmpzXCIpXHJcbmNvbnN0IHR3aW5zVHJlZT1yZXF1aXJlKFwiLi90d2luc1RyZWVcIilcclxuY29uc3QgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cgPSByZXF1aXJlKFwiLi9hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbE1hbmFnZXJEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbE1hbmFnZXJEaWFsb2dcIilcclxuY29uc3QgbW9kZWxFZGl0b3JEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbEVkaXRvckRpYWxvZ1wiKVxyXG5jb25zdCBlZGl0TGF5b3V0RGlhbG9nID0gcmVxdWlyZShcIi4vZWRpdExheW91dERpYWxvZ1wiKVxyXG5jb25zdCBtYWluVG9vbGJhciA9IHJlcXVpcmUoXCIuL21haW5Ub29sYmFyXCIpXHJcbmNvbnN0IGluZm9QYW5lbD0gcmVxdWlyZShcIi4vaW5mb1BhbmVsXCIpXHJcbmNvbnN0IGZsb2F0SW5mb1dpbmRvdz1yZXF1aXJlKFwiLi9mbG9hdEluZm9XaW5kb3dcIilcclxuXHJcbmZ1bmN0aW9uIG1haW5VSSgpIHtcclxuICAgIHRoaXMuaW5pdFVJTGF5b3V0KClcclxuXHJcbiAgICB0aGlzLnR3aW5zVHJlZT0gbmV3IHR3aW5zVHJlZSgkKFwiI3RyZWVIb2xkZXJcIiksJChcIiN0cmVlU2VhcmNoXCIpKVxyXG4gICAgXHJcbiAgICB0aGlzLm1haW5Ub29sYmFyPW1haW5Ub29sYmFyXHJcbiAgICBtYWluVG9vbGJhci5yZW5kZXIoKVxyXG4gICAgdGhpcy50b3BvbG9neUluc3RhbmNlPW5ldyB0b3BvbG9neURPTSgkKCcjY2FudmFzJykpXHJcbiAgICB0aGlzLnRvcG9sb2d5SW5zdGFuY2UuaW5pdCgpXHJcbiAgICB0aGlzLmluZm9QYW5lbD0gaW5mb1BhbmVsXHJcblxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKCkgLy9pbml0aWFsaXplIGFsbCB1aSBjb21wb25lbnRzIHRvIGhhdmUgdGhlIGJyb2FkY2FzdCBjYXBhYmlsaXR5XHJcbiAgICB0aGlzLnByZXBhcmVEYXRhKClcclxufVxyXG5cclxubWFpblVJLnByb3RvdHlwZS5wcmVwYXJlRGF0YT1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIHByb21pc2VBcnI9W1xyXG4gICAgICAgIG1vZGVsTWFuYWdlckRpYWxvZy5wcmVwYXJhdGlvbkZ1bmMoKSxcclxuICAgICAgICBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcmVwYXJhdGlvbkZ1bmMoKVxyXG4gICAgXVxyXG4gICAgYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKHByb21pc2VBcnIpO1xyXG4gICAgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucG9wdXAoKVxyXG59XHJcblxyXG5cclxubWFpblVJLnByb3RvdHlwZS5hc3NpZ25Ccm9hZGNhc3RNZXNzYWdlPWZ1bmN0aW9uKHVpQ29tcG9uZW50KXtcclxuICAgIHVpQ29tcG9uZW50LmJyb2FkY2FzdE1lc3NhZ2U9KG1zZ09iaik9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2UodWlDb21wb25lbnQsbXNnT2JqKX1cclxufVxyXG5cclxubWFpblVJLnByb3RvdHlwZS5icm9hZGNhc3RNZXNzYWdlPWZ1bmN0aW9uKHNvdXJjZSxtc2dQYXlsb2FkKXtcclxuICAgIHZhciBjb21wb25lbnRzQXJyPVt0aGlzLnR3aW5zVHJlZSxhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZyxtb2RlbE1hbmFnZXJEaWFsb2csbW9kZWxFZGl0b3JEaWFsb2csZWRpdExheW91dERpYWxvZyxcclxuICAgICAgICAgdGhpcy5tYWluVG9vbGJhcix0aGlzLnRvcG9sb2d5SW5zdGFuY2UsdGhpcy5pbmZvUGFuZWwsZmxvYXRJbmZvV2luZG93XVxyXG5cclxuICAgIGlmKHNvdXJjZT09bnVsbCl7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxjb21wb25lbnRzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgdGhlQ29tcG9uZW50PWNvbXBvbmVudHNBcnJbaV1cclxuICAgICAgICAgICAgdGhpcy5hc3NpZ25Ccm9hZGNhc3RNZXNzYWdlKHRoZUNvbXBvbmVudClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGNvbXBvbmVudHNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciB0aGVDb21wb25lbnQ9Y29tcG9uZW50c0FycltpXVxyXG4gICAgICAgICAgICBpZih0aGVDb21wb25lbnQucnhNZXNzYWdlICYmIHRoZUNvbXBvbmVudCE9c291cmNlKSB0aGVDb21wb25lbnQucnhNZXNzYWdlKG1zZ1BheWxvYWQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5tYWluVUkucHJvdG90eXBlLmluaXRVSUxheW91dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBteUxheW91dCA9ICQoJ2JvZHknKS5sYXlvdXQoe1xyXG4gICAgICAgIC8vXHRyZWZlcmVuY2Ugb25seSAtIHRoZXNlIG9wdGlvbnMgYXJlIE5PVCByZXF1aXJlZCBiZWNhdXNlICd0cnVlJyBpcyB0aGUgZGVmYXVsdFxyXG4gICAgICAgIGNsb3NhYmxlOiB0cnVlXHQvLyBwYW5lIGNhbiBvcGVuICYgY2xvc2VcclxuICAgICAgICAsIHJlc2l6YWJsZTogdHJ1ZVx0Ly8gd2hlbiBvcGVuLCBwYW5lIGNhbiBiZSByZXNpemVkIFxyXG4gICAgICAgICwgc2xpZGFibGU6IHRydWVcdC8vIHdoZW4gY2xvc2VkLCBwYW5lIGNhbiAnc2xpZGUnIG9wZW4gb3ZlciBvdGhlciBwYW5lcyAtIGNsb3NlcyBvbiBtb3VzZS1vdXRcclxuICAgICAgICAsIGxpdmVQYW5lUmVzaXppbmc6IHRydWVcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcmVzaXppbmcvdG9nZ2xpbmcgc2V0dGluZ3NcclxuICAgICAgICAsIG5vcnRoX19zbGlkYWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3NsaWRhYmxlPXRydWUnXHJcbiAgICAgICAgLy8sIG5vcnRoX190b2dnbGVyTGVuZ3RoX2Nsb3NlZDogJzEwMCUnXHQvLyB0b2dnbGUtYnV0dG9uIGlzIGZ1bGwtd2lkdGggb2YgcmVzaXplci1iYXJcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX2Nsb3NlZDogNlx0XHQvLyBiaWcgcmVzaXplci1iYXIgd2hlbiBvcGVuICh6ZXJvIGhlaWdodClcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX29wZW46MFxyXG4gICAgICAgICwgbm9ydGhfX3Jlc2l6YWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3Jlc2l6YWJsZT10cnVlJ1xyXG4gICAgICAgICwgbm9ydGhfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgd2VzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLCBlYXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcGFuZS1zaXplIHNldHRpbmdzXHJcbiAgICAgICAgLCB3ZXN0X19taW5TaXplOiAxMDBcclxuICAgICAgICAsIGVhc3RfX3NpemU6IDMwMFxyXG4gICAgICAgICwgZWFzdF9fbWluU2l6ZTogMjAwXHJcbiAgICAgICAgLCBlYXN0X19tYXhTaXplOiAwLjUgLy8gNTAlIG9mIGxheW91dCB3aWR0aFxyXG4gICAgICAgICwgY2VudGVyX19taW5XaWR0aDogMTAwXHJcbiAgICAgICAgLGVhc3RfX2luaXRDbG9zZWQ6XHR0cnVlXHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqXHRESVNBQkxFIFRFWFQtU0VMRUNUSU9OIFdIRU4gRFJBR0dJTkcgKG9yIGV2ZW4gX3RyeWluZ18gdG8gZHJhZyEpXHJcbiAgICAgKlx0dGhpcyBmdW5jdGlvbmFsaXR5IHdpbGwgYmUgaW5jbHVkZWQgaW4gUkMzMC44MFxyXG4gICAgICovXHJcbiAgICAkLmxheW91dC5kaXNhYmxlVGV4dFNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJGQgPSAkKGRvY3VtZW50KVxyXG4gICAgICAgICAgICAsIHMgPSAndGV4dFNlbGVjdGlvbkRpc2FibGVkJ1xyXG4gICAgICAgICAgICAsIHggPSAndGV4dFNlbGVjdGlvbkluaXRpYWxpemVkJ1xyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgaWYgKCQuZm4uZGlzYWJsZVNlbGVjdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoISRkLmRhdGEoeCkpIC8vIGRvY3VtZW50IGhhc24ndCBiZWVuIGluaXRpYWxpemVkIHlldFxyXG4gICAgICAgICAgICAgICAgJGQub24oJ21vdXNldXAnLCAkLmxheW91dC5lbmFibGVUZXh0U2VsZWN0aW9uKS5kYXRhKHgsIHRydWUpO1xyXG4gICAgICAgICAgICBpZiAoISRkLmRhdGEocykpXHJcbiAgICAgICAgICAgICAgICAkZC5kaXNhYmxlU2VsZWN0aW9uKCkuZGF0YShzLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnJC5sYXlvdXQuZGlzYWJsZVRleHRTZWxlY3Rpb24nKTtcclxuICAgIH07XHJcbiAgICAkLmxheW91dC5lbmFibGVUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkZCA9ICQoZG9jdW1lbnQpXHJcbiAgICAgICAgICAgICwgcyA9ICd0ZXh0U2VsZWN0aW9uRGlzYWJsZWQnO1xyXG4gICAgICAgIGlmICgkLmZuLmVuYWJsZVNlbGVjdGlvbiAmJiAkZC5kYXRhKHMpKVxyXG4gICAgICAgICAgICAkZC5lbmFibGVTZWxlY3Rpb24oKS5kYXRhKHMsIGZhbHNlKTtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCckLmxheW91dC5lbmFibGVUZXh0U2VsZWN0aW9uJyk7XHJcbiAgICB9O1xyXG4gICAgJChcIi51aS1sYXlvdXQtcmVzaXplci1ub3J0aFwiKS5oaWRlKClcclxuICAgICQoXCIudWktbGF5b3V0LXdlc3RcIikuY3NzKFwiYm9yZGVyLXJpZ2h0XCIsXCJzb2xpZCAxcHggbGlnaHRHcmF5XCIpXHJcbiAgICAkKFwiLnVpLWxheW91dC13ZXN0XCIpLmFkZENsYXNzKFwidzMtY2FyZFwiKVxyXG5cclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1haW5VSSgpOyIsIi8vVGhpcyBpcyBhIHNpbmdsZXRvbiBjbGFzc1xyXG5cclxuZnVuY3Rpb24gbW9kZWxBbmFseXplcigpe1xyXG4gICAgdGhpcy5EVERMTW9kZWxzPXt9XHJcbiAgICB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzPXt9XHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmNsZWFyQWxsTW9kZWxzPWZ1bmN0aW9uKCl7XHJcbiAgICBjb25zb2xlLmxvZyhcImNsZWFyIGFsbCBtb2RlbCBpbmZvXCIpXHJcbiAgICBmb3IodmFyIGlkIGluIHRoaXMuRFRETE1vZGVscykgZGVsZXRlIHRoaXMuRFRETE1vZGVsc1tpZF1cclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUucmVzZXRBbGxNb2RlbHM9ZnVuY3Rpb24oYXJyKXtcclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpe1xyXG4gICAgICAgIHZhciBqc29uU3RyPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdPUpTT04ucGFyc2UoanNvblN0cilcclxuICAgICAgICB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXT1qc29uU3RyXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5hZGRNb2RlbHM9ZnVuY3Rpb24oYXJyKXtcclxuICAgIGFyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9IGVsZVtcIkBpZFwiXVxyXG4gICAgICAgIGVsZVtcIm9yaWdpbmFsXCJdPUpTT04uc3RyaW5naWZ5KGVsZSlcclxuICAgICAgICB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF09ZWxlXHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUucmVjb3JkQWxsQmFzZUNsYXNzZXM9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgcGFyZW50T2JqW2Jhc2VDbGFzc0lEXT0xXHJcblxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5yZWNvcmRBbGxCYXNlQ2xhc3NlcyhwYXJlbnRPYmosIGVhY2hCYXNlKSB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzID0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmIChiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaW5kIGluIGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXMpIHBhcmVudE9ialtpbmRdID0gYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllc1tpbmRdXHJcbiAgICB9XHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MgPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYgKGJhc2VDbGFzcy52YWxpZFJlbGF0aW9uc2hpcHMpIHtcclxuICAgICAgICBmb3IgKHZhciBpbmQgaW4gYmFzZUNsYXNzLnZhbGlkUmVsYXRpb25zaGlwcykge1xyXG4gICAgICAgICAgICBpZihwYXJlbnRPYmpbaW5kXT09bnVsbCkgcGFyZW50T2JqW2luZF0gPSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW2luZF1bYmFzZUNsYXNzSURdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyhwYXJlbnRPYmosIGVhY2hCYXNlKSB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXM9ZnVuY3Rpb24ocGFyZW50T2JqLGRhdGFJbmZvLGVtYmVkZGVkU2NoZW1hKXtcclxuICAgIGRhdGFJbmZvLmZvckVhY2goKG9uZUNvbnRlbnQpPT57XHJcbiAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIlJlbGF0aW9uc2hpcFwiKSByZXR1cm47XHJcbiAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIlByb3BlcnR5XCJcclxuICAgICAgICB8fChBcnJheS5pc0FycmF5KG9uZUNvbnRlbnRbXCJAdHlwZVwiXSkgJiYgb25lQ29udGVudFtcIkB0eXBlXCJdLmluY2x1ZGVzKFwiUHJvcGVydHlcIikpXHJcbiAgICAgICAgfHwgb25lQ29udGVudFtcIkB0eXBlXCJdPT1udWxsKSB7XHJcbiAgICAgICAgICAgIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSAhPSAnb2JqZWN0JyAmJiBlbWJlZGRlZFNjaGVtYVtvbmVDb250ZW50W1wic2NoZW1hXCJdXSE9bnVsbCkgb25lQ29udGVudFtcInNjaGVtYVwiXT1lbWJlZGRlZFNjaGVtYVtvbmVDb250ZW50W1wic2NoZW1hXCJdXVxyXG5cclxuICAgICAgICAgICAgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pID09PSAnb2JqZWN0JyAmJiBvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiQHR5cGVcIl09PVwiT2JqZWN0XCIpe1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld1BhcmVudD17fVxyXG4gICAgICAgICAgICAgICAgcGFyZW50T2JqW29uZUNvbnRlbnRbXCJuYW1lXCJdXT1uZXdQYXJlbnRcclxuICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKG5ld1BhcmVudCxvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLGVtYmVkZGVkU2NoZW1hKVxyXG4gICAgICAgICAgICB9ZWxzZSBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgPT09ICdvYmplY3QnICYmIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJAdHlwZVwiXT09XCJFbnVtXCIpe1xyXG4gICAgICAgICAgICAgICAgcGFyZW50T2JqW29uZUNvbnRlbnRbXCJuYW1lXCJdXT1vbmVDb250ZW50W1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09b25lQ29udGVudFtcInNjaGVtYVwiXVxyXG4gICAgICAgICAgICB9ICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuYW5hbHl6ZT1mdW5jdGlvbigpe1xyXG4gICAgY29uc29sZS5sb2coXCJhbmFseXplIG1vZGVsIGluZm9cIilcclxuICAgIC8vYW5hbHl6ZSBhbGwgcmVsYXRpb25zaGlwIHR5cGVzXHJcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzKSBkZWxldGUgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tpZF1cclxuICAgIGZvciAodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKSB7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBlbWJlZGRlZFNjaGVtYSA9IHt9XHJcbiAgICAgICAgaWYgKGVsZS5zY2hlbWFzKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQXJyO1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShlbGUuc2NoZW1hcykpIHRlbXBBcnIgPSBlbGUuc2NoZW1hc1xyXG4gICAgICAgICAgICBlbHNlIHRlbXBBcnIgPSBbZWxlLnNjaGVtYXNdXHJcbiAgICAgICAgICAgIHRlbXBBcnIuZm9yRWFjaCgoZWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlbWJlZGRlZFNjaGVtYVtlbGVbXCJAaWRcIl1dID0gZWxlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY29udGVudEFyciA9IGVsZS5jb250ZW50c1xyXG4gICAgICAgIGlmICghY29udGVudEFycikgY29udGludWU7XHJcbiAgICAgICAgY29udGVudEFyci5mb3JFYWNoKChvbmVDb250ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChvbmVDb250ZW50W1wiQHR5cGVcIl0gPT0gXCJSZWxhdGlvbnNoaXBcIikge1xyXG4gICAgICAgICAgICAgICAgaWYoIXRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dKSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXT0ge31cclxuICAgICAgICAgICAgICAgIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dW21vZGVsSURdID0gb25lQ29udGVudFxyXG4gICAgICAgICAgICAgICAgb25lQ29udGVudC5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMgPSB7fVxyXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob25lQ29udGVudC5wcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKG9uZUNvbnRlbnQuZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzLCBvbmVDb250ZW50LnByb3BlcnRpZXMsIGVtYmVkZGVkU2NoZW1hKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2FuYWx5emUgZWFjaCBtb2RlbCdzIHByb3BlcnR5IHRoYXQgY2FuIGJlIGVkaXRlZFxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7IC8vZXhwYW5kIHBvc3NpYmxlIGVtYmVkZGVkIHNjaGVtYSB0byBlZGl0YWJsZVByb3BlcnRpZXMsIGFsc28gZXh0cmFjdCBwb3NzaWJsZSByZWxhdGlvbnNoaXAgdHlwZXMgZm9yIHRoaXMgbW9kZWxcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBlbWJlZGRlZFNjaGVtYT17fVxyXG4gICAgICAgIGlmKGVsZS5zY2hlbWFzKXtcclxuICAgICAgICAgICAgdmFyIHRlbXBBcnI7XHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLnNjaGVtYXMpKSB0ZW1wQXJyPWVsZS5zY2hlbWFzXHJcbiAgICAgICAgICAgIGVsc2UgdGVtcEFycj1bZWxlLnNjaGVtYXNdXHJcbiAgICAgICAgICAgIHRlbXBBcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRTY2hlbWFbZWxlW1wiQGlkXCJdXT1lbGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxlLmVkaXRhYmxlUHJvcGVydGllcz17fVxyXG4gICAgICAgIGVsZS52YWxpZFJlbGF0aW9uc2hpcHM9e31cclxuICAgICAgICBlbGUuaW5jbHVkZWRDb21wb25lbnRzPVtdXHJcbiAgICAgICAgZWxlLmFsbEJhc2VDbGFzc2VzPXt9XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuY29udGVudHMpKXtcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMoZWxlLmVkaXRhYmxlUHJvcGVydGllcyxlbGUuY29udGVudHMsZW1iZWRkZWRTY2hlbWEpXHJcblxyXG4gICAgICAgICAgICBlbGUuY29udGVudHMuZm9yRWFjaCgob25lQ29udGVudCk9PntcclxuICAgICAgICAgICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJSZWxhdGlvbnNoaXBcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZS52YWxpZFJlbGF0aW9uc2hpcHNbb25lQ29udGVudFtcIm5hbWVcIl1dPXRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dW21vZGVsSURdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpey8vZXhwYW5kIGNvbXBvbmVudCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5jb250ZW50cykpe1xyXG4gICAgICAgICAgICBlbGUuY29udGVudHMuZm9yRWFjaChvbmVDb250ZW50PT57XHJcbiAgICAgICAgICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiQ29tcG9uZW50XCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnROYW1lPW9uZUNvbnRlbnRbXCJuYW1lXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudENsYXNzPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1cclxuICAgICAgICAgICAgICAgICAgICBlbGUuZWRpdGFibGVQcm9wZXJ0aWVzW2NvbXBvbmVudE5hbWVdPXt9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXNbY29tcG9uZW50TmFtZV0sY29tcG9uZW50Q2xhc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLmluY2x1ZGVkQ29tcG9uZW50cy5wdXNoKGNvbXBvbmVudE5hbWUpXHJcbiAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsvL2V4cGFuZCBiYXNlIGNsYXNzIHByb3BlcnRpZXMgdG8gZWRpdGFibGVQcm9wZXJ0aWVzIGFuZCB2YWxpZCByZWxhdGlvbnNoaXAgdHlwZXMgdG8gdmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgYmFzZUNsYXNzSURzPWVsZS5leHRlbmRzO1xyXG4gICAgICAgIGlmKGJhc2VDbGFzc0lEcz09bnVsbCkgY29udGludWU7XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShiYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWJhc2VDbGFzc0lEc1xyXG4gICAgICAgIGVsc2UgdG1wQXJyPVtiYXNlQ2xhc3NJRHNdXHJcbiAgICAgICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLnJlY29yZEFsbEJhc2VDbGFzc2VzKGVsZS5hbGxCYXNlQ2xhc3NlcyxlYWNoQmFzZSlcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXMsZWFjaEJhc2UpXHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MoZWxlLnZhbGlkUmVsYXRpb25zaGlwcyxlYWNoQmFzZSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vY29uc29sZS5sb2codGhpcy5EVERMTW9kZWxzKVxyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLnJlbGF0aW9uc2hpcFR5cGVzKVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdmFyIGNoaWxkTW9kZWxJRHM9W11cclxuICAgIGZvcih2YXIgYUlEIGluIHRoaXMuRFRETE1vZGVscyl7XHJcbiAgICAgICAgdmFyIGFNb2RlbD10aGlzLkRURExNb2RlbHNbYUlEXVxyXG4gICAgICAgIGlmKGFNb2RlbC5hbGxCYXNlQ2xhc3NlcyAmJiBhTW9kZWwuYWxsQmFzZUNsYXNzZXNbbW9kZWxJRF0pIGNoaWxkTW9kZWxJRHMucHVzaChhTW9kZWxbXCJAaWRcIl0pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2hpbGRNb2RlbElEc1xyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5kZWxldGVNb2RlbF9ub3RCYXNlQ2xhc3NPZkFueT1mdW5jdGlvbihtb2RlbElEKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgJC5wb3N0KFwiZWRpdEFEVC9kZWxldGVNb2RlbFwiLHtcIm1vZGVsXCI6bW9kZWxJRH0sIChkYXRhKT0+IHtcclxuICAgICAgICAgICAgaWYoZGF0YT09XCJcIil7Ly9zdWNjZXNzZnVsXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICAgICAgfWVsc2V7IC8vZXJyb3IgaGFwcGVuc1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGRhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmRlbGV0ZU1vZGVsPWFzeW5jIGZ1bmN0aW9uKG1vZGVsSUQsZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUsZnVuY0FmdGVyRmFpbCxjb21wbGV0ZUZ1bmMpe1xyXG4gICAgdmFyIHJlbGF0ZWRNb2RlbElEcz10aGlzLmxpc3RNb2RlbHNGb3JEZWxldGVNb2RlbChtb2RlbElEKVxyXG4gICAgdmFyIG1vZGVsTGV2ZWw9W11cclxuICAgIHJlbGF0ZWRNb2RlbElEcy5mb3JFYWNoKG9uZUlEPT57XHJcbiAgICAgICAgdmFyIGNoZWNrTW9kZWw9dGhpcy5EVERMTW9kZWxzW29uZUlEXVxyXG4gICAgICAgIG1vZGVsTGV2ZWwucHVzaCh7XCJtb2RlbElEXCI6b25lSUQsXCJsZXZlbFwiOk9iamVjdC5rZXlzKGNoZWNrTW9kZWwuYWxsQmFzZUNsYXNzZXMpLmxlbmd0aH0pXHJcbiAgICB9KVxyXG4gICAgbW9kZWxMZXZlbC5wdXNoKHtcIm1vZGVsSURcIjptb2RlbElELFwibGV2ZWxcIjowfSlcclxuICAgIG1vZGVsTGV2ZWwuc29ydChmdW5jdGlvbiAoYSwgYikge3JldHVybiBiW1wibGV2ZWxcIl0tYVtcImxldmVsXCJdIH0pO1xyXG4gICAgXHJcbiAgICBmb3IodmFyIGk9MDtpPG1vZGVsTGV2ZWwubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFNb2RlbElEPW1vZGVsTGV2ZWxbaV0ubW9kZWxJRFxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5kZWxldGVNb2RlbF9ub3RCYXNlQ2xhc3NPZkFueShhTW9kZWxJRClcclxuICAgICAgICAgICAgdmFyIG1vZGVsTmFtZT10aGlzLkRURExNb2RlbHNbYU1vZGVsSURdLmRpc3BsYXlOYW1lXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLkRURExNb2RlbHNbYU1vZGVsSURdXHJcbiAgICAgICAgICAgIGlmKGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlKSBmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZShhTW9kZWxJRCxtb2RlbE5hbWUpXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICB2YXIgZGVsZXRlZE1vZGVscz1bXVxyXG4gICAgICAgICAgICB2YXIgYWxlcnRTdHI9XCJEZWxldGUgbW9kZWwgaXMgaW5jb21wbGV0ZS4gRGVsZXRlZCBNb2RlbDpcIlxyXG4gICAgICAgICAgICBmb3IodmFyIGo9MDtqPGk7aisrKXtcclxuICAgICAgICAgICAgICAgIGFsZXJ0U3RyKz0gbW9kZWxMZXZlbFtqXS5tb2RlbElEK1wiIFwiXHJcbiAgICAgICAgICAgICAgICBkZWxldGVkTW9kZWxzLnB1c2gobW9kZWxMZXZlbFtqXS5tb2RlbElEKVxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICBhbGVydFN0cis9XCIuIEZhaWwgdG8gZGVsZXRlIFwiK2FNb2RlbElEK1wiLiBFcnJvciBpcyBcIitlXHJcbiAgICAgICAgICAgIGlmKGZ1bmNBZnRlckZhaWwpIGZ1bmNBZnRlckZhaWwoZGVsZXRlZE1vZGVscylcclxuICAgICAgICAgICAgYWxlcnQoZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihjb21wbGV0ZUZ1bmMpIGNvbXBsZXRlRnVuYygpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsQW5hbHl6ZXIoKTsiLCJjb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nPXJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuXHJcbmZ1bmN0aW9uIG1vZGVsRWRpdG9yRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDBcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY2NXB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsIEVkaXRvcjwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgYnV0dG9uUm93PSQoJzxkaXYgIHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKGJ1dHRvblJvdylcclxuICAgIHZhciBpbXBvcnRCdXR0b24gPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlbiB3My1yaWdodFwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5JbXBvcnQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5pbXBvcnRCdXR0b249aW1wb3J0QnV0dG9uXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKGltcG9ydEJ1dHRvbilcclxuXHJcbiAgICBpbXBvcnRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdmFyIGN1cnJlbnRNb2RlbElEPXRoaXMuZHRkbG9ialtcIkBpZFwiXVxyXG4gICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tjdXJyZW50TW9kZWxJRF09PW51bGwpIHRoaXMuaW1wb3J0TW9kZWxBcnIoW3RoaXMuZHRkbG9ial0pXHJcbiAgICAgICAgZWxzZSB0aGlzLnJlcGxhY2VNb2RlbCgpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBsYWJsZT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy1yaWdodDo1cHg7Zm9udC1zaXplOjEuMmVtO1wiPk1vZGVsIFRlbXBsYXRlPC9kaXY+JylcclxuICAgIGJ1dHRvblJvdy5hcHBlbmQobGFibGUpXHJcbiAgICB2YXIgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiLHt3aXRoQm9yZGVyOjEsZm9udFNpemU6XCIxLjJlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5XCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjVweCAxMHB4XCJ9LFwib3B0aW9uTGlzdEhlaWdodFwiOjMwMH0pXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5ET00pXHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB0aGlzLmNob29zZVRlbXBsYXRlKG9wdGlvblZhbHVlKVxyXG4gICAgfVxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmFkZE9wdGlvbihcIk5ldyBNb2RlbC4uLlwiLFwiTmV3XCIpXHJcbiAgICBmb3IodmFyIG1vZGVsTmFtZSBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpe1xyXG4gICAgICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5hZGRPcHRpb24obW9kZWxOYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBwYW5lbEhlaWdodD1cIjQ1MHB4XCJcclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiIHN0eWxlPVwibWFyZ2luOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNhcmRcIiBzdHlsZT1cInBhZGRpbmc6NXB4O3dpZHRoOjMzMHB4O3BhZGRpbmctcmlnaHQ6NXB4O2hlaWdodDonK3BhbmVsSGVpZ2h0Kyc7b3ZlcmZsb3c6YXV0b1wiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIHRoaXMubGVmdFNwYW49bGVmdFNwYW5cclxuXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgdmFyIGR0ZGxTY3JpcHRQYW5lbD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJvdmVyZmxvdzphdXRvO21hcmdpbi10b3A6MnB4O3dpZHRoOjMxMHB4O2hlaWdodDonK3BhbmVsSGVpZ2h0KydcIj48L2Rpdj4nKVxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZChkdGRsU2NyaXB0UGFuZWwpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbD1kdGRsU2NyaXB0UGFuZWxcclxuXHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5yZXBsYWNlTW9kZWw9ZnVuY3Rpb24oKXtcclxuICAgIC8vZGVsZXRlIHRoZSBvbGQgc2FtZSBuYW1lIG1vZGVsLCB0aGVuIGNyZWF0ZSBpdCBhZ2FpblxyXG4gICAgdmFyIGN1cnJlbnRNb2RlbElEPXRoaXMuZHRkbG9ialtcIkBpZFwiXVxyXG5cclxuICAgIHZhciByZWxhdGVkTW9kZWxJRHM9bW9kZWxBbmFseXplci5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWwoY3VycmVudE1vZGVsSUQpXHJcblxyXG4gICAgdmFyIGRpYWxvZ1N0ciA9IChyZWxhdGVkTW9kZWxJRHMubGVuZ3RoID09IDApID8gKFwiVHdpbnMgd2lsbCBiZSBpbXBhY3QgdW5kZXIgbW9kZWwgXFxcIlwiICsgY3VycmVudE1vZGVsSUQgKyBcIlxcXCJcIikgOlxyXG4gICAgICAgIChjdXJyZW50TW9kZWxJRCArIFwiIGlzIGJhc2UgbW9kZWwgb2YgXCIgKyByZWxhdGVkTW9kZWxJRHMuam9pbihcIiwgXCIpICsgXCIuIFR3aW5zIHVuZGVyIHRoZXNlIG1vZGVscyB3aWxsIGJlIGltcGFjdC5cIilcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiV2FybmluZ1wiXHJcbiAgICAgICAgICAgICwgY29udGVudDogZGlhbG9nU3RyXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpcm1SZXBsYWNlTW9kZWwoY3VycmVudE1vZGVsSUQpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApICAgIFxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUuaW1wb3J0TW9kZWxBcnI9ZnVuY3Rpb24obW9kZWxUb0JlSW1wb3J0ZWQsZm9yUmVwbGFjaW5nLGFmdGVyRmFpbHVyZSl7XHJcbiAgICAkLnBvc3QoXCJlZGl0QURUL2ltcG9ydE1vZGVsc1wiLCB7IFwibW9kZWxzXCI6IEpTT04uc3RyaW5naWZ5KG1vZGVsVG9CZUltcG9ydGVkKSB9LCAoZGF0YSkgPT4ge1xyXG4gICAgICAgIGlmIChkYXRhID09IFwiXCIpIHsvL3N1Y2Nlc3NmdWxcclxuICAgICAgICAgICAgaWYoZm9yUmVwbGFjaW5nKSBhbGVydChcIk1vZGVsIFwiICsgdGhpcy5kdGRsb2JqW1wiZGlzcGxheU5hbWVcIl0gKyBcIiBpcyBtb2RpZmllZCBzdWNjZXNzZnVsbHkhXCIpXHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJNb2RlbCBcIiArIHRoaXMuZHRkbG9ialtcImRpc3BsYXlOYW1lXCJdICsgXCIgaXMgY3JlYXRlZCFcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbEVkaXRlZFwiIH0pXHJcbiAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuYWRkTW9kZWxzKG1vZGVsVG9CZUltcG9ydGVkKS8vYWRkIHNvIGltbWVkaWF0bGV5IHRoZSBsaXN0IGNhbiBzaG93IHRoZSBuZXcgbW9kZWxzXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAoKSAvL3JlZnJlc2ggY29udGVudFxyXG4gICAgICAgIH0gZWxzZSB7IC8vZXJyb3IgaGFwcGVuc1xyXG4gICAgICAgICAgICBpZihhZnRlckZhaWx1cmUpIGFmdGVyRmFpbHVyZSgpXHJcbiAgICAgICAgICAgIGFsZXJ0KGRhdGEpXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5jb25maXJtUmVwbGFjZU1vZGVsPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdmFyIHJlbGF0ZWRNb2RlbElEcz1tb2RlbEFuYWx5emVyLmxpc3RNb2RlbHNGb3JEZWxldGVNb2RlbChtb2RlbElEKVxyXG4gICAgdmFyIGJhY2t1cE1vZGVscz1bXVxyXG4gICAgcmVsYXRlZE1vZGVsSURzLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICBiYWNrdXBNb2RlbHMucHVzaChKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tvbmVJRF1bXCJvcmlnaW5hbFwiXSkpXHJcbiAgICB9KVxyXG4gICAgYmFja3VwTW9kZWxzLnB1c2godGhpcy5kdGRsb2JqKVxyXG4gICAgdmFyIGJhY2t1cE1vZGVsc1N0cj1lbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoYmFja3VwTW9kZWxzKSlcclxuXHJcbiAgICB2YXIgZnVuY0FmdGVyRmFpbD0oZGVsZXRlZE1vZGVsSURzKT0+e1xyXG4gICAgICAgIHZhciBwb20gPSAkKFwiPGE+PC9hPlwiKVxyXG4gICAgICAgIHBvbS5hdHRyKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBiYWNrdXBNb2RlbHNTdHIpO1xyXG4gICAgICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0TW9kZWxzQWZ0ZXJGYWlsZWRPcGVyYXRpb24uanNvblwiKTtcclxuICAgICAgICBwb21bMF0uY2xpY2soKVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlID0gKGVhY2hEZWxldGVkTW9kZWxJRCxlYWNoTW9kZWxOYW1lKSA9PiB7fVxyXG4gICAgXHJcbiAgICB2YXIgY29tcGxldGVGdW5jPSgpPT57IFxyXG4gICAgICAgIC8vaW1wb3J0IGFsbCB0aGUgbW9kZWxzIGFnYWluXHJcbiAgICAgICAgdGhpcy5pbXBvcnRNb2RlbEFycihiYWNrdXBNb2RlbHMsXCJmb3JSZXBsYWNpbmdcIixmdW5jQWZ0ZXJGYWlsKVxyXG4gICAgfVxyXG5cclxuICAgIC8vbm90IGNvbXBsZXRlIGRlbGV0ZSB3aWxsIHN0aWxsIGludm9rZSBjb21wbGV0ZUZ1bmNcclxuICAgIG1vZGVsQW5hbHl6ZXIuZGVsZXRlTW9kZWwobW9kZWxJRCxmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZSxmdW5jQWZ0ZXJGYWlsLGNvbXBsZXRlRnVuYylcclxufVxyXG5cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5jaG9vc2VUZW1wbGF0ZT1mdW5jdGlvbih0ZW1wYWx0ZU5hbWUpe1xyXG4gICAgaWYodGVtcGFsdGVOYW1lIT1cIk5ld1wiKXtcclxuICAgICAgICB0aGlzLmR0ZGxvYmo9SlNPTi5wYXJzZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbdGVtcGFsdGVOYW1lXVtcIm9yaWdpbmFsXCJdKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5kdGRsb2JqID0ge1xyXG4gICAgICAgICAgICBcIkBpZFwiOiBcImR0bWk6YU5hbWVTcGFjZTphTW9kZWxJRDsxXCIsXHJcbiAgICAgICAgICAgIFwiQGNvbnRleHRcIjogW1wiZHRtaTpkdGRsOmNvbnRleHQ7MlwiXSxcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkludGVyZmFjZVwiLFxyXG4gICAgICAgICAgICBcImRpc3BsYXlOYW1lXCI6IFwiTmV3IE1vZGVsXCIsXHJcbiAgICAgICAgICAgIFwiY29udGVudHNcIjogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQHR5cGVcIjogXCJQcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcImF0dHJpYnV0ZTFcIixcclxuICAgICAgICAgICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgICAgICAgICB9LHtcclxuICAgICAgICAgICAgICAgICAgICBcIkB0eXBlXCI6IFwiUmVsYXRpb25zaGlwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwibGlua1wiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmxlZnRTcGFuLmVtcHR5KClcclxuXHJcbiAgICB0aGlzLnJlZnJlc2hEVERMKClcclxuICAgIHRoaXMubGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+TW9kZWwgSUQgJiBOYW1lPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7Zm9udC13ZWlnaHQ6bm9ybWFsO3RvcDotMTBweDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPm1vZGVsIElEIGNvbnRhaW5zIG5hbWVzcGFjZSwgYSBtb2RlbCBzdHJpbmcgYW5kIGEgdmVyc2lvbiBudW1iZXI8L3A+PC9kaXY+PC9kaXY+JykpXHJcbiAgICBuZXcgaWRSb3codGhpcy5kdGRsb2JqLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG4gICAgbmV3IGRpc3BsYXlOYW1lUm93KHRoaXMuZHRkbG9iaix0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuXHJcbiAgICBpZighdGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0pdGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl09W11cclxuICAgIG5ldyBwYXJhbWV0ZXJzUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9LHRoaXMuRE9NLm9mZnNldCgpKVxyXG4gICAgbmV3IHJlbGF0aW9uc1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSx0aGlzLkRPTS5vZmZzZXQoKSlcclxuICAgIG5ldyBjb21wb25lbnRzUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG5cclxuICAgIGlmKCF0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdKXRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl09W11cclxuICAgIG5ldyBiYXNlQ2xhc3Nlc1Jvdyh0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucmVmcmVzaERUREw9ZnVuY3Rpb24oKXtcclxuICAgIC8vaXQgd2lsbCByZWZyZXNoIHRoZSBnZW5lcmF0ZWQgRFRETCBzYW1wbGUsIGl0IHdpbGwgYWxzbyBjaGFuZ2UgdGhlIGltcG9ydCBidXR0b24gdG8gc2hvdyBcIkNyZWF0ZVwiIG9yIFwiTW9kaWZ5XCJcclxuICAgIHZhciBjdXJyZW50TW9kZWxJRD10aGlzLmR0ZGxvYmpbXCJAaWRcIl1cclxuICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tjdXJyZW50TW9kZWxJRF09PW51bGwpIHRoaXMuaW1wb3J0QnV0dG9uLnRleHQoXCJDcmVhdGVcIilcclxuICAgIGVsc2UgdGhpcy5pbXBvcnRCdXR0b24udGV4dChcIk1vZGlmeVwiKVxyXG5cclxuXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5lbXB0eSgpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDoyMHB4O3dpZHRoOjEwMHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtZ3JheVwiPkdlbmVyYXRlZCBEVERMPC9kaXY+JykpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPHByZSBzdHlsZT1cImNvbG9yOmdyYXlcIj4nK0pTT04uc3RyaW5naWZ5KHRoaXMuZHRkbG9iaixudWxsLDIpKyc8L3ByZT4nKSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxFZGl0b3JEaWFsb2coKTtcclxuXHJcblxyXG5mdW5jdGlvbiBiYXNlQ2xhc3Nlc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtICB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5CYXNlIENsYXNzZXM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+QmFzZSBjbGFzcyBtb2RlbFxcJ3MgcGFyYW1ldGVycyBhbmQgcmVsYXRpb25zaGlwIHR5cGUgYXJlIGluaGVyaXRlZDwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0gXCJ1bmtub3duXCJcclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVCYXNlY2xhc3NSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgbmV3IHNpbmdsZUJhc2VjbGFzc1JvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQmFzZWNsYXNzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGJhc2VDbGFzc05hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoyMjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImJhc2UgbW9kZWwgaWRcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgRE9NLmFwcGVuZChiYXNlQ2xhc3NOYW1lSW5wdXQscmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICBiYXNlQ2xhc3NOYW1lSW5wdXQudmFsKGR0ZGxPYmopXHJcbiAgICBiYXNlQ2xhc3NOYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqW2ldPWJhc2VDbGFzc05hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbXBvbmVudHNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSAgdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+Q29tcG9uZW50czxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5Db21wb25lbnQgbW9kZWxcXCdzIHBhcmFtZXRlcnMgYXJlIGVtYmVkZGVkIHVuZGVyIGEgbmFtZTwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkNvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJTb21lQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6XCJkdG1pOnNvbWVDb21wb25lbnRNb2RlbDsxXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQ29tcG9uZW50Um93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJDb21wb25lbnRcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZUNvbXBvbmVudFJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQ29tcG9uZW50Um93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGNvbXBvbmVudE5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImNvbXBvbmVudCBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHNjaGVtYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiY29tcG9uZW50IG1vZGVsIGlkLi4uXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoY29tcG9uZW50TmFtZUlucHV0LHNjaGVtYUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICBzY2hlbWFJbnB1dC52YWwoZHRkbE9ialtcInNjaGVtYVwiXXx8XCJcIilcclxuXHJcbiAgICBjb21wb25lbnROYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPWNvbXBvbmVudE5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgc2NoZW1hSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl09c2NoZW1hSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsYXRpb25zUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlJlbGF0aW9uc2hpcCBUeXBlczxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5SZWxhdGlvbnNoaXAgY2FuIGhhdmUgaXRzIG93biBwYXJhbWV0ZXJzPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlJlbGF0aW9uc2hpcFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJyZWxhdGlvbjFcIixcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIlJlbGF0aW9uc2hpcFwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixkaWFsb2dPZmZzZXQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlUmVsYXRpb25UeXBlUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciByZWxhdGlvbk5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo5MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwicmVsYXRpb24gbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB0YXJnZXRNb2RlbElEPSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE0MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiKG9wdGlvbmFsKXRhcmdldCBtb2RlbFwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLWNvZyBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQocmVsYXRpb25OYW1lSW5wdXQsdGFyZ2V0TW9kZWxJRCxhZGRCdXR0b24scmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIERPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHRhcmdldE1vZGVsSUQudmFsKGR0ZGxPYmpbXCJ0YXJnZXRcIl18fFwiXCIpXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInByb3BlcnRpZXNcIl0pIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdPVtdXHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1yZWxhdGlvbk5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgdGFyZ2V0TW9kZWxJRC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgaWYodGFyZ2V0TW9kZWxJRC52YWwoKT09XCJcIikgZGVsZXRlIGR0ZGxPYmpbXCJ0YXJnZXRcIl1cclxuICAgICAgICBlbHNlIGR0ZGxPYmpbXCJ0YXJnZXRcIl09dGFyZ2V0TW9kZWxJRC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgaWYoZHRkbE9ialtcInByb3BlcnRpZXNcIl0gJiYgZHRkbE9ialtcInByb3BlcnRpZXNcIl0ubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzPWR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdXHJcbiAgICAgICAgcHJvcGVydGllcy5mb3JFYWNoKG9uZVByb3BlcnR5PT57XHJcbiAgICAgICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cob25lUHJvcGVydHksY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInByb3BlcnRpZXNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyYW1ldGVyc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+UGFyYW1ldGVyczwvZGl2PjwvZGl2PicpXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlByb3BlcnR5XCIsXHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosXCJ0b3BMZXZlbFwiLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIlByb3BlcnR5XCIpIHJldHVyblxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLFwidG9wTGV2ZWxcIixkaWFsb2dPZmZzZXQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlUGFyYW1ldGVyUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqLHRvcExldmVsLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBwYXJhbWV0ZXJOYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTAwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJwYXJhbWV0ZXIgbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBlbnVtVmFsdWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInN0cjEsc3RyMiwuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS1wbHVzIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHB0eXBlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxmb250U2l6ZTpcIjFlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5IHczLWJhci1pdGVtXCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjRweCA1cHhcIn0sXCJvcHRpb25MaXN0SGVpZ2h0XCI6MzAwLFwiaXNDbGlja2FibGVcIjoxXHJcbiAgICAsXCJvcHRpb25MaXN0TWFyZ2luVG9wXCI6LTE1MCxcIm9wdGlvbkxpc3RNYXJnaW5MZWZ0XCI6NjAsXCJhZGp1c3RQb3NpdGlvbkFuY2hvclwiOmRpYWxvZ09mZnNldH0pXHJcbiAgICBcclxuXHJcbiAgICBwdHlwZVNlbGVjdG9yLmFkZE9wdGlvbkFycihbXCJzdHJpbmdcIixcImZsb2F0XCIsXCJpbnRlZ2VyXCIsXCJFbnVtXCIsXCJPYmplY3RcIixcImRvdWJsZVwiLFwiYm9vbGVhblwiLFwiZGF0ZVwiLFwiZGF0ZVRpbWVcIixcImR1cmF0aW9uXCIsXCJsb25nXCIsXCJ0aW1lXCJdKVxyXG4gICAgRE9NLmFwcGVuZChwYXJhbWV0ZXJOYW1lSW5wdXQscHR5cGVTZWxlY3Rvci5ET00sZW51bVZhbHVlSW5wdXQsYWRkQnV0dG9uLHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgRE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHB0eXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spPT57XHJcbiAgICAgICAgcHR5cGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgY29udGVudERPTS5lbXB0eSgpLy9jbGVhciBhbGwgY29udGVudCBkb20gY29udGVudFxyXG4gICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKXtcclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gZHRkbE9iaikgZGVsZXRlIGR0ZGxPYmpbaW5kXSAgICAvL2NsZWFyIGFsbCBvYmplY3QgY29udGVudFxyXG4gICAgICAgICAgICBpZih0b3BMZXZlbCkgZHRkbE9ialtcIkB0eXBlXCJdPVwiUHJvcGVydHlcIlxyXG4gICAgICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICB9IFxyXG4gICAgICAgIGlmKG9wdGlvblRleHQ9PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQudmFsKFwiXCIpXHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnNob3coKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIkVudW1cIixcInZhbHVlU2NoZW1hXCI6IFwic3RyaW5nXCJ9XHJcbiAgICAgICAgfWVsc2UgaWYob3B0aW9uVGV4dD09XCJPYmplY3RcIil7XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLnNob3coKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIk9iamVjdFwifVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT1vcHRpb25UZXh0XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSkgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXT1bXVxyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGVudW1WYWx1ZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICB2YXIgdmFsdWVBcnI9ZW51bVZhbHVlSW5wdXQudmFsKCkuc3BsaXQoXCIsXCIpXHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl09W11cclxuICAgICAgICB2YWx1ZUFyci5mb3JFYWNoKGFWYWw9PntcclxuICAgICAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl0ucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogYVZhbC5yZXBsYWNlKFwiIFwiLFwiXCIpLCAvL3JlbW92ZSBhbGwgdGhlIHNwYWNlIGluIG5hbWVcclxuICAgICAgICAgICAgICAgIFwiZW51bVZhbHVlXCI6IGFWYWxcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBpZih0eXBlb2YoZHRkbE9ialtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcpIHZhciBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVxyXG4gICAgZWxzZSBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVtcIkB0eXBlXCJdXHJcbiAgICBwdHlwZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShzY2hlbWEpXHJcbiAgICBpZihzY2hlbWE9PVwiRW51bVwiKXtcclxuICAgICAgICB2YXIgZW51bUFycj1kdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXVxyXG4gICAgICAgIGlmKGVudW1BcnIhPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgaW5wdXRTdHI9XCJcIlxyXG4gICAgICAgICAgICBlbnVtQXJyLmZvckVhY2gob25lRW51bVZhbHVlPT57aW5wdXRTdHIrPW9uZUVudW1WYWx1ZS5lbnVtVmFsdWUrXCIsXCJ9KVxyXG4gICAgICAgICAgICBpbnB1dFN0cj1pbnB1dFN0ci5zbGljZSgwLCAtMSkvL3JlbW92ZSB0aGUgbGFzdCBcIixcIlxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC52YWwoaW5wdXRTdHIpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYoc2NoZW1hPT1cIk9iamVjdFwiKXtcclxuICAgICAgICB2YXIgZmllbGRzPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl1cclxuICAgICAgICBmaWVsZHMuZm9yRWFjaChvbmVGaWVsZD0+e1xyXG4gICAgICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG9uZUZpZWxkLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGlkUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBsYWJlbDE9JCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+ZHRtaTo8L2Rpdj4nKVxyXG4gICAgdmFyIGRvbWFpbklucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjg4cHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJOYW1lc3BhY2VcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgbW9kZWxJRElucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEzMnB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTW9kZWxJRFwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB2ZXJzaW9uSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6NjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInZlcnNpb25cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICBET00uYXBwZW5kKGxhYmVsMSxkb21haW5JbnB1dCwkKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj46PC9kaXY+JyksbW9kZWxJRElucHV0LCQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPjs8L2Rpdj4nKSx2ZXJzaW9uSW5wdXQpXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICB2YXIgc3RyPWBkdG1pOiR7ZG9tYWluSW5wdXQudmFsKCl9OiR7bW9kZWxJRElucHV0LnZhbCgpfTske3ZlcnNpb25JbnB1dC52YWwoKX1gXHJcbiAgICAgICAgZHRkbE9ialtcIkBpZFwiXT1zdHJcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgZG9tYWluSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIG1vZGVsSURJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmVyc2lvbklucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcblxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiQGlkXCJdXHJcbiAgICBpZihzdHIhPVwiXCIgJiYgc3RyIT1udWxsKXtcclxuICAgICAgICB2YXIgYXJyMT1zdHIuc3BsaXQoXCI7XCIpXHJcbiAgICAgICAgaWYoYXJyMS5sZW5ndGghPTIpIHJldHVybjtcclxuICAgICAgICB2ZXJzaW9uSW5wdXQudmFsKGFycjFbMV0pXHJcbiAgICAgICAgdmFyIGFycjI9YXJyMVswXS5zcGxpdChcIjpcIilcclxuICAgICAgICBkb21haW5JbnB1dC52YWwoYXJyMlsxXSlcclxuICAgICAgICBhcnIyLnNoaWZ0KCk7IGFycjIuc2hpZnQoKVxyXG4gICAgICAgIG1vZGVsSURJbnB1dC52YWwoYXJyMi5qb2luKFwiOlwiKSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGlzcGxheU5hbWVSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGxhYmVsMT0kKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj5EaXNwbGF5IE5hbWU6PC9kaXY+JylcclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTUwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJNb2RlbElEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgRE9NLmFwcGVuZChsYWJlbDEsbmFtZUlucHV0KVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICBkdGRsT2JqW1wiZGlzcGxheU5hbWVcIl09bmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIG5hbWVJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiZGlzcGxheU5hbWVcIl1cclxuICAgIGlmKHN0ciE9XCJcIiAmJiBzdHIhPW51bGwpIG5hbWVJbnB1dC52YWwoc3RyKVxyXG59IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IHNpbXBsZVRyZWU9IHJlcXVpcmUoXCIuL3NpbXBsZVRyZWVcIilcclxuY29uc3QgbW9kZWxFZGl0b3JEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbEVkaXRvckRpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBtb2RlbE1hbmFnZXJEaWFsb2coKSB7XHJcbiAgICB0aGlzLm1vZGVscz17fVxyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnByZXBhcmF0aW9uRnVuYyA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLmdldChcInZpc3VhbERlZmluaXRpb24vcmVhZFZpc3VhbERlZmluaXRpb25cIiwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YSE9XCJcIiAmJiB0eXBlb2YoZGF0YSk9PT1cIm9iamVjdFwiKSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uPWRhdGE7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY1MHB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgaW1wb3J0TW9kZWxzQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkltcG9ydDwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0TW9kZWxzQnRuID0kKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwibW9kZWxGaWxlc1wiIG11bHRpcGxlPVwibXVsdGlwbGVcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHZhciBtb2RlbEVkaXRvckJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5DcmVhdGUvTW9kaWZ5IE1vZGVsPC9idXR0b24+JylcclxuICAgIHZhciBleHBvcnRNb2RlbEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5FeHBvcnQgQWxsIE1vZGVsczwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChpbXBvcnRNb2RlbHNCdG4sYWN0dWFsSW1wb3J0TW9kZWxzQnRuLCBtb2RlbEVkaXRvckJ0bixleHBvcnRNb2RlbEJ0bilcclxuICAgIGltcG9ydE1vZGVsc0J0bi5vbihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICB9KTtcclxuICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCk9PntcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICBhd2FpdCB0aGlzLnJlYWRNb2RlbEZpbGVzQ29udGVudEFuZEltcG9ydChmaWxlcylcclxuICAgICAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4udmFsKFwiXCIpXHJcbiAgICB9KVxyXG4gICAgbW9kZWxFZGl0b3JCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgbW9kZWxFZGl0b3JEaWFsb2cucG9wdXAoKVxyXG4gICAgfSlcclxuXHJcbiAgICBleHBvcnRNb2RlbEJ0bi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB2YXIgbW9kZWxBcnI9W11cclxuICAgICAgICBmb3IodmFyIG1vZGVsSUQgaW4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzKSBtb2RlbEFyci5wdXNoKEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl0pKVxyXG4gICAgICAgIHZhciBwb20gPSAkKFwiPGE+PC9hPlwiKVxyXG4gICAgICAgIHBvbS5hdHRyKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkobW9kZWxBcnIpKSk7XHJcbiAgICAgICAgcG9tLmF0dHIoJ2Rvd25sb2FkJywgXCJleHBvcnRNb2RlbHMuanNvblwiKTtcclxuICAgICAgICBwb21bMF0uY2xpY2soKVxyXG4gICAgfSlcclxuXHJcblxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNlbGxcIiBzdHlsZT1cIndpZHRoOjI0MHB4O3BhZGRpbmctcmlnaHQ6NXB4XCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MzBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiXCI+TW9kZWxzPC9kaXY+PC9kaXY+JykpXHJcbiAgICBcclxuICAgIHZhciBtb2RlbExpc3QgPSAkKCc8dWwgY2xhc3M9XCJ3My11bCB3My1ob3ZlcmFibGVcIj4nKVxyXG4gICAgbW9kZWxMaXN0LmNzcyh7XCJvdmVyZmxvdy14XCI6XCJoaWRkZW5cIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcImhlaWdodFwiOlwiNDIwcHhcIiwgXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodGdyYXlcIn0pXHJcbiAgICBsZWZ0U3Bhbi5hcHBlbmQobW9kZWxMaXN0KVxyXG4gICAgdGhpcy5tb2RlbExpc3QgPSBtb2RlbExpc3Q7XHJcbiAgICBcclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKHJpZ2h0U3BhbikgXHJcbiAgICB2YXIgcGFuZWxDYXJkT3V0PSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkLTIgdzMtd2hpdGVcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4XCI+PC9kaXY+JylcclxuXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cImhlaWdodDozNXB4XCI+PC9kaXY+JylcclxuICAgIHBhbmVsQ2FyZE91dC5hcHBlbmQodGhpcy5tb2RlbEJ1dHRvbkJhcilcclxuXHJcbiAgICByaWdodFNwYW4uYXBwZW5kKHBhbmVsQ2FyZE91dClcclxuICAgIHZhciBwYW5lbENhcmQ9JCgnPGRpdiBzdHlsZT1cIndpZHRoOjQwMHB4O2hlaWdodDo0MDVweDtvdmVyZmxvdzphdXRvO21hcmdpbi10b3A6MnB4XCI+PC9kaXY+JylcclxuICAgIHBhbmVsQ2FyZE91dC5hcHBlbmQocGFuZWxDYXJkKVxyXG4gICAgdGhpcy5wYW5lbENhcmQ9cGFuZWxDYXJkO1xyXG5cclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuZW1wdHkoKVxyXG4gICAgcGFuZWxDYXJkLmh0bWwoXCI8YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctbGVmdDo1cHgnPkNob29zZSBhIG1vZGVsIHRvIHZpZXcgaW5mb21yYXRpb248L2E+XCIpXHJcblxyXG4gICAgdGhpcy5saXN0TW9kZWxzKClcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZXNpemVJbWdGaWxlID0gYXN5bmMgZnVuY3Rpb24odGhlRmlsZSxtYXhfc2l6ZSkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgdmFyIHRtcEltZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG1wSW1nLm9ubG9hZCA9ICAoKT0+IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgICAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSB0bXBJbWcud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gdG1wSW1nLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPiBoZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoID4gbWF4X3NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCAqPSBtYXhfc2l6ZSAvIHdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBtYXhfc2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPiBtYXhfc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggKj0gbWF4X3NpemUgLyBoZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBtYXhfc2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLmRyYXdJbWFnZSh0bXBJbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhVXJsID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhVXJsKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdG1wSW1nLnNyYyA9IHJlYWRlci5yZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwodGhlRmlsZSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxSaWdodFNwYW49YXN5bmMgZnVuY3Rpb24obW9kZWxOYW1lKXtcclxuICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuZW1wdHkoKVxyXG4gICAgdmFyIG1vZGVsSUQ9dGhpcy5tb2RlbHNbbW9kZWxOYW1lXVsnQGlkJ11cclxuXHJcbiAgICB2YXIgZGVsQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIm1hcmdpbi1ib3R0b206MnB4XCIgY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1waW5rIHczLWJvcmRlci1yaWdodFwiPkRlbGV0ZSBNb2RlbDwvYnV0dG9uPicpXHJcbiAgICB2YXIgaW1wb3J0UGljQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLWFtYmVyIHczLWJvcmRlci1yaWdodFwiPlVwbG9hZCBBdmFydGE8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFjdHVhbEltcG9ydFBpY0J0biA9JCgnPGlucHV0IHR5cGU9XCJmaWxlXCIgbmFtZT1cImltZ1wiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgdmFyIGNsZWFyQXZhcnRhQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+Q2xlYXIgQXZhcnRhPC9idXR0b24+JylcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuYXBwZW5kKGRlbEJ0bixpbXBvcnRQaWNCdG4sYWN0dWFsSW1wb3J0UGljQnRuLGNsZWFyQXZhcnRhQnRuKVxyXG5cclxuICAgIGltcG9ydFBpY0J0bi5vbihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBhY3R1YWxJbXBvcnRQaWNCdG4uY2hhbmdlKGFzeW5jIChldnQpPT57XHJcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XHJcbiAgICAgICAgdmFyIHRoZUZpbGU9ZmlsZXNbMF1cclxuICAgICAgICBcclxuICAgICAgICBpZih0aGVGaWxlLnR5cGU9PVwiaW1hZ2Uvc3ZnK3htbFwiKXtcclxuICAgICAgICAgICAgdmFyIHN0cj0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZSh0aGVGaWxlKVxyXG4gICAgICAgICAgICB2YXIgZGF0YVVybD0nZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsJyArIGVuY29kZVVSSUNvbXBvbmVudChzdHIpO1xyXG4gICAgICAgIH1lbHNlIGlmKHRoZUZpbGUudHlwZS5tYXRjaCgnaW1hZ2UuKicpKXtcclxuICAgICAgICAgICAgdmFyIGRhdGFVcmw9IGF3YWl0IHRoaXMucmVzaXplSW1nRmlsZSh0aGVGaWxlLDcwKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KHsgd2lkdGg6IFwiMjAwcHhcIiB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIk5vdGVcIlxyXG4gICAgICAgICAgICAgICAgICAgICwgY29udGVudDogXCJQbGVhc2UgaW1wb3J0IGltYWdlIGZpbGUgKHBuZyxqcGcsc3ZnIGFuZCBzbyBvbilcIlxyXG4gICAgICAgICAgICAgICAgICAgICwgYnV0dG9uczogW3tjb2xvckNsYXNzOlwidzMtZ3JheVwiLHRleHQ6XCJPa1wiLFwiY2xpY2tGdW5jXCI6KCk9Pntjb25maXJtRGlhbG9nRGl2LmNsb3NlKCl9fV1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGlzLmF2YXJ0YUltZykgdGhpcy5hdmFydGFJbWcuYXR0cihcInNyY1wiLGRhdGFVcmwpXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1cclxuICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhPWRhdGFVcmxcclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJhdmFydGFcIjpkYXRhVXJsIH0pXHJcbiAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgICAgIGFjdHVhbEltcG9ydFBpY0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcblxyXG4gICAgY2xlYXJBdmFydGFCdG4ub24oXCJjbGlja1wiLCAoKT0+e1xyXG4gICAgICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXSkgZGVsZXRlIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhIFxyXG4gICAgICAgIGlmKHRoaXMuYXZhcnRhSW1nKSB0aGlzLmF2YXJ0YUltZy5yZW1vdmVBdHRyKCdzcmMnKTtcclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJub0F2YXJ0YVwiOnRydWUgfSlcclxuICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciByZWxhdGVkTW9kZWxJRHMgPW1vZGVsQW5hbHl6ZXIubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsKG1vZGVsSUQpXHJcbiAgICAgICAgdmFyIGRpYWxvZ1N0cj0ocmVsYXRlZE1vZGVsSURzLmxlbmd0aD09MCk/IChcIlRoaXMgd2lsbCBERUxFVEUgbW9kZWwgXFxcIlwiICsgbW9kZWxJRCArIFwiXFxcIlwiKTogXHJcbiAgICAgICAgICAgIChtb2RlbElEICsgXCIgaXMgYmFzZSBtb2RlbCBvZiBcIityZWxhdGVkTW9kZWxJRHMuam9pbihcIiwgXCIpK1wiLiBEZWxldGUgYWxsIG9mIHRoZW0/XCIpXHJcbiAgICAgICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgICAgICB7IHdpZHRoOiBcIjM1MHB4XCIgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiV2FybmluZ1wiXHJcbiAgICAgICAgICAgICAgICAsIGNvbnRlbnQ6IGRpYWxvZ1N0clxyXG4gICAgICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpcm1EZWxldGVNb2RlbChtb2RlbElEKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgICAgICBcclxuICAgIH0pXHJcbiAgICBcclxuICAgIHZhciBWaXN1YWxpemF0aW9uRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIlZpc3VhbGl6YXRpb25cIilcclxuICAgIHZhciBlZGl0YWJsZVByb3BlcnRpZXNET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiRWRpdGFibGUgUHJvcGVydGllcyBBbmQgUmVsYXRpb25zaGlwc1wiKVxyXG4gICAgdmFyIGJhc2VDbGFzc2VzRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIkJhc2UgQ2xhc3Nlc1wiKVxyXG4gICAgdmFyIG9yaWdpbmFsRGVmaW5pdGlvbkRPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJPcmlnaW5hbCBEZWZpbml0aW9uXCIpXHJcblxyXG4gICAgdmFyIHN0cj1KU09OLnN0cmluZ2lmeSh0aGlzLm1vZGVsc1ttb2RlbE5hbWVdLG51bGwsMilcclxuICAgIG9yaWdpbmFsRGVmaW5pdGlvbkRPTS5hcHBlbmQoJCgnPHByZSBpZD1cImpzb25cIj4nK3N0cisnPC9wcmU+JykpXHJcblxyXG4gICAgdmFyIGVkaXR0YWJsZVByb3BlcnRpZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmVkaXRhYmxlUHJvcGVydGllc1xyXG4gICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGVkaXR0YWJsZVByb3BlcnRpZXMsZWRpdGFibGVQcm9wZXJ0aWVzRE9NKVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB0aGlzLmZpbGxSZWxhdGlvbnNoaXBJbmZvKHZhbGlkUmVsYXRpb25zaGlwcyxlZGl0YWJsZVByb3BlcnRpZXNET00pXHJcblxyXG4gICAgdGhpcy5maWxsVmlzdWFsaXphdGlvbihtb2RlbElELFZpc3VhbGl6YXRpb25ET00pXHJcblxyXG4gICAgdGhpcy5maWxsQmFzZUNsYXNzZXMobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmFsbEJhc2VDbGFzc2VzLGJhc2VDbGFzc2VzRE9NKSBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5jb25maXJtRGVsZXRlTW9kZWw9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB2YXIgZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUgPSAoZWFjaERlbGV0ZWRNb2RlbElELGVhY2hNb2RlbE5hbWUpID0+IHtcclxuICAgICAgICBkZWxldGUgdGhpcy5tb2RlbHNbZWFjaE1vZGVsTmFtZV1cclxuICAgICAgICB0aGlzLnRyZWUuZGVsZXRlTGVhZk5vZGUoZWFjaE1vZGVsTmFtZSlcclxuICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0gJiYgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bZWFjaERlbGV0ZWRNb2RlbElEXSkge1xyXG4gICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bZWFjaERlbGV0ZWRNb2RlbElEXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBjb21wbGV0ZUZ1bmM9KCk9PnsgXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURUTW9kZWxzQ2hhbmdlXCIsIFwibW9kZWxzXCI6dGhpcy5tb2RlbHN9KVxyXG4gICAgICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH1cclxuXHJcbiAgICAvL2V2ZW4gbm90IGNvbXBsZXRlbHkgc3VjY2Vzc2Z1bCBkZWxldGluZywgaXQgd2lsbCBzdGlsbCBpbnZva2UgY29tcGxldGVGdW5jXHJcbiAgICBtb2RlbEFuYWx5emVyLmRlbGV0ZU1vZGVsKG1vZGVsSUQsZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUsY29tcGxldGVGdW5jLGNvbXBsZXRlRnVuYylcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoTW9kZWxUcmVlTGFiZWw9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMudHJlZS5zZWxlY3RlZE5vZGVzLmxlbmd0aD4wKSB0aGlzLnRyZWUuc2VsZWN0ZWROb2Rlc1swXS5yZWRyYXdMYWJlbCgpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEJhc2VDbGFzc2VzPWZ1bmN0aW9uKGJhc2VDbGFzc2VzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBiYXNlQ2xhc3Nlcyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jaztwYWRkaW5nOi4xZW0nPlwiK2luZCtcIjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFZpc3VhbGl6YXRpb249ZnVuY3Rpb24obW9kZWxJRCxwYXJlbnREb20pe1xyXG4gICAgdmFyIG1vZGVsSnNvbj1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF07XHJcbiAgICB2YXIgYVRhYmxlPSQoXCI8dGFibGUgc3R5bGU9J3dpZHRoOjEwMCUnPjwvdGFibGU+XCIpXHJcbiAgICBhVGFibGUuaHRtbCgnPHRyPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+JylcclxuICAgIHBhcmVudERvbS5hcHBlbmQoYVRhYmxlKSBcclxuXHJcbiAgICB2YXIgbGVmdFBhcnQ9YVRhYmxlLmZpbmQoXCJ0ZDpmaXJzdFwiKVxyXG4gICAgdmFyIHJpZ2h0UGFydD1hVGFibGUuZmluZChcInRkOm50aC1jaGlsZCgyKVwiKVxyXG4gICAgcmlnaHRQYXJ0LmNzcyh7XCJ3aWR0aFwiOlwiNTBweFwiLFwiaGVpZ2h0XCI6XCI1MHB4XCIsXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodEdyYXlcIn0pXHJcbiAgICBcclxuICAgIHZhciBhdmFydGFJbWc9JChcIjxpbWcgc3R5bGU9J2hlaWdodDo0NXB4Jz48L2ltZz5cIilcclxuICAgIHJpZ2h0UGFydC5hcHBlbmQoYXZhcnRhSW1nKVxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1cclxuICAgIGlmKHZpc3VhbEpzb24gJiYgdmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSkgYXZhcnRhSW1nLmF0dHIoJ3NyYycsdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpXHJcbiAgICB0aGlzLmF2YXJ0YUltZz1hdmFydGFJbWc7XHJcblxyXG4gICAgXHJcbiAgICB0aGlzLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3cobW9kZWxJRCxsZWZ0UGFydClcclxuICAgIGZvcih2YXIgaW5kIGluIG1vZGVsSnNvbi52YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHRoaXMuYWRkT25lVmlzdWFsaXphdGlvblJvdyhtb2RlbElELGxlZnRQYXJ0LGluZClcclxuICAgIH1cclxufVxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3c9ZnVuY3Rpb24obW9kZWxJRCxwYXJlbnREb20scmVsYXRpbnNoaXBOYW1lKXtcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCkgdmFyIG5hbWVTdHI9XCLil69cIiAvL3Zpc3VhbCBmb3Igbm9kZVxyXG4gICAgZWxzZSBuYW1lU3RyPVwi4p+cIFwiK3JlbGF0aW5zaGlwTmFtZVxyXG4gICAgdmFyIGNvbnRhaW5lckRpdj0kKFwiPGRpdiBzdHlsZT0ncGFkZGluZy1ib3R0b206OHB4Jz48L2Rpdj5cIilcclxuICAgIHBhcmVudERvbS5hcHBlbmQoY29udGFpbmVyRGl2KVxyXG4gICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBzdHlsZT0nbWFyZ2luLXJpZ2h0OjEwcHgnPlwiK25hbWVTdHIrXCI8L2xhYmVsPlwiKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgIHZhciBkZWZpbmVkQ29sb3I9bnVsbFxyXG4gICAgdmFyIGRlZmluZWRTaGFwZT1udWxsXHJcbiAgICB2YXIgZGVmaW5lZERpbWVuc2lvblJhdGlvPW51bGxcclxuICAgIHZhciBkZWZpbmVkRWRnZVdpZHRoPW51bGxcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb24gJiYgdmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yKSBkZWZpbmVkQ29sb3I9dmlzdWFsSnNvblttb2RlbElEXS5jb2xvclxyXG4gICAgICAgIGlmKHZpc3VhbEpzb24gJiYgdmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlKSBkZWZpbmVkU2hhcGU9dmlzdWFsSnNvblttb2RlbElEXS5zaGFwZVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb24gJiYgdmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKSBkZWZpbmVkRGltZW5zaW9uUmF0aW89dmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpb1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgaWYodmlzdWFsSnNvbiAmJiB2aXN1YWxKc29uW21vZGVsSURdXHJcbiAgICAgICAgICAgICAmJiB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVxyXG4gICAgICAgICAgICAgICYmIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pe1xyXG4gICAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yKSBkZWZpbmVkQ29sb3I9dmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvclxyXG4gICAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlKSBkZWZpbmVkU2hhcGU9dmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZVxyXG4gICAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aCkgZGVmaW5lZEVkZ2VXaWR0aD12aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aFxyXG4gICAgICAgICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29sb3JTZWxlY3Rvcj0kKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7d2lkdGg6ODVweFwiPjwvc2VsZWN0PicpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbG9yU2VsZWN0b3IpXHJcbiAgICB2YXIgY29sb3JBcnI9W1wiZGFya0dyYXlcIixcIkJsYWNrXCIsXCJMaWdodEdyYXlcIixcIlJlZFwiLFwiR3JlZW5cIixcIkJsdWVcIixcIkJpc3F1ZVwiLFwiQnJvd25cIixcIkNvcmFsXCIsXCJDcmltc29uXCIsXCJEb2RnZXJCbHVlXCIsXCJHb2xkXCJdXHJcbiAgICBjb2xvckFyci5mb3JFYWNoKChvbmVDb2xvckNvZGUpPT57XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQoXCI8b3B0aW9uIHZhbHVlPSdcIitvbmVDb2xvckNvZGUrXCInPlwiK29uZUNvbG9yQ29kZStcIuKWpzwvb3B0aW9uPlwiKVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuYXBwZW5kKGFuT3B0aW9uKVxyXG4gICAgICAgIGFuT3B0aW9uLmNzcyhcImNvbG9yXCIsb25lQ29sb3JDb2RlKVxyXG4gICAgfSlcclxuICAgIGlmKGRlZmluZWRDb2xvciE9bnVsbCkge1xyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IudmFsKGRlZmluZWRDb2xvcilcclxuICAgICAgICBjb2xvclNlbGVjdG9yLmNzcyhcImNvbG9yXCIsZGVmaW5lZENvbG9yKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLFwiZGFya0dyYXlcIilcclxuICAgIH1cclxuICAgIGNvbG9yU2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIHNlbGVjdENvbG9yQ29kZT1ldmUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLCBzZWxlY3RDb2xvckNvZGUpXHJcbiAgICAgICAgaWYgKCFnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSlcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0gPSB7fVxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1cclxuXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3I9c2VsZWN0Q29sb3JDb2RlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yPXNlbGVjdENvbG9yQ29kZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwiY29sb3JcIjpzZWxlY3RDb2xvckNvZGUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBzaGFwZVNlbGVjdG9yID0gJCgnPHNlbGVjdCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwib3V0bGluZTpub25lXCI+PC9zZWxlY3Q+JylcclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoc2hhcGVTZWxlY3RvcilcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCl7XHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J2VsbGlwc2UnPuKXrzwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0ncm91bmQtcmVjdGFuZ2xlJyBzdHlsZT0nZm9udC1zaXplOjEyMCUnPuKWojwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0naGV4YWdvbicgc3R5bGU9J2ZvbnQtc2l6ZToxMzAlJz7irKE8L29wdGlvbj5cIikpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nc29saWQnPuKGkjwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nZG90dGVkJz7ih6I8L29wdGlvbj5cIikpXHJcbiAgICB9XHJcbiAgICBpZihkZWZpbmVkU2hhcGUhPW51bGwpIHNoYXBlU2VsZWN0b3IudmFsKGRlZmluZWRTaGFwZSlcclxuICAgIFxyXG4gICAgc2hhcGVTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICB2YXIgc2VsZWN0U2hhcGU9ZXZlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgIGlmICghZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0pXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdID0ge31cclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdXHJcblxyXG4gICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlPXNlbGVjdFNoYXBlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcInNoYXBlXCI6c2VsZWN0U2hhcGUgfSlcclxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGU9c2VsZWN0U2hhcGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcInNoYXBlXCI6c2VsZWN0U2hhcGUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG5cclxuXHJcbiAgICB2YXIgc2l6ZUFkanVzdFNlbGVjdG9yID0gJCgnPHNlbGVjdCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwib3V0bGluZTpub25lO3dpZHRoOjExMHB4XCI+PC9zZWxlY3Q+JylcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCl7XHJcbiAgICAgICAgZm9yKHZhciBmPTAuMjtmPDI7Zis9MC4yKXtcclxuICAgICAgICAgICAgdmFyIHZhbD1mLnRvRml4ZWQoMSkrXCJcIlxyXG4gICAgICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPVwiK3ZhbCtcIj5kaW1lbnNpb24qXCIrdmFsK1wiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihkZWZpbmVkRGltZW5zaW9uUmF0aW8hPW51bGwpIHNpemVBZGp1c3RTZWxlY3Rvci52YWwoZGVmaW5lZERpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIGVsc2Ugc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChcIjEuMFwiKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgc2l6ZUFkanVzdFNlbGVjdG9yLmNzcyhcIndpZHRoXCIsXCI4MHB4XCIpXHJcbiAgICAgICAgZm9yKHZhciBmPTAuNTtmPD00O2YrPTAuNSl7XHJcbiAgICAgICAgICAgIHZhciB2YWw9Zi50b0ZpeGVkKDEpK1wiXCJcclxuICAgICAgICAgICAgc2l6ZUFkanVzdFNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT1cIit2YWwrXCI+d2lkdGggKlwiK3ZhbCtcIjwvb3B0aW9uPlwiKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZGVmaW5lZEVkZ2VXaWR0aCE9bnVsbCkgc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChkZWZpbmVkRWRnZVdpZHRoKVxyXG4gICAgICAgIGVsc2Ugc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChcIjIuMFwiKVxyXG4gICAgfVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChzaXplQWRqdXN0U2VsZWN0b3IpXHJcblxyXG4gICAgXHJcbiAgICBzaXplQWRqdXN0U2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIGNob29zZVZhbD1ldmUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgaWYgKCFnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSlcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0gPSB7fVxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1cclxuXHJcbiAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvPWNob29zZVZhbFxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJkaW1lbnNpb25SYXRpb1wiOmNob29zZVZhbCB9KVxyXG4gICAgICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aD1jaG9vc2VWYWxcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcImVkZ2VXaWR0aFwiOmNob29zZVZhbCB9KVxyXG4gICAgICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnNhdmVWaXN1YWxEZWZpbml0aW9uPWZ1bmN0aW9uKCl7XHJcbiAgICAkLnBvc3QoXCJ2aXN1YWxEZWZpbml0aW9uL3NhdmVWaXN1YWxEZWZpbml0aW9uXCIse3Zpc3VhbERlZmluaXRpb25Kc29uOmdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb259KVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxSZWxhdGlvbnNoaXBJbmZvPWZ1bmN0aW9uKHZhbGlkUmVsYXRpb25zaGlwcyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4gdmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW0nPlwiK2luZCtcIjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMWVtXCIpXHJcblxyXG4gICAgICAgIHZhciBsYWJlbD0kKFwiPGxhYmVsIGNsYXNzPSd3My1saW1lJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCc+PC9sYWJlbD5cIilcclxuICAgICAgICBsYWJlbC50ZXh0KFwiUmVsYXRpb25zaGlwXCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChsYWJlbClcclxuICAgICAgICBpZih2YWxpZFJlbGF0aW9uc2hpcHNbaW5kXS50YXJnZXQpe1xyXG4gICAgICAgICAgICB2YXIgbGFiZWwxPSQoXCI8bGFiZWwgY2xhc3M9J3czLWxpbWUnIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4O21hcmdpbi1sZWZ0OjJweCc+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLnRleHQodmFsaWRSZWxhdGlvbnNoaXBzW2luZF0udGFyZ2V0KVxyXG4gICAgICAgICAgICBwYXJlbnREb20uYXBwZW5kKGxhYmVsMSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXModmFsaWRSZWxhdGlvbnNoaXBzW2luZF0uZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzLCBjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxFZGl0YWJsZVByb3BlcnRpZXM9ZnVuY3Rpb24oanNvbkluZm8scGFyZW50RG9tKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW0nPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMWVtXCIpXHJcblxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpe1xyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIGNsYXNzPSd3My1kYXJrLWdyYXknID48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoXCJlbnVtXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICAgICAgICAgIHZhciB2YWx1ZUFycj1bXVxyXG4gICAgICAgICAgICBqc29uSW5mb1tpbmRdLmZvckVhY2goZWxlPT57dmFsdWVBcnIucHVzaChlbGUuZW51bVZhbHVlKX0pXHJcbiAgICAgICAgICAgIHZhciBsYWJlbDE9JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLmNzcyh7XCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCcsXCJtYXJnaW4tbGVmdFwiOlwiMnB4XCJ9KVxyXG4gICAgICAgICAgICBsYWJlbDEudGV4dCh2YWx1ZUFyci5qb2luKCkpXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQobGFiZWwxKVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGpzb25JbmZvW2luZF0sY29udGVudERPTSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFkZEFQYXJ0SW5SaWdodFNwYW49ZnVuY3Rpb24ocGFydE5hbWUpe1xyXG4gICAgdmFyIGhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnblwiIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZFwiPjwvYnV0dG9uPicpXHJcbiAgICBoZWFkZXJET00udGV4dChwYXJ0TmFtZSlcclxuICAgIHZhciBsaXN0RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtaGlkZSB3My1ib3JkZXIgdzMtc2hvd1wiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjp3aGl0ZVwiPjwvZGl2PicpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5hcHBlbmQoaGVhZGVyRE9NLGxpc3RET00pXHJcblxyXG4gICAgaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZihsaXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgbGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICBlbHNlIGxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGxpc3RET007XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0PWFzeW5jIGZ1bmN0aW9uKGZpbGVzKXtcclxuICAgIC8vIGZpbGVzIGlzIGEgRmlsZUxpc3Qgb2YgRmlsZSBvYmplY3RzLiBMaXN0IHNvbWUgcHJvcGVydGllcy5cclxuICAgIHZhciBmaWxlQ29udGVudEFycj1bXVxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGk8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGY9ZmlsZXNbaV1cclxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICBpZiAoZi50eXBlIT1cImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgc3RyPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKGYpXHJcbiAgICAgICAgICAgIHZhciBvYmo9SlNPTi5wYXJzZShzdHIpXHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkob2JqKSkgZmlsZUNvbnRlbnRBcnI9ZmlsZUNvbnRlbnRBcnIuY29uY2F0KG9iailcclxuICAgICAgICAgICAgZWxzZSBmaWxlQ29udGVudEFyci5wdXNoKG9iailcclxuICAgICAgICB9Y2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgYWxlcnQoZXJyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKGZpbGVDb250ZW50QXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgXHJcbiAgICAkLnBvc3QoXCJlZGl0QURUL2ltcG9ydE1vZGVsc1wiLHtcIm1vZGVsc1wiOkpTT04uc3RyaW5naWZ5KGZpbGVDb250ZW50QXJyKX0sIChkYXRhKT0+IHtcclxuICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSB7Ly9zdWNjZXNzZnVsXHJcbiAgICAgICAgICAgIHRoaXMubGlzdE1vZGVscyhcInNob3VsZEJyb2FkQ2FzdFwiKVxyXG4gICAgICAgIH0gZWxzZSB7IC8vZXJyb3IgaGFwcGVuc1xyXG4gICAgICAgICAgICBhbGVydChkYXRhKVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE9uZUZpbGU9IGFzeW5jIGZ1bmN0aW9uKGFGaWxlKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5saXN0TW9kZWxzPWZ1bmN0aW9uKHNob3VsZEJyb2FkY2FzdCl7XHJcbiAgICB0aGlzLm1vZGVsTGlzdC5lbXB0eSgpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5lbXB0eSgpXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLm1vZGVscykgZGVsZXRlIHRoaXMubW9kZWxzW2luZF1cclxuXHJcbiAgICAkLmdldChcInF1ZXJ5QURUL2xpc3RNb2RlbHNcIiwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W11cclxuICAgICAgICBkYXRhLmZvckVhY2gob25lSXRlbT0+e1xyXG4gICAgICAgICAgICBpZihvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl09PW51bGwpIG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXT1vbmVJdGVtW1wiQGlkXCJdXHJcbiAgICAgICAgICAgIGlmKCQuaXNQbGFpbk9iamVjdChvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl0pKXtcclxuICAgICAgICAgICAgICAgIGlmKG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdKSBvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl09b25lSXRlbVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl1cclxuICAgICAgICAgICAgICAgIGVsc2Ugb25lSXRlbVtcImRpc3BsYXlOYW1lXCJdPUpTT04uc3RyaW5naWZ5KG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZih0aGlzLm1vZGVsc1tvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl1dIT1udWxsKXtcclxuICAgICAgICAgICAgICAgIC8vcmVwZWF0ZWQgbW9kZWwgZGlzcGxheSBuYW1lXHJcbiAgICAgICAgICAgICAgICBvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl09b25lSXRlbVtcIkBpZFwiXVxyXG4gICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgdGhpcy5tb2RlbHNbb25lSXRlbVtcImRpc3BsYXlOYW1lXCJdXSA9IG9uZUl0ZW1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGlmKHNob3VsZEJyb2FkY2FzdCl7XHJcbiAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuY2xlYXJBbGxNb2RlbHMoKTtcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMoZGF0YSlcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hbmFseXplKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGRhdGEubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgdmFyIHplcm9Nb2RlbEl0ZW09JCgnPGxpIHN0eWxlPVwiZm9udC1zaXplOjAuOWVtXCI+emVybyBtb2RlbCByZWNvcmQuIFBsZWFzZSBpbXBvcnQuLi48L2xpPicpXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxMaXN0LmFwcGVuZCh6ZXJvTW9kZWxJdGVtKVxyXG4gICAgICAgICAgICB6ZXJvTW9kZWxJdGVtLmNzcyhcImN1cnNvclwiLFwiZGVmYXVsdFwiKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLnRyZWU9bmV3IHNpbXBsZVRyZWUodGhpcy5tb2RlbExpc3Qse1wibGVhZk5hbWVQcm9wZXJ0eVwiOlwiZGlzcGxheU5hbWVcIixcIm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkXCI6dHJ1ZSxcImhpZGVFbXB0eUdyb3VwXCI6dHJ1ZX0pXHJcblxyXG4gICAgICAgICAgICB0aGlzLnRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jPShsbik9PntcclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbENsYXNzPWxuLmxlYWZJbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgICAgICAgICB2YXIgY29sb3JDb2RlPVwiZGFya0dyYXlcIlxyXG4gICAgICAgICAgICAgICAgdmFyIHNoYXBlPVwiZWxsaXBzZVwiXHJcbiAgICAgICAgICAgICAgICB2YXIgYXZhcnRhID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgdmFyIGRpbWVuc2lvbj0yMDtcclxuICAgICAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdICYmIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdW21vZGVsQ2xhc3NdKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmlzdWFsSnNvbiA9Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bbW9kZWxDbGFzc11cclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29sb3JDb2RlPSB2aXN1YWxKc29uLmNvbG9yIHx8IFwiZGFya0dyYXlcIlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzaGFwZT0gIHZpc3VhbEpzb24uc2hhcGUgfHwgXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXZhcnRhID0gdmlzdWFsSnNvbi5hdmFydGFcclxuICAgICAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKSBkaW1lbnNpb24qPXBhcnNlRmxvYXQodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBpY29uRE9NID0gJChcIjxkaXYgc3R5bGU9J3dpZHRoOlwiK2RpbWVuc2lvbitcInB4O2hlaWdodDpcIitkaW1lbnNpb24rXCJweDtmbG9hdDpsZWZ0O3Bvc2l0aW9uOnJlbGF0aXZlJz48L2Rpdj5cIilcclxuICAgICAgICAgICAgICAgIHZhciBpbWdTcmMgPSBlbmNvZGVVUklDb21wb25lbnQodGhpcy5zaGFwZVN2ZyhzaGFwZSwgY29sb3JDb2RlKSlcclxuICAgICAgICAgICAgICAgIGljb25ET00uYXBwZW5kKCQoXCI8aW1nIHNyYz0nZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsXCIgKyBpbWdTcmMgKyBcIic+PC9pbWc+XCIpKVxyXG4gICAgICAgICAgICAgICAgaWYgKGF2YXJ0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdmFydGFpbWcgPSAkKFwiPGltZyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7bGVmdDowcHg7d2lkdGg6NjAlO21hcmdpbjoyMCUnIHNyYz0nXCIgKyBhdmFydGEgKyBcIic+PC9pbWc+XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoYXZhcnRhaW1nKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGljb25ET01cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy50cmVlLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXM9KG5vZGVzQXJyLG1vdXNlQ2xpY2tEZXRhaWwpPT57XHJcbiAgICAgICAgICAgICAgICB2YXIgdGhlTm9kZT1ub2Rlc0FyclswXVxyXG4gICAgICAgICAgICAgICAgdGhpcy5maWxsUmlnaHRTcGFuKHRoZU5vZGUubGVhZkluZm9bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGdyb3VwTmFtZUxpc3Q9e31cclxuICAgICAgICAgICAgZm9yKHZhciBtb2RlbE5hbWUgaW4gdGhpcy5tb2RlbHMpICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWxJRD0gdGhpcy5tb2RlbHNbbW9kZWxOYW1lXVtcIkBpZFwiXVxyXG4gICAgICAgICAgICAgICAgZ3JvdXBOYW1lTGlzdFt0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXT0xXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIG1vZGVsZ3JvdXBTb3J0QXJyPU9iamVjdC5rZXlzKGdyb3VwTmFtZUxpc3QpXHJcbiAgICAgICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlKGIudG9Mb3dlckNhc2UoKSkgfSk7XHJcbiAgICAgICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLmZvckVhY2gob25lR3JvdXBOYW1lPT57XHJcbiAgICAgICAgICAgICAgICB2YXIgZ249dGhpcy50cmVlLmFkZEdyb3VwTm9kZSh7IGRpc3BsYXlOYW1lOiBvbmVHcm91cE5hbWUgfSlcclxuICAgICAgICAgICAgICAgIGduLmV4cGFuZCgpXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICBmb3IodmFyIG1vZGVsTmFtZSBpbiB0aGlzLm1vZGVscyl7XHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWxJRD0gdGhpcy5tb2RlbHNbbW9kZWxOYW1lXVtcIkBpZFwiXVxyXG4gICAgICAgICAgICAgICAgdmFyIGduPXRoaXMubW9kZWxOYW1lVG9Hcm91cE5hbWUobW9kZWxJRClcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ24sdGhpcy5tb2RlbHNbbW9kZWxOYW1lXSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy50cmVlLnNvcnRBbGxMZWF2ZXMoKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZihzaG91bGRCcm9hZGNhc3QpIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsc0NoYW5nZVwiLCBcIm1vZGVsc1wiOnRoaXMubW9kZWxzIH0pXHJcbiAgICB9KVxyXG5cclxuXHJcbiAgICBcclxuICAgIC8vdmFyIGcxID0gdGhpcy50cmVlLmFkZEdyb3VwTm9kZSh7ZGlzcGxheU5hbWU6XCJ0ZXN0XCJ9KVxyXG4gICAgLy90aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKFwidGVzdFwiLHtcImRpc3BsYXlOYW1lXCI6XCJoYWhhXCJ9LFwic2tpcFJlcGVhdFwiKVxyXG4gICAgLy9yZXR1cm47XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuc2hhcGVTdmc9ZnVuY3Rpb24oc2hhcGUsY29sb3Ipe1xyXG4gICAgaWYoc2hhcGU9PVwiZWxsaXBzZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxjaXJjbGUgY3g9XCI1MFwiIGN5PVwiNTBcIiByPVwiNTBcIiAgZmlsbD1cIicrY29sb3IrJ1wiLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJoZXhhZ29uXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PHBvbHlnb24gcG9pbnRzPVwiNTAgMCwgOTMuMyAyNSwgOTMuMyA3NSwgNTAgMTAwLCA2LjcgNzUsIDYuNyAyNVwiICBmaWxsPVwiJytjb2xvcisnXCIgLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJyb3VuZC1yZWN0YW5nbGVcIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cmVjdCB4PVwiMTBcIiB5PVwiMTBcIiByeD1cIjEwXCIgcnk9XCIxMFwiIHdpZHRoPVwiODBcIiBoZWlnaHQ9XCI4MFwiIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5tb2RlbE5hbWVUb0dyb3VwTmFtZT1mdW5jdGlvbihtb2RlbE5hbWUpe1xyXG4gICAgdmFyIG5hbWVQYXJ0cz1tb2RlbE5hbWUuc3BsaXQoXCI6XCIpXHJcbiAgICBpZihuYW1lUGFydHMubGVuZ3RoPj0yKSAgcmV0dXJuIG5hbWVQYXJ0c1sxXVxyXG4gICAgZWxzZSByZXR1cm4gXCJPdGhlcnNcIlxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbEVkaXRlZFwiKSB0aGlzLmxpc3RNb2RlbHMoXCJzaG91bGRCcm9hZGNhc3RcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsTWFuYWdlckRpYWxvZygpOyIsImZ1bmN0aW9uIHNpbXBsZUNvbmZpcm1EaWFsb2coKXtcclxuICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMlwiIGNsYXNzPVwidzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIC8vdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG59XHJcblxyXG5zaW1wbGVDb25maXJtRGlhbG9nLnByb3RvdHlwZS5zaG93PWZ1bmN0aW9uKGNzc09wdGlvbnMsb3RoZXJPcHRpb25zKXtcclxuICAgIHRoaXMuRE9NLmNzcyhjc3NPcHRpb25zKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+JyArIG90aGVyT3B0aW9ucy50aXRsZSArICc8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmNsb3NlKCkgfSlcclxuXHJcbiAgICB2YXIgZGlhbG9nRGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MTBweDttYXJnaW4tYm90dG9tOjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgZGlhbG9nRGl2LnRleHQob3RoZXJPcHRpb25zLmNvbnRlbnQpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoZGlhbG9nRGl2KVxyXG4gICAgdGhpcy5kaWFsb2dEaXY9ZGlhbG9nRGl2XHJcblxyXG4gICAgdGhpcy5ib3R0b21CYXI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5ib3R0b21CYXIpXHJcblxyXG4gICAgb3RoZXJPcHRpb25zLmJ1dHRvbnMuZm9yRWFjaChidG49PntcclxuICAgICAgICB2YXIgYUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXJpZ2h0ICcrKGJ0bi5jb2xvckNsYXNzfHxcIlwiKSsnXCIgc3R5bGU9XCJtYXJnaW4tcmlnaHQ6MnB4O21hcmdpbi1sZWZ0OjJweFwiPicrYnRuLnRleHQrJzwvYnV0dG9uPicpXHJcbiAgICAgICAgYUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PiB7IGJ0bi5jbGlja0Z1bmMoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYm90dG9tQmFyLmFwcGVuZChhQnV0dG9uKSAgICBcclxuICAgIH0pXHJcbiAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbn1cclxuXHJcbnNpbXBsZUNvbmZpcm1EaWFsb2cucHJvdG90eXBlLmNsb3NlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZUNvbmZpcm1EaWFsb2c7IiwiZnVuY3Rpb24gc2ltcGxlU2VsZWN0TWVudShidXR0b25OYW1lLG9wdGlvbnMpe1xyXG4gICAgb3B0aW9ucz1vcHRpb25zfHx7fSAvL3tpc0NsaWNrYWJsZToxLHdpdGhCb3JkZXI6MSxmb250U2l6ZTpcIlwiLGNvbG9yQ2xhc3M6XCJcIixidXR0b25DU1M6XCJcIn1cclxuICAgIGlmKG9wdGlvbnMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgIHRoaXMuaXNDbGlja2FibGU9dHJ1ZVxyXG4gICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jbGlja1wiPjwvZGl2PicpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24taG92ZXIgXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5vbihcIm1vdXNlb3ZlclwiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMuYnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b25cIiBzdHlsZT1cIm91dGxpbmU6IG5vbmU7XCI+PGE+JytidXR0b25OYW1lKyc8L2E+PGEgc3R5bGU9XCJmb250LXdlaWdodDpib2xkO3BhZGRpbmctbGVmdDoycHhcIj48L2E+PGkgY2xhc3M9XCJmYSBmYS1jYXJldC1kb3duXCIgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6M3B4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBpZihvcHRpb25zLndpdGhCb3JkZXIpIHRoaXMuYnV0dG9uLmFkZENsYXNzKFwidzMtYm9yZGVyXCIpXHJcbiAgICBpZihvcHRpb25zLmZvbnRTaXplKSB0aGlzLkRPTS5jc3MoXCJmb250LXNpemVcIixvcHRpb25zLmZvbnRTaXplKVxyXG4gICAgaWYob3B0aW9ucy5jb2xvckNsYXNzKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhvcHRpb25zLmNvbG9yQ2xhc3MpXHJcbiAgICBpZihvcHRpb25zLndpZHRoKSB0aGlzLmJ1dHRvbi5jc3MoXCJ3aWR0aFwiLG9wdGlvbnMud2lkdGgpXHJcbiAgICBpZihvcHRpb25zLmJ1dHRvbkNTUykgdGhpcy5idXR0b24uY3NzKG9wdGlvbnMuYnV0dG9uQ1NTKVxyXG4gICAgaWYob3B0aW9ucy5hZGp1c3RQb3NpdGlvbkFuY2hvcikgdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvcj1vcHRpb25zLmFkanVzdFBvc2l0aW9uQW5jaG9yXHJcblxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jb250ZW50IHczLWJhci1ibG9jayB3My1jYXJkLTRcIj48L2Rpdj4nKVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0KSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtoZWlnaHQ6b3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0K1wicHhcIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcIm92ZXJmbG93LXhcIjpcInZpc2libGVcIn0pXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5Ub3ApIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1wibWFyZ2luLXRvcFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpblRvcCtcInB4XCJ9KVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luTGVmdCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJtYXJnaW4tbGVmdFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpbkxlZnQrXCJweFwifSlcclxuICAgIFxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuYnV0dG9uLHRoaXMub3B0aW9uQ29udGVudERPTSlcclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcblxyXG4gICAgaWYob3B0aW9ucy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgdGhpcy5idXR0b24ub24oXCJjbGlja1wiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbkNvbnRlbnRET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMub3B0aW9uQ29udGVudERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICB9KSAgICBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRqdXN0RHJvcERvd25Qb3NpdGlvbj1mdW5jdGlvbigpe1xyXG4gICAgaWYoIXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IpIHJldHVybjtcclxuICAgIHZhciBvZmZzZXQ9dGhpcy5ET00ub2Zmc2V0KClcclxuICAgIHZhciBuZXdUb3A9b2Zmc2V0LnRvcC10aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yLnRvcFxyXG4gICAgdmFyIG5ld0xlZnQ9b2Zmc2V0LmxlZnQtdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvci5sZWZ0XHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcInRvcFwiOm5ld1RvcCtcInB4XCIsXCJsZWZ0XCI6bmV3TGVmdCtcInB4XCJ9KVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5maW5kT3B0aW9uPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciBvcHRpb25zPXRoaXMub3B0aW9uQ29udGVudERPTS5jaGlsZHJlbigpXHJcbiAgICBmb3IodmFyIGk9MDtpPG9wdGlvbnMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQob3B0aW9uc1tpXSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09YW5PcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHtcInRleHRcIjphbk9wdGlvbi50ZXh0KCksXCJ2YWx1ZVwiOmFuT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKX1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkZE9wdGlvbkFycj1mdW5jdGlvbihhcnIpe1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgdGhpcy5hZGRPcHRpb24oZWxlbWVudClcclxuICAgIH0pO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGRPcHRpb249ZnVuY3Rpb24ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSl7XHJcbiAgICB2YXIgb3B0aW9uSXRlbT0kKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCI+JytvcHRpb25UZXh0Kyc8L2E+JylcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5hcHBlbmQob3B0aW9uSXRlbSlcclxuICAgIG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIsb3B0aW9uVmFsdWV8fG9wdGlvblRleHQpXHJcbiAgICBvcHRpb25JdGVtLm9uKCdjbGljaycsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9b3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIilcclxuICAgICAgICBpZih0aGlzLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24tY2xpY2snKVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgLy90aGlzIGlzIHRvIGhpZGUgdGhlIGRyb3AgZG93biBtZW51IGFmdGVyIGNsaWNrXHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoJ3czLWRyb3Bkb3duLWNsaWNrJylcclxuICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihvcHRpb25UZXh0LG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIpLFwicmVhbE1vdXNlQ2xpY2tcIilcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNoYW5nZU5hbWU9ZnVuY3Rpb24obmFtZVN0cjEsbmFtZVN0cjIpe1xyXG4gICAgdGhpcy5idXR0b24uY2hpbGRyZW4oXCI6Zmlyc3RcIikudGV4dChuYW1lU3RyMSlcclxuICAgIHRoaXMuYnV0dG9uLmNoaWxkcmVuKCkuZXEoMSkudGV4dChuYW1lU3RyMilcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvbkluZGV4PWZ1bmN0aW9uKG9wdGlvbkluZGV4KXtcclxuICAgIHZhciB0aGVPcHRpb249dGhpcy5vcHRpb25Db250ZW50RE9NLmNoaWxkcmVuKCkuZXEob3B0aW9uSW5kZXgpXHJcbiAgICBpZih0aGVPcHRpb24ubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG51bGwsbnVsbClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD10aGVPcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHRoZU9wdGlvbi50ZXh0KCksdGhlT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSlcclxufVxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS50cmlnZ2VyT3B0aW9uVmFsdWU9ZnVuY3Rpb24ob3B0aW9uVmFsdWUpe1xyXG4gICAgdmFyIHJlPXRoaXMuZmluZE9wdGlvbihvcHRpb25WYWx1ZSlcclxuICAgIGlmKHJlPT1udWxsKXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsXHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihudWxsLG51bGwpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1yZS52YWx1ZVxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24ocmUudGV4dCxyZS52YWx1ZSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNsZWFyT3B0aW9ucz1mdW5jdGlvbihvcHRpb25UZXh0LG9wdGlvblZhbHVlKXtcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jYWxsQmFja19jbGlja09wdGlvbj1mdW5jdGlvbihvcHRpb250ZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKXtcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlU2VsZWN0TWVudTsiLCIndXNlIHN0cmljdCc7XHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWUoRE9NLG9wdGlvbnMpe1xyXG4gICAgdGhpcy5ET009RE9NXHJcbiAgICB0aGlzLmdyb3VwTm9kZXM9W10gLy9lYWNoIGdyb3VwIGhlYWRlciBpcyBvbmUgbm9kZVxyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzPVtdO1xyXG4gICAgdGhpcy5vcHRpb25zPW9wdGlvbnMgfHwge31cclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGw7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNjcm9sbFRvTGVhZk5vZGU9ZnVuY3Rpb24oYU5vZGUpe1xyXG4gICAgdmFyIHNjcm9sbFRvcD10aGlzLkRPTS5zY3JvbGxUb3AoKVxyXG4gICAgdmFyIHRyZWVIZWlnaHQ9dGhpcy5ET00uaGVpZ2h0KClcclxuICAgIHZhciBub2RlUG9zaXRpb249YU5vZGUuRE9NLnBvc2l0aW9uKCkudG9wIC8vd2hpY2ggZG9lcyBub3QgY29uc2lkZXIgcGFyZW50IERPTSdzIHNjcm9sbCBoZWlnaHRcclxuICAgIC8vY29uc29sZS5sb2coc2Nyb2xsVG9wLHRyZWVIZWlnaHQsbm9kZVBvc2l0aW9uKVxyXG4gICAgaWYodHJlZUhlaWdodC01MDxub2RlUG9zaXRpb24pe1xyXG4gICAgICAgIHRoaXMuRE9NLnNjcm9sbFRvcChzY3JvbGxUb3AgKyBub2RlUG9zaXRpb24tKHRyZWVIZWlnaHQtNTApKSBcclxuICAgIH1lbHNlIGlmKG5vZGVQb3NpdGlvbjw1MCl7XHJcbiAgICAgICAgdGhpcy5ET00uc2Nyb2xsVG9wKHNjcm9sbFRvcCArIChub2RlUG9zaXRpb24tNTApKSBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuY2xlYXJBbGxMZWFmTm9kZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBnTm9kZS5saXN0RE9NLmVtcHR5KClcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9MFxyXG4gICAgICAgIGdOb2RlLnJlZnJlc2hOYW1lKClcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmdldEFsbExlYWZOb2RlQXJyPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYWxsTGVhZj1bXVxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goZ249PntcclxuICAgICAgICBhbGxMZWFmPWFsbExlYWYuY29uY2F0KGduLmNoaWxkTGVhZk5vZGVzKVxyXG4gICAgfSlcclxuICAgIHJldHVybiBhbGxMZWFmO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5maXJzdExlYWZOb2RlPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLmdyb3VwTm9kZXMubGVuZ3RoPT0wKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciBmaXJzdExlYWZOb2RlPW51bGw7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChhR3JvdXBOb2RlPT57XHJcbiAgICAgICAgaWYoZmlyc3RMZWFmTm9kZSE9bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGlmKGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPjApIGZpcnN0TGVhZk5vZGU9YUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1swXVxyXG4gICAgfSlcclxuXHJcbiAgICByZXR1cm4gZmlyc3RMZWFmTm9kZVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5uZXh0R3JvdXBOb2RlPWZ1bmN0aW9uKGFHcm91cE5vZGUpe1xyXG4gICAgaWYoYUdyb3VwTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgdmFyIGluZGV4PXRoaXMuZ3JvdXBOb2Rlcy5pbmRleE9mKGFHcm91cE5vZGUpXHJcbiAgICBpZih0aGlzLmdyb3VwTm9kZXMubGVuZ3RoLTE+aW5kZXgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyb3VwTm9kZXNbaW5kZXgrMV1cclxuICAgIH1lbHNleyAvL3JvdGF0ZSBiYWNrd2FyZCB0byBmaXJzdCBncm91cCBub2RlXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBOb2Rlc1swXSBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUubmV4dExlYWZOb2RlPWZ1bmN0aW9uKGFMZWFmTm9kZSl7XHJcbiAgICBpZihhTGVhZk5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIHZhciBhR3JvdXBOb2RlPWFMZWFmTm9kZS5wYXJlbnRHcm91cE5vZGVcclxuICAgIHZhciBpbmRleD1hR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmluZGV4T2YoYUxlYWZOb2RlKVxyXG4gICAgaWYoYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGgtMT5pbmRleCl7XHJcbiAgICAgICAgLy9uZXh0IG5vZGUgaXMgaW4gc2FtZSBncm91cFxyXG4gICAgICAgIHJldHVybiBhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzW2luZGV4KzFdXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICAvL2ZpbmQgbmV4dCBncm91cCBmaXJzdCBub2RlXHJcbiAgICAgICAgd2hpbGUodHJ1ZSl7XHJcbiAgICAgICAgICAgIHZhciBuZXh0R3JvdXBOb2RlID0gdGhpcy5uZXh0R3JvdXBOb2RlKGFHcm91cE5vZGUpXHJcbiAgICAgICAgICAgIGlmKG5leHRHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgICAgIGFHcm91cE5vZGU9bmV4dEdyb3VwTm9kZVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0R3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzWzBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlYXJjaFRleHQ9ZnVuY3Rpb24oc3RyKXtcclxuICAgIGlmKHN0cj09XCJcIikgcmV0dXJuIG51bGw7XHJcbiAgICAvL3NlYXJjaCBmcm9tIGN1cnJlbnQgc2VsZWN0IGl0ZW0gdGhlIG5leHQgbGVhZiBpdGVtIGNvbnRhaW5zIHRoZSB0ZXh0XHJcbiAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKHN0ciwgJ2knKTtcclxuICAgIHZhciBzdGFydE5vZGVcclxuICAgIGlmKHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg9PTApIHtcclxuICAgICAgICBzdGFydE5vZGU9dGhpcy5maXJzdExlYWZOb2RlKClcclxuICAgICAgICBpZihzdGFydE5vZGU9PW51bGwpIHJldHVybjtcclxuICAgICAgICB2YXIgdGhlU3RyPXN0YXJ0Tm9kZS5uYW1lO1xyXG4gICAgICAgIGlmKHRoZVN0ci5tYXRjaChyZWdleCkhPW51bGwpe1xyXG4gICAgICAgICAgICAvL2ZpbmQgdGFyZ2V0IG5vZGUgXHJcbiAgICAgICAgICAgIHJldHVybiBzdGFydE5vZGVcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBzdGFydE5vZGU9dGhpcy5zZWxlY3RlZE5vZGVzWzBdXHJcblxyXG4gICAgaWYoc3RhcnROb2RlPT1udWxsKSByZXR1cm4gbnVsbDtcclxuICAgIFxyXG4gICAgdmFyIGZyb21Ob2RlPXN0YXJ0Tm9kZTtcclxuICAgIHdoaWxlKHRydWUpe1xyXG4gICAgICAgIHZhciBuZXh0Tm9kZT10aGlzLm5leHRMZWFmTm9kZShmcm9tTm9kZSlcclxuICAgICAgICBpZihuZXh0Tm9kZT09c3RhcnROb2RlKSByZXR1cm4gbnVsbDtcclxuICAgICAgICB2YXIgbmV4dE5vZGVTdHI9bmV4dE5vZGUubmFtZTtcclxuICAgICAgICBpZihuZXh0Tm9kZVN0ci5tYXRjaChyZWdleCkhPW51bGwpe1xyXG4gICAgICAgICAgICAvL2ZpbmQgdGFyZ2V0IG5vZGVcclxuICAgICAgICAgICAgcmV0dXJuIG5leHROb2RlXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGZyb21Ob2RlPW5leHROb2RlO1xyXG4gICAgICAgIH1cclxuICAgIH0gICAgXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hZGRMZWFmbm9kZVRvR3JvdXA9ZnVuY3Rpb24oZ3JvdXBOYW1lLG9iaixza2lwUmVwZWF0KXtcclxuICAgIHZhciBhR3JvdXBOb2RlPXRoaXMuZmluZEdyb3VwTm9kZShncm91cE5hbWUpXHJcbiAgICBpZihhR3JvdXBOb2RlID09IG51bGwpIHJldHVybjtcclxuICAgIGFHcm91cE5vZGUuYWRkTm9kZShvYmosc2tpcFJlcGVhdClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUucmVtb3ZlQWxsTm9kZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZmluZEdyb3VwTm9kZT1mdW5jdGlvbihncm91cE5hbWUpe1xyXG4gICAgdmFyIGZvdW5kR3JvdXBOb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGFHcm91cE5vZGU9PntcclxuICAgICAgICBpZihhR3JvdXBOb2RlLm5hbWU9PWdyb3VwTmFtZSl7XHJcbiAgICAgICAgICAgIGZvdW5kR3JvdXBOb2RlPWFHcm91cE5vZGVcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICByZXR1cm4gZm91bmRHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmRlbEdyb3VwTm9kZT1mdW5jdGlvbihnbm9kZSl7XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsXHJcbiAgICBnbm9kZS5kZWxldGVTZWxmKClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGVsZXRlTGVhZk5vZGU9ZnVuY3Rpb24obm9kZU5hbWUpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgdmFyIGZpbmRMZWFmTm9kZT1udWxsXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ05vZGUpPT57XHJcbiAgICAgICAgaWYoZmluZExlYWZOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgZ05vZGUuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaCgoYUxlYWYpPT57XHJcbiAgICAgICAgICAgIGlmKGFMZWFmLm5hbWU9PW5vZGVOYW1lKXtcclxuICAgICAgICAgICAgICAgIGZpbmRMZWFmTm9kZT1hTGVhZlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICBpZihmaW5kTGVhZk5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIGZpbmRMZWFmTm9kZS5kZWxldGVTZWxmKClcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmluc2VydEdyb3VwTm9kZT1mdW5jdGlvbihvYmosaW5kZXgpe1xyXG4gICAgdmFyIGFOZXdHcm91cE5vZGUgPSBuZXcgc2ltcGxlVHJlZUdyb3VwTm9kZSh0aGlzLG9iailcclxuICAgIHZhciBleGlzdEdyb3VwTm9kZT0gdGhpcy5maW5kR3JvdXBOb2RlKGFOZXdHcm91cE5vZGUubmFtZSlcclxuICAgIGlmKGV4aXN0R3JvdXBOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuc3BsaWNlKGluZGV4LCAwLCBhTmV3R3JvdXBOb2RlKTtcclxuXHJcbiAgICBpZihpbmRleD09MCl7XHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgcHJldkdyb3VwTm9kZT10aGlzLmdyb3VwTm9kZXNbaW5kZXgtMV1cclxuICAgICAgICBhTmV3R3JvdXBOb2RlLmhlYWRlckRPTS5pbnNlcnRBZnRlcihwcmV2R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICAgICAgYU5ld0dyb3VwTm9kZS5saXN0RE9NLmluc2VydEFmdGVyKGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhTmV3R3JvdXBOb2RlO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hZGRHcm91cE5vZGU9ZnVuY3Rpb24ob2JqKXtcclxuICAgIHZhciBhTmV3R3JvdXBOb2RlID0gbmV3IHNpbXBsZVRyZWVHcm91cE5vZGUodGhpcyxvYmopXHJcbiAgICB2YXIgZXhpc3RHcm91cE5vZGU9IHRoaXMuZmluZEdyb3VwTm9kZShhTmV3R3JvdXBOb2RlLm5hbWUpXHJcbiAgICBpZihleGlzdEdyb3VwTm9kZSE9bnVsbCkgcmV0dXJuIGV4aXN0R3JvdXBOb2RlO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLnB1c2goYU5ld0dyb3VwTm9kZSk7XHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5saXN0RE9NKVxyXG4gICAgcmV0dXJuIGFOZXdHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdExlYWZOb2RlPWZ1bmN0aW9uKGxlYWZOb2RlLG1vdXNlQ2xpY2tEZXRhaWwpe1xyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihbbGVhZk5vZGVdLG1vdXNlQ2xpY2tEZXRhaWwpXHJcbn1cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYXBwZW5kTGVhZk5vZGVUb1NlbGVjdGlvbj1mdW5jdGlvbihsZWFmTm9kZSl7XHJcbiAgICB2YXIgbmV3QXJyPVtdLmNvbmNhdCh0aGlzLnNlbGVjdGVkTm9kZXMpXHJcbiAgICBuZXdBcnIucHVzaChsZWFmTm9kZSlcclxuICAgIHRoaXMuc2VsZWN0TGVhZk5vZGVBcnIobmV3QXJyKVxyXG59XHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZE5vZGVBcnJheVRvU2VsZWN0aW9uPWZ1bmN0aW9uKGFycil7XHJcbiAgICB2YXIgbmV3QXJyID0gdGhpcy5zZWxlY3RlZE5vZGVzXHJcbiAgICB2YXIgZmlsdGVyQXJyPWFyci5maWx0ZXIoKGl0ZW0pID0+IG5ld0Fyci5pbmRleE9mKGl0ZW0pIDwgMClcclxuICAgIG5ld0FyciA9IG5ld0Fyci5jb25jYXQoZmlsdGVyQXJyKVxyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihuZXdBcnIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdEdyb3VwTm9kZT1mdW5jdGlvbihncm91cE5vZGUpe1xyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlclNlbGVjdEdyb3VwTm9kZSkgdGhpcy5jYWxsYmFja19hZnRlclNlbGVjdEdyb3VwTm9kZShncm91cE5vZGUuaW5mbylcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0TGVhZk5vZGVBcnI9ZnVuY3Rpb24obGVhZk5vZGVBcnIsbW91c2VDbGlja0RldGFpbCl7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZXNbaV0uZGltKClcclxuICAgIH1cclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcz10aGlzLnNlbGVjdGVkTm9kZXMuY29uY2F0KGxlYWZOb2RlQXJyKVxyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVzW2ldLmhpZ2hsaWdodCgpXHJcbiAgICB9XHJcblxyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzKSB0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXModGhpcy5zZWxlY3RlZE5vZGVzLG1vdXNlQ2xpY2tEZXRhaWwpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmRibENsaWNrTm9kZT1mdW5jdGlvbih0aGVOb2RlKXtcclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJEYmxjbGlja05vZGUpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJEYmxjbGlja05vZGUodGhlTm9kZSlcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc29ydEFsbExlYXZlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2gob25lR3JvdXBOb2RlPT57b25lR3JvdXBOb2RlLnNvcnROb2Rlc0J5TmFtZSgpfSlcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tdHJlZSBncm91cCBub2RlLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWVHcm91cE5vZGUocGFyZW50VHJlZSxvYmope1xyXG4gICAgdGhpcy5wYXJlbnRUcmVlPXBhcmVudFRyZWVcclxuICAgIHRoaXMuaW5mbz1vYmpcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXM9W10gLy9pdCdzIGNoaWxkIGxlYWYgbm9kZXMgYXJyYXlcclxuICAgIHRoaXMubmFtZT1vYmouZGlzcGxheU5hbWU7XHJcbiAgICB0aGlzLmNyZWF0ZURPTSgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnJlZnJlc2hOYW1lPWZ1bmN0aW9uKCl7IC8v4qyi4paJ4pqrXHJcbiAgICB0aGlzLmhlYWRlckRPTS5lbXB0eSgpXHJcbiAgICB2YXIgbmFtZURpdj0kKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZy1sZWZ0OjVweDtwYWRkaW5nLXJpZ2h0OjNweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGUnPjwvZGl2PlwiKVxyXG4gICAgbmFtZURpdi50ZXh0KHRoaXMubmFtZSlcclxuICAgIFxyXG4gICAgaWYodGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgbGJsQ29sb3I9XCJ5ZWxsb3dncmVlblwiXHJcbiAgICBlbHNlIHZhciBsYmxDb2xvcj1cImRhcmtHcmF5XCIgXHJcbiAgICB0aGlzLmhlYWRlckRPTS5jc3MoXCJmb250LXdlaWdodFwiLFwiYm9sZFwiKVxyXG5cclxuICAgIGlmKHRoaXMucGFyZW50VHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jKXtcclxuICAgICAgICB2YXIgaWNvbkxhYmVsPXRoaXMucGFyZW50VHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jKHRoaXMpXHJcbiAgICAgICAgdGhpcy5oZWFkZXJET00uYXBwZW5kKGljb25MYWJlbClcclxuICAgICAgICB2YXIgcm93SGVpZ2h0PWljb25MYWJlbC5oZWlnaHQoKVxyXG4gICAgICAgIG5hbWVEaXYuY3NzKFwibGluZS1oZWlnaHRcIixyb3dIZWlnaHQrXCJweFwiKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgbnVtYmVybGFiZWw9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7YmFja2dyb3VuZC1jb2xvcjpcIitsYmxDb2xvclxyXG4gICAgICAgICtcIjtjb2xvcjp3aGl0ZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4IDRweDtmb250LXdlaWdodDpub3JtYWw7Ym9yZGVyLXJhZGl1czogMnB4Oyc+XCIrdGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGgrXCI8L2xhYmVsPlwiKVxyXG4gICAgdGhpcy5oZWFkZXJET00uYXBwZW5kKG5hbWVEaXYsbnVtYmVybGFiZWwpIFxyXG4gICAgXHJcbiAgICB0aGlzLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXAoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwPWZ1bmN0aW9uKCl7XHJcbiAgICBpZiAodGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXAgJiYgdGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIHRoaXMuc2hyaW5rKClcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5oaWRlKClcclxuICAgICAgICBpZiAodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uaGlkZSgpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLnNob3coKVxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5zaG93KClcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmRlbGV0ZVNlbGYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmhlYWRlckRPTS5yZW1vdmUoKVxyXG4gICAgdGhpcy5saXN0RE9NLnJlbW92ZSgpXHJcbiAgICB2YXIgcGFyZW50QXJyID0gdGhpcy5wYXJlbnRUcmVlLmdyb3VwTm9kZXNcclxuICAgIGNvbnN0IGluZGV4ID0gcGFyZW50QXJyLmluZGV4T2YodGhpcyk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkgcGFyZW50QXJyLnNwbGljZShpbmRleCwgMSk7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmNyZWF0ZURPTT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5oZWFkZXJET009JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ibG9jayB3My1saWdodC1ncmV5IHczLWxlZnQtYWxpZ24gdzMtYm9yZGVyLWJvdHRvbVwiPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWhpZGUgdzMtYm9yZGVyIHczLXBhZGRpbmctMTZcIj48L2Rpdj4nKVxyXG5cclxuICAgIHRoaXMuaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZih0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcblxyXG4gICAgICAgIHRoaXMucGFyZW50VHJlZS5zZWxlY3RHcm91cE5vZGUodGhpcykgICAgXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmlzT3Blbj1mdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuICB0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5leHBhbmQ9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5zaHJpbms9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5zb3J0Tm9kZXNCeU5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdmFyIGxlYWZOYW1lUHJvcGVydHk9dHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eVxyXG4gICAgZWxzZSBsZWFmTmFtZVByb3BlcnR5PVwiJGR0SWRcIlxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IFxyXG4gICAgICAgIHZhciBhTmFtZT1hLm5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHZhciBiTmFtZT1iLm5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHJldHVybiBhTmFtZS5sb2NhbGVDb21wYXJlKGJOYW1lKSBcclxuICAgIH0pO1xyXG4gICAgLy90aGlzLmxpc3RET00uZW1wdHkoKSAvL05PVEU6IENhbiBub3QgZGVsZXRlIHRob3NlIGxlYWYgbm9kZSBvdGhlcndpc2UgdGhlIGV2ZW50IGhhbmRsZSBpcyBsb3N0XHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2gob25lTGVhZj0+e3RoaXMubGlzdERPTS5hcHBlbmQob25lTGVhZi5ET00pfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuYWRkTm9kZT1mdW5jdGlvbihvYmosc2tpcFJlcGVhdCl7XHJcbiAgICB2YXIgdHJlZU9wdGlvbnM9dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHZhciBsZWFmTmFtZVByb3BlcnR5PXRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHlcclxuICAgIGVsc2UgbGVhZk5hbWVQcm9wZXJ0eT1cIiRkdElkXCJcclxuXHJcbiAgICBpZihza2lwUmVwZWF0KXtcclxuICAgICAgICB2YXIgZm91bmRSZXBlYXQ9ZmFsc2U7XHJcbiAgICAgICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKGFOb2RlPT57XHJcbiAgICAgICAgICAgIGlmKGFOb2RlLm5hbWU9PW9ialtsZWFmTmFtZVByb3BlcnR5XSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRSZXBlYXQ9dHJ1ZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBpZihmb3VuZFJlcGVhdCkgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBhTmV3Tm9kZSA9IG5ldyBzaW1wbGVUcmVlTGVhZk5vZGUodGhpcyxvYmopXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLnB1c2goYU5ld05vZGUpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTS5hcHBlbmQoYU5ld05vZGUuRE9NKVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS10cmVlIGxlYWYgbm9kZS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlTGVhZk5vZGUocGFyZW50R3JvdXBOb2RlLG9iail7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZT1wYXJlbnRHcm91cE5vZGVcclxuICAgIHRoaXMubGVhZkluZm89b2JqO1xyXG5cclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHRoaXMubmFtZT10aGlzLmxlYWZJbmZvW3RyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHldXHJcbiAgICBlbHNlIHRoaXMubmFtZT10aGlzLmxlYWZJbmZvW1wiJGR0SWRcIl1cclxuXHJcbiAgICB0aGlzLmNyZWF0ZUxlYWZOb2RlRE9NKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5kZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlKClcclxuICAgIHZhciBnTm9kZSA9IHRoaXMucGFyZW50R3JvdXBOb2RlXHJcbiAgICBjb25zdCBpbmRleCA9IGdOb2RlLmNoaWxkTGVhZk5vZGVzLmluZGV4T2YodGhpcyk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkgZ05vZGUuY2hpbGRMZWFmTm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIGdOb2RlLnJlZnJlc2hOYW1lKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5jbGlja1NlbGY9ZnVuY3Rpb24obW91c2VDbGlja0RldGFpbCl7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZT10aGlzO1xyXG4gICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5zZWxlY3RMZWFmTm9kZSh0aGlzLG1vdXNlQ2xpY2tEZXRhaWwpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmNyZWF0ZUxlYWZOb2RlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXdoaXRlXCIgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO3RleHQtYWxpZ246bGVmdDt3aWR0aDo5OCVcIj48L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5yZWRyYXdMYWJlbCgpXHJcbiAgICB2YXIgY2xpY2tGPShlKT0+e1xyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgdmFyIGNsaWNrRGV0YWlsPWUuZGV0YWlsXHJcbiAgICAgICAgaWYgKGUuY3RybEtleSkge1xyXG4gICAgICAgICAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubm9NdWx0aXBsZVNlbGVjdEFsbG93ZWQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuYXBwZW5kTGVhZk5vZGVUb1NlbGVjdGlvbih0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZT10aGlzO1xyXG4gICAgICAgIH1lbHNlIGlmKGUuc2hpZnRLZXkpe1xyXG4gICAgICAgICAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubm9NdWx0aXBsZVNlbGVjdEFsbG93ZWQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlPT1udWxsKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWxsTGVhZk5vZGVBcnI9dGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5nZXRBbGxMZWFmTm9kZUFycigpXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXgxID0gYWxsTGVhZk5vZGVBcnIuaW5kZXhPZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZSlcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleDIgPSBhbGxMZWFmTm9kZUFyci5pbmRleE9mKHRoaXMpXHJcbiAgICAgICAgICAgICAgICBpZihpbmRleDE9PS0xIHx8IGluZGV4Mj09LTEpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZWN0IGFsbCBsZWFmIGJldHdlZW5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG93ZXJJPSBNYXRoLm1pbihpbmRleDEsaW5kZXgyKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoaWdoZXJJPSBNYXRoLm1heChpbmRleDEsaW5kZXgyKVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtaWRkbGVBcnI9YWxsTGVhZk5vZGVBcnIuc2xpY2UobG93ZXJJLGhpZ2hlckkpICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgbWlkZGxlQXJyLnB1c2goYWxsTGVhZk5vZGVBcnJbaGlnaGVySV0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5hZGROb2RlQXJyYXlUb1NlbGVjdGlvbihtaWRkbGVBcnIpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoY2xpY2tEZXRhaWwpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5ET00ub24oXCJjbGlja1wiLChlKT0+e2NsaWNrRihlKX0pXHJcblxyXG4gICAgdGhpcy5ET00ub24oXCJkYmxjbGlja1wiLChlKT0+e1xyXG4gICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuZGJsQ2xpY2tOb2RlKHRoaXMpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLnJlZHJhd0xhYmVsPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB2YXIgbmFtZURpdj0kKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZy1sZWZ0OjVweDtwYWRkaW5nLXJpZ2h0OjNweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGUnPjwvZGl2PlwiKVxyXG4gICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmMpe1xyXG4gICAgICAgIHZhciBpY29uTGFiZWw9dGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoaWNvbkxhYmVsKVxyXG4gICAgICAgIHZhciByb3dIZWlnaHQ9aWNvbkxhYmVsLmhlaWdodCgpXHJcbiAgICAgICAgbmFtZURpdi5jc3MoXCJsaW5lLWhlaWdodFwiLHJvd0hlaWdodCtcInB4XCIpXHJcbiAgICB9XHJcbiAgICBuYW1lRGl2LnRleHQodGhpcy5uYW1lKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKG5hbWVEaXYpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmhpZ2hsaWdodD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRpbT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlVHJlZTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBtb2RlbEFuYWx5emVyID0gcmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKTtcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudSA9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuXHJcbmZ1bmN0aW9uIHRvcG9sb2d5RE9NKERPTSl7XHJcbiAgICB0aGlzLkRPTT1ET01cclxuICAgIHRoaXMuZGVmYXVsdE5vZGVTaXplPTMwXHJcbiAgICB0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW89e31cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmluaXQ9ZnVuY3Rpb24oKXtcclxuICAgIGN5dG9zY2FwZS53YXJuaW5ncyhmYWxzZSkgIFxyXG4gICAgdGhpcy5jb3JlID0gY3l0b3NjYXBlKHtcclxuICAgICAgICBjb250YWluZXI6ICB0aGlzLkRPTVswXSwgLy8gY29udGFpbmVyIHRvIHJlbmRlciBpblxyXG5cclxuICAgICAgICAvLyBpbml0aWFsIHZpZXdwb3J0IHN0YXRlOlxyXG4gICAgICAgIHpvb206IDEsXHJcbiAgICAgICAgcGFuOiB7IHg6IDAsIHk6IDAgfSxcclxuXHJcbiAgICAgICAgLy8gaW50ZXJhY3Rpb24gb3B0aW9uczpcclxuICAgICAgICBtaW5ab29tOiAwLjEsXHJcbiAgICAgICAgbWF4Wm9vbTogMTAsXHJcbiAgICAgICAgem9vbWluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdXNlclpvb21pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHBhbm5pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHVzZXJQYW5uaW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBib3hTZWxlY3Rpb25FbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHNlbGVjdGlvblR5cGU6ICdzaW5nbGUnLFxyXG4gICAgICAgIHRvdWNoVGFwVGhyZXNob2xkOiA4LFxyXG4gICAgICAgIGRlc2t0b3BUYXBUaHJlc2hvbGQ6IDQsXHJcbiAgICAgICAgYXV0b2xvY2s6IGZhbHNlLFxyXG4gICAgICAgIGF1dG91bmdyYWJpZnk6IGZhbHNlLFxyXG4gICAgICAgIGF1dG91bnNlbGVjdGlmeTogZmFsc2UsXHJcblxyXG4gICAgICAgIC8vIHJlbmRlcmluZyBvcHRpb25zOlxyXG4gICAgICAgIGhlYWRsZXNzOiBmYWxzZSxcclxuICAgICAgICBzdHlsZUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgaGlkZUVkZ2VzT25WaWV3cG9ydDogZmFsc2UsXHJcbiAgICAgICAgdGV4dHVyZU9uVmlld3BvcnQ6IGZhbHNlLFxyXG4gICAgICAgIG1vdGlvbkJsdXI6IGZhbHNlLFxyXG4gICAgICAgIG1vdGlvbkJsdXJPcGFjaXR5OiAwLjIsXHJcbiAgICAgICAgd2hlZWxTZW5zaXRpdml0eTogMC4zLFxyXG4gICAgICAgIHBpeGVsUmF0aW86ICdhdXRvJyxcclxuXHJcbiAgICAgICAgZWxlbWVudHM6IFtdLCAvLyBsaXN0IG9mIGdyYXBoIGVsZW1lbnRzIHRvIHN0YXJ0IHdpdGhcclxuXHJcbiAgICAgICAgc3R5bGU6IFsgLy8gdGhlIHN0eWxlc2hlZXQgZm9yIHRoZSBncmFwaFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJ25vZGUnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIndpZHRoXCI6dGhpcy5kZWZhdWx0Tm9kZVNpemUsXCJoZWlnaHRcIjp0aGlzLmRlZmF1bHROb2RlU2l6ZSxcclxuICAgICAgICAgICAgICAgICAgICAnbGFiZWwnOiAnZGF0YShpZCknLFxyXG4gICAgICAgICAgICAgICAgICAgICdvcGFjaXR5JzowLjksXHJcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6XCIxMnB4XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtZmFtaWx5JzonR2VuZXZhLCBBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmJ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vLCdiYWNrZ3JvdW5kLWltYWdlJzogZnVuY3Rpb24oZWxlKXsgcmV0dXJuIFwiaW1hZ2VzL2NhdC5wbmdcIjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vLCdiYWNrZ3JvdW5kLWZpdCc6J2NvbnRhaW4nIC8vY292ZXJcclxuICAgICAgICAgICAgICAgICAgICAsJ2JhY2tncm91bmQtd2lkdGgnOic3MCUnXHJcbiAgICAgICAgICAgICAgICAgICAgLCdiYWNrZ3JvdW5kLWhlaWdodCc6JzcwJSdcclxuICAgICAgICAgICAgICAgICAgICAvLydiYWNrZ3JvdW5kLWNvbG9yJzogZnVuY3Rpb24oIGVsZSApeyByZXR1cm4gZWxlLmRhdGEoJ2JnJykgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJ2VkZ2UnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOjIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2xpbmUtY29sb3InOiAnIzg4OCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICcjNTU1JyxcclxuICAgICAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LXNoYXBlJzogJ3RyaWFuZ2xlJyxcclxuICAgICAgICAgICAgICAgICAgICAnY3VydmUtc3R5bGUnOiAnYmV6aWVyJyxcclxuICAgICAgICAgICAgICAgICAgICAnYXJyb3ctc2NhbGUnOjAuNlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdlZGdlOnNlbGVjdGVkJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDMsXHJcbiAgICAgICAgICAgICAgICAnbGluZS1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtZmlsbCc6XCJsaW5lYXItZ3JhZGllbnRcIixcclxuICAgICAgICAgICAgICAgICdsaW5lLWdyYWRpZW50LXN0b3AtY29sb3JzJzpbJ2N5YW4nLCAnbWFnZW50YScsICd5ZWxsb3cnXSxcclxuICAgICAgICAgICAgICAgICdsaW5lLWdyYWRpZW50LXN0b3AtcG9zaXRpb25zJzpbJzAlJywnNzAlJywnMTAwJSddXHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdub2RlOnNlbGVjdGVkJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICdib3JkZXItY29sb3InOlwicmVkXCIsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLXdpZHRoJzoyLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtZmlsbCc6J3JhZGlhbC1ncmFkaWVudCcsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1ncmFkaWVudC1zdG9wLWNvbG9ycyc6WydjeWFuJywgJ21hZ2VudGEnLCAneWVsbG93J10sXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1ncmFkaWVudC1zdG9wLXBvc2l0aW9ucyc6WycwJScsJzUwJScsJzYwJSddXHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdub2RlLmhvdmVyJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJsYWNrZW4nOjAuNVxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAse3NlbGVjdG9yOiAnZWRnZS5ob3ZlcicsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOjVcclxuICAgICAgICAgICAgfX1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL2N5dG9zY2FwZSBlZGdlIGVkaXRpbmcgcGx1Zy1pblxyXG4gICAgdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKHtcclxuICAgICAgICB1bmRvYWJsZTogdHJ1ZSxcclxuICAgICAgICBiZW5kUmVtb3ZhbFNlbnNpdGl2aXR5OiAxNixcclxuICAgICAgICBlbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb246IHRydWUsXHJcbiAgICAgICAgc3RpY2t5QW5jaG9yVG9sZXJlbmNlOiAyMCxcclxuICAgICAgICBhbmNob3JTaGFwZVNpemVGYWN0b3I6IDUsXHJcbiAgICAgICAgZW5hYmxlQW5jaG9yU2l6ZU5vdEltcGFjdEJ5Wm9vbTp0cnVlLFxyXG4gICAgICAgIGVuYWJsZVJlbW92ZUFuY2hvck1pZE9mTmVhckxpbmU6ZmFsc2UsXHJcbiAgICAgICAgZW5hYmxlQ3JlYXRlQW5jaG9yT25EcmFnOmZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuICAgIHRoaXMuY29yZS5ib3hTZWxlY3Rpb25FbmFibGVkKHRydWUpXHJcblxyXG5cclxuICAgIHRoaXMuY29yZS5vbigndGFwc2VsZWN0JywgKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KTtcclxuICAgIHRoaXMuY29yZS5vbigndGFwdW5zZWxlY3QnLCAoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pO1xyXG5cclxuICAgIHRoaXMuY29yZS5vbignYm94ZW5kJywoZSk9PnsvL3B1dCBpbnNpZGUgYm94ZW5kIGV2ZW50IHRvIHRyaWdnZXIgb25seSBvbmUgdGltZSwgYW5kIHJlcGxlYXRseSBhZnRlciBlYWNoIGJveCBzZWxlY3RcclxuICAgICAgICB0aGlzLmNvcmUub25lKCdib3hzZWxlY3QnLCgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdjeHR0YXAnLChlKT0+e1xyXG4gICAgICAgIHRoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ21vdXNlb3ZlcicsZT0+e1xyXG5cclxuICAgICAgICB0aGlzLm1vdXNlT3ZlckZ1bmN0aW9uKGUpXHJcbiAgICB9KVxyXG4gICAgdGhpcy5jb3JlLm9uKCdtb3VzZW91dCcsZT0+e1xyXG4gICAgICAgIHRoaXMubW91c2VPdXRGdW5jdGlvbihlKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdGhpcy5jb3JlLm9uKCd6b29tJywoZSk9PntcclxuICAgICAgICB2YXIgZnM9dGhpcy5nZXRGb250U2l6ZUluQ3VycmVudFpvb20oKTtcclxuICAgICAgICB2YXIgZGltZW5zaW9uPXRoaXMuZ2V0Tm9kZVNpemVJbkN1cnJlbnRab29tKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgICAgICAgICAuc2VsZWN0b3IoJ25vZGUnKVxyXG4gICAgICAgICAgICAgICAgLnN0eWxlKHsgJ2ZvbnQtc2l6ZSc6IGZzLCB3aWR0aDpkaW1lbnNpb24gLGhlaWdodDpkaW1lbnNpb24gfSlcclxuICAgICAgICAgICAgICAgIC51cGRhdGUoKVxyXG5cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIHRoaXMubm9kZVNpemVNb2RlbEFkanVzdG1lbnRSYXRpbykge1xyXG4gICAgICAgICAgICB2YXIgbmV3RGltZW5zaW9uPU1hdGguY2VpbCh0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW9bbW9kZWxJRF0qZGltZW5zaW9uKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgICAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicgKyBtb2RlbElEICsgJ1wiXScpXHJcbiAgICAgICAgICAgICAgICAuc3R5bGUoeyB3aWR0aDpuZXdEaW1lbnNpb24gLGhlaWdodDpuZXdEaW1lbnNpb24gfSlcclxuICAgICAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAgICAgICAgIC5zZWxlY3Rvcignbm9kZTpzZWxlY3RlZCcpXHJcbiAgICAgICAgICAgICAgICAuc3R5bGUoeyAnYm9yZGVyLXdpZHRoJzogTWF0aC5jZWlsKGRpbWVuc2lvbi8xNSkgfSlcclxuICAgICAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgdmFyIHRhcGRyYWdIYW5kbGVyPShlKSA9PiB7XHJcbiAgICAgICAgaW5zdGFuY2Uua2VlcEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uRHVyaW5nTW92aW5nKClcclxuICAgICAgICBpZihlLnRhcmdldC5pc05vZGUgJiYgZS50YXJnZXQuaXNOb2RlKCkpIHRoaXMuZHJhZ2dpbmdOb2RlPWUudGFyZ2V0XHJcbiAgICAgICAgdGhpcy5zbWFydFBvc2l0aW9uTm9kZShlLnBvc2l0aW9uKVxyXG4gICAgfVxyXG4gICAgdmFyIHNldE9uZVRpbWVHcmFiID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29yZS5vbmNlKFwiZ3JhYlwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZHJhZ2dpbmdOb2RlcyA9IHRoaXMuY29yZS5jb2xsZWN0aW9uKClcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmlzTm9kZSgpKSBkcmFnZ2luZ05vZGVzLm1lcmdlKGUudGFyZ2V0KVxyXG4gICAgICAgICAgICB2YXIgYXJyID0gdGhpcy5jb3JlLiQoXCI6c2VsZWN0ZWRcIilcclxuICAgICAgICAgICAgYXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZS5pc05vZGUoKSkgZHJhZ2dpbmdOb2Rlcy5tZXJnZShlbGUpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGluc3RhbmNlLnN0b3JlQW5jaG9yc0Fic29sdXRlUG9zaXRpb24oZHJhZ2dpbmdOb2RlcylcclxuICAgICAgICAgICAgdGhpcy5jb3JlLm9uKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyIClcclxuICAgICAgICAgICAgc2V0T25lVGltZUZyZWUoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICB2YXIgc2V0T25lVGltZUZyZWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uY2UoXCJmcmVlXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICAgICAgICAgIGluc3RhbmNlLnJlc2V0QW5jaG9yc0Fic29sdXRlUG9zaXRpb24oKVxyXG4gICAgICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZT1udWxsXHJcbiAgICAgICAgICAgIHNldE9uZVRpbWVHcmFiKClcclxuICAgICAgICAgICAgdGhpcy5jb3JlLnJlbW92ZUxpc3RlbmVyKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBzZXRPbmVUaW1lR3JhYigpXHJcblxyXG4gICAgdmFyIHVyID0gdGhpcy5jb3JlLnVuZG9SZWRvKHtpc0RlYnVnOiBmYWxzZX0pO1xyXG4gICAgdGhpcy51cj11ciAgICBcclxuICAgIHRoaXMuY29yZS50cmlnZ2VyKFwiem9vbVwiKVxyXG4gICAgdGhpcy5zZXRLZXlEb3duRnVuYygpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zbWFydFBvc2l0aW9uTm9kZSA9IGZ1bmN0aW9uIChtb3VzZVBvc2l0aW9uKSB7XHJcbiAgICB2YXIgem9vbUxldmVsPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKCF0aGlzLmRyYWdnaW5nTm9kZSkgcmV0dXJuXHJcbiAgICAvL2NvbXBhcmluZyBub2RlcyBzZXQ6IGl0cyBjb25uZWN0ZnJvbSBub2RlcyBhbmQgdGhlaXIgY29ubmVjdHRvIG5vZGVzLCBpdHMgY29ubmVjdHRvIG5vZGVzIGFuZCB0aGVpciBjb25uZWN0ZnJvbSBub2Rlc1xyXG4gICAgdmFyIGluY29tZXJzPXRoaXMuZHJhZ2dpbmdOb2RlLmluY29tZXJzKClcclxuICAgIHZhciBvdXRlckZyb21JbmNvbT0gaW5jb21lcnMub3V0Z29lcnMoKVxyXG4gICAgdmFyIG91dGVyPXRoaXMuZHJhZ2dpbmdOb2RlLm91dGdvZXJzKClcclxuICAgIHZhciBpbmNvbUZyb21PdXRlcj1vdXRlci5pbmNvbWVycygpXHJcbiAgICB2YXIgbW9uaXRvclNldD1pbmNvbWVycy51bmlvbihvdXRlckZyb21JbmNvbSkudW5pb24ob3V0ZXIpLnVuaW9uKGluY29tRnJvbU91dGVyKS5maWx0ZXIoJ25vZGUnKS51bm1lcmdlKHRoaXMuZHJhZ2dpbmdOb2RlKVxyXG5cclxuICAgIHZhciByZXR1cm5FeHBlY3RlZFBvcz0oZGlmZkFycixwb3NBcnIpPT57XHJcbiAgICAgICAgdmFyIG1pbkRpc3RhbmNlPU1hdGgubWluKC4uLmRpZmZBcnIpXHJcbiAgICAgICAgaWYobWluRGlzdGFuY2Uqem9vbUxldmVsIDwgMTApICByZXR1cm4gcG9zQXJyW2RpZmZBcnIuaW5kZXhPZihtaW5EaXN0YW5jZSldXHJcbiAgICAgICAgZWxzZSByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgeERpZmY9W11cclxuICAgIHZhciB4UG9zPVtdXHJcbiAgICB2YXIgeURpZmY9W11cclxuICAgIHZhciB5UG9zPVtdXHJcbiAgICBtb25pdG9yU2V0LmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICB4RGlmZi5wdXNoKE1hdGguYWJzKGVsZS5wb3NpdGlvbigpLngtbW91c2VQb3NpdGlvbi54KSlcclxuICAgICAgICB4UG9zLnB1c2goZWxlLnBvc2l0aW9uKCkueClcclxuICAgICAgICB5RGlmZi5wdXNoKE1hdGguYWJzKGVsZS5wb3NpdGlvbigpLnktbW91c2VQb3NpdGlvbi55KSlcclxuICAgICAgICB5UG9zLnB1c2goZWxlLnBvc2l0aW9uKCkueSlcclxuICAgIH0pXHJcbiAgICB2YXIgcHJlZlg9cmV0dXJuRXhwZWN0ZWRQb3MoeERpZmYseFBvcylcclxuICAgIHZhciBwcmVmWT1yZXR1cm5FeHBlY3RlZFBvcyh5RGlmZix5UG9zKVxyXG4gICAgaWYocHJlZlghPW51bGwpIHtcclxuICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZS5wb3NpdGlvbigneCcsIHByZWZYKTtcclxuICAgIH1cclxuICAgIGlmKHByZWZZIT1udWxsKSB7XHJcbiAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGUucG9zaXRpb24oJ3knLCBwcmVmWSk7XHJcbiAgICB9XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiLS0tLVwiKVxyXG4gICAgLy9tb25pdG9yU2V0LmZvckVhY2goKGVsZSk9Pntjb25zb2xlLmxvZyhlbGUuaWQoKSl9KVxyXG4gICAgLy9jb25zb2xlLmxvZyhtb25pdG9yU2V0LnNpemUoKSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm1vdXNlT3ZlckZ1bmN0aW9uPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYoIWUudGFyZ2V0LmRhdGEpIHJldHVyblxyXG5cclxuICAgIHZhciBpbmZvPWUudGFyZ2V0LmRhdGEoKS5vcmlnaW5hbEluZm9cclxuICAgIGlmKGluZm89PW51bGwpIHJldHVybjtcclxuICAgIGlmKHRoaXMubGFzdEhvdmVyVGFyZ2V0KSB0aGlzLmxhc3RIb3ZlclRhcmdldC5yZW1vdmVDbGFzcyhcImhvdmVyXCIpXHJcbiAgICB0aGlzLmxhc3RIb3ZlclRhcmdldD1lLnRhcmdldFxyXG4gICAgZS50YXJnZXQuYWRkQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9Ib3ZlcmVkRWxlXCIsIFwiaW5mb1wiOiBbaW5mb10sXCJzY3JlZW5YWVwiOnRoaXMuY29udmVydFBvc2l0aW9uKGUucG9zaXRpb24ueCxlLnBvc2l0aW9uLnkpIH0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jb252ZXJ0UG9zaXRpb249ZnVuY3Rpb24oeCx5KXtcclxuICAgIHZhciB2cEV4dGVudD10aGlzLmNvcmUuZXh0ZW50KClcclxuICAgIHZhciBzY3JlZW5XPXRoaXMuRE9NLndpZHRoKClcclxuICAgIHZhciBzY3JlZW5IPXRoaXMuRE9NLmhlaWdodCgpXHJcbiAgICB2YXIgc2NyZWVuWCA9ICh4LXZwRXh0ZW50LngxKS8odnBFeHRlbnQudykqc2NyZWVuVyArIHRoaXMuRE9NLm9mZnNldCgpLmxlZnRcclxuICAgIHZhciBzY3JlZW5ZPSh5LXZwRXh0ZW50LnkxKS8odnBFeHRlbnQuaCkqc2NyZWVuSCsgdGhpcy5ET00ub2Zmc2V0KCkudG9wXHJcbiAgICByZXR1cm4ge3g6c2NyZWVuWCx5OnNjcmVlbll9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5tb3VzZU91dEZ1bmN0aW9uPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYoIWdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCl7IC8vc2luY2UgZmxvYXRpbmcgd2luZG93IGlzIHVzZWQgZm9yIG1vdXNlIGhvdmVyIGVsZW1lbnQgaW5mbywgc28gaW5mbyBwYW5lbCBuZXZlciBjaGFnbmUgYmVmb3JlLCB0aGF0IGlzIHdoeSB0aGVyZSBpcyBubyBuZWVkIHRvIHJlc3RvcmUgYmFjayB0aGUgaW5mbyBwYW5lbCBpbmZvcm1hdGlvbiBhdCBtb3VzZW91dFxyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnNob3dpbmdDcmVhdGVUd2luTW9kZWxJRCl7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvR3JvdXBOb2RlXCIsIFwiaW5mb1wiOiB7XCJAaWRcIjpnbG9iYWxDYWNoZS5zaG93aW5nQ3JlYXRlVHdpbk1vZGVsSUR9IH0pXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidG9wb2xvZ3lNb3VzZU91dFwifSlcclxuXHJcbiAgICBpZih0aGlzLmxhc3RIb3ZlclRhcmdldCl7XHJcbiAgICAgICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQucmVtb3ZlQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0PW51bGw7XHJcbiAgICB9IFxyXG5cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdEZ1bmN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGFyciA9IHRoaXMuY29yZS4kKFwiOnNlbGVjdGVkXCIpXHJcbiAgICB2YXIgcmUgPSBbXVxyXG4gICAgYXJyLmZvckVhY2goKGVsZSkgPT4geyByZS5wdXNoKGVsZS5kYXRhKCkub3JpZ2luYWxJbmZvKSB9KVxyXG4gICAgZ2xvYmFsQ2FjaGUuc2hvd2luZ0NyZWF0ZVR3aW5Nb2RlbElEPW51bGw7IFxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIsIGluZm86IHJlIH0pXHJcblxyXG4gICAgLy9mb3IgZGVidWdnaW5nIHB1cnBvc2VcclxuICAgIC8vYXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgIC8vICBjb25zb2xlLmxvZyhcIlwiKVxyXG4gICAgLy99KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Rm9udFNpemVJbkN1cnJlbnRab29tPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgY3VyWm9vbT10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZihjdXJab29tPjEpe1xyXG4gICAgICAgIHZhciBtYXhGUz0xMlxyXG4gICAgICAgIHZhciBtaW5GUz01XHJcbiAgICAgICAgdmFyIHJhdGlvPSAobWF4RlMvbWluRlMtMSkvOSooY3VyWm9vbS0xKSsxXHJcbiAgICAgICAgdmFyIGZzPU1hdGguY2VpbChtYXhGUy9yYXRpbylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBtYXhGUz0xMjBcclxuICAgICAgICB2YXIgbWluRlM9MTJcclxuICAgICAgICB2YXIgcmF0aW89IChtYXhGUy9taW5GUy0xKS85KigxL2N1clpvb20tMSkrMVxyXG4gICAgICAgIHZhciBmcz1NYXRoLmNlaWwobWluRlMqcmF0aW8pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZnM7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5nZXROb2RlU2l6ZUluQ3VycmVudFpvb209ZnVuY3Rpb24oKXtcclxuICAgIHZhciBjdXJab29tPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKGN1clpvb20+MSl7Ly9zY2FsZSB1cCBidXQgbm90IHRvbyBtdWNoXHJcbiAgICAgICAgdmFyIHJhdGlvPSAoY3VyWm9vbS0xKSooMi0xKS85KzFcclxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMuZGVmYXVsdE5vZGVTaXplL3JhdGlvKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHJhdGlvPSAoMS9jdXJab29tLTEpKig0LTEpLzkrMVxyXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwodGhpcy5kZWZhdWx0Tm9kZVNpemUqcmF0aW8pXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxBdmFydGE9ZnVuY3Rpb24obW9kZWxJRCxkYXRhVXJsKXtcclxuICAgIHRyeXtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKSBcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2JhY2tncm91bmQtaW1hZ2UnOiBkYXRhVXJsfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbFR3aW5Db2xvcj1mdW5jdGlvbihtb2RlbElELGNvbG9yQ29kZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnYmFja2dyb3VuZC1jb2xvcic6IGNvbG9yQ29kZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsVHdpblNoYXBlPWZ1bmN0aW9uKG1vZGVsSUQsc2hhcGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J3NoYXBlJzogc2hhcGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uPWZ1bmN0aW9uKG1vZGVsSUQsZGltZW5zaW9uUmF0aW8pe1xyXG4gICAgdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvW21vZGVsSURdPXBhcnNlRmxvYXQoZGltZW5zaW9uUmF0aW8pXHJcbiAgICB0aGlzLmNvcmUudHJpZ2dlcihcInpvb21cIilcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcj1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsY29sb3JDb2RlKXtcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnbGluZS1jb2xvcic6IGNvbG9yQ29kZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcFNoYXBlPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxzaGFwZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcignZWRnZVtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2xpbmUtc3R5bGUnOiBzaGFwZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxlZGdlV2lkdGgpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeyd3aWR0aCc6cGFyc2VGbG9hdChlZGdlV2lkdGgpfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlOnNlbGVjdGVkW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnd2lkdGgnOnBhcnNlRmxvYXQoZWRnZVdpZHRoKSsxLCdsaW5lLWNvbG9yJzogJ3JlZCd9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2UuaG92ZXJbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeyd3aWR0aCc6cGFyc2VGbG9hdChlZGdlV2lkdGgpKzJ9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGVsZXRlUmVsYXRpb25zPWZ1bmN0aW9uKHJlbGF0aW9ucyl7XHJcbiAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbltcInNyY0lEXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uSUQ9b25lUmVsYXRpb25bXCJyZWxJRFwiXVxyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJytzcmNJRCsnXCJdJyk7XHJcbiAgICAgICAgdmFyIGVkZ2VzPXRoZU5vZGUuY29ubmVjdGVkRWRnZXMoKS50b0FycmF5KClcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGVkZ2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgYW5FZGdlPWVkZ2VzW2ldXHJcbiAgICAgICAgICAgIGlmKGFuRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdPT1yZWxhdGlvbklEKXtcclxuICAgICAgICAgICAgICAgIGFuRWRnZS5yZW1vdmUoKVxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pICAgXHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGVsZXRlVHdpbnM9ZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHR3aW5JREFyci5mb3JFYWNoKHR3aW5JRD0+e1xyXG4gICAgICAgIHRoaXMuY29yZS4kKCdbaWQgPSBcIicrdHdpbklEKydcIl0nKS5yZW1vdmUoKVxyXG4gICAgfSkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFuaW1hdGVBTm9kZT1mdW5jdGlvbih0d2luKXtcclxuICAgIHZhciBjdXJEaW1lbnNpb249IHR3aW4ud2lkdGgoKVxyXG4gICAgdHdpbi5hbmltYXRlKHtcclxuICAgICAgICBzdHlsZTogeyAnaGVpZ2h0JzogY3VyRGltZW5zaW9uKjIsJ3dpZHRoJzogY3VyRGltZW5zaW9uKjIgfSxcclxuICAgICAgICBkdXJhdGlvbjogMjAwXHJcbiAgICB9KTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICAgICAgdHdpbi5hbmltYXRlKHtcclxuICAgICAgICAgICAgc3R5bGU6IHsgJ2hlaWdodCc6IGN1ckRpbWVuc2lvbiwnd2lkdGgnOiBjdXJEaW1lbnNpb24gfSxcclxuICAgICAgICAgICAgZHVyYXRpb246IDIwMFxyXG4gICAgICAgICAgICAsY29tcGxldGU6KCk9PntcclxuICAgICAgICAgICAgICAgIHR3aW4ucmVtb3ZlU3R5bGUoKSAvL211c3QgcmVtb3ZlIHRoZSBzdHlsZSBhZnRlciBhbmltYXRpb24sIG90aGVyd2lzZSB0aGV5IHdpbGwgaGF2ZSB0aGVpciBvd24gc3R5bGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSwyMDApXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kcmF3VHdpbnM9ZnVuY3Rpb24odHdpbnNEYXRhLGFuaW1hdGlvbil7XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICBmb3IodmFyIGk9MDtpPHR3aW5zRGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb3JpZ2luYWxJbmZvPXR3aW5zRGF0YVtpXTtcclxuICAgICAgICB2YXIgbmV3Tm9kZT17ZGF0YTp7fSxncm91cDpcIm5vZGVzXCJ9XHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wib3JpZ2luYWxJbmZvXCJdPSBvcmlnaW5hbEluZm87XHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wiaWRcIl09b3JpZ2luYWxJbmZvWyckZHRJZCddXHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9b3JpZ2luYWxJbmZvWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJtb2RlbElEXCJdPW1vZGVsSURcclxuICAgICAgICBhcnIucHVzaChuZXdOb2RlKVxyXG4gICAgfVxyXG4gICAgdmFyIGVsZXMgPSB0aGlzLmNvcmUuYWRkKGFycilcclxuICAgIGlmKGVsZXMuc2l6ZSgpPT0wKSByZXR1cm4gZWxlc1xyXG4gICAgdGhpcy5ub1Bvc2l0aW9uX2dyaWQoZWxlcylcclxuICAgIGlmKGFuaW1hdGlvbil7XHJcbiAgICAgICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2lmIHRoZXJlIGlzIGN1cnJlbnRseSBhIGxheW91dCB0aGVyZSwgYXBwbHkgaXRcclxuICAgIHZhciBsYXlvdXROYW1lPWdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lXHJcbiAgICBpZihsYXlvdXROYW1lIT1udWxsKXtcclxuICAgICAgICB2YXIgbGF5b3V0RGV0YWlsPSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICAgICAgaWYobGF5b3V0RGV0YWlsKSB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obGF5b3V0RGV0YWlsLHRoaXMuZ2V0Q3VycmVudExheW91dERldGFpbCgpKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVzXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kcmF3UmVsYXRpb25zPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgdmFyIHJlbGF0aW9uSW5mb0Fycj1bXVxyXG4gICAgZm9yKHZhciBpPTA7aTxyZWxhdGlvbnNEYXRhLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm89cmVsYXRpb25zRGF0YVtpXTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgdGhlSUQ9b3JpZ2luYWxJbmZvWyckcmVsYXRpb25zaGlwTmFtZSddK1wiX1wiK29yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcElkJ11cclxuICAgICAgICB2YXIgYVJlbGF0aW9uPXtkYXRhOnt9LGdyb3VwOlwiZWRnZXNcIn1cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcIm9yaWdpbmFsSW5mb1wiXT1vcmlnaW5hbEluZm9cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcImlkXCJdPXRoZUlEXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl09b3JpZ2luYWxJbmZvWyckc291cmNlSWQnXVxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1widGFyZ2V0XCJdPW9yaWdpbmFsSW5mb1snJHRhcmdldElkJ11cclxuICAgICAgICBpZih0aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXSkubGVuZ3RoPT0wIHx8IHRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1widGFyZ2V0XCJdKS5sZW5ndGg9PTApIGNvbnRpbnVlXHJcbiAgICAgICAgdmFyIHNvdXJjZU5vZGU9dGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl0pXHJcbiAgICAgICAgdmFyIHNvdXJjZU1vZGVsPXNvdXJjZU5vZGVbMF0uZGF0YShcIm9yaWdpbmFsSW5mb1wiKVsnJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9hZGQgYWRkaXRpb25hbCBzb3VyY2Ugbm9kZSBpbmZvcm1hdGlvbiB0byB0aGUgb3JpZ2luYWwgcmVsYXRpb25zaGlwIGluZm9ybWF0aW9uXHJcbiAgICAgICAgb3JpZ2luYWxJbmZvWydzb3VyY2VNb2RlbCddPXNvdXJjZU1vZGVsXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VNb2RlbFwiXT1zb3VyY2VNb2RlbFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wicmVsYXRpb25zaGlwTmFtZVwiXT1vcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBOYW1lJ11cclxuXHJcbiAgICAgICAgdmFyIGV4aXN0RWRnZT10aGlzLmNvcmUuJCgnZWRnZVtpZCA9IFwiJyt0aGVJRCsnXCJdJylcclxuICAgICAgICBpZihleGlzdEVkZ2Uuc2l6ZSgpPjApIHtcclxuICAgICAgICAgICAgZXhpc3RFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIixvcmlnaW5hbEluZm8pXHJcbiAgICAgICAgICAgIGNvbnRpbnVlOyAgLy9ubyBuZWVkIHRvIGRyYXcgaXRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbGF0aW9uSW5mb0Fyci5wdXNoKGFSZWxhdGlvbilcclxuICAgIH1cclxuICAgIGlmKHJlbGF0aW9uSW5mb0Fyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG5cclxuICAgIHZhciBlZGdlcz10aGlzLmNvcmUuYWRkKHJlbGF0aW9uSW5mb0FycilcclxuICAgIHJldHVybiBlZGdlc1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdz1mdW5jdGlvbigpe1xyXG4gICAgLy9jaGVjayB0aGUgc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzIGFnYWluIGFuZCBtYXliZSBzb21lIG9mIHRoZW0gY2FuIGJlIGRyYXduIG5vdyBzaW5jZSB0YXJnZXROb2RlIGlzIGF2YWlsYWJsZVxyXG4gICAgdmFyIHN0b3JlZFJlbGF0aW9uQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHN0b3JlZFJlbGF0aW9uQXJyPXN0b3JlZFJlbGF0aW9uQXJyLmNvbmNhdChnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXSlcclxuICAgIH1cclxuICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhzdG9yZWRSZWxhdGlvbkFycilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdUd2luc0FuZFJlbGF0aW9ucz1mdW5jdGlvbihkYXRhKXtcclxuICAgIHZhciB0d2luc0FuZFJlbGF0aW9ucz1kYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnNcclxuXHJcbiAgICAvL2RyYXcgdGhvc2UgbmV3IHR3aW5zIGZpcnN0XHJcbiAgICB0d2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciB0d2luSW5mb0Fycj1bXVxyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKSB0d2luSW5mb0Fyci5wdXNoKG9uZVNldC5jaGlsZFR3aW5zW2luZF0pXHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnModHdpbkluZm9BcnIsXCJhbmltYXRpb25cIilcclxuICAgIH0pXHJcblxyXG4gICAgLy9kcmF3IHRob3NlIGtub3duIHR3aW5zIGZyb20gdGhlIHJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0d2luc0luZm89e31cclxuICAgIHR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0luZm89b25lU2V0W1wicmVsYXRpb25zaGlwc1wiXVxyXG4gICAgICAgIHJlbGF0aW9uc0luZm8uZm9yRWFjaCgob25lUmVsYXRpb24pPT57XHJcbiAgICAgICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bc3JjSURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1t0YXJnZXRJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0gICAgXHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgdG1wQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiB0d2luc0luZm8pIHRtcEFyci5wdXNoKHR3aW5zSW5mb1t0d2luSURdKVxyXG4gICAgdGhpcy5kcmF3VHdpbnModG1wQXJyKVxyXG5cclxuICAgIC8vdGhlbiBjaGVjayBhbGwgc3RvcmVkIHJlbGF0aW9uc2hpcHMgYW5kIGRyYXcgaWYgaXQgY2FuIGJlIGRyYXduXHJcbiAgICB0aGlzLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXcoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlWaXN1YWxEZWZpbml0aW9uPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVxyXG4gICAgaWYodmlzdWFsSnNvbj09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHZpc3VhbEpzb24pe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIHRoaXMudXBkYXRlTW9kZWxUd2luU2hhcGUobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKSB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbykgdGhpcy51cGRhdGVNb2RlbFR3aW5EaW1lbnNpb24obW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0ucmVscyl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgcmVsYXRpb25zaGlwTmFtZSBpbiB2aXN1YWxKc29uW21vZGVsSURdLnJlbHMpe1xyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uY29sb3Ipe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmNvbG9yKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uc2hhcGUpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwU2hhcGUobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLnNoYXBlKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uZWRnZVdpZHRoKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoKG1vZGVsSUQscmVsYXRpb25zaGlwTmFtZSx2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5lZGdlV2lkdGgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlXCIpe1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnJlbW92ZSgpXHJcbiAgICAgICAgdGhpcy5hcHBseVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInJlcGxhY2VBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkucmVtb3ZlKClcclxuICAgICAgICB2YXIgZWxlcz0gdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhcHBlbmRBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdmFyIGVsZXM9IHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQuaW5mbyxcImFuaW1hdGVcIilcclxuICAgICAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbiAgICAgICAgdGhpcy5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3KClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3QWxsUmVsYXRpb25zXCIpe1xyXG4gICAgICAgIHZhciBlZGdlcz0gdGhpcy5kcmF3UmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICBpZihlZGdlcyE9bnVsbCkge1xyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT09bnVsbCkgIHRoaXMubm9Qb3NpdGlvbl9jb3NlKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpblwiKSB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHRoaXMuY29yZS5lZGdlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmRyYXdUd2lucyhbbXNnUGF5bG9hZC50d2luSW5mb10sXCJhbmltYXRpb25cIilcclxuICAgICAgICB2YXIgbm9kZUluZm89IG1zZ1BheWxvYWQudHdpbkluZm87XHJcbiAgICAgICAgdmFyIG5vZGVOYW1lPSBub2RlSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgdmFyIHRvcG9Ob2RlPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrbm9kZU5hbWUpXHJcbiAgICAgICAgaWYodG9wb05vZGUpe1xyXG4gICAgICAgICAgICB2YXIgcG9zaXRpb249dG9wb05vZGUucmVuZGVyZWRQb3NpdGlvbigpXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5wYW5CeSh7eDotcG9zaXRpb24ueCsyMDAseTotcG9zaXRpb24ueSsyMDB9KVxyXG4gICAgICAgICAgICB0b3BvTm9kZS5zZWxlY3QoKVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpbnNcIikge1xyXG4gICAgICAgIHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQudHdpbnNJbmZvLFwiYW5pbWF0aW9uXCIpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIpIHRoaXMuZHJhd1R3aW5zQW5kUmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiKXsgLy9mcm9tIHNlbGVjdGluZyB0d2lucyBpbiB0aGUgdHdpbnRyZWVcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdGhpcy5jb3JlLmVkZ2VzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHZhciBhcnI9bXNnUGF5bG9hZC5pbmZvO1xyXG4gICAgICAgIHZhciBtb3VzZUNsaWNrRGV0YWlsPW1zZ1BheWxvYWQubW91c2VDbGlja0RldGFpbDtcclxuICAgICAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICAgICAgdmFyIGFUd2luPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrZWxlbWVudFsnJGR0SWQnXSlcclxuICAgICAgICAgICAgYVR3aW4uc2VsZWN0KClcclxuICAgICAgICAgICAgaWYobW91c2VDbGlja0RldGFpbCE9MikgdGhpcy5hbmltYXRlQU5vZGUoYVR3aW4pIC8vaWdub3JlIGRvdWJsZSBjbGljayBzZWNvbmQgY2xpY2tcclxuICAgICAgICB9KTtcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJQYW5Ub05vZGVcIil7XHJcbiAgICAgICAgdmFyIG5vZGVJbmZvPSBtc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIHRvcG9Ob2RlPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrbm9kZUluZm9bXCIkZHRJZFwiXSlcclxuICAgICAgICBpZih0b3BvTm9kZSl7XHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5jZW50ZXIodG9wb05vZGUpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIil7XHJcbiAgICAgICAgaWYobXNnUGF5bG9hZC5zcmNNb2RlbElEKXtcclxuICAgICAgICAgICAgaWYobXNnUGF5bG9hZC5jb2xvcikgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcihtc2dQYXlsb2FkLnNyY01vZGVsSUQsbXNnUGF5bG9hZC5yZWxhdGlvbnNoaXBOYW1lLG1zZ1BheWxvYWQuY29sb3IpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5zaGFwZSkgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZShtc2dQYXlsb2FkLnNyY01vZGVsSUQsbXNnUGF5bG9hZC5yZWxhdGlvbnNoaXBOYW1lLG1zZ1BheWxvYWQuc2hhcGUpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5lZGdlV2lkdGgpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwV2lkdGgobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLmVkZ2VXaWR0aClcclxuICAgICAgICB9IFxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIGlmKG1zZ1BheWxvYWQuY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuY29sb3IpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5zaGFwZSkgdGhpcy51cGRhdGVNb2RlbFR3aW5TaGFwZShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5zaGFwZSlcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLmF2YXJ0YSkgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5hdmFydGEpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5ub0F2YXJ0YSkgIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobXNnUGF5bG9hZC5tb2RlbElELG51bGwpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5kaW1lbnNpb25SYXRpbykgIHRoaXMudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIH0gXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidHdpbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlVHdpbnMobXNnUGF5bG9hZC50d2luSURBcnIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyZWxhdGlvbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlUmVsYXRpb25zKG1zZ1BheWxvYWQucmVsYXRpb25zKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiY29ubmVjdFRvXCIpeyB0aGlzLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUoXCJjb25uZWN0VG9cIikgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJjb25uZWN0RnJvbVwiKXsgdGhpcy5zdGFydFRhcmdldE5vZGVNb2RlKFwiY29ubmVjdEZyb21cIikgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGRTZWxlY3RPdXRib3VuZFwiKXsgdGhpcy5zZWxlY3RPdXRib3VuZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGRTZWxlY3RJbmJvdW5kXCIpeyB0aGlzLnNlbGVjdEluYm91bmROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiaGlkZVNlbGVjdGVkTm9kZXNcIil7IHRoaXMuaGlkZVNlbGVjdGVkTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkNPU0VTZWxlY3RlZE5vZGVzXCIpeyB0aGlzLkNPU0VTZWxlY3RlZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzYXZlTGF5b3V0XCIpeyB0aGlzLnNhdmVMYXlvdXQobXNnUGF5bG9hZC5sYXlvdXROYW1lLG1zZ1BheWxvYWQuYWR0TmFtZSkgICB9XHJcbiAgICBlbHNlIGlmIChtc2dQYXlsb2FkLm1lc3NhZ2UgPT0gXCJsYXlvdXRDaGFuZ2VcIikge1xyXG4gICAgICAgIHZhciBsYXlvdXROYW1lID0gZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWVcclxuICAgICAgICBpZihsYXlvdXROYW1lPT1cIltOQV1cIil7XHJcbiAgICAgICAgICAgIC8vc2VsZWN0IGFsbCB2aXNpYmxlIG5vZGVzIGFuZCBkbyBhIENPU0UgbGF5b3V0LCBjbGVhbiBhbGwgYmVuZCBlZGdlIGxpbmUgYXMgd2VsbFxyXG4gICAgICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJylcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJylcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiLFtdKVxyXG4gICAgICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiLFtdKVxyXG4gICAgICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2UoKVxyXG4gICAgICAgIH1lbHNlIGlmIChsYXlvdXROYW1lICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdmFyIGxheW91dERldGFpbCA9IGdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgICAgICAgICAgaWYgKGxheW91dERldGFpbCkgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKGxheW91dERldGFpbCwgdGhpcy5nZXRDdXJyZW50TGF5b3V0RGV0YWlsKCkpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFsaWduU2VsZWN0ZWROb2RlXCIpIHRoaXMuYWxpZ25TZWxlY3RlZE5vZGVzKG1zZ1BheWxvYWQuZGlyZWN0aW9uKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZGlzdHJpYnV0ZVNlbGVjdGVkTm9kZVwiKSB0aGlzLmRpc3RyaWJ1dGVTZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyb3RhdGVTZWxlY3RlZE5vZGVcIikgdGhpcy5yb3RhdGVTZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJtaXJyb3JTZWxlY3RlZE5vZGVcIikgdGhpcy5taXJyb3JTZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkaW1lbnNpb25TZWxlY3RlZE5vZGVcIikgdGhpcy5kaW1lbnNpb25TZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kaW1lbnNpb25TZWxlY3RlZE5vZGUgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgcmF0aW89MS4yXHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwyKSByZXR1cm47XHJcbiAgICB2YXIgYm91bmRhcnk9IHNlbGVjdGVkTm9kZXMuYm91bmRpbmdCb3goe2luY2x1ZGVMYWJlbHMgOmZhbHNlLGluY2x1ZGVPdmVybGF5cyA6ZmFsc2UgfSlcclxuICAgIHZhciBjZW50ZXJYPWJvdW5kYXJ5W1wieDFcIl0rYm91bmRhcnlbXCJ3XCJdLzJcclxuICAgIHZhciBjZW50ZXJZPWJvdW5kYXJ5W1wieTFcIl0rYm91bmRhcnlbXCJoXCJdLzJcclxuICAgIFxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIG5ld0xheW91dD17fVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIHZhciB4b2ZmY2VudGVyPWN1clBvc1tcInhcIl0tY2VudGVyWFxyXG4gICAgICAgIHZhciB5b2ZmY2VudGVyPWN1clBvc1tcInlcIl0tY2VudGVyWVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJleHBhbmRcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgreG9mZmNlbnRlcipyYXRpbyxjZW50ZXJZK3lvZmZjZW50ZXIqcmF0aW9dXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwiY29tcHJlc3NcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgreG9mZmNlbnRlci9yYXRpbyxjZW50ZXJZK3lvZmZjZW50ZXIvcmF0aW9dXHJcbiAgICB9KVxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKG5ld0xheW91dCxvbGRMYXlvdXQsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5taXJyb3JTZWxlY3RlZE5vZGUgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwyKSByZXR1cm47XHJcbiAgICB2YXIgYm91bmRhcnk9IHNlbGVjdGVkTm9kZXMuYm91bmRpbmdCb3goe2luY2x1ZGVMYWJlbHMgOmZhbHNlLGluY2x1ZGVPdmVybGF5cyA6ZmFsc2UgfSlcclxuICAgIHZhciBjZW50ZXJYPWJvdW5kYXJ5W1wieDFcIl0rYm91bmRhcnlbXCJ3XCJdLzJcclxuICAgIHZhciBjZW50ZXJZPWJvdW5kYXJ5W1wieTFcIl0rYm91bmRhcnlbXCJoXCJdLzJcclxuICAgIFxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIG5ld0xheW91dD17fVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIHZhciB4b2ZmY2VudGVyPWN1clBvc1tcInhcIl0tY2VudGVyWFxyXG4gICAgICAgIHZhciB5b2ZmY2VudGVyPWN1clBvc1tcInlcIl0tY2VudGVyWVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJob3Jpem9udGFsXCIpIG5ld0xheW91dFtub2RlSURdPVtjZW50ZXJYLXhvZmZjZW50ZXIsY3VyUG9zWyd5J11dXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwidmVydGljYWxcIikgbmV3TGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGNlbnRlclkteW9mZmNlbnRlcl1cclxuICAgIH0pXHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJvdGF0ZVNlbGVjdGVkTm9kZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIGlmKHNlbGVjdGVkTm9kZXMuc2l6ZSgpPDIpIHJldHVybjtcclxuICAgIHZhciBib3VuZGFyeT0gc2VsZWN0ZWROb2Rlcy5ib3VuZGluZ0JveCh7aW5jbHVkZUxhYmVscyA6ZmFsc2UsaW5jbHVkZU92ZXJsYXlzIDpmYWxzZSB9KVxyXG4gICAgdmFyIGNlbnRlclg9Ym91bmRhcnlbXCJ4MVwiXStib3VuZGFyeVtcIndcIl0vMlxyXG4gICAgdmFyIGNlbnRlclk9Ym91bmRhcnlbXCJ5MVwiXStib3VuZGFyeVtcImhcIl0vMlxyXG4gICAgXHJcbiAgICB2YXIgb2xkTGF5b3V0PXt9XHJcbiAgICB2YXIgbmV3TGF5b3V0PXt9XHJcbiAgICBzZWxlY3RlZE5vZGVzLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBjdXJQb3M9b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgdmFyIG5vZGVJRD1vbmVOb2RlLmlkKClcclxuICAgICAgICBvbGRMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgdmFyIHhvZmZjZW50ZXI9Y3VyUG9zW1wieFwiXS1jZW50ZXJYXHJcbiAgICAgICAgdmFyIHlvZmZjZW50ZXI9Y3VyUG9zW1wieVwiXS1jZW50ZXJZXHJcbiAgICAgICAgaWYoZGlyZWN0aW9uPT1cImxlZnRcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgreW9mZmNlbnRlcixjZW50ZXJZLXhvZmZjZW50ZXJdXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwicmlnaHRcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgteW9mZmNlbnRlcixjZW50ZXJZK3hvZmZjZW50ZXJdXHJcbiAgICB9KVxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKG5ld0xheW91dCxvbGRMYXlvdXQsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kaXN0cmlidXRlU2VsZWN0ZWROb2RlID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgaWYoc2VsZWN0ZWROb2Rlcy5zaXplKCk8MykgcmV0dXJuO1xyXG4gICAgdmFyIG51bUFycj1bXVxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIGxheW91dEZvclNvcnQ9W11cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSBudW1BcnIucHVzaChwb3NpdGlvblsneSddKVxyXG4gICAgICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgbnVtQXJyLnB1c2gocG9zaXRpb25bJ3gnXSlcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIGxheW91dEZvclNvcnQucHVzaCh7aWQ6bm9kZUlELHg6Y3VyUG9zWyd4J10seTpjdXJQb3NbJ3knXX0pXHJcbiAgICB9KVxyXG5cclxuICAgIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSBsYXlvdXRGb3JTb3J0LnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtyZXR1cm4gYVtcInlcIl0tYltcInlcIl0gfSlcclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgbGF5b3V0Rm9yU29ydC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7cmV0dXJuIGFbXCJ4XCJdLWJbXCJ4XCJdIH0pXHJcbiAgICBcclxuICAgIHZhciBtaW5WPU1hdGgubWluKC4uLm51bUFycilcclxuICAgIHZhciBtYXhWPU1hdGgubWF4KC4uLm51bUFycilcclxuICAgIGlmKG1pblY9PW1heFYpIHJldHVybjtcclxuICAgIHZhciBnYXA9KG1heFYtbWluVikvKHNlbGVjdGVkTm9kZXMuc2l6ZSgpLTEpXHJcbiAgICB2YXIgbmV3TGF5b3V0PXt9XHJcbiAgICBpZihkaXJlY3Rpb249PVwidmVydGljYWxcIikgdmFyIGN1clY9bGF5b3V0Rm9yU29ydFswXVtcInlcIl1cclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgY3VyVj1sYXlvdXRGb3JTb3J0WzBdW1wieFwiXVxyXG4gICAgZm9yKHZhciBpPTA7aTxsYXlvdXRGb3JTb3J0Lmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvbmVOb2RlSW5mbz1sYXlvdXRGb3JTb3J0W2ldXHJcbiAgICAgICAgaWYoaT09MHx8IGk9PWxheW91dEZvclNvcnQubGVuZ3RoLTEpe1xyXG4gICAgICAgICAgICBuZXdMYXlvdXRbb25lTm9kZUluZm8uaWRdPVtvbmVOb2RlSW5mb1sneCddLG9uZU5vZGVJbmZvWyd5J11dXHJcbiAgICAgICAgICAgIGNvbnRpbnVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN1clYrPWdhcDtcclxuICAgICAgICBpZihkaXJlY3Rpb249PVwidmVydGljYWxcIikgbmV3TGF5b3V0W29uZU5vZGVJbmZvLmlkXT1bb25lTm9kZUluZm9bJ3gnXSxjdXJWXVxyXG4gICAgICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgbmV3TGF5b3V0W29uZU5vZGVJbmZvLmlkXT1bY3VyVixvbmVOb2RlSW5mb1sneSddXVxyXG4gICAgfVxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKG5ld0xheW91dCxvbGRMYXlvdXQsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hbGlnblNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwyKSByZXR1cm47XHJcbiAgICB2YXIgbnVtQXJyPVtdXHJcbiAgICBzZWxlY3RlZE5vZGVzLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBwb3NpdGlvbj1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICBpZihkaXJlY3Rpb249PVwidG9wXCJ8fCBkaXJlY3Rpb249PVwiYm90dG9tXCIpIG51bUFyci5wdXNoKHBvc2l0aW9uWyd5J10pXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwibGVmdFwifHwgZGlyZWN0aW9uPT1cInJpZ2h0XCIpIG51bUFyci5wdXNoKHBvc2l0aW9uWyd4J10pXHJcbiAgICB9KVxyXG4gICAgdmFyIHRhcmdldFg9bnVsbFxyXG4gICAgdmFyIHRhcmdldFk9bnVsbFxyXG4gICAgaWYoZGlyZWN0aW9uPT1cInRvcFwiKSB2YXIgdGFyZ2V0WT0gTWF0aC5taW4oLi4ubnVtQXJyKVxyXG4gICAgZWxzZSBpZihkaXJlY3Rpb249PVwiYm90dG9tXCIpIHZhciB0YXJnZXRZPSBNYXRoLm1heCguLi5udW1BcnIpXHJcbiAgICBpZihkaXJlY3Rpb249PVwibGVmdFwiKSB2YXIgdGFyZ2V0WD0gTWF0aC5taW4oLi4ubnVtQXJyKVxyXG4gICAgZWxzZSBpZihkaXJlY3Rpb249PVwicmlnaHRcIikgdmFyIHRhcmdldFg9IE1hdGgubWF4KC4uLm51bUFycilcclxuICAgIFxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIG5ld0xheW91dD17fVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIG5ld0xheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjdXJQb3NbJ3knXV1cclxuICAgICAgICBpZih0YXJnZXRYIT1udWxsKSBuZXdMYXlvdXRbbm9kZUlEXVswXT10YXJnZXRYXHJcbiAgICAgICAgaWYodGFyZ2V0WSE9bnVsbCkgbmV3TGF5b3V0W25vZGVJRF1bMV09dGFyZ2V0WVxyXG4gICAgfSlcclxuICAgIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhuZXdMYXlvdXQsb2xkTGF5b3V0LFwib25seUFkanVzdE5vZGVQb3NpdGlvblwiKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucmVkcmF3QmFzZWRPbkxheW91dERldGFpbCA9IGZ1bmN0aW9uIChsYXlvdXREZXRhaWwsb25seUFkanVzdE5vZGVQb3NpdGlvbikge1xyXG4gICAgLy9yZW1vdmUgYWxsIGJlbmRpbmcgZWRnZSBcclxuICAgIGlmKCFvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uKXtcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICAgICAgb25lRWRnZS5yZW1vdmVDbGFzcygnZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHMnKVxyXG4gICAgICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpXHJcbiAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiLFtdKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiLFtdKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIixbXSlcclxuICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIGlmKGxheW91dERldGFpbD09bnVsbCkgcmV0dXJuO1xyXG4gICAgXHJcbiAgICB2YXIgc3RvcmVkUG9zaXRpb25zPXt9XHJcbiAgICBmb3IodmFyIGluZCBpbiBsYXlvdXREZXRhaWwpe1xyXG4gICAgICAgIGlmKGluZCA9PSBcImVkZ2VzXCIpIGNvbnRpbnVlXHJcbiAgICAgICAgc3RvcmVkUG9zaXRpb25zW2luZF09e1xyXG4gICAgICAgICAgICB4OmxheW91dERldGFpbFtpbmRdWzBdXHJcbiAgICAgICAgICAgICx5OmxheW91dERldGFpbFtpbmRdWzFdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIG5ld0xheW91dD10aGlzLmNvcmUubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAncHJlc2V0JyxcclxuICAgICAgICBwb3NpdGlvbnM6c3RvcmVkUG9zaXRpb25zLFxyXG4gICAgICAgIGZpdDpmYWxzZSxcclxuICAgICAgICBhbmltYXRlOiB0cnVlLFxyXG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAzMDAsXHJcbiAgICB9KVxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcblxyXG4gICAgLy9yZXN0b3JlIGVkZ2VzIGJlbmRpbmcgb3IgY29udHJvbCBwb2ludHNcclxuICAgIHZhciBlZGdlUG9pbnRzRGljdD1sYXlvdXREZXRhaWxbXCJlZGdlc1wiXVxyXG4gICAgaWYoZWRnZVBvaW50c0RpY3Q9PW51bGwpcmV0dXJuO1xyXG4gICAgZm9yKHZhciBzcmNJRCBpbiBlZGdlUG9pbnRzRGljdCl7XHJcbiAgICAgICAgZm9yKHZhciByZWxhdGlvbnNoaXBJRCBpbiBlZGdlUG9pbnRzRGljdFtzcmNJRF0pe1xyXG4gICAgICAgICAgICB2YXIgb2JqPWVkZ2VQb2ludHNEaWN0W3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1cclxuICAgICAgICAgICAgdGhpcy5hcHBseUVkZ2VCZW5kY29udHJvbFBvaW50cyhzcmNJRCxyZWxhdGlvbnNoaXBJRCxvYmpbXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIl1cclxuICAgICAgICAgICAgLG9ialtcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCJdLG9ialtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiXSxvYmpbXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiXSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseU5ld0xheW91dFdpdGhVbmRvID0gZnVuY3Rpb24gKG5ld0xheW91dERldGFpbCxvbGRMYXlvdXREZXRhaWwsb25seUFkanVzdE5vZGVQb3NpdGlvbikge1xyXG4gICAgLy9zdG9yZSBjdXJyZW50IGxheW91dCBmb3IgdW5kbyBvcGVyYXRpb25cclxuICAgIHRoaXMudXIuYWN0aW9uKCBcImNoYW5nZUxheW91dFwiXHJcbiAgICAgICAgLCAoYXJnKT0+e1xyXG4gICAgICAgICAgICB0aGlzLnJlZHJhd0Jhc2VkT25MYXlvdXREZXRhaWwoYXJnLm5ld0xheW91dERldGFpbCxhcmcub25seUFkanVzdE5vZGVQb3NpdGlvbikgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gYXJnXHJcbiAgICAgICAgfVxyXG4gICAgICAgICwgKGFyZyk9PntcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXdCYXNlZE9uTGF5b3V0RGV0YWlsKGFyZy5vbGRMYXlvdXREZXRhaWwsYXJnLm9ubHlBZGp1c3ROb2RlUG9zaXRpb24pXHJcbiAgICAgICAgICAgIHJldHVybiBhcmdcclxuICAgICAgICB9XHJcbiAgICApXHJcbiAgICB0aGlzLnVyLmRvKFwiY2hhbmdlTGF5b3V0XCJcclxuICAgICAgICAsIHsgZmlyc3RUaW1lOiB0cnVlLCBcIm5ld0xheW91dERldGFpbFwiOiBuZXdMYXlvdXREZXRhaWwsIFwib2xkTGF5b3V0RGV0YWlsXCI6IG9sZExheW91dERldGFpbCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIjpvbmx5QWRqdXN0Tm9kZVBvc2l0aW9ufVxyXG4gICAgKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlFZGdlQmVuZGNvbnRyb2xQb2ludHMgPSBmdW5jdGlvbiAoc3JjSUQscmVsYXRpb25zaGlwSURcclxuICAgICxjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMsY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMsY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzLGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzKSB7XHJcbiAgICAgICAgdmFyIHRoZU5vZGU9dGhpcy5jb3JlLmZpbHRlcignW2lkID0gXCInK3NyY0lEKydcIl0nKTtcclxuICAgICAgICBpZih0aGVOb2RlLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBlZGdlcz10aGVOb2RlLmNvbm5lY3RlZEVkZ2VzKCkudG9BcnJheSgpXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxlZGdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIGFuRWRnZT1lZGdlc1tpXVxyXG4gICAgICAgICAgICBpZihhbkVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXT09cmVsYXRpb25zaGlwSUQpe1xyXG4gICAgICAgICAgICAgICAgaWYoY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKXtcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiLGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCIsY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmFkZENsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKXtcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiLGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCIsY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmFkZENsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG59XHJcblxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5nZXRDdXJyZW50TGF5b3V0RGV0YWlsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGxheW91dERpY3Q9e1wiZWRnZXNcIjp7fX1cclxuICAgIGlmKHRoaXMuY29yZS5ub2RlcygpLnNpemUoKT09MCkgcmV0dXJuIGxheW91dERpY3Q7XHJcbiAgICAvL3N0b3JlIG5vZGVzIHBvc2l0aW9uXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgcG9zaXRpb249b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgbGF5b3V0RGljdFtvbmVOb2RlLmlkKCldPVt0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneCddKSx0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneSddKV1cclxuICAgIH0pXHJcblxyXG4gICAgLy9zdG9yZSBhbnkgZWRnZSBiZW5kaW5nIHBvaW50cyBvciBjb250cm9saW5nIHBvaW50c1xyXG4gICAgdGhpcy5jb3JlLmVkZ2VzKCkuZm9yRWFjaChvbmVFZGdlPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZUVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRD1vbmVFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzPW9uZUVkZ2UuZGF0YSgnY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzJylcclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXM9b25lRWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzPW9uZUVkZ2UuZGF0YSgnY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMnKVxyXG4gICAgICAgIGlmKCFjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMgJiYgIWN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cykgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZihsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT09bnVsbClsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT17fVxyXG4gICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXT17fVxyXG4gICAgICAgIGlmKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIHJldHVybiBsYXlvdXREaWN0O1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2F2ZUxheW91dCA9IGFzeW5jIGZ1bmN0aW9uIChsYXlvdXROYW1lLGFkdE5hbWUpIHtcclxuICAgIHZhciBsYXlvdXREaWN0PWdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgIGlmKCFsYXlvdXREaWN0KXtcclxuICAgICAgICBsYXlvdXREaWN0PWdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV09e31cclxuICAgIH1cclxuICAgIGlmKGxheW91dERpY3RbXCJlZGdlc1wiXT09bnVsbCkgbGF5b3V0RGljdFtcImVkZ2VzXCJdPXt9XHJcbiAgICBcclxuICAgIHZhciBzaG93aW5nTGF5b3V0PXRoaXMuZ2V0Q3VycmVudExheW91dERldGFpbCgpXHJcbiAgICB2YXIgc2hvd2luZ0VkZ2VzTGF5b3V0PSBzaG93aW5nTGF5b3V0W1wiZWRnZXNcIl1cclxuICAgIGRlbGV0ZSBzaG93aW5nTGF5b3V0W1wiZWRnZXNcIl1cclxuICAgIGZvcih2YXIgaW5kIGluIHNob3dpbmdMYXlvdXQpIGxheW91dERpY3RbaW5kXT1zaG93aW5nTGF5b3V0W2luZF1cclxuICAgIGZvcih2YXIgaW5kIGluIHNob3dpbmdFZGdlc0xheW91dCkgbGF5b3V0RGljdFtcImVkZ2VzXCJdW2luZF09c2hvd2luZ0VkZ2VzTGF5b3V0W2luZF1cclxuXHJcbiAgICAkLnBvc3QoXCJsYXlvdXQvc2F2ZUxheW91dHNcIix7XCJhZHROYW1lXCI6YWR0TmFtZSxcImxheW91dHNcIjpKU09OLnN0cmluZ2lmeShnbG9iYWxDYWNoZS5sYXlvdXRKU09OKX0pXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwifSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm51bWJlclByZWNpc2lvbiA9IGZ1bmN0aW9uIChudW1iZXIpIHtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkobnVtYmVyKSl7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxudW1iZXIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIG51bWJlcltpXSA9IHRoaXMubnVtYmVyUHJlY2lzaW9uKG51bWJlcltpXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bWJlclxyXG4gICAgfWVsc2VcclxuICAgIHJldHVybiBwYXJzZUZsb2F0KG51bWJlci50b0ZpeGVkKDMpKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuQ09TRVNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWQ9dGhpcy5jb3JlLiQoJzpzZWxlY3RlZCcpXHJcbiAgICB0aGlzLm5vUG9zaXRpb25fY29zZShzZWxlY3RlZClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmhpZGVTZWxlY3RlZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5yZW1vdmUoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0SW5ib3VuZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgdmFyIGVsZXM9dGhpcy5jb3JlLm5vZGVzKCkuZWRnZXNUbyhzZWxlY3RlZE5vZGVzKS5zb3VyY2VzKClcclxuICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICBlbGVzLnNlbGVjdCgpXHJcbiAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdE91dGJvdW5kTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICB2YXIgZWxlcz1zZWxlY3RlZE5vZGVzLmVkZ2VzVG8odGhpcy5jb3JlLm5vZGVzKCkpLnRhcmdldHMoKVxyXG4gICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIGVsZXMuc2VsZWN0KClcclxuICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYWRkQ29ubmVjdGlvbnMgPSBmdW5jdGlvbiAodGFyZ2V0Tm9kZSkge1xyXG4gICAgdmFyIHRoZUNvbm5lY3RNb2RlPXRoaXMudGFyZ2V0Tm9kZU1vZGVcclxuICAgIHZhciBzcmNOb2RlQXJyPXRoaXMuY29yZS5ub2RlcyhcIjpzZWxlY3RlZFwiKVxyXG5cclxuICAgIHZhciBwcmVwYXJhdGlvbkluZm89W11cclxuXHJcbiAgICBzcmNOb2RlQXJyLmZvckVhY2godGhlTm9kZT0+e1xyXG4gICAgICAgIHZhciBjb25uZWN0aW9uVHlwZXNcclxuICAgICAgICBpZih0aGVDb25uZWN0TW9kZT09XCJjb25uZWN0VG9cIikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZXM9dGhpcy5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlKHRoZU5vZGUuZGF0YShcIm1vZGVsSURcIiksdGFyZ2V0Tm9kZS5kYXRhKFwibW9kZWxJRFwiKSlcclxuICAgICAgICAgICAgcHJlcGFyYXRpb25JbmZvLnB1c2goe2Zyb206dGhlTm9kZSx0bzp0YXJnZXROb2RlLGNvbm5lY3Q6Y29ubmVjdGlvblR5cGVzfSlcclxuICAgICAgICB9ZWxzZSBpZih0aGVDb25uZWN0TW9kZT09XCJjb25uZWN0RnJvbVwiKSB7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25UeXBlcz10aGlzLmNoZWNrQXZhaWxhYmxlQ29ubmVjdGlvblR5cGUodGFyZ2V0Tm9kZS5kYXRhKFwibW9kZWxJRFwiKSx0aGVOb2RlLmRhdGEoXCJtb2RlbElEXCIpKVxyXG4gICAgICAgICAgICBwcmVwYXJhdGlvbkluZm8ucHVzaCh7dG86dGhlTm9kZSxmcm9tOnRhcmdldE5vZGUsY29ubmVjdDpjb25uZWN0aW9uVHlwZXN9KVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAvL1RPRE86IGNoZWNrIGlmIGl0IGlzIG5lZWRlZCB0byBwb3B1cCBkaWFsb2csIGlmIGFsbCBjb25uZWN0aW9uIGlzIGRvYWJsZSBhbmQgb25seSBvbmUgdHlwZSB0byB1c2UsIG5vIG5lZWQgdG8gc2hvdyBkaWFsb2dcclxuICAgIHRoaXMuc2hvd0Nvbm5lY3Rpb25EaWFsb2cocHJlcGFyYXRpb25JbmZvKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2hvd0Nvbm5lY3Rpb25EaWFsb2cgPSBmdW5jdGlvbiAocHJlcGFyYXRpb25JbmZvKSB7XHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIHZhciByZXN1bHRBY3Rpb25zPVtdXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCI0NTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJBZGQgY29ubmVjdGlvbnNcIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6IFwiXCJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlQ29ubmVjdGlvbnMocmVzdWx0QWN0aW9ucylcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuZGlhbG9nRGl2LmVtcHR5KClcclxuICAgIHByZXBhcmF0aW9uSW5mby5mb3JFYWNoKChvbmVSb3csaW5kZXgpPT57XHJcbiAgICAgICAgcmVzdWx0QWN0aW9ucy5wdXNoKHRoaXMuY3JlYXRlT25lQ29ubmVjdGlvbkFkanVzdFJvdyhvbmVSb3csY29uZmlybURpYWxvZ0RpdikpXHJcbiAgICB9KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY3JlYXRlT25lQ29ubmVjdGlvbkFkanVzdFJvdyA9IGZ1bmN0aW9uIChvbmVSb3csY29uZmlybURpYWxvZ0Rpdikge1xyXG4gICAgdmFyIHJldHVybk9iaj17fVxyXG4gICAgdmFyIGZyb21Ob2RlPW9uZVJvdy5mcm9tXHJcbiAgICB2YXIgdG9Ob2RlPW9uZVJvdy50b1xyXG4gICAgdmFyIGNvbm5lY3Rpb25UeXBlcz1vbmVSb3cuY29ubmVjdFxyXG4gICAgdmFyIGxhYmVsPSQoJzxsYWJlbCBzdHlsZT1cImRpc3BsYXk6YmxvY2s7bWFyZ2luLWJvdHRvbToycHhcIj48L2xhYmVsPicpXHJcbiAgICBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPT0wKXtcclxuICAgICAgICBsYWJlbC5jc3MoXCJjb2xvclwiLFwicmVkXCIpXHJcbiAgICAgICAgbGFiZWwuaHRtbChcIk5vIHVzYWJsZSBjb25uZWN0aW9uIHR5cGUgZnJvbSA8Yj5cIitmcm9tTm9kZS5pZCgpK1wiPC9iPiB0byA8Yj5cIit0b05vZGUuaWQoKStcIjwvYj5cIilcclxuICAgIH1lbHNlIGlmKGNvbm5lY3Rpb25UeXBlcy5sZW5ndGg+MSl7IFxyXG4gICAgICAgIGxhYmVsLmh0bWwoXCJGcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKSBcclxuICAgICAgICB2YXIgc3dpdGNoVHlwZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiKVxyXG4gICAgICAgIGxhYmVsLnByZXBlbmQoc3dpdGNoVHlwZVNlbGVjdG9yLkRPTSlcclxuICAgICAgICBjb25uZWN0aW9uVHlwZXMuZm9yRWFjaChvbmVUeXBlPT57XHJcbiAgICAgICAgICAgIHN3aXRjaFR5cGVTZWxlY3Rvci5hZGRPcHRpb24ob25lVHlwZSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybk9ialtcImZyb21cIl09ZnJvbU5vZGUuaWQoKVxyXG4gICAgICAgIHJldHVybk9ialtcInRvXCJdPXRvTm9kZS5pZCgpXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiY29ubmVjdFwiXT1jb25uZWN0aW9uVHlwZXNbMF1cclxuICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgIHJldHVybk9ialtcImNvbm5lY3RcIl09b3B0aW9uVGV4dFxyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPT0xKXtcclxuICAgICAgICByZXR1cm5PYmpbXCJmcm9tXCJdPWZyb21Ob2RlLmlkKClcclxuICAgICAgICByZXR1cm5PYmpbXCJ0b1wiXT10b05vZGUuaWQoKVxyXG4gICAgICAgIHJldHVybk9ialtcImNvbm5lY3RcIl09Y29ubmVjdGlvblR5cGVzWzBdXHJcbiAgICAgICAgbGFiZWwuY3NzKFwiY29sb3JcIixcImdyZWVuXCIpXHJcbiAgICAgICAgbGFiZWwuaHRtbChcIkFkZCA8Yj5cIitjb25uZWN0aW9uVHlwZXNbMF0rXCI8L2I+IGNvbm5lY3Rpb24gZnJvbSA8Yj5cIitmcm9tTm9kZS5pZCgpK1wiPC9iPiB0byA8Yj5cIit0b05vZGUuaWQoKStcIjwvYj5cIikgXHJcbiAgICB9XHJcbiAgICBjb25maXJtRGlhbG9nRGl2LmRpYWxvZ0Rpdi5hcHBlbmQobGFiZWwpXHJcbiAgICByZXR1cm4gcmV0dXJuT2JqO1xyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNyZWF0ZUNvbm5lY3Rpb25zID0gZnVuY3Rpb24gKHJlc3VsdEFjdGlvbnMpIHtcclxuICAgIGZ1bmN0aW9uIHV1aWR2NCgpIHtcclxuICAgICAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIGZpbmFsQWN0aW9ucz1bXVxyXG4gICAgcmVzdWx0QWN0aW9ucy5mb3JFYWNoKG9uZUFjdGlvbj0+e1xyXG4gICAgICAgIHZhciBvbmVGaW5hbEFjdGlvbj17fVxyXG4gICAgICAgIG9uZUZpbmFsQWN0aW9uW1wiJHNyY0lkXCJdPW9uZUFjdGlvbltcImZyb21cIl1cclxuICAgICAgICBvbmVGaW5hbEFjdGlvbltcIiRyZWxhdGlvbnNoaXBJZFwiXT11dWlkdjQoKTtcclxuICAgICAgICBvbmVGaW5hbEFjdGlvbltcIm9ialwiXT17XHJcbiAgICAgICAgICAgIFwiJHRhcmdldElkXCI6IG9uZUFjdGlvbltcInRvXCJdLFxyXG4gICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBOYW1lXCI6IG9uZUFjdGlvbltcImNvbm5lY3RcIl1cclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxBY3Rpb25zLnB1c2gob25lRmluYWxBY3Rpb24pXHJcbiAgICB9KVxyXG4gICAgJC5wb3N0KFwiZWRpdEFEVC9jcmVhdGVSZWxhdGlvbnNcIix7YWN0aW9uczpKU09OLnN0cmluZ2lmeShmaW5hbEFjdGlvbnMpfSwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIHJldHVybjtcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZChkYXRhKVxyXG4gICAgICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhkYXRhKVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSA9IGZ1bmN0aW9uIChmcm9tTm9kZU1vZGVsLHRvTm9kZU1vZGVsKSB7XHJcbiAgICB2YXIgcmU9W11cclxuICAgIHZhciB2YWxpZFJlbGF0aW9uc2hpcHM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW2Zyb21Ob2RlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHRvTm9kZUJhc2VDbGFzc2VzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1t0b05vZGVNb2RlbF0uYWxsQmFzZUNsYXNzZXNcclxuICAgIGlmKHZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgZm9yKHZhciByZWxhdGlvbk5hbWUgaW4gdmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICAgICAgdmFyIHRoZVJlbGF0aW9uVHlwZT12YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25OYW1lXVxyXG4gICAgICAgICAgICBpZih0aGVSZWxhdGlvblR5cGUudGFyZ2V0PT1udWxsXHJcbiAgICAgICAgICAgICAgICAgfHwgdGhlUmVsYXRpb25UeXBlLnRhcmdldD09dG9Ob2RlTW9kZWxcclxuICAgICAgICAgICAgICAgICB8fHRvTm9kZUJhc2VDbGFzc2VzW3RoZVJlbGF0aW9uVHlwZS50YXJnZXRdIT1udWxsKSByZS5wdXNoKHJlbGF0aW9uTmFtZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNldEtleURvd25GdW5jPWZ1bmN0aW9uKGluY2x1ZGVDYW5jZWxDb25uZWN0T3BlcmF0aW9uKXtcclxuICAgICQoZG9jdW1lbnQpLm9uKFwia2V5ZG93blwiLCAgKGUpPT57XHJcbiAgICAgICAgaWYgKGUuY3RybEtleSAmJiBlLnRhcmdldC5ub2RlTmFtZSA9PT0gJ0JPRFknKXtcclxuICAgICAgICAgICAgaWYgKGUud2hpY2ggPT09IDkwKSAgIHRoaXMudXIudW5kbygpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChlLndoaWNoID09PSA4OSkgICAgdGhpcy51ci5yZWRvKCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYoZS53aGljaD09PTgzKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6XCJwb3B1cExheW91dEVkaXRpbmdcIn0pXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZS5rZXlDb2RlID09IDI3KSB0aGlzLmNhbmNlbFRhcmdldE5vZGVNb2RlKCkgICAgXHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zdGFydFRhcmdldE5vZGVNb2RlID0gZnVuY3Rpb24gKG1vZGUpIHtcclxuICAgIHRoaXMuY29yZS5hdXRvdW5zZWxlY3RpZnkoIHRydWUgKTtcclxuICAgIHRoaXMuY29yZS5jb250YWluZXIoKS5zdHlsZS5jdXJzb3IgPSAnY3Jvc3NoYWlyJztcclxuICAgIHRoaXMudGFyZ2V0Tm9kZU1vZGU9bW9kZTtcclxuICAgIHRoaXMuc2V0S2V5RG93bkZ1bmMoXCJpbmNsdWRlQ2FuY2VsQ29ubmVjdE9wZXJhdGlvblwiKVxyXG5cclxuICAgIHRoaXMuY29yZS5ub2RlcygpLm9uKCdjbGljaycsIChlKT0+e1xyXG4gICAgICAgIHZhciBjbGlja2VkTm9kZSA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHRoaXMuYWRkQ29ubmVjdGlvbnMoY2xpY2tlZE5vZGUpXHJcbiAgICAgICAgLy9kZWxheSBhIHNob3J0IHdoaWxlIHNvIG5vZGUgc2VsZWN0aW9uIHdpbGwgbm90IGJlIGNoYW5nZWQgdG8gdGhlIGNsaWNrZWQgdGFyZ2V0IG5vZGVcclxuICAgICAgICBzZXRUaW1lb3V0KCgpPT57dGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpfSw1MClcclxuXHJcbiAgICB9KTtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNhbmNlbFRhcmdldE5vZGVNb2RlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnRhcmdldE5vZGVNb2RlPW51bGw7XHJcbiAgICB0aGlzLmNvcmUuY29udGFpbmVyKCkuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xyXG4gICAgJChkb2N1bWVudCkub2ZmKCdrZXlkb3duJyk7XHJcbiAgICB0aGlzLnNldEtleURvd25GdW5jKClcclxuICAgIHRoaXMuY29yZS5ub2RlcygpLm9mZihcImNsaWNrXCIpXHJcbiAgICB0aGlzLmNvcmUuYXV0b3Vuc2VsZWN0aWZ5KCBmYWxzZSApO1xyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fZ3JpZD1mdW5jdGlvbihlbGVzKXtcclxuICAgIHZhciBuZXdMYXlvdXQgPSBlbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2dyaWQnLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLFxyXG4gICAgICAgIGZpdDpmYWxzZVxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fY29zZT1mdW5jdGlvbihlbGVzKXtcclxuICAgIGlmKGVsZXM9PW51bGwpIGVsZXM9dGhpcy5jb3JlLmVsZW1lbnRzKClcclxuXHJcbiAgICB2YXIgbmV3TGF5b3V0ID1lbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2Nvc2UnLFxyXG4gICAgICAgIGdyYXZpdHk6MSxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZVxyXG4gICAgICAgICxmaXQ6ZmFsc2VcclxuICAgIH0pIFxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbiAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub1Bvc2l0aW9uX2NvbmNlbnRyaWM9ZnVuY3Rpb24oZWxlcyxib3gpe1xyXG4gICAgaWYoZWxlcz09bnVsbCkgZWxlcz10aGlzLmNvcmUuZWxlbWVudHMoKVxyXG4gICAgdmFyIG5ld0xheW91dCA9ZWxlcy5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdjb25jZW50cmljJyxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZSxcclxuICAgICAgICBmaXQ6ZmFsc2UsXHJcbiAgICAgICAgbWluTm9kZVNwYWNpbmc6NjAsXHJcbiAgICAgICAgZ3Jhdml0eToxLFxyXG4gICAgICAgIGJvdW5kaW5nQm94OmJveFxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdG9wb2xvZ3lET007IiwiY29uc3Qgc2ltcGxlVHJlZT1yZXF1aXJlKFwiLi9zaW1wbGVUcmVlXCIpXHJcbmNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5cclxuZnVuY3Rpb24gdHdpbnNUcmVlKERPTSwgc2VhcmNoRE9NKSB7XHJcbiAgICB0aGlzLnRyZWU9bmV3IHNpbXBsZVRyZWUoRE9NKVxyXG4gICAgdGhpcy5tb2RlbElETWFwVG9OYW1lPXt9XHJcblxyXG4gICAgdGhpcy50cmVlLm9wdGlvbnMuZ3JvdXBOb2RlSWNvbkZ1bmM9KGduKT0+e1xyXG4gICAgICAgIHZhciBtb2RlbENsYXNzPWduLmluZm9bXCJAaWRcIl1cclxuICAgICAgICB2YXIgY29sb3JDb2RlPVwiZGFya0dyYXlcIlxyXG4gICAgICAgIHZhciBzaGFwZT1cImVsbGlwc2VcIlxyXG4gICAgICAgIHZhciBhdmFydGE9bnVsbFxyXG4gICAgICAgIHZhciBkaW1lbnNpb249MjA7XHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0gJiYgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bbW9kZWxDbGFzc10pe1xyXG4gICAgICAgICAgICB2YXIgdmlzdWFsSnNvbiA9Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bbW9kZWxDbGFzc11cclxuICAgICAgICAgICAgdmFyIGNvbG9yQ29kZT0gdmlzdWFsSnNvbi5jb2xvciB8fCBcImRhcmtHcmF5XCJcclxuICAgICAgICAgICAgdmFyIHNoYXBlPSAgdmlzdWFsSnNvbi5zaGFwZSB8fCBcImVsbGlwc2VcIlxyXG4gICAgICAgICAgICB2YXIgYXZhcnRhPSB2aXN1YWxKc29uLmF2YXJ0YSBcclxuICAgICAgICAgICAgaWYodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbykgZGltZW5zaW9uKj1wYXJzZUZsb2F0KHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgaWNvbkRPTT0kKFwiPGRpdiBzdHlsZT0nd2lkdGg6XCIrZGltZW5zaW9uK1wicHg7aGVpZ2h0OlwiK2RpbWVuc2lvbitcInB4O2Zsb2F0OmxlZnQ7cG9zaXRpb246cmVsYXRpdmUnPjwvZGl2PlwiKVxyXG4gICAgICAgIHZhciBpbWdTcmM9ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuc2hhcGVTdmcoc2hhcGUsY29sb3JDb2RlKSlcclxuICAgICAgICBpY29uRE9NLmFwcGVuZCgkKFwiPGltZyBzcmM9J2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LFwiK2ltZ1NyYytcIic+PC9pbWc+XCIpKVxyXG4gICAgICAgIGlmKGF2YXJ0YSl7XHJcbiAgICAgICAgICAgIHZhciBhdmFydGFpbWc9JChcIjxpbWcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MHB4O3dpZHRoOjYwJTttYXJnaW46MjAlJyBzcmM9J1wiK2F2YXJ0YStcIic+PC9pbWc+XCIpXHJcbiAgICAgICAgICAgIGljb25ET00uYXBwZW5kKGF2YXJ0YWltZylcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGljb25ET01cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2Rlcz0obm9kZXNBcnIsbW91c2VDbGlja0RldGFpbCk9PntcclxuICAgICAgICB2YXIgaW5mb0Fycj1bXVxyXG4gICAgICAgIG5vZGVzQXJyLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PntcclxuICAgICAgICAgICAgaW5mb0Fyci5wdXNoKGl0ZW0ubGVhZkluZm8pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc2hvd2luZ0NyZWF0ZVR3aW5Nb2RlbElEPW51bGw7IFxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOmluZm9BcnIsIFwibW91c2VDbGlja0RldGFpbFwiOm1vdXNlQ2xpY2tEZXRhaWx9KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZT0odGhlTm9kZSk9PntcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJQYW5Ub05vZGVcIiwgaW5mbzp0aGVOb2RlLmxlYWZJbmZvfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGU9KG5vZGVJbmZvKT0+e1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6XCJzaG93SW5mb0dyb3VwTm9kZVwiLGluZm86bm9kZUluZm99KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2VhcmNoQm94PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiICBwbGFjZWhvbGRlcj1cInNlYXJjaC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0XCIpO1xyXG4gICAgdGhpcy5zZWFyY2hCb3guY3NzKHtcIm91dGxpbmVcIjpcIm5vbmVcIixcImhlaWdodFwiOlwiMTAwJVwiLFwid2lkdGhcIjpcIjEwMCVcIn0pIFxyXG4gICAgc2VhcmNoRE9NLmFwcGVuZCh0aGlzLnNlYXJjaEJveClcclxuXHJcbiAgICB2YXIgaGlkZU9yU2hvd0VtcHR5R3JvdXA9JCgnPGJ1dHRvbiBzdHlsZT1cImhlaWdodDoyMHB4O2JvcmRlcjpub25lO3BhZGRpbmctbGVmdDoycHhcIiBjbGFzcz1cInczLWJsb2NrIHczLXRpbnkgdzMtaG92ZXItcmVkIHczLWFtYmVyXCI+SGlkZSBFbXB0eSBNb2RlbHM8L2J1dHRvbj4nKVxyXG4gICAgc2VhcmNoRE9NLmFwcGVuZChoaWRlT3JTaG93RW1wdHlHcm91cClcclxuICAgIERPTS5jc3MoXCJ0b3BcIixcIjUwcHhcIilcclxuICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcInNob3dcIilcclxuICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIik9PVwic2hvd1wiKXtcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwiaGlkZVwiKVxyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC50ZXh0KFwiU2hvdyBFbXB0eSBNb2RlbHNcIilcclxuICAgICAgICAgICAgdGhpcy50cmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXA9dHJ1ZVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJzaG93XCIpXHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLnRleHQoXCJIaWRlIEVtcHR5IE1vZGVsc1wiKVxyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy50cmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaChvbmVHcm91cE5vZGU9PntvbmVHcm91cE5vZGUuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cCgpfSlcclxuICAgIH0pXHJcblxyXG5cclxuICAgIHRoaXMuc2VhcmNoQm94LmtleXVwKChlKT0+e1xyXG4gICAgICAgIGlmKGUua2V5Q29kZSA9PSAxMylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBhTm9kZSA9IHRoaXMudHJlZS5zZWFyY2hUZXh0KCQoZS50YXJnZXQpLnZhbCgpKVxyXG4gICAgICAgICAgICBpZihhTm9kZSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICBhTm9kZS5wYXJlbnRHcm91cE5vZGUuZXhwYW5kKClcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5zZWxlY3RMZWFmTm9kZShhTm9kZSlcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5zY3JvbGxUb0xlYWZOb2RlKGFOb2RlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuc2hhcGVTdmc9ZnVuY3Rpb24oc2hhcGUsY29sb3Ipe1xyXG4gICAgaWYoc2hhcGU9PVwiZWxsaXBzZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxjaXJjbGUgY3g9XCI1MFwiIGN5PVwiNTBcIiByPVwiNTBcIiAgZmlsbD1cIicrY29sb3IrJ1wiLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJoZXhhZ29uXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PHBvbHlnb24gcG9pbnRzPVwiNTAgMCwgOTMuMyAyNSwgOTMuMyA3NSwgNTAgMTAwLCA2LjcgNzUsIDYuNyAyNVwiICBmaWxsPVwiJytjb2xvcisnXCIgLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJyb3VuZC1yZWN0YW5nbGVcIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cmVjdCB4PVwiMTBcIiB5PVwiMTBcIiByeD1cIjEwXCIgcnk9XCIxMFwiIHdpZHRoPVwiODBcIiBoZWlnaHQ9XCI4MFwiIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlXCIpIHRoaXMuQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlKG1zZ1BheWxvYWQucXVlcnksIG1zZ1BheWxvYWQudHdpbnMsbXNnUGF5bG9hZC5BRFRJbnN0YW5jZURvZXNOb3RDaGFuZ2UpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFREYXRhc291cmNlQ2hhbmdlX2FwcGVuZFwiKSB0aGlzLkFEVERhdGFzb3VyY2VDaGFuZ2VfYXBwZW5kKG1zZ1BheWxvYWQucXVlcnksIG1zZ1BheWxvYWQudHdpbnMpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIikgdGhpcy5kcmF3VHdpbnNBbmRSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURUTW9kZWxzQ2hhbmdlXCIpIHRoaXMucmVmcmVzaE1vZGVscyhtc2dQYXlsb2FkLm1vZGVscylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5cIikgdGhpcy5kcmF3T25lVHdpbihtc2dQYXlsb2FkLnR3aW5JbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpbnNcIikge1xyXG4gICAgICAgIG1zZ1BheWxvYWQudHdpbnNJbmZvLmZvckVhY2gob25lVHdpbkluZm89Pnt0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW5JbmZvKX0pXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ0d2luc0RlbGV0ZWRcIikgdGhpcy5kZWxldGVUd2lucyhtc2dQYXlsb2FkLnR3aW5JREFycilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImhpZGVTZWxlY3RlZE5vZGVzXCIpIHRoaXMuZGVsZXRlVHdpbnMobXNnUGF5bG9hZC50d2luSURBcnIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKCFtc2dQYXlsb2FkLnNyY01vZGVsSUQpeyAvLyBjaGFuZ2UgbW9kZWwgY2xhc3MgdmlzdWFsaXphdGlvblxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKGduPT57Z24ucmVmcmVzaE5hbWUoKX0pXHJcbiAgICAgICAgfSBcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kZWxldGVUd2lucz1mdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgdHdpbklEQXJyLmZvckVhY2godHdpbklEPT57XHJcbiAgICAgICAgdGhpcy50cmVlLmRlbGV0ZUxlYWZOb2RlKHR3aW5JRClcclxuICAgIH0pXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUucmVmcmVzaE1vZGVscz1mdW5jdGlvbihtb2RlbHNEYXRhKXtcclxuICAgIC8vZGVsZXRlIGFsbCBncm91cCBub2RlcyBvZiBkZWxldGVkIG1vZGVsc1xyXG4gICAgdmFyIGFycj1bXS5jb25jYXQodGhpcy50cmVlLmdyb3VwTm9kZXMpXHJcbiAgICBhcnIuZm9yRWFjaCgoZ25vZGUpPT57XHJcbiAgICAgICAgaWYobW9kZWxzRGF0YVtnbm9kZS5uYW1lXT09bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZGVsZXRlIHRoaXMgZ3JvdXAgbm9kZVxyXG4gICAgICAgICAgICBnbm9kZS5kZWxldGVTZWxmKClcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vdGhlbiBhZGQgYWxsIGdyb3VwIG5vZGVzIHRoYXQgdG8gYmUgYWRkZWRcclxuICAgIHZhciBjdXJyZW50TW9kZWxOYW1lQXJyPVtdXHJcbiAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnbm9kZSk9PntjdXJyZW50TW9kZWxOYW1lQXJyLnB1c2goZ25vZGUubmFtZSl9KVxyXG5cclxuICAgIHZhciBhY3R1YWxNb2RlbE5hbWVBcnI9W11cclxuICAgIGZvcih2YXIgaW5kIGluIG1vZGVsc0RhdGEpIGFjdHVhbE1vZGVsTmFtZUFyci5wdXNoKGluZClcclxuICAgIGFjdHVhbE1vZGVsTmFtZUFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG5cclxuICAgIGZvcih2YXIgaT0wO2k8YWN0dWFsTW9kZWxOYW1lQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGlmKGk8Y3VycmVudE1vZGVsTmFtZUFyci5sZW5ndGggJiYgY3VycmVudE1vZGVsTmFtZUFycltpXT09YWN0dWFsTW9kZWxOYW1lQXJyW2ldKSBjb250aW51ZVxyXG4gICAgICAgIC8vb3RoZXJ3aXNlIGFkZCB0aGlzIGdyb3VwIHRvIHRoZSB0cmVlXHJcbiAgICAgICAgdmFyIG5ld0dyb3VwPXRoaXMudHJlZS5pbnNlcnRHcm91cE5vZGUobW9kZWxzRGF0YVthY3R1YWxNb2RlbE5hbWVBcnJbaV1dLGkpXHJcbiAgICAgICAgbmV3R3JvdXAuc2hyaW5rKClcclxuICAgICAgICBjdXJyZW50TW9kZWxOYW1lQXJyLnNwbGljZShpLCAwLCBhY3R1YWxNb2RlbE5hbWVBcnJbaV0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5BRFREYXRhc291cmNlQ2hhbmdlX2FwcGVuZD1mdW5jdGlvbih0d2luUXVlcnlTdHIsdHdpbnNEYXRhKXtcclxuICAgIGlmICh0d2luc0RhdGEgIT0gbnVsbCkgdGhpcy5hcHBlbmRBbGxUd2lucyh0d2luc0RhdGEpXHJcbiAgICBlbHNlIHtcclxuICAgICAgICAkLnBvc3QoXCJxdWVyeUFEVC9hbGxUd2luc0luZm9cIiwgeyBxdWVyeTogdHdpblF1ZXJ5U3RyIH0sIChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGRhdGE9PVwiXCIpIHJldHVybjtcclxuICAgICAgICAgICAgZGF0YS5mb3JFYWNoKChvbmVOb2RlKT0+e2dsb2JhbENhY2hlLnN0b3JlZFR3aW5zW29uZU5vZGVbXCIkZHRJZFwiXV0gPSBvbmVOb2RlfSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQWxsVHdpbnMoZGF0YSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLkFEVERhdGFzb3VyY2VDaGFuZ2VfcmVwbGFjZT1mdW5jdGlvbih0d2luUXVlcnlTdHIsdHdpbnNEYXRhLEFEVEluc3RhbmNlRG9lc05vdENoYW5nZSl7XHJcbiAgICB2YXIgdGhlVHJlZT0gdGhpcy50cmVlO1xyXG5cclxuICAgIGlmIChBRFRJbnN0YW5jZURvZXNOb3RDaGFuZ2UpIHtcclxuICAgICAgICAvL2tlZXAgYWxsIGdyb3VwIG5vZGUgYXMgbW9kZWwgaXMgdGhlIHNhbWUsIG9ubHkgZmV0Y2ggYWxsIGxlYWYgbm9kZSBhZ2FpblxyXG4gICAgICAgIC8vcmVtb3ZlIGFsbCBsZWFmIG5vZGVzXHJcbiAgICAgICAgdGhpcy50cmVlLmNsZWFyQWxsTGVhZk5vZGVzKClcclxuICAgICAgICBpZiAodHdpbnNEYXRhICE9IG51bGwpIHRoaXMucmVwbGFjZUFsbFR3aW5zKHR3aW5zRGF0YSlcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvYWxsVHdpbnNJbmZvXCIsIHsgcXVlcnk6IHR3aW5RdWVyeVN0ciB9LCAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXTtcclxuICAgICAgICAgICAgICAgIGRhdGEuZm9yRWFjaCgob25lTm9kZSk9PntnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tvbmVOb2RlW1wiJGR0SWRcIl1dID0gb25lTm9kZX0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXBsYWNlQWxsVHdpbnMoZGF0YSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGVUcmVlLnJlbW92ZUFsbE5vZGVzKClcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLm1vZGVsSURNYXBUb05hbWUpIGRlbGV0ZSB0aGlzLm1vZGVsSURNYXBUb05hbWVbaWRdXHJcbiAgICAgICAgLy9xdWVyeSB0byBnZXQgYWxsIG1vZGVsc1xyXG4gICAgICAgICQuZ2V0KFwicXVlcnlBRFQvbGlzdE1vZGVsc1wiLCAoZGF0YSwgc3RhdHVzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W11cclxuICAgICAgICAgICAgdmFyIHRtcE5hbWVBcnIgPSBbXVxyXG4gICAgICAgICAgICB2YXIgdG1wTmFtZVRvT2JqID0ge31cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZihkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl09PW51bGwpIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXT1kYXRhW2ldW1wiQGlkXCJdXHJcbiAgICAgICAgICAgICAgICBpZigkLmlzUGxhaW5PYmplY3QoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl0pIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXT1kYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1bXCJlblwiXVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdPUpTT04uc3RyaW5naWZ5KGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKHRtcE5hbWVUb09ialtkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1dIT1udWxsKXtcclxuICAgICAgICAgICAgICAgICAgICAvL3JlcGVhdGVkIG1vZGVsIGRpc3BsYXkgbmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXT1kYXRhW2ldW1wiQGlkXCJdXHJcbiAgICAgICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZVtkYXRhW2ldW1wiQGlkXCJdXSA9IGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0bXBOYW1lQXJyLnB1c2goZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdKVxyXG4gICAgICAgICAgICAgICAgdG1wTmFtZVRvT2JqW2RhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXV0gPSBkYXRhW2ldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdG1wTmFtZUFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG4gICAgICAgICAgICB0bXBOYW1lQXJyLmZvckVhY2gobW9kZWxOYW1lID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdHcm91cCA9IHRoZVRyZWUuYWRkR3JvdXBOb2RlKHRtcE5hbWVUb09ialttb2RlbE5hbWVdKVxyXG4gICAgICAgICAgICAgICAgbmV3R3JvdXAuc2hyaW5rKClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5jbGVhckFsbE1vZGVscygpO1xyXG4gICAgICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhkYXRhKVxyXG4gICAgICAgICAgICBtb2RlbEFuYWx5emVyLmFuYWx5emUoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0d2luc0RhdGEgIT0gbnVsbCkgdGhpcy5yZXBsYWNlQWxsVHdpbnModHdpbnNEYXRhKVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL2FsbFR3aW5zSW5mb1wiLCB7IHF1ZXJ5OiB0d2luUXVlcnlTdHIgfSwgKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuZm9yRWFjaCgob25lTm9kZSk9PntnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tvbmVOb2RlW1wiJGR0SWRcIl1dID0gb25lTm9kZX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVwbGFjZUFsbFR3aW5zKGRhdGEpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kcmF3VHdpbnNBbmRSZWxhdGlvbnM9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd09uZVR3aW4ob25lVHdpbilcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vZHJhdyB0aG9zZSBrbm93biB0d2lucyBmcm9tIHRoZSByZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdHdpbnNJbmZvPXt9XHJcbiAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zSW5mbz1vbmVTZXRbXCJyZWxhdGlvbnNoaXBzXCJdXHJcbiAgICAgICAgcmVsYXRpb25zSW5mby5mb3JFYWNoKChvbmVSZWxhdGlvbik9PntcclxuICAgICAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1tzcmNJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF1cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3RhcmdldElEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSAgICBcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciB0bXBBcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIHR3aW5zSW5mbykgdG1wQXJyLnB1c2godHdpbnNJbmZvW3R3aW5JRF0pXHJcbiAgICB0bXBBcnIuZm9yRWFjaChvbmVUd2luPT57dGhpcy5kcmF3T25lVHdpbihvbmVUd2luKX0pXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZHJhd09uZVR3aW49IGZ1bmN0aW9uKHR3aW5JbmZvKXtcclxuICAgIHZhciBncm91cE5hbWU9dGhpcy5tb2RlbElETWFwVG9OYW1lW3R3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChncm91cE5hbWUsdHdpbkluZm8sXCJza2lwUmVwZWF0XCIpXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuYXBwZW5kQWxsVHdpbnM9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgLy9jaGVjayBpZiBhbnkgY3VycmVudCBsZWFmIG5vZGUgZG9lcyBub3QgaGF2ZSBzdG9yZWQgb3V0Ym91bmQgcmVsYXRpb25zaGlwIGRhdGEgeWV0XHJcbiAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKGxlYWZOb2RlPT57XHJcbiAgICAgICAgICAgIHZhciBub2RlSWQ9bGVhZk5vZGUubGVhZkluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbbm9kZUlkXT09bnVsbCkgdHdpbklEQXJyLnB1c2gobm9kZUlkKVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFwcGVuZEFsbFR3aW5zXCIsaW5mbzpkYXRhfSlcclxuICAgIGZvcih2YXIgaT0wO2k8ZGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZ3JvdXBOYW1lPXRoaXMubW9kZWxJRE1hcFRvTmFtZVtkYXRhW2ldW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLGRhdGFbaV0sXCJza2lwUmVwZWF0XCIpXHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZGF0YVtpXVtcIiRkdElkXCJdKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZmV0Y2hBbGxSZWxhdGlvbnNoaXBzKHR3aW5JREFycilcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5yZXBsYWNlQWxsVHdpbnM9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicmVwbGFjZUFsbFR3aW5zXCIsaW5mbzpkYXRhfSlcclxuICAgIGZvcih2YXIgaT0wO2k8ZGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZ3JvdXBOYW1lPXRoaXMubW9kZWxJRE1hcFRvTmFtZVtkYXRhW2ldW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLGRhdGFbaV0pXHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZGF0YVtpXVtcIiRkdElkXCJdKVxyXG4gICAgfVxyXG4gICAgdGhpcy5mZXRjaEFsbFJlbGF0aW9uc2hpcHModHdpbklEQXJyKVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmZldGNoQWxsUmVsYXRpb25zaGlwcz0gYXN5bmMgZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdmFyIGRhdGE9YXdhaXQgdGhpcy5mZXRjaFBhcnRpYWxSZWxhdGlvbnNoaXBzKHNtYWxsQXJyKVxyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YSkgLy9zdG9yZSB0aGVtIGluIGdsb2JhbCBhdmFpbGFibGUgYXJyYXlcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsaW5mbzpkYXRhfSlcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5mZXRjaFBhcnRpYWxSZWxhdGlvbnNoaXBzPSBhc3luYyBmdW5jdGlvbihJREFycil7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvYWxsUmVsYXRpb25zaGlwc1wiLHthcnI6SURBcnJ9LCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdHdpbnNUcmVlOyJdfQ==

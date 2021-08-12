function simpleChart(parentDom,xLength,cssOptions,customDrawing){
    if(customDrawing){
        customDrawing(parentDom)
    }
    this.canvas = $('<canvas></canvas>')
    this.canvas.css(cssOptions)
    parentDom.append(this.canvas)
    
    this.chart=new Chart(this.canvas, {
        type: "line",
        data: {
            labels: [],
            datasets: [{stepped:true, data: []}]
        },
        options: {
            animation: false,
            datasets: {
                line: {
                    spanGaps:true,
                    borderColor: "rgba(0,0,255,0.7)",
                    borderWidth:1,
                    pointRadius:0
                }
            },
            plugins:{
                legend: { display: false },
                tooltip:{enabled:false}
            },
            scales: {
                x:{grid:{display:false},ticks:{display:false}}
                ,y:{grid:{tickLength:0},ticks:{font:{size:9}}}
                ,x2: {position:'top',grid:{display:false},ticks:{display:false}}
                ,y2: {position:'right',grid:{display:false},ticks:{display:false}}     
            }
            
        }
    });
    this.setXLength(xLength)

    /*
    var newV=1
    setInterval(()=>{
        var dataArr=theChart.data.datasets[0].data
        var len=dataArr.length
        var passedTime= parseInt(Math.random()*10)
        for(var i=0;i<passedTime;i++) dataArr.shift()
        dataArr[len-1]=newV
        newV=1-newV
        theChart.update()
    },500)
    */
}

simpleChart.prototype.addDataValue=function(){
    
}

simpleChart.prototype.setXLength=function(xlen){
    var labels=this.chart.data.labels
    labels.length=0
    for(var i=0;i<xlen;i++) labels.push(i)
    //shorten or expand the length of data array
    var dataArr=this.chart.data.datasets[0].data
    if(dataArr.length>xlen) dataArr=dataArr.slice(dataArr.length-xlen)
    else if(dataArr.length<xlen){
        var numberToAdd=xlen-dataArr.length
        var tmpArr=[]
        tmpArr[numberToAdd-1]=null
        dataArr=tmpArr.concat(dataArr)
    }
    this.chart.data.datasets[0].data=dataArr
    this.chart.update()
}

simpleChart.prototype.destroy=function(){
    this.canvas.remove()
}

module.exports = simpleChart;
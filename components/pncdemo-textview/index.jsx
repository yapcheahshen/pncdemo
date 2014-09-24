/** @jsx React.DOM */

/* to rename the component, change name of ./component.js and  "dependencies" section of ../../component.js */
/*
  if ctrlKey is pressed, do not fired the default markup behavior
  , instead, append the selection.

  
*/
var tokenize=Require("ksana-document").tokenizers.simple; 
var getselection=require("./selection");

var textview = React.createClass({
  getInitialState: function() {
    return {bar: "world", ranges:[] , markups:[]};
  },
  addSelection:function(start,len) {
    var ranges=this.state.ranges;
    ranges.push([start-1,len]);
    this.setState({ranges:ranges});
    return ranges;
  },
  clearWindowSelection:function() {
    window.getSelection().empty();
  },
  clearMarkup:function(type,start) {
    /*
    start++;//should remove it in the future
    var ranges=this.state.ranges.filter(function(r){
      return ! ((r.type==type) && (start>=r.start && start<r.start+r.len));
    });
    this.setState({ranges:ranges});
    console.log("clear",type,start);
    */
  },
  applyMarkup:function(type,ranges) {
    var markups=this.state.markups;
    ranges.map(function(r){
      markups.push([r[0],r[1],type]);
    })
    this.setState({markups:markups});
  },
  rangeToClasses:function(arr,i,prefix) {
    var out=[];
    arr.map(function(r){
      var classes="",start=r[0],len=r[1];
      var basetype=r[2]||"selected";
      if (prefix) basetype=prefix+basetype;
      if (i>=start && i<start+len) {
        classes=basetype;
        if (i==start) classes+=" "+basetype+"_b";
        if (i==start+len-1) classes+=" "+basetype+"_e";
      }
      if (classes) out.push(classes);
    },this);
    return out;
  },
  clearRanges:function() {
    if (this.state.ranges.length) {
      this.setState({ranges:[]});
    }
    //this.clearWindowSelection();
  },
  mouseDown:function(e) {
    //if (e.ctrlKey) console.log("ctrl");
  },
  mouseUp:function(e) {
    var sel=getselection();
    var x=e.pageX,y=e.pageY;
    if (e.ctrlKey && sel && sel.len) {
      var ranges=this.addSelection(sel.start,sel.len);
      this.props.action("appendSelection",{ranges:ranges,x:x,y:y,view:this});
    } else {
      if (sel.len) {
        var ranges=this.addSelection(sel.start,sel.len);
        this.props.action("selection",{ranges:ranges, x:x,y:y, view:this});        
      } else {
        this.props.action("selection",{ranges:null,view:this});
        this.clearRanges();
      }
    }    
  },
  hasMarkupAt:function(n) {
    return false;
  },
  checkTokenUnderMouse:function(target,x,y) {
    //var rect=this.getDOMNode().getBoundingClientRect();
    //x-=rect.left;
    //y-=rect.top;
    if (!target) return;
    if (target.nodeName!="SPAN") return;
    var n=target.dataset['n'];
    var hasmarkup=this.hasMarkupAt(n);
    if (hasmarkup) {
      if (this.state.hoverToken!=target) { //do not refresh if hovering on same token
        this.props.action("hoverToken",{view:this,token:target,x:x,y:y});
        this.setState({hoverN:n});
      }
    } else {
      this.props.action("hoverToken",{view:this,token:null});
      this.setState({hoverN:-1});
    }
    //this.props.action("mousemove",{view:this}); //notify caller, for onBlur Event
  },
  stillInView:function(relatedTarget)  {
    return relatedTarget &&
       (relatedTarget.className=="hovermenu" ||
        (relatedTarget.parentElement && relatedTarget.parentElement.className=="hovermenu"));
  },
  clearHoverIfOutOfView:function(relatedTarget){
      var stillInView=this.stillInView(relatedTarget);
      if (stillInView) return;
      if (this.state.hoverN>-1) this.setState({hoverN:-1});
  },
  mouseOut:function(e) {
    clearTimeout(this.mousetimer);
    this.mousetimer=setTimeout(this.clearHoverIfOutOfView.bind(this,e.relatedTarget),100);
  },
  mouseMove:function(e) {
    clearTimeout(this.mousetimer);
    this.mousetimer=setTimeout( 
      this.checkTokenUnderMouse.bind(this,e.target,e.pageX,e.pageY),100);
  },
  isHovering:function(i){
    return (this.state.hoverN==i+1);//should check the entire markup range.
  },
  toXML:function(s) {
    var res=tokenize(s);
    var out=[];
    for (var i=0;i<res.tokens.length;i++) {
      if (res.tokens[i]=="\n") {
        out.push(<br key={"k"+i}/>);
        continue;
      } 
      var classes=this.rangeToClasses(this.state.ranges,i).join(" ");
      classes+=" "+this.rangeToClasses(this.state.markups,i,"markup_").join(" ");
      classes=classes.trim();
      if (this.isHovering(i)) classes+= " hovering";
      out.push(<span data-n={i+1} onMouseDown={this.mouseDown}
        className={classes} key={"k"+i}>{res.tokens[i]}</span>);
    }
    return out;
  },
  render: function() {
    return (
      <div>
        <div className="textview" 
          onMouseUp={this.mouseUp}
          onMouseOut={this.mouseOut}
          onMouseMove={this.mouseMove}>{this.toXML(this.props.text)}
        </div>
      </div>
    );
  }
});
module.exports=textview;
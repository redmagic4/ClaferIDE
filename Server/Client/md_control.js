/*
Copyright (C) 2012 Neil Redman <http://gsd.uwaterloo.ca>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

function Control(host)
{ 
    this.id = "mdControl";
    this.title = "Control";
    
    this.width = 300;
    this.height = 100;
    this.posx = 940;
    this.posy = 0;
    
    this.host = host;
}

Control.method("getInitContent", function(){
	var ret = '<form id="ControlForm" enctype="multipart/form-data" method="get" action="/control" style="display: block">';
	ret += '<input type="hidden" id="ControlOp" name="operation" value="next">';
    ret += '<input type="hidden" id="windowKey" name="windowKey" value="' + this.host.key + '">';
    ret += '<input type="hidden" id="iScopeBy" name="increaseScopeBy" value="1">';
	ret += '<input type="button" class="inputNextButton" id="Next" value="Next Instance" disabled="disabled"><br>';
    ret += '<input type="number" class="inputText" id="ScopeValue" placeholder="Increase Scope By" disabled="disabled">';
	ret += '<input type="button" class="inputButton" id="Scope" value="Increase Scope" disabled="disabled"></form>';	

    this.data = "";
    this.error = "";
    this.overwrite = false;

    return ret;
});

Control.method("onInitRendered", function()
{
    $("#Next").click(function(){
        $("#ControlOp").val("next");
        $("#iScopeBy").val("0");
        $("#ControlForm").submit();
    });

    $("#Scope").click(function(){
        $("#ControlOp").val("scope");
        $("#iScopeBy").val($("#ScopeValue").val());
        $("#ControlForm").submit();
    });

    var options = new Object();
    options.beforeSubmit = this.beginQuery.bind(this);
    options.success = this.showResponse.bind(this);
    options.error = this.handleError.bind(this);
    $('#ControlForm').ajaxForm(options); 
});

Control.method("enableAll", function(){
    $("#Scope").removeAttr("disabled");
    $("#ScopeValue").removeAttr("disabled");
    $("#Next").removeAttr("disabled");
});

Control.method("disableAll", function(){
    $("#Scope").attr("disabled", "disabled");
    $("#ScopeValue").attr("disabled", "disabled");
    $("#Next").attr("disabled", "disabled");
});

Control.method("onDataLoaded", function(data){
    this.enableAll();
});

Control.method("beginQuery", function(formData, jqForm, options){
    $("#ControlForm").hide();
});

Control.method("showResponse", function(responseText, statusText, xhr, $form)
{
    $("#ControlForm").show();
});

Control.method("handleError", function(responseText, statusText, xhr, $form){
    $("#ControlForm").show();
});
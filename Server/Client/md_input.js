/*
Copyright (C) 2012, 2013 Alexander Murashkin, Neil Redman <http://gsd.uwaterloo.ca>

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
function Input(host)
{ 
    this.id = "mdInput";
    this.title = "Input Clafer Model and Options";

    this.requestTimeout = 60000; // what is the timeout for response after sending a file &line [timeout]
    this.pollingTimeout = 60000;  // what is the timeout when polling &line [polling, timeout]
    this.pollingDelay = 700;    // how often to send requests (poll) for updates &line [polling]
    this.pollingTimeoutObject = null;//&line [polling, timeout]
    this.toCancel = false;//&line cancellation

    this.width = (window.parent.innerWidth-40) * 0.38;
    this.height = window.parent.innerHeight-60;
    this.posx = 0;
    this.posy = 0;
    
    this.host = host;
    this.serverAction = "/upload";
    
    this.dataFileChosen = false;

    this.editor = null;
    this.editorWidth = this.width - 5;
    this.editorHeight = this.height - 83;

    this.resize = this.onResize.bind(this);
}

//Input.method("recalculateEditorSize", function()
//{
//    this.editorWidth = this.window.width - 5;
//    this.editorHeight = this.window.height - 83;
//});

Input.method("onInitRendered", function()
{
    this.optimizeFlag = 1;
    this.addInstancesFlag = 1;
    this.previousData = null;
    this.toCancel = false;//&line cancellation

    $("#submitFile").click(this.submitFileCall.bind(this));//&line selectionOfExamples
    $("#submitExample").click(this.submitExampleCall.bind(this));//&line selectionOfExamples
    $("#submitText").click(this.submitTextCall.bind(this));  
    $("#submitExample").attr("disabled", "disabled");//&line selectionOfExamples

    $("#submitFile").attr("disabled", "disabled");//&line selectionOfExamples

    $("#myform [type='file']").change(this.inputChange.bind(this));
    $("#exampleURL").change(this.exampleChange.bind(this));
    $("#loadExampleInEditor").change(this.exampleChange.bind(this));
//    $("#saveSourceButton").click(this.saveSourceCall.bind(this));

    var options = new Object();
    options.beforeSubmit = this.beginQuery.bind(this);
    options.success = this.fileSent.bind(this);//&line polling
    options.error = this.handleError.bind(this);//&line handleError
    options.timeout = this.requestTimeout;// &line timeout

    $('#myform').ajaxForm(options); 

//    var optionsForFile = new Object();
//    optionsForFile.success = this.saveSourceSuccess.bind(this);
//    optionsForFile.error = this.handleError.bind(this);
//    optionsForFile.timeout = this.requestTimeout;
//    $('#saveSourceForm').ajaxForm(optionsForFile); 
	//&begin [claferTextEditor]
    this.editor = ace.edit("clafer_editor");
    this.editor.setTheme("ace/theme/eclipse");
    var ClaferMode = require("ace/mode/clafer").Mode;
    this.editor.getSession().setMode(new ClaferMode());
    this.editor.setShowPrintMargin(false);
	//&end [claferTextEditor]
    // $('#myform').submit(); MOVED TO another location
});
/*
 * Cancel request
 */
//$begin cancellation
Input.method("cancelCall", function() 
{
    $("#cancel").hide();
    $("#status_label").html("Cancelling...");
    this.toCancel = true;
});
//$end cancellation

/*
 * Shows uploader and hides the form
*/
Input.method("beginQuery", function(formData, jqForm, options) {

    if (this.host.findModule("mdControl").sessionActive) // if there is an active IG session
    {
        alert("Please stop the instance generator and save your results first");
        return false;
    }

	$("#load_area #myform").hide();
	$("#load_area").append('<div id="preloader"><img id="preloader_img" src="/images/preloader.gif" alt="Loading..."/><span id="status_label">Loading and processing...</span><button id="cancel">Cancel</button></div>');	
    $("#cancel").click(this.cancelCall.bind(this));//&line [cancellation]
    this.host.findModule("mdControl").disableAll();

    return true; 
});

// post-submit callback 
Input.method("endQuery", function()  { 
	$("#preloader").remove();
	$("#load_area #myform").show();

    $("#claferFileURL").val(""); // empty the URL
	
	return true;
});

//&begin [polling,instanceProcessing]
Input.method("onPoll", function(responseObject)
{
	//&begin handleError
    if (!responseObject)
    {
        this.handleError(null, "empty_argument", null);
        return;
    }
  //&end handleError
    if (responseObject.args)
    {
        this.host.print("ClaferIDE> clafer " + responseObject.args + "\n");
    }

    if (responseObject.message == "Working")
    {
        this.pollingTimeoutObject = setTimeout(this.poll.bind(this), this.pollingDelay);
    }
    else // finished 
    {   
        if (responseObject.compiled_formats)
        {
            this.host.findModule("mdCompiledFormats").setResult(responseObject.compiled_formats);
        }

        if (responseObject.model != "")
        {
            this.editor.getSession().setValue(responseObject.model);
        }

        this.host.print("Compiler> " + responseObject.message + "\n");
        this.host.print(responseObject.compiler_message + "\n");    

        if (responseObject.message == "Success")
        {
            this.host.findModule("mdControl").resetControls();
        }
        else
        {
            this.host.findModule("mdControl").disableAll(); // if exited IG, then disable controls
        }

        this.endQuery();
    }
});        
//&end [instanceProcessing]
Input.method("poll", function()
{
    var options = new Object();
    options.url = "/poll";
    options.type = "post";
    options.timeout = this.pollingTimeout;//&line timeout
    if (!this.toCancel)
        options.data = {windowKey: this.host.key, command: "ping"};
    else
        options.data = {windowKey: this.host.key, command: "cancel"};//&line cancellation
    
    options.success = this.onPoll.bind(this);
    options.error = this.handleError.bind(this);

    $.ajax(options);
});

Input.method("fileSent", function(responseText, statusText, xhr, $form)  { 
    this.toCancel = false;

    if (responseText == "error")
    {
        this.handleError(null, "compile_error", null);
        return;
    }

    if (responseText != "no clafer file submitted")
    {
        this.host.print("ClaferIDE> Processing the submitted model. Compiling...\n");

        var data = new Object();
        data.message = responseText;
        this.pollingTimeoutObject = setTimeout(this.poll.bind(this), this.pollingDelay);
    }
    else
    {
        this.endQuery(); // else enable the form anyways
//        this.setClaferModelHTML(this.host.findModule("mdCompiledFormats").lastModel);
    }
});
//&end polling
	//&begin [handleError]
Input.method("handleError", function(response, statusText, xhr)  { 
	clearTimeout(this.pollingTimeoutObject);
	var er = document.getElementById("error_overlay");
	er.style.display = "block";	
    var caption;

    if (statusText == "compile_error")
        caption = "<b>Compile Error.</b><br>Please check whether Clafer Compiler is available, and the model is correct.";
    else if (statusText == "timeout")//&line timeout
        caption = "<b>Request Timeout.</b><br>Please check whether the server is available.";//&line timeout
//    else if (statusText == "malformed_output")
//        caption = "<b>Malformed output received from ClaferMoo.</b><br>Please check whether you are using the correct version of ClaferMoo. Also, an unhandled exception is possible.  Please verify your input file: check syntax and integer ranges.";        
//    else if (statusText == "malformed_instance")
//        caption = "<b>Malformed instance data received from ClaferMoo.</b><br>An unhandled exception may have occured during ClaferMoo execution. Please verify your input file: check syntax and integer ranges.";        
//    else if (statusText == "empty_instances")
//        caption = "<b>No instances returned.</b>Possible reasons:<br><ul><li>No optimal instances, all variants are non-optimal.</li><li>An unhandled exception occured during ClaferMoo execution. Please verify your input file: check syntax and integer ranges.</li></ul>.";        
//    else if (statusText == "empty_argument")
//        caption = "<b>Empty argument given to processToolResult.</b><br>Please report this error.";        
//    else if (statusText == "empty_instance_file")
//        caption = "<b>No instances found in the specified file.";        
//    else if (statusText == "optimize_first")
//        caption = "<b>You have to run optimization first, and only then add instances.";        
    else if (statusText == "error" && response.responseText == "")
        caption = "<b>Request Error.</b><br>Please check whether the server is available.";        
    else
        caption = '<b>' + xhr + '</b><br>' + response.responseText.replace("\n", "<br>");
    
	document.getElementById("error_report").innerHTML = ('<span id="close_error" alt="close">Close Message</span><p>' + caption + "</p>");
	document.getElementById("close_error").onclick = function(){ 
		document.getElementById("error_overlay").style.display = "none";
	};
	this.endQuery();
    
});
	//&end [handleError]
Input.method("onSubmit", function(){
    if (this.pollingTimeoutObject)
        clearTimeout(this.pollingTimeoutObject);
});
//&begin selectionOfExamples
Input.method("submitFileCall", function(){

    $("#exampleURL").val(null);
    $("#exampleFlag").val("0");
    this.onSubmit();
});

Input.method("submitExampleCall", function(){
    $("#exampleFlag").val("1");
    this.onSubmit();
});

Input.method("submitTextCall", function(){
    $("#claferText").val(this.editor.getValue());
    $("#exampleFlag").val("2");
    this.onSubmit();
});

Input.method("exampleChange", function(){
    if ($("#exampleURL").val())
    {
        $("#submitExample").removeAttr("disabled");
    }
    else
    {
 		$("#submitExample").attr("disabled", "disabled");       
    }
});
//&end selectionOfExamples
Input.method("inputChange", function(){
	var filename = $("#myform [type='file']").val();
    
    if (filename)
    {
        if (filename.substring(filename.length-4) == ".cfr"){
            $("#submitFile").removeAttr("disabled");                    
            $("#submitFile").val("Compile");            
        }  
        else{ // unknown file
            $("#submitFile").val("Unknown");
            $("#submitFile").attr("disabled", "disabled");       
        }
    }
    else{ // no file
        $("#submitFile").attr("disabled", "disabled");       
        $("#submitFile").val("Compile");            
    }
    
});

Input.method("getInitContent", function()
{
    result = '<div id = "load_area" style="height:100%;overflow:hidden">';
    result += '<form id="myform" action="' + this.serverAction + '" method="post" enctype="multipart/form-data" style="display: block; height:100%">';

    result += '<input type="hidden" name="claferFileURL" id="claferFileURL" value="' + this.host.claferFileURL + '">';
    result += '<input type="hidden" name="exampleFlag" id="exampleFlag" value="0">';
    result += '<input type="hidden" id="windowKey" name="windowKey" value="' + this.host.key + '">';//&line windowKey
    result += '<input id="claferText" name="claferText" type="hidden"/>';

    result += '<table width="100%" height="100%" cellspacing="0" cellpadding="0">';    
    result += '<tr height="1em">';
    result += '<td><input type="file" size="20" name="claferFile" id="claferFile" title="If you want to upload your clafer file, select one here "/></td>';
    result += '<td width="60"><input id="submitFile" type="submit" value="Compile" title="Compile the chosen file with Clafer Compiler"/></td>';
	//&begin selectionOfExamples
    result += '<td width="160"><input id="loadExampleInEditor" type="checkbox" name="loadExampleInEditor" value="unchecked" title="If checked, the editor window below will be loaded with a file or an example submitted">Load into editor</input></td>';
    result += '</tr><tr height="1em">';
    result += '<td><select id="exampleURL" style="width:240px" name="exampleURL" title="If you want, you can choose to compile an example clafer model from the list">';   
    
    result += '</select></td>';
    result += '<td><input id="submitExample" type="submit" value="Compile" title="Compile the chosen example using Clafer Compiler"></input></td>';
  //&end selectionOfExamples
    result += '<td style="padding: 0px 2px 0px 2px; border-top: 2px groove threedface; border-left: 2px groove threedface">Scopes: <select id="ss" name="ss" title="Choose a scope computing strategy. Scopes are used for instantiation using bounded model checking">';

    result += '<option value="none" title="Disable scope computing strategy. All scopes are to be set to 1">Disabled</option>';
    result += '<option value="simple" selected="selected" title="Fast computation. Scopes are not precise, but this strategy works in most cases">Fast</option>';
    result += '<option value="full" title="Full computation. This method is very slow, but for small models works relatively fast">Full</option>';

    result += '</select></td>';

    result += '</tr><tr height="1em">';
    result += '<td style="border-top: 2px groove threedface;">';
    //&begin [claferTextEditor]
    result += 'Or enter your model:</td>';
    result += '<td style="border-top: 2px groove threedface; "><input id="submitText" type="submit" value="Compile" title="Compile the contents of the editor below using Clafer Compiler"/></td>';

//    result += '<span class="save_button" id="saveSourceButton"></span>';

    result += '<td style="padding: 0px 2px 0px 2px;border-left: 2px groove threedface">Flags: <input id="args" type="text" style="width:90px;" name="args" value="-k" title="You can specify any additional compilation flags supported by the compiler"></input></td>';

//    result += '</div>';
    result += '</tr><tr height="100%"><td style="height:100%;border-top: 2px groove threedface;padding-bottom:35px;" colspan = "3"><div id="clafer_editor" style="height:100%">';
//    result += '<div style="height: 1px; border-bottom: 2px groove threedface"></div>';

//    result += '<div name="clafer_editor" style="height:400px" id="clafer_editor">';
//    result += '</div>';
	//&end [claferTextEditor]
    result += '</div></td>';

    result += '</tr></table>';

    result += '</form>';

    result += '<div style="position:absolute;bottom:0; left:0;right:0;margin-bottom:-20px;">';
    result += '<div style="height:2px; border-top: 2px groove threedface;"></div>';

    result += 'Optimization backend: <select id="optimizationBackend" style="width:180px" name="optimizationBackend" title=""></select>';

    result += '<input id="useCache" type="checkbox" name="useCache" value="checked">Use Cache</input>';

    result += '</div>';

//    result += '<form id="saveSourceForm" action="/savesource" method="post" enctype="multipart/form-data">';
//    result += '<input type="hidden" name="windowKey" value="' + this.host.key + '"/>';
//    result += '<input type="hidden" name="saveSourceField" id="saveSourceField" value=""></form>';


    $.getJSON('/Examples/examples.json', 
        function(data)
        {
            var examples = data.examples;
            var options = "";
        
            for (var i = 0; i < examples.length; i++)
            {
                var optionClass = 'normal_option';

                if (i == 0)
                    optionClass = 'first_option';

                options += '<option class="' + optionClass + '" value="' + examples[i].url + '">' + examples[i].label + '</option>';
            }
            
            $("#exampleURL").html(options);

        }
    ).error(function() 
        { 
            var optionClass = 'first_option';
            var options = '<option class="' + optionClass + '" value="">Or Choose Example (Could not load examples)</option>';
            $("#exampleURL").html(options);
            
        });

    return result;

});

Input.method("onResize", function() {
    this.editor.resize();
});

function unescapeJSON(escaped) 
{
    return escaped
        .replaceAll('\\\\', '\\')
        .replaceAll('\\"', '"')
        .replaceAll('\\/', '/')
        .replaceAll('\\b', '\b')
        .replaceAll('\\f', '\f')
        .replaceAll('\\n', '\n')
        .replaceAll('\\r', '\r')
        .replaceAll('\\t', '\t');                  
}

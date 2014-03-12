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

function Output(host)
{ 
    this.id = "mdOutput";
    this.title = "Output";
    
    this.width = 300;
    this.height = 500;
    this.posx = 940;
    this.posy = 100;
    
    this.host = host;
    this.content = "";
}

Output.method("getInitContent", function(){
    return '<pre id="output">' + this.content + '</pre>';
});

Output.method("onDataLoaded", function(data){
//    if (data.consoleOut)
//        this.content += data.consoleOut;
});

Output.method("onRendered", function(){
//    $("#mdOutput .window-content").scrollTop($("#mdOutput #output").height());
});

Output.method("getContent", function()
{
    return '<pre id="output">' + this.content + '</pre>';
});
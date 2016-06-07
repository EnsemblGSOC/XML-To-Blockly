/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ 


var xmlParser=new DOMParser();
var xmlDoc;
var elements=[];
var blocks=[];
var blockNames=[];
		
//init function for initializing the Blockly block area
function init(){
	var x=Blockly.inject('blocklyDiv', {
		toolbox: document.getElementById('startBlocks'),
        collapse: true
	});
}
		
//reads the file
function readFile(evt){
	var file=evt.target.files[0];
	var reader=new FileReader();
	reader.readAsText(file);
	reader.onload=function(e){
		console.log(e.target.result);
		xmlDoc=xmlParser.parseFromString(e.target.result,"text/xml");
		handleXML();
	}
}
		
//handles xml by creating blocks as per RNG rules
function handleXML(){
	var root=xmlDoc.documentElement;
	var a;
	
	removeRedundantText(root);
		
	//get all the define blocks in the document and create blocks for them one by one.
	var defineNodes=xmlDoc.getElementsByTagName("define");
	for(var i=0;i<defineNodes.length;i++){
		//fixed color - 295 for define blocks for now.
		createBlocks(defineNodes[i],defineNodes[i].getAttribute("name"), 295);
	}
		
	root=xmlDoc.getElementsByTagName("start")[0];

	var colour=0;
	createBlocks(root,"start",colour);
	
	var script=document.createElement('script');
	script.type="text/javascript";
	for(var i=0;i<blocks.length;i++){
		var resultsData=document.getElementById("results");
		resultsData.innerHTML=resultsData.innerHTML+"<p>"+blocks[i]+"</p>"
		script.text+=blocks[i];
			
		var blocklyXml=document.getElementById('startBlocks');
		console.log(blockNames[i]);
		blocklyXml.innerHTML=blocklyXml.innerHTML+"<block type='"+blockNames[i]+"'></block>";
	}
	document.getElementsByTagName("head")[0].appendChild(script);
			
	init();
}
		
//Removes #text nodes
function removeRedundantText(node){
	var children=node.childNodes;
	for(var i=0;i<children.length;i++){
		if(children[i].nodeName=="#text"){
			//console.log("found text");
			children[i].parentNode.removeChild(children[i]);
			i--;
			continue;
		}else{
			removeRedundantText(children[i]);
		}
	}
}
		
//The name for every child block is sent to it by its parent. The child does not need to find its place in the hierarchy. The parent node does it for all of its children and sends them their name while calling them.
function createBlocks(node, name, colour){
	var children=node.childNodes;
	var blockData="";	//Contains data sent by all the children merged together one after the other.
	var childData=[];	//Keeps track of block data sent by children.
	var childNames=[];	//Keeps track of children block names
			
	for(var i=0;i<children.length;i++){
		if(children[i].nodeName=="text"){
			continue;
		}
		
		var nameAttr=children[i].getAttribute("name");
		
		if(nameAttr==null){
			nameAttr=children[i].nodeName;
		}
		
		nameAttr=nameAttr.substring(0,3);	
				
		//The name for the child is given as <parent name/hierarchy>+<first 3 characters of the child element>+<index of the child as per its parent block>.
		var nameForChild=name+":"+nameAttr+i;
				
		var dataReceivedFromChild=createBlocks(children[i], nameForChild, colour+45);
		blockData+=dataReceivedFromChild;
		childData.push(dataReceivedFromChild);
		childNames.push("block_"+nameForChild);
	}
			
	var nodeType=node.nodeName;
			
	if(nodeType=="element"){
		if(children.length==1 && children[0].nodeName=="text"){
			//data contains data that the current tag will generate.
			var data="this.appendDummyInput().appendField('"+name+"').appendField(new Blockly.FieldTextInput(''),'"+name+"');";
			blockData=data+blockData;
		}else{
			var data="this.appendDummyInput().appendField('"+name+"');";
			blockData=data+blockData;
		}
	}
			
			
	else if(nodeType=="start"){
		var blockName="block_"+name;
		var finalBlock="Blockly.Blocks['"+blockName+"']={init:function(){this.appendDummyInput().appendField('"+name+"');"+blockData+"this.setColour("+colour+");}};";
		blocks.push(finalBlock);
		blockNames.push(blockName);
		return;
	}
			
			
	else if(nodeType=="oneOrMore"){
		var childNamesInFormat="'"+childNames.join("','")+"'";
	
		//Every oneOrMore child has sent in its data. This loop just creates blocks for each child of the oneOrMore tag.
		for(var i=0;i<childData.length;i++){
			var blockName=childNames[i];
			
			var finalBlock="Blockly.Blocks['"+blockName+"']={init:function(){"+childData[i]+"this.setPreviousStatement(true,["+childNamesInFormat+"]);this.setNextStatement(true,["+childNamesInFormat+"]);this.setColour("+colour+");}};";
			blocks.push(finalBlock);
			blockNames.push(blockName);
		}
				
		//console.log("blockly name", node.getAttribute("blockly:name"));
		//This appends to the block which contains the oneOrMore tag and creates a notch there.
		blockData="this.appendStatementInput('"+name+"').setCheck(["+childNamesInFormat+"]).appendField('"+name+"');";
	}
			
	//for choice nodes, we ensure that only one option is selected by keeping no option for setNextStatement for its children.
	else if(nodeType=="choice"){
		var childNamesInFormat="'"+childNames.join("','")+"'";
		//Every choice child has sent in its data. This loop just creates blocks for each child of the oneOrMore tag.
		for(var i=0;i<childData.length;i++){
			var blockName=childNames[i];
			
			var finalBlock="Blockly.Blocks['"+blockName+"']={init:function(){"+childData[i]+"this.setPreviousStatement(true);this.setColour("+colour+");}};";
			blocks.push(finalBlock);
			blockNames.push(blockName);
		}
				
		//This appends to the block which contains the choice tag and creates a notch there.
		blockData="this.appendStatementInput('"+name+"').setCheck(["+childNamesInFormat+"]).appendField('"+name+"');";
	}
			
	//creates define blocks. The define block that is created inly has a notch above and never below. It is the ref code which changes according to whether or not the ref code is in a choice or oneOrMore block.
	else if(nodeType=="define"){
		var blockName="block_"+name;
		var finalBlock="Blockly.Blocks['"+blockName+"']={init:function(){this.appendDummyInput().appendField('"+name+"');this.setColour("+colour+");"+blockData+"this.setPreviousStatement(true);}};";
		blocks.push(finalBlock);
		blockNames.push(blockName);
		return;
	}
			
	//the ref block will have a notch above or below or both according to its parent element. The notch is added to it according to the code written to handle choice and oneOrMore elements.
	else if(nodeType="ref"){
		var correspondingDefineName=node.getAttribute("name");
		var data="this.appendStatementInput('"+name+"').appendField('"+name+"').setCheck('block_"+correspondingDefineName+"');";
		return data;
	}
			
			
	//returns block data to the parent node that had called it
	return blockData;
}
		
//Adds an event listener for detecting whether the user has provided a file as input or not.
document.getElementById("file").addEventListener('change',readFile);
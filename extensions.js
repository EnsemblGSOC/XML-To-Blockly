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

 * ***************************************************************************

    In this file we extend the standard Blockly library with application-specific functionality
    that seems to be core enough to become core extension.
 */


/**
 * Returns the list of all blocks currently inserted&chained into a slot specified by slotName.
 *
 * It is way easier to iterate this way (just one call, and you always get a list, even if empty).
 */
Blockly.Block.prototype.getSlotContentsList = function(slotName) {
    var slotContentsList = [];

    var next = this.getInputTargetBlock(slotName);

    while(next) {
        slotContentsList.push( next );
        next = next.getNextBlock();
    }
    /*
    var firstBlockInConnection = slotName.connection.targetBlock();
    if(firstBlockInConnection != null){
        slotContentsList.push( blockNameToDisplayNameMapper[firstBlockInConnection.type] );//push pretty name to list
        var nextConn = firstBlockInConnection.nextConnection;
        while(nextConn != null){
            if(nextConn.targetConnection == null){
                break;
            } else{
                var currentBlock = nextConn.targetConnection.sourceBlock_;
                slotContentsList.push( blockNameToDisplayNameMapper[currentBlock.type] );  //push pretty name to list
                nextConn = currentBlock.nextConnection;
            }
        }
    }*/

    return slotContentsList;
};

//function to toggle hide/show optiFields
function checker(){
	var source=this.sourceBlock_;
	var checkBoxFieldName=this.name.split("_checkbox")[0]; //the name of the checkbox's dummyInput
	var it = 0;
	var iplist=source.inputList;

	//find out at which position of the inputList of source block, the checkbox is present.
    while(iplist[it].name != checkBoxFieldName){
        it++;
    }

    //if the input field has fieldRow of length, then it means that it's a single level optiField with no special label (label of the attibute/element itself is used)
    /* fieldRow indices:
     * 0 : The unicode design
     * 1 : The checkbox
     * 2 : The text label for the field
     * 3 : The text/dropdown field
     */
    if(iplist[it].fieldRow.length == 4){
        if(this.state_==false){
            iplist[it].fieldRow[2].setVisible(true);
            iplist[it].fieldRow[3].setVisible(true);
            source.render();
        } else{
            iplist[it].fieldRow[2].setVisible(false);
            iplist[it].fieldRow[3].setVisible(false);
            source.render();
        }
    } else{
        it++;
        while(iplist[it].name != checkBoxFieldName+"end_of_optiField"){
            if(this.state_==false){
                iplist[it].setVisible(true);
                source.render();
            } else{
                iplist[it].setVisible(false);
                source.render();
            }
            it++;
        }
    }
}
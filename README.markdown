# IOT Rule Engine - Based on Rete.js

 This repository contains a solution to a Rule Engine based on Rete.js. This rule engine has as objective help user creating their automation rules.
 
 The Rule Engine creates the ***automations.yaml*** file that the users may replace in their Home-Assistant.
 
 ## Basic Flow
 
 It's possible to create in a easy way a flow that can easily be converted to an automation! 
 ![Basic Flow](https://github.com/carlosmlsoares/Whenite/raw/master/Assets/BasicFlow.png)
 In the picture above, we can see a simple flow that is converted to:<br/><br/>
 - **When**:<br/>
    * ChromeCast Escritório change to **'on'**<br/>
 - **If**:<br/>
    * SonOff Escritório is **'off'**<br/>
 - **Then**:<br/>
    * Oposite Test will **'toggle'**<br/>
    * Casa will **'reload'**<br/>
 <br/>
 This is an example so i didn't test this automation
 
 ## Orchestrator
 
 To help the users during the creation of the flow, an orchestrator was added that show how it's going on the creation of the automation.
 The orchestrator from the flow above shown is the following:
 
 ![Orchestrator example](https://github.com/carlosmlsoares/Whenite/raw/master/Assets/Orchestrator.png)
 
 ## Contributors
 
 Carlos Soares | cmsoares@ua.pt    
 Master Thesis Project - Master in Computer Engineering  
 University of Aveiro

 
 ## References
 
 [1] Rete.js - https://rete.js.org/

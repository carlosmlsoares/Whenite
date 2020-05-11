import {
  getAuth,
  getUser,
  callService,
  createConnection,
  subscribeEntities,
  subscribeServices,
ERR_HASS_HOST_REQUIRED
} from "./haws.umd.js"
//from "https://unpkg.com/home-assistant-js-websocket@5.1.0/dist/index.js";

document.getElementById("compile").onclick = function(){compile()};
document.getElementById("savedFiles").onclick = function(){viewLocalStorage()};
document.getElementById("saveButton").onclick = function(){save()};
document.getElementById("uploadButton").onclick = function(){upload()};

var socket = new Rete.Socket('String');
var container = document.querySelector('#rete');
export var editor = new Rete.NodeEditor('demo@0.1.0', container);
var ents;
var servs;

var states={"light":["on","off"],
"switch":["on","off"],
"media_player":["playing","off","on","idle"],
"binary_sensor":["on","off"],
"automation":["on","off"],
"sun":["above_horizon","below_horizon"],
"alarm_control_panel":["disarmed","armed_home","armed_away","armed_night","armed_custom_bypass","pending","triggered","arming","disarming"]
}
var entit=document.getElementById("entities")
var servi=document.getElementById("services")

var VueDropDownControl = {
  props: ['readonly', 'emitter', 'ikey', 'getData', 'putData','idName','lista'],
  template: '<select id="${idName}" al-value="selectedId" @change= "change($event)" ><option></option><option v-for="item in lista">{{item}}</option></select>',
  data() {
    return {
      value: "",
    }
  },
  methods: {
    change(e){
      //console.log(e.target.value);
      this.value = e.target.value;
      this.update();
    },
    update() {
      if (this.ikey)
        this.putData(this.ikey, this.value)
      this.emitter.trigger('process');
    }
  },
  mounted() {
    this.value = this.getData(this.ikey);
  }
}

class DropDownControl extends Rete.Control {

  constructor(emitter, key, readonly,idName,lista) {
    super(key);
    this.component = VueDropDownControl;
    this.lista=lista;
    this.props = { emitter, ikey: key, readonly,idName,lista};

  }
  setValue(val) {
    this.vueContext.value = val;
  }
}

var VueNumControl = {
  props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
  template: '<input style="width:75%;text-align:center" placeholder="eg: >20" type="text" :readonly="readonly" :value="value" @input="change($event)" @dblclick.stop=""/>',
  data() {
    return {
      value: "",
    }
  },
  methods: {
    change(e){
      this.value = e.target.value;
      this.update();
    },
    update() {
      if (this.ikey)
        this.putData(this.ikey, this.value)
      this.emitter.trigger('process');
    }
  },
  mounted() {
    this.value = this.getData(this.ikey);
  }
}

class NumControl extends Rete.Control {

  constructor(emitter, key, readonly) {
    super(key);
    this.component = VueNumControl;
    this.props = { emitter, ikey: key, readonly };
  }

  setValue(val) {
    this.vueContext.value = val;
  }
}

var VueTimeControl = {
  props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
  template: '<input style="width:75%;text-align:center" placeholder="eg: 17:25" type="text" :readonly="readonly" :value="value" @input="change($event)" @dblclick.stop=""/>',
  data() {
    return {
      value: "",
    }
  },
  methods: {
    change(e){
      this.value = e.target.value;
      this.update();
    },
    update() {
      if (this.ikey)
        this.putData(this.ikey, this.value)
      this.emitter.trigger('process');
    }
  },
  mounted() {
    this.value = this.getData(this.ikey);
  }
}

class TimeControl extends Rete.Control {

  constructor(emitter, key, readonly) {
    super(key);
    this.component = VueTimeControl;
    this.props = { emitter, ikey: key, readonly };
  }

  setValue(val) {
    this.vueContext.value = val;
  }
}

var VueWarningControl = {
  props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
  template: '<span style="font-size:12px;color:white">This component can\'t be this type! <i class="fa fa-exclamation-triangle"></i></span>',
  data() {
    return {
      value: "",
    }
  },
  methods: {
    change(e){
      this.value = e.target.value;
      this.update();
    },
    update() {
      if (this.ikey)
        this.putData(this.ikey, this.value)
      this.emitter.trigger('process');
    }
  },
  mounted() {
    this.value = this.getData(this.ikey);
  }
}

class WarningControl extends Rete.Control {

  constructor(emitter, key, readonly) {
    super(key);
    this.component = VueWarningControl;
    this.props = { emitter, ikey: key, readonly };
  }

  setValue(val) {
    this.vueContext.value = val;
  }
}

var CustomNode = {
  template: `<div class="node" :class="[node.name ] | kebab">
  <div class="title" style="text-align:center" >{{node.name}}</div>
  <!-- Controls--><center>
  <div class="control" v-for="control in controls()" v-control="control"></div>
  </center>
  <!-- Outputs-->
  <div style="float:right" class="output" v-for="output in outputs()" :key="output.key">
    <div class="output-title">{{output.name}}</div>
    <Socket v-socket:output="output" type="output" :socket="output.socket"></Socket>
  </div>
  <!-- Inputs-->
  <div class="input" v-for="input in inputs()" :key="input.key">
    <Socket v-socket:input="input" type="input" :socket="input.socket"></Socket>
    <div class="input-title" v-show="!input.showControl()">{{input.name}}</div>
    <div class="input-control" v-show="input.showControl()" v-control="input.control"></div>
  </div>
</div>`,
  mixins: [VueRenderPlugin.mixin],
  components: {
    Socket: VueRenderPlugin.Socket
  }
}

class Component extends Rete.Component {

    constructor(name){
        super(name);
        this.data.component = CustomNode;
    }

    builder(node) {
        var out = new Rete.Output('out', "", socket);
        var in1 = new Rete.Input('inp', "", socket,true);
        //return node.addControl(new DropDownControl(this.editor, 'data',false, "drop",lista)).addOutput(out).addInput(in1);
        return node.addOutput(out).addInput(in1);
    }

    worker(node, inputs, outputs) {
        outputs['out'] = node.data.num;
        //onWorkerDone(node)
    }


}

//ORCHESTRATOR TO PREVIEW HOW AUTOMATION IS GOING
var orchestrator=window.setInterval(function(){

  var addToActions=""
  var addToConditions=""
  var addToTriggers=""
  for (var n=0;n<editor.nodes.length;n++){
    var node=editor.nodes[n]
    //console.log(node)
    var nodeName=editor.nodes[n].name
    var noInputs=node.toJSON()["inputs"]["inp"]['connections'].length
    var noOutputs=node.toJSON()["outputs"]["out"]['connections'].length

    if (noInputs>0 && noOutputs==0){
      //actioner
      var data="..."
      if (node["data"]["data"]===undefined){
        data="..."
      }else {
        data=node["data"]["data"]
      }
      addToActions+= "\""+nodeName+"\" will \""+data+"\"\n"
    }

    if (noInputs==0 && noOutputs>0){
      //trigger
      var data="..."
      if (node["data"]["data"]===undefined){
        data="..."
      }else {
        data=node["data"]["data"]
      }
      addToTriggers+= "\""+nodeName+"\" state is \""+data+"\"\n"
      }
    if (noInputs>0 && noOutputs>0){
      //condition
      var data="..."
      if (node["data"]["data"]===undefined){
        data="..."
      }else {
        data=node["data"]["data"]
      }
      addToConditions+= "\""+nodeName+"\" is \""+data+"\"\n"
    }
  }
  document.getElementById("previewActions").textContent=addToActions;
  document.getElementById("previewTriggers").textContent=addToTriggers;
  document.getElementById("previewConditions").textContent=addToConditions;
},200)

login();

//LOGIN TO HASSIO
function login(){

    (async () => {
      let auth;
      try {
        auth = await getAuth();
      } catch (err) {
        if (err === ERR_HASS_HOST_REQUIRED) {
          var hassUrl;
          var freqIP=getCookie("freqIP")
          console.log(freqIP)
          if (freqIP!=""){

            hassUrl = prompt(
              "What host to connect to?",
              freqIP
            );
          }else{
            hassUrl = prompt(
              "What host to connect to?",
              "https://YOURHAIPADDRESS:8123"
            );
            setCookie("freqIP",hassUrl,30)
          }

          if (!hassUrl) return;
          //var hassUrl=document.getElementById('hassioIP').textContent;
          auth = await getAuth({hassUrl});
        } else {
          alert(`Unknown error: ${err}`);
          return;
        }
      }
      // To play from the console
      const connection = await createConnection({ auth });
      subscribeEntities(connection, entities =>
        renderEntities(connection, entities)
      );
      subscribeServices(connection, services =>
        renderServices(connection, services)
      );

      window.auth = auth;
      window.connection = connection;
      getUser(connection).then(user => {});

      if (location.search.includes("auth_callback=1")) {
          history.replaceState(null, "", location.pathname);
      }

      function renderServices(connection, services) {
        servi.textContent=JSON.stringify(services);
        servi.style.visibility="hidden"
      }

      function renderEntities(connection, entities) {
        entit.textContent=JSON.stringify(entities);
        entit.style.visibility="hidden"
      }
      document.getElementById("loadingScreen").style.display = "none";
      setTimeout(function(){
      update()
    },500)
  })();
}

//INIT EDITOR
function update(){

  document.getElementById("openModal").style.display = "block";
  document.getElementById("saveButton").style.display = "block";
  document.getElementById("savedFiles").style.display = "block";
  document.getElementById("uploadButton").style.display = "block";

  (async () => {

      var components=[]
      var devices=[]
      var entities=JSON.parse(entit.textContent);
      ents=entities
      servs=JSON.parse(servi.textContent);

      var keys = Object.keys(entities)
      var groups=[]
      keys.forEach(key => {
        groups.push(key.split(".")[0])
      });
      groups.sort();


      keys.forEach(key => {
        if (typeof entities[key]["attributes"]["friendly_name"] === "undefined") {
        }
        else{
            if (devices.includes(entities[key]["attributes"]["friendly_name"])){

            }else{
            devices.push(entities[key]["attributes"]["friendly_name"])
          }
        }
      });

      devices.sort()
      editor.use(ConnectionPlugin.default);
      editor.use(VueRenderPlugin);
      editor.use(ContextMenuPlugin, {
          searchBar: true, // true by default
          delay: 100,
          allocate(component) {
              groups.sort()
              for (var i=0;i<groups.length;i++){
                if(component.name=="Time Clock"){
                  return ['Others'];
                }else{
                  if (getDevice(component.name).split(".")[0]==groups[i]){
                    return[capitalize(groups[i])]
                  }
                }

              }
              return ['Others'];
              function capitalize(string)
              {
                  return string.charAt(0).toUpperCase() + string.slice(1);
              }



          },
          rename(component) {
              return component.name;
          }


      });

      editor.use(AreaPlugin);

      editor.use(DockPlugin.default, {
        container:document.querySelector('.dock'),
        itemClass: 'dock-item', // default: dock-item
        plugins: [VueRenderPlugin] // render plugins
      });

      devices.forEach(element => {
        components.push(new Component(element));
      });


      components.push(new Component("Time Clock"))

      var engine = new Rete.Engine('demo@0.1.0');

      components.map(c => {
          editor.register(c);
          engine.register(c);
      });

      editor.on('zoom', ({ source }) => {
      return source !== 'dblclick';
      });

      editor.on('connectioncreated connectionremoved', async()=>{
        updateNodes()
      })


      editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {

          await engine.abort();
          await engine.process(editor.toJSON());

      });

      editor.view.resize();

      AreaPlugin.zoomAt(editor);
      editor.trigger('process');
      //document.getElementById("loadingScreen").style.display = "none";
})();
}

//UPDATE NODES WHEN A CONNECTION IS CREATED
function updateNodes(){

    var nodes=editor.nodes;
    (function theLoop (nodes,i) {
        setTimeout(function () {
          //console.log(nodes[i]["name"] + " is on the loop");
          var node=nodes[i]
          var nodeName=nodes[i]["name"]
          var noInputs=node.toJSON()["inputs"]["inp"]['connections'].length
          var noOutputs=node.toJSON()["outputs"]["out"]['connections'].length
          //console.log(nodeName + " has "+noInputs+" inputs and "+ noOutputs + " outputs")
          if (noInputs==0 && noOutputs==0){
            if(node.vueContext["$el"].classList.contains("action")){node.vueContext["$el"].classList.remove("action")}
            if(node.vueContext["$el"].classList.contains("if")){node.vueContext["$el"].classList.remove("if")}
            if(node.vueContext["$el"].classList.contains("trigger")){node.vueContext["$el"].classList.remove("trigger")}
            if (node.controls.get("data")===undefined){
            }else{
              node.removeControl(node.controls.get("data"))
              node.update();
            }

          }

          if (noInputs==0 && noOutputs>0){
            //trigger
            if(node.vueContext["$el"].classList.contains("action")){node.vueContext["$el"].classList.remove("action")}
            if(node.vueContext["$el"].classList.contains("if")){node.vueContext["$el"].classList.remove("if")}
            node.vueContext["$el"].classList.add("trigger")
            //console.log(nodeName+" is a trigger")
            var lista =[];
            for (var k in ents){
               var friendly_name = ents[k]["attributes"]["friendly_name"]
                if(friendly_name == nodeName){
                  var entities=Object.keys(ents)
                  var stt=Object.keys(states)
                  for (var a in stt){
                      var group = stt[a]
                      //console.log(ents[k]["entity_id"].split(".")[0])
                      if(group==ents[k]["entity_id"].split(".")[0]){
                          states[ents[k]["entity_id"].split(".")[0]].forEach(element => {
                              lista.push(element)
                          });
                      }
                  }
                }
              }


              if (node.controls.get("data")===undefined){
                if (node.name=="Time Clock"){
                  var newControl = new TimeControl(editor, 'data');
                  node.addControl(newControl)
                  node.update();
                  editor.trigger('process');
                }else{
                  if(getDevice(node.name).split(".")[0]=="sensor"){
                    var newControl = new NumControl(editor, 'data');
                    node.addControl(newControl)
                    node.update();
                    editor.trigger('process');
                  }
                  else{
                    var newControl;
                    if(lista.length==0){
                      newControl= new WarningControl(editor, 'data');
                    }else{
                      newControl = new DropDownControl(editor, 'data',false, "drop",lista);
                    }
                    node.addControl(newControl)
                    node.update();
                    editor.trigger('process');

                  }
                }
              }else{
                node.removeControl(node.controls.get("data"))
                node.update();
                setTimeout(function(){
                  if (node.name=="Time Clock"){
                    var newControl = new TimeControl(editor, 'data');
                    node.addControl(newControl)
                    node.update();
                    editor.trigger('process');
                  }else{
                    if(getDevice(node.name).split(".")[0]=="sensor"){
                      var newControl = new NumControl(editor, 'data');
                      node.addControl(newControl)
                      node.update();
                      editor.trigger('process');
                    }
                    else{
                      var newControl;
                      if(lista.length==0){
                        newControl= new WarningControl(editor, 'data');
                      }else{
                        newControl = new DropDownControl(editor, 'data',false, "drop",lista);
                      }
                      node.addControl(newControl)
                      node.update();
                      editor.trigger('process');
                    }
                  }
              },50);
            }
          }

          if (noInputs>0 && noOutputs>0){
            //condition
            if(node.vueContext["$el"].classList.contains("action")){node.vueContext["$el"].classList.remove("action")}
            if(node.vueContext["$el"].classList.contains("trigger")){node.vueContext["$el"].classList.remove("trigger")}
            node.vueContext["$el"].classList.add("if")
            var lista =[];
            for (var k in ents){
               var friendly_name = ents[k]["attributes"]["friendly_name"]
                if(friendly_name == nodeName){
                  var entities=Object.keys(ents)
                  var stt=Object.keys(states)
                  for (var a in stt){
                      var group = stt[a]
                      //console.log(ents[k]["entity_id"].split(".")[0])
                      if(group==ents[k]["entity_id"].split(".")[0]){
                          states[ents[k]["entity_id"].split(".")[0]].forEach(element => {
                              lista.push(element)
                          });
                      }
                  }
                }
              }

              if (node.controls.get("data")===undefined){
                if (node.name=="Time Clock"){
                  var newControl = new WarningControl(editor, 'data');
                  node.addControl(newControl)
                  node.update();
                  editor.trigger('process');
                }else{
                  if(getDevice(node.name).split(".")[0]=="sensor"){
                    var newControl = new NumControl(editor, 'data');
                    node.addControl(newControl)
                    node.update();
                    editor.trigger('process');
                  }
                  else{
                    var newControl;
                    if(lista.length==0){
                      newControl= new WarningControl(editor, 'data');
                    }else{
                      newControl = new DropDownControl(editor, 'data',false, "drop",lista);
                    }
                    node.addControl(newControl)
                    node.update();
                    editor.trigger('process');
                  }
                }
              }else{
                node.removeControl(node.controls.get("data"))
                node.update();
                setTimeout(function(){
                  if (node.name=="Time Clock"){
                    var newControl = new WarningControl(editor, 'data');
                    node.addControl(newControl)
                    node.update();
                    editor.trigger('process');
                  }else{
                    if(getDevice(node.name).split(".")[0]=="sensor"){
                      var newControl = new NumControl(editor, 'data');
                      node.addControl(newControl)
                      node.update();
                      editor.trigger('process');
                    }
                    else{
                      var newControl;
                      if(lista.length==0){
                        newControl= new WarningControl(editor, 'data');
                      }else{
                        newControl = new DropDownControl(editor, 'data',false, "drop",lista);
                      }
                      node.addControl(newControl)
                      node.update();
                      editor.trigger('process');
                    }
                  }
              },50);
            }
            }

          if (noInputs>0 && noOutputs==0){
            //actioner
            if(node.vueContext["$el"].classList.contains("if")){node.vueContext["$el"].classList.remove("if")}
            if(node.vueContext["$el"].classList.contains("trigger")){node.vueContext["$el"].classList.remove("trigger")}
            node.vueContext["$el"].classList.add("action")
            var lista=[]
            for (var k in ents){
               var friendly_name = ents[k]["attributes"]["friendly_name"]
                if(friendly_name == nodeName){
                  var ser=k.split(".")[0];
                  for (var serv in servs){
                    if (ser == serv){
                      var s = Object.keys(servs[ser]);
                      for (var l=0;l<s.length;l++){
                        lista.push(s[l])
                      }
                    }
                  }
                };
              }

              if (node.controls.get("data")===undefined){
                if (node.name=="Time Clock"){
                  var newControl = new WarningControl(editor, 'data');
                  node.addControl(newControl)
                  node.update();
                  editor.trigger('process');
                }else{
                  if(getDevice(node.name).split(".")[0]=="sensor"){
                    var newControl = new WarningControl(editor, 'data');
                    node.addControl(newControl)
                    node.update();
                    editor.trigger('process');
                  }
                  else{
                    var newControl;
                    if(lista.length==0){
                      newControl= new WarningControl(editor, 'data');
                    }else{
                      newControl = new DropDownControl(editor, 'data',false, "drop",lista);
                    }
                    node.addControl(newControl)
                    node.update();
                    editor.trigger('process');
                  }
                }
              }else{
                node.removeControl(node.controls.get("data"))
                node.update();
                setTimeout(function(){
                  if (node.name=="Time Clock"){
                    var newControl = new WarningControl(editor, 'data');
                    node.addControl(newControl)
                    node.update();
                    editor.trigger('process');
                  }else{
                    if(getDevice(node.name).split(".")[0]=="sensor"){
                      var newControl = new WarningControl(editor, 'data');
                      node.addControl(newControl)
                      node.update();
                      editor.trigger('process');
                    }
                    else{
                      var newControl;
                      if(lista.length==0){
                        newControl= new WarningControl(editor, 'data');
                      }else{
                        newControl = new DropDownControl(editor, 'data',false, "drop",lista);
                      }
                      node.addControl(newControl)
                      node.update();
                      editor.trigger('process');
                    }
                  }
              },50);
            }
          }


          // DO SOMETHING WITH data AND stuff
          if (i--) {
            theLoop(nodes,i);  // Call the loop again
          }
        }, 100);
      })(nodes,nodes.length-1);

  }

// GENERATE FILE TO DOWNLOAD
function compile(){

  var json = editor.toJSON();
  var nodes=[];
  for (node in json.nodes){
    nodes.push(json.nodes[node])
  }

  var triggerNodes=[]
  var actionNodes=[]
  var conditionNodes=[]
  for(node in nodes){
    var node = nodes[node]

    var inputs= node['inputs']
    var outputs=node['outputs']
    var trigger=false;
    var condition=false;
    var action=false;

    //Verify type of node, if it's trigger, Conditioner or Actioner
    for (var input in inputs){
      var numberConns = inputs[input]['connections'].length

      if(numberConns >0){action=true}
    }
    for (var output in outputs){
      var numberConns = outputs[output]['connections'].length
      if(numberConns >0){trigger=true}
    }
    if (trigger==true && action==true){
      condition=true;
      conditionNodes.push(node);
    }
    if (trigger==true && action==false){
      triggerNodes.push(node);
    }
    if (trigger==false && action==true){
      actionNodes.push(node);
    }
  }

  generateFile(triggerNodes,conditionNodes,actionNodes);

};

// SHOW SAVED AUTOMATIONS
function viewLocalStorage(){
  document.getElementById('listOfAutomations').textContent=""
 $('#localStorageModal').modal('show')
 if(Object.keys(localStorage).length==0){
   document.getElementById('listOfAutomations').textContent="There's no saved diagrams."
 }else{
   Object.keys(localStorage).forEach(automation => {
     var span = document.createElement("span");
     span.innerHTML = automation+"  ";
     span.style.width="50px"
     document.getElementById('listOfAutomations').appendChild(span)
     var btn = document.createElement("BUTTON");
     btn.innerHTML = "<i class=\"fa fa-download\"></i>";
     btn.style.borderRadius="10%";
     btn.classList.add("btn")
     btn.classList.add("btn-link")
     btn.onclick=function(){saveItem(automation)}
     document.getElementById('listOfAutomations').appendChild(btn)
     var linebreak = document.createElement("br");
     var space = document.createElement("span");
     space.innerHTML="</br>"
     document.getElementById('listOfAutomations').appendChild(linebreak);
     document.getElementById('listOfAutomations').appendChild(space);
   });

 }
}

// SAVE SPECIFIC AUTOMATION
function saveItem(automation){
  var element = document.createElement('a');
  var text=localStorage.getItem(automation)
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', automation+".json");

  element.style.display = 'none';
  document.getElementById("aux").appendChild(element);

  element.click();

  document.getElementById("aux").removeChild(element);
}

// UPLOAD DIAGRAM TO LOCAL STORAGE
function save(){
  var json= editor.toJSON();
  var text=JSON.stringify(json)

  var name = prompt(
    "What name you want to your automation?",
    "..."
  );
  localStorage.setItem(name,text)

  $('#saveModal').modal("show")
  /*var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', "automation.json");

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);*/
}

// UPLOAD FROM FILE
function upload(){
    var input=document.createElement('input');
    input.type="file";
    input.style.visibility="hidden"
    document.getElementById('target_div').appendChild(input);
    input.addEventListener('change', readFileAsString)
    setTimeout(function(){
        $(input).click();
    },100);
}

// AUX FUNCTION
function readFileAsString() {
    var files = this.files;
    if (files.length === 0) {
        console.log('No file is selected');
        return;
    }

    var reader = new FileReader();
    var json="";
    reader.onload = function(event) {
        //console.log(event.target.result);
        json=JSON.parse(event.target.result)
    };
    setTimeout(function(){
      console.log(json)
      editor.fromJSON(json)
    },300)

    reader.readAsText(files[0]);
}

// CREATE YAML FILE
function generateFile(triggers,conditions,actions) {

  var text="- id: \'"+Math.floor(Math.random()*90000000000000  + 10000000000000)+"\'\n"
  text+="  alias: "+ document.getElementById("alias").value +"\n";
  text+="  description: "+ document.getElementById("description").value +"\n";
  text+="  trigger: ";
  if (triggers.length==0){
    text+="[]\n"
  }
  else{
    text+="\n";
    triggers.forEach(element => {
      if (element["name"]=="Time Clock"){
        text+="  - at: \'"+element["data"]["data"]+"\'\n";
        text+="    platform: time\n";
      }else if (getDevice(element["name"]).split(".")[0]=="sensor"){
        if(element["data"]["data"].charAt(0)=="<"){
          text+="  - below: \'"+element["data"]["data"].slice(1)+"\'\n";
        }else{
          text+="  - above: \'"+element["data"]["data"].slice(1)+"\'\n";
        }
        text+="    entity_id: "+getDevice(element["name"])+"\n";
        text+="    platform: numeric_state\n";

      }else{
        text+="  - entity_id: "+getDevice(element["name"])+"\n";
        text+="    platform: state\n";
        text+="    to: \""+element["data"]["data"]+"\"\n";
      }

    });
  }

  text+="  condition: ";
  if (conditions.length==0){
    text+="[]\n"
  }
  else{
    text+="\n";
    conditions.forEach(element => {
      if (getDevice(element["name"]).split(".")[0]=="sensor"){
        if(element["data"]["data"].charAt(0)=="<"){
          text+="  - below: \'"+element["data"]["data"].slice(1)+"\'\n";
        }else{
          text+="  - above: \'"+element["data"]["data"].slice(1)+"\'\n";
        }
        text+="    condition: numeric_state\n";
        text+="    entity_id: "+getDevice(element["name"])+"\n";
      }else{
        text+="  - condition: state\n"
        text+="    entity_id: "+ getDevice(element["name"])+"\n"
        text+="    state: \'"+element["data"]["data"]+"\'\n"
      }

    });
  }

  text+="  action: ";
  if (actions.length==0){
    text+="[]\n"
  }
  else{
    text+="\n";
    actions.forEach(element => {
      text+="  - data: {}\n";
      text+="    entity_id: "+ getDevice(element["name"])+"\n";
      text+="    service: "+ getDevice(element["name"]).split(".")[0]+"."+element["data"]["data"]+"\n";
    });
  }

  document.getElementById('code').textContent=text
  document.getElementById('result').style.display="block"

}

// GET ENTITY ID FROM NAME
function getDevice(name){

  for (var entity in ents){
    var friendly_name = ents[entity]["attributes"]["friendly_name"]
    if (friendly_name==name){
      //console.log(ents[entity]["entity_id"])
      return ents[entity]["entity_id"]
    }
  }
}

// SET COOKIE
function setCookie(cname,cvalue,exminutes) {
  var d = new Date();
  d.setTime(d.getTime() + (exminutes*60*24*60*1000));
  var expires = "expires=" + d.toGMTString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

// GET COOKIE
function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

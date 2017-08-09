import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

var picker ;
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}
var timerPing;
var timePong;
var ws;
var lastMessage="";
var defaultIp="192.168.1.200"
CurrentIp = new Ground.Collection('CurrentIp', { connection: null });
Template.main.onRendered(function helloOnCreated() {
  $(".modal-color-picker").attr("style","opacity:1");
  $(".modal-color-picker").hide();
  $(".modal-metric").attr("style","opacity:1");
  $(".modal-metric").hide();
  $(".modal-setIp").attr("style","opacity:1");
  $(".modal-setIp").hide();
  $(".content").attr("style","opacity:1");
  $(".content").hide();

  $(".loading").hide();
  $(".content").fadeIn();
  picker = new CP(document.querySelector('#color-picker'),false);
  picker.on("change", function(color) {
      color =CP.HEX2RGB(color);
      if(ws.readyState==1){
        if($($(document).find(".element-chain")[0]).hasClass("selected")){
          var message1 = "@0&#R" + color[0] + "G" + color[1] + "B" + color[2] + "S0|";
          var message2 = "@1&#R" + color[0] + "G" + color[1] + "B" + color[2] + "S0|";
          ws.send(message1);
          ws.send(message2);
          sleep(250);
        }
        else{
          var message = "@" + $($(document).find(".element-menu-item.selected")[0]).attr("id")  + "&#R" + color[0] + "G" + color[1] + "B" + color[2] + "S" + $($(document).find(".element-menu-item.selected")[0]).attr("data-id") +  "|";
          if(message != lastMessage){
              ws.send(message);
              sleep(250);
              lastMessage=message;
          }


        }


      }

  });
  createWebsocketConnection();
});
//
// Template.hello.helpers({
//   counter() {
//     return Template.instance().counter.get();
//   },
// });
//
Template.main.events({
  'click .modal-color-picker'(event, instance) {
     $(event.target.closest("#modal-holder")).hide();
     picker.exit();
     if(ws.readyState==1){
       ws.send(lastMessage);
     }
   },
  'click .modal'(event, instance) {
      event.stopPropagation();

  },
  'click #btn-color-picker'(event, instance) {
      $(".modal-color-picker").show();
      picker.enter();
      picker.fit();
  },
  'click #btn-effects'(event, instance) {
      $(".modal-effects").show();
  },
  'click .menu-app-bar'(event, instance) {
      $(".modal-metric").show();
  },
  'click .modal-metric'(event, instance) {
    $(event.target.closest("#modal-holder")).hide();
      // $(".modal").closest("div").hide();
  },
  'click .social-button'(event, instance) {
    $(document).find(".social-button.selected").removeClass("selected");
    var target =   $(event.target).closest(".social-button");
    target.addClass("selected");
    var message = "@7&;" + target.attr("id") + "|";
    ws.send(message);
    lastMessage = message;
  },
  'click .action'(event, instance) {
    var target =   $(event.target).closest(".action");
    if($($(document).find(".element-chain")[0]).hasClass("selected")){
      var message1="@0&;" + target.attr("id") + "S0|";
      var message2="@1&;" + target.attr("id") + "S0|";
      ws.send(message1);
      ws.send(message2);
    }
    else{
      var message = "@" + $($(document).find(".element-menu-item.selected")[0]).attr("id")  + "&;" + target.attr("id") + "S" + $($(document).find(".element-menu-item.selected")[0]).attr("data-id") +  "|";
      ws.send(message);
      lastMessage = message;
    }

  },
  'click .element-menu-item'(event, instance) {
    $(document).find(".element-menu-item.selected").removeClass("selected");
    $(event.target).closest(".element-menu-item").addClass("selected");
    var currentImage=$(document).find(".current-element-image");
    currentImage.attr("src",$(event.target).attr("src"));
      // $(".modal").closest("div").hide();
  },
  'click .element-chain'(event, instance) {
    var target = $(event.target).closest(".element-chain") ;
    if(target.hasClass("selected")){
      target.removeClass("selected");
    }
    else{
      target.addClass("selected");
    }

  },
  'click .app-bar-logo'(event, instance) {
    $(".modal-setIp").show();
    var currentIp = CurrentIp.find().fetch()[0];
    console.log(CurrentIp.find().fetch())
    if(currentIp != undefined ){
      $("#ip1").val(currentIp.ip.ip1);
      $("#ip2").val(currentIp.ip.ip2);
      $("#ip3").val(currentIp.ip.ip3);
      $("#ip4").val(currentIp.ip.ip4);
    }
  },
  'click .modal-setIp'(event, instance) {
    $(event.target.closest("#modal-holder")).hide();
      // $(".modal").closest("div").hide();
  },
  'click .button-ip'(event, instance) {
    CurrentIp.clear();
    CurrentIp.insert(
      {ip:
        {ip1:$('#ip1').val(),
        ip2:$('#ip2').val(),
        ip3:$('#ip3').val(),
        ip4:$('#ip4').val()}
      },function(e,a){
         createWebsocketConnection();
      });

  },
});

function createWebsocketConnection(){
  var ip = CurrentIp.find().fetch()[0];
  if(ip==undefined){
    ip = defaultIp;
  }
  else{
    ip = ip.ip.ip1 + "." +ip.ip.ip2 + "." +ip.ip.ip3 + "." +ip.ip.ip4;
  }
  ws = new WebSocket('ws://' + ip +':82');
  ws.onopen = function()
  {
     // Web Socket is connected, send data using send()
     ws.send("{'Device':{'name':'mobile','macAddress':'mobile','owner':'mobile'}}");
  };

  ws.onmessage = function (evt)
  {
     var received_msg = evt.data;
     if(received_msg=="Connected"){
       $(".loading").hide();
       $(".content").fadeIn();
     }
     else if(received_msg=="!"){
       ws.send("ping");
       timerPing= performance.now();
     }
     else if (received_msg=="pong") {
        timerPong= performance.now();
        console.log((timerPong-timerPing)+"ms");
     }
     //console.log(received_msg);
  };

  ws.onclose = function()
  {
     // websocket is closed.
     console.log("Connection is closed...");
  };
}

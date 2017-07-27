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
Template.main.onRendered(function helloOnCreated() {
  $(".modal-color-picker").attr("style","opacity:1");
  $(".modal-color-picker").hide();
  $(".modal-metric").attr("style","opacity:1");
  $(".modal-metric").hide();
  $(".content").attr("style","opacity:1");
  $(".content").hide();
  picker = new CP(document.querySelector('#color-picker'),false);
  picker.on("change", function(color) {
      color =CP.HEX2RGB(color);
      if(ws.readyState==1){
        var message = "@" + $($(document).find(".element-menu-item.selected")[0]).attr("id")  + "&#R" + color[0] + "G" + color[1] + "B" + color[2] + "S" + $($(document).find(".element-menu-item.selected")[0]).attr("data-id") +  "|";
        if(message != lastMessage){
            ws.send(message);
            sleep(250);
            lastMessage=message;
        }


      }

  });
    ws = new WebSocket('ws://192.168.15.30:82');
    ws.onopen = function()
    {
       // Web Socket is connected, send data using send()
       console.log();
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
    var message = "@" + $($(document).find(".element-menu-item.selected")[0]).attr("id")  + "&;" + target.attr("id") + "S" + $($(document).find(".element-menu-item.selected")[0]).attr("data-id") +  "|";
    ws.send(message);
    lastMessage = message;
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
});

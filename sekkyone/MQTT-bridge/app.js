var awsIot = require('aws-iot-device-sdk');
var mqtt = require('mqtt');

//
// Replace the values of '<YourUniqueClientIdentifier>' and '<YourCustomEndpoint>'
// with a unique client identifier and custom host endpoint provided in AWS IoT.
// NOTE: client identifiers must be unique within your AWS account; if a client attempts
// to connect with a client identifier which is already in use, the existing
// connection will be terminated.
//
var device = awsIot.device({
   keyPath: "certs/sekkyone1.private.key",
  certPath: "certs/sekkyone1.cert.pem",
    caPath: "certs/root-CA.crt",
  clientId: "SekkyoneTestBridge",
      host: "a2nkqjvyvlcr2i-ats.iot.us-east-1.amazonaws.com"
});

var client = mqtt.connect("mqtt://localhost:1886",{clientId:"mqtt-bridge"});
var topic_to_sn = "sekkyone_in";
var topic_from_sn = "sekkyone_out";

client.on('connect',function(){
    console.log("connected to MQTT-SN broker");
    client.subscribe(topic_from_sn,function(err){
        if(!err){
            console.log("Subscribed to: " + topic_from_sn);
        } else {
            console.log("error subscribing to topic " + topic_from_sn + " : " + err);
        }
    });
});
client.on('error',function(error){
    console.log("Can't connect to RSMB: " + error);
});

client.on('message',function(topic,message){
    console.log("["+topic.toString()+"]"+" received message: \n" + JSON.stringify(JSON.parse(message), null, 4));
    device.publish('sekkyone_from_device', JSON.stringify(JSON.parse(message)));
    console.log("Published to AWS on [sekkyone_from_device]\n");
})

//
// Device is an instance returned by mqtt.Client(), see mqtt.js for full
// documentation.
//
device.on('connect', function() {
    console.log('connected to AWS');
    device.subscribe('sekkyone_from_aws');
  });

device.on('message', function(topic, payload) {
    console.log('Received message', topic, payload.toString());
    client.publish(topic_to_sn, JSON.parse(payload.toString()).message.toString());
  });
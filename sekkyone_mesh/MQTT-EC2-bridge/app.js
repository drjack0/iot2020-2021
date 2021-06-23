//Bridge schema give by AWS official Github repository and SDK

var awsIot = require('aws-iot-device-sdk');
var mqtt = require('mqtt');

//Configuration of certificates, clientID and host endpoint (AWS IoT ARN Endpoint)
//Certificates given directly by AWS with "Create a thing" procedure
var device = awsIot.device({
   keyPath: "certs/sekkyone-iotlab.private.key",
  certPath: "certs/sekkyone-iotlab.cert.pem",
    caPath: "certs/root-CA.crt",
  clientId: "SekkyoneTestBridge-EC2",
      host: "a2nkqjvyvlcr2i-ats.iot.us-east-1.amazonaws.com"
});

//"mqtt" library allows to RSMB connection over 1883 port
var client = mqtt.connect("mqtt://localhost:1886",{clientId:"mqtt-bridge"});
var topic_to_sn = "sekkyone_in";
var topic_from_sn = "sekkyone_out";

//"device" refers to AWS - MQTTBridge communication
//"client" refers to MQTTBridge - RSMB communication

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


device.on('connect', function() {
    console.log('connected to AWS');
    device.subscribe('sekkyone_from_aws');
  });

device.on('error',function(error){
    console.log("ERRORE")
    console.log("Can't connect to AWS: " + error)
})

device.on('message', function(topic, payload) {
    console.log('Received message', topic, payload.toString());
    client.publish(topic_to_sn, JSON.parse(payload.toString()).message.toString());
  });
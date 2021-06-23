# MQTT Bridge
Goal of this script is to permit secure and reliable communication beetween MQTT-SN Broker (Mosquitto.rsmb) and AWS IoT Core Service.
MQTT-SN can't communicate directly with the MQTT gateway for AWS services, so a middle gateway, that collects all the messages published on the SN Broker topic, is needed.

This transparent bridge (this is its name) forward all messages received to the same topic to the MQTT broker configured in the cloud backend application.

The MQTT-Bridge subscribes "sekkyone_from_aws" topic and automatically publish received message to "sekkyone_in". Likewise, when a message is published to "sekkyone_out" topic, subscribed by the Bridge, it's automatically published to "sekkyone_from_device" topic.

The AWS IoT Core MQTT subscribe "sekkyone_from_device" topic and publish on "sekkyone_from_aws" topic.

This is the network schema

![network-digram](../images/network_digram.png)

## Getting Started
First of all, check to have already installed [*npm*](https://www.npmjs.com/) and [*node.js.*](https://nodejs.org/it/)

Clone the main repository, move to MQTT-Bridge folder and create a folder *certs*

```bash
git clone https://github.com/drjack0/iot2020-2021.git
cd sekkyone/MQTT-bridge
mkdir certs
```

Now, [follow this tutorial]() for generate AWS certificates and getting started with AWS IoT Core. These files must be copied in *certs* folder and *app.js* code must be modified for your certs name [(*more info here*)](https://github.com/aws/aws-iot-device-sdk-js).

Finally, run <code>npm install</code> for installing dependencies and node_modules. Then,for starting the bridge-script, type <code>npm start</code>
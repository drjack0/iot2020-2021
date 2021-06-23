# MQTT Bridge
Goal of this script is to permit secure and reliable communication beetween MQTT-SN Broker (Mosquitto.rsmb) and AWS IoT Core Service.
MQTT-SN can't communicate directly with the MQTT gateway for AWS services, so a middle gateway, that collects all the messages published on the SN Broker topic, is needed.

This transparent bridge (this is its name) forward all messages received to the same topic to the MQTT broker configured in the cloud backend application.

The MQTT-Bridge subscribes "sekkyone_from_aws" topic and automatically publish received message to "sekkyone_in". Likewise, when a message is published to "sekkyone_out" topic, subscribed by the Bridge, it's automatically published to "sekkyone_from_device" topic.

The AWS IoT Core MQTT subscribe "sekkyone_from_device" topic and publish on "sekkyone_from_aws" topic.

This script runs on an EC2 machine in AWS environment, for more complete informations on how to configure it, consult the [page relating to its operation](https://github.com/drjack0/iot2020-2021/tree/main/sekkyone/MQTT-bridge).

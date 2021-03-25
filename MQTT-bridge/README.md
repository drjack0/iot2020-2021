# MQTT Bridge
Goal of this script is to permit secure and reliable communication beetween MQTT-SN Broker (Mosquitto.rsmb) and AWS IoT Core Service.
MQTT-SN can't communicate directly with the MQTT gateway for AWS services, so a middle gateway, that collects all the messages published on the SN Broker topic, is needed.

This transparent bridge (this is its name) forward all messages received to the same topic to the MQTT broker configured in the cloud backend application.
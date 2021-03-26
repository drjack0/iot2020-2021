APPLICATION = sekkyone

BOARD ?= native

DEVELHELP ?= 1

RIOTBASE ?= $(CURDIR)/../RIOT

USEMODULE += xtimer
USEMODULE += analog_util
USEMODULE += dht
USEMODULE += fmt
USEMODULE += srf04

USEMODULE += hd44780

#Modules for Ethos - Ethernet Board Connection
UPLINK ?= ethos
USEMODULE += stdio_ethos gnrc_uhcpc
USEMODULE += gnrc_netdev_default auto_init_gnrc_netif
USEMODULE += gnrc_ipv6_default
USEMODULE += gnrc_netif_single

ETHOS_BAUDRATE ?= 115200
TAP ?= tap0
USE_DHCPV6 ?= 0
IPV6_PREFIX ?= fe80:2::/64

include $(CURDIR)/Makefile.ethos.conf

#MQTT Modules
USEMODULE += emcute
SERVER_ADDR = fe80::1
SERVER_PORT = 1885
MQTT_TOPIC_OUT = sekkyone_out
MQTT_TOPIC_IN = sekkyone_in

ifneq (,$(EMCUTE_ID))
  CFLAGS += -DEMCUTE_ID=\"$(EMCUTE_ID)\"
endif

#Some flags
CFLAGS += -DSERVER_ADDR='"$(SERVER_ADDR)"'
CFLAGS += -DSERVER_PORT=$(SERVER_PORT)
CFLAGS += -DMQTT_TOPIC_OUT='"$(MQTT_TOPIC_OUT)"'
CFLAGS += -DMQTT_TOPIC_IN='"$(MQTT_TOPIC_IN)"'

#Some features needed for Analog input and RTC (Time)
FEATURES_REQUIRED += periph_adc
FEATURES_REQUIRED += periph_rtc

include $(RIOTBASE)/Makefile.include


#IDK
.PHONY: host-tools

host-tools:
	$(Q)env -u CC -u CFLAGS $(MAKE) -C $(RIOTTOOLS)
